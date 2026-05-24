/* === Constants used by UI (data ตัวจริงโหลดจาก Supabase ใน db.jsx) === */

const CHARACTER_STRENGTHS = [];   // จะถูก override โดย state.characterStrengths หลัง hydrate
const STRENGTH_GROUPS = [];

/* fallback list — ใช้ก็ต่อเมื่อ DB ยังว่าง */
const BEHAVIOR_CATEGORIES_DEFAULT = [
  { id:'play',     name:'การเล่น',          emoji:'🧸', color:'#FF8A5C', tone:'sun' },
  { id:'speech',   name:'คำพูด',           emoji:'💬', color:'#9D7FFF', tone:'violet' },
  { id:'study',    name:'การเรียน',         emoji:'📖', color:'#5CC9FF', tone:'sky' },
  { id:'emotion',  name:'อารมณ์',          emoji:'😊', color:'#FF6E8A', tone:'rose' },
  { id:'social',   name:'เพื่อน/สังคม',     emoji:'👫', color:'#4FD1AB', tone:'mint' },
  { id:'help',     name:'ช่วยเหลือผู้อื่น',  emoji:'🤝', color:'#FFC23C', tone:'sun' },
  { id:'other',    name:'อื่น ๆ',           emoji:'⭐', color:'#FF9F4D', tone:'sun' },
];

const TONES = { sun:'sun', violet:'violet', sky:'sky', mint:'mint', rose:'rose' };

/* แนะนำ character strengths ตามหมวดพฤติกรรม (UI ใช้ขณะกรอกบันทึก) */
const STRENGTH_TAGS_BY_CAT = {
  play:    ['humor','social_iq','teamwork','kindness','zest'],
  speech:  ['social_iq','bravery','honesty','perspective','humor'],
  study:   ['love_learning','curiosity','perseverance','creativity','self_reg'],
  emotion: ['self_reg','hope','bravery','perspective','gratitude'],
  social:  ['kindness','teamwork','fairness','social_iq','love'],
  help:    ['kindness','leadership','teamwork','gratitude','social_iq'],
  other:   ['curiosity','creativity','beauty','spirituality','hope'],
};

/* Default term/year — ใช้ตอนยังไม่ hydrate */
const DEFAULT_TERM = 1;
const DEFAULT_YEAR = 2568;

/* === BMI Helpers === */
function calcBMI(weightKg, heightCm){
  if(!weightKg || !heightCm) return null;
  const m = heightCm / 100;
  return +(weightKg / (m*m)).toFixed(1);
}
function bmiCategoryChild(bmi, age, gender){
  if(bmi == null) return { label:'—', tone:'gray', color:'#8A7FA0' };
  if(bmi < 14)  return { label:'น้ำหนักน้อยกว่าเกณฑ์', tone:'sky',  color:'#5CC9FF' };
  if(bmi < 17)  return { label:'น้ำหนักปกติ',           tone:'mint', color:'#4FD1AB' };
  if(bmi < 19)  return { label:'ท้วม',                   tone:'sun',  color:'#FFC23C' };
  if(bmi < 22)  return { label:'เริ่มอ้วน',              tone:'rose', color:'#FF8A5C' };
  return { label:'อ้วน', tone:'rose', color:'#FF6E8A' };
}

Object.assign(window, {
  CHARACTER_STRENGTHS, STRENGTH_GROUPS,
  BEHAVIOR_CATEGORIES_DEFAULT, TONES,
  STRENGTH_TAGS_BY_CAT,
  DEFAULT_TERM, DEFAULT_YEAR,
  calcBMI, bmiCategoryChild,
});
