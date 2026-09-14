/* Drives headless Chrome over CDP: loads every page, collects console
   errors, uncaught exceptions and failed requests, and runs DOM assertions. */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE = 'http://127.0.0.1:8765/';
const PORT = 9222;
const PAGES = fs.readdirSync('.').filter(f => /\.html$/.test(f)).sort();

const sleep = ms => new Promise(r => setTimeout(r, ms));
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'mog-chrome-'));

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  '--remote-debugging-port=' + PORT, '--user-data-dir=' + profile,
  '--window-size=1280,900', 'about:blank',
], { stdio: 'ignore' });

async function cdpHTTP(p) {
  const res = await fetch('http://127.0.0.1:' + PORT + p);
  return res.json();
}

async function waitForChrome() {
  for (let i = 0; i < 80; i++) {
    try { await cdpHTTP('/json/version'); return; } catch { await sleep(250); }
  }
  throw new Error('Chrome did not start');
}

/* One WebSocket per page target. */
function client(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const events = [];

  ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id);
      pending.delete(m.id);
      m.error ? reject(new Error(m.error.message)) : resolve(m.result);
    } else if (m.method) events.push(m);
  });

  return {
    events,
    ready: new Promise((res, rej) => {
      ws.addEventListener('open', res);
      ws.addEventListener('error', rej);
    }),
    send(method, params = {}) {
      const n = ++id;
      return new Promise((resolve, reject) => {
        pending.set(n, { resolve, reject });
        ws.send(JSON.stringify({ id: n, method, params }));
      });
    },
    close: () => ws.close(),
  };
}

/* Assertions evaluated inside the page. */
const PROBE = `(() => {
  const out = {};
  out.title = document.title;
  out.emojiInText = (document.body.innerText.match(
    /[\\u{1F300}-\\u{1FAFF}\\u{2190}-\\u{21FF}\\u{2600}-\\u{27BF}\\u{2B00}-\\u{2BFF}]/gu) || []);
  out.icons = document.querySelectorAll('svg.mog-icon').length;
  out.navLinks = document.querySelectorAll('#mainNav .nav-link').length;
  out.hamburger = !!document.getElementById("hamburgerBtn");
  const navEl = document.getElementById("mainNav");
  const hamEl = document.getElementById("hamburgerBtn");
  out.navVisible = navEl ? getComputedStyle(navEl).display !== "none" : false;
  out.hamburgerVisible = hamEl ? getComputedStyle(hamEl).display !== "none" : false;
  out.footerLinks = document.querySelectorAll('.footer-col a').length;
  out.footerHashLinks = [...document.querySelectorAll('.footer-col a')]
    .filter(a => a.getAttribute('href') === '#').length;
  out.mogIconGlobal = typeof window.MOG_ICON === 'object' && !!window.MOG_ICON.play;
  out.hasForm = !!document.querySelector('form');
  out.wireFormFn = typeof window.mogWireForm;
  out.supabaseLib = typeof window.supabase;
  out.vhVar = document.documentElement.style.getPropertyValue('--vh');
  // Any element wider than the viewport = horizontal scroll on mobile.
  out.docScrollW = document.documentElement.scrollWidth;
  out.innerW = window.innerWidth;
  const wide = [];
  document.querySelectorAll('*').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width > window.innerWidth + 2 && el.tagName !== 'HTML' && el.tagName !== 'BODY') {
      wide.push(el.tagName + '.' + (el.className && el.className.baseVal !== undefined ? '' : String(el.className).split(' ')[0]) + ' w=' + Math.round(r.width));
    }
  });
  out.overflowing = [...new Set(wide)].slice(0, 6);
  return out;
})()`;

(async () => {
  await waitForChrome();
  const results = [];

  for (const page of PAGES) {
    const t = await cdpHTTP('/json/new?' + encodeURIComponent('about:blank'))
      .catch(async () => {
        // Newer Chrome requires PUT for /json/new
        const res = await fetch('http://127.0.0.1:' + PORT + '/json/new?' +
          encodeURIComponent('about:blank'), { method: 'PUT' });
        return res.json();
      });

    const c = client(t.webSocketDebuggerUrl);
    await c.ready;

    const errors = [];
    const failed = [];

    await c.send('Runtime.enable');
    await c.send('Log.enable');
    await c.send('Network.enable');
    await c.send('Page.enable');

    const collect = setInterval(() => {
      while (c.events.length) {
        const e = c.events.shift();
        if (e.method === 'Runtime.exceptionThrown') {
          const d = e.params.exceptionDetails;
          errors.push('EXCEPTION: ' + (d.exception && d.exception.description || d.text));
        }
        if (e.method === 'Runtime.consoleAPICalled' && e.params.type === 'error') {
          errors.push('console.error: ' + e.params.args.map(a => a.value || a.description || '').join(' '));
        }
        if (e.method === 'Log.entryAdded' && e.params.entry.level === 'error') {
          const t = e.params.entry.text;
          if (!/favicon/i.test(t)) errors.push('log: ' + t);
        }
        if (e.method === 'Network.loadingFailed') {
          failed.push(e.params.errorText);
        }
      }
    }, 50);

    // Desktop pass
    await c.send('Emulation.setDeviceMetricsOverride',
      { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
    await c.send('Page.navigate', { url: BASE + encodeURIComponent(page) });
    await sleep(2600);

    const desktop = (await c.send('Runtime.evaluate',
      { expression: PROBE, returnByValue: true })).result.value;

    // Sweep the real device widths, smallest to largest.
    const widths = [320, 360, 390, 414, 480, 600, 744, 768, 820, 900, 912, 1024, 1180];
    let mobile = null; const overflow = [];
    for (const w of widths) {
      await c.send("Emulation.setDeviceMetricsOverride",
        { width: w, height: 844, deviceScaleFactor: 2, mobile: w < 1024 });
      await sleep(220);
      const r = (await c.send("Runtime.evaluate",
        { expression: PROBE, returnByValue: true })).result.value;
      if (r.docScrollW > w + 2) overflow.push(w + "px:" + r.docScrollW + (r.overflowing.length ? " [" + r.overflowing.join(", ") + "]" : ""));
      if (w === 390) mobile = r;
      if (w >= 861 && w <= 1024 && !r.navVisible && !r.hamburgerVisible) overflow.push(w + "px: NO NAVIGATION");
    }
    mobile.overflowWidths = overflow;

    clearInterval(collect);
    results.push({ page, errors: [...new Set(errors)], failed: [...new Set(failed)], desktop, mobile });

    c.close();
    await fetch('http://127.0.0.1:' + PORT + '/json/close/' + t.id).catch(() => {});
  }

  /* ---------------- report ---------------- */
  let problems = 0;
  console.log('='.repeat(74));
  console.log('PAGE AUDIT — headless Chrome, desktop 1280px + iPhone 390px');
  console.log('='.repeat(74));

  for (const r of results) {
    const d = r.desktop, m = r.mobile;
    const issues = [];
    if (r.errors.length) issues.push(...r.errors.map(e => 'JS ' + e));
    if (r.failed.length) issues.push(...r.failed.map(e => 'NET ' + e));
    if (d.emojiInText.length) issues.push('emoji still in text: ' + d.emojiInText.join(' '));
    if (!d.mogIconGlobal) issues.push('MOG_ICON not loaded');
    if (d.navLinks < 7) issues.push('nav links = ' + d.navLinks);
    if (!d.hamburger) issues.push('no hamburger button');
    if (d.footerHashLinks) issues.push(d.footerHashLinks + ' footer links still "#"');
    if (m.overflowWidths && m.overflowWidths.length) issues.push(...m.overflowWidths.map(x => 'OVERFLOW ' + x));
    if (d.hasForm && d.wireFormFn !== 'function') issues.push('form present but mogWireForm missing');

    const status = issues.length ? 'FAIL' : ' ok ';
    console.log('\n[' + status + '] ' + r.page +
      '   icons=' + d.icons + '  footerLinks=' + d.footerLinks + '  mobileW=' + m.docScrollW);
    issues.forEach(i => { console.log('        - ' + i); problems++; });
  }

  console.log('\n' + '='.repeat(74));
  console.log(problems ? problems + ' issue(s) found.' : 'No issues found across ' + results.length + ' pages.');

  chrome.kill();
  process.exit(0);
})().catch(e => { console.error(e); chrome.kill(); process.exit(1); });
