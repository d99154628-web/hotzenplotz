/* =====================================================================
 *  설정: Apps Script 웹 앱 주소(…/exec)를 따옴표 안에 붙여 넣으세요.
 *  비워 두면 "데모 모드"로 동작합니다 (이 컴퓨터 브라우저 안에서만 저장).
 * ===================================================================== */
const API_URL = '';
/* ===================================================================== */

const DEMO = !API_URL;

/* ---------- 수업 내용 ---------- */
const PLANS = [
  { id: 'stay',  phrase: 'stay home',               ko: '집에 있기', koS: '나는 집에 있을 거야.',          emoji: '🏠', sub: '🛋️' },
  { id: 'math',  phrase: 'study math',              ko: '수학 공부하기', koS: '나는 수학을 공부할 거야.',      emoji: '📘', sub: '➗' },
  { id: 'clean', phrase: 'clean my room',           ko: '내 방 청소하기', koS: '나는 내 방을 청소할 거야.',     emoji: '🧹', sub: '🧺' },
  { id: 'camp',  phrase: 'go camping',              ko: '캠핑 가기', koS: '나는 캠핑을 갈 거야.',          emoji: '⛺', sub: '🔥' },
  { id: 'ball',  phrase: 'watch a basketball game', ko: '농구 경기 보기', koS: '나는 농구 경기를 볼 거야.',     emoji: '🏀', sub: '🎟️' },
  { id: 'grand', phrase: 'visit my grandparents',   ko: '조부모님 댁 방문하기', koS: '나는 조부모님 댁을 방문할 거야.', emoji: '👵', sub: '👴' }
];
const PLAN = Object.fromEntries(PLANS.map(p => [p.id, p]));

/* 교사 대시보드 열 (관문 순서대로) */
const ITEMS = [
  { qid: 'W-stay',  label: '🏠', group: '① 발자국', title: '듣고 고르기: stay home' },
  { qid: 'W-math',  label: '📘', group: '① 발자국', title: '듣고 고르기: study math' },
  { qid: 'W-clean', label: '🧹', group: '① 발자국', title: '듣고 고르기: clean my room' },
  { qid: 'W-camp',  label: '⛺', group: '① 발자국', title: '듣고 고르기: go camping' },
  { qid: 'W-ball',  label: '🏀', group: '① 발자국', title: '듣고 고르기: watch a basketball game' },
  { qid: 'W-grand', label: '👵', group: '① 발자국', title: '듣고 고르기: visit my grandparents' },
  { qid: 'S1-1',    label: '🎤1', group: '① 발자국', title: '말하기: I\'m going to ~ (1)' },
  { qid: 'S1-2',    label: '🎤2', group: '① 발자국', title: '말하기: I\'m going to ~ (2)' },
  { qid: 'F1', label: '1', group: '② 엿들은 대화', title: 'Tom의 계획' },
  { qid: 'F2', label: '2', group: '② 엿들은 대화', title: '하나가 갈 곳' },
  { qid: 'F3', label: '3', group: '② 엿들은 대화', title: '그곳에서 할 일' },
  { qid: 'F4', label: '4', group: '② 엿들은 대화', title: '질문 문장 완성(going)' },
  { qid: 'F5', label: '🎤', group: '② 엿들은 대화', title: '말하기: What are you going to do this weekend?' },
  { qid: 'M1', label: 'A', group: '③ 수상한 사람', title: '연결: study math' },
  { qid: 'M2', label: 'B', group: '③ 수상한 사람', title: '연결: clean my room' },
  { qid: 'M3', label: 'C', group: '③ 수상한 사람', title: '연결: go camping' },
  { qid: 'M4', label: 'D', group: '③ 수상한 사람', title: '연결: watch a basketball game' },
  { qid: 'P1-order', label: '순서', group: '④ 금고', title: 'Practice 1 들은 순서대로 카드 놓기' },
  { qid: 'P1-speak', label: '🎤', group: '④ 금고', title: '말하기: Practice 1 대답' },
  { qid: 'C1', label: 'O/X1', group: '⑥ Check It', title: 'clean my room 그림 (정답 O)' },
  { qid: 'C2', label: 'O/X2', group: '⑥ Check It', title: 'basketball 대화 vs 조부모님 그림 (정답 X)' }
];
const STAGE_NAMES = ['출발', '① 발자국', '② 엿들은 대화', '③ 수상한 사람', '④ 금고', '⑤ 네 갈래 동굴', '⑥ 레시피', '완료'];

/* ---------- 서버 통신 ---------- */
async function api(payload) {
  if (DEMO) return mockApi(payload);
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  return await res.json();
}

/* 기록은 줄을 세워 하나씩 보냅니다 (인터넷이 끊겨도 나중에 다시 보냄) */
const SendQueue = {
  key: 'hz_queue',
  busy: false,
  load() { try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch (e) { return []; } },
  save(q) { try { localStorage.setItem(this.key, JSON.stringify(q)); } catch (e) {} },
  push(p) { const q = this.load(); q.push(p); this.save(q); this.flush(); },
  async flush() {
    if (this.busy) return;
    this.busy = true;
    try {
      let q = this.load();
      while (q.length) {
        const r = await api(q[0]);
        if (!r || r.ok === false) throw new Error('send fail');
        q = this.load(); q.shift(); this.save(q);
      }
    } catch (e) {
      setTimeout(() => this.flush(), 4000);
    } finally { this.busy = false; }
  }
};

/* ---------- 데모 모드 (서버 없이 이 브라우저에서만) ---------- */
function mockDB() {
  let db = null;
  try { db = JSON.parse(localStorage.getItem('hz_mock') || 'null'); } catch (e) {}
  return db || { log: [], prog: {}, p1rows: [], p1: { round: 0, status: 'idle', cards: [], drawn: -1 } };
}
function mockSave(db) { localStorage.setItem('hz_mock', JSON.stringify(db)); }
function mockApi(p) {
  const db = mockDB();
  const okStr = v => v === 'skip' ? 'SKIP' : (v ? 'O' : 'X');
  const res = (() => {
    switch (p.action) {
      case 'state': return { ok: true, p1: db.p1 };
      case 'log':
        db.log.push([Number(p.num), Number(p.stage), p.qid, okStr(p.ok), p.tries || 1, p.hint ? 'Y' : '', p.said || '']);
        return { ok: true };
      case 'progress': {
        const s = db.prog[p.num] || { stage: 0, stars: '' };
        s.stage = Number(p.stage) || 0; s.updated = Date.now(); if (p.stars) s.stars = p.stars;
        db.prog[p.num] = s; return { ok: true };
      }
      case 'p1':
        db.p1rows.push([Number(p.round), Number(p.num), p.kind, Number(p.cave), okStr(p.ok), p.said || '']);
        return { ok: true };
      case 'dash':
        return {
          ok: true,
          dash: computeDash(db.log, Object.keys(db.prog).map(n => [Number(n), db.prog[n].stage, db.prog[n].updated, db.prog[n].stars]), db.p1rows, db.p1)
        };
      case 'p1new': {
        const ids = shuffle(PLANS.map(x => x.id));
        db.p1 = { round: db.p1.round + 1, status: 'choosing', cards: ids.slice(0, 4), drawn: -1, sid: db.p1.sid };
        return { ok: true, p1: db.p1 };
      }
      case 'p1draw':
        if (db.p1.status !== 'choosing') return { ok: false, error: '먼저 새 라운드를 시작하세요', p1: db.p1 };
        db.p1.drawn = Math.floor(Math.random() * 4); db.p1.status = 'revealed';
        return { ok: true, p1: db.p1 };
      case 'p1end': db.p1.status = 'ended'; return { ok: true, p1: db.p1 };
      case 'p1idle': db.p1.status = 'idle'; return { ok: true, p1: db.p1 };
      case 'reset': {
        const fresh = { log: [], prog: {}, p1rows: [], p1: { round: 0, status: 'idle', cards: [], drawn: -1, sid: String(Date.now()) } };
        mockSave(fresh); return { ok: true, p1: fresh.p1 };
      }
    }
    return { ok: true };
  })();
  if (p.action !== 'reset') mockSave(db);
  return Promise.resolve(JSON.parse(JSON.stringify(res)));
}

/* Code.gs 와 같은 집계 함수 */
function computeDash(logRows, progRows, p1Rows, p1) {
  const students = {}, items = {};
  progRows.forEach(r => {
    students[r[0]] = { stage: Number(r[1]), updated: Number(r[2]) || 0, stars: r[3] ? Number(r[3]) : 0 };
  });
  logRows.forEach(r => {
    const num = r[0], qid = r[2];
    items[num] = items[num] || {};
    const it = items[num][qid] || (items[num][qid] = { n: 0, ok: false, first: null, skip: false, hint: false, said: '' });
    it.n++;
    const ok = r[3] === 'O';
    if (it.n === 1) it.first = ok;
    if (ok) it.ok = true;
    if (r[3] === 'SKIP') it.skip = true;
    if (r[5] === 'Y') it.hint = true;
    if (r[6]) it.said = r[6];
  });
  const wrong = {};
  Object.keys(items).forEach(num => Object.keys(items[num]).forEach(q => {
    const it = items[num][q];
    if (it.first === false || it.skip) wrong[q] = (wrong[q] || 0) + 1;
  }));
  const cur = { choices: {}, asked: {}, caught: {} };
  const stars = {}, asks = {};
  p1Rows.forEach(r => {
    const round = Number(r[0]), num = r[1], kind = r[2], cave = Number(r[3]), ok = r[4] === 'O';
    if (kind === 'catch' && ok) stars[num] = (stars[num] || 0) + 1;
    if (kind === 'ask' && ok) asks[num] = (asks[num] || 0) + 1;
    if (round === Number(p1.round)) {
      if (kind === 'choice') cur.choices[num] = cave;
      if (kind === 'ask') cur.asked[num] = ok || cur.asked[num] || false;
      if (kind === 'catch') cur.caught[num] = ok || cur.caught[num] || false;
    }
  });
  return { students, items, wrong, p1, cur, stars, asks, now: Date.now() };
}

/* ---------- 유틸 ---------- */
function shuffle(a, seed) {
  a = a.slice();
  let s = seed || Math.floor(Math.random() * 1e9);
  const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor((seed ? rnd() : Math.random()) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function esc(s) { return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---------- 영어 음성 (크롬 내장 음성) ---------- */
const Voice = {
  list: [],
  slow: false,
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
      if (typeof Bgm !== 'undefined') Bgm.hold(true);
      const fin = () => { if (!done) { done = true; if (typeof Bgm !== 'undefined') Bgm.hold(false); res(); } };
      u.onend = fin; u.onerror = fin;
      setTimeout(fin, 1500 + text.length * 160 * (this.slow ? 1.5 : 1));
      speechSynthesis.speak(u);
    });
  },
  stop() { if (window.speechSynthesis) speechSynthesis.cancel(); }
};
if (window.speechSynthesis) { Voice.load(); speechSynthesis.onvoiceschanged = () => Voice.load(); }

/* 등장인물 목소리 */
const CAST = {
  Linh:  { kind: 'girl',  pitch: 1.25 },
  Tom:   { kind: 'boy',   pitch: 1.15 },
  Hana:  { kind: 'woman', pitch: 1.2 },
  Amy:   { kind: 'girl',  pitch: 1.2 },
  Uju:   { kind: 'boy',   pitch: 1.25 },
  Girl:  { kind: 'girl',  pitch: 1.15 },
  Boy:   { kind: 'boy',   pitch: 1.2 },
  Hotz:  { kind: 'man',   pitch: 0.55, rate: 0.85 },
  Man:   { kind: 'man',   pitch: 0.9 },
  Woman: { kind: 'woman', pitch: 1.0 }
};
function sayAs(who, text) { return Voice.say(text, CAST[who] || {}); }

/* ---------- 크롬 음성 인식 + 자동 채점 ---------- */
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
function listenOnce() {
  return new Promise((resolve, reject) => {
    const r = new SR();
    r.lang = 'en-US';
    r.interimResults = false;
    r.maxAlternatives = 5;
    let got = null;
    r.onresult = e => { got = Array.from(e.results[0]).map(a => a.transcript); };
    r.onerror = e => { if (e.error !== 'no-speech' && e.error !== 'aborted') reject(e.error); };
    r.onend = () => resolve(got || []);
    try { r.start(); } catch (e) { reject('start'); }
    setTimeout(() => { try { r.stop(); } catch (e) {} }, 9000);
  });
}
function normWords(s) {
  s = ' ' + String(s).toLowerCase().replace(/[’`]/g, "'") + ' ';
  s = s.replace(/\bi'm\b/g, 'i am').replace(/\bwe're\b/g, 'we are').replace(/\bthat's\b/g, 'that is')
       .replace(/\bwhat're\b/g, 'what are').replace(/\bgonna\b/g, 'going to').replace(/\bmaths\b/g, 'math')
       .replace(/\bgrandparent'?s\b/g, 'grandparents').replace(/\bbasket ball\b/g, 'basketball')
       .replace(/\bweek end\b/g, 'weekend');
  return s.replace(/[^a-z\s]/g, ' ').split(/\s+/).filter(Boolean);
}
function lcsLen(a, b) {
  const dp = Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev + 1 : Math.max(dp[j], dp[j - 1]);
      prev = tmp;
    }
  }
  return dp[b.length];
}
/* 목표 문장 단어를 순서대로 몇 % 말했는지 (0~1) */
function speechScore(target, alts) {
  const t = normWords(target);
  let best = 0, said = alts[0] || '';
  alts.forEach(a => {
    const w = normWords(a);
    const sc = lcsLen(t, w) / t.length;
    if (sc > best) { best = sc; said = a; }
  });
  return { score: best, said };
}
const PASS_SCORE = 0.8;


/* =====================================================================
 *  효과음 · 배경음악
 *  - 단순한 효과음은 파일 없이 브라우저가 직접 만들어 냅니다 (Web Audio).
 *  - 선생님이 만든 파일은 assets/sfx/ 폴더에 올리면 자동으로 쓰입니다.
 *    sfx_thief_laugh.mp3, sfx_unlock.mp3, sfx_envelope.mp3, bgm_orchard.mp3, bgm_cave.mp3
 *    (파일이 없으면 대신 만든 소리가 나거나 조용히 넘어갑니다)
 * ===================================================================== */
const ASSET_SFX = 'assets/sfx/';
const Sfx = {
  ctx: null,
  on: true,
  missing: {},
  ac() {
    if (!this.ctx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; this.ctx = new C(); }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },
  tone(freq, start, dur, o = {}) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime + start, vol = o.vol ?? 0.2;
    const osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.slideTo) osc.frequency.exponentialRampToValueAtTime(o.slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + (o.attack || 0.006));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(c.destination);
    osc.start(t); osc.stop(t + dur + 0.05);
  },
  noise(start, dur, o = {}) {
    const c = this.ac(); if (!c) return;
    const t = c.currentTime + start;
    if (!this._nb) {
      this._nb = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = this._nb.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    const src = c.createBufferSource(); src.buffer = this._nb;
    const f = c.createBiquadFilter(); f.type = o.type || 'bandpass'; f.frequency.value = o.freq || 1500; f.Q.value = o.q || 1;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(o.vol ?? 0.2, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g).connect(c.destination);
    src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.05);
  },
  /* 선생님이 만든 파일을 재생, 없으면 대체 소리 */
  file(name, fallback, vol = 0.85) {
    if (this.missing[name]) { fallback && fallback(); return; }
    const a = new Audio(ASSET_SFX + name);
    a.volume = vol;
    a.play().catch(() => { this.missing[name] = true; fallback && fallback(); });
  },
  play(name) { if (this.on && this.lib[name]) { try { this.lib[name].call(this); } catch (e) {} } },
  lib: {
    click() { this.tone(880, 0, 0.05, { type: 'triangle', vol: 0.12 }); },
    correct() { this.tone(1047, 0, 0.18, { type: 'triangle', vol: 0.22 }); this.tone(1568, 0.1, 0.4, { type: 'triangle', vol: 0.22 }); this.tone(3136, 0.12, 0.3, { vol: 0.05 }); },
    wrong() { this.tone(330, 0, 0.38, { type: 'sine', slideTo: 150, vol: 0.22 }); this.tone(165, 0.02, 0.3, { type: 'triangle', vol: 0.08, slideTo: 90 }); },
    footstep() { [0, 0.26, 0.52].forEach(s => { this.noise(s, 0.13, { type: 'lowpass', freq: 500, vol: 0.4 }); this.tone(130, s, 0.11, { vol: 0.18, slideTo: 70 }); }); },
    micOn() { this.tone(520, 0, 0.13, { slideTo: 1150, vol: 0.18 }); },
    pass() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, i * 0.07, 0.32, { type: 'triangle', vol: 0.18 })); },
    clue() { this.noise(0, 0.45, { type: 'highpass', freq: 2500, vol: 0.07 }); [1568, 2093, 2637, 3136].forEach((f, i) => this.tone(f, 0.3 + i * 0.07, 0.45, { vol: 0.07 })); },
    letter() { [2349, 2794, 3136, 2794, 3520].forEach((f, i) => this.tone(f, i * 0.055, 0.22, { type: 'square', vol: 0.035 })); },
    drumroll() {
      for (let i = 0; i < 26; i++) this.noise(i * 0.065, 0.055, { freq: 1800, q: 0.7, vol: 0.08 + i * 0.006 });
      this.noise(1.72, 0.7, { type: 'highpass', freq: 5000, vol: 0.14 });
      this.tone(110, 1.72, 0.3, { vol: 0.25, slideTo: 60 });
    },
    catch() {
      this.noise(0, 0.32, { freq: 900, q: 0.5, vol: 0.14 });
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => this.tone(f, 0.3 + i * 0.11, i === 5 ? 0.6 : 0.22, { type: 'square', vol: 0.05 }));
    },
    finale() {
      [[523, 659, 784], [587, 740, 880], [659, 831, 988], [784, 988, 1175, 1568]].forEach((ch, i) =>
        ch.forEach(f => this.tone(f, i * 0.22, i === 3 ? 1.2 : 0.25, { type: 'triangle', vol: 0.09 })));
      [0, 0.2, 0.4, 0.6, 0.8].forEach(s => this.tone(2637, 0.66 + s, 0.4, { vol: 0.04 }));
    },
    /* ↓ 파일이 있으면 파일, 없으면 대체 소리 */
    unlock() {
      this.file('sfx_unlock.mp3', () => {
        this.tone(200, 0, 0.08, { type: 'square', vol: 0.12 });
        this.noise(0.12, 0.07, { freq: 2600, vol: 0.25 });
        this.noise(0.3, 0.09, { freq: 1800, vol: 0.3 });
        this.tone(1319, 0.45, 0.35, { type: 'triangle', vol: 0.15 });
      });
    },
    envelope() { this.file('sfx_envelope.mp3', () => { this.noise(0, 0.25, { freq: 3800, q: 0.6, vol: 0.12 }); this.noise(0.28, 0.35, { freq: 2800, q: 0.4, vol: 0.18 }); }); },
    laugh() { this.file('sfx_thief_laugh.mp3', null); }
  }
};

const Bgm = {
  el: null, cur: '', vol: 0.13, holds: 0,
  on: (() => { try { return localStorage.getItem('hz_bgm') !== 'off'; } catch (e) { return true; } })(),
  target() { return this.holds > 0 ? 0.015 : this.vol; },
  play(name) {
    this.cur = name;
    if (!this.on || Sfx.missing[name]) return;
    if (this.el && this.el.dataset.n === name) { if (this.el.paused) this.el.play().catch(() => {}); return; }
    if (this.el) this.el.pause();
    const a = new Audio(ASSET_SFX + name);
    a.loop = true; a.volume = this.target(); a.dataset.n = name;
    a.onerror = () => { Sfx.missing[name] = true; if (this.el === a) this.el = null; };
    this.el = a;
    a.play().catch(() => {});
  },
  resume() { if (this.on && this.el && this.el.paused) this.el.play().catch(() => {}); else if (this.on && !this.el && this.cur) this.play(this.cur); },
  hold(on) { this.holds = Math.max(0, this.holds + (on ? 1 : -1)); if (this.el) this.el.volume = this.target(); },
  toggle() {
    this.on = !this.on;
    try { localStorage.setItem('hz_bgm', this.on ? 'on' : 'off'); } catch (e) {}
    if (this.on) this.play(this.cur); else if (this.el) this.el.pause();
    return this.on;
  }
};
