/* =====================================================================
 *  보리봇의 세계 문화 박물관 — 학생 화면·교사 화면 공통
 *  6학년 영어 Lesson 11 (Do You Know Anything About Tuho?) 3·5차시
 *  API_URL: Apps Script 웹 앱 주소(…/exec). 비워 두거나 주소 끝에 ?demo 를 붙이면 서버 없이 도는 연습 모드.
 * ===================================================================== */
const API_URL = 'https://script.google.com/macros/s/AKfycbzqRZ6kpUCmClQfYq3sUZKmaT4xjN_LQ4ageQkNlNtDVfvRPiO6R6um09ssOfHd8PYF/exec';
const DEMO = !API_URL || /[?&]demo\b/.test(location.search);
const LS_VOICE = 'bori-museum.voice';
const NS = DEMO ? 'bori-museum-demo.' : 'bori-museum.';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lsGet = k => { try { return localStorage.getItem(NS + k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(NS + k, v); } catch (e) {} };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const IMG = k => `img/${k}.webp?v=3`;

/* ---------- 모둠 색 ---------- */
const TEAMC = ['#e0573e', '#2f7fd0', '#1f9e7a', '#8a5cd0', '#e0912a', '#b9a01c', '#d0508f', '#1e9db0'];

/* ---------- 서버 통신 ---------- */
async function api(payload, tries) {
  if (DEMO) return window.demoCall(payload);
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
  key: 'queue', busy: false,
  load() { try { return JSON.parse(lsGet(this.key) || '[]'); } catch (e) { return []; } },
  save(q) { lsSet(this.key, JSON.stringify(q)); },
  push(p) { const q = this.load(); q.push(p); this.save(q); this.flush(); },
  async flush() {
    if (this.busy) return; this.busy = true;
    try {
      let q = this.load();
      while (q.length) {
        const r = await api(q[0]);
        if (!r || r.ok === false) throw new Error('send fail');
        q = this.load(); q.shift(); this.save(q);
      }
    } catch (e) { setTimeout(() => this.flush(), 4000); }
    finally { this.busy = false; }
  }
};

/* ---------- 전시품 ---------- */
const EXIMG = k => IMG('ex_' + k);
const EXHIBIT = {
  tuho: { name: 'Tuho', kr: '투호', it: "It's a Korean game." },
  yakgwa: { name: 'yakgwa', kr: '약과', it: "It's a Korean cookie." },
  nonla: { name: 'nón lá', kr: '논라', it: "It's a Vietnamese hat." },
  djembe: { name: 'djembes', kr: '젬베', it: "They're African drums." },
  sari: { name: 'saris', kr: '사리', it: "They're Indian dresses." },
  boomerang: { name: 'boomerangs', kr: '부메랑', it: "They're Australian toys." }
};

/* ---------- 문제: 교과서 154~155쪽(3차시) · 158~159쪽(5차시) ----------
 * t 유형, img 전시품 그림, q 질문, en 영어 문장(____ 은 빈칸)
 * 고르기: c 선택지, a 정답 번호 / 쓰기: ans 정답 낱말들, hint 힌트 / 문장 만들기: w 낱말 카드(정답 순서) */
const BANK = [
  /* 그림 보고 고르기 */
  {t:"전시품 이름",img:"nonla",q:"그림 속 전시품의 이름은?",en:"Do you know anything about ____?",c:["nón lá","saris","djembes"],a:0},
  {t:"전시품 이름",img:"djembe",q:"그림 속 전시품의 이름은?",en:"Do you know anything about ____?",c:["boomerangs","djembes","Tuho"],a:1},
  {t:"전시품 이름",img:"boomerang",q:"그림 속 전시품의 이름은?",en:"Do you know anything about ____?",c:["yakgwa","saris","boomerangs"],a:2},
  {t:"전시품 설명",img:"sari",q:"그림을 보고, 알맞은 말을 골라요.",en:"Yes, I do. They're ____.",c:["Indian dresses","African drums","Australian toys"],a:0},
  {t:"전시품 설명",img:"tuho",q:"그림을 보고, 알맞은 말을 골라요.",en:"Yes, I do. It's ____.",c:["a Korean cookie","a Korean game","a Vietnamese hat"],a:1},
  {t:"전시품 설명",img:"yakgwa",q:"그림을 보고, 알맞은 말을 골라요.",en:"Yes, I do. It's ____.",c:["a Korean game","Indian dresses","a Korean cookie"],a:2},
  /* Play 3 땅따먹기 판 */
  {t:"Play 3",img:"sari",q:"빈칸에 알맞은 낱말은?",en:"____ dresses",c:["Indian","African","Korean"],a:0},
  {t:"Play 3",img:"nonla",q:"빈칸에 알맞은 낱말은?",en:"a Vietnamese ____",c:["cookie","hat","game"],a:1},
  {t:"Play 3",img:"yakgwa",q:"빈칸에 알맞은 낱말은?",en:"a ____ cookie",c:["Vietnamese","Australian","Korean"],a:2},
  {t:"Play 3",img:"boomerang",q:"빈칸에 알맞은 낱말은?",en:"____ toys",c:["Australian","Indian","African"],a:0},
  {t:"Play 3",img:"tuho",q:"빈칸에 알맞은 낱말은?",en:"a Korean ____",c:["drum","game","dress"],a:1},
  {t:"Play 3",img:"djembe",q:"빈칸에 알맞은 낱말은?",en:"____ drums",c:["Korean","Vietnamese","African"],a:2},
  /* 낱말 쓰기 */
  {t:"낱말 쓰기",img:"nonla",q:"빈칸에 알맞은 낱말을 써요.",en:"It's a Vietnamese ____.",ans:["hat"],hint:"h _ t"},
  {t:"낱말 쓰기",img:"djembe",q:"빈칸에 알맞은 낱말을 써요.",en:"They're African ____.",ans:["drums"],hint:"d _ _ _ s"},
  {t:"낱말 쓰기",img:"yakgwa",q:"빈칸에 알맞은 낱말을 써요.",en:"It's a Korean ____.",ans:["cookie"],hint:"c _ _ _ _ e"},
  {t:"낱말 쓰기",img:"tuho",q:"빈칸에 알맞은 낱말을 써요.",en:"It's a Korean ____.",ans:["game"],hint:"g _ _ e"},
  {t:"낱말 쓰기",img:"sari",q:"빈칸에 알맞은 낱말을 써요.",en:"Do you ____ anything about saris?",ans:["know"],hint:"k _ _ w"},
  {t:"낱말 쓰기",img:"boomerang",q:"빈칸에 알맞은 낱말을 써요.",en:"They're ____ toys.",ans:["Australian"],hint:"A _ _ _ _ _ _ _ _ n"},
  /* Read and Talk */
  {t:"Read and Talk",img:"nonla",q:"A의 마지막 말로 알맞은 것은?",en:"A: Do you know anything about nón lá?\nB: No, I don't.\nA: ____",c:["It's a Vietnamese hat.","They're African drums.","It's a Korean game."],a:0},
  {t:"Read and Talk",img:"djembe",q:"B의 말로 알맞은 것은?",en:"A: Do you know anything about djembes?\nB: Yes, I do. ____",c:["It's a Korean cookie.","They're African drums.","They're Indian dresses."],a:1},
  {t:"Read and Talk",img:"tuho",q:"A가 투호를 알려 주었어요. B의 말로 알맞은 것은?",en:"A: Do you know anything about Tuho?\nB: ____\nA: It's a Korean game.",c:["Yes, I do.","Yes, I am.","No, I don't."],a:2},
  {t:"Read and Talk",img:"boomerang",q:"A의 질문으로 알맞은 것은?",en:"A: ____\nB: Yes, I do. They're Australian toys.",c:["Do you know anything about yakgwa?","Do you know anything about boomerangs?","Do you know anything about Tuho?"],a:1},
  {t:"Read and Talk",img:"sari",q:"A의 마지막 말로 알맞은 것은?",en:"A: Do you know anything about saris?\nB: I have no idea.\nA: ____",c:["They're Australian toys.","It's a Korean game.","They're Indian dresses."],a:2},
  /* Read and Write */
  {t:"Read and Write",img:"boomerang",q:"알맞은 어구를 골라 대화를 완성해요.",en:"A: Do you know anything about ____?\nB: Yes, I do. They're Australian toys.",c:["a Korean cookie","boomerangs","Indian dresses"],a:1},
  {t:"Read and Write",img:"sari",q:"알맞은 어구를 골라 대화를 완성해요.",en:"A: Do you know anything about saris?\nB: No, I don't.\nA: They're ____.",c:["a Korean cookie","boomerangs","Indian dresses"],a:2},
  {t:"Read and Write",img:"yakgwa",q:"알맞은 어구를 골라 대화를 완성해요.",en:"A: Do you know anything about yakgwa?\nB: Yes, I do. It's ____.",c:["a Korean cookie","boomerangs","Indian dresses"],a:0},
  /* It's · They're */
  {t:"It's · They're",q:"빈칸에 알맞은 말은?",en:"____ a Korean game.",c:["It's","They're"],a:0},
  {t:"It's · They're",q:"빈칸에 알맞은 말은?",en:"____ African drums.",c:["It's","They're"],a:1},
  {t:"It's · They're",q:"빈칸에 알맞은 말은?",en:"____ Indian dresses.",c:["It's","They're"],a:1},
  {t:"It's · They're",q:"빈칸에 알맞은 말은?",en:"____ a Vietnamese hat.",c:["It's","They're"],a:0},
  /* 표현 뜻 */
  {t:"표현 뜻",q:"이 말의 뜻으로 알맞은 것은?",en:"I have no idea.",c:["전혀 모르겠어.","좋은 생각이야.","나도 그거 알아."],a:0,kr:1},
  {t:"표현 뜻",q:"이 말의 뜻으로 알맞은 것은?",en:"Do you know anything about Tuho?",c:["투호를 해 본 적 있니?","투호에 대해 아는 게 있니?","투호를 좋아하니?"],a:1,kr:1},
  {t:"표현 뜻",q:"'모른다'는 뜻이 아닌 말은?",c:["No, I don't.","I have no idea.","Yes, I do."],a:2},
  /* Let's Write: 특징 */
  {t:"Let's Write",img:"yakgwa",q:"약과를 소개하는 글이에요. 빈칸에 가장 알맞은 말은?",en:"It's a Korean cookie. It's very ____.",c:["tasty","loud","sleepy"],a:0},
  {t:"Let's Write",img:"djembe",q:"젬베를 소개하는 글이에요. 빈칸에 가장 알맞은 말은?",en:"They are African drums. They are very ____.",c:["tasty","fun","hungry"],a:1},
  {t:"Let's Write",img:"sari",q:"사리를 소개하는 글이에요. 빈칸에 가장 알맞은 말은?",en:"They are Indian dresses. They are very ____.",c:["sad","tasty","beautiful"],a:2},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"tasty",c:["맛있는","아름다운","재미있는"],a:0,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"beautiful",c:["재미있는","아름다운","맛있는"],a:1,kr:1},
  {t:"낱말 뜻",q:"낱말의 뜻으로 알맞은 것은?",en:"fun",c:["무서운","맛있는","재미있는"],a:2,kr:1},
  /* Ready to Write · Check It */
  {t:"Sentences",img:"tuho",q:"투호를 소개해요. 빈칸에 알맞은 말은?",en:"Do you know anything about Tuho?\nIt's ____.",c:["a Korean game","Australian toys","a Korean cookie"],a:0},
  {t:"Check It",img:"boomerang",q:"부메랑을 소개하는 글이에요. 빈칸에 알맞은 문장은?",en:"Do you know anything about boomerangs?\n____\nThey are very fun.",c:["They are African drums.","They are Australian toys.","It's a Korean game."],a:1},
  {t:"Check It",img:"nonla",q:"그림에 맞는 소개 글은?",c:["It's a Vietnamese hat. It's very nice.","They are Indian dresses. They are very beautiful.","It's a Korean cookie. It's very tasty."],a:0},
  /* 문장 만들기 (낱말 카드) */
  {t:"문장 만들기",img:"sari",q:"낱말 카드를 눌러 문장을 만들어요.",w:["Do","you","know","anything","about","saris?"]},
  {t:"문장 만들기",img:"yakgwa",q:"낱말 카드를 눌러 문장을 만들어요.",w:["It's","a","Korean","cookie."]},
  {t:"문장 만들기",img:"djembe",q:"낱말 카드를 눌러 문장을 만들어요.",w:["They're","African","drums."]},
  {t:"문장 만들기",q:"낱말 카드를 눌러 '전혀 모르겠어.'를 만들어요.",w:["I","have","no","idea."]},
  {t:"문장 만들기",img:"sari",q:"낱말 카드를 눌러 문장을 만들어요.",w:["They","are","very","beautiful."]},
  {t:"문장 만들기",img:"tuho",q:"낱말 카드를 눌러 대답을 만들어요.",w:["Yes,","I","do.","It's","a","Korean","game."]},
  /* 대문자 · 문장 부호 */
  {t:"바르게 쓰기",q:"대문자와 문장 부호를 바르게 쓴 문장은?",c:["it's a korean game.","It's a Korean game.","It's a korean game"],a:1},
  {t:"바르게 쓰기",q:"대문자와 문장 부호를 바르게 쓴 문장은?",c:["do you know anything about djembes?","Do you know anything about djembes.","Do you know anything about djembes?"],a:2},
  /* Culture Box */
  {t:"Culture Box",img:"djembe",q:"서아프리카의 북, 젬베는 어떻게 연주할까요?",c:["손으로 두드려요.","입으로 불어요.","활로 켜요."],a:0,kr:1},
  {t:"Culture Box",img:"sari",q:"사리는 어느 나라 여성들이 주로 입는 전통 의상일까요?",c:["베트남","인도","호주"],a:1,kr:1}
];

const DEFAULT_SET = { id: 'default', title: 'Lesson 11 · 3·5차시 (교과서 154~155, 158~159쪽)', passages: [], questions: BANK };
const qKind = Q => Q.w ? 'build' : Q.ans ? 'type' : 'choice';
const isKr = Q => Q.kr != null ? !!Q.kr : /[가-힣]/.test((Q.c || []).join(''));
const normWord = s => String(s || '').toLowerCase().replace(/[’']/g, "'").replace(/[.,!?]/g, '').replace(/\s+/g, ' ').trim();
const qAnswer = Q => Q.w ? Q.w.join(' ') : Q.ans ? Q.ans[0] : Q.c[Q.a];

/* ---------- 기념품 캡슐 ---------- */
// kind: g 행운 / b 고장 / n 깜짝 , tgt: 다른 모둠을 골라야 함 , pic: 전시품 그림(없으면 ic 이모지)
const ITEMS = [
  { id: 'p10', pic: 'ex_yakgwa', kind: 'g', ic: '🍯', name: '꿀 약과', fx: '우리 모둠 +10점', en: "It's very tasty!", w: 7 },
  { id: 'p20', pic: 'ex_sari', kind: 'g', ic: '🧣', name: '반짝 사리 스카프', fx: '우리 모둠 +20점', en: "They're very beautiful!", w: 5 },
  { id: 'p30', pic: 'item_arrow_gold', kind: 'g', ic: '🏹', name: '황금 투호 화살', fx: '우리 모둠 +30점', en: 'Bullseye! What a fun game!', w: 2 },
  { id: 'x2', pic: 'item_minibot', kind: 'g', ic: '🤖', name: '쌍둥이 미니봇', fx: '내가 모은 점수만큼 한 번 더 (최대 +30)', en: "We're very clever!", w: 1 },
  { id: 'steal', pic: 'ex_boomerang', kind: 'g', ic: '🪃', name: '돌아오는 부메랑', fx: '다른 모둠 10점 가져오기', en: 'It always comes back!', w: 2, tgt: 1 },
  { id: 'shield', pic: 'ex_nonla', kind: 'g', ic: '☂️', name: '우산 논라', fx: '우리 모둠 손해 한 번 막기', en: "It's like an umbrella!", w: 2 },
  { id: 'party', pic: 'ex_djembe', kind: 'g', ic: '🥁', name: '젬베 공연', fx: '모든 모둠 +10점', en: 'Hit it with your hands!', w: 1 },
  { id: 'pass', pic: 'item_virus', kind: 'g', ic: '🦠', name: '고장 바이러스', fx: '다른 모둠 −20점', en: 'Beep... error... error!', w: 1, tgt: 1 },
  { id: 'crown', pic: 'item_badge', kind: 'n', ic: '🏅', name: '관장님 배지', fx: '1등 모둠에게서 10점 가져오기', en: 'You did a good job!', w: 1 },
  { id: 'topHit', pic: 'item_switch', kind: 'n', ic: '🔌', name: '정전 스위치', fx: '1등 모둠 −20점', en: 'Lights out!', w: 1 },
  { id: 'zero', pic: 'item_empty', kind: 'n', ic: '🫧', name: '빈 캡슐', fx: '꽝', en: 'I have no idea!', w: 3 },
  { id: 'm10', pic: 'item_battery', kind: 'b', ic: '🪫', name: '배터리 방전', fx: '우리 모둠 −10점', en: 'Low battery...', w: 3 },
  { id: 'm20', pic: 'item_jar', kind: 'b', ic: '🏺', name: '깨진 항아리', fx: '우리 모둠 −20점', en: 'Oops! Crash!', w: 1 },
  { id: 'ghost', pic: 'item_vacuum', kind: 'b', ic: '🧹', name: '길 잃은 로봇 청소기', fx: '우리 모둠 10점을 다른 모둠에 줌', en: 'Beep! Where am I?', w: 2, tgt: 1 }
];
const item = id => ITEMS.find(x => x.id === id);
const KINDNAME = { g: '행운', b: '고장', n: '깜짝' };
function itemArt(x, cls) { return x.pic ? `<img class="${cls || ''}" src="${IMG(x.pic)}" alt="">` : `<span class="emo ${cls || ''}" aria-hidden="true">${x.ic}</span>`; }
function drawItem() { const tot = ITEMS.reduce((s, x) => s + x.w, 0); let r = Math.random() * tot; for (const x of ITEMS) { if ((r -= x.w) < 0) return x; } return ITEMS[0]; }
function makeBoxes() {
  let b;
  do { b = Array.from({ length: 6 }, drawItem); }
  while (b.filter(x => x.kind === 'g').length < 2 || b.filter(x => x.kind === 'b').length < 1 || new Set(b.map(x => x.id)).size < 5);
  return b.map(x => x.id);
}
const CAPC = [['#ff7a59', '#ffd2c4'], ['#3fb6a8', '#c9f0ea'], ['#f5b82e', '#fde9b8'], ['#7c6cf0', '#ddd8ff'], ['#ec5f9c', '#ffd3e6'], ['#4a9be8', '#cfe5fb']];

/* ---------- 도우미 로봇 보리 ---------- */
function boriSVG(mood, size) {
  mood = ['idle', 'happy', 'oops', 'sleep'].includes(mood) ? mood : 'idle';
  return `<img class="bori ${mood}" src="${IMG('bori_' + mood)}" alt="도우미 로봇 보리" ${size ? `width="${size}"` : ''} draggable="false">`;
}
/* 기억 복구 막대 (진행 정도) */
function memoryBar(prog, label) {
  const p = Math.round(Math.max(0, Math.min(1, prog || 0)) * 100);
  return `<div class="membar" role="img" aria-label="${label || '보리의 기억'} ${p}%"><span class="ml">${label || '기억 복구'}</span><span class="mt"><i style="width:${p}%"></i></span><b>${p}%</b></div>`;
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
let VOICES = [];
function loadVoices() { try { VOICES = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang)); } catch (e) { VOICES = []; } }
try { loadVoices(); speechSynthesis.addEventListener('voiceschanged', () => { const had = VOICES.length; loadVoices(); if (!had && VOICES.length && window.onVoices) window.onVoices(); }); } catch (e) {}
function voiceScore(v) { let s = 0; const n = v.name;
  if (/natural|neural/i.test(n)) s += 60; if (/online/i.test(n)) s += 30; if (/google/i.test(n)) s += 45;
  if (/aria|jenny|guy|ava|andrew|emma|samantha|allison|michelle/i.test(n)) s += 20;
  if (/en[-_]US/i.test(v.lang)) s += 12; else if (/en[-_](GB|AU|CA|IE|NZ)/i.test(v.lang)) s += 6;
  if (/compact|espeak|zira|david|mark/i.test(n)) s -= 15; return s; }
function pickVoice() { const want = (() => { try { return localStorage.getItem(LS_VOICE); } catch (e) { return null; } })(); return VOICES.find(v => v.name === want) || VOICES.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null; }
function sayLines(lines) {
  try { speechSynthesis.cancel(); const v = pickVoice();
    lines.forEach(line => { const text = line.replace(/^[AB]\s*:\s*/, '').replace(/_{2,}/g, '...').replace(/nón lá/gi, 'non la').trim(); if (!text) return;
      const u = new SpeechSynthesisUtterance(text); u.lang = v ? v.lang : 'en-US'; if (v) u.voice = v; u.rate = .9; u.pitch = 1; speechSynthesis.speak(u); });
  } catch (e) {}
}
function voiceRow() {
  if (!VOICES.length) return `<div class="voicerow"><span>읽어 주는 목소리: 이 브라우저에서 영어 목소리를 찾지 못했어요. 크롬이나 엣지에서 열면 더 자연스러운 목소리를 쓸 수 있어요.</span></div>`;
  const cur = pickVoice();
  return `<div class="voicerow"><label for="voice">읽어 주는 목소리</label><select id="voice" class="sel voice" data-voice>${VOICES.slice().sort((a, b) => voiceScore(b) - voiceScore(a)).map(v => `<option value="${esc(v.name)}" ${cur && cur.name === v.name ? 'selected' : ''}>${esc(v.name)} (${v.lang})</option>`).join('')}</select><button class="btn ghost small" data-act="vtest">🔊 들어 보기</button></div>`;
}

/* ---------- 소리 (Web Audio로 직접 합성 — 밝은 로봇·박물관 느낌) ---------- */
let AC = null, muted = false;
function ac() { if (muted) return null; try { AC = AC || new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; } catch (e) { return null; } }
function tone(c, { f = 440, f2 = null, type = 'sine', t = 0, dur = 1, vol = .2, attack = .02 }) {
  const o = c.createOscillator(), g = c.createGain(), now = c.currentTime + t;
  o.type = type; o.frequency.setValueAtTime(f, now); if (f2) o.frequency.exponentialRampToValueAtTime(f2, now + dur);
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + attack); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  o.connect(g).connect(c.destination); o.start(now); o.stop(now + dur + .05);
}
function noise(c, { t = 0, dur = .6, vol = .15, from = 600, to = 2400, q = 6 }) {
  const len = c.sampleRate * dur, buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1);
  const s = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain(), now = c.currentTime + t;
  s.buffer = buf; bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(from, now); bp.frequency.exponentialRampToValueAtTime(to, now + dur);
  g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(vol, now + dur * .3); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
  s.connect(bp).connect(g).connect(c.destination); s.start(now); s.stop(now + dur);
}
const SYN = {
  // 캡슐 머신 손잡이 드르륵 → 캡슐 톡 → 뚜껑 뽕
  open() { const c = ac(); if (!c) return;
    for (let i = 0; i < 6; i++) { noise(c, { t: i * .07, dur: .05, vol: .12, from: 2600, to: 1400, q: 4 }); tone(c, { f: 300 + i * 25, type: 'square', t: i * .07, dur: .04, vol: .03, attack: .002 }); }
    tone(c, { f: 660, f2: 330, type: 'triangle', t: .5, dur: .18, vol: .12, attack: .004 });
    tone(c, { f: 220, f2: 880, type: 'sine', t: .78, dur: .14, vol: .14, attack: .004 }); noise(c, { t: .78, dur: .1, vol: .1, from: 3000, to: 900, q: 2 });
  },
  good() { const c = ac(); if (!c) return;
    [523.3, 659.3, 784, 1046.5].forEach((f, i) => tone(c, { f, type: 'triangle', t: i * .08, dur: .8, vol: .12 }));
    [1568, 2093].forEach((f, i) => tone(c, { f, t: .34 + i * .08, dur: .5, vol: .04 }));
  },
  bad() { const c = ac(); if (!c) return;
    tone(c, { f: 440, f2: 110, type: 'square', dur: .9, vol: .05, attack: .01 });
    tone(c, { f: 330, f2: 82, type: 'sawtooth', t: .05, dur: .9, vol: .04, attack: .01 });
    [0, .14, .28].forEach(t => tone(c, { f: 180, type: 'square', t: .9 + t, dur: .07, vol: .04, attack: .002 }));
  },
  fate() { const c = ac(); if (!c) return; [880, 1175, 988, 1319, 1047, 1568].forEach((f, i) => tone(c, { f, type: 'sine', t: i * .08, dur: .35, vol: .06 })); },
  tick() { const c = ac(); if (!c) return; tone(c, { f: 1400, f2: 1800, type: 'sine', dur: .08, vol: .04, attack: .003 }); },
  // 버튼: 로봇 버튼 '삑'
  click() { const c = ac(); if (!c) return; tone(c, { f: 900, f2: 1300, type: 'sine', dur: .07, vol: .07, attack: .003 }); },
  pick() { const c = ac(); if (!c) return; tone(c, { f: 1200, type: 'triangle', dur: .1, vol: .06, attack: .002 }); tone(c, { f: 1800, type: 'sine', t: .05, dur: .1, vol: .04, attack: .002 }); },
  // 개관: 보리가 켜지는 소리 + 차임
  bell() { const c = ac(); if (!c) return;
    tone(c, { f: 110, f2: 880, type: 'sawtooth', dur: .6, vol: .04, attack: .02 }); tone(c, { f: 220, f2: 1760, type: 'sine', dur: .6, vol: .05, attack: .02 });
    [784, 988, 1175, 1568].forEach((f, i) => tone(c, { f, type: 'sine', t: .7 + i * .12, dur: .9, vol: .08, attack: .004 }));
  },
  correct() { const c = ac(); if (!c) return; [[880, 0], [1318.5, .1]].forEach(([f, t]) => { tone(c, { f, type: 'sine', t, dur: .5, vol: .11, attack: .004 }); tone(c, { f: f * 2, type: 'sine', t, dur: .25, vol: .025, attack: .004 }); }); },
  wrong() { const c = ac(); if (!c) return; tone(c, { f: 260, type: 'square', dur: .14, vol: .05, attack: .004 }); tone(c, { f: 196, type: 'square', t: .17, dur: .28, vol: .05, attack: .004 }); },
  whoosh() { const c = ac(); if (!c) return; noise(c, { dur: .45, vol: .08, from: 500, to: 3000, q: 1.5 }); tone(c, { f: 523, f2: 1046, type: 'sine', t: .1, dur: .35, vol: .04 }); },
  saved() { const c = ac(); if (!c) return; [1046.5, 1568].forEach((f, i) => tone(c, { f, type: 'sine', t: i * .08, dur: .4, vol: .07, attack: .003 })); },
  // 폐관: 팡파르
  finale() { const c = ac(); if (!c) return; [[523.3, 0], [523.3, .16], [523.3, .32], [659.3, .48], [784, .8], [1046.5, 1.1]].forEach(([f, t], i) => { tone(c, { f, type: 'triangle', t, dur: i === 5 ? 1.6 : .3, vol: .12, attack: .006 }); tone(c, { f: f / 2, type: 'sine', t, dur: i === 5 ? 1.6 : .3, vol: .06 }); }); }
};


/* ---------- 소리 파일 (sfx 폴더) — 파일이 안 열리면 위의 합성 소리로 대신해요 ---------- */
const SV = 'v=1';
const SNDCACHE = {};
function sndFile(name, vol, fallback) {
  if (muted) return;
  try {
    let base = SNDCACHE[name];
    if (!base) { base = SNDCACHE[name] = new Audio(`sfx/${name}.mp3?${SV}`); base.preload = 'auto'; }
    const a = base.cloneNode(); a.volume = vol == null ? .7 : vol;
    const p = a.play(); if (p && p.catch) p.catch(() => { if (fallback) fallback(); });
  } catch (e) { if (fallback) fallback(); }
}
['sfx_click', 'sfx_pick', 'sfx_correct', 'sfx_wrong', 'sfx_crank', 'sfx_pop', 'sfx_good'].forEach(n => { try { const a = new Audio(`sfx/${n}.mp3?${SV}`); a.preload = 'auto'; SNDCACHE[n] = a; } catch (e) {} });
const SFX = {
  click() { sndFile('sfx_click', .5, SYN.click); },
  pick() { sndFile('sfx_pick', .6, SYN.pick); },
  tick() { sndFile('sfx_click', .35, SYN.tick); },
  bell() { sndFile('sfx_boot', .7, SYN.bell); },
  correct() { sndFile('sfx_correct', .75, SYN.correct); },
  wrong() { sndFile('sfx_wrong', .7, SYN.wrong); },
  whoosh() { sndFile('sfx_whoosh', .6, SYN.whoosh); },
  open() { sndFile('sfx_crank', .7, SYN.open); setTimeout(() => sndFile('sfx_pop', .75), 650); },
  good() { sndFile('sfx_good', .75, SYN.good); },
  bad() { sndFile('sfx_bad', .7, SYN.bad); },
  fate() { sndFile('sfx_fate', .7, SYN.fate); },
  saved() { sndFile('sfx_notice_up', .6, SYN.saved); },
  down() { sndFile('sfx_notice_down', .6, SYN.bad); },
  finale() { sndFile('sfx_finale', .75, SYN.finale); }
};

/* ---------- 배경 음악 ---------- */
const BGM = {
  a: null, cur: null, want: null, vol: .35,
  on: (() => { try { return localStorage.getItem('bori-museum.music') !== 'off'; } catch (e) { return true; } })(),
  play(name, vol) {
    this.want = name; if (vol != null) this.vol = vol;
    if (!this.on || muted) return;
    if (this.cur === name && this.a && !this.a.paused) return;
    this.stop(true);
    try {
      const a = new Audio(`sfx/${name}.mp3?${SV}`); a.loop = true; a.volume = 0;
      this.a = a; this.cur = name;
      const p = a.play();
      if (p && p.catch) p.catch(() => { if (this.a === a) { this.a = null; this.cur = null; } });
      this.fade(a, this.vol, 1500);
    } catch (e) {}
  },
  fade(a, to, ms) { const from = a.volume, t0 = performance.now(); (function step(now) { const k = Math.min((now - t0) / ms, 1); try { a.volume = Math.max(0, Math.min(1, from + (to - from) * k)); } catch (e) {} if (k < 1) requestAnimationFrame(step); else if (to === 0) a.pause(); })(t0); },
  stop(quick) { if (this.a) { const a = this.a; this.a = null; this.cur = null; if (quick) a.pause(); else this.fade(a, 0, 800); } },
  resume() { if (this.want && (!this.a || this.a.paused)) this.play(this.want); },
  toggle() { this.on = !this.on; try { localStorage.setItem('bori-museum.music', this.on ? 'on' : 'off'); } catch (e) {} if (this.on) this.resume(); else this.stop(); }
};
document.addEventListener('pointerdown', () => BGM.resume(), true);
