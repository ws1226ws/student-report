/* === Supabase client + DB adapter ===
   - สร้าง client จาก window.SB_URL / window.SB_ANON_KEY (โหลดจาก config.js ก่อนหน้า)
   - hydrate(): ดึงข้อมูลทั้งหมดมาเป็น state ก้อนแรก
   - dispatchDb(state, action): ทำ Supabase mutation แล้ว return action ที่ควรส่งเข้า reducer
     ใช้แทน dispatch เดิม — pages เรียก dispatch(action) เหมือนเดิม ไม่ต้องแก้
*/
(() => {
  if (!window.supabase || !window.supabase.createClient) {
    console.error('Supabase JS ยังไม่โหลด — เช็คว่า index.html มี <script> ของ @supabase/supabase-js ก่อน config.js');
    return;
  }
  if (!window.SB_URL || window.SB_URL.includes('YOUR-')) {
    console.warn('SB_URL ยังเป็น placeholder — ใส่ค่าจริงใน src/config.js');
  }
  window.sb = window.supabase.createClient(window.SB_URL, window.SB_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage },
  });
})();

/* === Map DB row ↔ camelCase ที่ pages เดิมใช้ === */
function studentFromRow(r){
  return {
    id: r.id,
    no: r.no,
    firstName: r.first_name,
    lastName: r.last_name,
    nickname: r.nickname,
    grade: r.grade,
    gender: r.gender,
    birthDate: r.birth_date,
    age: r.age,
    weight: r.weight_kg != null ? Number(r.weight_kg) : null,
    height: r.height_cm != null ? Number(r.height_cm) : null,
    conditions: r.conditions || '—',
    specialNeeds: r.special_needs || '—',
    avatarColor: r.avatar_color || '#FF8A5C',
    photoUrl: r.photo_url,
    parents: r.parents || [],
  };
}
function studentToRow(s){
  return {
    no: s.no, first_name: s.firstName, last_name: s.lastName, nickname: s.nickname,
    grade: s.grade, gender: s.gender, birth_date: s.birthDate || null, age: s.age,
    weight_kg: s.weight, height_cm: s.height,
    conditions: s.conditions === '—' ? null : s.conditions,
    special_needs: s.specialNeeds === '—' ? null : s.specialNeeds,
    avatar_color: s.avatarColor, photo_url: s.photoUrl,
    parents: s.parents || [],
  };
}
function logFromRow(r, userMap){
  return {
    id: r.id,
    studentId: r.student_id,
    categoryId: r.category_id,
    description: r.description,
    peer: r.peer || '',
    strengths: r.strengths || [],
    date: r.log_date,
    tone: r.tone,
    term: r.term, year: r.year,
    createdBy: (userMap && r.created_by && userMap[r.created_by]) || 'ครูประจำชั้น',
    createdById: r.created_by,
  };
}
function logToRow(l){
  return {
    student_id: l.studentId, category_id: l.categoryId, description: l.description,
    peer: l.peer || null, tone: l.tone || 'positive',
    log_date: l.date || new Date().toISOString().slice(0,10),
    term: l.term, year: l.year,
    strengths: l.strengths || [],
  };
}
function strengthFromRow(r){
  return { id:r.id, th:r.th, en:r.en, emoji:r.emoji, image:r.image_url, color:r.color, group:r.group };
}
function strengthToRow(s){
  return { id:s.id, th:s.th, en:s.en, emoji:s.emoji, image_url:s.image||null, color:s.color, group:s.group };
}
function groupFromRow(r){ return { name:r.name, color:r.color, emoji:r.emoji }; }
function groupToRow(g){ return { name:g.name, color:g.color, emoji:g.emoji }; }
function catFromRow(r){ return { id:r.id, name:r.name, emoji:r.emoji, color:r.color, tone:r.tone }; }
function catToRow(c){ return { id:c.id, name:c.name, emoji:c.emoji, color:c.color, tone:c.tone }; }
function teacherFromProfile(p){
  return { id:p.username, name:p.full_name, role:p.role, avatar:p.avatar, userId:p.user_id };
}

/* === Hydrate ทุก table === */
async function hydrateFromDb(){
  const sb = window.sb;
  const [
    studentsR, logsR, strengthsR, groupsR, catsR, teachersR, settingsR, profilesR
  ] = await Promise.all([
    sb.from('students').select('*').order('no'),
    sb.from('behavior_logs').select('*').order('log_date', { ascending:false }),
    sb.from('character_strengths').select('*').order('sort'),
    sb.from('strength_groups').select('*').order('sort'),
    sb.from('behavior_categories').select('*').order('sort'),
    sb.from('profiles').select('*').eq('role','teacher').order('username'),
    sb.from('app_settings').select('*').eq('id',1).single(),
    sb.from('profiles').select('user_id, username, full_name'),
  ]);
  const errs = [studentsR, logsR, strengthsR, groupsR, catsR, teachersR, settingsR, profilesR]
    .filter(r => r.error).map(r => r.error.message);
  if(errs.length) throw new Error('Supabase hydrate failed: ' + errs.join(' | '));

  const userMap = {};
  (profilesR.data || []).forEach(p => { userMap[p.user_id] = p.full_name || p.username; });

  return {
    students: (studentsR.data || []).map(studentFromRow),
    logs: (logsR.data || []).map(r => logFromRow(r, userMap)),
    characterStrengths: (strengthsR.data || []).map(strengthFromRow),
    strengthGroups: (groupsR.data || []).map(groupFromRow),
    behaviorCategories: (catsR.data || []).map(catFromRow),
    teachers: (teachersR.data || []).map(teacherFromProfile),
    currentTerm: settingsR.data?.current_term ?? 1,
    currentYear: settingsR.data?.current_year ?? 2568,
  };
}

/* === Write-through dispatcher ===
   ทำ DB mutation ก่อน → ถ้าสำเร็จ ค่อยส่ง action เข้า reducer
   ส่งค่า return เป็น action ใหม่ที่อาจมี id/timestamp ที่ DB generate ให้
*/
async function dbMutate(state, action){
  const sb = window.sb;
  switch(action.type){
    case 'student-add': {
      const { data, error } = await sb.from('students').insert(studentToRow(action.student)).select().single();
      if(error) throw error;
      return { ...action, student: studentFromRow(data) };
    }
    case 'student-update': {
      const { error } = await sb.from('students').update(studentToRow({ ...state.students.find(s=>s.id===action.id), ...action.patch })).eq('id', action.id);
      if(error) throw error;
      return action;
    }
    case 'student-remove': {
      const { error } = await sb.from('students').delete().eq('id', action.id);
      if(error) throw error;
      return action;
    }

    case 'log-add': {
      const row = logToRow(action.log);
      row.created_by = (await sb.auth.getUser()).data.user?.id || null;
      const { data, error } = await sb.from('behavior_logs').insert(row).select().single();
      if(error) throw error;
      return { ...action, log: logFromRow(data, {}) };
    }
    case 'log-update': {
      const existing = state.logs.find(l=>l.id===action.id);
      const merged = { ...existing, ...action.patch };
      const { error } = await sb.from('behavior_logs').update(logToRow(merged)).eq('id', action.id);
      if(error) throw error;
      return action;
    }
    case 'log-remove': {
      const { error } = await sb.from('behavior_logs').delete().eq('id', action.id);
      if(error) throw error;
      return action;
    }

    case 'cat-add':    { const { error } = await sb.from('behavior_categories').insert(catToRow(action.cat));   if(error) throw error; return action; }
    case 'cat-update': { const existing = state.behaviorCategories.find(c=>c.id===action.id); const { error } = await sb.from('behavior_categories').update(catToRow({...existing,...action.patch})).eq('id', action.id); if(error) throw error; return action; }
    case 'cat-remove': { const { error } = await sb.from('behavior_categories').delete().eq('id', action.id); if(error) throw error; return action; }

    case 'strength-add':    { const { error } = await sb.from('character_strengths').insert(strengthToRow(action.strength)); if(error) throw error; return action; }
    case 'strength-update': { const existing = state.characterStrengths.find(s=>s.id===action.id); const { error } = await sb.from('character_strengths').update(strengthToRow({...existing,...action.patch})).eq('id', action.id); if(error) throw error; return action; }
    case 'strength-remove': { const { error } = await sb.from('character_strengths').delete().eq('id', action.id); if(error) throw error; return action; }

    case 'group-add':    { const { error } = await sb.from('strength_groups').insert(groupToRow(action.group)); if(error) throw error; return action; }
    case 'group-update': { const existing = state.strengthGroups.find(g=>g.name===action.name); const { error } = await sb.from('strength_groups').update(groupToRow({...existing,...action.patch})).eq('name', action.name); if(error) throw error; return action; }
    case 'group-remove': { const { error } = await sb.from('strength_groups').delete().eq('name', action.name); if(error) throw error; return action; }

    case 'teacher-add': {
      throw new Error('ต้องสร้างบัญชีครูจาก Supabase Authentication → Add user → แล้วเพิ่ม profiles row (ดู README)');
    }
    case 'teacher-update': {
      const t = action.patch || {};
      const { error } = await sb.from('profiles').update({
        full_name: t.name, avatar: t.avatar,
      }).eq('username', action.id);
      if(error) throw error;
      return action;
    }
    case 'teacher-remove': {
      throw new Error('การลบบัญชีครู ต้องลบจาก Supabase Authentication ก่อน (จะ cascade ลบ profile ให้)');
    }

    case 'set-term': {
      const { error } = await sb.from('app_settings').update({ current_term: action.term, current_year: action.year, updated_at: new Date().toISOString() }).eq('id', 1);
      if(error) throw error;
      return action;
    }

    // ไม่ต้องเขียน DB
    case 'login':
    case 'logout':
    case 'set-view-as':
    case 'hydrate':
      return action;

    default:
      console.warn('dbMutate: unsupported action', action.type);
      return action;
  }
}

Object.assign(window, { hydrateFromDb, dbMutate });
