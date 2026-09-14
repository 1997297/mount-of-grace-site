/* Exercises the form FAILURE path: points the handler at a table that does
   not exist and checks the visitor sees an inline error instead of a fake
   "thank you" card — which is exactly what the old code did wrong. */
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9228;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-e-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

(async () => {
  for (let i = 0; i < 80; i++) {
    try { await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); break; }
    catch { await sleep(250); }
  }
  const t = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pend = new Map(); const evs = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const { resolve } = pend.get(m.id); pend.delete(m.id); resolve(m.result); }
    else if (m.method) evs.push(m);
  });
  const send = (mth, p = {}) => new Promise(r => {
    const n = ++id; pend.set(n, { resolve: r });
    ws.send(JSON.stringify({ id: n, method: mth, params: p }));
  });
  await new Promise(r => ws.addEventListener('open', r));

  await send('Runtime.enable');
  await send('Page.navigate', { url: 'http://127.0.0.1:8765/contact.html' });
  await sleep(2800);

  const wire = await send('Runtime.evaluate', {
    expression: `
      window.__SENTINEL__ = 12345;
      (function () {
        var f = document.getElementById('contactForm');
        var clone = f.cloneNode(true);
        f.parentNode.replaceChild(clone, f);

        ['fullName','subject','message'].forEach(function (k) {
          document.getElementById(k).value = 'probe';
        });
        document.getElementById('email').value = 'probe@example.com';

        window.mogWireForm({
          formId:'contactForm', wrapId:'contactFormWrap', successId:'contactSuccess',
          table:'this_table_does_not_exist',
          fields:{inquiry_type:'inquiryType', name:'fullName', email:'email',
                  subject:'subject', message:'message'}
        });
        document.getElementById('contactForm').requestSubmit();
      })();`
  });
  if (wire.exceptionDetails) {
    console.log('WIRE EXCEPTION: ' + JSON.stringify(wire.exceptionDetails).slice(0, 500));
  }

  // Longer than the handler's own 20s timeout.
  await sleep(24000);

  const r = await send('Runtime.evaluate', {
    returnByValue: true, expression: `({
      navigated    : window.__SENTINEL__ !== 12345,
      successShown : !document.getElementById('contactSuccess').hidden,
      formHidden   : !!document.getElementById('contactFormWrap').hidden,
      status       : (document.querySelector('#contactForm .form-status')||{}).textContent || '',
      statusVisible: !(document.querySelector('#contactForm .form-status')||{hidden:true}).hidden,
      btnEnabled   : !document.querySelector('#contactForm button[type=submit]').disabled,
      btnLabel     : document.querySelector('#contactForm button[type=submit]').innerText.trim()
    })`
  });

  const v = r.result.value;
  console.log(JSON.stringify(v, null, 2));
  console.log('\nconsole output:');
  evs.filter(e => e.method === 'Runtime.consoleAPICalled').forEach(e =>
    console.log('  [' + e.params.type + '] ' + e.params.args.map(a =>
      a.value !== undefined ? a.value : (a.description || '')).join(' ')));

  const pass = !v.navigated && !v.successShown && !v.formHidden &&
               v.statusVisible && v.status && v.btnEnabled;
  console.log('\nVERDICT: ' + (pass
    ? 'PASS — no fake success; error shown inline, form stays open, button usable.'
    : 'FAIL — failure was not surfaced correctly.'));

  chrome.kill(); process.exit(pass ? 0 : 1);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
