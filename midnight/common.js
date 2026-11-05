/* =====================================================================
 *  자정의 골동품 가게 — 학생 화면·교사 화면 공통
 *  API_URL: Apps Script 웹 앱 주소(…/exec). 비워 두면 이 브라우저 안에서만 도는 "데모 모드".
 * ===================================================================== */
const API_URL = 'https://script.google.com/macros/s/AKfycbysLVYxonfhz95hJJ3qEikqNQnjtzc44Y27KBcGy3uGd2Dm1kIKm6K13Y4fFfnI19qjBg/exec';
const DEMO = !API_URL;
const LS_VOICE = 'midnight-antique.voice';
/* 데모 모드: 서버 코드(Code.gs)를 이 브라우저 안에서 그대로 돌림 (테스트용) */
const Demo = { call: p => window.GAS_DEMO ? Promise.resolve(window.GAS_DEMO(p)) : Promise.reject(new Error('no server')) };

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ---------- 그림 ---------- */
const IMG = new Proxy({}, { get: (_, k) => typeof k === 'string' ? `img/${k}.${k === 'TAG' || k === 'SEAL' ? 'png' : 'jpg'}` : undefined });

/* ---------- 모둠 색 ---------- */
const TEAMC = ['#c0453f', '#4a83bd', '#4f9a76', '#8f6ab8', '#c98238', '#a8963a', '#b85a8a', '#3f9aa0'];

/* ---------- 서버 통신 ---------- */
async function api(payload, tries) {
  if (DEMO) return Demo.call(payload);
  tries = tries || 1;
  for (let k = 0; k < tries; k++) {
    try {
      const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
      return await res.json();
    } catch (e) { if (k === tries - 1) throw e; await new Promise(r => setTimeout(r, 1200 * (k + 1))); }
  }
}
/* 답 기록은 줄을 세워 하나씩 보냄 (인터넷이 끊겨도 나중에 다시 보냄) */
const SendQueue = {
  key: 'mid_queue', busy: false,
  load() { try { return JSON.parse(lsGet(this.key) || '[]'); } catch (e) { return []; } },
  save(q) { lsSet(this.key, JSON.stringify(q)); },
  push(p) { const q = this.load(); q.push(p); this.save(q); this.flush(); },
  async flush() {
    if (this.busy) return; this.busy = true;
    try {
      let q = this.load();
      while (q.length) {
        const r = await api(q[0]);
        const drop = r && r.ok === false && ['sid', 'group', 'closed', 'item', 'pw'].includes(r.error);
        if (!r || (r.ok === false && !drop)) throw new Error('send fail');
        q = this.load(); q.shift(); this.save(q);
      }
    } catch (e) { setTimeout(() => this.flush(), 4000); }
    finally { this.busy = false; }
  }
};

/* ---------- 지문: 교과서 128~129쪽 (Lesson 9, 4차시) ---------- */
const P = {
  A:{title:"Go, Blue Birds!",lines:["My family loves basketball.","Our favorite basketball team is the Blue Birds.","We're going to watch the basketball game this Saturday.","We're going to wear the Blue Birds T-shirts.","Go, Blue Birds!"]},
  B:{title:"My Grandpa's Visit",lines:["My grandpa is going to visit us this Sunday.","His favorite food is pad thai.","Mom and Dad are going to cook pad thai.","I'm going to clean the house."]},
  C:{title:"Our Camping Trip",lines:["I like hiking in the forest.","I'm going to go camping with my dad this weekend.","We're going to cook hamburgers.","We're going to sleep in a tent.","Oh, I can't wait!"]},
  K:{title:"Check It",lines:["(Girl) I love camping. My family and I are going to go camping this Saturday. I can't wait!","(Boy) I'm going to stay home. I'm going to clean my room this weekend."]}
};
/* t 유형, p 지문, q 질문, en 영어 문장, c 선택지, a 정답, kr 한국어 선택지 */
const BANK = [
  /* 읽기 전 */
  {t:"Before You Read",q:"아이들이 이렇게 말했어요. 무엇을 할 계획일까요?",en:"We're going to go camping.",c:["할머니 댁에 가기","텐트에서 캠핑하기","농구 경기 보기"],a:1,kr:1},
  /* 글 ① Go, Blue Birds! */
  {t:"Let's Read ①",p:"A",q:"이 가족이 아주 좋아하는 운동은?",en:"My family loves ____.",c:["soccer","basketball","baseball"],a:1},
  {t:"Let's Read ①",p:"A",q:"가족이 가장 좋아하는 농구 팀은?",c:["the Blue Bears","the Red Birds","the Blue Birds"],a:2},
  {t:"Let's Read ①",p:"A",q:"농구 경기를 보러 가는 날은?",c:["this Friday","this Saturday","this Sunday"],a:1},
  {t:"Let's Read ①",p:"A",q:"경기를 보러 갈 때 무엇을 입을까요?",c:["the Blue Birds T-shirts","beautiful hanbok","the Blue Birds hats"],a:0},
  {t:"Let's Read ①",p:"A",q:"'Go, Blue Birds!'의 뜻으로 알맞은 것은?",c:["가자, 블루버즈 팀!","블루버즈 새들이 날아가요.","블루버즈 팀은 집에 가요."],a:0,kr:1},
  {t:"Let's Read ①",p:"A",q:"빈칸에 알맞은 말은?",en:"We're going to ____ the basketball game.",c:["clean","watch","cook"],a:1},
  /* 글 ② My Grandpa's Visit */
  {t:"Let's Read ②",p:"B",q:"우리 집에 누가 방문하나요?",c:["grandma","uncle","grandpa"],a:2},
  {t:"Let's Read ②",p:"B",q:"할아버지는 언제 방문하시나요?",c:["this Saturday","this Sunday","tomorrow"],a:1},
  {t:"Let's Read ②",p:"B",q:"할아버지가 가장 좋아하시는 음식은?",c:["pad thai","bibimbap","hamburgers"],a:0},
  {t:"Let's Read ②",p:"B",q:"팟타이를 요리할 사람은 누구인가요?",c:["the girl","Mom and Dad","grandpa"],a:1},
  {t:"Let's Read ②",p:"B",q:"글쓴이(여자아이)는 무엇을 할 계획인가요?",c:["I'm going to clean the house.","I'm going to cook pad thai.","I'm going to visit my grandpa."],a:0},
  {t:"Let's Read ②",p:"B",q:"문장의 뜻으로 알맞은 것은?",en:"Mom and Dad are going to cook pad thai.",c:["엄마와 아빠는 팟타이를 드실 거예요.","엄마와 아빠는 팟타이를 요리하실 거예요.","엄마와 아빠는 팟타이를 사 오실 거예요."],a:1,kr:1},
  {t:"Let's Read ②",p:"B",q:"'His favorite food'에서 His는 누구를 가리키나요?",c:["아빠","남동생","할아버지"],a:2,kr:1},
  /* 글 ③ Our Camping Trip */
  {t:"Let's Read ③",p:"C",q:"남자아이가 좋아하는 것은?",c:["hiking in the forest","swimming in the sea","playing basketball"],a:0},
  {t:"Let's Read ③",p:"C",q:"남자아이는 누구와 캠핑을 가나요?",c:["with my mom","with my dad","with my friends"],a:1},
  {t:"Let's Read ③",p:"C",q:"캠핑에서 무엇을 요리할까요?",c:["pad thai","pizza","hamburgers"],a:2},
  {t:"Let's Read ③",p:"C",q:"캠핑에서 어디에서 잘까요?",c:["in a tent","in a car","in a hotel"],a:0},
  {t:"Let's Read ③",p:"C",q:"캠핑은 언제 가나요?",c:["tomorrow","this weekend","next month"],a:1},
  {t:"Let's Read ③",p:"C",q:"'Oh, I can't wait!'의 뜻으로 알맞은 것은?",c:["기다릴 수 없어서 화가 나요.","오, 정말 기대돼요!","조금만 기다려 주세요."],a:1,kr:1},
  /* O / X */
  {t:"O / X",p:"B",q:"할아버지는 햄버거를 가장 좋아하신다.",c:["O","X"],a:1},
  {t:"O / X",p:"C",q:"남자아이는 이번 주말에 엄마와 캠핑을 간다.",c:["O","X"],a:1},
  {t:"O / X",p:"A",q:"여자아이의 가족은 토요일에 농구 경기를 본다.",c:["O","X"],a:0},
  {t:"O / X",p:"B",q:"여자아이가 직접 팟타이를 요리한다.",c:["O","X"],a:1},
  {t:"O / X",p:"C",q:"남자아이는 숲에서 하이킹하는 것을 좋아한다.",c:["O","X"],a:0},
  {t:"O / X",p:"B",q:"할아버지는 이번 주 일요일에 오신다.",c:["O","X"],a:0},
  /* After You Read */
  {t:"After You Read",q:"빈칸에 알맞은 말은?",en:"My grandpa is going to ____ us this Sunday.",c:["visit","watch","sleep"],a:0},
  {t:"After You Read",q:"빈칸에 알맞은 말은?",en:"I'm going to go ____ with my dad this weekend.",c:["shopping","camping","swimming"],a:1},
  {t:"After You Read",q:"빈칸에 알맞은 말은?",en:"My family and I are going to ____ this Saturday.",c:["clean the house","watch the basketball game","cook hamburgers"],a:1},
  /* Check It */
  {t:"Check It",p:"K",q:"여자아이가 이번 주 토요일에 할 일은?",c:["가족과 캠핑 가기","방 청소하기","수학 공부하기"],a:0,kr:1},
  {t:"Check It",p:"K",q:"남자아이가 이번 주말에 할 일은?",c:["캠핑 가기","집에 있기","농구 경기 보기"],a:1,kr:1},
  /* 낱말 뜻 */
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"forest",c:["숲","바다","공원"],a:0,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"visit",c:["요리하다","방문하다","청소하다"],a:1,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"favorite",c:["가장 좋아하는","가장 싫어하는","가장 큰"],a:0,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"this weekend",c:["지난 주말","이번 주말","매일"],a:1,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"wear",c:["입다","씻다","기다리다"],a:0,kr:1},
  /* 우리말 → 영어 */
  {t:"우리말을 영어로",q:"우리말에 맞는 문장은?",en:"나는 집을 청소할 거야.",c:["I'm going to clean the house.","I'm going to clean my room.","We're going to clean the house."],a:0},
  {t:"우리말을 영어로",q:"우리말에 맞는 문장은?",en:"우리는 텐트에서 잘 거야.",c:["We're going to cook in a tent.","We're going to sleep in a tent.","I'm going to sleep in a car."],a:1},
  {t:"우리말을 영어로",q:"우리말에 맞는 문장은?",en:"우리 할아버지가 우리를 방문하실 거야.",c:["My grandpa is going to visit us.","My grandma is going to visit us.","I'm going to visit my grandpa."],a:0},
  {t:"스스로 다지기",q:"우리말에 맞는 문장은?",en:"우리는 이번 주 토요일에 캠핑을 갈 거야.",c:["We're going to go camping this Sunday.","We're going to go camping this Saturday.","I'm going to go camping this Saturday."],a:1},
  /* 문장 만들기 */
  {t:"문장 만들기",q:"낱말을 바르게 배열한 문장은?",en:"( going to / We're / cook / hamburgers. )",c:["We're cook going to hamburgers.","We're going to cook hamburgers.","Going to we're cook hamburgers."],a:1},
  {t:"문장 만들기",q:"낱말을 바르게 배열한 문장은?",en:"( going to / I'm / clean / the house. )",c:["I'm going to clean the house.","I'm clean going to the house.","I'm the house going to clean."],a:0},
  {t:"문장 만들기",q:"낱말을 바르게 배열한 문장은?",en:"( is / My grandpa / going to / visit us. )",c:["My grandpa going to is visit us.","Is my grandpa going to visit us.","My grandpa is going to visit us."],a:2},
  {t:"문장 만들기",q:"낱말을 바르게 배열한 문장은?",en:"( wear / We're / going to / the T-shirts. )",c:["We're going to wear the T-shirts.","We're wear going to the T-shirts.","We're the T-shirts going to wear."],a:0},
  /* am / is / are */
  {t:"am · is · are",q:"빈칸에 알맞은 말은?",en:"My grandpa ____ going to visit us.",c:["am","is","are"],a:1},
  {t:"am · is · are",q:"빈칸에 알맞은 말은?",en:"Mom and Dad ____ going to cook pad thai.",c:["am","is","are"],a:2},
  {t:"am · is · are",q:"빈칸에 알맞은 말은?",en:"We ____ going to sleep in a tent.",c:["is","are","am"],a:1},
  /* 대화 */
  {t:"대화 완성",q:"B의 대답으로 알맞은 것은?",en:"A: What are you going to do this weekend?\nB: ____",c:["I'm going to stay home.","I'm stay home.","I going to stay home."],a:0},
  {t:"대화 완성",q:"친구의 계획에 동의하는 말은?",en:"A: I'm going to go camping.\nB: ____",c:["I'm sorry.","That's a good idea.","Nice to meet you."],a:1},
  /* Culture Box */
  {t:"Culture Box",q:"할아버지가 좋아하시는 팟타이는 어느 나라의 대표 요리일까요?",c:["베트남","태국","일본"],a:1,kr:1}
];


/* 기본 문제 세트 */
const DEFAULT_SET = { id: 'default', title: 'Lesson 9 · 4차시 (교과서 128~129쪽)',
  passages: Object.entries(P).map(([id, v]) => ({ id, title: v.title, lines: v.lines })), questions: BANK };

/* ---------- 상자 속 물건 (각자 풀기용) ---------- */
// kind: g 축복 / b 저주 / n 운명 , tgt: 다른 모둠을 골라야 함
const ITEMS = [
  { id: 'p10', kind: 'g', ic: '🪙', name: '낡은 금화', fx: '우리 모둠 +10점', en: "You're going to be rich!", w: 7 },
  { id: 'p20', kind: 'g', ic: '🕯️', name: '은빛 촛대', fx: '우리 모둠 +20점', en: "You're going to shine tonight!", w: 5 },
  { id: 'p30', kind: 'g', ic: '💍', name: '루비 반지', fx: '우리 모둠 +30점', en: "You're going to win big!", w: 2 },
  { id: 'x2', kind: 'g', ic: '🎎', name: '쌍둥이 인형', fx: '내가 모은 점수만큼 한 번 더 (최대 +30)', en: 'Your points are going to double!', w: 1 },
  { id: 'steal', kind: 'g', ic: '🐈‍⬛', name: '도둑 검은 고양이', fx: '다른 모둠 10점 뺏어 오기', en: 'The cat is going to steal for you.', w: 2, tgt: 1 },
  { id: 'shield', kind: 'g', ic: '🧿', name: '보호 부적', fx: '우리 모둠 저주 한 번 막기', en: "You're going to be safe.", w: 2 },
  { id: 'party', kind: 'g', ic: '🎶', name: '축복의 오르골', fx: '모든 모둠 +10점', en: 'Everyone is going to dance!', w: 1 },
  { id: 'pass', kind: 'g', ic: '🕸️', name: '저주 넘기기', fx: '다른 모둠 −20점', en: 'Someone is going to be cursed...', w: 1, tgt: 1 },
  { id: 'crown', kind: 'n', ic: '👑', name: '녹슨 왕관', fx: '1등 모둠에게서 10점 가져오기', en: "You're going to sit on the throne!", w: 1 },
  { id: 'topHit', kind: 'n', ic: '🗡️', name: '1등 견제의 단검', fx: '1등 모둠 −20점', en: 'The leader is going to fall!', w: 1 },
  { id: 'zero', kind: 'n', ic: '💨', name: '먼지만 가득', fx: '꽝', en: 'Nothing is going to happen.', w: 3 },
  { id: 'm10', kind: 'b', ic: '☕', name: '깨진 찻잔', fx: '우리 모둠 −10점', en: "You're going to lose a little.", w: 3 },
  { id: 'm20', kind: 'b', ic: '🪆', name: '저주받은 인형', fx: '우리 모둠 −20점', en: "You're going to be cursed!", w: 1 },
  { id: 'ghost', kind: 'b', ic: '👻', name: '떠돌이 유령', fx: '우리 모둠 10점을 다른 모둠에 줌', en: 'The ghost is going to take your coins.', w: 2, tgt: 1 }
];
const item = id => ITEMS.find(x => x.id === id);
function drawItem() { const tot = ITEMS.reduce((s, x) => s + x.w, 0); let r = Math.random() * tot; for (const x of ITEMS) { if ((r -= x.w) < 0) return x; } return ITEMS[0]; }
function makeBoxes() {
  let b;
  do { b = Array.from({ length: 6 }, drawItem); }
  while (b.filter(x => x.kind === 'g').length < 2 || b.filter(x => x.kind === 'b').length < 1 || new Set(b.map(x => x.id)).size < 5);
  return b.map(x => x.id);
}
const isKr = Q => Q.kr != null ? !!Q.kr : /[가-힣]/.test(Q.c.join(''));
const BOXIMG = ['box1', 'box2', 'box3', 'box4', 'boxOwl', 'boxMirror'];

/* 시계 그림: 9시 → 자정 */
function clockSVG(prog, size) {
  prog = Math.max(0, Math.min(1, prog || 0));
  const hourDeg = 270 + prog * 90, minDeg = prog * 1080;
  const hand = (deg, len, w, col) => `<line x1="50" y1="50" x2="${(50 + Math.sin(deg * Math.PI / 180) * len).toFixed(2)}" y2="${(50 - Math.cos(deg * Math.PI / 180) * len).toFixed(2)}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`;
  return `<div class="clock" ${size ? `style="width:${size}px;height:${size}px"` : ''} role="img" aria-label="자정까지 ${Math.round((1 - prog) * 100)}% 남음"><img src="${IMG.CLOCK}" alt=""><svg viewBox="0 0 100 100">${hand(hourDeg, 12, 3.4, '#2c2117')}${hand(minDeg, 18.5, 1.9, '#2c2117')}<circle cx="50" cy="50" r="2.6" fill="#8a6a26" stroke="#2c2117" stroke-width=".8"/></svg></div>`;
}

/* 점수 숫자가 올라가거나 내려가며 나타남 */
function countUp(root) {
  (root || document).querySelectorAll('[data-sc]').forEach(el => {
    const from = +el.dataset.from, to = +el.dataset.to; if (from === to) return;
    const t0 = performance.now(), dur = 900;
    (function step(now) { const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); })(t0);
  });
}
/* ---------- 영어 읽어 주기 ---------- */
let VOICES=[];
function loadVoices(){try{VOICES=speechSynthesis.getVoices().filter(v=>/^en[-_]/i.test(v.lang));}catch(e){VOICES=[];}}
try{loadVoices();speechSynthesis.addEventListener("voiceschanged",()=>{const had=VOICES.length;loadVoices();if(!had&&VOICES.length&&window.onVoices)window.onVoices();});}catch(e){}
function voiceScore(v){let s=0;const n=v.name;
  if(/natural|neural/i.test(n))s+=60;if(/online/i.test(n))s+=30;if(/google/i.test(n))s+=45;
  if(/aria|jenny|guy|ava|andrew|emma|samantha|allison|michelle/i.test(n))s+=20;
  if(/en[-_]US/i.test(v.lang))s+=12;else if(/en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang))s+=6;
  if(/compact|espeak|zira|david|mark/i.test(n))s-=15;return s;}
function pickVoice(){const want=lsGet(LS_VOICE);return VOICES.find(v=>v.name===want)||VOICES.slice().sort((a,b)=>voiceScore(b)-voiceScore(a))[0]||null;}
function sayLines(lines){
  try{speechSynthesis.cancel();const v=pickVoice();
    lines.forEach(line=>{const text=line.replace(/\((Girl|Boy)\)/gi,"").replace(/^[AB]\s*:\s*/,"").replace(/_{2,}/g,"...").trim();if(!text)return;
      const u=new SpeechSynthesisUtterance(text);u.lang=v?v.lang:"en-US";if(v)u.voice=v;u.rate=.9;u.pitch=1;speechSynthesis.speak(u);});
  }catch(e){}
}
function voiceRow(){
  if(!VOICES.length)return `<div class="voicerow"><span>읽어 주는 목소리: 이 브라우저에서 영어 목소리를 찾지 못했어요. 크롬이나 엣지에서 열면 더 자연스러운 목소리를 쓸 수 있어요.</span></div>`;
  const cur=pickVoice();
  return `<div class="voicerow"><label for="voice">읽어 주는 목소리</label><select id="voice" class="sel voice" data-voice>${VOICES.slice().sort((a,b)=>voiceScore(b)-voiceScore(a)).map(v=>`<option value="${esc(v.name)}" ${cur&&cur.name===v.name?"selected":""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select><button class="btn ghost small" data-act="vtest">🔊 들어 보기</button></div>`;
}

/* ---------- 소리 (Web Audio로 직접 합성) ---------- */
let AC=null,muted=false;
function ac(){if(muted)return null;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();if(AC.state==="suspended")AC.resume();return AC;}catch(e){return null;}}
function tone(c,{f=440,f2=null,type="sine",t=0,dur=1,vol=.2,attack=.02}){
  const o=c.createOscillator(),g=c.createGain(),now=c.currentTime+t;
  o.type=type;o.frequency.setValueAtTime(f,now);if(f2)o.frequency.exponentialRampToValueAtTime(f2,now+dur);
  g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+attack);g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
  o.connect(g).connect(c.destination);o.start(now);o.stop(now+dur+.05);
}
function noise(c,{t=0,dur=.6,vol=.15,from=600,to=2400,q=6}){
  const len=c.sampleRate*dur,buf=c.createBuffer(1,len,c.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=(Math.random()*2-1);
  const s=c.createBufferSource(),bp=c.createBiquadFilter(),g=c.createGain(),now=c.currentTime+t;
  s.buffer=buf;bp.type="bandpass";bp.Q.value=q;bp.frequency.setValueAtTime(from,now);bp.frequency.exponentialRampToValueAtTime(to,now+dur);
  g.gain.setValueAtTime(0.0001,now);g.gain.exponentialRampToValueAtTime(vol,now+dur*.3);g.gain.exponentialRampToValueAtTime(0.0001,now+dur);
  s.connect(bp).connect(g).connect(c.destination);s.start(now);s.stop(now+dur);
}
const SFX={
  // 봉인이 풀리며 뚜껑이 삐걱 열리고, 낮은 울림 위로 신비한 종소리가 흩어짐
  open(){const c=ac();if(!c)return;SFX.crack();
    tone(c,{f:55,f2:52,type:"triangle",dur:2.4,vol:.22,attack:.15});
    tone(c,{f:82.4,type:"sine",dur:2.2,vol:.12,attack:.3});
    tone(c,{f:880,f2:1320,type:"sine",dur:.45,vol:.025,attack:.05});
    noise(c,{dur:.9,vol:.12,from:300,to:3200,q:9});
    [659.3,830.6,987.8,1318.5,1661.2].forEach((f,i)=>{tone(c,{f,type:"sine",t:.25+i*.11,dur:1.6,vol:.07});tone(c,{f:f*2.01,type:"sine",t:.25+i*.11,dur:.8,vol:.02});});
  },
  good(){const c=ac();if(!c)return;
    [523.3,659.3,784,1046.5].forEach((f,i)=>tone(c,{f,type:"triangle",t:i*.09,dur:1.4,vol:.11}));
    [2093,2637,3136].forEach((f,i)=>tone(c,{f,t:.35+i*.07,dur:.6,vol:.035}));
  },
  bad(){const c=ac();if(!c)return;
    tone(c,{f:233,f2:110,type:"sawtooth",dur:1.4,vol:.07,attack:.05});
    tone(c,{f:329.6,f2:155,type:"sawtooth",dur:1.4,vol:.05,attack:.05});
    tone(c,{f:46,type:"sine",dur:1.8,vol:.25,attack:.02});
    noise(c,{t:.05,dur:1.2,vol:.06,from:1800,to:200,q:3});
  },
  fate(){const c=ac();if(!c)return;
    noise(c,{dur:1.3,vol:.12,from:200,to:4000,q:4});
    [440,554.4,622.3,740,622.3,554.4].forEach((f,i)=>tone(c,{f,type:"sine",t:.1+i*.12,dur:.7,vol:.06}));
  },
  tick(){const c=ac();if(!c)return;tone(c,{f:1800,type:"square",dur:.05,vol:.03,attack:.002});tone(c,{f:1200,type:"square",t:.5,dur:.05,vol:.025,attack:.002});},
  // 버튼: 낡은 나무를 톡 두드리는 소리
  click(){const c=ac();if(!c)return;tone(c,{f:520,f2:300,type:"triangle",dur:.09,vol:.09,attack:.003});noise(c,{dur:.06,vol:.05,from:1800,to:900,q:2});},
  // 선택(모둠 수·차례 바꾸기): 작은 놋쇠 딸깍
  pick(){const c=ac();if(!c)return;tone(c,{f:1320,type:"sine",dur:.12,vol:.05,attack:.002});tone(c,{f:1980,type:"sine",t:.03,dur:.1,vol:.03,attack:.002});},
  // 게임 시작: 문이 삐걱 열리고 가게 종이 딸랑딸랑
  bell(){const c=ac();if(!c)return;
    // 1) 열쇠를 꽂고 두 번 돌리는 금속 '찰칵, 철컥'
    [[0,3200],[.28,2400]].forEach(([t,f])=>{noise(c,{t,dur:.05,vol:.16,from:f*1.4,to:f,q:6});tone(c,{f,type:"triangle",t,dur:.12,vol:.05,attack:.001});tone(c,{f:f*1.51,type:"sine",t:t+.005,dur:.18,vol:.025,attack:.001});});
    // 2) 문이 천천히 열리는 '끼이익' (높고 가는 소리만)
    noise(c,{t:.55,dur:.9,vol:.05,from:1100,to:1700,q:28});noise(c,{t:.6,dur:.8,vol:.03,from:2200,to:2900,q:30});
    // 3) 문 위에 달린 가게 종 '딸랑-딸랑'
    [0,.16,.34,.5].forEach((t,k)=>{[1760,2217,2637,3520].forEach((f,j)=>tone(c,{f:f*(1+(k%2)*.03),type:"sine",t:1.15+t+j*.003,dur:1.3,vol:.06/(j+1),attack:.002}));});},
  // 정답: 맑은 종소리 두 번
  correct(){const c=ac();if(!c)return;[[784,0],[1174.7,.12],[1568,.24]].forEach(([f,t])=>{tone(c,{f,type:"sine",t,dur:.9,vol:.1,attack:.004});tone(c,{f:f*2,type:"sine",t,dur:.4,vol:.025,attack:.004});});},
  // 오답: 낡은 시계가 둔하게 '똑-딱' 하고 한숨처럼 내려감
  wrong(){const c=ac();if(!c)return;tone(c,{f:330,f2:220,type:"triangle",dur:.5,vol:.1,attack:.01});tone(c,{f:247,f2:165,type:"triangle",t:.22,dur:.7,vol:.09,attack:.01});tone(c,{f:880,type:"square",t:.02,dur:.04,vol:.02,attack:.001});},
  // 장면 바꿈: 바람 소리
  whoosh(){const c=ac();if(!c)return;noise(c,{dur:.7,vol:.09,from:300,to:2600,q:1.5});tone(c,{f:392,f2:784,type:"sine",t:.15,dur:.5,vol:.035});},
  // 봉인이 깨지는 소리
  crack(){const c=ac();if(!c)return;noise(c,{dur:.12,vol:.18,from:2500,to:600,q:1});tone(c,{f:180,f2:60,type:"square",dur:.12,vol:.05,attack:.001});},
  // 저장 완료: 짧은 반짝임
  saved(){const c=ac();if(!c)return;[1046.5,1318.5].forEach((f,i)=>tone(c,{f,type:"sine",t:i*.09,dur:.5,vol:.07,attack:.003}));},
  midnight(){const c=ac();if(!c)return;for(let k=0;k<4;k++){[196,392,587.3].forEach(f=>tone(c,{f,type:"sine",t:k*1.1,dur:2.2,vol:.1,attack:.005}));}}
};
