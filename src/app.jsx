/* === App shell === */
const { useReducer, useEffect, useCallback, useRef } = React;

/* แปลง username → email ภายในสำหรับ Supabase Auth (ผู้ใช้พิมพ์แค่ username) */
const EMAIL_DOMAIN = '@studentreport.local';
const usernameToEmail = (u) => (u || '').includes('@') ? u : (u + EMAIL_DOMAIN);

function reducer(state, action){
  switch(action.type){
    case 'hydrate':
      return { ...state, ...action.data, hydrated:true };

    case 'student-add':
      return {...state, students:[...state.students, action.student]};
    case 'student-update':
      return {...state, students: state.students.map(s => s.id===action.id ? {...s, ...action.patch} : s)};
    case 'student-remove':
      return {...state,
        students: state.students.filter(s=>s.id!==action.id),
        logs: state.logs.filter(l=>l.studentId!==action.id),
      };
    case 'log-add':
      return {...state, logs:[action.log, ...state.logs]};
    case 'log-update':
      return {...state, logs: state.logs.map(l => l.id===action.id ? {...l, ...action.patch} : l)};
    case 'log-remove':
      return {...state, logs: state.logs.filter(l=>l.id!==action.id)};

    case 'cat-add':
      return {...state, behaviorCategories:[...state.behaviorCategories, action.cat]};
    case 'cat-update':
      return {...state, behaviorCategories: state.behaviorCategories.map(c=>c.id===action.id?{...c, ...action.patch}:c)};
    case 'cat-remove':
      return {...state, behaviorCategories: state.behaviorCategories.filter(c=>c.id!==action.id)};

    case 'strength-add':
      return {...state, characterStrengths:[...state.characterStrengths, action.strength], version: state.version+1};
    case 'strength-update':
      return {...state, characterStrengths: state.characterStrengths.map(s=>s.id===action.id?{...s, ...action.patch}:s), version: state.version+1};
    case 'strength-remove':
      return {...state, characterStrengths: state.characterStrengths.filter(s=>s.id!==action.id), version: state.version+1};

    case 'group-add':
      return {...state, strengthGroups:[...state.strengthGroups, action.group], version: state.version+1};
    case 'group-update':
      return {...state, strengthGroups: state.strengthGroups.map(g=>g.name===action.name?{...g, ...action.patch}:g), version: state.version+1};
    case 'group-remove':
      return {...state, strengthGroups: state.strengthGroups.filter(g=>g.name!==action.name), version: state.version+1};

    case 'teacher-add':
      return {...state, teachers:[...state.teachers, action.teacher]};
    case 'teacher-update':
      return {...state, teachers: state.teachers.map(t=>t.id===action.id?{...t, ...action.patch}:t)};
    case 'teacher-remove':
      return {...state, teachers: state.teachers.filter(t=>t.id!==action.id)};
    case 'teacher-set-password':
    case 'self-set-password':
      return state; // ไม่มี state ต้องเปลี่ยน — password ไม่เก็บใน client
    case 'teacher-set-username':
      return {...state, teachers: state.teachers.map(t => t.id===action.id ? {...t, id:action.newId} : t)};
    case 'self-update-profile': {
      const name   = action.name   ?? state.user.name;
      const avatar = action.avatar ?? state.user.avatar;
      return {
        ...state,
        user:     {...state.user, name, avatar},
        teachers: state.teachers.map(t => t.id===state.user.id ? {...t, name, avatar} : t),
      };
    }
    case 'self-update-photo': {
      const photoUrl = action.photoUrl || null;
      console.info('[reducer] self-update-photo →', photoUrl, 'state.user.id=', state.user?.id);
      return {
        ...state,
        user:     {...state.user, photoUrl},
        teachers: state.teachers.map(t => t.id===state.user.id ? {...t, photoUrl} : t),
      };
    }
    case 'self-remove-photo':
      return {
        ...state,
        user:     {...state.user, photoUrl: null},
        teachers: state.teachers.map(t => t.id===state.user.id ? {...t, photoUrl: null} : t),
      };

    case 'set-term':
      return {...state, currentTerm: action.term, currentYear: action.year};

    case 'login':
      return {...state, user: action.user, viewAs: action.user.role};
    case 'logout':
      return {...state, user:null, viewAs:'teacher', hydrated:false,
        students:[], logs:[], behaviorCategories:[], characterStrengths:[], strengthGroups:[], teachers:[],
      };
    case 'set-view-as':
      return {...state, viewAs: action.viewAs};

    default: return state;
  }
}

function initialState(){
  return {
    user: null,
    viewAs: 'teacher',
    hydrated: false,
    students: [],
    logs: [],
    behaviorCategories: [],
    characterStrengths: [],
    strengthGroups: [],
    teachers: [],
    currentTerm: DEFAULT_TERM,
    currentYear: DEFAULT_YEAR,
    version: 0,
  };
}

function syncGlobals(state){
  window.CHARACTER_STRENGTHS = state.characterStrengths;
  window.STRENGTH_GROUPS = state.strengthGroups;
}

function App(){
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const [route, setRoute] = useState('dashboard');
  const [bootError, setBootError] = useState('');
  const [profileOpen, setProfileOpen] = useState(false);
  const toast = useToast();
  const stateRef = useRef(state);
  stateRef.current = state;

  syncGlobals(state);

  /* === restore session on mount === */
  useEffect(() => {
    if(!window.sb) return;
    (async () => {
      const { data: { session } } = await window.sb.auth.getSession();
      if(session){
        await loginWithSession(session);
      }
    })();
    const { data: sub } = window.sb.auth.onAuthStateChange(async (_evt, session) => {
      if(!session && stateRef.current.user) dispatch({type:'logout'});
    });
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  /* === Hydrate from DB after login === */
  useEffect(() => {
    if(!state.user || state.hydrated) return;
    (async () => {
      try {
        const data = await hydrateFromDb();
        dispatch({type:'hydrate', data});
      } catch(e) {
        console.error(e);
        toast.show('โหลดข้อมูลจากฐานข้อมูลไม่สำเร็จ — ตรวจ Supabase config / RLS', 'error');
      }
    })();
  }, [state.user]);

  /* === Wrap dispatch to write through to Supabase === */
  const dispatchDb = useCallback(async (action) => {
    // local-only actions
    if(['hydrate','login','logout','set-view-as'].includes(action.type)){
      dispatch(action); return;
    }
    try {
      const out = await dbMutate(stateRef.current, action);
      dispatch(out);
    } catch(e) {
      console.error('dbMutate error', action.type, e);
      toast.show(`บันทึกไม่สำเร็จ: ${e.message || e}`, 'error');
      throw e;
    }
  }, []);

  /* === Login helpers === */
  async function loginWithSession(session){
    const uid = session.user.id;
    const { data: profile, error } = await window.sb.from('profiles').select('*').eq('user_id', uid).single();
    if(error || !profile){
      await window.sb.auth.signOut();
      setBootError('ยังไม่มี profile สำหรับบัญชีนี้ — กรุณาให้ admin เพิ่มใน Supabase');
      return;
    }
    dispatch({type:'login', user:{
      userId: uid,
      id: profile.username,
      name: profile.full_name || profile.username,
      role: profile.role,
      avatar: profile.avatar || '#FF6E8A',
      photoUrl: profile.photo_url || null,
    }});
  }

  const go = (r)=>setRoute(r);

  if(!state.user){
    return <LoginScreen onLogin={loginWithSession} bootError={bootError} clearBootError={()=>setBootError('')}/>;
  }

  if(!state.hydrated){
    return <FullScreenLoader/>;
  }

  const role = state.viewAs;

  // Parse route
  let page = null;
  let pageTitle = '', crumb = '';

  if(route==='dashboard'){
    pageTitle='หน้าหลัก'; crumb='ภาพรวม';
    page = <PageDashboard state={state} dispatch={dispatchDb} go={go}/>;
  } else if(route==='students'){
    pageTitle='นักเรียน'; crumb='จัดการนักเรียน';
    page = <PageStudents state={state} dispatch={dispatchDb} go={go}/>;
  } else if(route.startsWith('student:')){
    const id = route.slice('student:'.length);
    pageTitle='ข้อมูลนักเรียน'; crumb='นักเรียน › รายบุคคล';
    page = <PageStudentDetail state={state} dispatch={dispatchDb} go={go} studentId={id}/>;
  } else if(route==='behaviors' || route.startsWith('behaviors:new')){
    pageTitle='บันทึกพฤติกรรม'; crumb='พฤติกรรม';
    let openForm = route.startsWith('behaviors:new');
    let preStu = null;
    if(route.startsWith('behaviors:new:')) preStu = route.slice('behaviors:new:'.length);
    page = <PageBehaviors state={state} dispatch={dispatchDb} go={go} openForm={openForm} preselectStudentId={preStu}/>;
  } else if(route==='strengths'){
    pageTitle='24 Character Strengths'; crumb='Character Strengths';
    page = <PageStrengths state={state} go={go}/>;
  } else if(route==='health'){
    pageTitle='สุขภาพ'; crumb='ข้อมูลสุขภาพ';
    page = <PageHealth state={state}/>;
  } else if(route==='analytics'){
    pageTitle='สรุปผล'; crumb='สรุปผลพฤติกรรม';
    page = <PageAnalytics state={state} go={go}/>;
  } else if(route==='admin' && role==='admin'){
    pageTitle='ตั้งค่าระบบ'; crumb='Admin';
    page = <PageAdmin state={state} dispatch={dispatchDb} go={go}/>;
  } else if(route==='admin' && role!=='admin'){
    pageTitle='ไม่อนุญาต'; crumb='Admin';
    page = <div className="card"><Empty title="โหมดนี้ใช้ได้เฉพาะ Admin" sub="กรุณาเข้าสู่ระบบด้วยบัญชี admin" icon="lock"/></div>;
  }

  const navItems = [
    {id:'dashboard',   label:'หน้าหลัก',          icon:'home'},
    {id:'students',    label:'นักเรียน',           icon:'users'},
    {id:'behaviors',   label:'บันทึกพฤติกรรม',     icon:'bolt'},
    {id:'strengths',   label:'24 Character Strengths', icon:'star'},
    {id:'health',      label:'สุขภาพ',             icon:'health'},
    {id:'analytics',   label:'สรุปผล',             icon:'chart'},
  ];

  const isActive = (id) => {
    if(id==='students') return route==='students' || route.startsWith('student:');
    if(id==='behaviors') return route==='behaviors' || route.startsWith('behaviors');
    return route===id;
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <img src="assets/logo-circle.png" alt="CMUDS-ITPC" style={{width:48,height:48,borderRadius:'50%',boxShadow:'var(--shadow-md)',flexShrink:0}}/>
          <div>
            <div className="brand-name" style={{fontSize:18}}>Student Report</div>
            <div className="brand-sub">ป.3 · CMUDS-ITPC</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(n => (
            <div key={n.id} className={'nav-item' + (isActive(n.id)?' active':'')} onClick={()=>go(n.id)}>
              <div className="ic"><Icon name={n.icon} size={16}/></div>
              {n.label}
            </div>
          ))}

          {role==='admin' && <>
            <div className="nav-section">ผู้ดูแลระบบ</div>
            <div className={'nav-item' + (route==='admin'?' active':'')} onClick={()=>go('admin')}>
              <div className="ic" style={{background:'var(--grad-violet)',color:'#fff'}}><Icon name="shield" size={16}/></div>
              ตั้งค่าระบบ
            </div>
          </>}
        </nav>

        <div style={{marginTop:'auto', padding:14, background:'#fff', borderRadius:18, boxShadow:'var(--shadow-sm)'}}>
          <div className="row" style={{justifyContent:'space-between'}}>
            <div className="row">
              <AvatarBubble
                photoUrl={state.user.photoUrl}
                color={state.user.avatar || (role==='admin' ? '#7A5CFF' : '#FFB36B')}
                initial={role==='admin' ? '👑' : '🍎'}
                size={40}
                radius={14}
              />
              <div>
                <div style={{fontWeight:600,fontSize:13}}>
                  {role==='admin' ? 'admin' : (state.user.name || state.user.id || 'ครูประจำชั้น')}
                </div>
                <div className="muted" style={{fontSize:11}}>
                  {role==='admin' ? 'โหมดผู้ดูแลระบบ' : `เทอม ${state.currentTerm}/${state.currentYear}`}
                </div>
              </div>
            </div>
            <div className="row" style={{gap:6}}>
              <button className="icon-btn" style={{width:32,height:32,fontSize:14}}
                onClick={()=>setProfileOpen(true)} title="โปรไฟล์ของฉัน">
                <Icon name="user" size={14}/>
              </button>
              <button className="icon-btn" style={{width:32,height:32,fontSize:14}} onClick={async ()=>{
                if(confirm('ออกจากระบบ?')){
                  await window.sb.auth.signOut();
                  dispatch({type:'logout'});
                }
              }} title="ออกจากระบบ">
                <Icon name="lock" size={14}/>
              </button>
            </div>
          </div>

          {state.user.role==='admin' && (
            <div className="seg" style={{marginTop:10, width:'100%'}}>
              <button className={role==='admin'?'on':''} style={{flex:1}} onClick={()=>dispatch({type:'set-view-as', viewAs:'admin'})}>
                👑 Admin
              </button>
              <button className={role==='teacher'?'on':''} style={{flex:1}} onClick={()=>dispatch({type:'set-view-as', viewAs:'teacher'})}>
                🍎 ครู
              </button>
            </div>
          )}
        </div>
      </aside>

      <main>
        <div className="topbar">
          <div>
            <div className="crumb">Student Report › <b>{crumb}</b></div>
            <div className="page-title">{pageTitle}</div>
          </div>
          <div className="top-actions">
            <span className="pill violet" style={{padding:'8px 14px', fontWeight:600}}>
              📅 เทอม {state.currentTerm}/{state.currentYear}
            </span>
          </div>
        </div>

        <div className="main">{page}</div>
      </main>

      <SelfProfileModal open={profileOpen} onClose={()=>setProfileOpen(false)} user={state.user} dispatch={dispatchDb}/>

      {toast.node}
    </div>
  );
}

/* === Self Profile Modal: เปลี่ยนชื่อ/สี/รหัสผ่านของตัวเอง === */
function SelfProfileModal({open, onClose, user, dispatch}){
  const colors = ['#FF6E8A','#FF8A5C','#9D7FFF','#5CC9FF','#4FD1AB','#FFC23C','#E66BD6','#7A5CFF'];
  const [name, setName]     = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '#FF6E8A');
  const [pwd, setPwd]       = useState('');
  const [pwd2, setPwd2]     = useState('');
  const [busy, setBusy]     = useState(false);

  useEffect(()=>{
    if(open && user){
      setName(user.name || '');
      setAvatar(user.avatar || '#FF6E8A');
      setPwd(''); setPwd2('');
    }
  }, [open, user]);

  if(!user) return null;
  const isAdmin = user.role === 'admin';

  const saveProfile = async ()=>{
    if(!name.trim()){ alert('กรุณากรอกชื่อแสดง'); return; }
    try {
      setBusy(true);
      await dispatch({type:'self-update-profile', name:name.trim(), avatar});
      alert('บันทึกโปรไฟล์เรียบร้อย');
    } catch(e){} finally { setBusy(false); }
  };

  const uploadPhoto = async (blob)=>{
    try {
      setBusy(true);
      await dispatch({type:'self-update-photo', blob});
      alert('อัปโหลดรูปโปรไฟล์เรียบร้อย');
    } catch(e){
      console.error('[upload] error', e);
      alert('อัปโหลดรูปไม่สำเร็จ\n\n' + (e?.message || e) + '\n\nดูรายละเอียดเพิ่มเติมที่ DevTools → Console');
    } finally { setBusy(false); }
  };
  const removePhoto = async ()=>{
    try {
      setBusy(true);
      await dispatch({type:'self-remove-photo'});
    } catch(e){
      alert('ลบรูปไม่สำเร็จ: ' + (e?.message || e));
    } finally { setBusy(false); }
  };

  const savePassword = async ()=>{
    if(!pwd || pwd.length<6){ alert('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'); return; }
    if(pwd !== pwd2){ alert('รหัสผ่านยืนยันไม่ตรงกัน'); return; }
    try {
      setBusy(true);
      await dispatch({type:'self-set-password', password:pwd});
      setPwd(''); setPwd2('');
      alert('เปลี่ยนรหัสผ่านเรียบร้อย — ครั้งถัดไปต้องใช้รหัสใหม่');
    } catch(e){} finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title="โปรไฟล์ของฉัน" subtitle={`${user.id} · ${isAdmin?'ผู้ดูแลระบบ (admin)':'ครู'}`}>
      <div className="stack-lg" style={{marginTop:12}}>
        {/* Photo */}
        <div className="card" style={{padding:18, boxShadow:'none', background:'#FFF7EF'}}>
          <div className="row" style={{gap:10, marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:10,background:'var(--grad-sky)',display:'grid',placeItems:'center',color:'#fff'}}>
              <Icon name="image" size={14}/>
            </div>
            <div style={{fontWeight:600}}>รูปโปรไฟล์</div>
          </div>
          <AvatarEditor
            initialPhotoUrl={user.photoUrl}
            onUpload={uploadPhoto}
            onRemove={removePhoto}
            busy={busy}
          />
        </div>

        {/* Name + color */}
        <div className="card" style={{padding:18, boxShadow:'none', background:'#FFF7EF'}}>
          <div className="row" style={{gap:10, marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:10,background:'var(--grad-primary)',display:'grid',placeItems:'center',color:'#fff'}}>
              <Icon name="user" size={14}/>
            </div>
            <div style={{fontWeight:600}}>ชื่อแสดง · สีประจำตัว</div>
          </div>
          <div className="field">
            <label>ชื่อแสดง</label>
            <input value={name} onChange={e=>setName(e.target.value)} placeholder="เช่น ครูสมศรี ใจดี"/>
          </div>
          <div className="field" style={{marginTop:14}}>
            <label>สีประจำตัว (ใช้เมื่อไม่มีรูป)</label>
            <div className="row" style={{flexWrap:'wrap'}}>
              {colors.map(c => (
                <button key={c} onClick={()=>setAvatar(c)} style={{
                  width:34,height:34,borderRadius:'50%',
                  border: avatar===c?'3px solid var(--ink)':'2px solid #fff',
                  background:c, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                }}/>
              ))}
            </div>
          </div>
          <div className="row" style={{justifyContent:'flex-end',marginTop:14}}>
            <button className="btn btn-primary" disabled={busy} onClick={saveProfile}>
              <Icon name="save" size={14}/> บันทึกชื่อ/สี
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="card" style={{padding:18, boxShadow:'none', background:'#EDE3FF'}}>
          <div className="row" style={{gap:10, marginBottom:12}}>
            <div style={{width:32,height:32,borderRadius:10,background:'var(--grad-violet)',display:'grid',placeItems:'center',color:'#fff'}}>
              <Icon name="lock" size={14}/>
            </div>
            <div style={{fontWeight:600}}>เปลี่ยนรหัสผ่าน</div>
          </div>
          <PasswordField label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)" value={pwd}  onChange={setPwd}/>
          <div style={{height:12}}/>
          <PasswordField label="ยืนยันรหัสผ่านใหม่" value={pwd2} onChange={setPwd2}/>
          <div className="row" style={{justifyContent:'flex-end',marginTop:14}}>
            <button className="btn btn-violet" disabled={busy} onClick={savePassword}>
              <Icon name="save" size={14}/> เปลี่ยนรหัสผ่าน
            </button>
          </div>
        </div>

        <div className="row" style={{justifyContent:'flex-end'}}>
          <button className="btn btn-ghost" onClick={onClose}>ปิด</button>
        </div>
      </div>
    </Modal>
  );
}

function FullScreenLoader(){
  return (
    <div style={{minHeight:'100vh', display:'grid', placeItems:'center'}}>
      <div className="card" style={{padding:36, textAlign:'center'}}>
        <div style={{fontSize:42}}>⏳</div>
        <div style={{fontWeight:600, marginTop:12}}>กำลังโหลดข้อมูลจากฐานข้อมูล…</div>
        <div className="muted" style={{fontSize:13, marginTop:4}}>Supabase</div>
      </div>
    </div>
  );
}

/* === Login Screen (Supabase Auth) === */
function LoginScreen({onLogin, bootError, clearBootError}){
  const [id, setId] = useState('');
  const [pwd, setPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async ()=>{
    if(busy) return;
    setErr(''); clearBootError && clearBootError();
    if(!window.sb){ setErr('Supabase client ยังไม่พร้อม — ตรวจ src/config.js'); return; }
    if(!id || !pwd){ setErr('กรุณาใส่ Username และ Password'); return; }
    setBusy(true);
    try {
      const { data, error } = await window.sb.auth.signInWithPassword({
        email: usernameToEmail(id.trim()),
        password: pwd,
      });
      if(error){ setErr('Username หรือรหัสผ่านไม่ถูกต้อง'); return; }
      await onLogin(data.session);
    } catch(e) {
      setErr(e.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const onKey = (e)=>{ if(e.key==='Enter') submit(); };

  return (
    <div style={{
      minHeight:'100vh', display:'grid', placeItems:'center', padding:24,
      background:`
        radial-gradient(800px 400px at 80% 10%, #FFE3F0 0%, transparent 60%),
        radial-gradient(700px 400px at 10% 90%, #FFEDE2 0%, transparent 60%),
        radial-gradient(900px 400px at 90% 90%, #EDE3FF 0%, transparent 60%),
        #FFF6EF`
    }}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, maxWidth:1000, alignItems:'center'}}>
        <div>
          <div className="row" style={{gap:18, marginBottom:18}}>
            <img src="assets/logo-circle.png" alt="CMUDS-ITPC" style={{width:88,height:88,borderRadius:'50%',boxShadow:'0 16px 36px -10px rgba(122,92,255,.45)'}}/>
            <div>
              <div style={{fontWeight:700,fontSize:30, lineHeight:1.1}}>Student Report</div>
              <div className="muted" style={{fontSize:14}}>ระบบบันทึกข้อมูลนักเรียน ป.3</div>
              <div className="muted" style={{fontSize:11,marginTop:2}}>CMUDS-ITPC · Chiang Mai University Demonstration School</div>
              <div className="muted" style={{fontSize:11}}>Kindergarten and Primary Levels</div>
            </div>
          </div>
          <h2 style={{fontSize:34, fontWeight:700, lineHeight:1.2, margin:'18px 0'}}>
            บันทึก ติดตาม และ <span className="grad-text" style={{background:'var(--grad-primary)',WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>ส่งเสริมพฤติกรรม</span> ของเด็กๆ ได้อย่างอบอุ่น
          </h2>
          <div className="muted" style={{fontSize:15, maxWidth:420}}>
            บันทึกพฤติกรรมรายบุคคล ผูกกับ 24 Character Strengths · พร้อมระบบดูแลสุขภาพและสรุปผลรายเทอม
          </div>

          <div style={{position:'relative', marginTop:32, height:140}}>
            <div style={{position:'absolute',top:0,left:0,width:90,height:90,borderRadius:'50%',
              background:'linear-gradient(135deg,#FFD96B,#FFA61F)',
              boxShadow:'0 20px 40px -10px rgba(255,166,31,.5), inset 0 -8px 0 rgba(255,255,255,.25)',
              display:'grid',placeItems:'center',fontSize:40}}>🎈</div>
            <div style={{position:'absolute',top:20,left:130,width:140,padding:14,borderRadius:18,background:'#fff',
              boxShadow:'0 16px 30px -10px rgba(80,40,80,.2)',transform:'rotate(-4deg)'}}>
              <div className="row" style={{gap:8,marginBottom:4}}>
                <span style={{fontSize:18}}>⭐</span>
                <span style={{fontWeight:600,fontSize:13}}>จุดแข็ง</span>
              </div>
              <div style={{fontSize:11,color:'var(--ink-3)'}}>ความเมตตา</div>
              <div className="bar" style={{marginTop:6}}><i style={{width:'78%'}}/></div>
            </div>
            <div style={{position:'absolute',top:60,left:300,width:90,height:90,borderRadius:'50%',
              background:'linear-gradient(135deg,#B79CFF,#7A5CFF)',
              boxShadow:'0 20px 40px -10px rgba(122,92,255,.5), inset 0 -8px 0 rgba(255,255,255,.25)',
              display:'grid',placeItems:'center',fontSize:40}}>🎒</div>
          </div>
        </div>

        <div className="card" style={{padding:30, boxShadow:'var(--shadow-lg)'}}>
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:700, fontSize:22}}>เข้าสู่ระบบ</div>
            <div className="muted" style={{fontSize:13}}>ใส่ Username และ Password ที่ admin ตั้งให้</div>
          </div>

          <div className="stack-lg" onKeyDown={onKey}>
            <div className="field">
              <label>Username</label>
              <input value={id} onChange={e=>setId(e.target.value)} placeholder="admin หรือ t1" autoFocus/>
            </div>
            <div className="field">
              <label>Password</label>
              <div style={{position:'relative'}}>
                <input
                  type={showPwd?'text':'password'}
                  value={pwd}
                  onChange={e=>setPwd(e.target.value)}
                  placeholder="••••••••"
                  style={{width:'100%', paddingRight:46}}
                />
                <button
                  type="button"
                  onClick={()=>setShowPwd(v=>!v)}
                  aria-label={showPwd?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'}
                  title={showPwd?'ซ่อนรหัสผ่าน':'แสดงรหัสผ่าน'}
                  style={{
                    position:'absolute', top:'50%', right:8, transform:'translateY(-50%)',
                    width:34, height:34, borderRadius:10, border:0, cursor:'pointer',
                    background:'transparent', color:'var(--ink-3)', fontSize:18,
                    display:'grid', placeItems:'center',
                  }}
                >{showPwd ? '🙈' : '👁️'}</button>
              </div>
            </div>
            {(err || bootError) && <div className="notice" style={{background:'#FFE0EA',color:'#C24B5C'}}>
              <span className="dot" style={{background:'#C24B5C'}}/>{err || bootError}
            </div>}
            <button className="btn btn-primary btn-lg" onClick={submit} disabled={busy} style={{justifyContent:'center', opacity:busy?0.7:1}}>
              <Icon name="arrow_r" size={16}/> {busy ? 'กำลังตรวจสอบ…' : 'เข้าสู่ระบบ'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
