/* === 24 Character Strengths Page === */

function PageStrengths({state, go}){
  const [scope, setScope] = useState('grade'); // grade, room, individual
  const [room, setRoom] = useState('all');
  const [studentId, setStudentId] = useState(state.students[0]?.id);
  const [tab, setTab] = useState('top'); // top, encourage
  const [drillSid, setDrillSid] = useState(null);

  const rooms = ['ป.3/1','ป.3/2','ป.3/3'];
  const scopeStudents = (()=>{
    if(scope==='individual') return state.students.filter(s=>s.id===studentId);
    if(scope==='room' && room!=='all') return state.students.filter(s=>s.grade===room);
    return state.students;
  })();
  const scopeIds = new Set(scopeStudents.map(s=>s.id));
  const logs = state.logs.filter(l=>scopeIds.has(l.studentId));

  const label = scope==='individual'
    ? (state.students.find(x=>x.id===studentId)?.nickname || '—')
    : (scope==='room' ? (room==='all'?'ทั้งชั้น':'ห้อง '+room) : 'ทั้งชั้น ป.3');

  // counts: positive (from non-concern logs), concern (from concern logs)
  const counts = {};       // overall presence count
  const countsPos = {};    // positive/neutral counts (“โดดเด่น”)
  const countsConcern = {};// concern counts (“ควรส่งเสริม”)
  logs.forEach(l => l.strengths.forEach(sid => {
    counts[sid] = (counts[sid]||0)+1;
    if(l.tone==='concern') countsConcern[sid] = (countsConcern[sid]||0)+1;
    else countsPos[sid] = (countsPos[sid]||0)+1;
  }));

  // per-group totals (“โดดเด่น” = positive counts per group)
  const byGroup = state.strengthGroups.map(g => {
    const inGroup = state.characterStrengths.filter(s=>s.group===g.name);
    const sum = inGroup.reduce((s,x)=>s+(countsPos[x.id]||0), 0);
    return {label:g.name, value:sum, color:g.color, emoji:g.emoji, count:inGroup.length};
  });

  // “ควรส่งเสริม” = concern counts per group (only from teacher-marked concerns)
  const concernByGroup = state.strengthGroups.map(g => {
    const inGroup = state.characterStrengths.filter(s=>s.group===g.name);
    const sum = inGroup.reduce((s,x)=>s+(countsConcern[x.id]||0), 0);
    return {label:g.name, value:sum, color:g.color, emoji:g.emoji, count:inGroup.length};
  });

  // sort strengths
  const sortedTop = [...state.characterStrengths].sort((a,b)=>(countsPos[b.id]||0)-(countsPos[a.id]||0));
  const top = sortedTop.filter(s=>(countsPos[s.id]||0)>0).slice(0, 8);

  const sortedConcern = [...state.characterStrengths].sort((a,b)=>(countsConcern[b.id]||0)-(countsConcern[a.id]||0));
  const encourage = sortedConcern.filter(s=>(countsConcern[s.id]||0)>0).slice(0, 8);

  // for radar normalization: max
  const maxGroup = Math.max(1, ...byGroup.map(g=>g.value));
  const maxConcern = Math.max(1, ...concernByGroup.map(g=>g.value));

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0, fontSize:24, fontWeight:700}}>24 Character Strengths</h2>
          <div className="muted" style={{marginTop:4}}>จุดแข็งที่โดดเด่นและที่ควรส่งเสริม · ปัจจุบัน: <b style={{color:'var(--ink)'}}>{label}</b></div>
        </div>
        <Tabs value={scope} onChange={setScope} options={[
          {value:'grade', label:'ภาพรวมทั้งชั้น'},
          {value:'room', label:'รายห้อง'},
          {value:'individual', label:'รายบุคคล'},
        ]}/>
      </div>

      {scope==='room' && (
        <div className="seg" style={{alignSelf:'flex-start'}}>
          <button className={room==='all'?'on':''} onClick={()=>setRoom('all')}>ทั้งหมด</button>
          {rooms.map(r=><button key={r} className={room===r?'on':''} onClick={()=>setRoom(r)}>{r}</button>)}
        </div>
      )}

      {scope==='individual' && (
        <div className="card tight" style={{maxWidth:600}}>
          <div className="row" style={{gap:12}}>
            <div className="field" style={{flex:1}}>
              <label>เลือกห้อง</label>
              <div className="seg" style={{width:'100%'}}>
                <button className={room==='all'?'on':''} style={{flex:1}} onClick={()=>setRoom('all')}>ทั้งหมด</button>
                {rooms.map(r=><button key={r} className={room===r?'on':''} style={{flex:1}} onClick={()=>setRoom(r)}>{r}</button>)}
              </div>
            </div>
            <div className="field" style={{flex:1.4}}>
              <label>เลือกนักเรียน</label>
              <select value={studentId} onChange={e=>setStudentId(e.target.value)}>
                {state.students.filter(s=>room==='all'||s.grade===room).sort((a,b)=>a.no-b.no).map(s => (
                  <option key={s.id} value={s.id}>เลขที่ {s.no} · {s.nickname} ({s.firstName} {s.lastName})</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Two radars side-by-side */}
      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card" style={{background:'linear-gradient(135deg,#FFF8EF,#FFEDE2)'}}>
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="star" size={16} color="#fff"/></div> 6 ด้านที่โดดเด่น</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <Radar
              values={byGroup.map(g => Math.min(5, (g.value/maxGroup)*5))}
              labels={byGroup.map(g => g.emoji+' '+g.label.split('การ').pop().slice(0,8))}
              size={260} color="#FF6E8A"/>
            <div className="stack" style={{flex:1, fontSize:13}}>
              {byGroup.sort((a,b)=>b.value-a.value).map(g => (
                <div key={g.label} className="row" style={{justifyContent:'space-between'}}>
                  <span className="row" style={{gap:6}}>
                    <span style={{width:10,height:10,borderRadius:3,background:g.color}}/>
                    <span style={{fontWeight:500}}>{g.emoji} {g.label}</span>
                  </span>
                  <span style={{fontWeight:700, color:shade(g.color,-20)}}>{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card" style={{background:'linear-gradient(135deg,#EDE3FF,#DCEEFF)'}}>
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="sparkle" size={16} color="#fff"/></div> 6 ด้านที่ควรส่งเสริม</div>
          </div>
          <div style={{display:'flex', alignItems:'center', gap:14}}>
            <Radar
              values={concernByGroup.map(g => Math.min(5, (g.value/maxConcern)*5))}
              labels={concernByGroup.map(g => g.emoji+' '+g.label.split('การ').pop().slice(0,8))}
              size={260} color="#9D7FFF"/>
            <div className="stack" style={{flex:1, fontSize:13}}>
              {concernByGroup.sort((a,b)=>b.value-a.value).map(g => (
                <div key={g.label} className="row" style={{justifyContent:'space-between'}}>
                  <span className="row" style={{gap:6}}>
                    <span style={{width:10,height:10,borderRadius:3,background:g.color}}/>
                    <span style={{fontWeight:500}}>{g.emoji} {g.label}</span>
                  </span>
                  <span style={{fontWeight:700, color:shade(g.color,-20)}}>{g.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab: top / encourage cards */}
      <div className="card">
        <div className="card-title">
          <div className="t">
            <div className="ic" style={{background: tab==='top'?'var(--grad-sun)':'var(--grad-violet)'}}>
              <Icon name={tab==='top'?'star':'sparkle'} size={16} color="#fff"/>
            </div>
            {tab==='top' ? 'จุดแข็งที่โดดเด่น' : 'จุดแข็งที่ควรส่งเสริม'}
          </div>
          <Tabs value={tab} onChange={setTab} options={[
            {value:'top', label:'🌟 โดดเด่น'},
            {value:'encourage', label:'🌱 ควรส่งเสริม'},
          ]}/>
        </div>
        <div className="muted" style={{fontSize:12, marginBottom:12}}>
          {tab==='top'
            ? '👆 คลิกที่จุดแข็งเพื่อดูรายชื่อนักเรียนที่มีจุดแข็งนี้'
            : '⚠️ รายการพฤติกรรมที่ครูกดลังเรียนว่า “ควรส่งเสริม” เท่านั้น (ยังไม่ได้บันทึก = ยังไม่วิเคราะห์)'
          }
        </div>
        <div className="grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
          {(tab==='top'?top:encourage).map(s => (
            <StrengthCard key={s.id} s={s} count={tab==='top'?(countsPos[s.id]||0):(countsConcern[s.id]||0)} mode={tab} onClick={()=>setDrillSid(s.id)}/>
          ))}
          {(tab==='top'?top:encourage).length===0 && (
            <div style={{gridColumn:'1 / -1'}}>
              <Empty
                title={tab==='top'?'ยังไม่มีข้อมูล':'ยังไม่มีพฤติกรรมที่ควรส่งเสริม'}
                sub={tab==='top'?'รอครูบันทึกพฤติกรรมเชิงบวก':'จะปรากฏเมื่อครูระบุพฤติกรรมเป็น “⚠️ ควรส่งเสริม”'}
                icon="star"/>
            </div>
          )}
        </div>
      </div>

      {/* All 24 grid */}
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="grid" size={16} color="#fff"/></div> ครบทั้ง {state.characterStrengths.length} จุดแข็ง</div>
          <div className="muted">แตะที่จุดแข็งเพื่อดูรายชื่อนักเรียน</div>
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:10}}>
          {state.characterStrengths.map(s => {
            const vPos = countsPos[s.id] || 0;
            const vConcern = countsConcern[s.id] || 0;
            const has = vPos>0 || vConcern>0;
            return (
              <div key={s.id} onClick={()=>setDrillSid(s.id)} style={{
                background: has ? `linear-gradient(135deg, ${s.color}, ${shade(s.color,-15)})` : '#FFF4ED',
                color: has ? '#fff' : 'var(--ink-3)',
                padding:'12px 10px',borderRadius:14,textAlign:'center',
                minHeight:88,display:'flex',flexDirection:'column',justifyContent:'space-between',gap:4,
                boxShadow: has ? `0 6px 14px -8px ${s.color}` : 'none',
                cursor:'pointer',transition:'.15s',
              }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateY(-2px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='translateY(0)'}>
                <div style={{fontSize:20}}>{s.image ? <img src={s.image} alt="" style={{width:24,height:24,borderRadius:6,objectFit:'cover'}}/> : s.emoji}</div>
                <div style={{fontSize:11, fontWeight:500, lineHeight:1.2}}>{s.th}</div>
                <div className="row" style={{justifyContent:'center',gap:6,fontSize:11,fontWeight:700}}>
                  {vPos>0 && <span title="โดดเด่น">🌟{vPos}</span>}
                  {vConcern>0 && <span title="ควรส่งเสริม">⚠️{vConcern}</span>}
                  {!has && '—'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drill modal */}
      <Modal open={!!drillSid} onClose={()=>setDrillSid(null)} wide
        title={(() => {
          const s = state.characterStrengths.find(x=>x.id===drillSid);
          return s ? `${s.emoji} ${s.th}` : '';
        })()}>
        {drillSid && <StrengthDrill state={state} sid={drillSid} go={go} onClose={()=>setDrillSid(null)} scopeStudents={scopeStudents}/>}
      </Modal>
    </div>
  );
}

function StrengthCard({s, count, mode, onClick}){
  return (
    <div onClick={onClick} className="card" style={{padding:18, position:'relative', overflow:'hidden',cursor:'pointer'}}>
      <div style={{
        position:'absolute',top:-30,right:-30,width:120,height:120,borderRadius:'50%',
        background:`linear-gradient(135deg, ${s.color}33, ${s.color}11)`, filter:'blur(2px)'
      }}/>
      <div style={{position:'relative'}}>
        <div style={{
          width:54,height:54,borderRadius:18,
          background:`linear-gradient(135deg, ${s.color}, ${shade(s.color,-20)})`,
          display:'grid',placeItems:'center',fontSize:28,color:'#fff',
          boxShadow:`0 10px 22px -8px ${s.color}99`, overflow:'hidden',
        }}>{s.image ? <img src={s.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : s.emoji}</div>
        <div style={{fontWeight:700,fontSize:15,marginTop:14}}>{s.th}</div>
        <div className="muted" style={{fontSize:11}}>{s.en} · {s.group}</div>
        <div className="row" style={{justifyContent:'space-between',marginTop:12}}>
          <span className="pill" style={{background:s.color+'22',color:shade(s.color,-25)}}>{mode==='top'?'🌟 พบ':'⚠️ ครูระบุ'}</span>
          <span style={{fontSize:22,fontWeight:700,color:shade(s.color,-20)}}>{count}</span>
        </div>
      </div>
    </div>
  );
}

function StrengthDrill({state, sid, go, onClose, scopeStudents}){
  const s = state.characterStrengths.find(x=>x.id===sid);
  if(!s) return null;

  // count by student split into positive and concern
  const posByStudent = {};
  const concernByStudent = {};
  state.logs.forEach(l => {
    if(l.strengths.includes(sid)){
      if(l.tone==='concern') concernByStudent[l.studentId] = (concernByStudent[l.studentId]||0)+1;
      else posByStudent[l.studentId] = (posByStudent[l.studentId]||0)+1;
    }
  });

  const posList = scopeStudents
    .filter(stu => posByStudent[stu.id])
    .map(stu => ({stu, count: posByStudent[stu.id]}))
    .sort((a,b)=>b.count-a.count);

  const concernList = scopeStudents
    .filter(stu => concernByStudent[stu.id])
    .map(stu => ({stu, count: concernByStudent[stu.id]}))
    .sort((a,b)=>b.count-a.count);

  return (
    <div className="stack-lg" style={{marginTop:8}}>
      <div className="row" style={{justifyContent:'space-between'}}>
        <div className="row">
          <div style={{
            width:60,height:60,borderRadius:18,
            background:`linear-gradient(135deg, ${s.color}, ${shade(s.color,-20)})`,
            display:'grid',placeItems:'center',color:'#fff',fontSize:30,
            boxShadow:`0 12px 26px -10px ${s.color}99`, overflow:'hidden',
          }}>{s.image ? <img src={s.image} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/> : s.emoji}</div>
          <div>
            <div style={{fontSize:18, fontWeight:700}}>{s.th}</div>
            <div className="muted" style={{fontSize:13}}>{s.en} · หมวด {s.group}</div>
          </div>
        </div>
        <div className="row">
          <span className="pill" style={{background:'#D7F4E8',color:'#1F8867'}}>🌟 โดดเด่น {posList.length} คน</span>
          <span className="pill" style={{background:'#FFE0EA',color:'#C24B5C'}}>⚠️ ส่งเสริม {concernList.length} คน</span>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div>
          <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:'#1F8867'}}>
            🌟 นักเรียนที่มีจุดแข็งนี้โดดเด่น ({posList.length})
          </div>
          <div style={{maxHeight:340, overflow:'auto', background:'#D7F4E822', borderRadius:14, padding:8}}>
            {posList.length>0 ? posList.map(({stu, count}) => (
              <div key={stu.id} onClick={()=>{onClose();go('student:'+stu.id);}}
                className="row" style={{padding:'10px 12px', borderRadius:10, cursor:'pointer', justifyContent:'space-between'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fff'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="row">
                  <Avatar student={stu} size={32}/>
                  <div>
                    <div style={{fontWeight:600, fontSize:13}}>{stu.nickname} · {stu.firstName}</div>
                    <div className="muted" style={{fontSize:11}}>{stu.grade} · เลขที่ {stu.no}</div>
                  </div>
                </div>
                <span className="pill" style={{background:'#D7F4E8',color:'#1F8867'}}>{count} ครั้ง</span>
              </div>
            )) : <div className="empty" style={{padding:30}}><span className="muted">ยังไม่มีนักเรียน</span></div>}
          </div>
        </div>

        <div>
          <div style={{fontSize:13, fontWeight:600, marginBottom:10, color:'#C24B5C'}}>
            ⚠️ ครูระบุว่าควรส่งเสริม ({concernList.length})
          </div>
          <div style={{maxHeight:340, overflow:'auto', background:'#FFE0EA22', borderRadius:14, padding:8}}>
            {concernList.length>0 ? concernList.map(({stu, count}) => (
              <div key={stu.id} onClick={()=>{onClose();go('student:'+stu.id);}}
                className="row" style={{padding:'10px 12px', borderRadius:10, cursor:'pointer', justifyContent:'space-between'}}
                onMouseEnter={e=>e.currentTarget.style.background='#fff'}
                onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <div className="row">
                  <Avatar student={stu} size={32}/>
                  <div>
                    <div style={{fontWeight:600, fontSize:13}}>{stu.nickname} · {stu.firstName}</div>
                    <div className="muted" style={{fontSize:11}}>{stu.grade} · เลขที่ {stu.no}</div>
                  </div>
                </div>
                <span className="pill" style={{background:'#FFE0EA',color:'#C24B5C'}}>{count} ครั้ง</span>
              </div>
            )) : <div className="empty" style={{padding:30}}><span className="muted">ยังไม่มีบันทึกเชิงลบ</span></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PageStrengths });
