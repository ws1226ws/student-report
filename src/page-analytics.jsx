/* === Analytics Page === */

function PageAnalytics({state, go}){
  const [scope, setScope] = useState('grade'); // grade / room / individual
  const [room, setRoom] = useState('ป.3/1');
  const [individualRoom, setIndividualRoom] = useState('ป.3/1');
  const [studentId, setStudentId] = useState(state.students[0]?.id);

  // Term filter — year is locked to admin's currentYear
  const [termMode, setTermMode] = useState('term'); // 'term' | 'year'
  const [filterTerm, setFilterTerm] = useState(state.currentTerm);
  const filterYear = state.currentYear;

  // category drill (modal)
  const [drillCat, setDrillCat] = useState(null);

  const orderedRooms = ['ป.3/1','ป.3/2','ป.3/3'];
  const rooms = orderedRooms.filter(r => state.students.some(s=>s.grade===r));

  // Apply term filter (always within admin's currentYear)
  const inTerm = (l) => {
    if(l.year !== filterYear) return false;
    if(termMode==='year') return true;
    return l.term===filterTerm;
  };

  let scopeStudents = state.students;
  let logsAll = state.logs.filter(inTerm);
  let label = 'ทั้งชั้น ป.3';

  if(scope==='room'){
    scopeStudents = state.students.filter(s=>s.grade===room);
    const ids = new Set(scopeStudents.map(s=>s.id));
    logsAll = logsAll.filter(l=>ids.has(l.studentId));
    label = 'ห้อง ' + room;
  } else if(scope==='individual'){
    scopeStudents = state.students.filter(s=>s.id===studentId);
    logsAll = logsAll.filter(l=>l.studentId===studentId);
    const s = state.students.find(x=>x.id===studentId);
    label = s ? `${s.nickname} (${s.firstName})` : '';
  }

  // when individual: ensure studentId is in selected room
  useEffect(()=>{
    if(scope==='individual'){
      const sId = state.students.find(s=>s.id===studentId);
      if(!sId || sId.grade !== individualRoom){
        const first = state.students.find(s=>s.grade===individualRoom);
        if(first) setStudentId(first.id);
      }
    }
  }, [scope, individualRoom]);

  const logs = logsAll;

  // by category
  const catCount = {};
  state.behaviorCategories.forEach(c=>catCount[c.id]=0);
  logs.forEach(l => { catCount[l.categoryId] = (catCount[l.categoryId]||0)+1; });

  // by tone
  const toneCount = {positive:0, neutral:0, concern:0};
  logs.forEach(l => { toneCount[l.tone||'positive'] = (toneCount[l.tone||'positive']||0)+1; });

  // strengths
  const strCount = {};
  logs.forEach(l => l.strengths.forEach(s => strCount[s] = (strCount[s]||0)+1));

  const sortedStrengths = [...state.characterStrengths].sort((a,b)=>(strCount[b.id]||0)-(strCount[a.id]||0));
  const top = sortedStrengths.slice(0,5);
  const bottom = sortedStrengths.slice(-5).reverse();

  // monthly trend (use filtered logs)
  const months = [];
  for(let i=5;i>=0;i--){
    const d = new Date();
    d.setMonth(d.getMonth()-i);
    months.push({label:['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'][d.getMonth()], y:d.getFullYear(), m:d.getMonth()});
  }
  const monthly = months.map(m => {
    const c = logs.filter(l => {
      const ld = new Date(l.date);
      return ld.getMonth()===m.m && ld.getFullYear()===m.y;
    }).length;
    return {label:m.label, value:c};
  });

  // Per-student rankings (active students)
  const perStudent = scopeStudents.map(s => {
    const sl = state.logs.filter(inTerm).filter(l=>l.studentId===s.id);
    const sCount = {};
    sl.forEach(l=>l.strengths.forEach(x=>sCount[x]=(sCount[x]||0)+1));
    const topStrength = Object.entries(sCount).sort((a,b)=>b[1]-a[1])[0];
    return {student:s, count:sl.length, topStrength: topStrength ? state.characterStrengths.find(x=>x.id===topStrength[0]) : null};
  }).sort((a,b)=>b.count-a.count);

  // % helpers
  const totalLogs = logs.length || 1;
  const pctPositive = Math.round((toneCount.positive/totalLogs)*100);
  const pctNegative = Math.round((toneCount.concern/totalLogs)*100);
  const pctNeutral = Math.round((toneCount.neutral/totalLogs)*100);

  const termLabel = termMode==='year' ? `ปีการศึกษา ${filterYear} (ทั้งปี)` :
                    `เทอม ${filterTerm}/${filterYear}`;

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0, fontSize:24, fontWeight:700}}>สรุปผล</h2>
          <div className="muted" style={{marginTop:4}}>{termLabel} · <b style={{color:'var(--ink)'}}>{label}</b></div>
        </div>
        <Tabs value={scope} onChange={setScope} options={[
          {value:'grade', label:'ทั้งชั้น ป.3'},
          {value:'room', label:'รายห้อง'},
          {value:'individual', label:'รายบุคคล'},
        ]}/>
      </div>

      {/* Term filter row — year is locked to admin setting */}
      <div className="card tight">
        <div className="row" style={{flexWrap:'wrap',gap:14, justifyContent:'space-between'}}>
          <div className="row" style={{gap:10}}>
            <span style={{fontSize:13,fontWeight:600,color:'var(--ink-2)'}}>📅 ช่วงเวลา:</span>
            <span className="pill violet" style={{padding:'7px 14px',fontWeight:600}}>ปีการศึกษา {filterYear}</span>
            <div className="seg">
              <button className={termMode==='term'?'on':''} onClick={()=>setTermMode('term')}>รายเทอม</button>
              <button className={termMode==='year'?'on':''} onClick={()=>setTermMode('year')}>ทั้งปี</button>
            </div>
            {termMode==='term' && (
              <div className="seg">
                <button className={filterTerm===1?'on':''} onClick={()=>setFilterTerm(1)}>เทอม 1</button>
                <button className={filterTerm===2?'on':''} onClick={()=>setFilterTerm(2)}>เทอม 2</button>
              </div>
            )}
          </div>
          <div className="muted" style={{fontSize:12}}>* ปีการศึกษากำหนดจากผู้ดูแลระบบ</div>
        </div>
      </div>

      {scope==='room' && (
        <div className="seg" style={{alignSelf:'flex-start'}}>
          {rooms.map(r=><button key={r} className={room===r?'on':''} onClick={()=>setRoom(r)}>{r}</button>)}
        </div>
      )}

      {scope==='individual' && (
        <div className="card tight">
          <div className="row" style={{gap:14}}>
            <div className="field" style={{flex:1}}>
              <label>ขั้นที่ 1: เลือกห้องเรียน</label>
              <div className="seg" style={{width:'100%'}}>
                {rooms.map(r=><button key={r} className={individualRoom===r?'on':''} style={{flex:1}} onClick={()=>setIndividualRoom(r)}>{r}</button>)}
              </div>
            </div>
            <div className="field" style={{flex:2}}>
              <label>ขั้นที่ 2: เลือกนักเรียน</label>
              <select value={studentId} onChange={e=>setStudentId(e.target.value)}>
                {state.students.filter(s=>s.grade===individualRoom).sort((a,b)=>a.no-b.no).map(s => (
                  <option key={s.id} value={s.id}>เลขที่ {s.no} · {s.nickname} ({s.firstName} {s.lastName})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* KPI row */}
      <div className="grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        <StatCard label="บันทึกทั้งหมด" value={logs.length} sub={termLabel} icon="bolt" tone="primary"/>
        <StatCard label="เชิงบวก" value={`${toneCount.positive}`} sub={`${pctPositive}% ของทั้งหมด`} icon="smile" tone="mint"/>
        <StatCard label="ควรส่งเสริม (เชิงลบ)" value={`${toneCount.concern}`} sub={`${pctNegative}% ของทั้งหมด`} icon="flag" tone="sun"/>
        <StatCard label="จุดแข็งที่พบ" value={`${Object.keys(strCount).length}/${state.characterStrengths.length}`} sub="หลากหลาย" icon="star" tone="violet"/>
      </div>

      {/* Individual student profile snapshot */}
      {scope==='individual' && <IndividualSnapshot state={state} studentId={studentId} go={go}/>}

      {/* Monthly trend + Category breakdown */}
      <div className="grid" style={{gridTemplateColumns:'1.3fr 1fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="chart" size={16} color="#fff"/></div> บันทึกพฤติกรรมรายเดือน</div>
            <span className="pill">6 เดือนล่าสุด</span>
          </div>
          <Line data={monthly} color="#FF6E8A" height={210} width={620}/>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="grid" size={16} color="#fff"/></div> หมวดพฤติกรรม</div>
            <span className="muted" style={{fontSize:11}}>คลิกเพื่อดูรายละเอียด</span>
          </div>
          <div className="stack">
            {state.behaviorCategories.map(c => {
              const v = catCount[c.id] || 0;
              const max = Math.max(1, ...Object.values(catCount));
              return (
                <div key={c.id} onClick={()=>setDrillCat(c.id)} style={{cursor:'pointer', borderRadius:12, padding:'8px 6px', transition:'.15s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='#FFF7EF'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <div className="row" style={{justifyContent:'space-between',marginBottom:6}}>
                    <span style={{fontSize:13, fontWeight:500}}>{c.emoji} {c.name}</span>
                    <span style={{fontWeight:600,fontSize:13,color:shade(c.color,-20)}}>{v}</span>
                  </div>
                  <div className="bar"><i style={{
                    width:((v/max)*100)+'%',
                    background:`linear-gradient(90deg, ${c.color}, ${shade(c.color,-15)})`
                  }}/></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Strengths top/bottom */}
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="star" size={16} color="#fff"/></div> Top 5 จุดแข็งที่โดดเด่น</div>
          </div>
          <BarList rows={top.map(s => ({label:s.th, value:strCount[s.id]||0, color:s.color, emoji:s.emoji}))}/>
        </div>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="sparkle" size={16} color="#fff"/></div> 5 จุดแข็งที่ควรส่งเสริม</div>
          </div>
          <BarList rows={bottom.map(s => ({label:s.th, value:strCount[s.id]||0, color:s.color, emoji:s.emoji}))}/>
        </div>
      </div>

      {/* Per-student leaderboard (for grade/room views) */}
      {scope!=='individual' && (
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-mint)'}}><Icon name="users" size={16} color="#fff"/></div> สรุปรายบุคคล · {label}</div>
            <span className="pill mint">{perStudent.length} คน</span>
          </div>
          <table className="tbl">
            <thead><tr>
              <th>อันดับ</th><th>นักเรียน</th><th>ชั้น</th><th>บันทึก</th><th>จุดแข็งเด่น</th><th></th>
            </tr></thead>
            <tbody>
              {perStudent.slice(0,15).map((row,i) => (
                <tr key={row.student.id}>
                  <td>
                    <span style={{
                      display:'inline-grid',placeItems:'center',
                      width:28,height:28,borderRadius:'50%',
                      background: i<3 ? ['#FFC23C','#C0C0C0','#CD7F32'][i] : '#FFEDE2',
                      color: i<3 ? '#fff':'var(--ink-2)', fontWeight:700, fontSize:13
                    }}>{i+1}</span>
                  </td>
                  <td><div className="row"><Avatar student={row.student} size={32}/><div>
                    <div style={{fontWeight:600}}>{row.student.nickname}</div>
                    <div className="muted" style={{fontSize:11}}>{row.student.firstName} {row.student.lastName}</div>
                  </div></div></td>
                  <td>{row.student.grade}</td>
                  <td><b>{row.count}</b> ครั้ง</td>
                  <td>
                    {row.topStrength ? (
                      <span className="pill" style={{background:row.topStrength.color+'22',color:shade(row.topStrength.color,-25)}}>
                        {row.topStrength.emoji} {row.topStrength.th}
                      </span>
                    ) : <span className="muted">—</span>}
                  </td>
                  <td><button className="btn btn-soft btn-sm" onClick={()=>go('student:'+row.student.id)}>ดู <Icon name="chevron_r" size={11}/></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Term summary text */}
      <div className="card" style={{
        background:'linear-gradient(135deg, #FFE3F0 0%, #FFEFE2 100%)'
      }}>
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="sparkle" size={16} color="#fff"/></div> 📝 สรุปภาพรวม · {termLabel} · {label}</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(3, 1fr)',gap:14}}>
          <SummaryBox color="#FF6E8A" emoji="📊" title="พฤติกรรมที่บันทึก"
            text={`มีการบันทึกพฤติกรรมรวม ${logs.length} ครั้ง ครอบคลุม ${scopeStudents.length} คน — เฉลี่ย ${(logs.length/(scopeStudents.length||1)).toFixed(1)} ครั้ง/คน`}/>
          <SummaryBox color="#4FD1AB" emoji="🌟" title="พฤติกรรมเชิงบวก"
            text={`พบพฤติกรรมเชิงบวก ${toneCount.positive} ครั้ง (${pctPositive}%) เป็นกลาง ${toneCount.neutral} ครั้ง (${pctNeutral}%) — เป็นสัญญาณดีของห้องเรียน`}/>
          <SummaryBox color="#FF8A5C" emoji="⚠️" title="พฤติกรรมที่ควรส่งเสริม"
            text={`พฤติกรรมเชิงลบ/ที่ต้องเสริม ${toneCount.concern} ครั้ง คิดเป็น ${pctNegative}% ของทั้งหมด ${pctNegative>20?'— ควรติดตามอย่างใกล้ชิด':'— อยู่ในระดับเฝ้าระวังปกติ'}`}/>
        </div>
      </div>

      {/* Category drill modal */}
      <Modal open={!!drillCat} onClose={()=>setDrillCat(null)} wide
        title={(()=>{
          const c = state.behaviorCategories.find(x=>x.id===drillCat);
          return c ? `${c.emoji} ${c.name}` : '';
        })()}>
        {drillCat && <CategoryDrill state={state} catId={drillCat} logs={logs}/>}
      </Modal>
    </div>
  );
}

/* Individual snapshot card: profile + health */
function IndividualSnapshot({state, studentId, go}){
  const s = state.students.find(x=>x.id===studentId);
  if(!s) return null;
  const bmi = calcBMI(s.weight, s.height);
  const cat = bmiCategoryChild(bmi, s.age, s.gender);
  return (
    <div className="card" style={{padding:0, overflow:'hidden'}}>
      <div style={{
        background:`linear-gradient(135deg, ${s.avatarColor}, ${shade(s.avatarColor,-30)})`,
        padding:'22px 26px', color:'#fff',
        display:'flex',alignItems:'center',gap:22, position:'relative'
      }}>
        <div style={{padding:5, background:'#fff', borderRadius:'50%'}}>
          <Avatar student={s} size={80}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontSize:24, fontWeight:700}}>{s.nickname}</div>
          <div style={{opacity:.9,fontSize:14}}>{s.firstName} {s.lastName} · {s.grade} · เลขที่ {s.no}</div>
          <div className="row" style={{marginTop:8, gap:6}}>
            <span style={{background:'rgba(255,255,255,.22)',padding:'4px 10px',borderRadius:999,fontSize:12,fontWeight:500}}>
              {s.gender} · {s.age} ปี
            </span>
            <span style={{background:'rgba(255,255,255,.22)',padding:'4px 10px',borderRadius:999,fontSize:12,fontWeight:500}}>
              ⚖️ {s.weight} kg
            </span>
            <span style={{background:'rgba(255,255,255,.22)',padding:'4px 10px',borderRadius:999,fontSize:12,fontWeight:500}}>
              📏 {s.height} cm
            </span>
          </div>
        </div>
        <button className="btn" style={{background:'rgba(255,255,255,.95)',color:'#C24B5C'}} onClick={()=>go('student:'+s.id)}>
          เปิดข้อมูลเต็ม <Icon name="chevron_r" size={14}/>
        </button>
      </div>

      <div style={{padding:'18px 26px', display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14}}>
        <HealthMini label="BMI" value={bmi || '—'} sub={cat.label} color={cat.color} emoji="📊"/>
        <HealthMini label="โรค/แพ้" value={s.conditions || '—'} color="#FF6E8A" emoji="💊"/>
        <HealthMini label="ดูแลพิเศษ" value={s.specialNeeds || '—'} color="#9D7FFF" emoji="⭐"/>
      </div>
    </div>
  );
}

function HealthMini({label, value, sub, color, emoji}){
  return (
    <div style={{background:'#FFF7EF', borderRadius:14, padding:'12px 14px'}}>
      <div className="row" style={{gap:8, marginBottom:4}}>
        <span style={{fontSize:18}}>{emoji}</span>
        <div className="muted" style={{fontSize:11, fontWeight:500}}>{label}</div>
      </div>
      <div style={{fontSize:15, fontWeight:600, color:color||'var(--ink)'}}>{value}</div>
      {sub && <div style={{fontSize:11, color:'var(--ink-3)'}}>{sub}</div>}
    </div>
  );
}

function CategoryDrill({state, catId, logs}){
  const c = state.behaviorCategories.find(x=>x.id===catId);
  if(!c) return null;
  const inCat = logs.filter(l=>l.categoryId===catId).sort((a,b)=>b.date.localeCompare(a.date));

  return (
    <div className="stack-lg" style={{marginTop:8}}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row">
          <div style={{
            width:56,height:56,borderRadius:18,
            background:`linear-gradient(135deg, ${c.color}, ${shade(c.color,-20)})`,
            display:'grid',placeItems:'center',color:'#fff',fontSize:28,
            boxShadow:`0 12px 24px -10px ${c.color}99`
          }}>{c.emoji}</div>
          <div>
            <div style={{fontWeight:700,fontSize:18}}>{c.name}</div>
            <div className="muted" style={{fontSize:13}}>หมวดพฤติกรรม</div>
          </div>
        </div>
        <span className="pill" style={{background:c.color+'22',color:shade(c.color,-25),fontSize:13}}>{inCat.length} บันทึก</span>
      </div>

      <div style={{maxHeight:480, overflow:'auto', display:'flex',flexDirection:'column',gap:10}}>
        {inCat.map(l => {
          const stu = state.students.find(s=>s.id===l.studentId);
          return (
            <div key={l.id} className="log-card" style={{borderLeftColor:c.color}}>
              <div className="between" style={{marginBottom:8}}>
                <div className="row">
                  {stu && <Avatar student={stu} size={36}/>}
                  <div>
                    <div style={{fontWeight:600,fontSize:14}}>{stu ? `${stu.nickname} · ${stu.firstName}` : 'นักเรียน'}</div>
                    <div style={{fontSize:12,color:'var(--ink-3)'}}>{l.date}{stu && ` · ${stu.grade}`} · โดย {l.createdBy}</div>
                  </div>
                </div>
                <span className="pill" style={{
                  background: l.tone==='positive'?'#D7F4E8':l.tone==='concern'?'#FFE0EA':'#F1ECF5',
                  color: l.tone==='positive'?'#1F8867':l.tone==='concern'?'#C24B5C':'#6A6082',
                }}>
                  {l.tone==='positive'?'✨ เชิงบวก':l.tone==='concern'?'⚠️ ส่งเสริม':'😐 เป็นกลาง'}
                </span>
              </div>
              <div style={{fontSize:13, color:'var(--ink-2)'}}>{l.description}</div>
              {l.strengths.length>0 && (
                <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                  {l.strengths.map(s => <StrengthChip key={s} sid={s} selected/>)}
                </div>
              )}
            </div>
          );
        })}
        {inCat.length===0 && <Empty title="ยังไม่มีบันทึก" sub="ในหมวดนี้และช่วงเวลานี้" icon="bolt"/>}
      </div>
    </div>
  );
}

function SummaryBox({color, emoji, title, text}){
  return (
    <div style={{background:'#fff', borderRadius:18, padding:16, boxShadow:'var(--shadow-sm)'}}>
      <div className="row" style={{gap:10, marginBottom:8}}>
        <div style={{width:36,height:36,borderRadius:12,background:`linear-gradient(135deg, ${color}, ${shade(color,-20)})`,display:'grid',placeItems:'center',fontSize:18,color:'#fff'}}>{emoji}</div>
        <div style={{fontWeight:700,fontSize:14}}>{title}</div>
      </div>
      <div style={{fontSize:13, color:'var(--ink-2)', lineHeight:1.5}}>{text}</div>
    </div>
  );
}

Object.assign(window, { PageAnalytics });
