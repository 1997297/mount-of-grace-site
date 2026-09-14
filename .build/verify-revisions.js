/* Read-only checks for the revised static site. No form submissions or builds. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.resolve(__dirname, '..');
const pages = fs.readdirSync(root).filter(f => f.endsWith('.html'));
const failures = [];
const expectedMissing = new Set();
const approved = [
  'Food & Financial Aid for Widows and the Elderly',
  'Christmas Outreach for the Less Privileged',
  'Support for the Physically Challenged',
  'Medical Outreach',
  'Education & Youth Development',
];
const decode = value => value.replace(/&amp;/g, '&').replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"');
function check(condition, message) { if (!condition) failures.push(message); }
function exactFile(relative) {
  let current = root;
  for (const part of relative.replace(/\\/g, '/').split('/').filter(Boolean)) {
    if (!fs.existsSync(current) || !fs.statSync(current).isDirectory()) return false;
    if (!fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return fs.existsSync(current);
}
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const visible = decode(html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<!--[\s\S]*?-->/g, '').replace(/<[^>]*>/g, ' '));
  check(!/Shelter\s*&?\s*Housing|Diaspora Giving|diaspora-backed|Community Development|Emergency (?:Support|Relief)|Thirteen Years|13 Years|Healthcare Access|Women's Empowerment/i.test(visible), file + ': retired programme or timeline copy');
  for (const match of html.matchAll(/\b(?:href|src|poster|data-src)\s*=\s*["']([^"']+)["']/g)) {
    let value = decode(match[1]);
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/i.test(value)) continue;
    const [rawFile, fragment] = value.split('#');
    const relative = decodeURIComponent(rawFile.split('?')[0]);
    // The owner explicitly restored the original social profile placeholders.
    if (!relative && !fragment) {
      if (!(file === 'contact.html' && value === '#')) failures.push(file + ': empty link');
      continue;
    }
    if (relative && !exactFile(relative)) {
      if (relative === 'assets/v19.mp4' && file === 'gallery.html') expectedMissing.add(relative);
      else failures.push(file + ': missing or incorrectly cased path ' + relative);
    }
    const destination = relative || file;
    if (fragment && destination.endsWith('.html') && exactFile(destination)) {
      const dest = fs.readFileSync(path.join(root, destination), 'utf8');
      check(dest.includes('id="' + fragment + '"') || dest.includes("id='" + fragment + "'"), file + ': missing anchor ' + value);
    }
  }
  for (const match of html.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)) {
    const relative = decode(match[1]);
    if (/^(?:https?:|data:)/.test(relative)) continue;
    check(exactFile(relative), file + ': missing background ' + relative);
  }
  for (const match of html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)) {
    try { new vm.Script(match[1], { filename: file }); } catch (e) { failures.push(e.message); }
  }
}
for (const file of ['index.html', 'programs.html']) {
  const html = decode(fs.readFileSync(path.join(root, file), 'utf8'));
  for (const name of approved) check(html.includes('<h3>' + name + '</h3>') || html.includes(name), file + ': missing programme ' + name);
  const className = file === 'index.html' ? 'program-card-wrap' : 'mog-card-wrap';
  check((html.match(new RegExp('class="' + className + '(?:\\s[^\"]*)?"', 'g')) || []).length === 5, file + ': expected five programme cards');
}
const gallery = fs.readFileSync(path.join(root, 'gallery.html'), 'utf8');
// The exact media sequence matters more than the order of HTML attributes.
const galleryItems = [...gallery.matchAll(/<[^>]*class="gallery-item(?:\s[^\"]*)?"[^>]*>/g)].map(m => m[0]);
const gallerySources = type => galleryItems.filter(t => t.includes('data-type="' + type + '"')).map(t => /data-src="([^"]+)"/.exec(t)?.[1]);
const photoSources = gallerySources('photo');
const videoSources = gallerySources('video');
check(photoSources.length === 89, 'Gallery must contain 89 photos');
check(videoSources.length === 25, 'Gallery must contain 25 video slots');
const expectedPhotos = Array.from({length: 89}, (_, i) => 'assets/' + (i === 0 ? '1_result' : i + 1) + '.webp');
check(JSON.stringify(photoSources) === JSON.stringify(expectedPhotos), 'Gallery photo order/paths differ from the approved library');
check(videoSources.every((src, i) => src?.toLowerCase() === 'assets/v' + (i + 1) + '.mp4'), 'Gallery video order differs from v1 through v25');
check(galleryItems.filter(t => t.includes('data-type="video"')).every((tag, i) => tag.includes('data-caption="v' + (i + 1) + '"')), 'Gallery video labels must be v1 through v25');
check(!/<video[^>]*\bautoplay/.test(gallery), 'Gallery previews must not autoplay');
const impact = fs.readFileSync(path.join(root, 'impact.html'), 'utf8');
check(impact.includes('Seven Years of Change'), 'Impact seven-year heading missing');
for (const number of [6, 36, 21, 48, 3, 67]) check(impact.includes('assets/' + number + '.webp'), 'Field photo missing: ' + number);
const field = /<div class="impact-gallery-grid">([\s\S]*?)<\/div>/.exec(impact)?.[1] || '';
check((field.match(/<img\b/g) || []).length === 9, 'From the Field must contain nine photos');
check(!/Provisional figures, pending/i.test(impact), 'Removed impact notice must stay removed');
for (const [key, value] of Object.entries({peopleReached: '1,384', mobilitySupport: '89', educationParticipants: '263'})) {
  check(impact.includes('data-impact-metric="' + key + '">' + value + '<'), 'Impact figure does not match correction: ' + key);
}
for (const file of fs.readdirSync(root).filter(f => f.endsWith('.js'))) {
  try { new vm.Script(fs.readFileSync(path.join(root, file), 'utf8'), { filename: file }); } catch (e) { failures.push(e.message); }
}
console.log('Checked ' + pages.length + ' pages, programme scope, media sequence, links, exact filename casing and JavaScript syntax.');
if (expectedMissing.size) console.log('Expected missing media, left for the owner: ' + [...expectedMissing].join(', '));
for (const failure of [...new Set(failures)]) console.error('FAIL: ' + failure);
console.log(failures.length ? failures.length + ' checks failed.' : 'All checks passed.');
process.exitCode = failures.length ? 1 : 0;
