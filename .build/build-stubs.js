/* Rebuild approved programme content with the existing page components.
   Run with --programs-only for this bounded content update. Live legal and
   credit pages are maintained directly and are never regenerated from old copy. */
const fs = require('fs');
const { header, FOOTER, HEAD_TAGS } = require('./shared.js');
const { icon } = require('./icons.js');
const { PROGRAMS, RETIRED_PROGRAMME_PAGES } = require('./content.js');

const esc = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ctaCopy = 'A meal, medical support, mobility assistance or the chance to keep learning can mean more than we sometimes realise. Your support helps Mount of Grace reach people at moments when a little help can make a real difference.';

function page(programme, body) {
  const existing = fs.existsSync(programme.file) ? fs.readFileSync(programme.file, 'utf8') : '';
  const currentHeader = existing.match(/<header class="site-header">[\s\S]*?<\/header>/)?.[0] || header('programs.html');
  const currentFooter = existing.match(/<footer class="site-footer">[\s\S]*?<\/footer>/)?.[0] || FOOTER;
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
${HEAD_TAGS}
<title>${esc(programme.title)} | Mount of Grace Outreach</title>
<meta name="description" content="${esc(programme.sub)}">
<link rel="icon" type="image/png" href="assets/favicon.png">
<link rel="stylesheet" href="styles.css">
</head>
<body>
${currentHeader}
${body}
${currentFooter}
<script src="icons-runtime.js"></script>
<script src="script.js"></script>
</body>
</html>
`;
}

function programmeBody(p) {
  const facts = p.facts.map(([label, text]) => `        <div class="prog-fact">
          <div class="prog-fact-num">${esc(label)}</div>
          <div class="prog-fact-label">${esc(text)}</div>
        </div>`).join('\n');
  const pillars = p.pillars.map(([name, heading, text]) => `        <article class="prog-pillar">
          <div class="prog-pillar-icon">${icon(name)}</div>
          <h3>${esc(heading)}</h3>
          <p>${esc(text)}</p>
        </article>`).join('\n');
  const lead = p.lead.map((text, i) => `        <p${i === 0 ? ' class="prog-lead-first"' : ''}>${esc(text)}</p>`).join('\n');
  const serve = p.serve.map(text => `          <li>${icon('check')}${esc(text)}</li>`).join('\n');
  const help = p.help.map(([heading, text]) => `          <li>${icon('arrow-right')}<strong>${esc(heading)}.</strong> ${esc(text)}</li>`).join('\n');
  return `<!-- HERO -->
<section class="prog-hero">
  <div class="prog-hero-bg" style="background-image: url('${esc(p.bg)}');"></div>
  <div class="container prog-hero-content reveal">
    <a href="programs.html" class="prog-crumb">${icon('arrow-left', 'mog-icon--lead')}All Programs</a>
    <span class="eyebrow eyebrow-light">${p.eyebrow}</span>
    <h1 class="prog-hero-title">${p.h1}</h1>
    <p class="prog-hero-sub">${esc(p.sub)}</p>
  </div>
</section>

<!-- OVERVIEW -->
<section class="prog-intro">
  <div class="container prog-intro-grid reveal">
    <div class="prog-lead">
${lead}
    </div>
    <aside class="prog-facts">
      <h3>What this support means</h3>
${facts}
      <a href="donate.html" class="btn btn-primary">Support this programme</a>
    </aside>
  </div>
</section>

<!-- WHAT WE DO -->
<section class="prog-pillars">
  <div class="container reveal">
    <div class="section-head">
      <span class="eyebrow">WHAT WE DO</span>
      <h2 class="section-title">Inside the programme</h2>
    </div>
    <div class="prog-pillar-grid">
${pillars}
    </div>
  </div>
</section>

<!-- WHO WE SERVE -->
<section class="prog-serve">
  <div class="container prog-serve-grid reveal">
    <div class="prog-serve-col">
      <h3>Who we serve</h3>
      <ul class="prog-list">
${serve}
      </ul>
    </div>
    <div class="prog-serve-col">
      <h3>How you can help</h3>
      <ul class="prog-list">
${help}
      </ul>
    </div>
  </div>
</section>

<!-- CTA -->
<section class="cta-band reveal">
  <div class="cta-inner">
    <span class="eyebrow">GET INVOLVED</span>
    <h2 class="section-title cta-story-title"><span>Someone's story can change</span> <em>because you chose to help.</em></h2>
    <p>${ctaCopy}</p>
    <div class="cta-actions">
      <a href="donate.html" class="btn btn-primary">Donate</a>
      <a href="involved.html" class="btn btn-outline">Get Involved</a>
    </div>
  </div>
</section>`;
}

function programmeCard(p, index) {
  // Existing colour classes are presentation tokens, retained to preserve card styling.
  const colourClass = ['mog-icon-education', 'mog-icon-health', 'mog-icon-women', 'mog-icon-community', 'mog-icon-diaspora'][index];
  return `      <div class="mog-card-wrap" id="${p.id}">
        <article class="mog-card">
          <div class="mog-card-media">
            <img src="${esc(p.bg)}" alt="${esc(p.alt)}" width="${p.width}" height="${p.height}" loading="lazy" decoding="async">
            <div class="mog-card-label">
              <span class="mog-card-icon ${colourClass}">${icon(p.icon)}</span>
              <h3>${esc(p.title)}</h3>
            </div>
          </div>
          <div class="mog-card-body">
            <p class="mog-card-kicker">${esc(p.kicker)}</p>
            <p class="mog-desc">${esc(p.sub)}</p>
            <button type="button" class="mog-see-impact" aria-expanded="false" aria-controls="panel-${p.id}" onclick="mogToggleImpact('panel-${p.id}', this)"><span>See impact</span>${icon('arrow-down', 'mog-icon--trail')}</button>
          </div>
        </article>
        <div class="mog-impact-panel" id="panel-${p.id}" hidden>
          <div class="mog-impact-topline"></div>
          <div class="mog-impact-content">
            <div class="mog-impact-stats">
              <p class="mog-impact-heading">How this helps</p>
              <ul class="mog-impact-list">
${p.pillars.map(([, , text]) => `                <li>${esc(text)}</li>`).join('\n')}
              </ul>
            </div>
            <div class="mog-impact-serve">
              <p class="mog-impact-heading">Who we serve</p>
              <p>${esc(p.serve.slice(0, 2).join('. '))}.</p>
            </div>
          </div>
          <div class="mog-panel-actions">
            <a href="${p.file}" class="mog-support-btn mog-support-btn--ghost"><span>Read more</span>${icon('arrow-right', 'mog-icon--trail')}</a>
            <a href="donate.html" class="mog-support-btn">Support this programme</a>
          </div>
        </div>
      </div>`;
}

function replaceSection(src, className, section) {
  const pattern = new RegExp('<section class="' + className + '">[\\s\\S]*?<\\/section>');
  if (!pattern.test(src)) throw new Error('Missing existing section: ' + className);
  return src.replace(pattern, section);
}

function buildProgrammeIndex() {
  let src = fs.readFileSync('programs.html', 'utf8');
  src = replaceSection(src, 'mog-hero', `<section class="mog-hero">
    <div class="mog-hero-inner reveal">
      <p class="eyebrow" style="justify-content:center;">WHAT WE DO</p>
      <h1>Five programmes.<em>Care in action.</em></h1>
      <p>Practical support for people facing difficult circumstances. We serve communities in Nigeria and the United States through five areas of work.</p>
    </div>
  </section>`);
  src = replaceSection(src, 'mog-programs-section', `<section class="mog-programs-section">
    <div class="mog-grid reveal">
${PROGRAMS.map(programmeCard).join('\n\n')}
    </div>
  </section>`);
  const steps = [
    ['users', 'Listen to people in the community'],
    ['clipboard', 'Understand where help is needed'],
    ['heart', 'Bring people and resources together'],
    ['handshake', 'Provide practical support'],
    ['bar-chart', 'Learn from each outreach'],
  ];
  src = replaceSection(src, 'mog-how reveal', `<section class="mog-how reveal">
    <p class="eyebrow">How we work</p>
    <h2>Start by listening.<em>Follow through with care.</em></h2>
    <div class="mog-steps">
${steps.map(([name, text], i) => `      <div class="mog-step">
        <div class="mog-step-icon">${icon(name)}</div>
        <p class="mog-step-num">0${i + 1}</p>
        <p class="mog-step-label">${text}</p>
      </div>`).join('\n')}
    </div>
  </section>`);
  src = replaceSection(src, 'mog-cta reveal', `<section class="mog-cta reveal">
    <h2 class="cta-story-title"><span>Someone's story can change</span> <em>because you chose to help.</em></h2>
    <p>${ctaCopy}</p>
    <div class="cta-actions">
      <a href="donate.html" class="btn btn-primary">Donate</a>
      <a href="involved.html" class="btn btn-outline">Get Involved</a>
    </div>
  </section>`);
  const meta = '<meta name="description" content="Explore Mount of Grace\'s five programmes providing practical support in Nigeria and the United States.">';
  src = /<meta name="description"/.test(src) ? src.replace(/<meta name="description"[^>]*>/, meta) : src.replace('</title>', '</title>\n' + meta);
  fs.writeFileSync('programs.html', src);
  console.log('  built programs.html');
}

function writeRetiredPage(file) {
  fs.writeFileSync(file, `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="refresh" content="0; url=programs.html">
<meta name="robots" content="noindex, follow">
<link rel="canonical" href="programs.html">
<link rel="stylesheet" href="styles.css">
<title>Our Programmes | Mount of Grace Outreach</title>
</head>
<body>
<main class="legal-page">
  <div class="container legal-wrap">
    <h1>Our programmes</h1>
    <p><a href="programs.html">Explore Mount of Grace's five programmes.</a></p>
  </div>
</main>
</body>
</html>
`);
  console.log('  redirected ' + file + ' to programs.html');
}

buildProgrammeIndex();
for (const p of PROGRAMS) {
  fs.writeFileSync(p.file, page(p, programmeBody(p)));
  console.log('  built ' + p.file);
}
RETIRED_PROGRAMME_PAGES.forEach(writeRetiredPage);

if (!process.argv.includes('--programs-only')) {
  for (const file of ['privacy-policy.html', 'terms-of-us.html', 'devdrey.html']) {
    console.log('  preserved live page: ' + file);
  }
}
console.log('Programme content updated. Shared styling and other page content preserved.');
