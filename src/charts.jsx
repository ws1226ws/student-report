/* === Lightweight inline-SVG charts === */

/* Donut chart */
function Donut({segments, size=180, thickness=22, centerText, centerSub}){
  const r = (size - thickness) / 2;
  const c = 2*Math.PI*r;
  const total = segments.reduce((s,x)=>s+x.value, 0) || 1;
  let acc = 0;
  return (
    <div style={{position:'relative',width:size,height:size}}>
      <svg width={size} height={size} style={{transform:'rotate(-90deg)'}}>
        <circle cx={size/2} cy={size/2} r={r} stroke="#FFEDE2" strokeWidth={thickness} fill="none"/>
        {segments.map((s,i) => {
          const len = (s.value/total)*c;
          const dash = `${len} ${c-len}`;
          const offset = -acc;
          acc += len;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r}
              stroke={s.color} strokeWidth={thickness} fill="none"
              strokeDasharray={dash} strokeDashoffset={offset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',textAlign:'center'}}>
        <div>
          <div style={{fontSize:size*0.18, fontWeight:700, lineHeight:1}}>{centerText}</div>
          {centerSub && <div className="muted" style={{fontSize:12, marginTop:4}}>{centerSub}</div>}
        </div>
      </div>
    </div>
  );
}

/* Horizontal Bar list */
function BarList({rows, max, accent='#FF6E8A'}){
  const m = max || Math.max(...rows.map(r=>r.value), 1);
  return (
    <div style={{display:'flex',flexDirection:'column',gap:12}}>
      {rows.map((r,i) => (
        <div key={i}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6,fontSize:13}}>
            <span style={{display:'flex',alignItems:'center',gap:8}}>
              {r.emoji && <span>{r.emoji}</span>}
              <span style={{fontWeight:500}}>{r.label}</span>
            </span>
            <span style={{fontWeight:600,color:'var(--ink-2)'}}>{r.value}{r.unit||''}</span>
          </div>
          <div className="bar"><i style={{
            width: ((r.value/m)*100)+'%',
            background: r.color ? `linear-gradient(90deg, ${r.color}, ${shade(r.color,-15)})` : `linear-gradient(90deg, ${accent}, ${shade(accent,-15)})`
          }}/></div>
        </div>
      ))}
    </div>
  );
}

/* Vertical Bar chart */
function Bars({data, height=160, color='#FF6E8A', showLabels=true, gradFill=true}){
  const max = Math.max(...data.map(d=>d.value), 1);
  const chartH = Math.max(40, height - 24); // reserve space for value label above
  return (
    <div>
      <div style={{display:'flex',alignItems:'flex-end',gap:14,height, padding:'0 4px'}}>
        {data.map((d,i)=>{
          const h = (d.value/max) * chartH;
          const c = d.color || color;
          return (
            <div key={i} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'flex-end', gap:6, height:'100%'}}>
              <div style={{fontSize:13, color:shade(c,-20), fontWeight:700}}>{d.value}</div>
              <div style={{
                width:'100%',
                height: h+'px',
                background: gradFill ? `linear-gradient(180deg, ${c}, ${shade(c,-20)})` : c,
                borderRadius:'12px 12px 4px 4px',
                boxShadow: `0 8px 18px -8px ${c}80, inset 0 -4px 0 rgba(255,255,255,.2)`,
                minHeight: d.value>0 ? 8 : 4,
              }}/>
            </div>
          );
        })}
      </div>
      {showLabels && (
        <div style={{display:'flex',gap:14,padding:'8px 4px 0'}}>
          {data.map((d,i)=>(<div key={i} style={{flex:1,textAlign:'center',fontSize:12,color:'var(--ink-2)',fontWeight:500}}>{d.label}</div>))}
        </div>
      )}
    </div>
  );
}

/* Line / area chart */
function Line({data, height=160, width=520, color='#FF6E8A', fillColor}){
  const max = Math.max(...data.map(d=>d.value), 1);
  const min = Math.min(...data.map(d=>d.value), 0);
  const pad = 24;
  const W = width, H = height;
  const xs = (i) => pad + i * ((W-pad*2) / (data.length-1 || 1));
  const ys = (v) => H - pad - ((v-min)/((max-min)||1)) * (H - pad*2);
  const pts = data.map((d,i)=>`${xs(i)},${ys(d.value)}`).join(' ');
  const areaPts = `${xs(0)},${H-pad} ${pts} ${xs(data.length-1)},${H-pad}`;
  const fill = fillColor || color+'33';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lnFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35"/>
          <stop offset="100%" stopColor={color} stopOpacity="0.02"/>
        </linearGradient>
      </defs>
      {/* grid */}
      {[0,0.25,0.5,0.75,1].map((p,i)=>(
        <line key={i} x1={pad} x2={W-pad} y1={pad+p*(H-pad*2)} y2={pad+p*(H-pad*2)}
          stroke="#FFEDE2" strokeWidth="1"/>
      ))}
      <polygon points={areaPts} fill="url(#lnFill)"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((d,i)=>(
        <g key={i}>
          <circle cx={xs(i)} cy={ys(d.value)} r="5" fill="#fff" stroke={color} strokeWidth="2.5"/>
        </g>
      ))}
      {data.map((d,i)=>(
        <text key={'l'+i} x={xs(i)} y={H-6} fontSize="10" textAnchor="middle" fill="#8A7FA0" fontFamily="Kanit">{d.label}</text>
      ))}
    </svg>
  );
}

/* Radar chart for character strength groups */
function Radar({values, labels, size=260, color='#FF6E8A'}){
  const cx = size/2, cy = size/2;
  const r = size/2 - 30;
  const n = values.length;
  const pt = (i, val) => {
    const a = -Math.PI/2 + (i/n)*Math.PI*2;
    const dist = (val/5) * r; // assume 0..5 scale
    return [cx + Math.cos(a)*dist, cy + Math.sin(a)*dist];
  };
  const grid = (level) => Array.from({length:n}, (_,i)=>{
    const a = -Math.PI/2 + (i/n)*Math.PI*2;
    return [cx + Math.cos(a)*r*level, cy + Math.sin(a)*r*level];
  }).map(p=>p.join(',')).join(' ');

  const poly = values.map((v,i)=>pt(i,v).join(',')).join(' ');
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
      {[0.25,0.5,0.75,1].map((lv,i)=>(
        <polygon key={i} points={grid(lv)} fill="none" stroke="#FFE3D6" strokeWidth="1"/>
      ))}
      {labels.map((lb,i)=>{
        const a = -Math.PI/2 + (i/n)*Math.PI*2;
        const [x,y] = [cx + Math.cos(a)*(r+18), cy + Math.sin(a)*(r+18)];
        return <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill="#5A4E6E" fontFamily="Kanit">{lb}</text>;
      })}
      <polygon points={poly} fill={color+'33'} stroke={color} strokeWidth="2.5" strokeLinejoin="round"/>
      {values.map((v,i)=>{
        const [x,y] = pt(i,v);
        return <circle key={i} cx={x} cy={y} r="4" fill="#fff" stroke={color} strokeWidth="2"/>;
      })}
    </svg>
  );
}

/* Heatmap-ish strength grid */
function StrengthHeat({counts, max}){
  const m = max || Math.max(...Object.values(counts), 1);
  return (
    <div style={{display:'grid',gridTemplateColumns:'repeat(6, 1fr)',gap:10}}>
      {CHARACTER_STRENGTHS.map(s => {
        const v = counts[s.id] || 0;
        const intensity = v / m;
        return (
          <div key={s.id} style={{
            background: v>0 ? `linear-gradient(135deg, ${s.color}${Math.round(120+intensity*135).toString(16).padStart(2,'0')}, ${shade(s.color,-15)})` : '#FFF4ED',
            color: v>0 ? '#fff' : 'var(--ink-3)',
            padding:'12px 10px',borderRadius:14,textAlign:'center',
            minHeight:78,display:'flex',flexDirection:'column',justifyContent:'space-between',gap:4,
            boxShadow: v>0 ? `0 6px 14px -8px ${s.color}` : 'none',
          }}>
            <div style={{fontSize:18}}>{s.emoji}</div>
            <div style={{fontSize:11, fontWeight:500, lineHeight:1.2}}>{s.th}</div>
            <div style={{fontSize:14, fontWeight:700}}>{v}</div>
          </div>
        );
      })}
    </div>
  );
}

/* BMI Gauge — semicircle */
function BMIGauge({bmi, category}){
  const min=10, max=28;
  const v = Math.max(min, Math.min(max, bmi||min));
  const p = (v-min)/(max-min); // 0..1
  const angle = -180 + p*180; // -180..0
  const W=260,H=150;
  const cx=W/2, cy=H-10, R=110;
  const segs = [
    {to:0.22, color:'#5CC9FF'}, // underweight
    {to:0.45, color:'#4FD1AB'}, // normal
    {to:0.62, color:'#FFC23C'}, // ท้วม
    {to:0.80, color:'#FF8A5C'}, // เริ่มอ้วน
    {to:1.0,  color:'#FF6E8A'}, // อ้วน
  ];
  const arcs = [];
  let from = 0;
  segs.forEach((s,i)=>{
    const a1 = -180 + from*180;
    const a2 = -180 + s.to*180;
    const x1 = cx + R*Math.cos(a1*Math.PI/180);
    const y1 = cy + R*Math.sin(a1*Math.PI/180);
    const x2 = cx + R*Math.cos(a2*Math.PI/180);
    const y2 = cy + R*Math.sin(a2*Math.PI/180);
    arcs.push(<path key={i} d={`M ${x1} ${y1} A ${R} ${R} 0 0 1 ${x2} ${y2}`} stroke={s.color} strokeWidth="20" fill="none" strokeLinecap="round"/>);
    from = s.to;
  });
  const nx = cx + (R-30)*Math.cos(angle*Math.PI/180);
  const ny = cy + (R-30)*Math.sin(angle*Math.PI/180);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%">
        {arcs}
        <circle cx={nx} cy={ny} r="9" fill="#fff" stroke="#2A1F3D" strokeWidth="2.5"/>
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#2A1F3D" strokeWidth="3" strokeLinecap="round"/>
        <circle cx={cx} cy={cy} r="7" fill="#2A1F3D"/>
      </svg>
      <div style={{textAlign:'center', marginTop:-8}}>
        <div style={{fontSize:36, fontWeight:700, lineHeight:1}}>{bmi||'—'}</div>
        <div style={{
          display:'inline-block', marginTop:6, padding:'4px 14px', borderRadius:999,
          background: (category && category.color) + '22',
          color: category && category.color,
          fontWeight:600, fontSize:13,
        }}>{category ? category.label : '—'}</div>
      </div>
    </div>
  );
}

Object.assign(window, { Donut, BarList, Bars, Line, Radar, StrengthHeat, BMIGauge });
