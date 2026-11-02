/* =====================================================================
 *  투호 챔피언십 — 학생 화면·교사 화면 공통
 *  6학년 영어 Lesson 11 2차시 (교과서 152~153쪽)
 *  API_URL: Apps Script 웹 앱 주소(…/exec)
 * ===================================================================== */
const API_URL = 'https://script.google.com/macros/s/AKfycbyHAVLFgjCd9cQwwU0aGyKH0jNv-FKJ2evbWdf9e8_LaHRX0R6O3Kjt5siS5VVGNSg8Hw/exec';
/* 주소 끝에 ?demo 를 붙이면 서버 없이 이 브라우저 안에서만 돌아가는 연습 모드 */
const DEMO = !API_URL || /[?&]demo\b/.test(location.search);
const LS = DEMO ? 'tuho26demo.' : 'tuho26.';

const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const lsGet = k => { try { return localStorage.getItem(LS + k); } catch (e) { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(LS + k, v); } catch (e) {} };
const lsDel = k => { try { localStorage.removeItem(LS + k); } catch (e) {} };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* 모둠 색: 오방색에서 가져옴 */
const TEAMC = ['#c8402f', '#2f62a8', '#d79a1c', '#2f8a5a', '#7a4fa3', '#d0662b', '#b4466f', '#2f8f99'];
const TEAMI = ['🏮', '🪭', '🌕', '🎋', '🦋', '🔥', '🌸', '🌊'];

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
  busy: false,
  load() { try { return JSON.parse(lsGet('queue') || '[]'); } catch (e) { return []; } },
  save(q) { lsSet('queue', JSON.stringify(q)); },
  push(p) { const q = this.load(); q.push(p); this.save(q); this.flush(); },
  size() { return this.load().length; },
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

/* =====================================================================
 *  물건 그림 (직접 그린 SVG)
 * ===================================================================== */
const ART = {
  tuho: `<svg viewBox="0 0 120 120"><g stroke="#3b2414" stroke-width="2.4" stroke-linecap="round">
    <line x1="52" y1="40" x2="40" y2="6"/><line x1="60" y1="40" x2="62" y2="4"/><line x1="68" y1="40" x2="82" y2="8"/></g>
    <g fill="#c8402f"><path d="M40 6 l-5 -3 l2 7z"/><path d="M62 4 l-4 -4 l0 8z" fill="#2f62a8"/><path d="M82 8 l3 -5 l-7 2z" fill="#d79a1c"/></g>
    <path d="M44 38 h32 l-3 10 c22 8 30 26 26 44 c-4 16 -16 22 -39 22 c-23 0 -35 -6 -39 -22 c-4 -18 4 -36 26 -44z" fill="#8a4b2a" stroke="#3b2414" stroke-width="2.4"/>
    <ellipse cx="60" cy="38" rx="17" ry="5" fill="#2a170c"/>
    <path d="M30 46 c-10 -2 -12 8 -4 10" fill="none" stroke="#3b2414" stroke-width="5"/><path d="M90 46 c10 -2 12 8 4 10" fill="none" stroke="#3b2414" stroke-width="5"/>
    <path d="M28 82 q32 10 64 0" fill="none" stroke="#e7c27a" stroke-width="3" stroke-dasharray="6 5"/>
    <path d="M36 70 q24 -8 48 0" fill="none" stroke="#c98a55" stroke-width="2"/></svg>`,
  yakgwa: `<svg viewBox="0 0 120 120"><g transform="translate(60 62)">
    <path d="${(() => { let d = ''; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, b = (i + .5) / 12 * Math.PI * 2; d += `${i ? 'L' : 'M'}${(Math.cos(a) * 46).toFixed(1)} ${(Math.sin(a) * 46).toFixed(1)} Q${(Math.cos(b) * 56).toFixed(1)} ${(Math.sin(b) * 56).toFixed(1)} `; } return d + 'Z'; })()}" fill="#b5651d" stroke="#5a2e0c" stroke-width="2.5"/>
    <circle r="38" fill="#c97a2a"/><circle r="30" fill="none" stroke="#8a4512" stroke-width="2" stroke-dasharray="3 4"/>
    ${[0, 1, 2, 3, 4, 5].map(i => { const a = i / 6 * Math.PI * 2; return `<ellipse cx="${(Math.cos(a) * 18).toFixed(1)}" cy="${(Math.sin(a) * 18).toFixed(1)}" rx="6" ry="3.4" transform="rotate(${i * 60} ${(Math.cos(a) * 18).toFixed(1)} ${(Math.sin(a) * 18).toFixed(1)})" fill="#9c5414"/>`; }).join('')}
    <circle r="7" fill="#f1dca8" stroke="#8a4512" stroke-width="1.5"/>
    <path d="M-30 -20 q8 -10 20 -14" stroke="#f3c47a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/></g></svg>`,
  nonla: `<svg viewBox="0 0 120 120"><path d="M60 14 L108 82 Q60 98 12 82 Z" fill="#e6c27a" stroke="#6b4a1a" stroke-width="2.5" stroke-linejoin="round"/>
    ${[0, 1, 2, 3, 4].map(i => `<path d="M${22 + i * 2} ${76 - i * 12} Q60 ${88 - i * 13} ${98 - i * 2} ${76 - i * 12}" fill="none" stroke="#b58a3e" stroke-width="1.6"/>`).join('')}
    <path d="M60 14 L60 90" stroke="#c9a056" stroke-width="1.2"/>
    <path d="M30 86 Q38 108 56 112 Q70 113 86 88" fill="none" stroke="#c8402f" stroke-width="4" stroke-linecap="round"/>
    <path d="M52 110 l-6 8 M58 112 l2 8" stroke="#c8402f" stroke-width="3" stroke-linecap="round"/></svg>`,
  djembe: `<svg viewBox="0 0 120 120">${[[34, 0], [84, 8]].map(([x, dy]) => `<g transform="translate(${x} ${dy})">
    <ellipse cx="0" cy="18" rx="24" ry="7" fill="#f2e2c2" stroke="#4a2a12" stroke-width="2.2"/>
    <path d="M-24 18 C-24 46 -8 52 -8 64 L-14 104 H14 L8 64 C8 52 24 46 24 18" fill="#9b4f22" stroke="#4a2a12" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M-20 26 L-6 60 M-10 28 L0 60 M0 28 L6 60 M10 28 L2 60 M20 26 L-2 60" stroke="#e4c88e" stroke-width="1.4"/>
    <path d="M-12 82 h24 M-13 92 h26" stroke="#d79a1c" stroke-width="3"/>
    <path d="M-23 22 q23 10 46 0" fill="none" stroke="#4a2a12" stroke-width="2"/></g>`).join('')}</svg>`,
  sari: `<svg viewBox="0 0 120 120"><circle cx="60" cy="16" r="10" fill="#7a4a2a"/>
    <path d="M48 28 h24 l6 22 l-6 6 l10 56 H38 l10 -56 l-6 -6z" fill="#e0457b" stroke="#7a1f42" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="M70 28 Q90 40 86 70 Q84 88 92 110" fill="none" stroke="#f2b33d" stroke-width="10" stroke-linecap="round"/>
    <path d="M70 28 Q90 40 86 70 Q84 88 92 110" fill="none" stroke="#c8402f" stroke-width="3" stroke-dasharray="4 4"/>
    <path d="M40 100 H82" stroke="#f2b33d" stroke-width="5"/><path d="M44 72 Q60 66 76 72 M42 86 Q60 80 80 86" fill="none" stroke="#f7a7c3" stroke-width="2"/></svg>`,
  boomerang: `<svg viewBox="0 0 120 120">${[[0, '#c8402f', '#f2b33d'], [1, '#d0662b', '#2f8a5a']].map(([k, c1, c2]) => `<g transform="translate(${k ? 62 : 6} ${k ? 50 : 14}) rotate(${k ? 20 : -10} 26 26)">
    <path d="M4 50 Q8 10 50 4 Q30 16 20 54 Q12 58 4 50Z" fill="${c1}" stroke="#4a2410" stroke-width="2.2" stroke-linejoin="round"/>
    ${[[12, 42], [16, 30], [24, 20], [34, 12], [42, 8]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="${c2}"/>`).join('')}</g>`).join('')}</svg>`,
  jegi: `<svg viewBox="0 0 120 120"><g stroke-linecap="round">${[-50, -30, -12, 0, 12, 30, 50].map((a, i) => `<path d="M60 74 Q${60 + Math.sin(a * Math.PI / 180) * 30} ${44 - Math.abs(a) / 6} ${60 + Math.sin(a * Math.PI / 180) * 44} ${18 + Math.abs(a) / 3}" stroke="${['#2f8a5a', '#d79a1c', '#c8402f', '#2f62a8', '#c8402f', '#d79a1c', '#2f8a5a'][i]}" stroke-width="6" fill="none"/>`).join('')}</g>
    <ellipse cx="60" cy="82" rx="18" ry="10" fill="#d8d0c0" stroke="#5a4a3a" stroke-width="2.2"/><circle cx="60" cy="80" r="4" fill="#5a4a3a"/></svg>`,
  umbrella: `<svg viewBox="0 0 120 120"><path d="M14 58 Q60 0 106 58 Q95 50 83 58 Q72 50 60 58 Q48 50 37 58 Q26 50 14 58Z" fill="#2f62a8" stroke="#1d3d6b" stroke-width="2.2"/>
    <path d="M60 58 V98 Q60 108 50 106" fill="none" stroke="#4a3a2a" stroke-width="4" stroke-linecap="round"/><path d="M60 14 V6" stroke="#4a3a2a" stroke-width="3"/>
    ${[30, 50, 76, 92].map((x, i) => `<path d="M${x} ${78 + i % 2 * 10} l-3 7" stroke="#6fa8dc" stroke-width="3" stroke-linecap="round"/>`).join('')}</svg>`,
  hands: `<svg viewBox="0 0 120 120"><ellipse cx="60" cy="86" rx="40" ry="11" fill="#f2e2c2" stroke="#4a2a12" stroke-width="2.2"/>
    <path d="M28 40 q-6 -14 4 -18 q6 -2 10 8 l6 22 q4 -8 10 -4 q4 4 0 12 l-6 16 h-18z" fill="#f0c49a" stroke="#7a4a2a" stroke-width="2"/>
    <path d="M92 40 q6 -14 -4 -18 q-6 -2 -10 8 l-6 22 q-4 -8 -10 -4 q-4 4 0 12 l6 16 h18z" fill="#f0c49a" stroke="#7a4a2a" stroke-width="2"/>
    <path d="M44 92 l-4 8 M76 92 l4 8 M60 98 v8" stroke="#d79a1c" stroke-width="3" stroke-linecap="round"/></svg>`,
  ques: `<svg viewBox="0 0 120 120"><circle cx="60" cy="72" r="30" fill="#f6d8b8" stroke="#7a4a2a" stroke-width="2.4"/>
    <circle cx="50" cy="70" r="3.4" fill="#3b2414"/><circle cx="70" cy="70" r="3.4" fill="#3b2414"/><path d="M52 86 q8 -5 16 0" fill="none" stroke="#3b2414" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M30 60 q2 -26 30 -26 q28 0 30 26 q-14 -10 -30 -8 q-16 -2 -30 8z" fill="#3b2414"/>
    <text x="88" y="34" font-size="36" font-family="Jua,sans-serif" fill="#c8402f">?</text><text x="20" y="30" font-size="22" font-family="Jua,sans-serif" fill="#2f62a8">?</text></svg>`
};
/* Flow로 만든 그림 파일로 바꿔 끼움 (파일이 없으면 위의 SVG 그림을 씀) */
const PIC = k => `<img src="img/${k}.webp" alt="" decoding="async" draggable="false">`;
Object.assign(ART, { tuho: PIC('item_tuho'), yakgwa: PIC('item_yakgwa'), nonla: PIC('item_nonla'), djembe: PIC('item_djembe'),
  sari: PIC('item_sari'), boomerang: PIC('item_boomerang'), jegi: PIC('item_jegi'), umbrella: PIC('item_umbrella'),
  hands: PIC('item_hands'), ques: PIC('item_question'), mascot: PIC('mascot'), happy: PIC('mascot_happy'), oops: PIC('mascot_oops'),
  trophy: PIC('trophy'), lantern: PIC('lantern'), stamp: PIC('stamp') });
const artBox = (k, cls) => `<div class="art ${cls || ''}" aria-hidden="true">${ART[k] || ''}</div>`;

/* =====================================================================
 *  축제 부스 6곳 & 문제 24개 (교과서 150~153쪽 Fun Talk 1·2, Talk Like This, Practice 2)
 *  t: pick(보기 고르기) · order(순서 맞추기)
 *  art: 문제 그림, say: 읽어 줄 영어, auto: 들어가자마자 읽어 주기
 *  en: 영어 지문(줄바꿈 \n), c: 보기, cart: 보기를 그림으로, a: 정답 번호
 *  lines: 순서 맞추기 (정답 순서대로 적음)
 *  why: 틀렸을 때 보여 줄 짧은 도움말
 * ===================================================================== */
const BOOTHS = [
  { id: 'tuho', flag: '🇰🇷', place: '한국 놀이 마당', host: '우주', item: 'Tuho', art: 'tuho', color: '#c8402f',
    hello: ['Do you know anything about Tuho?', "It's a Korean game. Throw the arrows into the jar!"],
    helloKr: '우주가 투호 놀이 마당에서 기다리고 있어요. 화살을 항아리에 던지는 한국의 놀이예요.' },
  { id: 'yakgwa', flag: '🇰🇷', place: '한국 간식 부스', host: '민우', item: 'yakgwa', art: 'yakgwa', color: '#b5651d',
    hello: ["What's this? It's yakgwa.", 'Do you know anything about yakgwa?'],
    helloKr: '민우가 꿀과 기름으로 만든 한국 과자, 약과를 나눠 주고 있어요.' },
  { id: 'nonla', flag: '🇻🇳', place: '베트남 부스', host: 'Linh', item: 'nón lá', art: 'nonla', color: '#c99a3a',
    hello: ['Do you know anything about nón lá?', "It's a Vietnamese hat."],
    helloKr: 'Linh이 베트남의 모자 논라를 쓰고 반갑게 손을 흔들어요.' },
  { id: 'djembe', flag: '🌍', place: '아프리카 부스', host: 'Amy와 Tom', item: 'djembes', art: 'djembe', color: '#9b4f22',
    hello: ['These are djembes.', 'Do you know anything about djembes?'],
    helloKr: 'Amy와 Tom이 둥둥둥, 아프리카의 북 젬베를 두드리고 있어요.' },
  { id: 'sari', flag: '🇮🇳', place: '인도 부스', host: '나리', item: 'saris', art: 'sari', color: '#e0457b',
    hello: ['This is a sari.', 'Do you know anything about saris?'],
    helloKr: '나리가 알록달록한 인도의 옷 사리를 보여 주고 있어요.' },
  { id: 'boomerang', flag: '🇦🇺', place: '호주 부스', host: 'Jacob', item: 'boomerangs', art: 'boomerang', color: '#d0662b',
    hello: ['Do you know anything about boomerangs?', "They're Australian toys. Throw one and it comes back!"],
    helloKr: '마지막 부스! Jacob이 던지면 다시 돌아오는 호주의 장난감, 부메랑을 들고 있어요.' }
];

const Q = [
  /* ① 투호 — 한국 놀이 마당 (Fun Talk 1) */
  { b: 0, t: 'pick', art: 'tuho', say: ['Do you know anything about Tuho?'], auto: 1,
    q: '우주가 물어요. 그림을 보고 "알아!"라고 알맞게 대답해요.', c: ["Yes, I do. It's a Korean game.", "Yes, I do. It's a Korean cookie.", "Yes, I do. They're African drums."], a: 0,
    why: '투호는 한국의 놀이(Korean game)예요.' },
  { b: 0, t: 'pick', q: '빈칸에 알맞은 말을 골라 질문을 완성해요.', en: 'Do you ____ anything about Tuho?', c: ['know', 'like', 'have'], a: 0,
    why: '"~에 대해 알고 있니?"는 Do you know anything about ~? 이에요.' },
  { b: 0, t: 'pick', art: 'ques', q: 'Amy는 투호를 처음 봤어요. Amy가 할 말로 알맞은 것은?', en: "Uju: It's Tuho. Do you know anything about Tuho?\nAmy: ____ What's Tuho?", c: ["No, I don't.", 'Yes, I do.', "That's right."], a: 0,
    why: '모를 때는 No, I don\'t. 라고 말해요.' },
  { b: 0, t: 'pick', art: 'jegi', say: ['Do you know anything about jegichagi?', "Yes, I do. It's a Korean game."], auto: 1,
    q: '하나와 Tom의 대화를 듣고, Tom이 한 대답의 뜻을 골라요.', c: ['응, 알아. 한국의 놀이야.', '아니, 몰라.', '응, 알아. 한국의 과자야.'], a: 0,
    why: "Yes, I do. = 응, 알아. / It's a Korean game. = 한국의 놀이야." },

  /* ② 약과 — 한국 간식 부스 (Talk Like This ①) */
  { b: 1, t: 'pick', say: ['Do you know anything about yakgwa?'], auto: 1,
    q: '잘 듣고, 무엇에 대해 물었는지 그림을 골라요.', cart: ['yakgwa', 'nonla', 'boomerang'], c: ['yakgwa', 'nón lá', 'boomerangs'], a: 0,
    why: 'yakgwa(약과)에 대해 물었어요.' },
  { b: 1, t: 'pick', art: 'yakgwa', q: 'Olivia는 약과를 몰라요. 민우가 알려 줄 말은?', en: "Minu: Do you know anything about yakgwa?\nOlivia: No, I don't.\nMinu: ____", c: ["It's a Korean cookie.", "It's a Korean game.", "They're Indian dresses."], a: 0,
    why: '약과는 한국의 과자(Korean cookie)예요.' },
  { b: 1, t: 'pick', say: ["No, I don't."], q: '이 말의 뜻으로 알맞은 것은?', en: "No, I don't.", c: ['아니, 몰라.', '응, 알아.', '고마워.'], a: 0,
    why: "No, I don't. 는 '아니, 몰라.'라는 뜻이에요." },
  { b: 1, t: 'order', q: '대화가 되도록 차례대로 눌러요.', lines: ['Do you know anything about yakgwa?', "No, I don't.", "It's a Korean cookie."],
    why: '질문 → 모른다는 대답 → 알려 주기 순서예요.' },

  /* ③ 논라 — 베트남 부스 (Fun Talk 2 Scene 1·2) */
  { b: 2, t: 'pick', art: 'nonla', say: ['Do you know anything about nón lá?'], auto: 1,
    q: 'Linh이 물어요. 그림을 보고 "알아!"라고 알맞게 대답해요.', c: ["Yes, I do. It's a Vietnamese hat.", "Yes, I do. They're Indian dresses.", "Yes, I do. It's a Korean cookie."], a: 0,
    why: '논라는 베트남의 모자(Vietnamese hat)예요.' },
  { b: 2, t: 'pick', art: 'umbrella', say: ['We wear this on sunny and rainy days.', "It's like an umbrella."], auto: 1,
    q: 'Linh의 말을 듣고, 논라는 무엇과 비슷하다고 했는지 골라요.', en: "We wear this on sunny and rainy days.\nIt's like an ____.", c: ['umbrella (우산)', 'cookie (과자)', 'drum (북)'], a: 0,
    why: '맑은 날에도 비 오는 날에도 쓰니까 우산(umbrella) 같다고 했어요.' },
  { b: 2, t: 'pick', art: 'nonla', q: '그림을 보고 빈칸에 알맞은 낱말을 골라요.', en: "It's a Vietnamese ____.", c: ['hat', 'game', 'cookie'], a: 0,
    why: '논라는 모자(hat)예요.' },
  { b: 2, t: 'pick', art: 'ques', q: 'Tom은 논라에 대해 전혀 몰라요. Tom이 할 말로 알맞은 것은?', en: 'Linh: Do you know anything about nón lá?\nTom: ____', c: ['I have no idea.', "Yes, I do. It's a Vietnamese hat.", 'Wow! You look good!'], a: 0,
    why: "전혀 모를 때는 I have no idea. 라고 말해요." },

  /* ④ 젬베 — 아프리카 부스 (Fun Talk 2 Scene 3·4) */
  { b: 3, t: 'pick', say: ['Do you know anything about djembes?', "Yes, I do. They're African drums."], auto: 1,
    q: '잘 듣고, 무엇에 대한 대화인지 그림을 골라요.', cart: ['sari', 'djembe', 'tuho'], c: ['saris', 'djembes', 'Tuho'], a: 1,
    why: 'djembes(젬베)는 아프리카의 북이에요.' },
  { b: 3, t: 'pick', art: 'ques', q: 'Linh은 젬베를 처음 봐서 전혀 몰라요. 알맞은 말은?', en: 'Tom: Do you know anything about djembes?\nLinh: ____', c: ['I have no idea.', 'Of course!', "Yes, I do. They're African drums."], a: 0,
    why: 'Fun Talk 2에서 Linh은 I have no idea. 라고 했어요.' },
  { b: 3, t: 'pick', art: 'djembe', q: '젬베는 여러 개예요(djembes). 빈칸에 알맞은 말은?', en: 'Djembes? ____ African drums.', c: ["They're", "It's", "I'm"], a: 0,
    why: "여러 개(djembes)를 말할 때는 They're 를 써요." },
  { b: 3, t: 'pick', art: 'hands', say: ['Hit it with your hands.'], auto: 1,
    q: 'Tom이 젬베 치는 방법을 알려 줘요. 뜻으로 알맞은 것은?', en: 'Hit it with your hands.', c: ['손으로 두드려 봐.', '발로 차 봐.', '머리에 써 봐.'], a: 0,
    why: 'hit = 치다, 두드리다 / with your hands = 손으로' },

  /* ⑤ 사리 — 인도 부스 (Talk Like This ②) */
  { b: 4, t: 'pick', art: 'sari', say: ['Do you know anything about saris?'], auto: 1,
    q: '나리가 물어요. 그림을 보고 "알아!"라고 알맞게 대답해요.', c: ["Yes, I do. They're Indian dresses.", "Yes, I do. They're African drums.", "Yes, I do. It's a Korean game."], a: 0,
    why: '사리는 인도의 옷(Indian dresses)이에요.' },
  { b: 4, t: 'pick', say: ['I have no idea.'], q: '이 말의 뜻으로 알맞은 것은?', en: 'I have no idea.', c: ['전혀 모르겠어.', '좋은 생각이야.', '나는 알고 있어.'], a: 0,
    why: "I have no idea. = 전혀 모르겠어." },
  { b: 4, t: 'order', q: '나리와 Jesse의 대화가 되도록 차례대로 눌러요.', lines: ['This is a sari. Do you know anything about saris?', 'I have no idea.', "They're Indian dresses."],
    why: '보여 주며 묻기 → 모른다고 말하기 → 알려 주기 순서예요.' },
  { b: 4, t: 'pick', say: ['Do you know anything about saris?', "No, I don't."], auto: 1,
    q: '잘 듣고 골라요. 대답한 친구는 사리를 알고 있을까요?', c: ['몰라요', '알아요'], a: 0,
    why: "No, I don't. 라고 했으니 몰라요." },

  /* ⑥ 부메랑 — 호주 부스 (Practice 2) */
  { b: 5, t: 'pick', art: 'boomerang', say: ['Do you know anything about boomerangs?'], auto: 1,
    q: 'Jacob이 물어요. 그림을 보고 "알아!"라고 알맞게 대답해요.', c: ["Yes, I do. They're Australian toys.", "Yes, I do. It's a Vietnamese hat.", "Yes, I do. They're Indian dresses."], a: 0,
    why: '부메랑은 호주의 장난감(Australian toys)이에요.' },
  { b: 5, t: 'pick', q: '부메랑에 대해 알고 있는지 묻는 문장으로 바른 것은?', c: ['Do you know anything about boomerangs?', 'Do you anything know about boomerangs?', 'You know do anything about boomerangs?'], a: 0,
    why: 'Do you know + anything about + 물건? 순서예요.' },
  { b: 5, t: 'pick', q: '물건과 설명이 바르게 짝 지어진 것은?', c: ['Tuho – a Korean game', 'yakgwa – African drums', 'saris – a Vietnamese hat'], a: 0,
    why: '약과 = Korean cookie, 사리 = Indian dresses 예요.' },
  { b: 5, t: 'pick', art: 'tuho', say: ['Now, do you know anything about Tuho?'], auto: 1,
    q: '축제를 다 돌았어요! 이제 투호를 아는 친구가 할 대답은?', c: ["Yes, I do. It's a Korean game.", 'I have no idea.', "No, I don't."], a: 0,
    why: '이제 알고 있으니 Yes, I do. 로 대답해요.' }
];
const QN = (i) => `${i + 1}. ${BOOTHS[Q[i].b].place}`;

/* ---------- 영어 읽어 주기 ---------- */
let VOICES = [];
function loadVoices() { try { VOICES = speechSynthesis.getVoices().filter(v => /^en[-_]/i.test(v.lang)); } catch (e) { VOICES = []; } }
try { loadVoices(); speechSynthesis.addEventListener('voiceschanged', loadVoices); } catch (e) {}
function voiceScore(v) {
  let s = 0; const n = v.name;
  if (/natural|neural/i.test(n)) s += 60; if (/online/i.test(n)) s += 30; if (/google/i.test(n)) s += 45;
  if (/aria|jenny|guy|ava|andrew|emma|samantha|allison|michelle/i.test(n)) s += 20;
  if (/en[-_]US/i.test(v.lang)) s += 12; else if (/en[-_](GB|AU|CA)/i.test(v.lang)) s += 6;
  if (/compact|espeak/i.test(n)) s -= 15; return s;
}
function pickVoice() { return VOICES.slice().sort((a, b) => voiceScore(b) - voiceScore(a))[0] || null; }
function say(lines, onEnd) {
  try {
    speechSynthesis.cancel(); const v = pickVoice();
    const L = (Array.isArray(lines) ? lines : [lines]).map(x => x.replace(/^[A-Za-z]+:\s*/, '').replace(/_{2,}/g, '').trim()).filter(Boolean);
    L.forEach((t, i) => {
      const u = new SpeechSynthesisUtterance(t.replace(/nón lá/gi, 'non la'));
      u.lang = v ? v.lang : 'en-US'; if (v) u.voice = v; u.rate = .85;
      if (i === L.length - 1 && onEnd) u.onend = onEnd;
      speechSynthesis.speak(u);
    });
  } catch (e) {}
}

/* ---------- 소리 (Web Audio로 직접 합성) ---------- */
let AC = null, muted = lsGet('mute') === '1';
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
const SFX = {
  click() { const c = ac(); if (!c) return; tone(c, { f: 660, f2: 420, type: 'triangle', dur: .08, vol: .08, attack: .003 }); },
  // 장구 '덩'
  drum() { const c = ac(); if (!c) return; tone(c, { f: 110, f2: 60, type: 'sine', dur: .5, vol: .35, attack: .004 }); noise(c, { dur: .12, vol: .08, from: 900, to: 300, q: 1.5 }); },
  // 축제 시작: 장구 '덩 덕 쿵 덕' + 꽹과리
  start() { const c = ac(); if (!c) return;
    [[0, 110, .35], [.28, 220, .15], [.56, 90, .3], [.84, 220, .15], [1.12, 110, .35]].forEach(([t, f, v]) => { tone(c, { f, f2: f * .55, t, dur: .45, vol: v, attack: .004 }); noise(c, { t, dur: .08, vol: .06, from: 1200, to: 400, q: 1 }); });
    [1.12, 1.3, 1.48].forEach(t => { [1480, 2210, 3300].forEach((f, j) => tone(c, { f, type: 'square', t, dur: .25, vol: .025 / (j + 1), attack: .002 })); });
  },
  correct() { const c = ac(); if (!c) return; [[659.3, 0], [880, .11], [1318.5, .22]].forEach(([f, t]) => { tone(c, { f, type: 'triangle', t, dur: .7, vol: .11, attack: .004 }); }); },
  wrong() { const c = ac(); if (!c) return; tone(c, { f: 300, f2: 200, type: 'triangle', dur: .4, vol: .1 }); tone(c, { f: 220, f2: 150, type: 'triangle', t: .18, dur: .5, vol: .09 }); },
  // 화살 날아가는 '휘익'
  whoosh() { const c = ac(); if (!c) return; noise(c, { dur: .55, vol: .14, from: 500, to: 3800, q: 2.5 }); },
  // 항아리에 '쏙-통!'
  plunk() { const c = ac(); if (!c) return; tone(c, { f: 180, f2: 90, type: 'sine', dur: .5, vol: .4, attack: .003 }); tone(c, { f: 420, f2: 320, type: 'sine', dur: .35, vol: .12, attack: .003 }); noise(c, { dur: .1, vol: .1, from: 1500, to: 500, q: 2 }); },
  coin(n) { const c = ac(); if (!c) return; const k = Math.min(6, Math.max(2, Math.round(n / 10) + 1)); for (let i = 0; i < k; i++) tone(c, { f: 988 * Math.pow(1.122, i), type: 'square', t: .05 + i * .07, dur: .25, vol: .04, attack: .002 }); },
  gold() { const c = ac(); if (!c) return; [523.3, 659.3, 784, 1046.5, 1318.5, 1568].forEach((f, i) => { tone(c, { f, type: 'triangle', t: i * .08, dur: 1.2, vol: .1 }); tone(c, { f: f * 2, t: i * .08, dur: .6, vol: .03 }); }); },
  fanfare() { const c = ac(); if (!c) return; [[523.3, 0, .3], [523.3, .3, .15], [659.3, .45, .3], [784, .75, .9]].forEach(([f, t, d]) => { tone(c, { f, type: 'sawtooth', t, dur: d + .2, vol: .06 }); tone(c, { f: f / 2, type: 'triangle', t, dur: d + .2, vol: .08 }); }); SFX.start(); }
};

/* 점수 숫자가 올라가며 나타남 */
function countUp(el, from, to, dur) {
  if (!el) return; if (from === to) { el.textContent = to; return; }
  const t0 = performance.now(); dur = dur || 900;
  (function step(now) { const p = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(from + (to - from) * e); if (p < 1) requestAnimationFrame(step); })(t0);
}

/* =====================================================================
 *  만든 효과음·배경음 파일 (sfx 폴더). 파일을 못 불러오면 위의 합성 소리를 그대로 써요.
 * ===================================================================== */
const SFX_FILES = { click: 'sfx_click', start: 'sfx_start', correct: 'sfx_correct', wrong: 'sfx_wrong', whoosh: 'sfx_whoosh',
  plunk: 'sfx_plunk', coin: 'sfx_coin', gold: 'sfx_gold', pop: 'sfx_pop', drum: 'sfx_stamp', stamp: 'sfx_stamp', page: 'sfx_page' };
const SFX_VOL = { click: .5, page: .6, pop: .7, coin: .8, start: .8, gold: .9 };
const BUF = {}; let bufLoading = null;
function loadSfx() {
  const c = ac(); if (!c || bufLoading) return bufLoading;
  bufLoading = Promise.all([...new Set(Object.values(SFX_FILES))].map(n =>
    fetch(`sfx/${n}.mp3`).then(r => r.arrayBuffer()).then(b => new Promise((ok, no) => c.decodeAudioData(b, ok, no)))
      .then(buf => { BUF[n] = buf; }).catch(() => {})));
  return bufLoading;
}
function playBuf(n, vol) {
  const c = ac(), buf = BUF[n]; if (!c || !buf) return false;
  const s = c.createBufferSource(), g = c.createGain(); s.buffer = buf; g.gain.value = vol == null ? 1 : vol;
  s.connect(g).connect(c.destination); s.start(); return true;
}
Object.keys(SFX_FILES).forEach(k => {
  const synth = SFX[k];
  SFX[k] = function () { if (muted) return; loadSfx(); if (!playBuf(SFX_FILES[k], SFX_VOL[k])) synth && synth.apply(SFX, arguments); };
});
SFX.fanfare = function () { if (muted) return; playBuf('sfx_start', .7); Music.award(); };
['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => loadSfx(), { once: true, passive: true }));

/* 배경음: 축제 음악은 반복, 시상식에서는 시상식 음악 */
const Music = {
  el: null, cur: '', wantOff: lsGet('music') === '0',
  play(name, loop, vol) {
    if (muted || this.wantOff) { this.stop(); return; }
    if (this.cur === name && this.el && !this.el.paused) return;
    this.stop();
    try {
      const a = new Audio(`sfx/${name}.mp3`); a.loop = loop; a.volume = vol; a.preload = 'auto';
      const p = a.play(); if (p && p.catch) p.catch(() => {});
      this.el = a; this.cur = name;
    } catch (e) {}
  },
  festival() { this.play('bgm_festival_loop', true, .22); },
  award() { this.play('bgm_award', false, .45); },
  stop() { if (this.el) { try { this.el.pause(); } catch (e) {} } this.el = null; this.cur = ''; },
  toggle() { this.wantOff = !this.wantOff; lsSet('music', this.wantOff ? '0' : '1'); if (this.wantOff) this.stop(); return !this.wantOff; }
};
