/* Site-wide sweep: every button-like element on every page, at desktop and
   in the open mobile drawer, reporting any WCAG AA contrast failure. */
const { spawn } = require('child_process');
const fs = require('fs'), os = require('os'), path = require('path');
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9233;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-a-'));
const PAGES = fs.readdirSync('.').filter(f => /\.html$/.test(f)).sort();
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--no-first-run',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile, 'about:blank'], { stdio: 'ignore' });

const SEL = ['.btn', '.mog-support-btn', '.mog-see-impact', '.home-program-toggle',
  '.gallery-tab', '.play-btn', 'button[type="submit"]', '.nav-link',
  '.footer-col a', '.footer-legal a'].join(',');

const PROBE = `(() => {
  const parse = c => { const m = (c||'').match(/[\\d.]+/g); if (!m) return null;
    return { r:+m[0], g:+m[1], b:+m[2], a: m.length > 3 ? +m[3] : 1 }; };
  const over = (fg, bg) => ({          // composite fg (with alpha) onto bg
    r: fg.r*fg.a + bg.r*(1-fg.a),
    g: fg.g*fg.a + bg.g*(1-fg.a),
    b: fg.b*fg.a + bg.b*(1-fg.a), a: 1 });
  const lum = c => { const f = v => { v/=255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); };
    return 0.2126*f(c.r) + 0.7152*f(c.g) + 0.0722*f(c.b); };
  const ratio = (a,b) => { const L1=lum(a), L2=lum(b);
    return +(((Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05))).toFixed(2); };
  const str = c => 'rgb(' + [c.r,c.g,c.b].map(v=>Math.round(v)).join(',') + ')';

  /* Effective backdrop = every ancestor's background colour composited
     bottom-up. Bail out if any ancestor paints an image or gradient — the
     ratio is then not decidable from computed style alone. */
  const backdrop = el => {
    const stack = []; let n = el, imaged = false;
    while (n) {
      const s = getComputedStyle(n);
      if (s.backgroundImage && s.backgroundImage !== 'none') imaged = true;
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) stack.push(c);
      n = n.parentElement;
    }
    if (imaged) return null;
    let base = { r:255, g:255, b:255, a:1 };
    for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base);
    return base;
  };

  const out = [];
  document.querySelectorAll(${JSON.stringify(SEL)}).forEach(el => {
    const s = getComputedStyle(el);
    const b = el.getBoundingClientRect();
    if (!(b.width > 0 && b.height > 0 && el.offsetParent)) return;
    const bg = backdrop(el);
    if (!bg) return;                       // sits on an image or gradient
    let fg = parse(s.color); if (!fg) return;
    if (fg.a < 1) fg = over(fg, bg);
    const large = parseFloat(s.fontSize) >= 24 ||
                  (parseFloat(s.fontSize) >= 18.66 && parseInt(s.fontWeight,10) >= 700);
    const r = ratio(fg, bg);
    if (r < (large ? 3 : 4.5)) out.push({
      sel: (el.tagName + '.' + String(el.className).split(' ').slice(0,3).join('.')).slice(0,52),
      text: el.innerText.trim().slice(0,22).replace(/\\s+/g,' '),
      color: str(fg), bg: str(bg), ratio: r, need: large ? 3 : 4.5 });
  });
  return out;
})()`;

(async () => {
  for (let i = 0; i < 80; i++) {
    try { await (await fetch('http://127.0.0.1:' + PORT + '/json/version')).json(); break; }
    catch { await sleep(250); }
  }
  let fails = 0;
  for (const page of PAGES) {
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

    const found = [];
    for (const w of [1280, 390]) {
      await send('Emulation.setDeviceMetricsOverride',
        { width: w, height: 900, deviceScaleFactor: 1, mobile: w < 1024 });
      await send('Page.navigate', { url: 'http://127.0.0.1:8765/' + encodeURIComponent(page) });
      await sleep(1600);
      if (w < 1024) {
        await send('Runtime.evaluate', { expression: "document.getElementById('hamburgerBtn')&&document.getElementById('hamburgerBtn').click()" });
        await sleep(400);
      }
      const r = (await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result.value || [];
      r.forEach(x => found.push(w + 'px  ' + x.sel + '  "' + x.text + '"  ' +
        x.color + ' on ' + x.bg + '  ' + x.ratio + ':1 (needs ' + x.need + ')'));
    }
    const uniq = [...new Set(found)];
    console.log((uniq.length ? '[FAIL] ' : '[ ok ] ') + page);
    uniq.forEach(f => { console.log('        - ' + f); fails++; });
    ws.close();
    await fetch('http://127.0.0.1:' + PORT + '/json/close/' + t.id).catch(() => {});
  }
  console.log('\n' + (fails ? fails + ' contrast failure(s).' : 'No contrast failures across ' + PAGES.length + ' pages.'));
  chrome.kill(); process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
