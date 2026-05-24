/* === Dashboard / Home page === */

function PageDashboard({state, dispatch, go}){
  const {students, logs} = state;
  const totalStudents = students.length;
  const male = students.filter(s=>s.gender==='ชาย').length;
  const female = totalStudents - male;
  const conditionsCount = students.filter(s=>s.conditions && s.conditions!=='—').length;
  const specialCount = students.filter(s=>s.specialNeeds && s.specialNeeds!=='—').length;

  const logsByCat = {};
  BEHAVIOR_CATEGORIES_DEFAULT.forEach(c=>logsByCat[c.id]=0);
  logs.forEach(l => { logsByCat[l.categoryId] = (logsByCat[l.categoryId]||0)+1; });

  // top strengths
  const strCount = {};
  logs.forEach(l => l.strengths.forEach(s => strCount[s] = (strCount[s]||0)+1));
  const topStrengths = Object.entries(strCount)
    .sort((a,b)=>b[1]-a[1])
    .slice(0,5)
    .map(([id,v])=>{
      const s = CHARACTER_STRENGTHS.find(x=>x.id===id);
      return s && {label:s.th, value:v, color:s.color, emoji:s.emoji};
    }).filter(Boolean);

  // weekly mini line
  const weeks = [];
  for(let i=11;i>=0;i--){
    const d = new Date();
    d.setDate(d.getDate() - i*7);
    weeks.push({weekStart: d, label:'ส.'+(12-i)});
  }
  const weeklyData = weeks.map(w=>{
    const start = w.weekStart;
    const end = new Date(start); end.setDate(end.getDate()+7);
    const count = logs.filter(l=>{
      const ld = new Date(l.date);
      return ld>=start && ld<end;
    }).length;
    return {label:w.label, value:count};
  });

  const recentLogs = logs.slice(0,5);

  return (
    <div className="stack-lg">
      {/* Hero card */}
      <div className="hero">
        <div className="blob a"/>
        <div className="blob b"/>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:24,position:'relative',zIndex:1}}>
          <div style={{maxWidth:560}}>
            <div style={{display:'inline-flex',alignItems:'center',gap:8,padding:'6px 14px',background:'rgba(255,255,255,.22)',borderRadius:999,fontSize:12,fontWeight:500,marginBottom:14}}>
              <Icon name="sparkle" size={14}/> ภาคเรียนที่ 1/2568 · ป.3
            </div>
            <h1>สวัสดี คุณครู! <span style={{display:'inline-block',animation:'wave 2s ease infinite'}}>👋</span></h1>
            <p>วันนี้นักเรียนของเราทำอะไรน่าประทับใจบ้างนะ? บันทึกพฤติกรรมและช่วยส่งเสริมจุดแข็งของเด็กๆ ได้เลย</p>
            <div style={{display:'flex',gap:10,marginTop:18}}>
              <button className="btn btn-ghost" style={{color:'#C24B5C'}} onClick={()=>go('students')}>
                <Icon name="users" size={16}/> ดูรายชื่อนักเรียน
              </button>
              <button className="btn" style={{background:'rgba(255,255,255,.95)',color:'#C24B5C'}} onClick={()=>go('behaviors:new')}>
                <Icon name="plus" size={16}/> บันทึกพฤติกรรม
              </button>
            </div>
          </div>

          {/* 3D-ish illustration using CSS shapes */}
          <Hero3D/>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid" style={{gridTemplateColumns:'repeat(4, 1fr)'}}>
        <StatCard label="นักเรียนทั้งหมด" value={totalStudents} sub={`ชาย ${male} · หญิง ${female}`} icon="users" tone="primary"/>
        <StatCard label="บันทึกพฤติกรรม" value={logs.length} sub="ตลอดเทอม 1" icon="bolt" tone="violet"/>
        <StatCard label="ดูแลพิเศษ" value={specialCount} sub={`โรคประจำตัว ${conditionsCount} คน`} icon="health" tone="mint"/>
        <StatCard label="จุดแข็งที่พบ" value={Object.keys(strCount).length + '/24'} sub="character strengths" icon="star" tone="sun"/>
      </div>

      {/* Two-column middle */}
      <div className="grid" style={{gridTemplateColumns:'1.4fr .9fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="chart" size={16} color="#fff"/></div> บันทึกพฤติกรรมราย 12 สัปดาห์</div>
            <span className="pill">ภาพรวมเทอม</span>
          </div>
          <Line data={weeklyData} color="#FF6E8A" height={200} width={620}/>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="grid" size={16} color="#fff"/></div> สัดส่วนหมวดพฤติกรรม</div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <Donut
              size={150} thickness={20}
              segments={BEHAVIOR_CATEGORIES_DEFAULT.map(c=>({value:logsByCat[c.id]||0, color:c.color}))}
              centerText={logs.length}
              centerSub="บันทึก"
            />
            <div style={{flex:1, display:'flex',flexDirection:'column',gap:8}}>
              {BEHAVIOR_CATEGORIES_DEFAULT.map(c => (
                <div key={c.id} className="row" style={{justifyContent:'space-between'}}>
                  <span className="row" style={{gap:8}}>
                    <span style={{width:10,height:10,borderRadius:3,background:c.color}}/>
                    <span style={{fontSize:13}}>{c.emoji} {c.name}</span>
                  </span>
                  <span style={{fontWeight:600,fontSize:13}}>{logsByCat[c.id]||0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid" style={{gridTemplateColumns:'1.1fr 1fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="star" size={16} color="#fff"/></div> Top 5 จุดแข็งที่พบบ่อย</div>
            <button className="btn btn-soft btn-sm" onClick={()=>go('strengths')}>ดูทั้งหมด <Icon name="chevron_r" size={12}/></button>
          </div>
          {topStrengths.length>0 ? <BarList rows={topStrengths}/> : <Empty title="ยังไม่มีข้อมูลจุดแข็ง" sub="เริ่มบันทึกพฤติกรรมเพื่อเก็บข้อมูล"/>}
        </div>

        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-mint)'}}><Icon name="bolt" size={16} color="#fff"/></div> บันทึกล่าสุด</div>
            <button className="btn btn-soft-mint btn-sm" onClick={()=>go('behaviors')}>ดูทั้งหมด <Icon name="chevron_r" size={12}/></button>
          </div>
          <div className="stack">
            {recentLogs.map(l => {
              const stu = students.find(s=>s.id===l.studentId);
              const cat = BEHAVIOR_CATEGORIES_DEFAULT.find(c=>c.id===l.categoryId) || BEHAVIOR_CATEGORIES_DEFAULT[0];
              return (
                <div key={l.id} className={`log-card ${cat.tone}`}>
                  <div className="between" style={{marginBottom:6}}>
                    <div className="row" style={{gap:10}}>
                      {stu && <Avatar student={stu} size={36}/>}
                      <div>
                        <div style={{fontWeight:600,fontSize:14}}>{stu ? `${stu.nickname} · ${stu.firstName}` : 'นักเรียน'}</div>
                        <div style={{fontSize:12,color:'var(--ink-3)'}}>{l.date} · โดย {l.createdBy}</div>
                      </div>
                    </div>
                    <span className="pill" style={{background:cat.color+'22',color:shade(cat.color,-25)}}>{cat.emoji} {cat.name}</span>
                  </div>
                  <div style={{fontSize:13,color:'var(--ink-2)',marginTop:6}}>{l.description}</div>
                  {l.strengths.length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                      {l.strengths.map(s=><StrengthChip key={s} sid={s} selected/>)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* 3D-ish hero illustration using CSS only */
function Hero3D(){
  return (
    <div style={{
      position:'relative', width:380, height:240, flexShrink:0,
    }}>
      {/* floating cards */}
      <div style={{
        position:'absolute', top:0, right:120, width:160, padding:14, borderRadius:18,
        background:'rgba(255,255,255,.95)', boxShadow:'0 20px 40px -16px rgba(80,40,80,.35)',
        transform:'rotate(-4deg)',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:8}}>
          <div style={{width:32,height:32,borderRadius:10,background:'linear-gradient(135deg,#FFB36B,#FF6E8A)',display:'grid',placeItems:'center',color:'#fff'}}>⭐</div>
          <div style={{color:'var(--ink)',fontSize:12,fontWeight:600}}>จุดแข็ง</div>
        </div>
        <div style={{color:'var(--ink)',fontSize:13}}>ความเมตตา 💖</div>
        <div className="bar" style={{marginTop:6}}><i style={{width:'78%'}}/></div>
      </div>

      <div style={{
        position:'absolute', top:80, right:0, width:170, padding:14, borderRadius:18,
        background:'rgba(255,255,255,.95)', boxShadow:'0 20px 40px -16px rgba(80,40,80,.35)',
        transform:'rotate(3deg)',
      }}>
        <div style={{color:'var(--ink-3)',fontSize:11,fontWeight:600,marginBottom:6}}>วันนี้</div>
        <div style={{display:'flex',gap:6,alignItems:'flex-end',height:48}}>
          {[8,12,16,10,18,14,22].map((v,i)=>(
            <div key={i} style={{flex:1, height:v*2,borderRadius:6, background:'linear-gradient(180deg,#FF8A5C,#FF6E8A)'}}/>
          ))}
        </div>
        <div style={{color:'var(--ink),',fontSize:12,marginTop:6,fontWeight:600}}>22 บันทึก</div>
      </div>

      <div style={{
        position:'absolute', bottom:0, right:80, padding:'12px 16px', borderRadius:999,
        background:'rgba(255,255,255,.95)', boxShadow:'0 20px 40px -16px rgba(80,40,80,.35)',
        display:'flex',alignItems:'center',gap:8,
      }}>
        <div style={{width:28,height:28,borderRadius:'50%',background:'linear-gradient(135deg,#4FD1AB,#3FB489)',display:'grid',placeItems:'center'}}>🌟</div>
        <div style={{color:'var(--ink)',fontSize:13,fontWeight:600}}>24 character strengths</div>
      </div>

      {/* big circles */}
      <div style={{
        position:'absolute',top:30,left:0,width:120,height:120,borderRadius:'50%',
        background:'linear-gradient(135deg,#FFD96B,#FFA61F)',
        boxShadow:'0 24px 40px -10px rgba(255,166,31,.5), inset 0 -10px 0 rgba(255,255,255,.25)',
        display:'grid',placeItems:'center',color:'#fff',fontSize:54,
      }}>🎈</div>
      <div style={{
        position:'absolute',bottom:10,left:90,width:80,height:80,borderRadius:'50%',
        background:'linear-gradient(135deg,#B79CFF,#7A5CFF)',
        boxShadow:'0 18px 30px -10px rgba(122,92,255,.6), inset 0 -8px 0 rgba(255,255,255,.25)',
        display:'grid',placeItems:'center',color:'#fff',fontSize:38,
      }}>🎒</div>
    </div>
  );
}

Object.assign(window, { PageDashboard });
