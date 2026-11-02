/* 데모 모드: 서버(Code.gs)를 이 브라우저 안에서 그대로 돌려 봄 (주소 끝에 ?demo 를 붙이면 켜짐)
 * 구글 시트 대신 이 브라우저의 저장 공간을 써요. 같은 브라우저의 다른 탭(교사용 화면)과 함께 볼 수 있어요. */
(function (root) {
  function makeGas(store) {
    const load = k => { try { return JSON.parse(store.get(k) || 'null'); } catch (e) { return null; } };
    const save = (k, v) => store.set(k, JSON.stringify(v));
    function Sheet(name) {
      const key = 'sheet:' + name;
      const rows = () => load(key) || [];
      const put = r => save(key, r);
      return {
        appendRow(r) { const a = rows(); a.push(r.map(v => v instanceof Date ? v.toISOString() : v)); put(a); },
        setFrozenRows() {},
        getLastRow() { const a = rows(); let n = a.length; while (n > 0 && a[n - 1].every(v => v === '')) n--; return n; },
        deleteRow(i) { const a = rows(); a.splice(i - 1, 1); put(a); },
        getRange(r, c, nr, nc) {
          nr = nr || 1; nc = nc || 1;
          return {
            getValues() { const a = rows(), out = []; for (let i = 0; i < nr; i++) { const row = a[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(row[c - 1 + j] == null ? '' : row[c - 1 + j]); out.push(o); } return out; },
            setValues(v) { const a = rows(); for (let i = 0; i < nr; i++) { a[r - 1 + i] = a[r - 1 + i] || []; for (let j = 0; j < nc; j++) a[r - 1 + i][c - 1 + j] = v[i][j]; } put(a); },
            setValue(v) { this.setValues([[v]]); },
            clearContent() { const a = rows(); for (let i = 0; i < nr; i++) if (a[r - 1 + i]) for (let j = 0; j < nc; j++) a[r - 1 + i][c - 1 + j] = ''; put(a); }
          };
        }
      };
    }
    const names = () => load('sheets') || [];
    return {
      SpreadsheetApp: { getActive: () => ({
        getSheetByName: n => names().indexOf(n) >= 0 ? Sheet(n) : null,
        insertSheet: n => { save('sheets', names().concat([n])); return Sheet(n); }
      }) },
      PropertiesService: { getScriptProperties: () => ({ getProperty: k => store.get('prop:' + k), setProperty: (k, v) => store.set('prop:' + k, v) }) },
      CacheService: { getScriptCache: () => ({ get: k => store.get('cache:' + k), put: (k, v) => store.set('cache:' + k, v), remove: k => store.del('cache:' + k) }) },
      LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
      ContentService: { createTextOutput: s => ({ s, setMimeType() { return this; } }), MimeType: { JSON: 'json' } }
    };
  }
  function boot(code, store) {
    const g = makeGas(store);
    const fn = new Function('SpreadsheetApp', 'PropertiesService', 'CacheService', 'LockService', 'ContentService', code + '\nreturn handle_;');
    return fn(g.SpreadsheetApp, g.PropertiesService, g.CacheService, g.LockService, g.ContentService);
  }
  root.TuhoDemo = { makeGas, boot };
  if (typeof window !== 'undefined') {
    const store = {
      get: k => { try { return localStorage.getItem('tuhodemo:' + k); } catch (e) { return null; } },
      set: (k, v) => { try { localStorage.setItem('tuhodemo:' + k, v); } catch (e) {} },
      del: k => { try { localStorage.removeItem('tuhodemo:' + k); } catch (e) {} }
    };
    let handler = null;
    window.demoCall = async p => {
      if (!handler) handler = boot(await (await fetch('Code.gs', { cache: 'no-store' })).text(), store);
      await new Promise(r => setTimeout(r, 150));
      return JSON.parse(JSON.stringify(handler(JSON.parse(JSON.stringify(p)))));
    };
  }
})(typeof window !== 'undefined' ? window : globalThis);
