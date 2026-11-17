"use strict";
/* ---------- reference data ---------- */
/* Poliquin structural-balance ratios. Upper body vs 14-inch (36 cm) close-grip bench 1RM; lower body vs high-bar back squat 1RM.
   rm8: the target is the 8-rep-max load, not a 1RM. */
const LIFTS = [
  {id:"cgbench",name:"Close-grip bench press", sub:"hands about 36 cm apart. Reference lift", grp:"Upper"},
  {id:"bench",  name:"Flat bench press", sub:"competition grip", ref:"cgbench", target:1.15, grp:"Upper"},
  {id:"incline",name:"Incline barbell press, 45°", ref:"cgbench", target:0.83, grp:"Upper"},
  {id:"chin",   name:"Supinated chin-up", sub:"enter added load; bodyweight is included", ref:"cgbench", target:0.81, bw:true, grp:"Upper"},
  {id:"press",  name:"Seated behind-the-neck press", sub:"or seated strict barbell press", ref:"cgbench", target:0.64, grp:"Upper"},
  {id:"scott",  name:"Scott (preacher) curl, straight bar", ref:"cgbench", target:0.46, grp:"Upper"},
  {id:"revcurl",name:"Standing reverse barbell curl", ref:"cgbench", target:0.30, grp:"Upper"},
  {id:"extrot", name:"Seated DB external rotation", sub:"one arm, elbow on knee, 4010 tempo. Target is your 8-rep weight", ref:"cgbench", target:0.09, rm8:true, grp:"Upper"},
  {id:"trap3",  name:"Bent-over trap 3 raise", sub:"one arm. Target is your 8-rep weight", ref:"cgbench", target:0.106, rm8:true, grp:"Upper"},
  {id:"squat",  name:"Back squat, high bar", sub:"reference lift", grp:"Lower"},
  {id:"front",  name:"Front squat", ref:"squat", target:0.85, grp:"Lower"},
  {id:"dead",   name:"Deadlift", ref:"squat", target:1.25, grp:"Lower"},
];
const PAIRS = [
  {id:"split", name:"Split squat (DB per hand)", L:"splitL", R:"splitR", fix:"splitWeak"},
  {id:"row",   name:"Single-arm DB row", L:"rowL", R:"rowR", fix:"rowWeak"},
];
const SCREEN = [
  {id:"shoulderPain", label:"Shoulder pain or clicking when pressing", tag:"upper", fix:["isoER","extRot"]},
  {id:"overheadLimited", label:"Can't get arms fully overhead without arching", tag:"upper", fix:["proneY","tSpine"]},
  {id:"hipFlexorTight", label:"Tight hip flexors (lots of running or sitting)", tag:"lower", fix:["hipMarch","couch"]},
  {id:"ankleLimited", label:"Knee can't reach a wall 10 cm from your toes", tag:"lower", fix:["tibRaise","kotSplit"]},
  {id:"lowBack", label:"Low back flares up after heavy hinging", tag:"lower", fix:["backExtIso","deadBug"]},
  {id:"kneePain", label:"Knee pain on squats or lunges", tag:"lower", fix:["spanishIso","tibRaise"]},
];
const EX = {
  bench:{n:"Flat bench press",t:"upper",lift:"bench"}, neutralDB:{n:"Neutral-grip DB press",t:"upper"},
  chin:{n:"Weighted supinated chin-up",t:"upper",lift:"chin"}, incDB:{n:"Incline DB press",t:"upper"},
  csRow:{n:"Chest-supported row",t:"upper"}, dbPress:{n:"Seated DB shoulder press",t:"upper"},
  landmine:{n:"Half-kneeling landmine press",t:"upper"}, ezCurl:{n:"EZ-bar curl",t:"upper"},
  cgbench:{n:"Close-grip bench press",t:"upper",lift:"cgbench"}, ngPull:{n:"Neutral-grip pull-up",t:"upper"},
  dips:{n:"Dips",t:"upper"}, saRow:{n:"Single-arm DB row (weaker side first)",t:"upper"},
  latRaise:{n:"DB lateral raise",t:"upper"}, rollExt:{n:"Rolling DB triceps extension",t:"upper"},
  cableFly:{n:"Cable fly",t:"upper"}, rearFly:{n:"Rear delt fly",t:"upper"},
  squat:{n:"Back squat",t:"lower",lift:"squat"}, heelsSquat:{n:"Heels-elevated back squat",t:"lower",lift:"squat"},
  rdl:{n:"Romanian deadlift",t:"lower"}, splitSq:{n:"Split squat (weaker side first)",t:"lower"},
  legCurl:{n:"Seated leg curl",t:"lower"}, calf:{n:"Seated calf raise",t:"lower"},
  legExt:{n:"Leg extension",t:"lower"}, dead:{n:"Deadlift",t:"lower",lift:"dead"},
  trapbar:{n:"Trap-bar deadlift",t:"lower"}, front:{n:"Front squat",t:"lower",lift:"front"},
  backExt:{n:"45° back extension",t:"lower"}, lunge:{n:"DB walking lunge",t:"lower"},
  legPress:{n:"Leg press",t:"lower"},
  /* correctives */
  extRot:{n:"Seated DB external rotation",t:"upper",lift:"extrot",why:"Rotator cuff strength lets the pecs and delts work without the shoulder holding back"},
  trap3:{n:"Trap 3 raise",t:"upper",lift:"trap3",why:"Lower traps keep the shoulder blade seated under load"},
  isoER:{n:"Band external rotation, 30 s isometric hold",t:"upper",iso:true,why:"Isometrics calm a cranky shoulder while keeping it loaded"},
  proneY:{n:"Prone Y raise",t:"upper",why:"Overhead strength through the lower traps and rear delts"},
  tSpine:{n:"Foam-roller thoracic extension",t:"upper",mob:true,why:"Opens the upper back so overhead work stops borrowing from the low back"},
  rollExtC:{n:"Rolling DB triceps extension",t:"upper",why:"Triceps are usually what holds back close-grip and lockout strength"},
  cgFloor:{n:"Close-grip floor press",t:"upper",why:"Overloads the top half of the press"},
  lowInc:{n:"Low-incline DB press (15–30°)",t:"upper",why:"Builds the upper chest that incline strength depends on"},
  chinEcc:{n:"Chin-up, 5 s lowering",t:"upper",why:"Slow eccentrics build pulling strength fastest"},
  saRowW:{n:"Single-arm DB row, weaker side +1 set",t:"upper",why:"Closes a left/right gap"},
  heelsGob:{n:"Heels-elevated goblet squat",t:"lower",why:"Quads and upright torso: the usual front-squat limiter"},
  pausedFront:{n:"Paused front squat, 3 s in the hole",t:"lower",why:"Strength out of the bottom position"},
  sbGM:{n:"Safety-bar good morning",t:"lower",why:"Loads the hamstrings in a lengthened position"},
  dsgRDL:{n:"Deficit snatch-grip RDL",t:"lower",why:"More range for the upper back and posterior chain"},
  splitW:{n:"Split squat, weaker side +1 set",t:"lower",why:"Closes a left/right gap"},
  hipMarch:{n:"Banded hip-flexor march",t:"lower",why:"Strong hip flexors, not just stretched ones, for runners"},
  couch:{n:"Couch stretch, 60 s per side",t:"lower",mob:true,why:"Restores hip extension"},
  tibRaise:{n:"Tibialis raise",t:"lower",why:"Front-of-shin strength for ankle range and knee health"},
  kotSplit:{n:"Knee-over-toe split squat",t:"lower",why:"Builds ankle range under load"},
  backExtIso:{n:"Back extension, 30 s isometric hold",t:"lower",iso:true,why:"Spinal erector endurance without heavy loading"},
  deadBug:{n:"Dead bug",t:"lower",why:"Trunk control for heavy hinges"},
  spanishIso:{n:"Spanish squat, 45 s isometric hold",t:"lower",iso:true,why:"Isometric quad loading that is usually kind to knees"},
  dbFlyC:{n:"Flat DB fly",t:"upper",why:"Wide-grip pressing leans on the pecs more than close-grip does"},
  scottC:{n:"Scott (preacher) curl",t:"upper",lift:"scott",why:"Elbow-flexor strength in the stretched position"},
  revCurlC:{n:"Standing reverse curl",t:"upper",lift:"revcurl",why:"Brachialis and forearms. Weak ones often limit pulling and elbow health"},
  hammerC:{n:"Hammer curl",t:"upper",why:"Brachialis and brachioradialis"},
  /* alternatives for swaps */
  dbBench:{n:"Flat DB press",t:"upper"}, machPress:{n:"Machine chest press",t:"upper"}, larsen:{n:"Larsen press (feet up)",t:"upper"},
  jmPress:{n:"JM press",t:"upper"}, dbCg:{n:"Close-grip DB press (palms in)",t:"upper"},
  incBB:{n:"Incline barbell press",t:"upper",lift:"incline"}, machInc:{n:"Incline machine press",t:"upper"},
  latPull:{n:"Supinated lat pulldown",t:"upper"}, ngPulldown:{n:"Neutral-grip pulldown",t:"upper"}, pullup:{n:"Pronated pull-up",t:"upper"},
  sealRow:{n:"Seal row",t:"upper"}, cableRow:{n:"Seated cable row",t:"upper"}, tbarRow:{n:"Chest-supported T-bar row",t:"upper"}, meadows:{n:"Meadows row",t:"upper"},
  btnPress:{n:"Seated behind-the-neck press",t:"upper",lift:"press"}, machShoulder:{n:"Machine shoulder press",t:"upper"}, strictPress:{n:"Standing strict press",t:"upper"},
  inclCurl:{n:"Incline DB curl",t:"upper"}, cableCurl:{n:"Cable curl",t:"upper"},
  pushdown:{n:"Cable rope pushdown",t:"upper"}, ohExt:{n:"Overhead cable triceps extension",t:"upper"}, skull:{n:"EZ-bar skull crusher",t:"upper"},
  cableLat:{n:"Single-arm cable lateral raise",t:"upper"}, leanLat:{n:"Leaning DB lateral raise",t:"upper"}, machLat:{n:"Machine lateral raise",t:"upper"},
  pecDeck:{n:"Pec deck",t:"upper"}, dbFly:{n:"Flat DB fly",t:"upper"},
  facePull:{n:"Face pull with external rotation",t:"upper"}, revPec:{n:"Reverse pec deck",t:"upper"}, cableER:{n:"Cable external rotation",t:"upper"},
  cableY:{n:"Cable Y raise",t:"upper"}, safetySq:{n:"Safety-bar squat",t:"lower"}, hack:{n:"Hack squat",t:"lower"}, pendulum:{n:"Pendulum squat",t:"lower"},
  gobletSq:{n:"Goblet squat",t:"lower"}, cycSquat:{n:"Cyclist squat (heels elevated, narrow)",t:"lower"},
  dbRDL:{n:"DB Romanian deadlift",t:"lower"}, ghr:{n:"Glute-ham raise",t:"lower"}, cablePT:{n:"Cable pull-through",t:"lower"},
  sumo:{n:"Sumo deadlift",t:"lower"}, blockPull:{n:"Block pull (below knee)",t:"lower"}, snatchDL:{n:"Snatch-grip deadlift",t:"lower"},
  bulgarian:{n:"Bulgarian split squat",t:"lower"}, stepUp:{n:"Peterson step-up",t:"lower"}, revLunge:{n:"Reverse lunge",t:"lower"},
  lyingCurl:{n:"Lying leg curl",t:"lower"}, nordic:{n:"Nordic curl",t:"lower"},
  standCalf:{n:"Standing calf raise",t:"lower"}, lpCalf:{n:"Leg-press calf raise",t:"lower"},
  sissy:{n:"Sissy squat",t:"lower"}, reverseHyper:{n:"Reverse hyper",t:"lower"}, cableHipFlex:{n:"Cable hip-flexor raise",t:"lower"},
  bandTib:{n:"Banded tibialis pull",t:"lower"}, deficitRDL:{n:"Deficit snatch-grip RDL",t:"lower"},
};
/* Interchangeable exercises: same movement pattern, same slot. */
const SUBS = [
  ["bench","neutralDB","dbBench","machPress","larsen"],
  ["cgbench","dbCg","jmPress","cgFloor","dips"],
  ["incDB","incBB","lowInc","machInc"],
  ["chin","ngPull","pullup","latPull","ngPulldown","chinEcc"],
  ["csRow","saRow","sealRow","cableRow","tbarRow","meadows","saRowW"],
  ["dbPress","btnPress","landmine","machShoulder","strictPress"],
  ["ezCurl","scottC","inclCurl","cableCurl","hammerC","revCurlC"],
  ["rollExt","rollExtC","pushdown","ohExt","skull"],
  ["latRaise","cableLat","leanLat","machLat"],
  ["cableFly","pecDeck","dbFly","dbFlyC"],
  ["rearFly","facePull","revPec"],
  ["extRot","cableER","isoER"],
  ["trap3","proneY","cableY"],
  ["squat","heelsSquat","safetySq","hack","pendulum"],
  ["front","heelsGob","pausedFront","gobletSq","cycSquat"],
  ["rdl","dbRDL","sbGM","dsgRDL","ghr","cablePT"],
  ["dead","trapbar","sumo","blockPull","snatchDL"],
  ["splitSq","splitW","kotSplit","bulgarian","stepUp","revLunge","lunge"],
  ["legCurl","lyingCurl","nordic"],
  ["calf","standCalf","lpCalf"],
  ["legExt","sissy","spanishIso","legPress"],
  ["backExt","backExtIso","reverseHyper","deadBug"],
  ["hipMarch","cableHipFlex","couch"],
  ["tibRaise","bandTib"],
];
const altsFor = id => (SUBS.find(g=>g.includes(id))||[id]);
/* Short form cues for the less familiar movements. */
const CUES = {
  extRot:"Elbow on your knee, forearm across the body. Rotate up until the forearm is vertical. 4 s down, no swinging.",
  trap3:"Bend over with one hand on a bench. Raise the arm at a 45° angle, thumb up, like the top stroke of a Y. Light weight.",
  proneY:"Lie face down on an incline bench. Raise both arms in a Y, thumbs up, and squeeze the lower traps.",
  isoER:"Elbow tucked, band pulling your hand inward. Rotate out to the end range and hold.",
  tibRaise:"Back against a wall, heels about a foot out. Lift your toes as high as you can.",
  hipMarch:"Band around your feet, lying or hanging. Drive one knee above hip height and hold for 1 s.",
  kotSplit:"Front heel flat. Push the knee well past the toes. Slow on the way down.",
  spanishIso:"Strap around a post, behind your knees. Sit back to a 90° knee angle, shins vertical, and hold.",
  sbGM:"Soft knees. Push your hips back until your torso is near parallel, then drive the hips through.",
  dsgRDL:"Stand on a plate, wide grip. Lower the bar slowly to mid-shin with a flat back.",
  deficitRDL:"Stand on a plate, wide grip. Lower the bar slowly to mid-shin with a flat back.",
  jmPress:"Close grip. Lower the bar toward your chin by bending the elbows and letting the bar drift back, then press.",
  rollExt:"Lower the dumbbells beside your head, then roll them up to lockout over your chest.",
  rollExtC:"Lower the dumbbells beside your head, then roll them up to lockout over your chest.",
  sealRow:"Lie face down on a high bench and row the bar to the bench. Your legs can't help.",
  meadows:"Landmine, side-on. Row the end of the bar with one hand, elbow high.",
  stepUp:"Heel raised on a small plate. Drive through the front leg, knee tracking over the toes.",
  larsen:"Bench with your legs straight and off the floor. No leg drive.",
  cycSquat:"Narrow stance, heels on a wedge. Keep your torso upright and the knees far forward.",
  couch:"Back knee against a wall, front foot planted. Squeeze the glute and stay tall.",
  tSpine:"Roller under the upper back, hands behind your head. Extend over it at a few spots.",
  backExtIso:"Hold the top of a 45° back extension, glutes squeezed, ribs down.",
};
const demoUrl = name => "https://www.youtube.com/results?search_query=" + encodeURIComponent(name.replace(/\(.*?\)|,.*$/g,"").trim() + " exercise form");
const FIX = {bench:["lowInc","dbFlyC"], incline:["lowInc"], press:["proneY","landmine"], chin:["chinEcc"],
  scott:["scottC"], revcurl:["revCurlC","hammerC"], trap3:["trap3","proneY"], cgLag:["rollExtC","cgFloor"],
  extrot:["extRot","trap3"], front:["heelsGob","pausedFront"], dead:["sbGM","dsgRDL"], squatLag:["heelsGob","kotSplit"],
  splitWeak:["splitW"], rowWeak:["saRowW"]};
const DEFAULT_FIX = {upper:["extRot","trap3"], lower:["tibRaise","hipMarch"]};

const DAYS = {
  "Upper A":{tag:"upper",slots:[["A1","bench","A"],["A2","chin","A"],["B1","incDB","B"],["B2","csRow","B"],["C1","dbPress","C"],["C2","ezCurl","C"]],fin:"cableFly"},
  "Lower A":{tag:"lower",slots:[["A","squat","A"],["B1","rdl","B"],["B2","splitSq","B"],["C1","legCurl","C"],["C2","calf","C"]],fin:"legExt"},
  "Upper B":{tag:"upper",slots:[["A1","cgbench","A"],["A2","ngPull","A"],["B1","dips","B"],["B2","saRow","B"],["C1","latRaise","C"],["C2","rollExt","C"]],fin:"rearFly"},
  "Lower B":{tag:"lower",slots:[["A","dead","A"],["B1","front","B"],["B2","backExt","B"],["C1","lunge","C"],["C2","calf","C"]],fin:"legPress"},
  "Full body":{tag:"both",slots:[["A1","front","A"],["A2","chin","A"],["B1","incDB","B"],["B2","rdl","B"],["C1","splitSq","C"],["C2","saRow","C"]],fin:null},
  "Weak point":{tag:"both",slots:[],fin:null,weak:true},
};
const SPLITS = {3:["Upper A","Lower A","Full body"],4:["Upper A","Lower A","Upper B","Lower B"],5:["Upper A","Lower A","Upper B","Lower B","Weak point"]};
const PHASES = {
  acc:{name:"Accumulation", A:{s:4,r:"6–8",t:"4010",rest:90}, B:{s:3,r:"8–10",t:"3110",rest:75}, C:{s:3,r:"10–12",t:"3011",rest:60}, D:{s:3,r:"12–15",t:"3012",rest:45}},
  int:{name:"Intensification", A:{s:5,r:"3–5",t:"31X0",rest:150}, B:{s:4,r:"5–7",t:"3010",rest:120}, C:{s:3,r:"8–10",t:"3010",rest:75}, D:{s:3,r:"10–12",t:"3012",rest:45}},
};

/* ---------- state (all on this device) ---------- */
/* Local calendar date, not UTC: a 7am session in Melbourne is today, not yesterday. */
const today = () => { const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); };
const EXAMPLE = () => ({
  example:true, bw:88,
  lifts:{cgbench:{w:90,r:5},bench:{w:100,r:5},incline:{w:75,r:6},chin:{w:20,r:5},press:{w:50,r:5},scott:{w:40,r:6},revcurl:{w:22,r:8},extrot:{w:8,r:8},trap3:{w:7,r:8},
    squat:{w:130,r:5},front:{w:100,r:4},dead:{w:170,r:4},splitL:{w:40,r:8},splitR:{w:44,r:8},rowL:{w:40,r:8},rowR:{w:42,r:8}},
  screen:{hipFlexorTight:true},
  plan:{days:4,hybrid:true,finisher:true},
  prog:{phase:1,week:1,day:0},
  swaps:{},
  baseline:null,
  checkins:[],
  assessments:[]
});
let P = EXAMPLE();
let SESSIONS = [];
let DRAFT = {};       // key -> [{w,r,done}]
let DRAFT_DAY = null; // day index the draft is for
let storageOK = true;

function lsGet(k){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }catch(e){ return null; } }
function lsSet(k,v){
  try{ localStorage.setItem(k, JSON.stringify(v)); if(!storageOK){ storageOK = true; setSync(syncLabel()); } }
  catch(e){ storageOK = false; setSync("Couldn't save on this device. Storage is full or blocked."); }
}
function saveProfile(){ P.updatedAt = Date.now(); lsSet("wl.profile", P); }
function saveDraft(){ lsSet("wl.draft", {day:DRAFT_DAY, phase:P.prog.phase, week:P.prog.week, d:DRAFT}); }
function addSession(s){ SESSIONS.push(s); SESSIONS.sort((a,b)=>a.ts-b.ts); lsSet("wl.sessions", SESSIONS); }
function setSync(t){ document.getElementById("syncState").textContent = t; }
const standalone = () => (window.matchMedia && matchMedia("(display-mode: standalone)").matches) || window.navigator.standalone === true;
function syncLabel(){
  const last = lsGet("wl.lastBackup");
  const b = last ? ` · last backup ${last.slice(5)}` : " · no backup yet";
  return "Saved on this device" + b;
}

/* ---------- clean data from a backup file: numbers stay numbers, dates stay dates ---------- */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const cNum = x => { if(x===""||x==null) return ""; const n = Number(x); return isFinite(n) ? n : ""; };
const cOpt = x => { const n = cNum(x); return n==="" ? null : n; };
const cDate = x => typeof x==="string" && DATE_RE.test(x) ? x : null;
function cleanProfile(p){
  p.bw = cNum(p.bw);
  const lifts = {}; Object.keys(p.lifts||{}).forEach(k=>{ const l = p.lifts[k]||{}; lifts[k] = {w:cNum(l.w), r:cNum(l.r)}; }); p.lifts = lifts;
  p.prog = {phase:Math.max(1, Math.floor(+(p.prog||{}).phase)||1), week:Math.min(4, Math.max(1, Math.floor(+(p.prog||{}).week)||1)), day:Math.max(0, Math.floor(+(p.prog||{}).day)||0)};
  p.plan = Object.assign({days:4,hybrid:false,finisher:true}, p.plan||{}); if(![3,4,5].includes(+p.plan.days)) p.plan.days = 4; p.plan.days = +p.plan.days;
  p.assessments = (Array.isArray(p.assessments)?p.assessments:[]).filter(a=>a && cDate(a.date)).map(a=>{
    const ls = {}; Object.keys(a.lifts||{}).forEach(k=>{ const l = a.lifts[k]||{}; ls[k] = {w:cNum(l.w), r:cNum(l.r)}; });
    return {date:a.date, bw:cNum(a.bw), lifts:ls, weak:Array.isArray(a.weak)?a.weak.map(String):[]}; });
  p.checkins = (Array.isArray(p.checkins)?p.checkins:[]).filter(c=>c && cDate(c.date)).map(c=>{
    const o = {date:c.date, phase:Math.floor(+c.phase)||1, week:Math.floor(+c.week)||1};
    if(c.skipped) o.skipped = true;
    ["rhr","hrv","sleep","bw","waist","sore","stress","level"].forEach(k=>{ if(k in c) o[k] = cOpt(c[k]); });
    return o; });
  if(p.baseline && typeof p.baseline==="object"){ const b = p.baseline;
    p.baseline = {date:cDate(b.date)||today(), goal:["size","strength","hybrid"].includes(b.goal)?b.goal:"size", age:["<1","1-3","3+"].includes(b.age)?b.age:"1-3"};
    if(b.skipped) p.baseline.skipped = true;
    ["days","bw","waist","rhr","hrv","sleep"].forEach(k=>{ if(k in b) p.baseline[k] = cOpt(b[k]); });
  } else p.baseline = null;
  const sc = {}; Object.keys(p.screen||{}).forEach(k=>{ sc[k] = !!p.screen[k]; }); p.screen = sc;
  const sw = {}; Object.keys(p.swaps||{}).forEach(k=>{ if(EX[p.swaps[k]]) sw[k] = p.swaps[k]; }); p.swaps = sw;
  return p;
}
function cleanSessions(list){
  return list.filter(x=>x && cDate(x.date)).map(x=>({
    id:String(x.id||"s"+x.ts), ts:Number(x.ts)||Date.parse(x.date)||0, date:x.date, day:String(x.day||""),
    phase:Math.floor(+x.phase)||1, week:Math.floor(+x.week)||1,
    entries:(Array.isArray(x.entries)?x.entries:[]).filter(e=>e && EX[e.ex]).map(e=>({ex:e.ex,
      sets:(Array.isArray(e.sets)?e.sets:[]).map(t=>({w:Number(t&&t.w)||0, r:Number(t&&t.r)||0})).filter(t=>isFinite(t.w) && t.r>0)})).filter(e=>e.sets.length)
  }));
}

/* ---------- backup ---------- */
function exportData(){
  const data = {app:"weak-link-training", version:1, exported:new Date().toISOString(), profile:P, sessions:SESSIONS};
  const blob = new Blob([JSON.stringify(data, null, 1)], {type:"application/json"});
  const name = `weak-link-backup-${today()}.json`;
  const file = (typeof File === "function") ? new File([blob], name, {type:"application/json"}) : null;
  const done = ()=>{ lsSet("wl.lastBackup", today()); setSync(syncLabel()); };
  // On phones, the share sheet lets you save to Files, iCloud Drive or send it to yourself
  if(file && navigator.canShare && navigator.canShare({files:[file]}) && /iPhone|iPad|Android/i.test(navigator.userAgent)){
    navigator.share({files:[file], title:"Weak Link backup"}).then(done).catch(()=>{});
    return;
  }
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href), 4000);
  done();
}
function importData(file){
  const rd = new FileReader();
  rd.onload = () => {
    let d; try{ d = JSON.parse(rd.result); }catch(e){ d = null; }
    if(!d || !d.profile || !Array.isArray(d.sessions)){ modal("Couldn't read that file", "Pick a backup file this app exported (weak-link-backup-….json).", [["OK",null,true]]); return; }
    modal("Restore this backup?", `It has ${d.sessions.length} logged session${d.sessions.length===1?"":"s"}${d.exported?`, saved ${d.exported.slice(0,10)}`:""}. It replaces everything currently on this device.`, [["Restore", ()=>{
      P = cleanProfile(Object.assign(EXAMPLE(), d.profile));
      SESSIONS = cleanSessions(d.sessions).sort((a,b)=>a.ts-b.ts);
      DRAFT = {}; DRAFT_DAY = null; lsSet("wl.draft", null);
      saveProfile(); lsSet("wl.sessions", SESSIONS);
      location.hash = "#today"; route();
      modal("Backup restored", `${SESSIONS.length} session${SESSIONS.length===1?"":"s"} loaded.`, [["Done",null,true]]);
    }, true],["Cancel"]]);
  };
  rd.readAsText(file);
}
document.getElementById("importFile").addEventListener("change", e=>{ const f = e.target.files && e.target.files[0]; if(f) importData(f); e.target.value = ""; });

/* ---------- maths ---------- */
const e1 = (w,r) => (w>0 && r>0) ? w*(1+r/30) : 0;
const r25 = x => Math.round(x/2.5)*2.5;
function liftE1(id){
  const l = P.lifts[id]; if(!l) return 0;
  const def = LIFTS.find(x=>x.id===id);
  const w = (def && def.bw) ? (Number(l.w)||0) + (Number(P.bw)||0) : Number(l.w)||0;
  return e1(w, Number(l.r)||0);
}
function analyse(){
  const rows = [];
  for(const L of LIFTS){
    if(!L.ref) continue;
    const a = L.rm8 ? liftE1(L.id)/(1+8/30) : liftE1(L.id), b = liftE1(L.ref);
    if(!a || !b){ rows.push({L, score:null}); continue; }
    const ratio = a/b, score = ratio/L.target;
    rows.push({L, ratio, score, status: score>=0.95 ? "good" : score>=0.85 ? "warn" : "bad"});
  }
  const pairs = PAIRS.map(p=>{
    const l = e1(+(P.lifts[p.L]||{}).w, +(P.lifts[p.L]||{}).r), r = e1(+(P.lifts[p.R]||{}).w, +(P.lifts[p.R]||{}).r);
    if(!l||!r) return {p, gap:null};
    const gap = Math.abs(l-r)/Math.max(l,r);
    return {p, gap, weak: l<r ? "left" : "right", status: gap<=0.05 ? "good" : gap<=0.10 ? "warn" : "bad"};
  });
  // weak-link keys, worst first
  const weak = rows.filter(x=>x.score!=null && x.score<0.95).sort((a,b)=>a.score-b.score).map(x=>x.L.id);
  const dRow = rows.find(x=>x.L.id==="dead");
  if(dRow && dRow.score>1.1) weak.push("squatLag");
  const bRow = rows.find(x=>x.L.id==="bench");
  if(bRow && bRow.score>1.1) weak.push("cgLag");
  pairs.filter(x=>x.gap!=null && x.gap>0.05).forEach(x=>weak.push(x.p.fix));
  return {rows, pairs, weak};
}
function correctives(tag, n){
  const A = analyse(); const out = [];
  const push = id => { if(!out.includes(id) && EX[id] && (tag==="both" || EX[id].t===tag)) out.push(id); };
  A.weak.forEach(k => (FIX[k]||[]).forEach(push));
  SCREEN.forEach(s => { if(P.screen[s.id]) s.fix.forEach(push); });
  if(out.length===0) (tag==="both" ? DEFAULT_FIX.upper.concat(DEFAULT_FIX.lower) : DEFAULT_FIX[tag]).forEach(push);
  return out.slice(0,n);
}
function swap(id){
  const s = P.screen;
  if(s.shoulderPain && id==="bench") return "neutralDB";
  if(s.lowBack && id==="dead") return "trapbar";
  if(s.ankleLimited && id==="squat") return "heelsSquat";
  if(s.overheadLimited && id==="dbPress") return "landmine";
  return id;
}
function phaseKey(n){ const odd = n%2===1; const strengthFirst = P.baseline && P.baseline.goal==="strength"; return (odd !== !!strengthFirst) ? "acc" : "int"; }
/* ---------- readiness ---------- */
function currentCheckin(){ return (P.checkins||[]).find(c=>c.phase===P.prog.phase && c.week===P.prog.week) || null; }
function readiness(c){
  const b = P.baseline||{}; const flags = [];
  if(c.rhr && b.rhr && c.rhr - b.rhr >= 5) flags.push({k:"rec", t:`resting HR ${c.rhr} is ${c.rhr-b.rhr} above your ${b.rhr} baseline`});
  if(c.hrv && b.hrv && c.hrv < b.hrv*0.9) flags.push({k:"rec", t:`HRV ${c.hrv} is ${Math.round((1-c.hrv/b.hrv)*100)}% below your ${b.hrv} baseline`});
  if(c.sleep && c.sleep < Math.min(6.5, (b.sleep||7)-1)) flags.push({k:"life", t:`sleep is averaging ${c.sleep} h`});
  if(c.sore>=4) flags.push({k:"life", t:"soreness is high"});
  if(c.stress>=4) flags.push({k:"life", t:"stress is high"});
  const rec = flags.some(f=>f.k==="rec"), life = flags.some(f=>f.k==="life");
  const level = (rec && life) || flags.length>=3 ? 2 : flags.length>=1 ? 1 : 0;
  const msg = level===2 ? "One set comes off each main lift this week. Same tempos, same loads. Recovery is the priority."
    : level===1 ? "Train as written, but leave 2 reps in the tank on every set."
    : "Recovery looks normal. Train as written.";
  return {level, flags, msg};
}
function buildDay(dayName){
  const D = DAYS[dayName]; const ph = PHASES[phaseKey(P.prog.phase)]; const wk = P.prog.week;
  const deload = wk===4;
  const ci = currentCheckin(); const pullBack = !deload && ci && ci.level===2;
  const novice = P.baseline && P.baseline.age==="<1";
  const mk = (label, defId, kind, extra) => {
    const swapKey = dayName+"|"+defId; const chosen = (P.swaps||{})[swapKey];
    const exId = chosen && EX[chosen] ? chosen : defId;
    const rx = ph[kind]; let s = rx.s;
    if(P.plan.hybrid && D.tag==="lower" && kind==="C") s = Math.max(2, s-1);
    if(novice && (kind==="A"||kind==="B")) s = Math.max(2, s-1);
    if(pullBack && (kind==="A"||kind==="B")) s = Math.max(2, s-1);
    if(deload) s = Math.max(2, Math.round(s*0.6));
    const ex = EX[exId];
    let r = rx.r, t = rx.t;
    if(ex.iso){ r = "1 hold"; t = "hold"; }
    if(ex.mob){ r = "60 s"; t = "slow"; }
    return Object.assign({label, ex:exId, def:defId, swapKey, swapped:exId!==defId, kind, sets:s, reps:r, tempo:t, rest:rx.rest}, extra||{});
  };
  const out = [];
  if(D.weak){
    const list = correctives("both", 6);
    list.forEach((id,i)=>out.push(mk((i%2? "B":"A")+(i%2+1), id, i<2?"B":"D")));
    out.forEach((x,i)=>{ x.label = String.fromCharCode(65+Math.floor(i/2)) + (i%2+1); });
  } else {
    D.slots.forEach(([lab,id,kind]) => out.push(mk(lab, swap(id), kind)));
    const cor = correctives(D.tag, 3);
    cor.forEach((id,i)=>out.push(mk("D"+(i+1), id, "D")));
    const showFin = P.plan.finisher && phaseKey(P.prog.phase)==="acc" && D.fin && !(P.plan.hybrid && D.tag==="lower") && !deload;
    if(showFin){ const f = mk("F", D.fin, "C"); Object.assign(f, {kind:"F", sets:3, reps:"15–20", tempo:"2010", rest:30, finisher:true}); out.push(f); }
  }
  return out;
}
function suggestLoad(slot){
  const ex = EX[slot.ex]; if(!ex.lift || slot.kind==="F") return null;
  const max = liftE1(ex.lift); if(!max) return null;
  const top = parseInt(String(slot.reps).split("–").pop(),10); if(!top) return null;
  let w = max/(1+top/30) * 0.92;              // slower tempo costs load
  if(P.prog.week===4) w *= 0.65;
  if(P.baseline && P.baseline.age==="<1") w *= 0.9;
  if(LIFTS.find(l=>l.id===ex.lift && l.bw)) w -= (+P.bw||0);
  return Math.max(0, r25(w));
}
function lastFor(exId){
  for(let i=SESSIONS.length-1;i>=0;i--){
    const e = (SESSIONS[i].entries||[]).find(x=>x.ex===exId);
    if(e && e.sets && e.sets.length) return {date:SESSIONS[i].date, sets:e.sets};
  }
  return null;
}
const split = () => SPLITS[P.plan.days] || SPLITS[4];
const fmt = n => (Math.round(n*10)/10).toString();
const esc = s => String(s).replace(/[&<>"]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

/* ---------- views ---------- */
const view = document.getElementById("view");
function route(){
  const h = (location.hash||"#today").slice(1);
  const fn = {today:vToday, assess:vAssess, plan:vPlan, progress:vProgress, method:vMethod}[h] || vToday;
  const cur = fn===vToday ? "today" : h;
  document.querySelectorAll("#tabs a").forEach(a=>a.setAttribute("aria-current", a.getAttribute("href")==="#"+cur ? "page" : "false"));
  view.innerHTML = fn();
  window.scrollTo(0,0);
}
function rerender(){ const y = window.scrollY; route(); window.scrollTo(0,y); }
function exampleBanner(){
  return P.example ? `<div class="banner"><b>Example numbers loaded.</b> Go to Assess, enter your own lifts and save. Your program rebuilds around your weak links.</div>` : "";
}
function installBanner(){
  if(standalone() || lsGet("wl.hideInstall")) return "";
  const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  const how = ios ? "In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b>." : "Use your browser menu and choose <b>Install app</b> or <b>Add to Home screen</b>.";
  return `<div class="banner"><b>Install it before you log anything.</b> ${how} It opens full screen, works offline at the gym, and keeps your data safe from browser clean-ups. <button class="ghost small" id="hideInstall" style="height:30px;margin-left:4px">Got it</button></div>`;
}

const v = id => { const el = document.getElementById(id); if(!el) return null; const n = parseFloat(el.value); return isFinite(n) ? n : null; };
function numField(id, label, val, step, hint){ return `<label class="f" for="${id}">${label}<input type="number" inputmode="decimal" step="${step||1}" id="${id}" value="${val??""}" ${hint?`placeholder="${hint}"`:""}></label>`; }
function scale(id, label, lo, hi){ return `<label class="f" for="${id}">${label}<select id="${id}">${[1,2,3,4,5].map(n=>`<option value="${n}" ${n===2?"selected":""}>${n}${n===1?" · "+lo:n===5?" · "+hi:""}</option>`).join("")}</select></label>`; }
function baselineCard(){
  return `<section class="card"><div class="row between"><h2>Week 1 baseline</h2><span class="chip acc">2 minutes</span></div>
  <p class="small muted">This sets up your program and the numbers your weekly check-ins compare against. For heart rate, HRV and sleep, use the 7-day averages from your watch.</p>
  <div class="grid2">
    <label class="f" for="bGoal">Main goal<select id="bGoal"><option value="size">Build muscle</option><option value="strength">Get stronger</option><option value="hybrid">Lift alongside running or Hyrox</option></select></label>
    <label class="f" for="bAge">Lifting consistently for<select id="bAge"><option value="<1">Less than a year</option><option value="1-3" selected>1–3 years</option><option value="3+">3+ years</option></select></label>
    <label class="f" for="bDays">Days a week you can lift<select id="bDays"><option>3</option><option selected>4</option><option>5</option></select></label>
    ${numField("bBw","Bodyweight (kg)", P.example?"":P.bw, 0.1)}
    ${numField("bWaist","Waist at the navel (cm)", "", 0.5)}
    ${numField("bRhr","Resting heart rate (bpm)", "", 1)}
    ${numField("bHrv","HRV, overnight avg (ms)", "", 1, "optional")}
    ${numField("bSleep","Sleep, avg hours", "", 0.1)}
  </div>
  <div class="btns"><button class="primary" id="saveBaseline">Save baseline</button><button id="skipBaseline">Skip for now</button></div></section>`;
}
function checkinCard(){
  const last = (P.checkins||[]).filter(c=>!c.skipped).slice(-1)[0] || {};
  return `<section class="card"><div class="row between"><h2>Weekly check-in</h2><span class="chip acc">Week ${P.prog.week}</span></div>
  <p class="small muted">Twenty seconds before your first session. If recovery is down, the app trims this week's volume.</p>
  <div class="grid2">
    ${numField("cRhr","Resting HR, 7-day avg", "", 1, P.baseline.rhr?`baseline ${P.baseline.rhr}`:"")}
    ${numField("cHrv","HRV, 7-day avg", "", 1, P.baseline.hrv?`baseline ${P.baseline.hrv}`:"optional")}
    ${numField("cSleep","Sleep, avg hours", "", 0.1)}
    ${numField("cBw","Bodyweight (kg)", "", 0.1, last.bw||P.bw||"optional")}
    ${scale("cSore","Soreness","fresh","wrecked")}
    ${scale("cStress","Life stress","calm","maxed")}
    ${numField("cWaist","Waist (cm), monthly", "", 0.5, "optional")}
  </div>
  <div class="btns"><button class="primary" id="saveCheckin">Save check-in</button><button id="skipCheckin">Skip this week</button></div></section>`;
}
function vToday(){
  const days = split(); const di = Math.min(P.prog.day, days.length-1); const name = days[di];
  if(DRAFT_DAY!==di){ DRAFT = {}; DRAFT_DAY = di; }
  const ph = PHASES[phaseKey(P.prog.phase)];
  const slots = buildDay(name);
  const wkNote = P.prog.week===4 ? "Deload week. Same tempos, about 60–65% of your usual loads, fewer sets."
    : P.prog.week===1 ? "Week 1. Find loads you can own at the written tempo. Leave a rep in the tank."
    : "Beat last week at the same tempo: one more rep, or 2.5 kg more for the same reps.";
  let h = installBanner() + exampleBanner();
  const ci = currentCheckin();
  if(!P.baseline) h += baselineCard();
  else if(!ci) h += checkinCard();
  h += `<div class="hero"><div class="row"><span class="chip acc">Phase ${P.prog.phase} · ${ph.name}</span><span class="eyebrow">Week ${P.prog.week} of 4 · Day ${di+1} of ${days.length}</span>${ci && !ci.skipped ? (()=>{const R=readiness(ci); return `<span class="chip ${["good","warn","bad"][R.level]}">Readiness: ${["Green","Amber","Red"][R.level]}</span>`;})() : ""}</div>
    <h1>${esc(name)}</h1><p class="headline">${wkNote}</p>${ci && !ci.skipped ? (()=>{const R=readiness(ci); return R.level ? `<p class="small" style="color:var(--ink-2)"><b>${R.msg}</b> ${R.flags.map(f=>f.t).join("; ")}.</p>` : "";})() : ""}</div>
    <section class="card"><div class="row"><label class="f" for="daySel" style="flex:1">Train a different day
      <select id="daySel">${days.map((d,i)=>`<option value="${i}" ${i===di?"selected":""}>Day ${i+1}: ${esc(d)}</option>`).join("")}</select></label></div></section>`;
  slots.forEach((s,idx)=>{
    const ex = EX[s.ex]; const key = idx+":"+s.ex;
    if(!DRAFT[key]) DRAFT[key] = Array.from({length:s.sets}, ()=>({w:"",r:"",done:false}));
    const last = lastFor(s.ex); const sug = suggestLoad(s);
    const lastTxt = last ? `Last (${last.date.slice(5)}): ${last.sets.map(x=>`${x.w}×${x.r}`).join(", ")}` : (sug!=null ? `Suggested start: ${sug} kg${ex.lift==="chin"?" added":""}` : "First time: pick a load you can control at this tempo");
    const tempoBtn = /^\d|X/.test(s.tempo) && s.tempo.length===4 ? `<button class="ghost small" data-tempo="${s.tempo}" data-reps="${esc(s.reps)}">Tempo coach</button>` : "";
    h += `<section class="card"><div class="exhead"><span class="slot">${s.label}</span><div class="t">
      <h3>${esc(ex.n)}</h3>
      <div class="rx"><b>${s.sets} × ${esc(s.reps)}</b> · tempo <b class="mono">${s.tempo}</b> · rest <b>${s.rest}s</b>${s.finisher?" · pump finisher":""}</div>
      ${s.swapped?`<div class="small"><span class="chip mut">Swapped in for ${esc(EX[s.def].n)}</span></div>`:""}
      ${ex.why?`<div class="small muted">${esc(ex.why)}</div>`:""}
      ${CUES[s.ex]?`<div class="small"><b>How:</b> ${esc(CUES[s.ex])}</div>`:""}
      <div class="small muted">${esc(lastTxt)}</div></div></div>
      <div class="sets">${DRAFT[key].map((st,j)=>{
        const ph1 = last && last.sets[j] ? last.sets[j] : null;
        return `<div class="set"><span class="n">${j+1}</span>
          <input type="number" inputmode="decimal" step="0.5" id="w-${idx}-${j}" aria-label="Set ${j+1} kg" placeholder="${ph1?ph1.w:(sug!=null?sug:"kg")}" value="${st.w}" data-k="${key}" data-j="${j}" data-f="w">
          <input type="number" inputmode="numeric" id="r-${idx}-${j}" aria-label="Set ${j+1} reps" placeholder="${ph1?ph1.r:"reps"}" value="${st.r}" data-k="${key}" data-j="${j}" data-f="r">
          <button class="tick ${st.done?"done":""}" data-tick="${key}" data-j="${j}" data-rest="${s.rest}" aria-label="Log set ${j+1}">✓</button></div>`;}).join("")}</div>
      <div class="btns">${tempoBtn}${altsFor(s.def).length>1?`<button class="ghost small" data-swap="${esc(s.swapKey)}" data-def="${s.def}" data-cur="${s.ex}">Swap</button>`:""}<a class="demo small" href="${demoUrl(ex.n)}" target="_blank" rel="noopener">Watch demo ↗</a><button class="ghost small" data-addset="${key}">Add set</button></div></section>`;
  });
  h += `<section class="card"><p class="small muted">Finishing saves the session and moves you to the next day. After week 4 you'll be asked to re-test.</p>
    <button class="primary" id="finish">Finish session</button></section>`;
  return h;
}
function vAssess(){
  const A = analyse();
  let h = exampleBanner();
  h += `<section class="card"><h2>Strength ratios</h2><p class="small muted">These are Charles Poliquin's published structural balance ratios. Poliquin was Justin King's mentor, and this is the assessment King says he runs. Upper-body lifts are measured against your close-grip bench, lower-body lifts against your high-bar back squat. The black mark is the target. Under 95% of target is lagging. Under 85% is a weak link, and it gets corrective work in every session.</p>
    <div>${A.rows.map(x=>{
      if(x.score==null) return `<div class="ratio"><div class="row between"><span>${esc(x.L.name)}</span><span class="chip mut">No data</span></div></div>`;
      const pct = Math.min(100, x.score*100/1.3); const tgt = 100/1.3;
      const lab = x.status==="good" ? (x.score>1.1?"Strong":"Balanced") : x.status==="warn" ? "Lagging" : "Weak link";
      return `<div class="ratio"><div class="row between"><span>${esc(x.L.name)}</span><span class="chip ${x.status}">${lab}</span></div>
        <div class="bar"><i style="width:${pct}%;background:var(--${x.status})"></i><span class="tgt" style="left:${tgt}%"></span></div>
        <div class="small muted tnum">${x.L.rm8?"8-rep weight is ":""}${fmt(x.ratio*100)}% of ${x.L.ref==="cgbench"?"close-grip bench max":"back squat max"} · target ${fmt(x.L.target*100)}%</div></div>`;}).join("")}
    ${A.pairs.map(x=> x.gap==null ? "" : `<div class="ratio"><div class="row between"><span>${esc(x.p.name)}: left vs right</span><span class="chip ${x.status}">${x.status==="good"?"Even":Math.round(x.gap*100)+"% gap, "+x.weak+" weaker"}</span></div></div>`).join("")}
    </div></section>`;
  h += `<section class="card"><h2>Your lifts</h2><p class="small muted">Use a recent set of 3–8 good reps. The app estimates your max from it.</p>
    <div class="grid2"><label class="f" for="bw">Bodyweight (kg)<input type="number" id="bw" inputmode="decimal" value="${P.bw||""}" data-bw="1"></label></div>`;
  ["Upper","Lower"].forEach(g=>{
    h += `<h3>${g} body</h3>`;
    LIFTS.filter(l=>l.grp===g).forEach(l=>{
      const lv = P.lifts[l.id]||{};
      h += `<div class="liftrow"><div class="nm">${esc(l.name)}${l.sub?`<small>${esc(l.sub)}</small>`:""}</div>
        <label class="f" for="lw-${l.id}">kg<input type="number" inputmode="decimal" id="lw-${l.id}" value="${lv.w??""}" data-lift="${l.id}" data-f="w"></label>
        <label class="f" for="lr-${l.id}">reps<input type="number" inputmode="numeric" id="lr-${l.id}" value="${lv.r??""}" data-lift="${l.id}" data-f="r"></label></div>`;
    });
  });
  h += `<h3>Left vs right</h3>`;
  PAIRS.forEach(p=>{
    ["L","R"].forEach(side=>{
      const id = p[side]; const lv = P.lifts[id]||{};
      h += `<div class="liftrow"><div class="nm">${esc(p.name)}<small>${side==="L"?"left":"right"}</small></div>
        <label class="f" for="lw-${id}">kg<input type="number" inputmode="decimal" id="lw-${id}" value="${lv.w??""}" data-lift="${id}" data-f="w"></label>
        <label class="f" for="lr-${id}">reps<input type="number" inputmode="numeric" id="lr-${id}" value="${lv.r??""}" data-lift="${id}" data-f="r"></label></div>`;
    });
  });
  h += `</section><section class="card"><h2>Movement screen</h2><p class="small muted">Tick what applies. Each one swaps risky lifts and adds targeted work.</p><div class="checks">
    ${SCREEN.map(s=>`<label for="sc-${s.id}"><input type="checkbox" id="sc-${s.id}" data-screen="${s.id}" ${P.screen[s.id]?"checked":""}><span>${esc(s.label)}</span></label>`).join("")}</div></section>
    <section class="card"><button class="primary" id="saveAssess">Save assessment and rebuild program</button>
    <p class="small muted">Saving also records a snapshot so Progress can show how your ratios change after each phase.</p></section>`;
  return h;
}
function vPlan(){
  const days = split(); const A = analyse();
  const weakNames = A.weak.map(k=>{ const l = LIFTS.find(x=>x.id===k); if(l) return l.name; if(k==="squatLag") return "Squat (behind deadlift)"; if(k==="cgLag") return "Close-grip bench (behind wide-grip)"; const p = PAIRS.find(x=>x.fix===k); return p ? p.name+" left/right gap" : k; });
  let h = exampleBanner();
  h += `<section class="card"><h2>Settings</h2><div class="grid2">
    <label class="f" for="pDays">Lifting days per week<select id="pDays">${[3,4,5].map(n=>`<option ${P.plan.days==n?"selected":""}>${n}</option>`).join("")}</select></label>
    <label class="f" for="pPhase">Current phase<select id="pPhase">${Array.from({length:Math.max(6, P.prog.phase)}, (_,i)=>i+1).map(n=>`<option value="${n}" ${P.prog.phase==n?"selected":""}>Phase ${n}: ${PHASES[phaseKey(n)].name}</option>`).join("")}</select></label>
    <label class="f" for="pWeek">Current week<select id="pWeek">${[1,2,3,4].map(n=>`<option ${P.prog.week==n?"selected":""}>${n}</option>`).join("")}</select></label></div>
    <div class="checks"><label for="pHybrid"><input type="checkbox" id="pHybrid" ${P.plan.hybrid?"checked":""}><span>I also run or do Hyrox. Trims lower-body accessory volume and drops leg pump work.</span></label>
    <label for="pFin"><input type="checkbox" id="pFin" ${P.plan.finisher?"checked":""}><span>Add a pump finisher in accumulation phases: a heavy start, then a metabolic finish.</span></label></div></section>`;
  h += `<section class="card"><h2>What the program is fixing</h2>${weakNames.length?`<div class="row">${weakNames.map(n=>`<span class="chip bad">${esc(n)}</span>`).join("")}</div>`:`<p class="small muted">No weak links. D-series runs maintenance work for the shoulders, shins and hips.</p>`}
    ${SCREEN.filter(s=>P.screen[s.id]).length?`<div class="row">${SCREEN.filter(s=>P.screen[s.id]).map(s=>`<span class="chip warn">${esc(s.label)}</span>`).join("")}</div>`:""}</section>`;
  days.forEach((d,i)=>{
    const sl = buildDay(d);
    h += `<section class="card"><div class="row between"><h3>Day ${i+1}: ${esc(d)}</h3>${i===P.prog.day?`<span class="chip acc">Next up</span>`:""}</div><div class="list">
      ${sl.map(s=>`<div class="row between"><span><b class="mono">${s.label}</b> ${esc(EX[s.ex].n)}</span><span class="small muted tnum">${s.sets}×${esc(s.reps)} · <span class="mono">${s.tempo}</span></span></div>`).join("")}</div></section>`;
  });
  const lb = lsGet("wl.lastBackup");
  h += `<section class="card"><div class="row between"><h2>Backup</h2><span class="chip ${lb?"mut":"warn"}">${lb?"Last backup "+esc(lb):"No backup yet"}</span></div>
    <p class="small muted">Your data lives only on this device. Export a backup every few weeks and save it to Files, iCloud Drive or email. Restore it here if you change phones or clear your browser.</p>
    <div class="btns"><button class="primary" id="exportBtn" style="height:44px">Export backup</button><button id="importBtn">Restore from backup</button></div></section>`;
  h += `<section class="card"><h3>How phases run</h3><p class="small muted">Odd phases are accumulation: more sets, 6–12 reps, long lowering phases. Even phases are intensification: fewer reps, heavier loads, an explosive lift. Each phase is three building weeks and a deload, then you re-test and the program rebuilds around the new numbers.</p>
    <p class="small muted">Tempo reads lower · pause at bottom · lift · pause at top, in seconds. X means lift as fast as you can.</p>
    <button class="ghost" id="resetAll">Reset all data</button></section>`;
  return h;
}
function series(){
  const track = [{k:"Bench",ids:["bench"],lift:"bench",c:"--s1"},{k:"Squat",ids:["squat","heelsSquat"],lift:"squat",c:"--s2"},{k:"Deadlift",ids:["dead"],lift:"dead",c:"--s3"},{k:"Chin-up",ids:["chin"],lift:"chin",c:"--s4",bw:true}];
  return track.map(t=>{
    const pts = [];
    (P.assessments||[]).forEach(a=>{ const l=a.lifts[t.lift]; if(l){ const w = (+l.w||0) + (t.bw? (+a.bw||0):0); const val=e1(w,+l.r); if(val) pts.push({d:a.date,v:val}); } });
    SESSIONS.forEach(s=>{ let best=0; (s.entries||[]).filter(e=>t.ids.includes(e.ex)).forEach(e=>e.sets.forEach(x=>{ const w=(+x.w||0)+(t.bw?(+P.bw||0):0); best=Math.max(best,e1(w,+x.r)); })); if(best) pts.push({d:s.date,v:best}); });
    pts.sort((a,b)=>a.d<b.d?-1:1);
    return Object.assign({pts}, t);
  });
}
function chart(S){
  const all = S.flatMap(s=>s.pts); if(all.length<2) return `<p class="small muted">Log a few sessions or save two assessments and your estimated maxes appear here.</p>`;
  const dates = [...new Set(all.map(p=>p.d))].sort(); const t0 = Date.parse(dates[0]), t1 = Math.max(Date.parse(dates[dates.length-1]), t0+864e5);
  let lo = Math.min(...all.map(p=>p.v)), hi = Math.max(...all.map(p=>p.v)); const pad=(hi-lo)*0.1||10; lo=Math.max(0,Math.floor((lo-pad)/10)*10); hi=Math.ceil((hi+pad)/10)*10;
  const W=640,H=240,L=40,R=12,T=12,B=26; const x=d=>L+(Date.parse(d)-t0)/(t1-t0)*(W-L-R); const y=val=>T+(hi-val)/(hi-lo)*(H-T-B);
  let g=""; for(let i=0;i<=4;i++){ const val=lo+(hi-lo)*i/4; g+=`<line x1="${L}" x2="${W-R}" y1="${y(val)}" y2="${y(val)}" stroke="var(--line)"/><text x="${L-6}" y="${y(val)+4}" text-anchor="end">${Math.round(val)}</text>`; }
  g+=`<text x="${L}" y="${H-6}">${esc(dates[0].slice(5))}</text><text x="${W-R}" y="${H-6}" text-anchor="end">${esc(dates[dates.length-1].slice(5))}</text>`;
  S.forEach(s=>{ if(!s.pts.length) return; const d=s.pts.map((p,i)=>(i?"L":"M")+x(p.d).toFixed(1)+" "+y(p.v).toFixed(1)).join(" "); const e=s.pts[s.pts.length-1];
    g+=`<path d="${d}" fill="none" stroke="var(${s.c})" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${x(e.d)}" cy="${y(e.v)}" r="4.5" fill="var(${s.c})"/>`; });
  return `<div style="overflow-x:auto"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Estimated one-rep max over time">${g}</svg></div>
    <div class="legend">${S.filter(s=>s.pts.length).map(s=>`<span><i style="background:var(${s.c})"></i>${s.k} <b class="tnum">${Math.round(s.pts[s.pts.length-1].v)} kg</b></span>`).join("")}</div>`;
}
function spark(pts, label, unit, base, goodDown){
  if(!pts.length) return `<div class="metric"><div class="row between"><span class="small" style="font-weight:600">${label}</span><span class="small muted">No data yet</span></div></div>`;
  const W=300,H=74,P0=6; const vals=pts.map(p=>p.v).concat(base!=null?[base]:[]); let lo=Math.min(...vals), hi=Math.max(...vals); if(hi-lo<1){hi+=1;lo-=1;}
  const x=i=> pts.length===1 ? W/2 : P0+i*(W-2*P0)/(pts.length-1), y=val=>P0+(hi-val)/(hi-lo)*(H-2*P0);
  const d=pts.map((p,i)=>(i?"L":"M")+x(i).toFixed(1)+" "+y(p.v).toFixed(1)).join(" ");
  const area = pts.length>1 ? `<path d="${d} L${x(pts.length-1).toFixed(1)} ${H} L${x(0).toFixed(1)} ${H} Z" fill="var(--accent-soft)"/>` : "";
  const last=pts[pts.length-1].v, delta = base!=null ? last-base : null;
  const tone = delta==null||Math.abs(delta)<0.05 ? "mut" : ((delta<0)===!!goodDown ? "good" : "warn");
  return `<div class="metric"><div class="row between"><span class="small" style="font-weight:600">${label}</span><span class="tnum" style="font-weight:600">${fmt(last)} ${unit}${delta!=null?` <span class="chip ${tone}">${delta>0?"+":""}${fmt(delta)} vs baseline</span>`:""}</span></div>
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" preserveAspectRatio="none" role="img" aria-label="${label} trend">${base!=null?`<line x1="0" x2="${W}" y1="${y(base)}" y2="${y(base)}" stroke="var(--ink-3)" stroke-dasharray="3 4" stroke-width="1"/>`:""}${area}<path d="${d}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/><circle cx="${x(pts.length-1)}" cy="${y(last)}" r="4" fill="var(--accent)"/></svg></div>`;
}
function vBody(){
  const cs = (P.checkins||[]).filter(c=>!c.skipped); const b = P.baseline||{};
  const pts = k => cs.filter(c=>c[k]!=null).map(c=>({d:c.date, v:c[k]}));
  if(!P.baseline || b.skipped) return `<section class="card"><h2>Body and recovery</h2><p class="small muted">Save your week 1 baseline on Today to start tracking bodyweight, waist, resting heart rate, HRV and sleep.</p></section>`;
  return `<section class="card"><h2>Body and recovery</h2><p class="small muted">From your baseline and weekly check-ins. The dashed line is your baseline.</p>
    <div class="metrics">${spark(pts("bw"),"Bodyweight","kg",b.bw,b.goal!=="size")}${spark(pts("waist"),"Waist","cm",b.waist,true)}${spark(pts("rhr"),"Resting HR","bpm",b.rhr,true)}${spark(pts("hrv"),"HRV","ms",b.hrv,false)}${spark(pts("sleep"),"Sleep","h",b.sleep,false)}</div></section>`;
}
function vProgress(){
  const S = series();
  let h = vBody() + `<section class="card"><h2>Estimated maxes</h2><p class="small muted">Best set of each session, converted to an estimated one-rep max (kg). Chin-up includes bodyweight.</p>${chart(S)}</section>`;
  const as = P.assessments||[];
  if(as.length){
    h += `<section class="card"><h2>Assessments</h2><div class="list">${as.slice().reverse().map(a=>`<div class="row between"><span>${esc(a.date)}</span><span class="small muted">Weak links: ${a.weak&&a.weak.length?a.weak.length:"none"}</span></div>`).join("")}</div></section>`;
  }
  h += `<section class="card"><h2>Session log</h2>${SESSIONS.length?`<div class="list">${SESSIONS.slice().reverse().slice(0,30).map(s=>`<div><div class="row between"><b>${esc(s.day)}</b><span class="small muted">${esc(s.date)} · P${esc(s.phase)} W${esc(s.week)}</span></div>
    <div class="small muted">${(s.entries||[]).map(e=>esc(EX[e.ex]?EX[e.ex].n:e.ex)+": "+e.sets.map(x=>esc(x.w)+"×"+esc(x.r)).join(", ")).join(" · ")}</div></div>`).join("")}</div>`:`<p class="small muted">No sessions yet. Your first finished session shows up here.</p>`}</section>`;
  return h;
}
function vMethod(){
  return `<section class="card method"><h2>The method</h2>
  <p class="small muted">An independent personal tool built on training principles Justin King has described in public interviews, and on the Poliquin structural-balance school he trained under. It is not affiliated with him, Built Better or STNDRD.</p>
  <ul>
    <li><b>Assess before you program.</b> Strength ratios, left/right gaps and a movement screen decide what you train.</li>
    <li><b>Fix the weakest link first.</b> A lagging rotator cuff or lower trap can cap how much the pecs and delts ever get to work. Correctives (the D-series) get the same effort as the main lifts.</li>
    <li><b>Own the tempo.</b> Long lowering phases rebuild coordination and technique before load goes up. Log every set so overload is measured.</li>
    <li><b>Neural first, metabolic last.</b> Heavy, low-rep work comes while you're fresh. Pump and volume finish the session.</li>
    <li><b>Train in phases.</b> Alternate accumulation and intensification blocks, deload, re-test, rebuild.</li>
    <li><b>Isometrics for cranky joints.</b> Holds keep a painful area loaded without aggravating it.</li>
    <li><b>Individual, and agreed.</b> The plan adapts to your sport (running, Hyrox) and your preferences, because the plan you'll follow beats the perfect one you won't.</li>
  </ul>
  <p class="small muted">Target ratios are Poliquin's published structural balance standards. Justin King trained under Poliquin and runs a structural balance assessment, but he hasn't published his own numbers. The wide-grip bench target is derived from Poliquin's guide that close-grip should be about 87% of wide-grip. Treat the ratios as a guide, and see a physio for pain that doesn't settle.</p>
  <p class="small"><a href="https://barbend.com/interview-chris-bumstead-justin-king-2024-olympia" target="_blank" rel="noopener">BarBend interview</a> · <a href="https://www.boxrox.com/chris-bumstead-explains-why-he-switched-from-bodybuilding-to-strength-training-after-15-years/" target="_blank" rel="noopener">BOXROX on the strength program</a></p></section>`;
}

/* ---------- modal ---------- */
function modal(title, body, buttons){
  const m = document.getElementById("modal"); const mb = document.getElementById("mBody");
  mb.onclick = null;
  document.getElementById("mTitle").textContent = title; mb.textContent = body;
  const b = document.getElementById("mBtns"); b.innerHTML = "";
  buttons.forEach(([label, fn, primary])=>{ const el=document.createElement("button"); el.textContent=label; if(primary) el.className="primary"; el.onclick=()=>{ m.style.display="none"; fn&&fn(); }; b.appendChild(el); });
  m.style.display="flex";
}

function swapSheet(key, def, cur){
  const m = document.getElementById("modal");
  document.getElementById("mTitle").textContent = "Swap " + EX[cur].n;
  const body = document.getElementById("mBody");
  body.innerHTML = `<span>Same movement pattern, so your session stays balanced.</span>
    <label for="swapAll" style="display:flex;gap:8px;align-items:center;margin:10px 0;color:var(--ink)"><input type="checkbox" id="swapAll" checked style="width:18px;height:18px;accent-color:var(--accent)">Use on every day this exercise appears</label>
    <div class="opts">${altsFor(def).map(id=>`<div class="row" style="flex-wrap:nowrap"><button style="flex:1" class="${id===cur?"cur":""}" data-pick="${id}"><span>${esc(EX[id].n)}</span><span class="small muted">${id===def?"Default":id===cur?"Current":""}</span></button><a href="${demoUrl(EX[id].n)}" target="_blank" rel="noopener">Demo ↗</a></div>`).join("")}</div>`;
  body.onclick = e=>{
    const b = e.target.closest("button[data-pick]"); if(!b) return;
    const pick = b.dataset.pick; const all = document.getElementById("swapAll").checked;
    P.swaps = P.swaps || {};
    const keys = all ? Object.keys(DAYS).map(d=>d+"|"+def) : [key];
    keys.forEach(k=>{ if(pick===def) delete P.swaps[k]; else P.swaps[k]=pick; });
    saveProfile(); m.style.display="none"; body.onclick=null;
    rerender();
  };
  const btns = document.getElementById("mBtns"); btns.innerHTML="";
  const c = document.createElement("button"); c.textContent="Cancel"; c.onclick=()=>{ m.style.display="none"; body.onclick=null; }; btns.appendChild(c);
  m.style.display="flex";
}

/* ---------- rest timer ---------- */
let restEnd=0, restInt=null;
function startRest(sec){ restEnd = Date.now()+sec*1000; document.getElementById("restbar").style.display="block"; tickRest(); clearInterval(restInt); restInt=setInterval(tickRest, 250); }
function tickRest(){ const left = Math.max(0, Math.round((restEnd-Date.now())/1000)); document.getElementById("restT").textContent = Math.floor(left/60)+":"+String(left%60).padStart(2,"0"); if(left===0){ beep(880,.25); if(navigator.vibrate) navigator.vibrate(200); stopRest(); } }
function stopRest(){ clearInterval(restInt); document.getElementById("restbar").style.display="none"; }
document.getElementById("restAdd").onclick = ()=>{ restEnd += 15000; tickRest(); };
document.getElementById("restStop").onclick = stopRest;

/* ---------- tempo coach ---------- */
let actx=null, sound=true;
function beep(f, d){ if(!sound) return; try{ actx = actx || new (window.AudioContext||window.webkitAudioContext)(); const o=actx.createOscillator(), g=actx.createGain(); o.frequency.value=f; g.gain.value=.08; o.connect(g); g.connect(actx.destination); o.start(); o.stop(actx.currentTime+(d||.12)); }catch(e){} }
let tInt=null, wakeLock=null;
async function keepAwake(on){
  try{ if(on && "wakeLock" in navigator){ wakeLock = await navigator.wakeLock.request("screen"); } else if(!on && wakeLock){ await wakeLock.release(); wakeLock=null; } }catch(e){}
}
function tempoCoach(code, reps){
  const parts = code.split("").map(c=> c==="X" ? 1 : parseInt(c,10)||0);
  const names = ["Lower","Pause","Lift","Squeeze"]; const target = parseInt(String(reps).split("–").pop(),10)||8;
  const seq = []; parts.forEach((s,i)=>{ if(s>0) seq.push({n: code[i]==="X" && i===2 ? "Drive" : names[i], s, i}); });
  document.getElementById("tSteps").innerHTML = code.split("").map((c,i)=>`<span data-i="${i}">${c}</span>`).join("");
  document.getElementById("tHint").textContent = `Tempo ${code}: ${parts[0]}s lower, ${parts[1]}s pause, ${code[2]==="X"?"explode up":parts[2]+"s lift"}, ${parts[3]}s squeeze. Target ${reps} reps.`;
  const el = document.getElementById("tempo"); el.style.display="flex"; keepAwake(true);
  let rep=1, k=0, start=Date.now();
  const paint = ()=>{ const ph=seq[k]; const left=Math.max(0, ph.s-(Date.now()-start)/1000);
    document.getElementById("tRep").textContent = `Rep ${rep} of ${target}`; document.getElementById("tPhase").textContent = ph.n;
    document.getElementById("tCount").textContent = Math.ceil(left);
    document.querySelectorAll("#tSteps span").forEach(s=>s.classList.toggle("on", +s.dataset.i===ph.i));
    if(left<=0){ k++; start=Date.now(); if(k>=seq.length){ k=0; rep++; if(rep>target){ beep(660,.3); stopTempo(); return; } beep(990); } else beep(seq[k].n==="Lower"?440:740); } };
  beep(440); clearInterval(tInt); tInt=setInterval(paint, 100); paint();
}
function stopTempo(){ clearInterval(tInt); document.getElementById("tempo").style.display="none"; keepAwake(false); }
document.getElementById("tStop").onclick = stopTempo;
document.getElementById("tSound").onclick = e=>{ sound=!sound; e.target.textContent = sound?"Sound on":"Sound off"; };

/* ---------- events ---------- */
view.addEventListener("input", e=>{
  const t = e.target;
  if(t.dataset.k){ const s = DRAFT[t.dataset.k][+t.dataset.j]; s[t.dataset.f] = t.value; if(t.dataset.f==="r") t.removeAttribute("aria-invalid"); saveDraft(); }
  else if(t.dataset.lift){ P.example = false; P.lifts[t.dataset.lift] = P.lifts[t.dataset.lift]||{}; P.lifts[t.dataset.lift][t.dataset.f] = t.value===""?"":+t.value; saveProfile(); }
  else if(t.dataset.bw){ P.bw = +t.value; saveProfile(); }
});
view.addEventListener("change", e=>{
  const t = e.target;
  if(t.dataset.screen){ P.screen[t.dataset.screen] = t.checked; saveProfile(); }
  else if(t.id==="daySel"){
    const go = ()=>{ P.prog.day = +t.value; saveProfile(); route(); };
    const entered = Object.values(DRAFT).some(a=>a.some(x=>x.done || x.w!=="" || x.r!==""));
    if(!entered) return go();
    modal("Switch day?", "The sets you've entered for this day will be cleared.", [["Switch", go, true],["Cancel", ()=>{ t.value = String(Math.min(P.prog.day, split().length-1)); }]]);
  }
  else if(t.id==="pDays"){ P.plan.days = +t.value; P.prog.day = 0; saveProfile(); rerender(); }
  else if(t.id==="pPhase"){ P.prog.phase = +t.value; saveProfile(); rerender(); }
  else if(t.id==="pWeek"){ P.prog.week = +t.value; saveProfile(); rerender(); }
  else if(t.id==="pHybrid"){ P.plan.hybrid = t.checked; saveProfile(); rerender(); }
  else if(t.id==="pFin"){ P.plan.finisher = t.checked; saveProfile(); rerender(); }
});
view.addEventListener("click", e=>{
  const t = e.target.closest("button"); if(!t) return;
  if(t.dataset.tick){
    const s = DRAFT[t.dataset.tick][+t.dataset.j];
    const wIn = t.parentElement.querySelector('[data-f="w"]'), rIn = t.parentElement.querySelector('[data-f="r"]');
    if(!s.done){
      if(s.w==="") s.w = wIn.placeholder.replace(/[^\d.]/g,""); if(s.r==="") s.r = rIn.placeholder.replace(/[^\d]/g,""); wIn.value=s.w; rIn.value=s.r;
      // No reps typed and none to copy from last time: a set with 0 reps isn't logged, so ask for reps instead of ticking
      if(!(+s.r>0)){ s.r=""; rIn.value=""; rIn.setAttribute("aria-invalid","true"); rIn.focus(); saveDraft(); return; }
    }
    s.done = !s.done; t.classList.toggle("done", s.done); saveDraft();
    if(s.done) startRest(+t.dataset.rest);
  } else if(t.dataset.addset){ DRAFT[t.dataset.addset].push({w:"",r:"",done:false}); saveDraft(); rerender(); }
  else if(t.dataset.tempo){ tempoCoach(t.dataset.tempo, t.dataset.reps); }
  else if(t.dataset.swap){ swapSheet(t.dataset.swap, t.dataset.def, t.dataset.cur); }
  else if(t.id==="finish"){ finish(); }
  else if(t.id==="hideInstall"){ lsSet("wl.hideInstall", true); rerender(); }
  else if(t.id==="exportBtn"){ exportData(); setTimeout(rerender, 300); }
  else if(t.id==="importBtn"){ document.getElementById("importFile").click(); }
  else if(t.id==="saveBaseline"){
    const g = document.getElementById("bGoal").value, age = document.getElementById("bAge").value, days = +document.getElementById("bDays").value;
    P.baseline = {date:today(), goal:g, age, days, bw:v("bBw"), waist:v("bWaist"), rhr:v("bRhr"), hrv:v("bHrv"), sleep:v("bSleep")};
    if(P.baseline.bw) P.bw = P.baseline.bw;
    P.plan.days = days; P.prog.day = 0; P.plan.hybrid = g==="hybrid";
    P.checkins = (P.checkins||[]).concat([{date:today(), phase:P.prog.phase, week:P.prog.week, rhr:P.baseline.rhr, hrv:P.baseline.hrv, sleep:P.baseline.sleep, sore:2, stress:2, bw:P.baseline.bw, waist:P.baseline.waist, level:0}]);
    saveProfile();
    modal("Baseline saved", (g==="strength"?"Your program starts with a heavier strength block. ":g==="hybrid"?"Lower-body volume is trimmed to fit your running. ":"Your program starts with a higher-volume muscle block. ") + (age==="<1"?"Main lifts start with one set fewer while you learn the tempos. ":"") + "Next, enter your lifts in Assess.", [["Go to Assess",()=>{location.hash="#assess";},true],["Later",route]]);
  }
  else if(t.id==="skipBaseline"){ P.baseline = {date:today(), skipped:true}; saveProfile(); route(); }
  else if(t.id==="saveCheckin" || t.id==="skipCheckin"){
    let c = {date:today(), phase:P.prog.phase, week:P.prog.week};
    if(t.id==="skipCheckin") c.skipped = true;
    else { Object.assign(c, {rhr:v("cRhr"), hrv:v("cHrv"), sleep:v("cSleep"), bw:v("cBw"), waist:v("cWaist"), sore:+document.getElementById("cSore").value, stress:+document.getElementById("cStress").value}); c.level = readiness(c).level; if(c.bw) P.bw = c.bw; }
    P.checkins = (P.checkins||[]).filter(x=>!(x.phase===c.phase && x.week===c.week)).concat([c]).slice(-80);
    saveProfile(); rerender();
  }
  else if(t.id==="saveAssess"){
    const A = analyse(); P.example = false;
    P.assessments = (P.assessments||[]).filter(a=>a.date!==today()).concat([{date:today(), bw:P.bw, lifts:JSON.parse(JSON.stringify(P.lifts)), weak:A.weak}]);
    saveProfile();
    modal("Program rebuilt", A.weak.length ? `Weak links found: ${A.weak.length}. Their correctives are now in the D-series of every session.` : "Your ratios are balanced. The D-series runs maintenance work.", [["View program",()=>{location.hash="#plan";},true],["Close"]]);
  } else if(t.id==="resetAll"){
    modal("Reset all data?", "This clears your lifts, assessments and every logged session on this device. It can't be undone unless you've exported a backup.", [["Reset", ()=>{
      P = EXAMPLE(); SESSIONS = []; DRAFT={}; DRAFT_DAY=null; lsSet("wl.sessions",[]); lsSet("wl.draft",null); saveProfile();
      route(); }, true],["Cancel"]]);
  }
});
function finish(){
  const days = split(); const di = Math.min(P.prog.day, days.length-1);
  // Every draft key ("slot:exercise") belongs to this day. Reading them all, not just the current slots,
  // keeps sets logged on an exercise that was swapped out mid-session.
  const entries = [];
  Object.keys(DRAFT).map(k=>{ const i = k.indexOf(":"); return {k, idx:+k.slice(0,i), ex:k.slice(i+1)}; })
    .filter(o=>EX[o.ex]).sort((a,b)=>a.idx-b.idx)
    .forEach(o=>{ const sets = (DRAFT[o.k]||[]).filter(x=>x.done || (x.w!=="" && x.r!=="")).map(x=>({w:+x.w||0, r:+x.r||0})).filter(x=>x.r>0);
      if(!sets.length) return; const e = entries.find(x=>x.ex===o.ex); if(e) e.sets.push(...sets); else entries.push({ex:o.ex, sets}); });
  if(!entries.length){ modal("Nothing logged yet", "Tick off at least one set before finishing.", [["OK",null,true]]); return; }
  const ts = Date.now();
  addSession({id:"s"+ts, ts, date:today(), day:days[di], phase:P.prog.phase, week:P.prog.week, entries});
  DRAFT = {}; DRAFT_DAY = null; lsSet("wl.draft", null); stopRest();
  P.prog.day++;
  let retest = false;
  if(P.prog.day >= days.length){ P.prog.day = 0; P.prog.week++; if(P.prog.week>4){ P.prog.week=1; P.prog.phase++; retest=true; } }
  saveProfile();
  route();   // show the next day straight away, even if the dialog is dismissed
  if(retest) modal("Phase complete", `Phase ${P.prog.phase} starts now. Re-test your lifts so the program rebuilds around where you are.`, [["Re-test",()=>{location.hash="#assess";},true],["Later"]]);
  else modal("Session saved", `${entries.length} exercise${entries.length===1?"":"s"} logged. Next: ${split()[P.prog.day]}.`, [["Done",null,true]]);
}

/* ---------- light / dark ---------- */
(function(){
  const root=document.documentElement, btn=document.getElementById("themeBtn"), mq=window.matchMedia?matchMedia("(prefers-color-scheme: dark)"):null;
  let mode=lsGet("wl.mode")||"auto";
  const effective=()=> mode!=="auto" ? mode : (mq&&mq.matches?"dark":"light");
  function apply(){
    if(mode==="auto") root.removeAttribute("data-theme"); else root.setAttribute("data-theme",mode);
    const dark=effective()==="dark";
    btn.setAttribute("aria-label", dark?"Switch to light mode":"Switch to dark mode");
    document.querySelectorAll(".segw button").forEach(b=>b.setAttribute("aria-checked",String(b.dataset.mode===mode)));
  }
  if(mq && mq.addEventListener) mq.addEventListener("change",apply);
  btn.onclick=()=>{ mode = effective()==="dark" ? "light" : "dark"; lsSet("wl.mode",mode); apply(); };
  document.querySelector(".segw").onclick=e=>{ const b=e.target.closest("button[data-mode]"); if(!b) return; mode=b.dataset.mode; lsSet("wl.mode",mode); apply(); };
  apply();
})();

/* ---------- glass colour ---------- */
(function(){
  const root=document.documentElement, pk=document.getElementById("picker"), gb=document.getElementById("glassBtn");
  const apply=g=>{ if(g==="amber") root.removeAttribute("data-glass"); else root.setAttribute("data-glass",g);
    document.querySelectorAll(".swatch").forEach(b=>b.setAttribute("aria-checked", String(b.dataset.glass===g))); };
  apply(lsGet("wl.glass")||"amber");
  gb.onclick=()=>{ const o=!pk.classList.contains("open"); pk.classList.toggle("open",o); gb.setAttribute("aria-expanded",String(o)); };
  pk.onclick=e=>{ const b=e.target.closest(".swatch"); if(!b) return; apply(b.dataset.glass); lsSet("wl.glass",b.dataset.glass); };
  document.addEventListener("click",e=>{ if(pk.classList.contains("open") && !pk.contains(e.target) && !gb.contains(e.target)){ pk.classList.remove("open"); gb.setAttribute("aria-expanded","false"); } });
})();

/* ---------- boot ---------- */
(function boot(){
  const lp = lsGet("wl.profile"); if(lp) P = Object.assign(EXAMPLE(), lp); P.swaps = P.swaps||{};
  SESSIONS = lsGet("wl.sessions") || [];
  const dr = lsGet("wl.draft"); if(dr && dr.phase===P.prog.phase && dr.week===P.prog.week){ DRAFT = dr.d||{}; DRAFT_DAY = dr.day; }
  setSync(syncLabel());
  window.addEventListener("hashchange", route);
  route();
  // ask the browser not to evict this app's data under storage pressure
  if(navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(()=>{});
  // offline support
  if("serviceWorker" in navigator && location.protocol !== "file:"){
    window.addEventListener("load", ()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));
  }
})();
