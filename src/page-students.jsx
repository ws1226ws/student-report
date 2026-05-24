/* === Students List page === */

function PageStudents({state, dispatch, go, grade='all', setGrade=()=>{}}){
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // student or 'new'
  const [selected, setSelected] = useState([]); // array of ids
  const [selectMode, setSelectMode] = useState(false);

  const orderedRooms = ['ป.3/1','ป.3/2','ป.3/3'];
  const grades = ['all', ...orderedRooms.filter(r=>state.students.some(s=>s.grade===r))];

  const roomOrder = (g)=>{
    const i = orderedRooms.indexOf(g);
    return i === -1 ? 999 : i;
  };
  const filtered = state.students.filter(s => {
    if(grade!=='all' && s.grade!==grade) return false;
    if(!search) return true;
    const q = search.toLowerCase();
    return [s.firstName, s.lastName, s.nickname, String(s.no)].some(x=>String(x).toLowerCase().includes(q));
  }).sort((a,b)=>{
    // ดูทั้งหมด → เรียงห้องก่อน (ป.3/1 → ป.3/2 → ป.3/3) แล้วเลขที่
    const r = roomOrder(a.grade) - roomOrder(b.grade);
    if(r !== 0) return r;
    return (a.no || 0) - (b.no || 0);
  });

  const toggleSelect = (id)=>setSelected(arr => arr.includes(id) ? arr.filter(x=>x!==id) : [...arr, id]);
  const selectAll = ()=>setSelected(filtered.map(s=>s.id));
  const clearAll = ()=>setSelected([]);

  const bulkDelete = ()=>{
    if(selected.length===0) return;
    if(!confirm(`ลบนักเรียน ${selected.length} คน? พฤติกรรมที่บันทึกไว้จะถูกลบไปด้วย`)) return;
    selected.forEach(id => dispatch({type:'student-remove', id}));
    setSelected([]);
    setSelectMode(false);
  };

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0, fontSize:24, fontWeight:700}}>นักเรียนทั้งหมด <span className="muted" style={{fontSize:15, fontWeight:500}}>({filtered.length} คน)</span></h2>
          <div className="muted" style={{marginTop:4}}>เพิ่ม ค้นหา และจัดการข้อมูลนักเรียน</div>
        </div>
        <div className="row">
          <div className="search">
            <Icon name="search" size={16} color="#8A7FA0"/>
            <input placeholder="ค้นหาด้วยชื่อ ชื่อเล่น หรือเลขที่..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className="seg">
            {grades.map(g => (
              <button key={g} className={grade===g?'on':''} onClick={()=>setGrade(g)}>{g==='all'?'ทั้งหมด':g}</button>
            ))}
          </div>
          <button className={'btn ' + (selectMode?'btn-soft-violet':'btn-ghost')} onClick={()=>{setSelectMode(!selectMode);setSelected([])}}>
            {selectMode ? '✕ ยกเลิกเลือก' : '☑️ เลือกหลายคน'}
          </button>
          <button className="btn btn-primary" onClick={()=>setEditing('new')}>
            <Icon name="plus" size={16}/> เพิ่มนักเรียน
          </button>
        </div>
      </div>

      {selectMode && (
        <div className="card tight" style={{
          background:'linear-gradient(135deg, #EDE3FF, #FFE3F0)',
          display:'flex',alignItems:'center',justifyContent:'space-between',gap:14
        }}>
          <div className="row">
            <div style={{
              width:40,height:40,borderRadius:12,background:'var(--grad-violet)',
              display:'grid',placeItems:'center',color:'#fff',fontWeight:700
            }}>{selected.length}</div>
            <div>
              <div style={{fontWeight:600}}>เลือก {selected.length} คน</div>
              <div className="muted" style={{fontSize:12}}>จากทั้งหมด {filtered.length} คน</div>
            </div>
          </div>
          <div className="row">
            <button className="btn btn-ghost btn-sm" onClick={selectAll}>เลือกทั้งหมด</button>
            <button className="btn btn-ghost btn-sm" onClick={clearAll}>ล้าง</button>
            <button className="btn btn-soft btn-sm" onClick={bulkDelete} disabled={selected.length===0}>
              <Icon name="trash" size={12}/> ลบ {selected.length} คน
            </button>
          </div>
        </div>
      )}

      {/* Card grid */}
      <div className="grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        {filtered.map(s => (
          <StudentCard key={s.id} student={s} state={state} go={go}
            onEdit={()=>setEditing(s)}
            selectMode={selectMode}
            selected={selected.includes(s.id)}
            onToggleSelect={()=>toggleSelect(s.id)}
          />
        ))}
        {filtered.length===0 && (
          <div className="card" style={{gridColumn:'1 / -1'}}>
            <Empty title="ไม่พบนักเรียน" sub="ลองเปลี่ยนคำค้นหาหรือกรองชั้น" icon="users"/>
          </div>
        )}
      </div>

      <Modal open={!!editing} onClose={()=>setEditing(null)} wide
        title={editing==='new'?'เพิ่มนักเรียนใหม่':'แก้ไขข้อมูลนักเรียน'}
        subtitle="กรอกข้อมูลให้ครบถ้วนเพื่อช่วยติดตามและดูแลเด็กๆ ได้ดีขึ้น">
        <StudentForm
          initial={editing==='new'?null:editing}
          onCancel={()=>setEditing(null)}
          onSave={(stu)=>{
            if(editing==='new') dispatch({type:'student-add', student:stu});
            else dispatch({type:'student-update', id:editing.id, patch:stu});
            setEditing(null);
          }}
          onDelete={editing && editing!=='new' ? ()=>{
            if(confirm('ลบนักเรียน '+editing.nickname+'?')){
              dispatch({type:'student-remove', id:editing.id});
              setEditing(null);
            }
          } : null}
        />
      </Modal>
    </div>
  );
}

function StudentCard({student, state, go, onEdit, selectMode, selected, onToggleSelect}){
  const logsCount = state.logs.filter(l=>l.studentId===student.id).length;
  const strSet = new Set();
  state.logs.filter(l=>l.studentId===student.id).forEach(l=>l.strengths.forEach(s=>strSet.add(s)));
  const top3 = [...strSet].slice(0,3);
  const bmi = calcBMI(student.weight, student.height);
  const cat = bmiCategoryChild(bmi, student.age, student.gender);

  const handleClick = ()=>{
    if(selectMode) onToggleSelect();
    else go('student:'+student.id);
  };

  return (
    <div className="card" style={{
      cursor:'pointer',padding:18,
      border: selected ? '3px solid var(--violet)' : '3px solid transparent',
      transform: selected ? 'scale(.98)' : 'scale(1)',
      transition:'.15s'
    }} onClick={handleClick}>
      {selectMode && (
        <div style={{
          position:'absolute', top:12, right:12, width:28, height:28, borderRadius:'50%',
          background: selected ? 'var(--grad-violet)' : '#fff',
          border: selected ? 'none' : '2px solid #E4D9EE',
          display:'grid', placeItems:'center',
          boxShadow:'var(--shadow-sm)',
          color:'#fff', fontWeight:700,
        }}>{selected ? '✓' : ''}</div>
      )}
      <div className="between" style={{marginBottom:14}}>
        <div className="row">
          <Avatar student={student} size={52}/>
          <div>
            <div style={{fontWeight:600, fontSize:15}}>{student.nickname}</div>
            <div className="muted" style={{fontSize:12}}>{student.firstName} {student.lastName}</div>
          </div>
        </div>
        {!selectMode && <span className="pill gray" style={{fontSize:11}}>เลขที่ {student.no}</span>}
      </div>

      <div className="row" style={{justifyContent:'space-between',marginBottom:14}}>
        <span className="pill violet"><Icon name={student.gender==='ชาย'?'male':'female'} size={12}/> {student.gender}</span>
        <span className="pill sky">{student.grade}</span>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12}}>
        <div style={{background:'#FFF7EF',borderRadius:12,padding:'8px 10px'}}>
          <div className="muted" style={{fontSize:10}}>BMI</div>
          <div style={{fontWeight:700,fontSize:14}}>{bmi || '—'} <span style={{fontSize:10, color:cat.color, fontWeight:500}}>{cat.label.length>8?cat.label.slice(0,7)+'…':cat.label}</span></div>
        </div>
        <div style={{background:'#FFF7EF',borderRadius:12,padding:'8px 10px'}}>
          <div className="muted" style={{fontSize:10}}>บันทึก</div>
          <div style={{fontWeight:700,fontSize:14}}>{logsCount} <span style={{fontSize:10,color:'var(--ink-3)',fontWeight:500}}>ครั้ง</span></div>
        </div>
      </div>

      {top3.length>0 && (
        <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:12}}>
          {top3.map(sid => {
            const s = CHARACTER_STRENGTHS.find(x=>x.id===sid);
            return s && <span key={sid} title={s.th} style={{fontSize:18, lineHeight:1}}>{s.emoji}</span>;
          })}
          {strSet.size>3 && <span style={{fontSize:11, color:'var(--ink-3)', alignSelf:'center'}}>+{strSet.size-3}</span>}
        </div>
      )}

      <div className="row" style={{justifyContent:'space-between',gap:8}}>
        <button className="btn btn-soft btn-sm" onClick={(e)=>{e.stopPropagation();onEdit()}}>
          <Icon name="edit" size={12}/> แก้ไข
        </button>
        <button className="btn btn-soft-violet btn-sm" onClick={(e)=>{e.stopPropagation();go('student:'+student.id)}}>
          เปิดดู <Icon name="chevron_r" size={12}/>
        </button>
      </div>
    </div>
  );
}

/* Add/Edit Form */
function StudentForm({initial, onSave, onCancel, onDelete}){
  const empty = {
    no: '',
    firstName:'', lastName:'', nickname:'',
    grade:'ป.3/1', gender:'หญิง',
    weight:'', height:'', age:8,
    conditions:'', specialNeeds:'',
    parents:[{label:'แม่',phone:''},{label:'พ่อ',phone:''}],
    photoUrl:'',
    avatarColor:'#FF6E8A',
  };
  const [f, setF] = useState(initial || empty);
  const set = (k,v)=>setF(s=>({...s,[k]:v}));
  const setParent = (i, k, v)=>setF(s=>{
    const p = s.parents.map((x,j)=>j===i?{...x,[k]:v}:x);
    return {...s, parents:p};
  });
  const colors = ['#FF6E8A','#FF8A5C','#9D7FFF','#5CC9FF','#4FD1AB','#FFC23C','#E66BD6','#7A5CFF'];
  const submit = ()=>{
    if(!f.firstName || !f.lastName) return;
    const out = {
      ...f,
      no: Number(f.no)||0,
      weight: Number(f.weight)||0,
      height: Number(f.height)||0,
      age: Number(f.age)||8,
    };
    if(!out.id) out.id = 'stu-' + Date.now();
    if(!out.conditions) out.conditions = '—';
    if(!out.specialNeeds) out.specialNeeds = '—';
    onSave(out);
  };

  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'160px 1fr',gap:24,marginTop:12}}>
        <div style={{display:'flex',flexDirection:'column',gap:14,alignItems:'center'}}>
          <PhotoSlot value={f.photoUrl} onChange={(v)=>set('photoUrl', v)} size={140}/>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,justifyContent:'center',maxWidth:160}}>
            {colors.map(c => (
              <button key={c} onClick={()=>set('avatarColor', c)} style={{
                width:24,height:24,borderRadius:'50%',border:f.avatarColor===c?'3px solid var(--ink)':'2px solid #fff',
                background:c, cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,.1)'
              }}/>
            ))}
          </div>
          <div className="help" style={{textAlign:'center'}}>เลือกสีหรืออัปโหลดรูปจริง</div>
        </div>

        <div className="grid" style={{gridTemplateColumns:'1fr 1fr 100px', gap:14}}>
          <div className="field"><label>ชื่อจริง</label>
            <input value={f.firstName} onChange={e=>set('firstName',e.target.value)} placeholder="เช่น ปาลิตา"/></div>
          <div className="field"><label>นามสกุล</label>
            <input value={f.lastName} onChange={e=>set('lastName',e.target.value)} placeholder="เช่น ใจดี"/></div>
          <div className="field"><label>เลขที่</label>
            <input value={f.no} onChange={e=>set('no',e.target.value)} placeholder="1"/></div>

          <div className="field"><label>ชื่อเล่น</label>
            <input value={f.nickname} onChange={e=>set('nickname',e.target.value)} placeholder="เช่น ฟ้า"/></div>
          <div className="field"><label>ชั้น/ห้อง</label>
            <select value={f.grade} onChange={e=>set('grade',e.target.value)}>
              <option>ป.3/1</option><option>ป.3/2</option><option>ป.3/3</option>
            </select></div>
          <div className="field"><label>อายุ</label>
            <input value={f.age} onChange={e=>set('age',e.target.value)} placeholder="8"/></div>

          <div className="field"><label>เพศ</label>
            <div className="seg" style={{width:'100%'}}>
              {['หญิง','ชาย'].map(g => (
                <button key={g} className={f.gender===g?'on':''} onClick={()=>set('gender',g)} style={{flex:1}}>{g}</button>
              ))}
            </div>
          </div>
          <div className="field"><label>น้ำหนัก (kg)</label>
            <input value={f.weight} onChange={e=>set('weight',e.target.value)} placeholder="24"/></div>
          <div className="field"><label>ส่วนสูง (cm)</label>
            <input value={f.height} onChange={e=>set('height',e.target.value)} placeholder="125"/></div>

          <div className="field" style={{gridColumn:'1 / 4'}}>
            <label>โรคประจำตัว / แพ้ยา / แพ้อาหาร</label>
            <input value={f.conditions==='—'?'':f.conditions} onChange={e=>set('conditions',e.target.value)} placeholder="เช่น หอบหืด, แพ้นมวัว — เว้นว่างถ้าไม่มี"/>
          </div>
          <div className="field" style={{gridColumn:'1 / 4'}}>
            <label>ความจำเป็นต้องการดูแลพิเศษ</label>
            <textarea value={f.specialNeeds==='—'?'':f.specialNeeds} onChange={e=>set('specialNeeds',e.target.value)} placeholder="เช่น ต้องใช้ยาพ่นก่อนออกกำลังกาย, สมาธิสั้น ต้องเตือนเป็นระยะ"/>
          </div>

          <div className="field" style={{gridColumn:'1 / 4'}}>
            <label>เบอร์ติดต่อผู้ปกครอง</label>
            <div className="stack">
              {f.parents.map((p,i)=>(
                <div key={i} style={{display:'grid',gridTemplateColumns:'140px 1fr 40px',gap:10}}>
                  <input value={p.label} onChange={e=>setParent(i,'label',e.target.value)} placeholder="ชื่อความสัมพันธ์ เช่น แม่"
                    style={{background:'#FFF7EF',border:'1.5px solid transparent',borderRadius:14,padding:'10px 14px',fontSize:14}}/>
                  <input value={p.phone} onChange={e=>setParent(i,'phone',e.target.value)} placeholder="08x-xxx-xxxx"
                    style={{background:'#FFF7EF',border:'1.5px solid transparent',borderRadius:14,padding:'10px 14px',fontSize:14}}/>
                  <button onClick={()=>setF(s=>({...s,parents:s.parents.filter((_,j)=>j!==i)}))} style={{
                    border:0,background:'#FFE3D6',borderRadius:14,cursor:'pointer',color:'#C24B5C'
                  }}><Icon name="trash" size={14}/></button>
                </div>
              ))}
              {f.parents.length<2 && (
                <button className="btn btn-soft btn-sm" onClick={()=>setF(s=>({...s,parents:[...s.parents,{label:'ผู้ปกครอง',phone:''}]}))} style={{alignSelf:'flex-start'}}>
                  <Icon name="plus" size={12}/> เพิ่มเบอร์
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="between" style={{marginTop:24, borderTop:'1px solid var(--line)', paddingTop:16}}>
        <div>
          {onDelete && (
            <button className="btn btn-soft btn-sm" onClick={onDelete}>
              <Icon name="trash" size={12}/> ลบนักเรียน
            </button>
          )}
        </div>
        <div className="row">
          <button className="btn btn-ghost" onClick={onCancel}>ยกเลิก</button>
          <button className="btn btn-primary" onClick={submit}><Icon name="save" size={14}/> บันทึก</button>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageStudents, StudentForm });
