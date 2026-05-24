# Student Report · CMUDS-ITPC

ระบบบันทึกข้อมูลและพฤติกรรมนักเรียนชั้น ป.3 — เก็บข้อมูลใน **Supabase** (Postgres + Auth + RLS) และ deploy ไว้ที่ **Vercel** (static hosting) ฟรีทั้งคู่

## โครงสร้าง

```
.
├── index.html          # entry — static, deploy ตรงๆ ได้
├── src/
│   ├── config.js       # Supabase URL + anon key  ← แก้ไฟล์นี้ก่อน deploy
│   ├── db.jsx          # Supabase client + hydrate + write-through dispatcher
│   ├── data.jsx        # constants (BMI helper, default categories ฯลฯ)
│   ├── ui.jsx          # Icon/Modal/Toast/etc.
│   ├── app.jsx         # App shell + Login + reducer
│   └── page-*.jsx      # หน้าต่างๆ
├── assets/             # โลโก้
├── uploads/            # รูปอ้างอิงจาก mockup
└── supabase/
    └── schema.sql      # schema + RLS + seed (รันใน SQL Editor)
```

---

## ตั้งค่าครั้งแรก

### 1) สร้าง Supabase project
1. ไปที่ https://supabase.com → **New project**
2. เลือก Region: **Singapore (ap-southeast-1)** (ใกล้ไทยสุด)
3. ตั้ง Database password (เก็บไว้)
4. รอ project provisioning เสร็จ (~1-2 นาที)

### 2) รัน schema
1. เปิด **SQL Editor** → **New query**
2. คัดลอกทั้งหมดของ [`supabase/schema.sql`](supabase/schema.sql) ลงไป → **Run**
3. ควรเห็น "Success. No rows returned" — schema, RLS policies, seed strengths/groups/categories ติดตั้งแล้ว

### 3) สร้างบัญชี admin + ครู
1. เปิด **Authentication → Users → Add user → Create new user**
2. สร้างทีละบัญชี **เปิด "Auto Confirm User"**:

   | Email | Password | Role |
   |---|---|---|
   | `admin@studentreport.local` | `Ws122601` | admin |
   | `t1@studentreport.local`    | `123456`   | teacher |

3. กลับไป SQL Editor รัน:

   ```sql
   insert into public.profiles (user_id, username, full_name, role, avatar)
   select id, 'admin', 'admin', 'admin', '#7A5CFF'
   from auth.users where email='admin@studentreport.local'
   on conflict (user_id) do update set role='admin', username='admin';

   insert into public.profiles (user_id, username, full_name, role, avatar)
   select id, 't1', 'ครูประจำชั้น', 'teacher', '#FF6E8A'
   from auth.users where email='t1@studentreport.local'
   on conflict (user_id) do update set role='teacher', username='t1';
   ```

### 4) ใส่ Supabase URL + anon key
1. **Project Settings → API**
2. คัดลอก **Project URL** และ **anon/public key**
3. แก้ [`src/config.js`](src/config.js):

   ```js
   window.SB_URL = 'https://xxxxxxxx.supabase.co';
   window.SB_ANON_KEY = 'eyJhbGciOi...';
   ```

### 5) ทดสอบ local
```bash
python3 -m http.server 8000
# เปิด http://localhost:8000 → login ด้วย admin / Ws122601
```

---

## Deploy ขึ้น Vercel

### ทางที่ 1 — ผ่าน GitHub (แนะนำ)
1. push repo ขึ้น GitHub:
   ```bash
   git remote add origin https://github.com/<you>/student-report.git
   git push -u origin main
   ```
2. ไปที่ https://vercel.com/new → **Import Git Repository** → เลือก repo
3. Framework Preset: **Other** (เพราะเป็น static HTML)
4. Build Command: เว้นว่าง
5. Output Directory: เว้นว่าง (root)
6. **Deploy**

Vercel จะให้ URL เช่น `student-report-abc.vercel.app` ทุกครั้งที่ push ใหม่จะ deploy อัตโนมัติ

### ทางที่ 2 — ผ่าน Vercel CLI
```bash
npm i -g vercel
vercel        # ตอบ Y/Y/Y/Other/.
vercel --prod
```

---

## วิธีเพิ่มครูใหม่ (หลังจาก deploy)

จากเหตุผลความปลอดภัย — anon key ไม่มีสิทธิ์สร้าง user — ต้องทำ 2 ขั้นตอน:

1. Supabase Dashboard → **Authentication → Users → Add user**
   - Email: `<username>@studentreport.local` (เช่น `t2@studentreport.local`)
   - Password: ตามต้องการ
   - เปิด **Auto Confirm**
2. SQL Editor:
   ```sql
   insert into public.profiles (user_id, username, full_name, role, avatar)
   select id, 't2', 'ครู XX', 'teacher', '#4FD1AB'
   from auth.users where email='t2@studentreport.local';
   ```
3. ครูใหม่ login ด้วย username `t2` ได้ทันที

> ในแอป (Admin → บัญชีครู) แก้ได้แค่ชื่อแสดงและสีประจำตัว — Username/Password เปลี่ยนที่ Supabase Dashboard

---

## ความปลอดภัย

- **anon key** ปลอดภัยที่จะอยู่ใน browser bundle — RLS policies ปกป้องข้อมูล (ดู `supabase/schema.sql`)
- **service_role key** ห้ามใส่ในโค้ดฝั่ง client โดยเด็ดขาด
- ครูแก้/ลบ behavior_logs ได้เฉพาะที่ตัวเองสร้าง · admin ทำได้ทุกอย่าง
- ก่อน deploy production จริง: เปลี่ยน password ของ admin/t1 ทันที

---

## ค่าใช้จ่าย (free tier)

| บริการ | สิ่งที่ได้ฟรี | พอสำหรับเคสนี้? |
|---|---|---|
| Supabase Free | 500MB DB · 50K MAU · 1GB Storage | ✅ พอเหลือเฟือ (24 นักเรียน · log < 10K rows/ปี) |
| Vercel Hobby  | 100GB bandwidth · unlimited deploys | ✅ พอสบาย |

หมายเหตุ: Supabase free จะ **pause project** ถ้าไม่ใช้ 7 วันติด — แค่กดปุ่ม resume ใน dashboard ก็กลับมาทำงาน

---

## Troubleshooting

| อาการ | สาเหตุ | แก้ไข |
|---|---|---|
| Login ไม่ได้, "Invalid credentials" | Password ไม่ตรง หรือ user ยังไม่ confirm | เปิด Supabase → Authentication → user → Confirm |
| Login ได้แต่ "ยังไม่มี profile" | ลืมรัน insert profiles | กลับไปขั้นตอน 3 |
| โหลดข้อมูลไม่ขึ้น (RLS error) | ลืมรัน schema.sql ทั้งไฟล์ | รันใหม่ทั้งไฟล์ |
| Console: "SB_URL ยังเป็น placeholder" | ยังไม่แก้ config.js | ขั้นตอน 4 |
