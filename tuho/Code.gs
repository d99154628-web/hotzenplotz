/**
 * 투호 챔피언십 — 모둠 점수 기록 서버 (구글 시트 + Apps Script)
 * 6학년 영어 Lesson 11 2차시 (교과서 152~153쪽)
 *
 * [처음 한 번만 설정]
 * 1. 구글 드라이브에서 새 구글 시트를 만들어요. (이름 예: 투호 챔피언십 기록)
 * 2. 시트 메뉴 [확장 프로그램] → [Apps Script] 를 눌러요.
 * 3. 원래 있던 코드를 모두 지우고, 이 파일 내용을 통째로 붙여 넣고 저장해요.
 * 4. 오른쪽 위 [배포] → [새 배포] → 톱니바퀴에서 '웹 앱' 선택
 *    - 다음 사용자 인증 정보로 실행: 나
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 *    → [배포] → 권한 허용 → 나오는 '웹 앱 URL'(…/exec)을 복사해요.
 * 5. 그 URL을 common.js 맨 위 API_URL 에 넣으면 끝!
 *
 * 교사용 화면 비밀번호는 아래 PASSWORD 를 바꾸면 돼요.
 * 점수는 올라가기만 해요. (선생님이 교사용 화면에서 고치는 것만 예외)
 */
const PASSWORD = '2026';
const MAX_GROUPS = 8;
const OK_PTS = { 0: 1, 5: 1, 10: 1, 20: 1, 30: 1, 50: 1 };

function doGet() { return out_({ ok: true, msg: 'tuho championship server is running' }); }

function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  try { return out_(handle_(p)); }
  catch (err) { return out_({ ok: false, error: String(err && err.message || err) }); }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- 저장소 ---------- */
const STU_HEAD = ['학생ID', '모둠', '이름', '푼 문제', '첫 시도 정답', '기여 점수', '완료', '참가(ms)', '마지막 활동(ms)', '수업ID'];
const LOG_HEAD = ['시각', '수업ID', '학생ID', '모둠', '이름', '문제 번호', '문제', '학생 답', '정오', '시도', '얻은 점수', '구멍 점수'];

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(header); s.setFrozenRows(1); }
  return s;
}
const props_ = () => PropertiesService.getScriptProperties();
function getJ_(k, d) { try { const v = props_().getProperty(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function putJ_(k, v) { props_().setProperty(k, JSON.stringify(v)); }

function cfg_() {
  const c = getJ_('cfg', null) || {};
  if (!c.sid) { c.sid = String(Date.now()); putJ_('cfg', c); }
  if (!c.n) c.n = 4;
  if (!Array.isArray(c.names)) c.names = [];
  for (let i = 0; i < MAX_GROUPS; i++) if (!c.names[i]) c.names[i] = (i + 1) + '모둠';
  if (!c.open) c.open = 'wait';            // wait 입장 준비 · open 축제 시작 · closed 시상식
  return c;
}
function totals_() {
  const t = getJ_('totals', []);
  for (let i = 0; i < MAX_GROUPS; i++) t[i] = Number(t[i]) || 0;
  return t;
}
function feed_() { return getJ_('feed', []); }
function pushFeed_(ev) { const f = feed_(); f.unshift(ev); putJ_('feed', f.slice(0, 30)); }

function publicState_() {
  const c = cfg_(), t = totals_();
  return { ok: true, sid: c.sid, n: c.n, names: c.names.slice(0, c.n), open: c.open, totals: t.slice(0, c.n), feed: feed_().slice(0, 8), now: Date.now() };
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(25000);
  try { return fn(); } finally { lock.releaseLock(); }
}
/* 같은 요청이 두 번 와도 한 번만 처리 */
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

  if (a === 'join') return withLock_(() => {
    const c = cfg_(), g = Number(p.group);
    if (String(p.sid) !== String(c.sid)) return { ok: false, error: 'sid', state: publicState_() };
    if (!(g >= 0 && g < c.n)) return { ok: false, error: 'group', state: publicState_() };
    const now = Date.now(), { s, rows } = stuRows_();
    const r = findStu_(rows, p.id, c.sid);
    if (r >= 0) {
      s.getRange(r + 2, 2, 1, 2).setValues([[g, String(p.name || '').slice(0, 20)]]);
      s.getRange(r + 2, 9).setValue(now);
    } else s.appendRow([String(p.id), g, String(p.name || '').slice(0, 20), 0, 0, 0, '', now, now, c.sid]);
    return publicState_();
  });

  if (a === 'answer') return withLock_(() => {
    const hit = seen_(p.eid); if (hit) return hit;
    const c = cfg_();
    if (String(p.sid) !== String(c.sid)) return { ok: true, stale: true };
    const g = Number(p.group);
    if (!(g >= 0 && g < c.n)) return { ok: true, stale: true };
    let pts = Number(p.pts) || 0;
    if (!OK_PTS[pts]) pts = 0;
    const now = Date.now(), { s, rows } = stuRows_();
    let r = findStu_(rows, p.id, c.sid);
    if (r < 0) { s.appendRow([String(p.id), g, String(p.name || '').slice(0, 20), 0, 0, 0, '', now, now, c.sid]); r = rows.length; rows.push(s.getRange(r + 2, 1, 1, STU_HEAD.length).getValues()[0]); }
    const row = rows[r];
    row[1] = g;
    row[3] = Math.max(Number(row[3]) || 0, Number(p.qi) + 1);
    if (p.ok && Number(p.tries) === 1) row[4] = (Number(row[4]) || 0) + 1;
    row[5] = (Number(row[5]) || 0) + pts;
    if (p.done) row[6] = 'Y';
    row[8] = now;
    s.getRange(r + 2, 1, 1, STU_HEAD.length).setValues([row]);

    if (pts > 0) {
      const t = totals_(); t[g] += pts; putJ_('totals', t);
      pushFeed_({ t: now, g: g, who: String(p.name || ''), pts: pts, gold: pts === 50 });
    }
    sheet_('기록', LOG_HEAD).appendRow([new Date(now), c.sid, p.id, g + 1, p.name || '', Number(p.qi) + 1, p.qn || '', String(p.ans || ''), p.ok ? 'O' : 'X', Number(p.tries) || 1, pts, String(p.holes || '')]);
    const res = { ok: true };
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
    if (p.open && ['wait', 'open', 'closed'].indexOf(p.open) >= 0) c.open = p.open;
    putJ_('cfg', c);
    return dash_();
  });

  if (a === 'adjust') return withLock_(() => {
    const c = cfg_(), t = totals_(), g = Number(p.group), d = Number(p.delta) || 0;
    if (!(g >= 0 && g < c.n)) return { ok: false, error: 'group' };
    t[g] = Math.max(0, t[g] + d);
    putJ_('totals', t);
    pushFeed_({ t: Date.now(), g: g, who: '선생님', pts: d, teacher: true });
    return dash_();
  });

  if (a === 'reset') return withLock_(() => {
    const c = cfg_();
    c.sid = String(Date.now()); c.open = 'wait';
    putJ_('cfg', c);
    putJ_('totals', []);
    putJ_('feed', []);
    const st = sheet_('학생', STU_HEAD);
    if (st.getLastRow() > 1) st.getRange(2, 1, st.getLastRow() - 1, STU_HEAD.length).clearContent();
    return dash_();
  });

  return { ok: false, error: 'unknown action' };
}

/* ---------- 교사 대시보드 ---------- */
function dash_() {
  const c = cfg_(), st = publicState_();
  const { rows } = stuRows_();
  st.students = rows.filter(r => r[0] !== '' && String(r[9]) === String(c.sid)).map(r => ({
    id: String(r[0]), g: Number(r[1]), name: String(r[2]), qi: Number(r[3]) || 0, first: Number(r[4]) || 0,
    pts: Number(r[5]) || 0, done: r[6] === 'Y', joined: Number(r[7]) || 0, updated: Number(r[8]) || 0
  }));
  st.feed = feed_();
  const log = sheet_('기록', LOG_HEAD), n = log.getLastRow() - 1;
  const stat = {};
  if (n > 0) {
    const take = Math.min(n, 3000);
    log.getRange(n - take + 2, 1, take, 10).getValues().forEach(r => {
      if (String(r[1]) !== String(c.sid)) return;
      const k = String(r[5]);
      stat[k] = stat[k] || { qi: Number(r[5]), q: String(r[6]), n: 0, wrong: 0 };
      stat[k].n++; if (Number(r[9]) > 1 || r[8] === 'X') stat[k].wrong++;
    });
  }
  st.hard = Object.keys(stat).map(k => stat[k]).filter(x => x.wrong > 0).sort((a, b) => b.wrong / b.n - a.wrong / a.n || b.wrong - a.wrong).slice(0, 6);
  st.allNames = c.names;
  return st;
}

/* 처음 한 번 실행해서 시트 탭을 만들고 권한을 허용하는 용도 */
function setup() {
  sheet_('학생', STU_HEAD); sheet_('기록', LOG_HEAD);
  putJ_('cfg', cfg_());
}
