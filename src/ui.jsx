/* === Reusable UI components === */
const { useState, useEffect, useRef, useMemo } = React;

/* ---------- Icon (inline SVG, lightweight) ---------- */
function Icon({name, size=18, color='currentColor', stroke=2}){
  const s={width:size,height:size,fill:'none',stroke:color,strokeWidth:stroke,strokeLinecap:'round',strokeLinejoin:'round'};
  const paths = {
    home:        <><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></>,
    users:       <><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3 2.7-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.5"/><path d="M15 20c0-2.5 2-4 4-4"/></>,
    chart:       <><path d="M4 19V5"/><path d="M4 19h16"/><rect x="7" y="11" width="2.5" height="6" rx="1"/><rect x="11" y="8" width="2.5" height="9" rx="1"/><rect x="15" y="13" width="2.5" height="4" rx="1"/></>,
    star:        <><polygon points="12 3 14.5 9 21 9.5 16 14 17.5 21 12 17.5 6.5 21 8 14 3 9.5 9.5 9"/></>,
    heart:       <><path d="M20.8 5.6a5.5 5.5 0 0 0-7.8 0L12 6.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l8.8 8.8 8.8-8.8a5.5 5.5 0 0 0 0-7.8z"/></>,
    health:      <><path d="M19 14c-2 5-7 7-7 7s-5-2-7-7"/><path d="M5 14a4 4 0 1 1 7-2 4 4 0 1 1 7 2"/><path d="M9 11h2v-2h2v2h2v2h-2v2h-2v-2H9z"/></>,
    book:        <><path d="M4 4h7v16H4z"/><path d="M13 4h7v16h-7z"/></>,
    bolt:        <><polygon points="13 2 4 14 11 14 10 22 20 10 13 10 13 2"/></>,
    settings:    <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 16.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8L4.3 7A2 2 0 1 1 7.1 4.2l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.7 7l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1z"/></>,
    plus:        <><path d="M12 5v14M5 12h14"/></>,
    search:      <><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>,
    bell:        <><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></>,
    edit:        <><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/></>,
    trash:       <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-2 14H7L5 6"/><path d="M10 11v6M14 11v6"/></>,
    close:       <><path d="M18 6L6 18M6 6l12 12"/></>,
    chevron_r:   <><polyline points="9 6 15 12 9 18"/></>,
    chevron_l:   <><polyline points="15 6 9 12 15 18"/></>,
    chevron_d:   <><polyline points="6 9 12 15 18 9"/></>,
    arrow_r:     <><path d="M5 12h14"/><path d="M13 5l7 7-7 7"/></>,
    phone:       <><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L8 9.6a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></>,
    male:        <><circle cx="10" cy="14" r="5"/><path d="M14 10l6-6M16 4h4v4"/></>,
    female:      <><circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 19h6"/></>,
    lock:        <><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></>,
    shield:      <><path d="M12 2l8 4v6c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6z"/></>,
    smile:       <><circle cx="12" cy="12" r="9"/><path d="M9 9h.01M15 9h.01"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/></>,
    moon:        <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
    calendar:    <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    grid:        <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    download:    <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><path d="M12 15V3"/></>,
    filter:      <><path d="M4 4h16l-6 8v6l-4 2v-8z"/></>,
    sparkle:     <><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></>,
    user:        <><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></>,
    target:      <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/></>,
    flag:        <><path d="M4 22V4"/><path d="M4 4h12l-2 4 2 4H4"/></>,
    pill:        <><rect x="2" y="9" width="20" height="6" rx="3" transform="rotate(-30 12 12)"/><path d="M8.5 7.5l7 7"/></>,
    paw:         <><circle cx="6" cy="9" r="2"/><circle cx="10" cy="5" r="2"/><circle cx="14" cy="5" r="2"/><circle cx="18" cy="9" r="2"/><path d="M5 17a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4 3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3z"/></>,
    eye:         <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
    image:       <><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></>,
    save:        <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{paths[name] || null}</svg>;
}

/* ---------- Avatar (student) ---------- */
function Avatar({student, size=44}){
  const initials = (student.nickname || student.firstName || '?').slice(0,1);
  const [err, setErr] = useState(false);
  const photo = !err && (student.photoUrl || student.photoData); // photoData kept for back-compat
  return (
    <div className="avatar"
      style={{
        width:size,height:size,
        background:`linear-gradient(135deg, ${student.avatarColor}, ${shade(student.avatarColor, -20)})`,
        fontSize: size*0.42,
      }}>
      {photo
        ? <img src={photo} alt={student.nickname} onError={()=>setErr(true)}/>
        : initials}
    </div>
  );
}

function shade(hex, amt){
  // amt: -100..100
  const c = hex.replace('#','');
  const num = parseInt(c,16);
  let r=(num>>16)+amt, g=((num>>8)&0xff)+amt, b=(num&0xff)+amt;
  r=Math.max(0,Math.min(255,r));g=Math.max(0,Math.min(255,g));b=Math.max(0,Math.min(255,b));
  return '#'+(0x1000000+(r<<16)+(g<<8)+b).toString(16).slice(1);
}

/* ---------- Stat card ---------- */
function StatCard({label, value, sub, icon, tone='primary'}){
  const grads = {
    primary:'var(--grad-primary)', violet:'var(--grad-violet)',
    mint:'var(--grad-mint)', sky:'var(--grad-sky)', sun:'var(--grad-sun)',
  };
  return (
    <div className="stat-card">
      <div className="ic" style={{background:grads[tone]}}><Icon name={icon} size={22} color="#fff"/></div>
      <div className="lbl">{label}</div>
      <div className="num grad-text" style={{background:grads[tone],WebkitBackgroundClip:'text',backgroundClip:'text',color:'transparent'}}>{value}</div>
      {sub ? <div className="muted" style={{marginTop:6,fontSize:12}}>{sub}</div> : null}
    </div>
  );
}

/* ---------- Tabs ---------- */
function Tabs({value, onChange, options}){
  return (
    <div className="tabs">
      {options.map(o => (
        <button key={o.value} className={value===o.value?'on':''} onClick={()=>onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

function Segmented({value, onChange, options}){
  return (
    <div className="seg">
      {options.map(o => (
        <button key={o.value} className={value===o.value?'on':''} onClick={()=>onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

/* ---------- Modal ---------- */
function Modal({open, onClose, title, subtitle, children, wide}){
  if(!open) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={wide?{maxWidth:920}:{}} onClick={e=>e.stopPropagation()}>
        <button className="close" onClick={onClose}><Icon name="close" size={18}/></button>
        {title && <h3>{title}</h3>}
        {subtitle && <div className="muted" style={{marginBottom:18}}>{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Strength chip ---------- */
function StrengthChip({sid, selected=false, onClick}){
  const s = (window.CHARACTER_STRENGTHS || []).find(x=>x.id===sid);
  if(!s) return null;
  const icon = s.image
    ? <img src={s.image} alt="" style={{width:14,height:14,borderRadius:4,objectFit:'cover'}}/>
    : <span>{s.emoji}</span>;
  return (
    <span
      className={'strength-chip' + (selected?' on':'')}
      style={selected?{
        background:`linear-gradient(135deg, ${s.color}, ${shade(s.color,-20)})`,color:'#fff'
      }:{background:s.color+'22', color:shade(s.color,-30)}}
      onClick={onClick}
    >
      {icon}{s.th}
    </span>
  );
}

/* ---------- Confirm small bar ---------- */
function Notice({text, tone='primary'}){
  return (
    <div className="notice">
      <span className="dot"/>
      <span>{text}</span>
    </div>
  );
}

/* ---------- Decoration ---------- */
function Sparkle({style}){
  return <span style={{...style,display:'inline-block'}}>✨</span>;
}

/* ---------- Photo upload placeholder (resizes to ~512px JPEG base64) ---------- */
function PhotoSlot({value, onChange, size=120, label='อัปโหลดรูปโปรไฟล์'}){
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(false);
  const pick = ()=>ref.current && ref.current.click();
  const onFile = async (e)=>{
    const f = e.target.files[0];
    e.target.value = '';
    if(!f) return;
    if(!/^image\//.test(f.type)){ alert('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if(f.size > 8*1024*1024){ alert('ไฟล์ใหญ่เกิน 8MB'); return; }
    try {
      setBusy(true);
      const dataUrl = await resizeImageToDataUrl(f, 512, 0.85);
      onChange(dataUrl);
      setErr(false);
    } catch(ex){
      console.error('image resize failed', ex);
      alert('โหลดรูปไม่สำเร็จ: ' + (ex.message || ex));
    } finally { setBusy(false); }
  };
  const showImg = value && !err;
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8}}>
      <div onClick={pick} style={{
        width:size,height:size,borderRadius:size*0.3,
        background: showImg ? '#fff' :
          'repeating-linear-gradient(45deg, #FFE3D6, #FFE3D6 8px, #FFD8C6 8px, #FFD8C6 16px)',
        display:'grid',placeItems:'center',color:'#C24B5C',cursor:'pointer',
        boxShadow:'0 8px 18px -8px rgba(255,110,138,.4)',overflow:'hidden',
      }}>
        {showImg
          ? <img src={value} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}} onError={()=>setErr(true)}/>
          : <Icon name="image" size={28}/>}
      </div>
      <div className="row" style={{gap:6}}>
        <button className="btn btn-soft btn-sm" onClick={pick} disabled={busy}>
          <Icon name="image" size={14}/> {busy ? 'กำลังโหลด…' : label}
        </button>
        {value && (
          <button className="btn btn-soft btn-sm" style={{background:'#FFE0EA',color:'#C24B5C'}} onClick={()=>onChange('')}>
            <Icon name="trash" size={11}/>
          </button>
        )}
      </div>
      <input type="file" ref={ref} accept="image/*" style={{display:'none'}} onChange={onFile}/>
    </div>
  );
}

/* Resize image File → square-fit JPEG data URL, capped at maxSide px */
function resizeImageToDataUrl(file, maxSide=512, quality=0.85){
  return new Promise((resolve, reject)=>{
    const reader = new FileReader();
    reader.onerror = ()=>reject(new Error('อ่านไฟล์ไม่สำเร็จ'));
    reader.onload = ()=>{
      const img = new Image();
      img.onerror = ()=>reject(new Error('รูปเปิดไม่ได้'));
      img.onload = ()=>{
        const ratio = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.round(img.naturalWidth * ratio);
        const h = Math.round(img.naturalHeight * ratio);
        const cv = document.createElement('canvas');
        cv.width = w; cv.height = h;
        const ctx = cv.getContext('2d');
        ctx.fillStyle = '#fff'; ctx.fillRect(0,0,w,h);
        ctx.drawImage(img, 0, 0, w, h);
        resolve(cv.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

/* ---------- Empty State ---------- */
function Empty({title, sub, icon='star'}){
  return (
    <div className="empty">
      <div style={{
        width:80,height:80,borderRadius:24,margin:'0 auto 14px',
        background:'linear-gradient(135deg,#FFE3D6,#FFE0EA)',display:'grid',placeItems:'center',color:'#C24B5C'
      }}><Icon name={icon} size={36}/></div>
      <div style={{fontWeight:600,color:'var(--ink)',marginBottom:4}}>{title}</div>
      <div className="muted">{sub}</div>
    </div>
  );
}

/* ---------- Toast ---------- */
function useToast(){
  const [t,setT] = useState(null);
  const show = (msg, tone='primary')=>{
    setT({msg,tone,id:Date.now()});
    setTimeout(()=>setT(null), 2400);
  };
  const node = t ? (
    <div style={{
      position:'fixed', bottom:24, left:'50%', transform:'translateX(-50%)',
      background:'#fff', borderRadius:18, padding:'12px 22px',
      boxShadow:'var(--shadow-lg)', zIndex:200, display:'flex',gap:10,alignItems:'center',
      fontSize:14,fontWeight:500,
    }}>
      <span style={{
        width:24,height:24,borderRadius:8,background:'var(--grad-primary)',
        color:'#fff',display:'grid',placeItems:'center',fontSize:13
      }}>✓</span>
      {t.msg}
    </div>
  ) : null;
  return {show, node};
}

/* ---------- Password input with eye-toggle ---------- */
function PasswordField({label, value, onChange, placeholder='••••••••'}){
  const [show, setShow] = useState(false);
  return (
    <div className="field">
      {label && <label>{label}</label>}
      <div style={{position:'relative'}}>
        <input
          type={show?'text':'password'}
          value={value || ''}
          onChange={e=>onChange(e.target.value)}
          placeholder={placeholder}
          style={{width:'100%', paddingRight:42}}
        />
        <button
          type="button"
          onClick={()=>setShow(v=>!v)}
          aria-label={show?'ซ่อนรหัส':'แสดงรหัส'}
          style={{
            position:'absolute', top:'50%', right:6, transform:'translateY(-50%)',
            width:30, height:30, borderRadius:8, border:0, cursor:'pointer',
            background:'transparent', fontSize:16, display:'grid', placeItems:'center',
          }}
        >{show ? '🙈' : '👁️'}</button>
      </div>
    </div>
  );
}

/* ---------- AvatarBubble: ใช้แทนวงกลม avatar ทุกที่
   ถ้ามี photoUrl → แสดงรูป (cover); ถ้าไม่มี → gradient จาก color + initial
*/
function AvatarBubble({photoUrl, color='#FF6E8A', initial='', size=44, radius='50%'}){
  const [err, setErr] = useState(false);
  // reset error state when photoUrl changes (e.g. after re-upload)
  useEffect(()=>{ setErr(false); }, [photoUrl]);
  const baseStyle = {
    width:size, height:size, borderRadius:radius,
    display:'grid', placeItems:'center',
    color:'#fff', fontWeight:700, fontSize:Math.round(size*0.42),
    overflow:'hidden', flexShrink:0,
    boxShadow:'0 4px 10px -4px rgba(0,0,0,.15)',
  };
  const showImg = photoUrl && !err;
  if(showImg){
    return (
      <div style={baseStyle}>
        <img
          src={photoUrl}
          alt=""
          style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}}
          onError={()=>{ console.warn('AvatarBubble: image failed', photoUrl); setErr(true); }}
        />
      </div>
    );
  }
  return <div style={{...baseStyle, background:`linear-gradient(135deg,${color},${shade(color,-25)})`}}>{initial}</div>;
}

/* ---------- AvatarEditor: เลือกไฟล์ → drag/zoom → crop เป็น JPEG blob ----------
   props:
     initialPhotoUrl: รูปปัจจุบัน (ถ้ามี — แสดง preview ก่อน)
     onUpload(blob): callback เมื่อกด "บันทึกรูป" — ส่ง blob ของ 256x256 JPEG
     onRemove():     callback เมื่อกด "ลบรูป"
     busy:           disable ปุ่มขณะกำลังอัปโหลด
*/
function AvatarEditor({initialPhotoUrl, onUpload, onRemove, busy}){
  const PREVIEW = 240; // px ของช่อง crop
  const fileInputRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);          // data url ของไฟล์ใหม่
  const [naturalSize, setNaturalSize] = useState({w:0,h:0});
  const [pos, setPos] = useState({x:0, y:0});
  const [scale, setScale] = useState(1);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef({sx:0,sy:0, px:0, py:0});
  const imgRef = useRef(null);

  const reset = ()=>{ setPos({x:0,y:0}); setScale(1); };

  const pickFile = (e)=>{
    const f = e.target.files?.[0];
    e.target.value = ''; // reset เผื่อเลือกไฟล์เดิมซ้ำ
    if(!f) return;
    if(!/^image\//.test(f.type)){ alert('กรุณาเลือกไฟล์รูปภาพ'); return; }
    if(f.size > 5*1024*1024){ alert('ไฟล์ใหญ่เกิน 5MB กรุณาเลือกรูปขนาดเล็กลง'); return; }
    const reader = new FileReader();
    reader.onload = (ev)=>{ setImgSrc(ev.target.result); reset(); };
    reader.readAsDataURL(f);
  };

  const onImgLoad = ()=>{
    if(!imgRef.current) return;
    setNaturalSize({w: imgRef.current.naturalWidth, h: imgRef.current.naturalHeight});
  };

  // base scale ที่ทำให้ภาพ "cover" ช่อง PREVIEW (เริ่มต้น)
  const baseScale = naturalSize.w && naturalSize.h
    ? Math.max(PREVIEW / naturalSize.w, PREVIEW / naturalSize.h)
    : 1;
  const effScale = baseScale * scale;
  const renderedW = naturalSize.w * effScale;
  const renderedH = naturalSize.h * effScale;

  // Drag
  const startDrag = (clientX, clientY)=>{
    setDragging(true);
    dragStartRef.current = { sx:clientX, sy:clientY, px:pos.x, py:pos.y };
  };
  const moveDrag = (clientX, clientY)=>{
    if(!dragging) return;
    const dx = clientX - dragStartRef.current.sx;
    const dy = clientY - dragStartRef.current.sy;
    // clamp ไม่ให้ image หลุดขอบ
    const maxX = Math.max(0, (renderedW - PREVIEW)/2);
    const maxY = Math.max(0, (renderedH - PREVIEW)/2);
    const nx = Math.max(-maxX, Math.min(maxX, dragStartRef.current.px + dx));
    const ny = Math.max(-maxY, Math.min(maxY, dragStartRef.current.py + dy));
    setPos({x:nx, y:ny});
  };
  const endDrag = ()=> setDragging(false);

  useEffect(()=>{
    if(!dragging) return;
    const onMove = (e)=>{
      if(e.touches){ moveDrag(e.touches[0].clientX, e.touches[0].clientY); }
      else { moveDrag(e.clientX, e.clientY); }
    };
    const onUp = ()=> endDrag();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove, {passive:false});
    window.addEventListener('touchend', onUp);
    return ()=>{
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, naturalSize, scale, pos.x, pos.y]);

  const renderBlob = ()=>{
    return new Promise((resolve)=>{
      if(!imgRef.current || !naturalSize.w){ resolve(null); return; }
      const OUT = 256;
      const cv = document.createElement('canvas');
      cv.width = OUT; cv.height = OUT;
      const ctx = cv.getContext('2d');
      // กล่อง crop คือศูนย์กลาง PREVIEW; image จุดศูนย์กลางอยู่ที่ (PREVIEW/2 + pos.x, PREVIEW/2 + pos.y)
      // → top-left ของ image (preview coords)
      const left = PREVIEW/2 + pos.x - renderedW/2;
      const top  = PREVIEW/2 + pos.y - renderedH/2;
      // scale จาก PREVIEW → OUT
      const k = OUT / PREVIEW;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0,0,OUT,OUT);
      ctx.drawImage(imgRef.current, left*k, top*k, renderedW*k, renderedH*k);
      cv.toBlob((b)=> resolve(b), 'image/jpeg', 0.88);
    });
  };

  const handleSave = async ()=>{
    if(!imgSrc){ alert('กรุณาเลือกรูปก่อน'); return; }
    const blob = await renderBlob();
    if(!blob){ alert('ประมวลผลรูปไม่สำเร็จ'); return; }
    await onUpload(blob);
    setImgSrc(null); // ปิดโหมด edit หลังอัปโหลดเสร็จ
  };

  // ไม่มีรูปใหม่ — แสดง preview ปัจจุบัน + ปุ่ม "อัปโหลดรูปใหม่"
  if(!imgSrc){
    return (
      <div className="stack" style={{textAlign:'center'}}>
        <div style={{display:'flex',justifyContent:'center',marginBottom:6}}>
          {initialPhotoUrl
            ? <img src={initialPhotoUrl} alt="profile"
                style={{width:140,height:140,borderRadius:'50%',objectFit:'cover',
                        boxShadow:'0 10px 24px -10px rgba(80,40,80,.25)',background:'#FFF7EF'}}/>
            : <div style={{width:140,height:140,borderRadius:'50%',background:'#FFF7EF',
                           display:'grid',placeItems:'center',color:'var(--ink-3)',fontSize:48,
                           boxShadow:'0 10px 24px -10px rgba(80,40,80,.25)'}}>📷</div>}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={pickFile} style={{display:'none'}}/>
        <div className="row" style={{justifyContent:'center', gap:8}}>
          <button className="btn btn-soft-sky btn-sm" disabled={busy} onClick={()=>fileInputRef.current?.click()}>
            <Icon name="image" size={12}/> {initialPhotoUrl ? 'เปลี่ยนรูป' : 'เลือกรูป'}
          </button>
          {initialPhotoUrl && (
            <button className="btn btn-soft btn-sm" disabled={busy}
              style={{background:'#FFE0EA',color:'#C24B5C'}}
              onClick={async ()=>{ if(confirm('ลบรูปโปรไฟล์?')) await onRemove(); }}>
              <Icon name="trash" size={12}/> ลบรูป
            </button>
          )}
        </div>
        <div className="help" style={{textAlign:'center'}}>JPG/PNG ไม่เกิน 5MB · จะถูก crop เป็นวงกลม</div>
      </div>
    );
  }

  // โหมด edit — drag เพื่อจัดตำแหน่ง + zoom
  return (
    <div className="stack">
      <div style={{display:'flex', justifyContent:'center'}}>
        <div
          onMouseDown={(e)=>{e.preventDefault(); startDrag(e.clientX, e.clientY);}}
          onTouchStart={(e)=>{ if(e.touches[0]) startDrag(e.touches[0].clientX, e.touches[0].clientY); }}
          style={{
            position:'relative', width:PREVIEW, height:PREVIEW,
            borderRadius:'50%', overflow:'hidden',
            background:'#FFF7EF', boxShadow:'0 10px 24px -10px rgba(80,40,80,.25)',
            cursor: dragging ? 'grabbing' : 'grab',
            touchAction:'none', userSelect:'none',
          }}
        >
          {/* image positioned: center + offset */}
          <img
            ref={imgRef}
            src={imgSrc}
            alt=""
            onLoad={onImgLoad}
            draggable={false}
            style={{
              position:'absolute',
              left:'50%', top:'50%',
              width: renderedW, height: renderedH,
              transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px))`,
              maxWidth:'none', pointerEvents:'none',
            }}
          />
          {/* hint border */}
          <div style={{
            position:'absolute', inset:0, borderRadius:'50%',
            boxShadow:'inset 0 0 0 2px rgba(255,255,255,.85), inset 0 0 0 3px rgba(0,0,0,.15)',
            pointerEvents:'none',
          }}/>
        </div>
      </div>

      <div className="field" style={{maxWidth:PREVIEW, margin:'0 auto', width:'100%'}}>
        <label>ซูม</label>
        <input type="range" min="1" max="3" step="0.05" value={scale}
          onChange={e=>setScale(parseFloat(e.target.value))}
          style={{width:'100%'}}/>
        <div className="help" style={{textAlign:'center'}}>ลากรูปเพื่อจัดตำแหน่ง · ใช้ slider ปรับซูม</div>
      </div>

      <div className="row" style={{justifyContent:'center', gap:8, flexWrap:'wrap'}}>
        <button className="btn btn-ghost btn-sm" disabled={busy} onClick={()=>setImgSrc(null)}>ยกเลิก</button>
        <button className="btn btn-soft-sky btn-sm" disabled={busy} onClick={()=>fileInputRef.current?.click()}>
          <Icon name="image" size={12}/> เปลี่ยนไฟล์
        </button>
        <button className="btn btn-primary btn-sm" disabled={busy} onClick={handleSave}>
          <Icon name="save" size={12}/> {busy ? 'กำลังอัปโหลด…' : 'บันทึกรูป'}
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={pickFile} style={{display:'none'}}/>
    </div>
  );
}

Object.assign(window, {
  Icon, Avatar, shade, StatCard, Tabs, Segmented, Modal, StrengthChip, Notice, Sparkle, PhotoSlot, Empty, useToast,
  PasswordField, AvatarBubble, AvatarEditor,
});
