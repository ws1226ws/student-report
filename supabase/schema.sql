-- =============================================================
-- Student Report (CMUDS-ITPC) — Supabase schema + seed
-- Run this in: Supabase Studio → SQL Editor → New query → Run
-- =============================================================

-- Extensions
create extension if not exists "pgcrypto";

-- =============================================================
-- 1) profiles  (linked to auth.users)
--    role = 'admin' | 'teacher'
-- =============================================================
create table if not exists public.profiles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  username   text unique not null,
  full_name  text,
  role       text not null check (role in ('admin','teacher')) default 'teacher',
  avatar     text,
  created_at timestamptz default now()
);

-- =============================================================
-- 2) app_settings  (singleton row)
-- =============================================================
create table if not exists public.app_settings (
  id           int primary key default 1,
  current_term int not null default 1,
  current_year int not null default 2568,
  updated_at   timestamptz default now(),
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- =============================================================
-- 3) strength_groups  (6 ด้านของ Character Strengths)
-- =============================================================
create table if not exists public.strength_groups (
  name     text primary key,
  color    text not null,
  emoji    text,
  sort     int default 0
);

-- =============================================================
-- 4) character_strengths  (24 จุดแข็ง — admin แก้ไขได้)
-- =============================================================
create table if not exists public.character_strengths (
  id        text primary key,
  th        text not null,
  en        text,
  emoji     text,
  image_url text,
  color     text,
  "group"   text references public.strength_groups(name) on update cascade,
  sort      int default 0
);

-- =============================================================
-- 5) behavior_categories
-- =============================================================
create table if not exists public.behavior_categories (
  id    text primary key,
  name  text not null,
  emoji text,
  color text,
  tone  text,
  sort  int default 0
);

-- =============================================================
-- 6) students
-- =============================================================
create table if not exists public.students (
  id             uuid primary key default gen_random_uuid(),
  no             int,
  first_name     text not null,
  last_name      text,
  nickname       text,
  grade          text,                          -- 'ป.3/1' .. 'ป.3/3'
  gender         text,                          -- 'ชาย' | 'หญิง'
  birth_date     date,
  age            int,
  weight_kg      numeric(5,2),
  height_cm      numeric(5,2),
  conditions     text,
  special_needs  text,
  avatar_color   text,
  photo_url      text,
  parents        jsonb default '[]'::jsonb,     -- [{label, phone}, ...]
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);
create index if not exists students_grade_idx on public.students(grade);

-- =============================================================
-- 7) behavior_logs
-- =============================================================
create table if not exists public.behavior_logs (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.students(id) on delete cascade,
  category_id text references public.behavior_categories(id),
  description text,
  peer        text,
  tone        text check (tone in ('positive','neutral','concern')) default 'positive',
  log_date    date not null default current_date,
  term        int not null,
  year        int not null,
  strengths   text[] default '{}',              -- array of character_strengths.id
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);
create index if not exists behavior_logs_student_idx on public.behavior_logs(student_id);
create index if not exists behavior_logs_term_year_idx on public.behavior_logs(term, year);

-- =============================================================
-- updated_at trigger for students
-- =============================================================
create or replace function public.touch_updated_at() returns trigger as $$
begin new.updated_at = now(); return new; end; $$ language plpgsql;
drop trigger if exists students_touch on public.students;
create trigger students_touch before update on public.students
  for each row execute function public.touch_updated_at();

-- =============================================================
-- Helper: is_admin(check_uid)
-- ใช้ $1 แทนชื่อพารามิเตอร์เพื่อเลี่ยงปัญหา name resolution ของ Postgres
-- =============================================================
create or replace function public.is_admin(check_uid uuid) returns boolean
  language sql stable as $$
    select exists (select 1 from public.profiles p where p.user_id = $1 and p.role = 'admin');
  $$;

-- =============================================================
-- RLS
-- ครู: อ่านได้ทุก table หลัก, เขียน behavior_logs ได้, แก้ไข students ได้
-- admin: ทำได้ทุกอย่าง รวมถึง config tables (strengths/groups/categories/settings/profiles)
-- =============================================================
alter table public.profiles            enable row level security;
alter table public.app_settings        enable row level security;
alter table public.strength_groups     enable row level security;
alter table public.character_strengths enable row level security;
alter table public.behavior_categories enable row level security;
alter table public.students            enable row level security;
alter table public.behavior_logs       enable row level security;

-- profiles: ตัวเองดูได้ admin ดูได้หมด, admin แก้ทุกคนได้, ครูแก้ตัวเองได้บางช่อง
drop policy if exists profiles_self_read   on public.profiles;
drop policy if exists profiles_admin_all   on public.profiles;
create policy profiles_self_read on public.profiles
  for select using ( auth.uid() = user_id or public.is_admin(auth.uid()) );
create policy profiles_admin_all on public.profiles
  for all using ( public.is_admin(auth.uid()) ) with check ( public.is_admin(auth.uid()) );

-- app_settings: ทุกคน login แล้วอ่านได้, admin แก้ได้
drop policy if exists settings_read       on public.app_settings;
drop policy if exists settings_admin_all  on public.app_settings;
create policy settings_read on public.app_settings
  for select using ( auth.uid() is not null );
create policy settings_admin_all on public.app_settings
  for all using ( public.is_admin(auth.uid()) ) with check ( public.is_admin(auth.uid()) );

-- config tables: read all (logged in), write admin
do $$ declare t text; begin
  for t in select unnest(array['strength_groups','character_strengths','behavior_categories']) loop
    execute format('drop policy if exists %I_read on public.%I', t, t);
    execute format('drop policy if exists %I_admin_all on public.%I', t, t);
    execute format('create policy %I_read on public.%I for select using (auth.uid() is not null)', t, t);
    execute format('create policy %I_admin_all on public.%I for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()))', t, t);
  end loop;
end $$;

-- students: ครูและ admin อ่าน/เขียน/ลบได้ทุกคน
drop policy if exists students_read   on public.students;
drop policy if exists students_write  on public.students;
create policy students_read on public.students
  for select using ( auth.uid() is not null );
create policy students_write on public.students
  for all using ( auth.uid() is not null ) with check ( auth.uid() is not null );

-- behavior_logs: ครูและ admin อ่านทุก log; ครูแก้/ลบเฉพาะของตัวเอง, admin แก้/ลบทุกอัน
drop policy if exists logs_read         on public.behavior_logs;
drop policy if exists logs_insert       on public.behavior_logs;
drop policy if exists logs_update_own   on public.behavior_logs;
drop policy if exists logs_delete_own   on public.behavior_logs;
drop policy if exists logs_admin_all    on public.behavior_logs;
create policy logs_read on public.behavior_logs
  for select using ( auth.uid() is not null );
create policy logs_insert on public.behavior_logs
  for insert with check ( auth.uid() is not null );
create policy logs_update_own on public.behavior_logs
  for update using ( created_by = auth.uid() ) with check ( created_by = auth.uid() );
create policy logs_delete_own on public.behavior_logs
  for delete using ( created_by = auth.uid() );
create policy logs_admin_all on public.behavior_logs
  for all using ( public.is_admin(auth.uid()) ) with check ( public.is_admin(auth.uid()) );

-- =============================================================
-- Seed: strength_groups, character_strengths, behavior_categories
-- =============================================================
insert into public.strength_groups(name,color,emoji,sort) values
  ('ปัญญา',          '#FF8A5C', '🧠', 1),
  ('ความกล้า',        '#FF6E8A', '🦁', 2),
  ('มนุษยธรรม',       '#E66BD6', '💖', 3),
  ('ความยุติธรรม',    '#7A5CFF', '⚖️', 4),
  ('ความพอประมาณ',   '#4FD1AB', '🌿', 5),
  ('การข้ามพ้นตัวตน', '#FFC23C', '✨', 6)
on conflict (name) do nothing;

insert into public.character_strengths(id,th,en,emoji,color,"group",sort) values
  ('creativity',    'ความคิดสร้างสรรค์',   'Creativity',                 '🎨','#FF8A5C','ปัญญา',1),
  ('curiosity',     'ความอยากรู้อยากเห็น',  'Curiosity',                  '🔍','#FF9D4D','ปัญญา',2),
  ('open_minded',   'การเปิดใจกว้าง',       'Open-mindedness',            '💡','#FFB347','ปัญญา',3),
  ('love_learning', 'รักการเรียนรู้',        'Love of Learning',           '📚','#FFC23C','ปัญญา',4),
  ('perspective',   'การมองโลกในมุมกว้าง', 'Perspective',                '🌟','#FFB36B','ปัญญา',5),
  ('bravery',       'ความกล้าหาญ',          'Bravery',                    '🦁','#FF6E8A','ความกล้า',6),
  ('perseverance',  'ความเพียร',            'Perseverance',               '🏃','#FF5C9E','ความกล้า',7),
  ('honesty',       'ความซื่อสัตย์',         'Honesty',                    '🤝','#FF7BA0','ความกล้า',8),
  ('zest',          'ความกระตือรือร้น',     'Zest',                       '⚡','#FF4D80','ความกล้า',9),
  ('love',          'ความรัก',               'Love',                       '💖','#E66BD6','มนุษยธรรม',10),
  ('kindness',      'ความเมตตา',             'Kindness',                   '🤗','#C26BD9','มนุษยธรรม',11),
  ('social_iq',     'สติปัญญาทางสังคม',     'Social Intelligence',        '💬','#9D7FFF','มนุษยธรรม',12),
  ('teamwork',      'การทำงานเป็นทีม',      'Teamwork',                   '👥','#7A5CFF','ความยุติธรรม',13),
  ('fairness',      'ความเป็นธรรม',         'Fairness',                   '⚖️','#5C7CFF','ความยุติธรรม',14),
  ('leadership',    'ความเป็นผู้นำ',         'Leadership',                 '🌠','#5CC9FF','ความยุติธรรม',15),
  ('forgiveness',   'การให้อภัย',             'Forgiveness',                '🕊️','#4FD1AB','ความพอประมาณ',16),
  ('humility',      'ความถ่อมตน',             'Humility',                   '🌱','#3FB489','ความพอประมาณ',17),
  ('prudence',      'ความรอบคอบ',             'Prudence',                   '🛡️','#5BB78A','ความพอประมาณ',18),
  ('self_reg',      'การควบคุมตนเอง',         'Self-Regulation',            '🧘','#7CC9A1','ความพอประมาณ',19),
  ('beauty',        'ชื่นชมความงาม',          'Appreciation of Beauty',     '🌸','#FFC23C','การข้ามพ้นตัวตน',20),
  ('gratitude',     'ความกตัญญู',             'Gratitude',                  '🙏','#FFA61F','การข้ามพ้นตัวตน',21),
  ('hope',          'ความหวัง',               'Hope',                       '🌈','#FFD96B','การข้ามพ้นตัวตน',22),
  ('humor',         'อารมณ์ขัน',              'Humor',                      '😄','#FFB347','การข้ามพ้นตัวตน',23),
  ('spirituality',  'ความศรัทธา',             'Spirituality',               '✨','#FF9F4D','การข้ามพ้นตัวตน',24)
on conflict (id) do nothing;

insert into public.behavior_categories(id,name,emoji,color,tone,sort) values
  ('play',    'การเล่น',         '🧸','#FF8A5C','sun',    1),
  ('speech',  'คำพูด',          '💬','#9D7FFF','violet', 2),
  ('study',   'การเรียน',        '📖','#5CC9FF','sky',    3),
  ('emotion', 'อารมณ์',         '😊','#FF6E8A','rose',   4),
  ('social',  'เพื่อน/สังคม',    '👫','#4FD1AB','mint',   5),
  ('help',    'ช่วยเหลือผู้อื่น', '🤝','#FFC23C','sun',    6),
  ('other',   'อื่น ๆ',          '⭐','#FF9F4D','sun',    7)
on conflict (id) do nothing;

-- =============================================================
-- DONE.  Next:
-- 1) สร้าง user ใน Authentication → Users → "Add user"
--    - admin@studentreport.local  / Ws122601
--    - t1@studentreport.local     / 123456
--    (เลือก Auto Confirm User ทั้งคู่)
-- 2) รัน SQL ด้านล่างเพื่อสร้าง profiles ของ 2 บัญชีนี้
--    (เปลี่ยน id ให้ตรงกับที่ Supabase สร้างให้)
-- =============================================================

-- เติม profiles หลังจากสร้าง user เสร็จ:
-- insert into public.profiles (user_id, username, full_name, role, avatar)
-- select id, 'admin', 'admin', 'admin', '#7A5CFF' from auth.users where email='admin@studentreport.local'
-- on conflict (user_id) do update set role='admin', username='admin';
--
-- insert into public.profiles (user_id, username, full_name, role, avatar)
-- select id, 't1', 'ครูประจำชั้น', 'teacher', '#FF6E8A' from auth.users where email='t1@studentreport.local'
-- on conflict (user_id) do update set role='teacher', username='t1';
