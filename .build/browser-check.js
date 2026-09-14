/* Local browser verification. All form requests are mocked; no live submissions. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const root = path.resolve(__dirname, '..');
const base = process.env.MOG_TEST_BASE || 'http://127.0.0.1:8766/';
const port = 9338;
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-browser-check-'));
const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + port, '--user-data-dir=' + path.join(output, 'profile'),
  'about:blank',
], { stdio: 'ignore', windowsHide: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const failures = [];
const report = [];
const check = (ok, message) => { if (!ok) failures.push(message); };
let ws;
async function run() {
  for (let i = 0; i < 60; i++) {
    try { await fetch('http://127.0.0.1:' + port + '/json/version'); break; }
    catch { await sleep(250); }
  }
  const tab = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json();
  ws = new WebSocket(tab.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  const exceptions = [];
  const localErrors = [];
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject, timer } = pending.get(message.id);
      pending.delete(message.id); clearTimeout(timer);
      message.error ? reject(Error(message.error.message)) : resolve(message.result);
    } else if (message.method === 'Runtime.exceptionThrown') exceptions.push(message.params.exceptionDetails.text);
    else if (message.method === 'Network.responseReceived') {
      const r = message.params.response;
      if (r.url.startsWith(base) && r.status >= 400 && !r.url.endsWith('/assets/v19.mp4')) localErrors.push(r.status + ' ' + r.url);
    }
  });
  await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const requestId = ++id;
    const timer = setTimeout(() => reject(Error('Timed out: ' + method)), 20000);
    pending.set(requestId, { resolve, reject, timer });
    ws.send(JSON.stringify({ id: requestId, method, params }));
  });
  const evaluate = async expression => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    return r.result.value;
  };
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  await send('Network.setBlockedURLs', { urls: ['*supabase.co/*'] });
  await send('Page.addScriptToEvaluateOnNewDocument', { source: `
    window.__formRequests = []; window.__mockFailure = false;
    const originalFetch = window.fetch.bind(window);
    window.fetch = async (url, options = {}) => {
      if (String(url).includes('.supabase.co/')) {
        window.__formRequests.push({url: String(url), method: options.method, body: typeof options.body === 'string' ? options.body : '[file]'});
        return window.__mockFailure
          ? new Response(JSON.stringify({code: 'MOCK_FAILURE', message: 'Test failure'}), {status: 503})
          : new Response('', {status: 201});
      }
      return originalFetch(url, options);
    };
  ` });
  const viewport = async width => send('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: width < 768});
  const navigate = async file => {
    await send('Page.navigate', {url: base + file});
    for (let i = 0; i < 60; i++) {
      await sleep(80);
      if (await evaluate('document.readyState !== "loading" && !!document.querySelector(".site-header")')) break;
    }
    await sleep(160);
  };
  const screenshot = async (name, selector) => {
    if (selector) await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center', behavior:'instant'})`);
    await sleep(1000);
    const shot = await send('Page.captureScreenshot', {format: 'png'});
    fs.writeFileSync(path.join(output, name + '.png'), Buffer.from(shot.data, 'base64'));
  };
  for (const file of (process.argv.includes('--interactions-only') ? [] : fs.readdirSync(root).filter(f => f.endsWith('.html')))) {
    await viewport(1440); await navigate(file);
    check((await evaluate('document.querySelectorAll("#mainNav .nav-link").length')) === 7, file + ': navigation missing');
    for (const width of [1440, 1024, 768, 390, 320]) {
      await viewport(width); await sleep(100);
      const state = await evaluate(`(() => {
        const wide = [...document.querySelectorAll('.program-body h3,.mog-card-title,.prog-fact-num,.footer-col,input,select,textarea')]
          .filter(e => e.offsetParent && e.getBoundingClientRect().right > innerWidth + 2)
          .map(e => e.className || e.id);
        const nav = document.getElementById('mainNav'), menu = document.getElementById('hamburgerBtn');
        return {width:document.documentElement.scrollWidth,wide,nav:getComputedStyle(nav).display,menu:getComputedStyle(menu).display};
      })()`);
      check(state.width <= width + 2 && state.wide.length === 0, file + ' at ' + width + ': overflow ' + JSON.stringify(state));
      check(width > 1024 ? state.nav !== 'none' : state.menu !== 'none', file + ' at ' + width + ': no navigation control');
    }
    await evaluate('document.getElementById("hamburgerBtn").click()');
    check(await evaluate('document.getElementById("mainNav").classList.contains("open") && document.body.classList.contains("nav-open")'), file + ': mobile menu did not open');
    await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape'});
    check(await evaluate('!document.body.classList.contains("nav-open")'), file + ': menu did not close');
    report.push(file + ': 1440/1024/768/390/320px OK');
    console.log(report.at(-1));
  }
  await viewport(390); await navigate('index.html');
  await evaluate('document.querySelector(".home-program-toggle").click()');
  check(await evaluate('document.querySelector(".home-program-toggle").getAttribute("aria-expanded") === "true" && !document.querySelector(".home-program-dropdown").inert'), 'Home expansion failed');
  await evaluate('document.querySelectorAll(".home-program-toggle")[1].click()');
  check(await evaluate('document.querySelectorAll(".program-card-wrap.is-open").length === 1 && document.querySelector(".home-program-dropdown").inert'), 'Home accordion exclusivity failed');
  await screenshot('home-mobile-programmes', '#programs');
  await navigate('programs.html');
  await evaluate('document.querySelector(".mog-see-impact").click()');
  check(await evaluate('document.querySelector(".mog-impact-panel").hidden === false'), 'Programme accordion did not open');
  await screenshot('programmes-mobile', '.mog-card-wrap');
  await navigate('sponsorship.html'); await screenshot('sponsorship-mobile', '.involved-volunteer-grid');
  await viewport(1440); await navigate('impact.html'); await screenshot('impact-desktop-stats', '.impact-stats');
  await screenshot('impact-desktop-field', '.impact-gallery');
  await viewport(390); await screenshot('impact-mobile-field', '.impact-gallery');
  await viewport(1440); await navigate('gallery.html');
  check((await evaluate('document.querySelectorAll(".gallery-item").length')) === 114, 'Gallery media count incorrect');
  check(await evaluate('performance.getEntriesByType("resource").every(r => !/\\.mp4(?:$|\\?)/i.test(r.name))'), 'Gallery eagerly requested an MP4');
  check(await evaluate('[...document.querySelectorAll(".gallery-item img")].every(i=>i.loading==="lazy")'), 'Gallery image lazy loading missing');
  await evaluate('document.querySelector("[data-filter=photo]").click()');
  check((await evaluate('document.querySelectorAll(".gallery-item:not(.gallery-hide)").length')) === 89, 'Photo filtering failed');
  await evaluate('document.querySelector(".gallery-item").focus()');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Enter', code:'Enter'});
  check(await evaluate('document.querySelector(".gallery-lightbox").classList.contains("is-open")'), 'Keyboard gallery open failed');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'ArrowRight', code:'ArrowRight'});
  check(await evaluate('document.querySelector(".gallery-lightbox-stage img").src.endsWith("/2.webp")'), 'Lightbox next failed');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape'});
  check(await evaluate('!document.body.classList.contains("gallery-lock-scroll") && document.activeElement === document.querySelector(".gallery-item")'), 'Lightbox close/focus restore failed');
  await evaluate('document.querySelector("[data-filter=video]").click()');
  check((await evaluate('document.querySelectorAll(".gallery-item:not(.gallery-hide)").length')) === 25, 'Video filtering failed');
  await evaluate('document.querySelector(".gallery-item[data-pending=true]").click()'); await sleep(1200);
  check(await evaluate('document.querySelector(".gallery-lightbox-stage").textContent.includes("not available yet")'), 'Missing v19 message failed');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape'});
  await evaluate('document.querySelector(".gallery-item[data-type=video]").click()'); await sleep(1400);
  check(await evaluate('document.querySelector(".gallery-lightbox-stage video")?.src.endsWith("/V1.mp4")'), 'Gallery v1 source failed');
  await send('Input.dispatchKeyEvent', {type:'keyDown', key:'Escape', code:'Escape'});
  check(await evaluate('!document.querySelector(".gallery-lightbox-stage video")'), 'Video cleanup failed');
  await evaluate('document.querySelector("[data-filter=photo]").click()'); await screenshot('gallery-desktop', '.gallery-grid');
  await viewport(390); await screenshot('gallery-mobile', '.gallery-grid');
  for (const [file, form, success] of [['contact.html','contactForm','contactSuccess'],['involved.html','interestForm','thankYouCard'],['sponsorship.html','sponsorForm','sponsorThankYou']]) {
    await navigate(file);
    const fill = `(() => { const f=document.getElementById('${form}');
      f.querySelectorAll('input').forEach(i=>i.value=i.type==='email'?'local-check@example.com':'Local check');
      f.querySelectorAll('textarea').forEach(i=>i.value='Local browser verification');
      f.querySelectorAll('select').forEach(i=>i.value=[...i.options].find(o=>o.value)?.value || '');
      f.requestSubmit(); })()`;
    await evaluate(fill); await sleep(100);
    check(await evaluate(`!document.getElementById('${success}').hidden && window.__formRequests.length === 1`), file + ': mocked form success failed');
    await navigate(file); await evaluate('window.__mockFailure = true'); await evaluate(fill); await sleep(100);
    check(await evaluate(`document.getElementById('${success}').hidden && !!document.querySelector('#${form} .form-status.is-error') && !document.querySelector('#${form} button[type=submit]').disabled`), file + ': mocked form failure failed');
  }
  await navigate('donate.html');
  await evaluate('document.querySelector("[data-frequency=monthly]").click(); document.querySelector(\'[data-amount="100"]\').click(); document.getElementById("donateBtn").click()'); await sleep(600);
  check(await evaluate('location.pathname.endsWith("accounts.html") && new URLSearchParams(location.search).get("amount")==="100" && new URLSearchParams(location.search).get("frequency")==="monthly"'), 'Donation navigation failed');
  await evaluate(`document.getElementById('receiptName').value='Local check'; document.getElementById('receiptEmail').value='local-check@example.com'; const dt=new DataTransfer(); dt.items.add(new File(['local test'],'receipt.pdf',{type:'application/pdf'})); document.getElementById('receiptFile').files=dt.files; document.getElementById('receiptSubmitForm').requestSubmit()`); await sleep(100);
  check(await evaluate('!document.getElementById("receiptSuccess").hidden && window.__formRequests.length === 2'), 'Mocked receipt upload failed');
  await navigate('contact.html');
  check((await evaluate('document.querySelectorAll(".contact-follow-row").length')) === 5, 'Restored social links missing');
  check(await evaluate('[...document.querySelectorAll("a")].some(a=>a.href.includes("google.com/maps") && a.innerText.includes("Google Maps"))'), 'Restored Maps link missing');
  await viewport(1440); await screenshot('contact-desktop', '.contact-map-band');
  check(exceptions.length === 0, 'Browser exceptions: ' + exceptions.join('; '));
  check(localErrors.length === 0, 'Local asset errors: ' + localErrors.join('; '));
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify({base, report, failures, expectedMissing:'assets/v19.mp4'}, null, 2));
  console.log('Interactions: mobile navigation, accordions, photo/video filters, keyboard lightbox, v19 fallback, donation routing, mocked forms and receipt upload checked.');
  console.log('Screenshots/report: ' + output);
  failures.forEach(f=>console.error('FAIL: ' + f));
  console.log(failures.length ? failures.length + ' failures.' : 'All browser checks passed.');
}
run().catch(e=>{failures.push(e.message); console.error(e);}).finally(()=>{ws?.close();chrome.kill();process.exitCode=failures.length?1:0;});
