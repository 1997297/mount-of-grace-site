/* Fills and submits each of the three forms in a real browser, then reports
   the Supabase REST call that went out and what the visitor ended up seeing. */
const { spawn } = require('child_process');
const fs = require('fs'); const os = require('os'); const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9224;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-f-'));

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

const CASES = [
  {
    page: 'contact.html', form: 'contactForm', table: 'Contact_Messages',
    wrap: 'contactFormWrap', success: 'contactSuccess',
    fill: { inquiryType: 'general', fullName: 'ZZ_AUTOMATED_TEST', email: 'zz-automated-test@example.com',
            subject: 'ZZ_AUTOMATED_TEST', message: 'ZZ_AUTOMATED_TEST' },
  },
  {
    page: 'involved.html', form: 'interestForm', table: 'interest_submissions',
    wrap: 'interestFormWrap', success: 'thankYouCard',
    fill: { fullName: 'ZZ_AUTOMATED_TEST', emailAddress: 'zz-automated-test@example.com',
            areaOfInterest: '', aboutYou: 'ZZ_AUTOMATED_TEST' },
  },
  {
    page: 'sponsorship.html', form: 'sponsorForm', table: 'sponsorship_submission',
    wrap: 'sponsorFormWrap', success: 'sponsorThankYou',
    fill: { orgName: 'ZZ_AUTOMATED_TEST', sponsorEmail: 'zz-automated-test@example.com',
            sponsorProject: 'food-financial-aid', sponsorMessage: 'ZZ_AUTOMATED_TEST' },
  },
];

async function j(p) { return (await fetch('http://127.0.0.1:' + PORT + p)).json(); }

(async () => {
  for (let i = 0; i < 80; i++) { try { await j('/json/version'); break; } catch { await sleep(250); } }

  for (const c of CASES) {
    const t = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank',
      { method: 'PUT' })).json();
    const ws = new WebSocket(t.webSocketDebuggerUrl);
    let id = 0; const pend = new Map(); const evs = [];
    ws.addEventListener('message', e => {
      const m = JSON.parse(e.data);
      if (m.id && pend.has(m.id)) { const { resolve } = pend.get(m.id); pend.delete(m.id); resolve(m.result); }
      else if (m.method) evs.push(m);
    });
    const send = (method, params = {}) => new Promise(r => {
      const n = ++id; pend.set(n, { resolve: r });
      ws.send(JSON.stringify({ id: n, method, params }));
    });
    await new Promise(r => ws.addEventListener('open', r));

    await send('Runtime.enable'); await send('Network.enable'); await send('Page.enable');
    await send('Page.navigate', { url: 'http://127.0.0.1:8765/' + c.page });
    await sleep(2600);

    // Fill every field, dispatching input events so any listeners see them.
    const fillJs = Object.entries(c.fill).map(([k, v]) =>
      `{const el=document.getElementById(${JSON.stringify(k)});
        if(el){el.value=${JSON.stringify(v)};
        el.dispatchEvent(new Event('input',{bubbles:true}));
        el.dispatchEvent(new Event('change',{bubbles:true}));}}`).join('\n');
    await send('Runtime.evaluate', { expression: fillJs });

    // Select the first real option for any select we left blank.
    await send('Runtime.evaluate', { expression: `
      document.querySelectorAll('#${c.form} select').forEach(s=>{
        if(!s.value){ const o=[...s.options].find(o=>o.value); if(o){s.value=o.value;
          s.dispatchEvent(new Event('change',{bubbles:true}));} }
      });` });

    evs.length = 0;
    await send('Runtime.evaluate', { expression:
      `document.getElementById('${c.form}').requestSubmit
        ? document.getElementById('${c.form}').requestSubmit()
        : document.getElementById('${c.form}').dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));` });
    await sleep(9000);

    // What went over the wire?
    const reqs = evs.filter(e => e.method === 'Network.requestWillBeSent')
      .map(e => e.params.request)
      .filter(r => /supabase\.co\/rest/.test(r.url));

    const state = (await send('Runtime.evaluate', { returnByValue: true, expression: `({
      formHidden: !!document.getElementById(${JSON.stringify(c.wrap)})?.hidden,
      successShown: !!document.getElementById(${JSON.stringify(c.success)}) &&
                    !document.getElementById(${JSON.stringify(c.success)}).hidden,
      statusText: (document.querySelector('#${c.form} .form-status')||{}).textContent || '',
      buttonEnabled: !document.querySelector('#${c.form} button[type=submit]')?.disabled,
    })` })).result.value;

    console.log('\n' + '='.repeat(70));
    console.log(c.page + '  ->  form #' + c.form);
    console.log('='.repeat(70));
    if (!reqs.length) {
      console.log('  REQUEST: none sent  <-- form is not talking to Supabase');
    } else {
      for (const r of reqs) {
        const table = decodeURIComponent(r.url.split('/rest/v1/')[1] || '').split('?')[0];
        console.log('  REQUEST : ' + r.method + ' ' + table);
        console.log('  EXPECTED: POST ' + c.table + (table === c.table ? '   [table matches]' : '   [MISMATCH]'));
        if (r.postData) console.log('  PAYLOAD : ' + r.postData);
      }
    }
    console.log('  success card shown : ' + state.successShown);
    console.log('  form hidden        : ' + state.formHidden);
    console.log('  button re-enabled  : ' + state.buttonEnabled);
    console.log('  message to visitor : ' + (state.statusText.trim() || '(none)'));

    ws.close();
    await fetch('http://127.0.0.1:' + PORT + '/json/close/' + t.id).catch(() => {});
  }

  chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
