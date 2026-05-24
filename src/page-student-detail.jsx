/* === Student Detail Page (single student overall view) === */

function PageStudentDetail({state, dispatch, go, studentId}){
  const stu = state.students.find(s=>s.id===studentId);
  const [tab, setTab] = useState('summary');
  const [drillCat, setDrillCat] = useState(null);

  if(!stu) return (
    <div className="card"><Empty title="ไม่พบนักเรียน" sub="อาจถูกลบไปแล้ว" icon="users"/></div>
  );

  const logs = state.logs.filter(l=>l.studentId===studentId);
  const bmi = calcBMI(stu.weight, stu.height);
  const bmiCat = bmiCategoryChild(bmi, stu.age, stu.gender);

  // strength counts
  const strCount = {};
  logs.forEach(l => l.strengths.forEach(s => strCount[s] = (strCount[s]||0)+1));
  const topStr = Object.entries(strCount).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,v])=>{
    const s = CHARACTER_STRENGTHS.find(x=>x.id===id);
    return {sid:id,label:s.th, value:v, color:s.color, emoji:s.emoji};
  });

  // pending strengths to encourage (those with 0)
  const missing = CHARACTER_STRENGTHS.filter(s => !strCount[s.id]).slice(0,5);

  // by category
  const catCount = {};
  logs.forEach(l => catCount[l.categoryId] = (catCount[l.categoryId]||0)+1);

  // group radar (6 strength groups, average score 0..5)
  const groupAvg = STRENGTH_GROUPS.map(g => {
    const inGroup = CHARACTER_STRENGTHS.filter(s=>s.group===g.name);
    const sum = inGroup.reduce((s,x)=>s+(strCount[x.id]||0), 0);
    return Math.min(5, sum / Math.max(1, inGroup.length) * 1.5);
  });

  return (
    <div className="stack-lg">
      {/* Profile header */}
      <div className="card" style={{padding:0, overflow:'hidden'}}>
        <div style={{
          background: `linear-gradient(135deg, ${stu.avatarColor}, ${shade(stu.avatarColor,-30)})`,
          padding:'28px 28px 60px', position:'relative',
        }}>
          <button className="btn btn-ghost btn-sm" onClick={()=>go('students')} style={{position:'absolute',top:18,left:18}}>
            <Icon name="chevron_l" size={12}/> กลับ
          </button>
          <div style={{position:'absolute',top:18,right:18,display:'flex',gap:8,zIndex:2}}>
            <button className="btn btn-ghost btn-sm" onClick={()=>go('behaviors:new:'+stu.id)}>
              <Icon name="plus" size={12}/> บันทึกพฤติกรรม
            </button>
          </div>
        </div>

        <div style={{padding:'0 28px 24px', position:'relative'}}>
          <div style={{display:'flex',alignItems:'flex-end',gap:20,marginTop:-50}}>
            <div style={{padding:6,background:'#fff',borderRadius:'50%',boxShadow:'var(--shadow-lg)'}}>
              <Avatar student={stu} size={110}/>
            </div>
            <div style={{flex:1,paddingBottom:8}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:4}}>
                <h2 style={{margin:0,fontSize:28,fontWeight:700}}>{stu.nickname}</h2>
                <span className="pill gray">เลขที่ {stu.no}</span>
                <span className="pill sky">{stu.grade}</span>
              </div>
              <div className="muted" style={{fontSize:15}}>{stu.firstName} {stu.lastName} · {stu.gender} · {stu.age} ปี</div>
            </div>
            <div className="row" style={{paddingBottom:8}}>
              <div style={{textAlign:'center'}}>
                <div className="muted" style={{fontSize:11}}>บันทึก</div>
                <div style={{fontSize:22,fontWeight:700}}>{logs.length}</div>
              </div>
              <div style={{width:1,height:36,background:'var(--line)',margin:'0 14px'}}/>
              <div style={{textAlign:'center'}}>
                <div className="muted" style={{fontSize:11}}>จุดแข็ง</div>
                <div style={{fontSize:22,fontWeight:700}}>{Object.keys(strCount).length}</div>
              </div>
              <div style={{width:1,height:36,background:'var(--line)',margin:'0 14px'}}/>
              <div style={{textAlign:'center'}}>
                <div className="muted" style={{fontSize:11}}>BMI</div>
                <div style={{fontSize:22,fontWeight:700,color:bmiCat.color}}>{bmi||'—'}</div>
              </div>
            </div>
          </div>

          <div style={{marginTop:22,display:'flex',gap:6}}>
            <Tabs value={tab} onChange={setTab} options={[
              {value:'summary', label:'ภาพรวม'},
              {value:'behavior', label:'พฤติกรรม ('+logs.length+')'},
              {value:'strengths', label:'24 จุดแข็ง'},
              {value:'health', label:'สุขภาพ'},
              {value:'info', label:'ข้อมูลส่วนตัว'},
            ]}/>
          </div>
        </div>
      </div>

      {tab==='summary' && (
        <div className="stack-lg">
          <div className="grid" style={{gridTemplateColumns:'1.1fr .9fr'}}>
            <div className="card">
              <div className="card-title">
                <div className="t"><div className="ic" style={{background:'var(--grad-violet)'}}><Icon name="target" size={16} color="#fff"/></div> แผนภาพจุดแข็ง 6 ด้าน</div>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:20}}>
                <Radar values={groupAvg} labels={STRENGTH_GROUPS.map(g=>g.name)} size={260} color="#9D7FFF"/>
                <div style={{flex:1, display:'flex',flexDirection:'column',gap:10}}>
                  {STRENGTH_GROUPS.map((g,i)=>(
                    <div key={g.name} className="row" style={{justifyContent:'space-between'}}>
                      <span className="row" style={{gap:6}}>
                        <span style={{fontSize:18}}>{g.emoji}</span>
                        <span style={{fontSize:13,fontWeight:500}}>{g.name}</span>
                      </span>
                      <div style={{width:80}}>
                        <div className="bar" style={{height:6}}>
                          <i style={{width:(groupAvg[i]/5*100)+'%', background:`linear-gradient(90deg, ${g.color}, ${shade(g.color,-20)})`}}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">
                <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="star" size={16} color="#fff"/></div> Top จุดแข็ง</div>
              </div>
              {topStr.length>0 ? <BarList rows={topStr}/> : <Empty title="ยังไม่มีข้อมูล" sub="บันทึกพฤติกรรมเพื่อสะสมจุดแข็ง"/>}
            </div>
          </div>

          <div className="grid" style={{gridTemplateColumns:'1fr 1fr 1fr'}}>
            <SummaryCard
              icon="health" tone="mint" title="สุขภาพ"
              kvs={[
                ['น้ำหนัก', stu.weight+' kg'],
                ['ส่วนสูง', stu.height+' cm'],
                ['BMI', (bmi||'—')+' · '+bmiCat.label],
              ]}
              cta={{label:'ดูรายละเอียด', onClick:()=>setTab('health')}}
            />
            <SummaryCard
              icon="pill" tone="primary" title="โรคประจำตัว / การดูแลพิเศษ"
              kvs={[
                ['โรค/แพ้', stu.conditions || '—'],
                ['ดูแลพิเศษ', stu.specialNeeds || '—'],
              ]}
            />
            <SummaryCard
              icon="phone" tone="violet" title="ผู้ปกครอง"
              kvs={stu.parents.map(p => [p.label, p.phone])}
            />
          </div>

          <div className="card">
            <div className="card-title">
              <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="bolt" size={16} color="#fff"/></div> สรุปพฤติกรรม 1 เทอม</div>
              <div className="row">
                <span className="muted" style={{fontSize:11}}>คลิกเพื่อดูรายละเอียด</span>
                <span className="pill">{logs.length} บันทึก</span>
              </div>
            </div>
            <div className="grid" style={{gridTemplateColumns:'repeat(7, 1fr)', gap:10}}>
              {BEHAVIOR_CATEGORIES_DEFAULT.map(c => (
                <div key={c.id} onClick={()=>setDrillCat(c.id)} style={{
                  background:`linear-gradient(135deg, ${c.color}11, ${c.color}33)`,
                  borderRadius:16, padding:14, textAlign:'center', cursor:'pointer',
                  transition:'.15s',
                }}
                onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=`0 10px 20px -10px ${c.color}99`}}
                onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none'}}>
                  <div style={{fontSize:24}}>{c.emoji}</div>
                  <div style={{fontSize:11,color:'var(--ink-3)',marginTop:4}}>{c.name}</div>
                  <div style={{fontSize:22,fontWeight:700,color:shade(c.color,-20),marginTop:4}}>{catCount[c.id]||0}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab==='behavior' && (
        <BehaviorLogsView state={state} dispatch={dispatch} go={go} filterStudentId={studentId} hideStudentColumn/>
      )}

      {tab==='strengths' && (
        <div className="stack-lg">
          <div className="card">
            <div className="card-title">
              <div className="t"><div className="ic" style={{background:'var(--grad-sun)'}}><Icon name="star" size={16} color="#fff"/></div> Heatmap จุดแข็ง 24 ด้าน</div>
              <div className="muted">เข้มขึ้น = พบบ่อย</div>
            </div>
            <StrengthHeat counts={strCount}/>
          </div>

          <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <div className="card">
              <div className="card-title"><div className="t"><span style={{fontSize:18}}>🌟</span> จุดแข็งที่โดดเด่น</div></div>
              {topStr.length>0 ? (
                <div className="stack">
                  {topStr.map(t => (
                    <div key={t.sid} className="row" style={{justifyContent:'space-between',background:'#FFF7EF',padding:'10px 14px',borderRadius:14}}>
                      <span className="row"><span style={{fontSize:20}}>{t.emoji}</span><span style={{fontWeight:600}}>{t.label}</span></span>
                      <span className="pill" style={{background:t.color+'22',color:shade(t.color,-25)}}>พบ {t.value} ครั้ง</span>
                    </div>
                  ))}
                </div>
              ) : <Empty title="ยังไม่มีข้อมูล" sub="เริ่มบันทึกพฤติกรรมเพื่อค้นพบจุดแข็ง"/>}
            </div>
            <div className="card">
              <div className="card-title"><div className="t"><span style={{fontSize:18}}>🌱</span> จุดที่ควรส่งเสริม</div></div>
              {missing.length>0 ? (
                <div className="stack">
                  {missing.map(s => (
                    <div key={s.id} className="row" style={{justifyContent:'space-between',background:'#FFF7EF',padding:'10px 14px',borderRadius:14}}>
                      <span className="row"><span style={{fontSize:20}}>{s.emoji}</span><span style={{fontWeight:600}}>{s.th}</span></span>
                      <span className="pill gray">ยังไม่พบ</span>
                    </div>
                  ))}
                </div>
              ) : <Empty title="ครบทุกด้านแล้ว!" sub="เด็กคนนี้สุดยอดมาก ✨"/>}
            </div>
          </div>
        </div>
      )}

      {tab==='health' && <PageHealth state={state} forStudent={stu}/>}

      {tab==='info' && (
        <div className="card">
          <div className="card-title"><div className="t"><div className="ic" style={{background:'var(--grad-sky)'}}><Icon name="user" size={16} color="#fff"/></div> ข้อมูลส่วนตัว</div></div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
            <InfoKv label="ชื่อ-นามสกุล" value={`${stu.firstName} ${stu.lastName}`}/>
            <InfoKv label="ชื่อเล่น" value={stu.nickname}/>
            <InfoKv label="เลขที่" value={stu.no}/>
            <InfoKv label="ชั้น/ห้อง" value={stu.grade}/>
            <InfoKv label="เพศ" value={stu.gender}/>
            <InfoKv label="อายุ" value={stu.age + ' ปี'}/>
            <InfoKv label="น้ำหนัก" value={stu.weight + ' kg'}/>
            <InfoKv label="ส่วนสูง" value={stu.height + ' cm'}/>
            <InfoKv label="โรคประจำตัว / แพ้" value={stu.conditions}/>
            <InfoKv label="ดูแลพิเศษ" value={stu.specialNeeds}/>
            {stu.parents.map((p,i)=>(
              <InfoKv key={i} label={p.label} value={p.phone}/>
            ))}
          </div>
        </div>
      )}

      {/* Category drill modal */}
      <Modal open={!!drillCat} onClose={()=>setDrillCat(null)} wide
        title={(()=>{
          const c = BEHAVIOR_CATEGORIES_DEFAULT.find(x=>x.id===drillCat);
          return c ? `${c.emoji} ${c.name} · ${stu.nickname}` : '';
        })()}>
        {drillCat && (
          <div className="stack" style={{marginTop:12, maxHeight:520, overflow:'auto'}}>
            {logs.filter(l=>l.categoryId===drillCat).sort((a,b)=>b.date.localeCompare(a.date)).map(l => {
              const cat = BEHAVIOR_CATEGORIES_DEFAULT.find(c=>c.id===l.categoryId);
              return (
                <div key={l.id} className={`log-card ${cat?.tone||'sun'}`}>
                  <div className="between" style={{marginBottom:6}}>
                    <div style={{fontSize:12,color:'var(--ink-3)'}}>{l.date} · โดย {l.createdBy}</div>
                    <span className="pill" style={{
                      background: l.tone==='positive'?'#D7F4E8':l.tone==='concern'?'#FFE0EA':'#F1ECF5',
                      color: l.tone==='positive'?'#1F8867':l.tone==='concern'?'#C24B5C':'#6A6082',
                    }}>{l.tone==='positive'?'✨ เชิงบวก':l.tone==='concern'?'⚠️ ส่งเสริม':'😐 เป็นกลาง'}</span>
                  </div>
                  <div style={{fontSize:13, color:'var(--ink-2)'}}>{l.description}</div>
                  {l.peer && (
                    <div style={{marginTop:6, fontSize:12, color:'var(--ink-3)'}}>
                      <Icon name="users" size={12}/> คู่กรณี: <b style={{color:'var(--ink-2)'}}>{l.peer}</b>
                    </div>
                  )}
                  {l.strengths.length>0 && (
                    <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:10}}>
                      {l.strengths.map(s => <StrengthChip key={s} sid={s} selected/>)}
                    </div>
                  )}
                </div>
              );
            })}
            {logs.filter(l=>l.categoryId===drillCat).length===0 && (
              <Empty title="ยังไม่มีบันทึกในหมวดนี้" sub="ลองดูหมวดอื่นๆ" icon="bolt"/>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function SummaryCard({icon, tone, title, kvs, cta}){
  const grads = {
    primary:'var(--grad-primary)', violet:'var(--grad-violet)',
    mint:'var(--grad-mint)', sky:'var(--grad-sky)', sun:'var(--grad-sun)',
  };
  return (
    <div className="card">
      <div className="card-title">
        <div className="t">
          <div className="ic" style={{background:grads[tone]}}><Icon name={icon} size={14} color="#fff"/></div>
          {title}
        </div>
      </div>
      <div className="stack">
        {kvs.map((kv,i)=>(
          <div key={i} className="row" style={{justifyContent:'space-between'}}>
            <span style={{fontSize:13, color:'var(--ink-3)'}}>{kv[0]}</span>
            <span style={{fontSize:13, fontWeight:600, textAlign:'right', maxWidth:'65%'}}>{kv[1]}</span>
          </div>
        ))}
      </div>
      {cta && (
        <button className="btn btn-soft btn-sm" style={{marginTop:14}} onClick={cta.onClick}>{cta.label} <Icon name="chevron_r" size={12}/></button>
      )}
    </div>
  );
}

function InfoKv({label, value}){
  return (
    <div style={{padding:'12px 16px', background:'#FFF7EF', borderRadius:14}}>
      <div className="muted" style={{fontSize:11, marginBottom:2}}>{label}</div>
      <div style={{fontSize:14, fontWeight:500}}>{value || '—'}</div>
    </div>
  );
}

Object.assign(window, { PageStudentDetail });
