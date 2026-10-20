/* =========================================================
   토이랜드 장난감 공장 — 공통 데이터 · 서버 통신 · 소리
   6학년 영어 Lesson 9 (What Are You Going to Do?) 3차시 (교과서 126~127쪽)
   ========================================================= */

/* 구글 Apps Script 웹 앱 주소 (배포 후 여기에 붙여 넣기). 비어 있으면 데모 모드 */
const API_URL = 'https://script.google.com/macros/s/AKfycbzYpydkW6MO2lPKd92iWmjnePHC_UL45muyx22x0AEqQ6bhJItJw5uQbkGXmOKTzh8_/exec';
const DEMO = !API_URL;

/* ---------- 주말 계획 (교과서 어휘) ---------- */
const PLANS = {
  stay:  { en: 'stay home',               ko: '집에 있기',          art: '🏠🛋️' },
  math:  { en: 'study math',              ko: '수학 공부하기',       art: '✏️🔢' },
  room:  { en: 'clean my room',           ko: '내 방 청소하기',      art: '🧹🛏️' },
  house: { en: 'clean the house',         ko: '집 청소하기',         art: '🧽🏡' },
  camp:  { en: 'go camping',              ko: '캠핑 가기',           art: '⛺🔥' },
  ball:  { en: 'watch a basketball game', ko: '농구 경기 보기',      art: '🏀🏟️' },
  grand: { en: 'visit my grandparents',   ko: '조부모님 댁 방문하기', art: '👵👴' }
};

/* ---------- 그림 ---------- */
const IMG = 'assets/img/';
function planImg(id) { return `<img src="${IMG}plan_${id}.jpg" alt="${PLANS[id].ko}" draggable="false">`; }
function preloadImages() {
  const list = ['bg_title', 'bg_night', 'bg_boom', 'bg_room1', 'bg_room2', 'bg_room3', 'bg_room4', 'bg_room5', 'bg_finale', 'boss_body', 'penguins_body']
    .concat(Object.keys(PLANS).map(k => 'plan_' + k), Object.keys(TOYS).map(k => TOYS[k].img));
  list.forEach(n => { const i = new Image(); i.src = IMG + n + '.jpg'; });
}

/* ---------- 등장 장난감 ---------- */
const TOYS = {
  boss:  { img: 'boss', en: 'Teddy',  ko: '테디 공장장', face: '🧸', bg: '#FFE3B8', voice: { kind: 'man',   pitch: 0.8,  rate: 0.9 } },
  bunny: { img: 'bunny', en: 'Bonny',  ko: '보니',       face: '🐰', bg: '#FFD6E4', voice: { kind: 'girl',  pitch: 1.45 } },
  robo:  { img: 'robo', en: 'Robo',   ko: '로보',       face: '🤖', bg: '#D4E8FF', voice: { kind: 'man',   pitch: 0.55, rate: 0.85 } },
  mimi:  { img: 'mimi', en: 'Mimi',   ko: '미미',       face: '🪆', bg: '#FFD9D0', voice: { kind: 'girl',  pitch: 1.25 } },
  dino:  { img: 'dino', en: 'Dino',   ko: '디노',       face: '🦖', bg: '#D3F5DF', voice: { kind: 'boy',   pitch: 0.8 } },
  momo:  { img: 'momo', en: 'Momo',   ko: '모모',       face: '🐵', bg: '#F5E1C8', voice: { kind: 'boy',   pitch: 1.35 } },
  choo:  { img: 'choo', en: 'Choo',   ko: '추추',       face: '🚂', bg: '#E5DCFF', voice: { kind: 'man',   pitch: 1.0 } },
  duck:  { img: 'duck', en: 'Duckie', ko: '더키',       face: '🐥', bg: '#FFF3B0', voice: { kind: 'woman', pitch: 1.5 } },
  pen:   { img: 'pen', en: 'Pen',    ko: '펜',         face: '🐧', bg: '#DDF3FF', voice: { kind: 'boy',   pitch: 1.3 } },
  pin:   { img: 'pin', en: 'Pin',    ko: '핀',         face: '🐧', bg: '#DDF3FF', voice: { kind: 'girl',  pitch: 1.3 } },
  pon:   { img: 'pon', en: 'Pon',    ko: '폰',         face: '🐧', bg: '#DDF3FF', voice: { kind: 'boy',   pitch: 0.95 } },
  kitty: { img: 'kitty', en: 'Kitty',  ko: '키티',       face: '🐱', bg: '#FFE6F2', voice: { kind: 'girl',  pitch: 1.2 } }
};

/* ---------- 작업실 (스토리 단계) ---------- */
const ROOMS = [
  { icon: '🎧', name: '소리 작업실',   color: '#8EC9FF',
    who: 'boss', say: '첫 번째는 <b>소리 작업실</b>이에요! 장난감들이 주말 계획을 말하면 <b>잘 듣고</b> 알맞은 카드를 골라 상자에 붙여 줘요.',
    hello: "Listen carefully!" },
  { icon: '💬', name: '말풍선 작업실', color: '#FF9EC0',
    who: 'boss', say: '이런! 말풍선 기계가 고장 나서 <b>말풍선이 하나씩 비었어요</b>. 대화를 <b>읽고</b> 빈 말풍선에 알맞은 문장을 끼워 줘요.',
    hello: "Read the speech bubbles!" },
  { icon: '🏷️', name: '이름표 작업실', color: '#FFC94D',
    who: 'boss', say: '장난감 상자에 <b>주말 계획 이름표</b>를 붙일 차례예요. 그림을 보고 알맞은 말을 골라 <b>문장을 완성</b>해요.',
    hello: "Let's make name tags!" },
  { icon: '🧩', name: '조립 작업실',   color: '#7ED6B6',
    who: 'boss', say: '쾅! 문장 블록이 산산조각 났어요. 단어 블록을 <b>순서대로 눌러서</b> 문장을 다시 조립해요.',
    hello: "Put the blocks in order!" },
  { icon: '📦', name: '포장 작업실',   color: '#B69CFF',
    who: 'boss', say: '마지막 <b>포장 작업실</b>! 인터뷰 수첩도 읽고, 펭귄 삼총사 이야기도 듣고, 마지막 상자들을 포장해요.',
    hello: "Last room! You can do it!" }
];

/* ---------- 문제 20개 ----------
   kind: 'listen' (소리만 듣기), 'bubble' (말풍선 읽기), 'phrase'(어구 고르기), 'type'(직접 쓰기),
         'order'(단어 블록 조립), 'note'(수첩 읽기)
   opts: 그림 카드면 {plan}, 문장이면 {t}, 장난감이면 {toy}
   ans : 정답 옵션 번호 (type / order 는 정답 문자열)                           */
const Q = [
  // 🎧 소리 작업실
  { id: 'Q1', room: 0, kind: 'listen', short: '보니의 계획 듣고 그림 고르기',
    ask: '보니는 이번 주말에 무엇을 할까요? 잘 듣고 알맞은 그림을 골라요.',
    lines: [['boss', 'Bonny, what are you going to do this weekend?'], ['bunny', "I'm going to stay home."]],
    opts: [{ plan: 'camp' }, { plan: 'stay' }, { plan: 'math' }, { plan: 'grand' }], ans: 1 },
  { id: 'Q2', room: 0, kind: 'listen', short: '로보의 계획 듣고 그림 고르기',
    ask: '로보는 이번 주말에 무엇을 할까요?',
    lines: [['mimi', 'Robo, what are you going to do this weekend?'], ['robo', "I'm going to study math."]],
    opts: [{ plan: 'room' }, { plan: 'ball' }, { plan: 'math' }, { plan: 'house' }], ans: 2 },
  { id: 'Q3', room: 0, kind: 'listen', short: '디노가 한 말 고르기',
    ask: '디노가 한 말을 잘 듣고 골라요.',
    lines: [['bunny', 'What are you going to do this weekend, Dino?'], ['dino', "I'm going to go camping."], ['bunny', "That's a good idea."]],
    opts: [{ t: "I'm going to clean my room." }, { t: "I'm going to stay home." }, { t: "I'm going to go camping." }, { t: "I'm going to study math." }], ans: 2 },
  { id: 'Q4', room: 0, kind: 'listen', short: '추추의 계획 듣고 그림 고르기',
    ask: '추추의 주말 계획으로 알맞은 그림을 골라요.',
    lines: [['dino', 'Choo, what are you going to do this weekend?'], ['choo', "I'm going to visit my grandparents."]],
    opts: [{ plan: 'ball' }, { plan: 'house' }, { plan: 'stay' }, { plan: 'grand' }], ans: 3 },

  // 💬 말풍선 작업실
  { id: 'Q5', room: 1, kind: 'bubble', short: '더키의 빈 말풍선 채우기',
    ask: '더키의 생각 그림을 보고, 빈 말풍선에 알맞은 문장을 골라요.',
    bubbles: [['momo', 'What are you going to do this weekend?'], ['duck', null, 'house']],
    opts: [{ t: "I'm going to stay home." }, { t: "I'm going to clean the house." }, { t: "I'm going to go camping." }, { t: "I'm going to watch a basketball game." }], ans: 1 },
  { id: 'Q6', room: 1, kind: 'bubble', short: '미미의 질문 고르기',
    ask: '미미는 로보에게 무엇을 물어봤을까요?',
    bubbles: [['mimi', null], ['robo', "I'm going to study math."]],
    opts: [{ t: "I'm going to study math." }, { t: "That's a good idea." }, { t: 'What are you going to do this weekend?' }, { t: 'Thank you.' }], ans: 2 },
  { id: 'Q7', room: 1, kind: 'bubble', short: '"좋은 생각이야" 말하기',
    ask: '추추는 디노의 계획이 정말 마음에 들어요! 👍 추추가 할 말을 골라요.',
    bubbles: [['choo', 'What are you going to do this weekend?'], ['dino', "I'm going to go camping."], ['choo', null]],
    opts: [{ t: "I'm going to stay home." }, { t: "That's a good idea." }, { t: 'What are you going to do?' }, { t: 'Good morning.' }], ans: 1 },
  { id: 'Q8', room: 1, kind: 'bubble', short: '미미의 빈 말풍선 채우기',
    ask: '미미의 생각 그림을 보고, 빈 말풍선에 알맞은 문장을 골라요.',
    bubbles: [['bunny', 'What are you going to do this weekend?'], ['momo', "I'm going to watch a basketball game."], ['dino', "I'm going to go camping."], ['mimi', null, 'room']],
    opts: [{ t: "I'm going to study math." }, { t: "I'm going to visit my grandparents." }, { t: "I'm going to clean my room." }], ans: 2 },

  // 🏷️ 이름표 작업실
  { id: 'Q9', room: 2, kind: 'phrase', short: '그림 보고 어구 고르기 (로보)',
    ask: '그림을 보고, 알맞은 어구를 골라 이름표 문장을 완성해요.',
    toy: 'robo', plan: 'math', before: "I'm going to", after: '.',
    opts: [{ t: 'stay home' }, { t: 'go camping' }, { t: 'study math' }, { t: 'visit my grandparents' }], ans: 2 },
  { id: 'Q10', room: 2, kind: 'phrase', short: '그림 보고 어구 고르기 (추추)',
    ask: '그림을 보고, 알맞은 어구를 골라 이름표 문장을 완성해요.',
    toy: 'choo', plan: 'grand', before: "I'm going to", after: '.',
    opts: [{ t: 'visit my grandparents' }, { t: 'clean my room' }, { t: 'watch a basketball game' }, { t: 'stay home' }], ans: 0 },
  { id: 'Q11', room: 2, kind: 'phrase', short: '빈칸 단어 고르기 (clean the ___)',
    ask: '더키 이름표에 빠진 단어를 골라요.',
    toy: 'duck', plan: 'house', before: "I'm going to clean the", after: '.',
    opts: [{ t: 'room' }, { t: 'home' }, { t: 'game' }, { t: 'house' }], ans: 3 },
  { id: 'Q12', room: 2, kind: 'type', short: '빈칸 단어 직접 쓰기 (basketball ___)',
    ask: '모모 이름표에 빠진 단어를 직접 써요. (영어 소문자로!)',
    toy: 'momo', plan: 'ball', before: "I'm going to watch a basketball", after: '.',
    accept: ['game'], ansText: 'game' },

  // 🧩 조립 작업실
  { id: 'Q13', room: 3, kind: 'order', short: '단어 조립: 보니의 계획',
    ask: '보니의 주말 계획 문장을 조립해요.', toy: 'bunny', plan: 'stay',
    words: ['home.', 'going', "I'm", 'stay', 'to'], ansText: "I'm going to stay home." },
  { id: 'Q14', room: 3, kind: 'order', short: '단어 조립: 추추의 계획',
    ask: '추추의 주말 계획 문장을 조립해요.', toy: 'choo', plan: 'grand',
    words: ['my', 'to', 'visit', "I'm", 'grandparents.', 'going'], ansText: "I'm going to visit my grandparents." },
  { id: 'Q15', room: 3, kind: 'order', short: '단어 조립: 주말 계획 묻기',
    ask: '친구에게 주말 계획을 묻는 문장을 조립해요.', toy: 'kitty', plan: null,
    words: ['do', 'What', 'this', 'are', 'weekend?', 'going', 'you', 'to'], ansText: 'What are you going to do this weekend?' },
  { id: 'Q16', room: 3, kind: 'order', short: '단어 조립: 미미의 계획',
    ask: '미미의 주말 계획 문장을 조립해요.', toy: 'mimi', plan: 'room',
    words: ['clean', "I'm", 'room.', 'going', 'my', 'to'], ansText: "I'm going to clean my room." },

  // 📦 포장 작업실
  { id: 'Q17', room: 4, kind: 'note', short: '인터뷰 수첩 읽고 답하기',
    ask: '테디 공장장의 인터뷰 수첩을 읽고 물음에 답해요.',
    note: [['bunny', 'stay'], ['momo', 'ball'], ['duck', 'house'], ['dino', 'camp']],
    question: 'Who is going to clean the house?',
    opts: [{ toy: 'bunny' }, { toy: 'momo' }, { toy: 'duck' }, { toy: 'dino' }], ans: 2 },
  { id: 'Q18', room: 4, kind: 'listen', short: '펭귄 삼총사 모둠 계획 (듣기)',
    ask: '펭귄 삼총사의 주말 계획을 잘 듣고, 가장 많이 나온 계획으로 모둠 문장을 완성해요.',
    lines: [['boss', 'What are you going to do this weekend?'], ['pen', "I'm going to go camping."], ['pin', "I'm going to stay home."], ['pon', "I'm going to go camping."]],
    before: "We're going to", after: 'this weekend.',
    opts: [{ t: 'stay home' }, { t: 'go camping' }, { t: 'study math' }, { t: 'clean the house' }], ans: 1 },
  { id: 'Q19', room: 4, kind: 'phrase', short: 'Check It ① 그림 보고 문장 고르기',
    ask: '테디 공장장의 주말 계획 그림을 보고, 알맞은 문장을 골라요.',
    toy: 'boss', plan: 'ball', before: '', after: '', wholeSentence: true,
    opts: [{ t: "I'm going to clean my room." }, { t: "I'm going to watch a basketball game." }, { t: "I'm going to go camping." }, { t: "I'm going to stay home." }], ans: 1 },
  { id: 'Q20', room: 4, kind: 'phrase', short: 'Check It ② 그림 보고 어구 고르기',
    ask: '비서 키티의 주말 계획 그림을 보고, 알맞은 어구를 골라 문장을 완성해요.',
    toy: 'kitty', plan: 'math', before: "I'm going to", after: '.',
    opts: [{ t: 'go camping' }, { t: 'study math' }, { t: 'clean the house' }, { t: 'visit my grandparents' }], ans: 1 }
];
const POINTS = 5;

/* 정답 문장 (작업 일지·교사 화면에 표시) */
function correctText(q) {
  if (q.kind === 'type' || q.kind === 'order') return q.ansText;
  return optText(q, q.opts[q.ans]);
}
function optText(q, o) {
  if (!o) return '';
  if (o.plan) return PLANS[o.plan].ko + ' 그림';
  if (o.toy) return TOYS[o.toy].en;
  return o.t;
}
/* 학생 답 → 화면용 글자 */
function answerText(q, a) {
  if (a === undefined || a === null || a === '') return '(빈칸)';
  if (q.kind === 'type' || q.kind === 'order') return String(a);
  return optText(q, q.opts[Number(a)]);
}
function norm(s) { return String(s || '').toLowerCase().replace(/[’`]/g, "'").replace(/[^a-z' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function grade(q, a) {
  if (q.kind === 'type') return q.accept.some(x => norm(x) === norm(a));
  if (q.kind === 'order') return norm(a) === norm(q.ansText);
  return Number(a) === q.ans;
}

/* ---------- 서버 통신 ---------- */
async function api(payload) {
  if (DEMO) return mockApi(payload);
  const res = await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  return await res.json();
}
/* 기록은 줄을 세워 하나씩 보냄 (인터넷이 끊겨도 나중에 다시 보냄) */
const SendQueue = {
  key: 'tf_queue', busy: false, onReply: null,
  load() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch (e) { return []; } },
  save(q) { try { localStorage.setItem(this.key, JSON.stringify(q)); } catch (e) {} },
  push(p) { const q = this.load(); q.push(p); this.save(q); this.flush(); },
  clear() { this.save([]); },
  async flush() {
    if (this.busy) return;
    this.busy = true;
    try {
      let q = this.load();
      while (q.length) {
        const r = await api(q[0]);
        if (!r || r.ok === false) throw new Error('send fail');
        q = this.load(); q.shift(); this.save(q);
        if (this.onReply) this.onReply(r);
      }
    } catch (e) { setTimeout(() => this.flush(), 4000); }
    finally { this.busy = false; }
  }
};

/* ---------- 데모 모드: 서버 없이 이 브라우저 안에서만 저장 ---------- */
function mockDB() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem('tf_mock') || 'null'); } catch (e) {}
  return db || { sid: 'demo', students: {}, answers: [] };
}
function mockApi(p) {
  const db = mockDB(), now = Date.now();
  let out = { ok: true, sid: db.sid };
  const st = n => db.students[n] || (db.students[n] = { num: Number(n), name: '', qi: 0, score: '', done: false, started: now, updated: now });
  if (p.action === 'join') { db.students[p.num] = { num: Number(p.num), name: p.name, qi: 0, score: '', done: false, started: now, updated: now }; }
  else if (p.action === 'answer') {
    const s = st(p.num); s.name = p.name || s.name; s.qi = Math.max(s.qi, Number(p.qi) + 1); s.updated = now;
    db.answers.push([now, Number(p.num), p.qid, String(p.ans), p.ok ? 'O' : 'X']);
  } else if (p.action === 'finish') { const s = st(p.num); s.score = Number(p.score); s.done = true; s.updated = now; }
  else if (p.action === 'dash') { out = Object.assign(out, buildDash(Object.values(db.students), db.answers)); }
  else if (p.action === 'reset') { db.sid = String(now); db.students = {}; db.answers = []; out.sid = db.sid; }
  try { localStorage.setItem('tf_mock', JSON.stringify(db)); } catch (e) {}
  return Promise.resolve(JSON.parse(JSON.stringify(out)));
}
/* Code.gs 와 같은 집계 */
function buildDash(students, answerRows) {
  const byNum = {};
  students.forEach(s => { byNum[s.num] = s; });
  const ans = {};
  answerRows.forEach(r => {
    const t = Number(r[0]), num = Number(r[1]), s = byNum[num];
    if (!s || t < Number(s.started || 0) - 1000) return;    // 같은 번호로 새로 들어오기 전 기록은 무시
    ans[num] = ans[num] || {};
    if (!ans[num][r[2]]) ans[num][r[2]] = { a: r[3], ok: r[4] === 'O', t };  // 첫 답만 채점
  });
  return { students, ans, now: Date.now() };
}

/* ---------- 유틸 ---------- */
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const sleep = ms => new Promise(r => setTimeout(r, ms));
function shuffle(a, seed) {
  a = a.slice();
  let s = seed || Math.floor(Math.random() * 1e9);
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ---------- 영어 음성 (크롬 내장 음성) ---------- */
const Voice = {
  list: [], slow: false,
  load() { this.list = (window.speechSynthesis ? speechSynthesis.getVoices() : []).filter(v => /^en/i.test(v.lang)); },
  pick(kind) {
    const pref = {
      girl:  ['Google US English', 'Samantha', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira'],
      boy:   ['Google UK English Male', 'Daniel', 'Microsoft Guy', 'Microsoft David', 'Alex'],
      woman: ['Google UK English Female', 'Karen', 'Microsoft Libby', 'Google US English'],
      man:   ['Google UK English Male', 'Daniel', 'Microsoft Guy', 'Microsoft David']
    }[kind] || [];
    for (const n of pref) { const v = this.list.find(v => v.name.indexOf(n) >= 0); if (v) return v; }
    return this.list.find(v => v.lang === 'en-US') || this.list[0] || null;
  },
  say(text, opt = {}) {
    return new Promise(res => {
      if (!window.speechSynthesis) return res();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      const v = this.pick(opt.kind || 'girl');
      if (v) u.voice = v;
      u.rate = (opt.rate || 0.92) * (this.slow ? 0.72 : 1);
      u.pitch = opt.pitch || 1;
      let done = false;
      Music.duck(true);
      const fin = () => { if (!done) { done = true; Music.duck(false); res(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1800 + text.length * 170 * (this.slow ? 1.5 : 1));
      speechSynthesis.speak(u);
    });
  },
  stop() { if (window.speechSynthesis) speechSynthesis.cancel(); }
};
if (window.speechSynthesis) { Voice.load(); speechSynthesis.onvoiceschanged = () => Voice.load(); }
function sayAs(who, text) { return Voice.say(text, (TOYS[who] || {}).voice || {}); }

/* ---------- 효과음 (파일 없이 브라우저에서 바로 만듦) ---------- */
const Sfx = {
  ctx: null, on: true,
  ac() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  tone(f, t0, dur, type = 'sine', vol = 0.18, slideTo) {
    const c = this.ac(); if (!c || !this.on) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  },
  noise(t0, dur, vol = 0.12, freq = 2500, q = 1) {
    const c = this.ac(); if (!c || !this.on) return;
    const len = Math.max(1, Math.floor(c.sampleRate * dur)), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime + t0;
    f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
    s.buffer = b; s.connect(f); f.connect(g); g.connect(c.destination); s.start(t);
  },
  /* 오르골 같은 맑은 종소리 */
  bell(f, t0, dur = 1, vol = 0.12) { this.tone(f, t0, dur, 'sine', vol); this.tone(f * 4.02, t0, dur * 0.3, 'sine', vol * 0.18); this.tone(f * 2.01, t0, dur * 0.5, 'triangle', vol * 0.12); },
  /* 태엽 감는 소리: 따르륵 딸깍딸깍 + 돌아가는 소리 + 띵 */
  windup(len = 1) {
    const n = Math.round(7 * len);
    for (let i = 0; i < n; i++) this.noise(i * 0.042, 0.018, 0.22, 3200 + (i % 2) * 700, 6);
    this.tone(220, 0.02, 0.32 * len, 'square', 0.025, 640);
    this.bell(1568, 0.3 * len + 0.04, 0.5, 0.09);
  },
  /* 자물쇠 잠기는 소리: 철컥 + 덜컹 + 짤랑 */
  lock() {
    this.noise(0, 0.035, 0.32, 1900, 12); this.tone(960, 0, 0.05, 'square', 0.04);
    this.noise(0.13, 0.08, 0.38, 520, 5); this.tone(150, 0.13, 0.22, 'sine', 0.32, 80);
    this.tone(2350, 0.24, 0.12, 'sine', 0.05); this.tone(2980, 0.29, 0.1, 'sine', 0.04);
  },
  play(n) {
    switch (n) {
      case 'click':  this.noise(0, 0.02, 0.25, 1800, 8); this.tone(1200, 0, 0.04, 'triangle', 0.05); break;   // 나무 똑딱
      case 'pick':   this.bell(1318, 0, 0.35, 0.08); this.bell(1760, 0.06, 0.4, 0.07); break;
      case 'pop':    this.noise(0, 0.03, 0.3, 1200, 6); this.tone(520, 0, 0.1, 'sine', 0.12, 780); break;            // 블록 딸깍
      case 'back':   this.noise(0, 0.03, 0.25, 900, 6); this.tone(600, 0, 0.1, 'sine', 0.1, 360); break;
      case 'box':    this.noise(0, 0.22, 0.12, 700, 2); this.noise(0.42, 0.05, 0.3, 500, 4); this.windup(0.6); break;   // 상자 닫고 태엽 살짝
      case 'room':   this.creak(); [587, 698, 880].forEach((f, i) => this.bell(f, 0.55 + i * 0.16, 0.8, 0.09)); break;
      case 'pen':    this.noise(0, 0.16, 0.09, 3800); break;
      case 'stamp':  this.tone(110, 0, 0.25, 'sine', 0.4, 55); this.noise(0, 0.12, 0.25, 400, 2); break;
      case 'windup': this.windup(1); break;
      case 'lock':   this.lock(); break;
      case 'fanfare': this.windup(1.6); [587, 740, 880, 1175, 880, 1175, 1480].forEach((f, i) => this.bell(f, 0.75 + i * 0.13, i === 6 ? 1.6 : 0.6, 0.1)); break;
      case 'sad':    [440, 415, 392, 370].forEach((f, i) => this.bell(f, i * 0.28, 0.7, 0.08)); break;
      case 'boom':   this.noise(0, 0.7, 0.35, 260, 1); this.tone(90, 0, 0.7, 'sawtooth', 0.1, 38); this.lock(); break;
    }
  },
  /* 삐걱 문 여는 소리 */
  creak() {
    const c = this.ac(); if (!c || !this.on) return;
    const o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain(), lfo = c.createOscillator(), lg = c.createGain(), t = c.currentTime;
    o.type = 'sawtooth'; o.frequency.setValueAtTime(140, t); o.frequency.linearRampToValueAtTime(230, t + 0.25); o.frequency.linearRampToValueAtTime(120, t + 0.55);
    lfo.frequency.value = 38; lg.gain.value = 25; lfo.connect(lg); lg.connect(o.frequency);
    f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 4;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.06, t + 0.05); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    o.connect(f); f.connect(g); g.connect(c.destination); o.start(t); lfo.start(t); o.stop(t + 0.65); lfo.stop(t + 0.65);
  }
};

/* ---------- 배경음악: 살짝 으스스한 오르골 왈츠 (D단조, 파일 없이 생성) ---------- */
const Music = {
  on: true, timer: null, gain: null, ducked: false, bar: 0, nextT: 0, loop: 0,
  BEAT: 0.42,
  // [박 위치, 음(MIDI), 길이(박)] — 8마디 3/4박자
  MEL: [
    [[0, 69, 1], [1, 74, 1], [2, 77, 1]],
    [[0, 76, 1.5], [1.5, 74, .5], [2, 73, 1]],
    [[0, 74, 1], [1, 79, 1], [2, 82, 1]],
    [[0, 81, 2], [2, 79, .5], [2.5, 76, .5]],
    [[0, 77, 1], [1, 76, .5], [1.5, 74, .5], [2, 69, 1]],
    [[0, 70, 1], [1, 74, 1], [2, 77, 1]],
    [[0, 76, 1], [1, 79, 1], [2, 73, 1]],
    [[0, 74, 2.5]]
  ],
  //       베이스, 화음(2·3박)
  HAR: [[50, [62, 65, 69]], [50, [62, 65, 69]], [43, [62, 67, 70]], [45, [61, 64, 67]],
        [50, [62, 65, 69]], [46, [62, 65, 70]], [43, [61, 64, 67]], [50, [62, 65, 69]]],
  hz: m => 440 * Math.pow(2, (m - 69) / 12),
  start() {
    if (!this.on || this.timer) return;
    const c = Sfx.ac(); if (!c) return;
    if (!this.gain) { this.gain = c.createGain(); this.gain.gain.value = 1.0; this.gain.connect(c.destination); }
    this.nextT = c.currentTime + 0.1;
    this.timer = setInterval(() => this.tick(), 120);
  },
  tick() {
    const c = Sfx.ctx; if (!c) return;
    while (this.nextT < c.currentTime + 0.5) {
      const b = this.bar % 8, t = this.nextT, B = this.BEAT, up = this.loop % 2 ? 12 : 0;
      this.MEL[b].forEach(([at, m, len]) => this.box(this.hz(m + up), t + at * B, Math.max(0.8, len * B * 2.2), up ? 0.05 : 0.07));
      const [bass, ch] = this.HAR[b];
      this.pluck(this.hz(bass), t, 0.09);
      [1, 2].forEach(k => ch.forEach(m => this.pluck(this.hz(m), t + k * B, 0.018)));
      if (b === 7) this.box(this.hz(98), t + 2 * B, 1.4, 0.02);          // 끝마디 높은 반짝
      this.nextT += 3 * B; this.bar++; if (this.bar % 8 === 0) this.loop++;
    }
  },
  out(o, g, t, dur) { o.connect(g); g.connect(this.gain); o.start(t); o.stop(t + dur + 0.05); },
  box(f, t, dur, v) {   // 오르골 음
    const c = Sfx.ctx;
    [[1, v, 'sine'], [4.02, v * 0.15, 'sine'], [2.01, v * 0.1, 'triangle']].forEach(([mul, vol, type]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f * mul;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (mul > 1 ? 0.35 : 1));
      this.out(o, g, t, dur);
    });
  },
  pluck(f, t, v) {      // 피치카토 베이스·화음
    const c = Sfx.ctx, o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    o.connect(fl); fl.connect(g); g.connect(this.gain); o.start(t); o.stop(t + 0.4);
  },
  stop() { clearInterval(this.timer); this.timer = null; },
  toggle() { this.on = !this.on; if (this.on) this.start(); else this.stop(); return this.on; },
  duck(d) { if (this.gain && Sfx.ctx) this.gain.gain.setTargetAtTime(d ? 0.25 : 1.0, Sfx.ctx.currentTime, 0.15); }
};
