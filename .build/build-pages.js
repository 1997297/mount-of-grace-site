/* Applies the shared header, footer and iOS head tags to every full page. */
const fs = require('fs');
const { header, FOOTER, HEAD_TAGS } = require('./shared.js');

const STUBS = new Set([
  'community-dev.html', 'devdrey.html', 'diaspora-giving.html',
  'food-financial-aid.html', 'christmas-outreach.html', 'disability-support.html',
  'education-youth.html', 'healthcare.html', 'privacy-policy.html',
  'terms-of-us.html', 'womens-empowerment.html',
]);

/* Which nav item should read as active on each page. */
const ACTIVE = {
  'index.html': 'index.html',
  'about.html': 'about.html',
  'programs.html': 'programs.html',
  'impact.html': 'impact.html',
  'gallery.html': 'gallery.html',
  'involved.html': 'involved.html',
  'contact.html': 'contact.html',
  'donate.html': 'index.html',
  'accounts.html': 'index.html',
  'sponsorship.html': 'involved.html',
};

function replaceBlock(src, openRe, closeTag, replacement, file, what) {
  const m = openRe.exec(src);
  if (!m) { console.log('  ! ' + file + ': no ' + what + ' found — skipped'); return src; }
  const start = m.index;
  const end = src.indexOf(closeTag, start);
  if (end === -1) { console.log('  ! ' + file + ': unterminated ' + what); return src; }
  return src.slice(0, start) + replacement + src.slice(end + closeTag.length);
}

let done = 0;
for (const file of fs.readdirSync('.').filter(f => /\.html$/.test(f))) {
  if (STUBS.has(file)) continue;
  let src = fs.readFileSync(file, 'utf8');

  /* ---- head: viewport + iOS meta ---- */
  src = src.replace(
    /[ \t]*<meta name="viewport"[^>]*>\n/,
    HEAD_TAGS + '\n'
  );

  /* ---- header ---- */
  src = replaceBlock(
    src, /<header class="site-header">/, '</header>',
    header(ACTIVE[file] || ''), file, 'header'
  );

  /* ---- footer ---- */
  src = replaceBlock(
    src, /<footer[^>]*class="site-footer[^>]*>/, '</footer>',
    FOOTER, file, 'footer'
  );

  fs.writeFileSync(file, src);
  console.log('  built ' + file);
  done++;
}
console.log('\nFull pages rebuilt: ' + done);
