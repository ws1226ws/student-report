/* === Health Page === */

function PageHealth({state, forStudent}){
  // if forStudent passed, show only that student in detail
  const [grade, setGrade] = useState('all');
  const [search, setSearch] = useState('');

  if(forStudent){
    return <HealthDetail student={forStudent}/>;
  }

  // Ordered rooms: all, then ป.3/1, ป.3/2, ป.3/3
  const allRooms = Array.from(new Set(state.students.map(s=>s.grade)));
  const ordered = ['ป.3/1','ป.3/2','ป.3/3'].filter(r=>allRooms.includes(r));
  const grades = ['all', ...ordered];

  // Students within current filter -> drives BMI chart
  const filteredAll = state.students.filter(s => grade==='all' || s.grade===grade);

  const students = filteredAll
    .filter(s => !search || (s.firstName+s.lastName+s.nickname).toLowerCase().includes(search.toLowerCase()))
    .sort((a,b)=>a.no-b.no);

  const counts = {underweight:0, normal:0, mild:0, overweight:0, obese:0};
  filteredAll.forEach(s => {
    const bmi = calcBMI(s.weight, s.height);
    const c = bmiCategoryChild(bmi, s.age, s.gender);
    if(c.label==='น้ำหนักน้อยกว่าเกณฑ์') counts.underweight++;
    else if(c.label==='น้ำหนักปกติ') counts.normal++;
    else if(c.label==='ท้วม') counts.mild++;
    else if(c.label==='เริ่มอ้วน') counts.overweight++;
    else if(c.label==='อ้วน') counts.obese++;
  });

  const conditionStudents = filteredAll.filter(s=>s.conditions && s.conditions!=='—');
  const specialStudents = filteredAll.filter(s=>s.specialNeeds && s.specialNeeds!=='—');

  return (
    <div className="stack-lg">
      <div className="between">
        <div>
          <h2 style={{margin:0, fontSize:24, fontWeight:700}}>ข้อมูลสุขภาพนักเรียน</h2>
          <div className="muted" style={{marginTop:4}}>น้ำหนัก ส่วนสูง BMI ตามอายุและเพศ พร้อมโรคประจำตัว</div>
        </div>
        <div className="row">
          <div className="search" style={{minWidth:240}}>
            <Icon name="search" size={16} color="#8A7FA0"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="ค้นชื่อนักเรียน..."/>
          </div>
          <div className="seg">
            {grades.map(g=><button key={g} className={grade===g?'on':''} onClick={()=>setGrade(g)}>{g==='all'?'ทั้งหมด':g}</button>)}
          </div>
        </div>
      </div>

      {/* BMI distribution */}
      <div className="grid" style={{gridTemplateColumns:'repeat(5, 1fr)'}}>
        <StatCard label="น้ำหนักน้อย" value={counts.underweight} sub="คน" icon="health" tone="sky"/>
        <StatCard label="น้ำหนักปกติ" value={counts.normal} sub="คน" icon="smile" tone="mint"/>
        <StatCard label="ท้วม" value={counts.mild} sub="คน" icon="health" tone="sun"/>
        <StatCard label="เริ่มอ้วน" value={counts.overweight} sub="คน" icon="health" tone="primary"/>
        <StatCard label="อ้วน" value={counts.obese} sub="คน" icon="health" tone="primary"/>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-mint)'}}><Icon name="chart" size={16} color="#fff"/></div> การกระจาย BMI · {grade==='all'?'ทั้งชั้น ป.3':grade}</div>
            <span className="pill mint">{filteredAll.length} คน</span>
          </div>
          <Bars data={[
            {label:'น้ำหนักน้อย', value:counts.underweight, color:'#5CC9FF'},
            {label:'ปกติ',         value:counts.normal,      color:'#4FD1AB'},
            {label:'ท้วม',          value:counts.mild,        color:'#FFC23C'},
            {label:'เริ่มอ้วน',     value:counts.overweight,  color:'#FF8A5C'},
            {label:'อ้วน',          value:counts.obese,       color:'#FF6E8A'},
          ]} height={200}/>
          <div className="muted" style={{fontSize:11, marginTop:10, padding:'10px 12px', background:'#FFF7EF', borderRadius:12}}>
            * เกณฑ์ BMI สำหรับเด็กอายุ 5-19 ปี อ้างอิงจากองค์การอนามัยโลก (WHO) — ใช้สำหรับคัดกรองเบื้องต้นเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="pill" size={16} color="#fff"/></div> ต้องดูแลพิเศษ</div>
            <span className="pill">{conditionStudents.length + specialStudents.length} คน</span>
          </div>
          <div className="stack">
            {[...conditionStudents.slice(0,3), ...specialStudents.slice(0,3)].map(s => (
              <div key={s.id} className="row" style={{justifyContent:'space-between', background:'#FFF7EF', padding:'10px 14px', borderRadius:14}}>
                <div className="row">
                  <Avatar student={s} size={36}/>
                  <div>
                    <div style={{fontWeight:600, fontSize:13}}>{s.nickname} · {s.firstName}</div>
                    <div className="muted" style={{fontSize:11}}>{s.grade}</div>
                  </div>
                </div>
                <div style={{textAlign:'right', maxWidth:'55%'}}>
                  {s.conditions!=='—' && <div style={{fontSize:11, color:'#C24B5C'}}>💊 {s.conditions}</div>}
                  {s.specialNeeds!=='—' && <div style={{fontSize:11, color:'#9D7FFF'}}>⭐ {s.specialNeeds}</div>}
                </div>
              </div>
            ))}
            {(conditionStudents.length+specialStudents.length)===0 && (
              <Empty title="ไม่มีนักเรียนที่ต้องดูแลพิเศษ" sub="ทุกคนแข็งแรงดี ✨" icon="health"/>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="card-title">
          <div className="t"><div className="ic" style={{background:'var(--grad-sky)'}}><Icon name="users" size={16} color="#fff"/></div> ตารางสุขภาพรายบุคคล</div>
          <span className="muted">{students.length} คน</span>
        </div>
        <table className="tbl">
          <thead><tr>
            <th>นักเรียน</th><th>ชั้น</th><th>เพศ/อายุ</th>
            <th>น้ำหนัก</th><th>ส่วนสูง</th><th>BMI</th><th>การแปลผล</th><th>โรค/แพ้</th>
          </tr></thead>
          <tbody>
            {students.map(s => {
              const bmi = calcBMI(s.weight, s.height);
              const cat = bmiCategoryChild(bmi, s.age, s.gender);
              return (
                <tr key={s.id}>
                  <td><div className="row"><Avatar student={s} size={32}/><div>
                    <div style={{fontWeight:600}}>{s.nickname}</div>
                    <div className="muted" style={{fontSize:11}}>{s.firstName} {s.lastName}</div>
                  </div></div></td>
                  <td>{s.grade}</td>
                  <td>{s.gender}/{s.age}</td>
                  <td>{s.weight} kg</td>
                  <td>{s.height} cm</td>
                  <td><b>{bmi||'—'}</b></td>
                  <td><span className="pill" style={{background:cat.color+'22', color:shade(cat.color,-25)}}>{cat.label}</span></td>
                  <td style={{fontSize:12}}>
                    {s.conditions!=='—' && <div style={{color:'#C24B5C'}}>💊 {s.conditions}</div>}
                    {s.specialNeeds!=='—' && <div style={{color:'#9D7FFF',marginTop:2}}>⭐ {s.specialNeeds}</div>}
                    {s.conditions==='—' && s.specialNeeds==='—' && <span className="muted">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Per-student detail health */
function HealthDetail({student}){
  const s = student;
  const bmi = calcBMI(s.weight, s.height);
  const cat = bmiCategoryChild(bmi, s.age, s.gender);

  // mock historical growth
  const months = ['มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.'];
  const wHist = months.map((m,i)=>({label:m, value: +(s.weight - (months.length-1-i)*0.4).toFixed(1)}));
  const hHist = months.map((m,i)=>({label:m, value: +(s.height - (months.length-1-i)*0.5).toFixed(1)}));

  return (
    <div className="stack-lg">
      <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr'}}>
        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-mint)'}}><Icon name="health" size={16} color="#fff"/></div> ดัชนีมวลกาย (BMI)</div>
          </div>
          <div className="grid" style={{gridTemplateColumns:'1fr 1fr', alignItems:'center', gap:24}}>
            <BMIGauge bmi={bmi} category={cat}/>
            <div className="stack">
              <KvRow k="น้ำหนัก" v={s.weight + ' kg'} icon="📦" color="#5CC9FF"/>
              <KvRow k="ส่วนสูง" v={s.height + ' cm'} icon="📏" color="#9D7FFF"/>
              <KvRow k="BMI" v={(bmi||'—')+' kg/m²'} icon="📊" color={cat.color}/>
              <KvRow k="การแปลผล" v={cat.label} icon="🩺" color={cat.color}/>
              <KvRow k="อายุ/เพศ" v={s.age+' ปี · '+s.gender} icon="🎂" color="#FFC23C"/>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <div className="t"><div className="ic" style={{background:'var(--grad-primary)'}}><Icon name="pill" size={16} color="#fff"/></div> โรคและการดูแลพิเศษ</div>
          </div>
          <div className="stack">
            <div style={{padding:14, background:'linear-gradient(135deg, #FFE0EA, #FFE3D6)', borderRadius:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'#C24B5C',marginBottom:4}}>💊 โรคประจำตัว / แพ้ยา / แพ้อาหาร</div>
              <div style={{fontSize:15,fontWeight:500}}>{s.conditions || '—'}</div>
            </div>
            <div style={{padding:14, background:'linear-gradient(135deg, #EDE3FF, #DCEEFF)', borderRadius:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'#6E4FE0',marginBottom:4}}>⭐ การดูแลพิเศษ</div>
              <div style={{fontSize:15,fontWeight:500}}>{s.specialNeeds || '—'}</div>
            </div>
            <div style={{padding:14, background:'linear-gradient(135deg, #D7F4E8, #DCEEFF)', borderRadius:16}}>
              <div style={{fontSize:11,fontWeight:600,color:'#1F8867',marginBottom:6}}>📞 ติดต่อผู้ปกครอง</div>
              {s.parents.map((p,i)=>(
                <div key={i} className="row" style={{justifyContent:'space-between',padding:'4px 0'}}>
                  <span style={{fontSize:13}}>{p.label}</span>
                  <span style={{fontWeight:600,fontSize:13}}>{p.phone}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid" style={{gridTemplateColumns:'1fr 1fr'}}>
        <div className="card">
          <div className="card-title"><div className="t"><span style={{fontSize:18}}>📦</span> น้ำหนัก ตลอด 8 เดือน</div></div>
          <Line data={wHist} color="#5CC9FF" height={170}/>
        </div>
        <div className="card">
          <div className="card-title"><div className="t"><span style={{fontSize:18}}>📏</span> ส่วนสูง ตลอด 8 เดือน</div></div>
          <Line data={hHist} color="#9D7FFF" height={170}/>
        </div>
      </div>
    </div>
  );
}

function KvRow({k,v,icon,color}){
  return (
    <div className="row" style={{justifyContent:'space-between',background:'#FFF7EF',padding:'10px 14px',borderRadius:12}}>
      <span className="row" style={{gap:8}}><span style={{fontSize:18}}>{icon}</span><span style={{fontSize:13,color:'var(--ink-2)'}}>{k}</span></span>
      <span style={{fontSize:14,fontWeight:600,color: color||'var(--ink)'}}>{v}</span>
    </div>
  );
}

Object.assign(window, { PageHealth, HealthDetail });
