/**
 * 자정의 골동품 가게 — 모둠 합산 기록 서버 (구글 시트 + Apps Script)
 *
 * [처음 한 번만 설정]
 * 1. 구글 드라이브에서 새 구글 시트를 만들어요. (이름 예: 자정의 골동품 가게 기록)
 * 2. 시트 메뉴 [확장 프로그램] → [Apps Script] 를 눌러요.
 * 3. 원래 있던 코드를 모두 지우고, 이 파일 내용을 통째로 붙여 넣고 저장해요.
 * 4. 오른쪽 위 [배포] → [새 배포] → 톱니바퀴에서 '웹 앱' 선택
 *    - 다음 사용자 인증 정보로 실행: 나
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 *    → [배포] → 권한 허용 → 나오는 '웹 앱 URL'(…/exec)을 복사해요.
 * 5. 그 URL을 common.js 맨 위 API_URL 에 넣으면 끝!
 *
 * 교사용 화면 비밀번호는 아래 PASSWORD 를 바꾸면 돼요.
 */
const PASSWORD = '0634';
const MAX_GROUPS = 8;

/* 상자 속 물건 (common.js 의 ITEMS 와 같은 id) */
const FX = {
  p10: { kind: 'g' }, p20: { kind: 'g' }, p30: { kind: 'g' }, x2: { kind: 'g' },
  steal: { kind: 'g', tgt: 1 }, shield: { kind: 'g' }, party: { kind: 'g' }, pass: { kind: 'g', tgt: 1 },
  crown: { kind: 'n' }, topHit: { kind: 'n' }, zero: { kind: 'n' },
  m10: { kind: 'b' }, m20: { kind: 'b' }, ghost: { kind: 'b', tgt: 1 }
};
const ITEM_NAME = {
  p10: '낡은 금화', p20: '은빛 촛대', p30: '루비 반지', x2: '쌍둥이 인형', steal: '도둑 검은 고양이', shield: '보호 부적',
  party: '축복의 오르골', pass: '저주 넘기기', crown: '녹슨 왕관', topHit: '1등 견제의 단검', zero: '먼지만 가득',
  m10: '깨진 찻잔', m20: '저주받은 인형', ghost: '떠돌이 유령'
};

function doGet() { return out_({ ok: true, msg: 'midnight antique shop server is running' }); }

function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  try { return out_(handle_(p)); }
  catch (err) { return out_({ ok: false, error: String(err && err.message || err) }); }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- 저장소 ---------- */
const STU_HEAD = ['학생ID', '모둠', '이름', '푼 문제', '맞힌 문제', '기여 점수', '완료', '참가(ms)', '마지막 활동(ms)', '수업ID'];
const LOG_HEAD = ['시각', '수업ID', '학생ID', '모둠', '이름', '종류', '문제', '학생 답', '정오', '물건', '대상 모둠', '점수 변화', '내용'];
const SET_HEAD = ['세트ID', '제목', '내용(JSON)', '저장 시각(ms)'];

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(header); s.setFrozenRows(1); }
  return s;
}
const props_ = () => PropertiesService.getScriptProperties();
function getJ_(k, d) { try { const v = props_().getProperty(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function putJ_(k, v) { props_().setProperty(k, JSON.stringify(v)); }

function defaultNames_() { const a = []; for (let i = 1; i <= MAX_GROUPS; i++) a.push(i + '모둠'); return a; }
function cfg_() {
  const c = getJ_('cfg', null) || {};
  if (!c.sid) c.sid = String(Date.now());
  if (!c.n) c.n = 4;
  if (!Array.isArray(c.names) || c.names.length < MAX_GROUPS) c.names = defaultNames_().map((d, i) => (c.names && c.names[i]) || d);
  if (c.limit == null) c.limit = 20;
  if (!c.open) c.open = 'wait';            // wait 준비 중 · open 문 열림 · closed 자정(끝)
  if (!c.setId) c.setId = 'default';
  if (!c.setTitle) c.setTitle = '';
  if (!c.setVer) c.setVer = 1;
  return c;
}
function score_(n) {
  const s = getJ_('score', null) || {};
  s.totals = s.totals || []; s.shields = s.shields || [];
  for (let i = 0; i < MAX_GROUPS; i++) { s.totals[i] = Number(s.totals[i]) || 0; s.shields[i] = Number(s.shields[i]) || 0; }
  return s;
}
function feed_() { return getJ_('feed', []); }
function pushFeed_(ev) { const f = feed_(); f.unshift(ev); putJ_('feed', f.slice(0, 40)); }

function publicState_() {
  const c = cfg_(), s = score_();
  return {
    ok: true, sid: c.sid, n: c.n, names: c.names.slice(0, c.n), limit: c.limit, open: c.open,
    setId: c.setId, setTitle: c.setTitle, setVer: c.setVer,
    totals: s.totals.slice(0, c.n), shields: s.shields.slice(0, c.n), feed: feed_().slice(0, 12), now: Date.now()
  };
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
/* 같은 요청이 두 번 와도 한 번만 처리 (인터넷이 끊겼다 다시 보낼 때) */
function seen_(eid) {
  if (!eid) return null;
  const v = CacheService.getScriptCache().get('e_' + eid);
  return v ? JSON.parse(v) : null;
}
function remember_(eid, res) { if (eid) CacheService.getScriptCache().put('e_' + eid, JSON.stringify(res), 21600); }

function stuRows_() {
  const s = sheet_('학생', STU_HEAD);
  const n = s.getLastRow() - 1;
  return { s: s, rows: n > 0 ? s.getRange(2, 1, n, STU_HEAD.length).getValues() : [] };
}
function findStu_(rows, id, sid) { return rows.findIndex(r => String(r[0]) === String(id) && String(r[9]) === String(sid)); }

/* ---------- 요청 처리 ---------- */
function handle_(p) {
  const a = p.action;
  if (a === 'state') return publicState_();
  if (a === 'set') return { ok: true, set: activeSet_() };

  if (a === 'join') return withLock_(() => {
    const c = cfg_(), g = Number(p.group);
    if (!(g >= 0 && g < c.n)) return { ok: false, error: 'group' };
    if (String(p.sid) !== String(c.sid)) return { ok: false, error: 'sid', state: publicState_() };
    const now = Date.now(), { s, rows } = stuRows_();
    const r = findStu_(rows, p.id, c.sid);
    if (r >= 0) {
      s.getRange(r + 2, 2, 1, 2).setValues([[g, String(p.name || '').slice(0, 20)]]);
      s.getRange(r + 2, 9).setValue(now);
    } else s.appendRow([String(p.id), g, String(p.name || '').slice(0, 20), 0, 0, 0, '', now, now, c.sid]);
    return publicState_();
  });

  if (a === 'answer') {
    const hit = seen_(p.eid); if (hit) return hit;
    const c = cfg_();
    if (String(p.sid) !== String(c.sid)) return { ok: true, stale: true };
    const now = Date.now(), { s, rows } = stuRows_();
    const r = findStu_(rows, p.id, c.sid);
    if (r >= 0) {
      const row = rows[r];
      row[3] = Math.max(Number(row[3]) || 0, Number(p.qi) + 1);
      if (p.ok) row[4] = (Number(row[4]) || 0) + 1;
      row[8] = now;
      if (p.done) row[6] = 'Y';
      s.getRange(r + 2, 1, 1, STU_HEAD.length).setValues([row]);
    }
    sheet_('기록', LOG_HEAD).appendRow([new Date(now), c.sid, p.id, Number(p.group) + 1, p.name || '', '답', p.qn || '', String(p.ans), p.ok ? 'O' : 'X', '', '', '', String(p.qid)]);
    const res = { ok: true };
    remember_(p.eid, res);
    return res;
  }

  if (a === 'finish') {
    const c = cfg_(), { s, rows } = stuRows_();
    const r = findStu_(rows, p.id, c.sid);
    if (r >= 0) { s.getRange(r + 2, 7).setValue('Y'); s.getRange(r + 2, 9).setValue(Date.now()); }
    return { ok: true };
  }

  if (a === 'box') return withLock_(() => {
    const hit = seen_(p.eid); if (hit) return hit;
    const c = cfg_();
    if (String(p.sid) !== String(c.sid)) return { ok: false, error: 'sid', state: publicState_() };
    const res = applyBox_(c, p);
    remember_(p.eid, res);
    return res;
  });

  /* ---------- 교사용 ---------- */
  if (String(p.pw) !== PASSWORD) return { ok: false, error: 'pw' };

  if (a === 'dash') return dash_();

  if (a === 'config') return withLock_(() => {
    const c = cfg_();
    if (p.n != null) c.n = Math.max(2, Math.min(MAX_GROUPS, Number(p.n) || 4));
    if (Array.isArray(p.names)) p.names.forEach((v, i) => { if (i < MAX_GROUPS) c.names[i] = String(v || '').trim().slice(0, 12) || (i + 1) + '모둠'; });
    if (p.limit != null) c.limit = Math.max(0, Number(p.limit) || 0);
    if (p.open && ['wait', 'open', 'closed'].indexOf(p.open) >= 0) c.open = p.open;
    putJ_('cfg', c);
    return dash_();
  });

  if (a === 'adjust') return withLock_(() => {
    const c = cfg_(), s = score_(), g = Number(p.group), d = Number(p.delta) || 0;
    if (!(g >= 0 && g < c.n)) return { ok: false, error: 'group' };
    s.totals[g] = Math.max(0, s.totals[g] + d);
    putJ_('score', s);
    pushFeed_({ t: Date.now(), g: g, who: '선생님', item: d >= 0 ? 'teacherUp' : 'teacherDown', msg: `선생님이 ${c.names[g]} 점수를 ${d >= 0 ? '+' : '−'}${Math.abs(d)}점 고쳤어요.`, d: [[g, d]] });
    return dash_();
  });

  if (a === 'reset') return withLock_(() => {
    const c = cfg_();
    c.sid = String(Date.now()); c.open = p.open || 'wait';
    putJ_('cfg', c);
    putJ_('score', { totals: [], shields: [] });
    putJ_('feed', []);
    const st = sheet_('학생', STU_HEAD);
    if (st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, STU_HEAD.length).clearContent();
    return dash_();
  });

  if (a === 'sets') return { ok: true, sets: listSets_(), active: cfg_().setId };
  if (a === 'saveSet') return withLock_(() => saveSet_(p.set));
  if (a === 'delSet') return withLock_(() => delSet_(String(p.id)));
  if (a === 'useSet') return withLock_(() => useSet_(String(p.id)));

  return { ok: false, error: 'unknown action' };
}

/* ---------- 상자 효과 (모둠 점수) ---------- */
function applyBox_(c, p) {
  const s = score_(), me = Number(p.group), id = String(p.item), x = FX[id];
  if (!x || !(me >= 0 && me < c.n)) return { ok: false, error: 'item' };
  let t = p.target == null ? null : Number(p.target);
  if (x.tgt && !(t >= 0 && t < c.n && t !== me)) t = (me + 1) % c.n;
  const N = c.names[me], T = t != null ? c.names[t] : '', who = String(p.name || '');
  const deltas = {};
  const add = (g, d) => { if (!d) return; s.totals[g] += d; deltas[g] = (deltas[g] || 0) + d; };
  const hurt = (g, amt) => {
    if (s.shields[g] > 0) { s.shields[g]--; return { blocked: true, d: 0 }; }
    const d = Math.min(amt, s.totals[g]); add(g, -d); return { blocked: false, d: d };
  };
  const tops = () => s.totals.slice(0, c.n);
  const leader = () => { const a = tops(), m = Math.max.apply(null, a); return a.indexOf(m); };
  let msg = '', myPts = Number(p.myPts) || 0;

  switch (id) {
    case 'p10': add(me, 10); msg = `낡은 금화를 찾았어요! ${N} +10점`; break;
    case 'p20': add(me, 20); msg = `은빛 촛대가 반짝여요! ${N} +20점`; break;
    case 'p30': add(me, 30); msg = `루비 반지가 나왔어요! ${N} +30점`; break;
    case 'x2': { const g = Math.min(Math.max(myPts, 10), 30); add(me, g); msg = `쌍둥이 인형이 내가 모은 점수를 복제했어요! ${N} +${g}점`; break; }
    case 'shield': s.shields[me]++; msg = `${N}이(가) 보호 부적을 얻었어요. 우리 모둠에 오는 저주를 한 번 막아 줘요.`; break;
    case 'party': for (let i = 0; i < c.n; i++) add(i, 10); msg = '오르골 소리에 모두가 춤을 춰요. 모든 모둠 +10점!'; break;
    case 'steal': { const r = hurt(t, 10); if (r.blocked) msg = `${T}의 보호 부적이 고양이를 쫓아냈어요!`; else { add(me, r.d); msg = `검은 고양이가 ${T}에게서 ${r.d}점을 물어 왔어요!`; } break; }
    case 'pass': { const r = hurt(t, 20); msg = r.blocked ? `${T}의 보호 부적이 저주를 튕겨 냈어요!` : `${T}에게 저주가 내려앉았어요. ${T} −${r.d}점`; break; }
    case 'crown': { const L = leader(); if (L === me || s.totals[L] === s.totals[me]) { add(me, 10); msg = `${N}은(는) 이미 1등이에요. 왕관을 닦았더니 +10점!`; } else { const r = hurt(L, 10); if (r.blocked) msg = `1등 ${c.names[L]}의 부적이 왕관을 지켰어요!`; else { add(me, r.d); msg = `녹슨 왕관을 썼어요! 1등 ${c.names[L]}에게서 ${r.d}점을 가져왔어요.`; } } break; }
    case 'topHit': { const L = leader(), Ln = c.names[L]; if (s.totals[L] === 0) { msg = '단검이 허공을 갈랐어요. 아직 1등이 없어요.'; break; } const r = hurt(L, 20); msg = r.blocked ? `1등 ${Ln}의 부적이 단검을 막았어요!` : `단검이 1등 ${Ln}을(를) 노렸어요. ${Ln} −${r.d}점`; break; }
    case 'zero': msg = '상자 안에는 먼지만 가득했어요. 점수 변화 없음.'; break;
    case 'm10': { const r = hurt(me, 10); msg = r.blocked ? '부적이 찻잔 조각을 막아 줬어요!' : `깨진 찻잔에 손을 베였어요. ${N} −${r.d}점`; break; }
    case 'm20': { const r = hurt(me, 20); msg = r.blocked ? '부적이 인형의 저주를 막아 줬어요!' : `저주받은 인형이 눈을 떴어요! ${N} −${r.d}점`; break; }
    case 'ghost': { const r = hurt(me, 10); if (r.blocked) msg = '부적을 본 유령이 도망갔어요!'; else { add(t, r.d); msg = `떠돌이 유령이 ${N}의 ${r.d}점을 ${T}에게 가져갔어요.`; } break; }
  }
  msg = msg.replace(/−0점/g, '점수가 없어서 잃을 것도 없었어요');
  putJ_('score', s);

  const mine = deltas[me] || 0;
  // 학생 기여 점수 갱신
  const { s: st, rows } = stuRows_();
  const r = findStu_(rows, p.id, c.sid);
  if (r >= 0) { st.getRange(r + 2, 6).setValue((Number(rows[r][5]) || 0) + mine); st.getRange(r + 2, 9).setValue(Date.now()); }

  const dl = Object.keys(deltas).map(k => [Number(k), deltas[k]]);
  pushFeed_({ t: Date.now(), id: String(p.id || ''), g: me, who: who, item: id, msg: msg, d: dl });
  sheet_('기록', LOG_HEAD).appendRow([new Date(), c.sid, p.id, me + 1, who, '상자', '', '', '', ITEM_NAME[id] || id, t != null ? t + 1 : '', dl.map(x => `${x[0] + 1}모둠 ${x[1] > 0 ? '+' : ''}${x[1]}`).join(', '), msg]);

  const st2 = publicState_();
  st2.msg = msg; st2.deltas = dl; st2.mine = mine;
  return st2;
}

/* ---------- 교사 대시보드 ---------- */
function dash_() {
  const c = cfg_(), st = publicState_();
  const { rows } = stuRows_();
  st.students = rows.filter(r => r[0] !== '' && String(r[9]) === String(c.sid)).map(r => ({
    id: String(r[0]), g: Number(r[1]), name: String(r[2]), qi: Number(r[3]) || 0, right: Number(r[4]) || 0,
    pts: Number(r[5]) || 0, done: r[6] === 'Y', joined: Number(r[7]) || 0, updated: Number(r[8]) || 0
  }));
  st.feed = feed_();
  // 많이 틀린 문제
  const log = sheet_('기록', LOG_HEAD), n = log.getLastRow() - 1;
  const stat = {};
  if (n > 0) {
    const take = Math.min(n, 3000);
    log.getRange(n - take + 2, 1, take, 13).getValues().forEach(r => {
      if (String(r[1]) !== String(c.sid) || r[5] !== '답') return;
      const k = String(r[6]);
      stat[k] = stat[k] || { q: k, n: 0, wrong: 0 };
      stat[k].n++; if (r[8] === 'X') stat[k].wrong++;
    });
  }
  st.hard = Object.keys(stat).map(k => stat[k]).filter(x => x.wrong > 0).sort((a, b) => b.wrong / b.n - a.wrong / a.n || b.wrong - a.wrong).slice(0, 6);
  st.allNames = c.names;
  return st;
}

/* ---------- 문제 세트 ---------- */
function listSets_() {
  const s = sheet_('문제세트', SET_HEAD), n = s.getLastRow() - 1;
  if (n <= 0) return [];
  return s.getRange(2, 1, n, 4).getValues().filter(r => r[0] !== '').map(r => {
    let d = {}; try { d = JSON.parse(r[2]); } catch (e) {}
    return { id: String(r[0]), title: String(r[1]), passages: d.passages || [], questions: d.questions || [], updatedAt: Number(r[3]) || 0 };
  });
}
function saveSet_(set) {
  if (!set || !Array.isArray(set.questions) || !set.questions.length) return { ok: false, error: 'empty' };
  const s = sheet_('문제세트', SET_HEAD), id = set.id || ('s' + Date.now().toString(36));
  const body = JSON.stringify({ passages: set.passages || [], questions: set.questions });
  const row = [id, String(set.title || '').slice(0, 60), body, Date.now()];
  const n = s.getLastRow() - 1, ids = n > 0 ? s.getRange(2, 1, n, 1).getValues().map(r => String(r[0])) : [];
  const r = ids.indexOf(id);
  if (r >= 0) s.getRange(r + 2, 1, 1, 4).setValues([row]); else s.appendRow(row);
  const c = cfg_();
  if (c.setId === id) { c.setTitle = row[1]; c.setVer++; putJ_('cfg', c); CacheService.getScriptCache().remove('activeSet'); }
  return { ok: true, id: id, sets: listSets_(), active: c.setId };
}
function delSet_(id) {
  const s = sheet_('문제세트', SET_HEAD), n = s.getLastRow() - 1;
  if (n > 0) { const ids = s.getRange(2, 1, n, 1).getValues().map(r => String(r[0])); const r = ids.indexOf(id); if (r >= 0) s.deleteRow(r + 2); }
  const c = cfg_();
  if (c.setId === id) { c.setId = 'default'; c.setTitle = ''; c.setVer++; putJ_('cfg', c); CacheService.getScriptCache().remove('activeSet'); }
  return { ok: true, sets: listSets_(), active: c.setId };
}
function useSet_(id) {
  const c = cfg_();
  if (id === 'default') { c.setId = 'default'; c.setTitle = ''; }
  else { const f = listSets_().find(x => x.id === id); if (!f) return { ok: false, error: 'noset' }; c.setId = id; c.setTitle = f.title; }
  c.setVer++; putJ_('cfg', c); CacheService.getScriptCache().remove('activeSet');
  return { ok: true, sets: listSets_(), active: c.setId };
}
function activeSet_() {
  const c = cfg_();
  if (c.setId === 'default') return null;
  const cache = CacheService.getScriptCache(), hit = cache.get('activeSet');
  if (hit) { const o = JSON.parse(hit); if (o.id === c.setId && o.ver === c.setVer) return o; }
  const f = listSets_().find(x => x.id === c.setId);
  if (!f) return null;
  const o = { id: f.id, ver: c.setVer, title: f.title, passages: f.passages, questions: f.questions };
  try { cache.put('activeSet', JSON.stringify(o), 21600); } catch (e) {}
  return o;
}

/* 처음 한 번 실행해서 시트 탭을 만들고 권한을 허용하는 용도 */
function setup() {
  sheet_('학생', STU_HEAD); sheet_('기록', LOG_HEAD); sheet_('문제세트', SET_HEAD);
  putJ_('cfg', cfg_());
}
