/* Reports computed colour + WCAG contrast for every .btn-primary in the
   header, at desktop and mobile widths (mobile opens the drawer first). */
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9231;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-c-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

const PROBE = `(() => {
  const lum = c => { const [r,g,b] = c.match(/[\\d.]+/g).slice(0,3).map(Number)
      .map(v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); });
    return 0.2126*r + 0.7152*g + 0.0722*b; };
  const ratio = (a,b) => { const L1=lum(a), L2=lum(b);
    return +(((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05))).toFixed(2); };
  return [...document.querySelectorAll('.btn-primary')].map(el => {
    const s = getComputedStyle(el);
    let bg = s.backgroundColor, n = el;
    while (/rgba\\(0, 0, 0, 0\\)|transparent/.test(bg) && n.parentElement) {
      n = n.parentElement; bg = getComputedStyle(n).backgroundColor;
    }
    return { where: el.className, text: el.innerText.trim().slice(0,14),
             visible: s.display !== 'none',
             color: s.color, bg: bg, padding: s.padding,
             contrast: ratio(s.color, bg) };
  });
})()`;

(async () => {
  for (let i = 0; i < 80; i++) {
    try { await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); break; }
    catch { await sleep(250); }
  }
  const t = await (await fetch('http://127.0.0.1:' + PORT + '/json/new?about:blank', { method: 'PUT' })).json();
  const ws = new WebSocket(t.webSocketDebuggerUrl);
  let id = 0; const pend = new Map();
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { const { resolve } = pend.get(m.id); pend.delete(m.id); resolve(m.result); }
  });
  const send = (mth, p = {}) => new Promise(r => {
    const n = ++id; pend.set(n, { resolve: r });
    ws.send(JSON.stringify({ id: n, method: mth, params: p }));
  });
  await new Promise(r => ws.addEventListener('open', r));
  await send('Runtime.enable'); await send('Page.enable');

  for (const w of [1280, 900, 390]) {
    await send('Emulation.setDeviceMetricsOverride',
      { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 1024 });
    await send('Page.navigate', { url: 'http://127.0.0.1:8765/index.html' });
    await sleep(1800);
    if (w < 1024) {
      await send('Runtime.evaluate', { expression: "document.getElementById('hamburgerBtn').click()" });
      await sleep(500);
    }
    const r = (await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value;
    console.log('\n===== viewport ' + w + 'px =====');
    r.filter(x => x.visible).forEach(x => console.log(
      '  ' + x.where + '  "' + x.text + '"' +
      '\n      color ' + x.color + '  on ' + x.bg +
      '\n      contrast ' + x.contrast + ':1  ' + (x.contrast < 4.5 ? '<-- FAILS WCAG AA' : 'ok') +
      '\n      padding ' + x.padding));
  }
  chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
