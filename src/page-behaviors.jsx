/* === Behaviors Page === */

function PageBehaviors({state, dispatch, go, preselectStudentId, openForm}){
  const [showForm, setShowForm] = useState(!!openForm);
  const [preselect, setPreselect] = useState(preselectStudentId || null);
  const [editingLog, setEditingLog] = useState(null);

  useEffect(()=>{
    setShowForm(!!openForm);
    setPreselect(preselectStudentId||null);
  }, [openForm, preselectStudentId]);

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0, fontSize:24, fontWeight:700}}>บันทึกพฤติกรรม</h2>
          <div className="muted" style={{marginTop:4}}>เก็บข้อมูลพฤติกรรมและผูกกับ 24 character strengths</div>
        </div>
        <div className="row">
          <button className="btn btn-primary" onClick={()=>{setPreselect(null);setShowForm(true)}}>
            <Icon name="plus" size={16}/> บันทึกใหม่
          </button>
        </div>
      </div>

      <BehaviorLogsView state={state} dispatch={dispatch} go={go} onEdit={(log)=>setEditingLog(log)}/>

      <Modal open={showForm} onClose={()=>setShowForm(false)} wide
        title="บันทึกพฤติกรรมนักเรียน"
        subtitle="กรอกรายละเอียดและเลือก character strengths ที่เกี่ยวข้อง">
        <BehaviorForm
          state={state}
          preselectStudentId={preselect}
          onCancel={()=>setShowForm(false)}
          onSave={(log)=>{
            dispatch({type:'log-add', log});
            setShowForm(false);
          }}
        />
      </Modal>

      <Modal open={!!editingLog} onClose={()=>setEditingLog(null)} wide
        title="แก้ไขบันทึกพฤติกรรม"
        subtitle="ปรับรายละเอียดและ character strengths ที่เกี่ยวข้อง">
        {editingLog && (
          <BehaviorForm
            state={state}
            initial={editingLog}
            onCancel={()=>setEditingLog(null)}
            onSave={(log)=>{
              dispatch({type:'log-update', id:editingLog.id, patch:log});
              setEditingLog(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

/* List view (reused inside student detail too) */
function BehaviorLogsView({state, dispatch, go, filterStudentId, hideStudentColumn, onEdit}){
  const cats = state.behaviorCategories || BEHAVIOR_CATEGORIES_DEFAULT;
  const [catFilter, setCatFilter] = useState('all');
  const [grade, setGrade] = useState('all');
  const [search, setSearch] = useState('');

  const orderedRooms = ['ป.3/1','ป.3/2','ป.3/3'];
  const grades = ['all', ...orderedRooms.filter(r=>state.students.some(s=>s.grade===r))];

  let logs = state.logs.slice();
  if(filterStudentId) logs = logs.filter(l=>l.studentId===filterStudentId);
  if(catFilter!=='all') logs = logs.filter(l=>l.categoryId===catFilter);
  if(grade!=='all'){
    const ids = new Set(state.students.filter(s=>s.grade===grade).map(s=>s.id));
    logs = logs.filter(l=>ids.has(l.studentId));
  }
  if(search){
    const q = search.toLowerCase();
    logs = logs.filter(l => {
      const s = state.students.find(x=>x.id===l.studentId);
      return l.description.toLowerCase().includes(q)
        || (s && (s.firstName+s.lastName+s.nickname).toLowerCase().includes(q));
    });
  }
  logs.sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div className="stack-lg">
      {/* Filters */}
      <div className="card tight">
        <div className="row" style={{flexWrap:'wrap', gap:10}}>
          <div className="search" style={{flex:1, minWidth:240, boxShadow:'none', background:'#FFF7EF'}}>
            <Icon name="search" size={16} color="#8A7FA0"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นหาในคำอธิบาย หรือชื่อนักเรียน..."/>
          </div>
          {!filterStudentId && (
            <div className="seg">
              {grades.map(g => <button key={g} className={grade===g?'on':''} onClick={()=>setGrade(g)}>{g==='all'?'ทั้งหมด':g}</button>)}
            </div>
          )}
          <div className="seg">
            <button className={catFilter==='all'?'on':''} onClick={()=>setCatFilter('all')}>ทุกหมวด</button>
            {cats.map(c=>(
              <button key={c.id} className={catFilter===c.id?'on':''} onClick={()=>setCatFilter(c.id)}>
                <span style={{marginRight:4}}>{c.emoji}</span>{c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:14}}>
        {logs.map(l => {
          const stu = state.students.find(s=>s.id===l.studentId);
          const cat = cats.find(c=>c.id===l.categoryId) || cats[0];
          return (
            <div key={l.id} className={`log-card ${cat.tone}`}>
              <div className="between" style={{marginBottom:10}}>
                <div className="row">
                  {!hideStudentColumn && stu && <Avatar student={stu} size={40}/>}
                  <div>
                    <div style={{fontWeight:600, fontSize:14}}>
                      {!hideStudentColumn && stu ? `${stu.nickname} · ${stu.firstName} ${stu.lastName}` : 'พฤติกรรม'}
                    </div>
                    <div style={{fontSize:12, color:'var(--ink-3)'}}>
                      {l.date}{stu && ` · ${stu.grade}`} · โดย {l.createdBy}
                    </div>
                  </div>
                </div>
                <span className="pill" style={{background:cat.color+'22',color:shade(cat.color,-25)}}>{cat.emoji} {cat.name}</span>
              </div>
              <div style={{fontSize:14, color:'var(--ink-2)', lineHeight:1.5}}>{l.description}</div>
              {l.peer && (
                <div style={{marginTop:8, fontSize:12, color:'var(--ink-3)'}}>
                  <Icon name="users" size={12}/> คู่กรณี/เพื่อนร่วมเหตุการณ์: <b style={{color:'var(--ink-2)'}}>{l.peer}</b>
                </div>
              )}
              {l.strengths.length>0 && (
                <div style={{marginTop:12, paddingTop:12, borderTop:'1px dashed var(--line)'}}>
                  <div style={{fontSize:11, color:'var(--ink-3)', marginBottom:6, fontWeight:500, textTransform:'uppercase', letterSpacing:'.06em'}}>character strengths</div>
                  <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
                    {l.strengths.map(s => <StrengthChip key={s} sid={s} selected/>)}
                  </div>
                </div>
              )}
              <div className="row" style={{marginTop:12, justifyContent:'flex-end'}}>
                {onEdit && (
                  <button className="btn btn-soft-violet btn-sm" onClick={()=>onEdit(l)}>
                    <Icon name="edit" size={12}/> แก้ไข
                  </button>
                )}
                <button className="btn btn-soft btn-sm" onClick={()=>{
                  if(confirm('ลบบันทึกนี้?')) dispatch({type:'log-remove',id:l.id});
                }}>
                  <Icon name="trash" size={12}/> ลบ
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {logs.length===0 && (
        <div className="card"><Empty title="ยังไม่มีบันทึก" sub="กดปุ่ม &quot;บันทึกใหม่&quot; เพื่อเริ่มต้น" icon="bolt"/></div>
      )}
    </div>
  );
}

/* Behavior Add/Edit form */
function BehaviorForm({state, preselectStudentId, initial, onCancel, onSave}){
  const cats = state.behaviorCategories || BEHAVIOR_CATEGORIES_DEFAULT;
  const [studentId, setStudentId] = useState(initial?.studentId || preselectStudentId || '');
  const [room, setRoom] = useState('all');
  const [studentQuery, setStudentQuery] = useState('');
  const [categoryId, setCategoryId] = useState(initial?.categoryId || cats[0].id);
  const [description, setDescription] = useState(initial?.description || '');
  const [peer, setPeer] = useState(initial?.peer || '');
  const [strengths, setStrengths] = useState(initial?.strengths || []);
  const [tone, setTone] = useState(initial?.tone || 'positive');
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0,10));

  const orderedRooms = ['ป.3/1','ป.3/2','ป.3/3'];
  const rooms = orderedRooms.filter(r => state.students.some(s=>s.grade===r));

  const filteredStudents = state.students.filter(s => {
    if(room!=='all' && s.grade!==room) return false;
    if(!studentQuery) return true;
    const q = studentQuery.toLowerCase();
    return (s.firstName+s.lastName+s.nickname+s.no).toLowerCase().includes(q);
  }).slice(0,12);

  const selected = state.students.find(s=>s.id===studentId);

  const toggle = (sid)=>setStrengths(arr => arr.includes(sid) ? arr.filter(x=>x!==sid) : [...arr, sid]);

  const submit = ()=>{
    if(!studentId || !description) return;
    const log = {
      studentId, categoryId, description, peer,
      strengths, tone, date,
      term: initial?.term ?? state.currentTerm,
      year: initial?.year ?? state.currentYear,
      createdBy: initial?.createdBy ?? (state.user ? (state.user.name || state.user.id) : 'ครู'),
    };
    if(!initial) log.id = 'log-' + Date.now();
    onSave(log);
  };

  // recommended strengths for this category (legacy mapping) + by group containing the cat color (just sample)
  const recommended = (STRENGTH_TAGS_BY_CAT[categoryId] || []).slice(0,8);
  const recommendedSet = new Set(recommended);
  const others = CHARACTER_STRENGTHS.filter(s => !recommendedSet.has(s.id));

  // current category meta
  const curCat = cats.find(c=>c.id===categoryId) || cats[0];

  return (
    <div>
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:24, marginTop:12}}>
        {/* Left column: student + category */}
        <div className="stack-lg">
          <div className="field">
            <label>เลือกห้องเรียน</label>
            <div className="seg" style={{width:'100%'}}>
              <button className={room==='all'?'on':''} style={{flex:1}} onClick={()=>setRoom('all')}>ทั้งหมด</button>
              {rooms.map(r=><button key={r} className={room===r?'on':''} style={{flex:1}} onClick={()=>setRoom(r)}>{r}</button>)}
            </div>
          </div>

          <div className="field">
            <label>เลือกนักเรียน</label>
            {!selected ? (
              <>
                <input value={studentQuery} onChange={e=>setStudentQuery(e.target.value)} placeholder="ค้นชื่อ/ชื่อเล่น/เลขที่..."/>
                <div style={{maxHeight:240,overflow:'auto',background:'#FFF7EF',borderRadius:14,padding:8,marginTop:8}}>
                  {filteredStudents.map(s => (
                    <div key={s.id} onClick={()=>setStudentId(s.id)}
                      style={{display:'flex',alignItems:'center',gap:10,padding:'8px 10px',borderRadius:10,cursor:'pointer'}}
                      onMouseEnter={e=>e.currentTarget.style.background='#fff'}
                      onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                      <Avatar student={s} size={32}/>
                      <div style={{flex:1}}>
                        <div style={{fontSize:13,fontWeight:600}}>{s.nickname} · {s.firstName}</div>
                        <div style={{fontSize:11, color:'var(--ink-3)'}}>{s.grade} · เลขที่ {s.no}</div>
                      </div>
                    </div>
                  ))}
                  {filteredStudents.length===0 && <div style={{padding:14, textAlign:'center', color:'var(--ink-3)', fontSize:12}}>ไม่พบนักเรียน</div>}
                </div>
              </>
            ) : (
              <div className="row" style={{background:'#FFF7EF', padding:'10px 14px', borderRadius:14, justifyContent:'space-between'}}>
                <div className="row">
                  <Avatar student={selected} size={40}/>
                  <div>
                    <div style={{fontWeight:600}}>{selected.nickname} · {selected.firstName} {selected.lastName}</div>
                    <div className="muted" style={{fontSize:12}}>{selected.grade} · เลขที่ {selected.no}</div>
                  </div>
                </div>
                <button className="btn btn-soft btn-sm" onClick={()=>setStudentId('')}>เปลี่ยน</button>
              </div>
            )}
          </div>

          <div className="field">
            <label>หมวดพฤติกรรม</label>
            <div className="grid" style={{gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
              {cats.map(c => (
                <button key={c.id} onClick={()=>setCategoryId(c.id)} style={{
                  display:'flex',alignItems:'center',gap:8,
                  padding:'12px 12px',borderRadius:14,cursor:'pointer',border:0,
                  background: categoryId===c.id ? `linear-gradient(135deg, ${c.color}, ${shade(c.color,-20)})` : '#FFF7EF',
                  color: categoryId===c.id ? '#fff' : 'var(--ink-2)',
                  fontFamily:'inherit',fontSize:13,fontWeight:500,
                  boxShadow: categoryId===c.id ? `0 8px 18px -8px ${c.color}99` : 'none',
                }}>
                  <span style={{fontSize:18}}>{c.emoji}</span>{c.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>ลักษณะของพฤติกรรม</label>
            <div className="seg" style={{width:'100%'}}>
              <button className={tone==='positive'?'on':''} onClick={()=>setTone('positive')} style={{flex:1}}>✨ เชิงบวก</button>
              <button className={tone==='neutral'?'on':''} onClick={()=>setTone('neutral')} style={{flex:1}}>😐 เป็นกลาง</button>
              <button className={tone==='concern'?'on':''} onClick={()=>setTone('concern')} style={{flex:1}}>⚠️ ควรส่งเสริม</button>
            </div>
          </div>

          <div className="field">
            <label>วันที่</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}/>
            <div className="help">บันทึกในเทอม <b>{state.currentTerm}/{state.currentYear}</b> (ตั้งค่าโดย admin)</div>
          </div>
        </div>

        {/* Right column: description, peer, strengths */}
        <div className="stack-lg">
          <div className="field">
            <label>รายละเอียดเหตุการณ์</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="เช่น วันนี้น้องช่วยเพื่อนที่ลืมขนมเอามาแบ่งกันกิน..."/>
          </div>

          <div className="field">
            <label>คู่กรณี / เพื่อนที่เกี่ยวข้อง (ถ้ามี)</label>
            <input value={peer} onChange={e=>setPeer(e.target.value)} placeholder="ชื่อเพื่อน เช่น พีท, มิ้นต์"/>
          </div>

          <div className="field">
            <label>
              <span className="row">เชื่อมโยงกับ Character Strengths
                <span className="pill" style={{marginLeft:6}}>{strengths.length} เลือก</span>
              </span>
            </label>

            {/* Highlight box showing the selected category */}
            <div style={{
              padding:'12px 16px',
              background:`linear-gradient(135deg, ${curCat.color}22, ${curCat.color}11)`,
              borderRadius:14, marginBottom:10,
              display:'flex',alignItems:'center',gap:10,
            }}>
              <div style={{
                width:36,height:36,borderRadius:10,
                background:`linear-gradient(135deg, ${curCat.color}, ${shade(curCat.color,-20)})`,
                display:'grid',placeItems:'center',color:'#fff',fontSize:18
              }}>{curCat.emoji}</div>
              <div>
                <div style={{fontSize:11,color:'var(--ink-3)',fontWeight:500}}>หมวดที่เลือก</div>
                <div style={{fontWeight:700, fontSize:14, color:shade(curCat.color,-25)}}>{curCat.name}</div>
              </div>
            </div>

            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:6,fontWeight:500}}>⭐ แนะนำสำหรับหมวด "{curCat.name}"</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6,marginBottom:14, padding:10, background:`${curCat.color}11`, borderRadius:14}}>
              {recommended.length>0 ? recommended.map(sid => <StrengthChip key={sid} sid={sid} selected={strengths.includes(sid)} onClick={()=>toggle(sid)}/>) :
                <div className="muted" style={{fontSize:12, padding:6}}>ยังไม่มีคำแนะนำสำหรับหมวดนี้</div>
              }
            </div>
            <div style={{fontSize:11,color:'var(--ink-3)',marginBottom:6,fontWeight:500}}>จุดแข็งอื่นๆ ทั้งหมด</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6, maxHeight:200, overflow:'auto', padding:10, background:'#FFF7EF', borderRadius:14}}>
              {others.map(s => <StrengthChip key={s.id} sid={s.id} selected={strengths.includes(s.id)} onClick={()=>toggle(s.id)}/>)}
            </div>
          </div>
        </div>
      </div>

      <div className="between" style={{marginTop:24, borderTop:'1px solid var(--line)', paddingTop:16}}>
        <div className="muted" style={{fontSize:12}}>ผู้บันทึก: <b style={{color:'var(--ink-2)'}}>{state.user ? (state.user.name||state.user.id) : 'ครู'}</b> · เทอม {state.currentTerm}/{state.currentYear}</div>
        <div className="row">
          <button className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit} disabled={!studentId || !description}>
            <Icon name="save" size={14}/> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageBehaviors, BehaviorLogsView, BehaviorForm });
