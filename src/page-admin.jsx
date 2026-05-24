/* === Admin Page (admin role only) === */

function PageAdmin({state, dispatch, go}){
  const [tab, setTab] = useState('term');

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0,fontSize:24,fontWeight:700}}>⚙️ ตั้งค่าระบบ (Admin)</h2>
          <div className="muted" style={{marginTop:4}}>จัดการเทอม ครู หมวดพฤติกรรม 24 จุดแข็ง และข้อมูลของระบบ</div>
        </div>
        <Tabs value={tab} onChange={setTab} options={[
          {value:'term',       label:'📅 เทอม/ปี'},
          {value:'teachers',   label:'🍎 บัญชีครู'},
          {value:'categories', label:'📂 หมวดพฤติกรรม'},
          {value:'strengths',  label:'⭐ 24 จุดแข็ง'},
          {value:'groups',     label:'🌈 6 หมวด'},
          {value:'data',       label:'💾 ข้อมูล'},
        ]}/>
      </div>

      {tab==='term' && <AdminTerm state={state} dispatch={dispatch}/>}
      {tab==='teachers' && <AdminTeachers state={state} dispatch={dispatch}/>}
      {tab==='categories' && <AdminCategories state={state} dispatch={dispatch}/>}
      {tab==='strengths' && <AdminStrengths state={state} dispatch={dispatch}/>}
      {tab==='groups' && <AdminGroups state={state} dispatch={dispatch}/>}
      {tab==='data' && <AdminData state={state} dispatch={dispatch}/>}
    </div>
  );
}

/* ============ Admin: Term/Year ============ */
function AdminTerm({state, dispatch}){
  const [term, setTerm] = useState(state.currentTerm);
  const [year, setYear] = useState(state.currentYear);

  return (
    <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="calendar" size={16} color="#fff"/></div> เทอมและปีการศึกษาปัจจุบัน</div>
        </div>
        <div className="muted" style={{marginBottom:16,padding:'10px 14px',background:'#FFF7EF',borderRadius:14,fontSize:13}}>
          💡 เมื่อครูบันทึกพฤติกรรมใหม่ ระบบจะใส่เทอม/ปีตามที่ตั้งค่าไว้ที่นี่อัตโนมัติ
        </div>

        <div className="field">
          <label>ภาคเรียน</label>
          <div className="seg" style={{width:'100%'}}>
            <button className={term===1?'on':''} style={{flex:1}} onClick={()=>setTerm(1)}>📘 เทอม 1</button>
            <button className={term===2?'on':''} style={{flex:1}} onClick={()=>setTerm(2)}>📗 เทอม 2</button>
          </div>
        </div>

        <div className="field" style={{marginTop:16}}>
          <label>ปีการศึกษา (พ.ศ.)</label>
          <input type="number" value={year} onChange={e=>setYear(+e.target.value || 0)} placeholder="2568" min="2500" max="2700"/>
          <div className="help">พิมพ์ปีการศึกษา (ตัวอย่าง: 2568)</div>
        </div>

        <button className="btn btn-violet" style={{marginTop:20, width:'100%', justifyContent:'center'}}
          onClick={()=>{
            if(!year || year<2500){ alert('กรุณากรอกปีการศึกษาที่ถูกต้อง'); return; }
            dispatch({type:'set-term', term, year});
            alert('บันทึกการตั้งค่าเทอม '+term+'/'+year+' เรียบร้อย');
          }}>
          <Icon name="save" size={14}/> บันทึกการตั้งค่าเทอม
        </button>
      </div>

      <div className="card">
        <div className="card-title"><div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="chart" size={16} color="#fff"/></div> สถิติพฤติกรรมในแต่ละเทอม</div></div>
        {(()=>{
          // gather all unique (term,year) combos that appear in logs, plus current
          const set = new Map();
          state.logs.forEach(l=>{
            const k = `${l.term}-${l.year}`;
            set.set(k, {t:l.term, y:l.year});
          });
          set.set(`${state.currentTerm}-${state.currentYear}`, {t:state.currentTerm, y:state.currentYear});
          const list = [...set.values()].sort((a,b)=>(b.y-a.y) || (b.t-a.t));
          return list.map(p => {
            const count = state.logs.filter(l => l.term===p.t && l.year===p.y).length;
            const active = p.t===state.currentTerm && p.y===state.currentYear;
            return (
              <div key={p.t+'-'+p.y} className="row" style={{
                justifyContent:'space-between', padding:'12px 16px',
                background: active?'linear-gradient(135deg,#FFE3F0,#FFEDE2)':'#FFF7EF',
                borderRadius:14, marginBottom:8,
                boxShadow: active ? 'var(--shadow-sm)' : 'none',
              }}>
                <div>
                  <div style={{fontWeight:600}}>เทอม {p.t}/{p.y} {active && <span className="pill" style={{marginLeft:8}}>กำลังใช้งาน</span>}</div>
                  <div className="muted" style={{fontSize:12}}>{count} บันทึกพฤติกรรม</div>
                </div>
                <div style={{fontSize:20, fontWeight:700, color: active ? '#C24B5C' : 'var(--ink-3)'}}>{count}</div>
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

/* ============ Admin: Teachers ============ */
function AdminTeachers({state, dispatch}){
  const colors = ['#FF6E8A','#FF8A5C','#9D7FFF','#5CC9FF','#4FD1AB','#FFC23C','#E66BD6','#7A5CFF'];
  const [editing, setEditing]   = useState(null); // แก้ชื่อ/สี
  const [creating, setCreating] = useState(null); // เพิ่มครูใหม่
  const [pwTarget, setPwTarget] = useState(null); // เปลี่ยนรหัส (ของ user คนอื่น)
  const [selfPw, setSelfPw]     = useState(null); // เปลี่ยนรหัสตัวเอง
  const [unameTarget, setUnameTarget] = useState(null); // เปลี่ยน Username
  const [busy, setBusy] = useState(false);

  const startCreate = ()=> setCreating({ username:'', password:'', name:'', avatar:'#FF6E8A' });

  return (
    <div className="stack-lg">
      {/* Self password card */}
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="lock" size={16} color="#fff"/></div> รหัสผ่านของคุณ (admin)</div>
          <button className="btn btn-soft-violet btn-sm" onClick={()=>setSelfPw({ password:'', confirm:'' })}>
            <Icon name="edit" size={11}/> เปลี่ยนรหัสผ่านของฉัน
          </button>
        </div>
        <div className="muted" style={{fontSize:13}}>
          เปลี่ยนรหัสของบัญชี admin ที่ล็อกอินอยู่ — ครั้งถัดไปต้องใช้รหัสใหม่ในการ login
        </div>
      </div>

      {/* Teachers list */}
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="users" size={16} color="#fff"/></div> บัญชีครู</div>
          <button className="btn btn-primary btn-sm" onClick={startCreate}>
            <Icon name="plus" size={14}/> เพิ่มครู
          </button>
        </div>

        <table className="tbl">
          <thead><tr>
            <th></th><th>Username</th><th>ชื่อ-นามสกุล</th><th>การจัดการ</th>
          </tr></thead>
          <tbody>
            {state.teachers.map(t => (
              <tr key={t.id}>
                <td>
                  <div style={{
                    width:42,height:42,borderRadius:14,
                    background:`linear-gradient(135deg,${t.avatar},${shade(t.avatar,-25)})`,
                    display:'grid',placeItems:'center',color:'#fff',fontWeight:700
                  }}>{(t.name||t.id).slice(0,1)}</div>
                </td>
                <td><b>{t.id}</b></td>
                <td>{t.name || '—'}</td>
                <td>
                  <div className="row" style={{flexWrap:'wrap', gap:6}}>
                    <button className="btn btn-soft btn-sm" onClick={()=>setEditing({...t})}>
                      <Icon name="edit" size={11}/> แก้ชื่อ/สี
                    </button>
                    <button className="btn btn-soft-sky btn-sm" onClick={()=>setUnameTarget({ id:t.id, name:t.name, newId:t.id })}>
                      <Icon name="edit" size={11}/> เปลี่ยน Username
                    </button>
                    <button className="btn btn-soft-violet btn-sm" onClick={()=>setPwTarget({ id:t.id, name:t.name, password:'', confirm:'' })}>
                      <Icon name="lock" size={11}/> เปลี่ยนรหัส
                    </button>
                    <button className="btn btn-soft btn-sm" style={{background:'#FFE0EA', color:'#C24B5C'}} onClick={async ()=>{
                      if(!confirm(`ลบบัญชี "${t.id}" (${t.name||''}) ถาวร?\nบันทึกพฤติกรรมที่ครูคนนี้สร้างจะยังอยู่`)) return;
                      try { setBusy(true); await dispatch({type:'teacher-remove', id:t.id}); }
                      catch(e){ /* toast shown */ }
                      finally { setBusy(false); }
                    }}>
                      <Icon name="trash" size={11}/> ลบ
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {state.teachers.length===0 && (
              <tr><td colSpan={4}><Empty title="ยังไม่มีบัญชีครู" sub="กดปุ่ม + เพิ่มครู เพื่อสร้างบัญชีแรก" icon="users"/></td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* === Modal: แก้ชื่อ/สี === */}
      <Modal open={!!editing} onClose={()=>setEditing(null)}
        title="แก้ไขข้อมูลครู"
        subtitle="แก้ไขชื่อแสดงและสีประจำตัว">
        {editing && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="field">
              <label>Username</label>
              <input value={editing.id} disabled style={{opacity:.6}}/>
            </div>
            <div className="field">
              <label>ชื่อ-นามสกุล</label>
              <input value={editing.name || ''} onChange={e=>setEditing({...editing, name:e.target.value})} placeholder="เช่น ครูสมศรี ใจดี"/>
            </div>
            <div className="field">
              <label>สีประจำตัว</label>
              <div className="row" style={{flexWrap:'wrap'}}>
                {colors.map(c => (
                  <button key={c} onClick={()=>setEditing({...editing, avatar:c})} style={{
                    width:32,height:32,borderRadius:'50%',
                    border: editing.avatar===c?'3px solid var(--ink)':'2px solid #fff',
                    background:c, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                  }}/>
                ))}
              </div>
            </div>
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" disabled={busy} onClick={async ()=>{
                try {
                  setBusy(true);
                  await dispatch({type:'teacher-update', id:editing.id, patch:{name:editing.name, avatar:editing.avatar}});
                  setEditing(null);
                } catch(e) {} finally { setBusy(false); }
              }}><Icon name="save" size={14}/> บันทึก</button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal: เพิ่มครูใหม่ === */}
      <Modal open={!!creating} onClose={()=>setCreating(null)}
        title="เพิ่มบัญชีครูใหม่"
        subtitle="สร้างบัญชีครูสำหรับ login เข้าระบบ — username เป็น a-z, 0-9, _ ความยาว 2-32">
        {creating && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:14}}>
              <div className="field">
                <label>Username (สำหรับ login)</label>
                <input value={creating.username} onChange={e=>setCreating({...creating, username:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')})} placeholder="เช่น t2"/>
              </div>
              <PasswordField
                label="Password (อย่างน้อย 6 ตัวอักษร)"
                value={creating.password}
                onChange={(v)=>setCreating({...creating, password:v})}
              />
            </div>
            <div className="field">
              <label>ชื่อ-นามสกุล</label>
              <input value={creating.name} onChange={e=>setCreating({...creating, name:e.target.value})} placeholder="เช่น ครูสมศรี ใจดี"/>
            </div>
            <div className="field">
              <label>สีประจำตัว</label>
              <div className="row" style={{flexWrap:'wrap'}}>
                {colors.map(c => (
                  <button key={c} onClick={()=>setCreating({...creating, avatar:c})} style={{
                    width:32,height:32,borderRadius:'50%',
                    border: creating.avatar===c?'3px solid var(--ink)':'2px solid #fff',
                    background:c, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                  }}/>
                ))}
              </div>
            </div>
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setCreating(null)}>ยกเลิก</button>
              <button className="btn btn-primary" disabled={busy} onClick={async ()=>{
                if(!creating.username || creating.username.length<2){ alert('กรุณากรอก Username (อย่างน้อย 2 ตัว)'); return; }
                if(!creating.password || creating.password.length<6){ alert('Password ต้องอย่างน้อย 6 ตัวอักษร'); return; }
                try {
                  setBusy(true);
                  await dispatch({
                    type:'teacher-add',
                    username: creating.username,
                    password: creating.password,
                    name: creating.name || creating.username,
                    avatar: creating.avatar,
                  });
                  setCreating(null);
                  alert(`สร้างบัญชี "${creating.username}" เรียบร้อย — login ได้ทันที`);
                } catch(e) {} finally { setBusy(false); }
              }}><Icon name="plus" size={14}/> สร้างบัญชี</button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal: เปลี่ยน Username === */}
      <Modal open={!!unameTarget} onClose={()=>setUnameTarget(null)}
        title="เปลี่ยน Username"
        subtitle={unameTarget ? `บัญชีเดิม: ${unameTarget.id}${unameTarget.name?' · '+unameTarget.name:''}` : ''}>
        {unameTarget && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="notice" style={{background:'#FFEBC2',color:'#A56A00'}}>
              <span className="dot" style={{background:'#A56A00'}}/>
              <span>การเปลี่ยน Username จะอัปเดต email สำหรับ login ด้วย — ครั้งถัดไปต้อง login ด้วย Username ใหม่</span>
            </div>
            <div className="field">
              <label>Username ใหม่ (a-z, 0-9, _ ความยาว 2-32)</label>
              <input
                value={unameTarget.newId}
                onChange={e=>setUnameTarget({...unameTarget, newId:e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,'')})}
                placeholder="เช่น t2"
              />
            </div>
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setUnameTarget(null)}>ยกเลิก</button>
              <button className="btn btn-violet" disabled={busy} onClick={async ()=>{
                if(!unameTarget.newId || unameTarget.newId.length<2){ alert('Username ต้องอย่างน้อย 2 ตัว'); return; }
                if(unameTarget.newId === unameTarget.id){ alert('Username ใหม่เหมือนเดิม'); return; }
                try {
                  setBusy(true);
                  await dispatch({type:'teacher-set-username', id:unameTarget.id, newId:unameTarget.newId});
                  setUnameTarget(null);
                  alert(`เปลี่ยน Username เป็น "${unameTarget.newId}" เรียบร้อย`);
                } catch(e) {} finally { setBusy(false); }
              }}><Icon name="save" size={14}/> บันทึก Username ใหม่</button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal: เปลี่ยนรหัสผ่านของครู === */}
      <Modal open={!!pwTarget} onClose={()=>setPwTarget(null)}
        title="เปลี่ยนรหัสผ่าน"
        subtitle={pwTarget ? `บัญชี: ${pwTarget.id}${pwTarget.name?' · '+pwTarget.name:''}` : ''}>
        {pwTarget && (
          <div className="stack-lg" style={{marginTop:12}}>
            <PasswordField
              label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              value={pwTarget.password}
              onChange={(v)=>setPwTarget({...pwTarget, password:v})}
            />
            <PasswordField
              label="ยืนยันรหัสผ่านใหม่"
              value={pwTarget.confirm}
              onChange={(v)=>setPwTarget({...pwTarget, confirm:v})}
            />
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setPwTarget(null)}>ยกเลิก</button>
              <button className="btn btn-violet" disabled={busy} onClick={async ()=>{
                if(!pwTarget.password || pwTarget.password.length<6){ alert('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'); return; }
                if(pwTarget.password !== pwTarget.confirm){ alert('รหัสผ่านยืนยันไม่ตรงกัน'); return; }
                try {
                  setBusy(true);
                  await dispatch({type:'teacher-set-password', id:pwTarget.id, password:pwTarget.password});
                  setPwTarget(null);
                  alert(`เปลี่ยนรหัสผ่านของ "${pwTarget.id}" เรียบร้อย`);
                } catch(e) {} finally { setBusy(false); }
              }}><Icon name="save" size={14}/> บันทึกรหัสใหม่</button>
            </div>
          </div>
        )}
      </Modal>

      {/* === Modal: เปลี่ยนรหัสผ่านของตัวเอง === */}
      <Modal open={!!selfPw} onClose={()=>setSelfPw(null)}
        title="เปลี่ยนรหัสผ่านของฉัน"
        subtitle="หลังเปลี่ยนแล้ว ครั้งถัดไปต้อง login ด้วยรหัสใหม่">
        {selfPw && (
          <div className="stack-lg" style={{marginTop:12}}>
            <PasswordField
              label="รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
              value={selfPw.password}
              onChange={(v)=>setSelfPw({...selfPw, password:v})}
            />
            <PasswordField
              label="ยืนยันรหัสผ่านใหม่"
              value={selfPw.confirm}
              onChange={(v)=>setSelfPw({...selfPw, confirm:v})}
            />
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setSelfPw(null)}>ยกเลิก</button>
              <button className="btn btn-violet" disabled={busy} onClick={async ()=>{
                if(!selfPw.password || selfPw.password.length<6){ alert('รหัสผ่านต้องอย่างน้อย 6 ตัวอักษร'); return; }
                if(selfPw.password !== selfPw.confirm){ alert('รหัสผ่านยืนยันไม่ตรงกัน'); return; }
                try {
                  setBusy(true);
                  await dispatch({type:'self-set-password', password:selfPw.password});
                  setSelfPw(null);
                  alert('เปลี่ยนรหัสผ่านของคุณเรียบร้อย');
                } catch(e) {} finally { setBusy(false); }
              }}><Icon name="save" size={14}/> บันทึกรหัสใหม่</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* PasswordField moved to ui.jsx — used here as global */

/* ============ Admin: Behavior Categories ============ */
function AdminCategories({state, dispatch}){
  const cats = state.behaviorCategories;
  const [editing, setEditing] = useState(null);
  const palette = ['#FF8A5C','#FF6E8A','#9D7FFF','#5CC9FF','#4FD1AB','#FFC23C','#E66BD6','#7A5CFF'];
  const emojis = ['🧸','💬','📖','😊','👫','🤝','⭐','🎨','🏃','🎵','🍎','🌱','🧩','🎯','✨','🌟','🎲','💪','📚','🌿'];

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="grid" size={16} color="#fff"/></div> หมวดพฤติกรรม</div>
          <button className="btn btn-primary btn-sm" onClick={()=>setEditing({id:'new', name:'', emoji:'⭐', color:'#FF8A5C', tone:'sun'})}>
            <Icon name="plus" size={14}/> เพิ่มหมวด
          </button>
        </div>
        <div className="grid" style={{gridTemplateColumns:'repeat(3, 1fr)'}}>
          {cats.map(c => (
            <div key={c.id} style={{padding:16, background:'#FFF7EF', borderRadius:18}}>
              <div className="between">
                <div className="row">
                  <div style={{
                    width:48,height:48,borderRadius:14,
                    background:`linear-gradient(135deg, ${c.color}, ${shade(c.color,-20)})`,
                    display:'grid',placeItems:'center',fontSize:22,color:'#fff'
                  }}>{c.emoji}</div>
                  <div>
                    <div style={{fontWeight:600}}>{c.name}</div>
                    <div className="muted" style={{fontSize:11}}>id: {c.id}</div>
                  </div>
                </div>
                <div className="row" style={{gap:6}}>
                  <button className="btn btn-soft btn-sm" onClick={()=>setEditing(c)}><Icon name="edit" size={11}/></button>
                  <button className="btn btn-soft btn-sm" onClick={()=>{
                    if(confirm('ลบหมวด '+c.name+'?')) dispatch({type:'cat-remove', id:c.id});
                  }} disabled={cats.length<=2}>
                    <Icon name="trash" size={11}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)}
        title={editing && editing.id==='new'?'เพิ่มหมวดพฤติกรรม':'แก้ไขหมวด'}>
        {editing && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="field"><label>ชื่อหมวด</label>
              <input value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} placeholder="เช่น การช่วยเหลือ"/></div>
            <div className="field"><label>อีโมจิ</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {emojis.map(e => (
                  <button key={e} onClick={()=>setEditing({...editing, emoji:e})} style={{
                    width:44,height:44,borderRadius:12,border:0,cursor:'pointer',
                    background: editing.emoji===e?'var(--grad-primary)':'#FFF7EF',
                    fontSize:22,
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div className="field"><label>สี</label>
              <div className="row" style={{flexWrap:'wrap',gap:8}}>
                {palette.map(p => (
                  <button key={p} onClick={()=>setEditing({...editing, color:p})} style={{
                    width:32,height:32,borderRadius:'50%',
                    border: editing.color===p?'3px solid var(--ink)':'2px solid #fff',
                    background:p, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                  }}/>
                ))}
              </div>
            </div>
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={()=>{
                if(!editing.name) return;
                if(editing.id==='new'){
                  const id = 'cat_'+Date.now();
                  dispatch({type:'cat-add', cat:{...editing, id, tone:'sun'}});
                } else {
                  dispatch({type:'cat-update', id:editing.id, patch:editing});
                }
                setEditing(null);
              }}><Icon name="save" size={14}/> บันทึก</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ============ Admin: 24 Character Strengths CRUD ============ */
function AdminStrengths({state, dispatch}){
  const [editing, setEditing] = useState(null);
  const palette = ['#FF8A5C','#FF9D4D','#FFB347','#FFC23C','#FFB36B','#FF6E8A','#FF5C9E','#FF7BA0','#FF4D80',
                   '#E66BD6','#C26BD9','#9D7FFF','#7A5CFF','#5C7CFF','#5CC9FF','#4FD1AB','#3FB489','#5BB78A','#7CC9A1',
                   '#FFA61F','#FFD96B','#FF9F4D'];

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="star" size={16} color="#fff"/></div> 24 Character Strengths</div>
          <button className="btn btn-primary btn-sm" onClick={()=>setEditing({id:'new', th:'', en:'', image:'', emoji:'⭐', color:'#FF8A5C', group:state.strengthGroups[0]?.name||''})}>
            <Icon name="plus" size={14}/> เพิ่มจุดแข็ง
          </button>
        </div>

        <div className="muted" style={{fontSize:13, marginBottom:14, padding:'10px 14px', background:'#FFF7EF', borderRadius:14}}>
          💡 อิงตาม VIA Character Strengths — admin สามารถเพิ่ม/ลบ/แก้ไขเพื่อปรับให้เข้ากับโรงเรียนได้ และอัปโหลดรูปภาพแทนอีโมจิได้
        </div>

        <div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)', gap:10}}>
          {state.characterStrengths.map(s => (
            <div key={s.id} className="row" style={{padding:'12px 14px',background:'#FFF7EF',borderRadius:14,gap:12,justifyContent:'space-between'}}>
              <div className="row" style={{gap:12, flex:1, minWidth:0}}>
                <div style={{
                  width:42,height:42,borderRadius:12,flexShrink:0,
                  background:`linear-gradient(135deg, ${s.color}, ${shade(s.color,-20)})`,
                  display:'grid',placeItems:'center',color:'#fff',fontSize:20,overflow:'hidden',
                }}>{s.image ? <img src={s.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : s.emoji}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:600,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.th}</div>
                  <div className="muted" style={{fontSize:11,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{s.en} · {s.group}</div>
                </div>
              </div>
              <div className="row" style={{gap:4}}>
                <button className="btn btn-soft btn-sm" onClick={()=>setEditing(s)}><Icon name="edit" size={11}/></button>
                <button className="btn btn-soft btn-sm" onClick={()=>{
                  if(confirm('ลบจุดแข็ง '+s.th+'?')) dispatch({type:'strength-remove', id:s.id});
                }}><Icon name="trash" size={11}/></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)}
        title={editing && editing.id==='new' ? 'เพิ่มจุดแข็งใหม่' : 'แก้ไขจุดแข็ง'}>
        {editing && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="grid" style={{gridTemplateColumns:'140px 1fr',gap:18, alignItems:'flex-start'}}>
              <StrengthImageSlot value={editing.image} fallbackEmoji={editing.emoji} color={editing.color}
                onChange={(v)=>setEditing({...editing, image:v})}/>
              <div className="stack-lg">
                <div className="grid" style={{gridTemplateColumns:'1fr 1fr',gap:14}}>
                  <div className="field"><label>ชื่อภาษาไทย</label>
                    <input value={editing.th} onChange={e=>setEditing({...editing, th:e.target.value})} placeholder="เช่น ความเมตตา"/></div>
                  <div className="field"><label>ชื่อภาษาอังกฤษ</label>
                    <input value={editing.en} onChange={e=>setEditing({...editing, en:e.target.value})} placeholder="Kindness"/></div>
                </div>
                <div className="field"><label>หมวดใหญ่ (6 หมวด)</label>
                  <select value={editing.group} onChange={e=>setEditing({...editing, group:e.target.value})}>
                    {state.strengthGroups.map(g => <option key={g.name} value={g.name}>{g.emoji} {g.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="field"><label>สีประจำจุดแข็ง</label>
              <div className="row" style={{flexWrap:'wrap',gap:6}}>
                {palette.map(p => (
                  <button key={p} onClick={()=>setEditing({...editing, color:p})} style={{
                    width:28,height:28,borderRadius:'50%',
                    border: editing.color===p?'3px solid var(--ink)':'2px solid #fff',
                    background:p, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                  }}/>
                ))}
              </div>
            </div>

            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={()=>{
                if(!editing.th) return;
                if(editing.id==='new'){
                  const id = 'str_' + Date.now();
                  dispatch({type:'strength-add', strength:{...editing, id}});
                } else {
                  dispatch({type:'strength-update', id:editing.id, patch:editing});
                }
                setEditing(null);
              }}><Icon name="save" size={14}/> บันทึก</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* Image slot specifically for strength editor — allows clearing back to emoji */
function StrengthImageSlot({value, fallbackEmoji, color, onChange}){
  const ref = React.useRef();
  const pick = ()=>ref.current && ref.current.click();
  const onFile = (e)=>{
    const f = e.target.files[0];
    if(!f) return;
    const r = new FileReader();
    r.onload = ()=>onChange(r.result);
    r.readAsDataURL(f);
  };
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <div onClick={pick} style={{
        width:120, height:120, borderRadius:24,
        background: value ? '#FFF' :
          `linear-gradient(135deg, ${color}, ${shade(color,-20)})`,
        display:'grid',placeItems:'center',cursor:'pointer',color:'#fff',
        boxShadow:`0 12px 28px -10px ${color}99`, overflow:'hidden', fontSize:54,
      }}>
        {value ? <img src={value} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : fallbackEmoji}
      </div>
      <input type="file" ref={ref} accept="image/*" style={{display:'none'}} onChange={onFile}/>
      <div className="row" style={{gap:6}}>
        <button className="btn btn-soft btn-sm" onClick={pick}><Icon name="image" size={12}/> อัปโหลดรูป</button>
        {value && <button className="btn btn-soft btn-sm" onClick={()=>onChange('')}><Icon name="close" size={12}/></button>}
      </div>
      <div className="help" style={{textAlign:'center',maxWidth:140}}>ใช้รูปแทนอีโมจิ — แนะนำรูปสี่เหลี่ยมจัตุรัส</div>
    </div>
  );
}

/* ============ Admin: 6 Strength Groups CRUD ============ */
function AdminGroups({state, dispatch}){
  const [editing, setEditing] = useState(null);
  const palette = ['#FF8A5C','#FF6E8A','#9D7FFF','#5CC9FF','#4FD1AB','#FFC23C','#E66BD6','#7A5CFF','#FF9F4D'];
  const emojis = ['🧠','🦁','💖','⚖️','🌿','✨','🎯','📚','🌟','💪','🎨','🤝'];

  return (
    <div className="stack-lg">
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="grid" size={16} color="#fff"/></div> 6 หมวดของ Character Strengths</div>
          <button className="btn btn-primary btn-sm" onClick={()=>setEditing({name:'', emoji:'🌟', color:'#FF8A5C', isNew:true})}>
            <Icon name="plus" size={14}/> เพิ่มหมวด
          </button>
        </div>
        <div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}>
          {state.strengthGroups.map(g => {
            const count = state.characterStrengths.filter(s=>s.group===g.name).length;
            return (
              <div key={g.name} style={{padding:18, background:'#FFF7EF', borderRadius:18, position:'relative', overflow:'hidden'}}>
                <div style={{position:'absolute',top:-20,right:-20,width:80,height:80,borderRadius:'50%',background:g.color+'22'}}/>
                <div style={{position:'relative'}}>
                  <div style={{
                    width:54,height:54,borderRadius:16,
                    background:`linear-gradient(135deg,${g.color},${shade(g.color,-20)})`,
                    display:'grid',placeItems:'center',fontSize:26,color:'#fff',
                    boxShadow:`0 10px 22px -8px ${g.color}99`,
                  }}>{g.emoji}</div>
                  <div style={{fontWeight:700,fontSize:16,marginTop:14}}>{g.name}</div>
                  <div className="muted" style={{fontSize:12,marginTop:2}}>{count} จุดแข็ง</div>
                  <div className="row" style={{marginTop:12,gap:6}}>
                    <button className="btn btn-soft btn-sm" onClick={()=>setEditing({...g, oldName:g.name})}><Icon name="edit" size={11}/> แก้ไข</button>
                    <button className="btn btn-soft btn-sm" onClick={()=>{
                      if(count>0){ alert('ยังมี '+count+' จุดแข็งในหมวดนี้ ย้ายไปหมวดอื่นก่อนค่อยลบ'); return; }
                      if(confirm('ลบหมวด '+g.name+'?')) dispatch({type:'group-remove', name:g.name});
                    }}><Icon name="trash" size={11}/></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)}
        title={editing && editing.isNew?'เพิ่มหมวดใหม่':'แก้ไขหมวด'}>
        {editing && (
          <div className="stack-lg" style={{marginTop:12}}>
            <div className="field"><label>ชื่อหมวด</label>
              <input value={editing.name} onChange={e=>setEditing({...editing, name:e.target.value})} placeholder="เช่น ปัญญา"/></div>
            <div className="field"><label>อีโมจิ</label>
              <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
                {emojis.map(e => (
                  <button key={e} onClick={()=>setEditing({...editing, emoji:e})} style={{
                    width:44,height:44,borderRadius:12,border:0,cursor:'pointer',
                    background: editing.emoji===e?'var(--grad-primary)':'#FFF7EF',fontSize:22
                  }}>{e}</button>
                ))}
              </div>
            </div>
            <div className="field"><label>สี</label>
              <div className="row" style={{flexWrap:'wrap',gap:6}}>
                {palette.map(p => (
                  <button key={p} onClick={()=>setEditing({...editing, color:p})} style={{
                    width:32,height:32,borderRadius:'50%',
                    border: editing.color===p?'3px solid var(--ink)':'2px solid #fff',
                    background:p, cursor:'pointer',boxShadow:'0 2px 6px rgba(0,0,0,.1)'
                  }}/>
                ))}
              </div>
            </div>
            <div className="row" style={{justifyContent:'flex-end',gap:10}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(null)}>ยกเลิก</button>
              <button className="btn btn-primary" onClick={()=>{
                if(!editing.name) return;
                if(editing.isNew){
                  if(state.strengthGroups.find(g=>g.name===editing.name)){ alert('ชื่อหมวดซ้ำ'); return; }
                  const {isNew, ...g} = editing;
                  dispatch({type:'group-add', group:g});
                } else {
                  dispatch({type:'group-update', name:editing.oldName, patch:{name:editing.name, emoji:editing.emoji, color:editing.color}});
                  // also update characterStrengths whose group is the old name
                  if(editing.oldName !== editing.name){
                    state.characterStrengths.filter(s=>s.group===editing.oldName).forEach(s=>{
                      dispatch({type:'strength-update', id:s.id, patch:{group:editing.name}});
                    });
                  }
                }
                setEditing(null);
              }}><Icon name="save" size={14}/> บันทึก</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function AdminData({state, dispatch}){
  return (
    <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
      <div className="card">
        <div className="card-title"><div className="t"><div className="ic" style={{background:'var(--grad-mint)'}}><Icon name="chart" size={16} color="#fff"/></div> ข้อมูลในระบบ</div></div>
        <div className="stack">
          <KvRow k="นักเรียน" v={state.students.length + ' คน'} icon="👧" color="#FF6E8A"/>
          <KvRow k="ครู" v={state.teachers.length + ' คน'} icon="🍎" color="#FF8A5C"/>
          <KvRow k="บันทึกพฤติกรรม" v={state.logs.length + ' รายการ'} icon="📝" color="#9D7FFF"/>
          <KvRow k="หมวดพฤติกรรม" v={state.behaviorCategories.length + ' หมวด'} icon="📚" color="#4FD1AB"/>
          <KvRow k="Character Strengths" v={state.characterStrengths.length + ' จุดแข็ง'} icon="⭐" color="#FFC23C"/>
          <KvRow k="เทอมปัจจุบัน" v={`${state.currentTerm}/${state.currentYear}`} icon="📅" color="#5CC9FF"/>
        </div>
      </div>
      <div className="card">
        <div className="card-title"><div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="settings" size={16} color="#fff"/></div> การจัดการข้อมูล</div></div>
        <div className="stack">
          <button className="btn btn-soft-violet" onClick={()=>{
            if(confirm('รีโหลดข้อมูลตัวอย่างจะเขียนทับข้อมูลปัจจุบัน — ดำเนินการต่อ?'))
              dispatch({type:'reset-seed'});
          }}>
            <Icon name="sparkle" size={14}/> รีโหลดข้อมูลตัวอย่าง
          </button>
          <button className="btn btn-soft" onClick={()=>{
            if(confirm('ยืนยันลบข้อมูลนักเรียนและบันทึกพฤติกรรมทั้งหมด?')){
              dispatch({type:'wipe'});
            }
          }}>
            <Icon name="trash" size={14}/> ล้างข้อมูลนักเรียน + พฤติกรรม
          </button>
          <button className="btn btn-soft-mint" onClick={()=>{
            const data = JSON.stringify({
              students:state.students, logs:state.logs,
              behaviorCategories:state.behaviorCategories,
              characterStrengths:state.characterStrengths,
              strengthGroups:state.strengthGroups,
              teachers:state.teachers,
            }, null, 2);
            const blob = new Blob([data],{type:'application/json'});
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'starkids-backup.json';
            a.click();
          }}>
            <Icon name="download" size={14}/> ส่งออกข้อมูลเป็น JSON
          </button>
          <button className="btn btn-ghost" onClick={()=>dispatch({type:'logout'})}>
            <Icon name="lock" size={14}/> ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageAdmin });
