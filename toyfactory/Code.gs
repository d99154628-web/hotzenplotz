/**
 * 토이랜드 장난감 공장 — 기록 서버 (구글 시트 + Apps Script)
 *
 * [처음 한 번만 설정]
 * 1. 구글 드라이브에서 새 구글 시트를 만들어요. (이름 예: 장난감 공장 기록)
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
const PASSWORD = '1234';

function doGet() {
  return out_({ ok: true, msg: 'toy factory server is running' });
}

function doPost(e) {
  let p = {};
  try { p = JSON.parse(e.postData.contents || '{}'); } catch (err) { return out_({ ok: false, error: 'bad json' }); }
  try { return out_(handle_(p)); }
  catch (err) { return out_({ ok: false, error: String(err) }); }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function sheet_(name, header) {
  const ss = SpreadsheetApp.getActive();
  let s = ss.getSheetByName(name);
  if (!s) { s = ss.insertSheet(name); s.appendRow(header); s.setFrozenRows(1); }
  return s;
}
const STU_HEAD = ['번호', '이름', '푼 문제 수', '점수', '완료', '시작(ms)', '마지막 활동(ms)'];
const ANS_HEAD = ['시각(ms)', '번호', '문제', '학생 답', '정오', '이름', '기록 시각'];

function sid_() {
  const pr = PropertiesService.getScriptProperties();
  let v = pr.getProperty('sid');
  if (!v) { v = String(Date.now()); pr.setProperty('sid', v); }
  return v;
}

function handle_(p) {
  const action = p.action;
  if (action === 'state') return { ok: true, sid: sid_() };

  if (action === 'dash') {
    if (String(p.pw) !== PASSWORD) return { ok: false, error: 'pw' };
    return Object.assign({ ok: true, sid: sid_() }, dash_());
  }

  if (action === 'reset') {
    if (String(p.pw) !== PASSWORD) return { ok: false, error: 'pw' };
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      [['학생', STU_HEAD], ['답안', ANS_HEAD]].forEach(([n, h]) => {
        const s = sheet_(n, h);
        if (s.getLastRow() > 1) s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).clearContent();
      });
      const v = String(Date.now());
      PropertiesService.getScriptProperties().setProperty('sid', v);
      return { ok: true, sid: v };
    } finally { lock.releaseLock(); }
  }

  if (action === 'join' || action === 'answer' || action === 'finish') {
    const lock = LockService.getScriptLock(); lock.waitLock(20000);
    try {
      const now = Date.now(), num = Number(p.num);
      const stu = sheet_('학생', STU_HEAD);
      const rows = stu.getLastRow() > 1 ? stu.getRange(2, 1, stu.getLastRow() - 1, 7).getValues() : [];
      let r = rows.findIndex(x => Number(x[0]) === num);
      let row = r >= 0 ? rows[r] : [num, p.name || '', 0, '', '', now, now];

      if (action === 'join') row = [num, p.name || '', 0, '', '', now, now];
      if (action === 'answer') {
        row[1] = p.name || row[1];
        row[2] = Math.max(Number(row[2]) || 0, Number(p.qi) + 1);
        row[6] = now;
        sheet_('답안', ANS_HEAD).appendRow([now, num, p.qid, String(p.ans), p.ok ? 'O' : 'X', p.name || '', new Date()]);
      }
      if (action === 'finish') { row[1] = p.name || row[1]; row[3] = Number(p.score); row[4] = 'Y'; row[6] = now; }

      if (r >= 0) stu.getRange(r + 2, 1, 1, 7).setValues([row]);
      else stu.appendRow(row);
      return { ok: true, sid: sid_() };
    } finally { lock.releaseLock(); }
  }
  return { ok: false, error: 'unknown action' };
}

function dash_() {
  const stu = sheet_('학생', STU_HEAD), ans = sheet_('답안', ANS_HEAD);
  const sRows = stu.getLastRow() > 1 ? stu.getRange(2, 1, stu.getLastRow() - 1, 7).getValues() : [];
  const aRows = ans.getLastRow() > 1 ? ans.getRange(2, 1, ans.getLastRow() - 1, 5).getValues() : [];
  const students = sRows.filter(r => r[0] !== '').map(r => ({
    num: Number(r[0]), name: String(r[1]), qi: Number(r[2]) || 0,
    score: r[3] === '' ? '' : Number(r[3]), done: r[4] === 'Y',
    started: Number(r[5]) || 0, updated: Number(r[6]) || 0
  }));
  // common.js 의 buildDash 와 같은 계산
  const byNum = {};
  students.forEach(s => { byNum[s.num] = s; });
  const out = {};
  aRows.forEach(r => {
    const t = Number(r[0]), num = Number(r[1]), s = byNum[num];
    if (!s || t < s.started - 1000) return;
    out[num] = out[num] || {};
    if (!out[num][r[2]]) out[num][r[2]] = { a: String(r[3]), ok: r[4] === 'O', t: t };
  });
  return { students: students, ans: out, now: Date.now() };
}
