/* Update the shared impact figures after editing impact-data.json.
   Run from the project folder: node .build/update-impact.js */
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const data = require('./impact-data.json');
const escapeHtml = text => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

for (const name of fs.readdirSync(root).filter(name => name.endsWith('.html'))) {
  const file = path.join(root, name);
  const before = fs.readFileSync(file, 'utf8');
  const after = before.replace(
    /(<([a-z][a-z0-9]*)\b[^>]*\bdata-impact-metric="([^"]+)"[^>]*>)[^<]*(<\/\2>)/gi,
    (match, open, tag, key, close) => {
      const metric = data.metrics[key];
      if (!metric || !Number.isFinite(metric.value) || metric.value < 0) {
        throw new Error('Missing or invalid impact figure: ' + key);
      }
      return open + escapeHtml(metric.value.toLocaleString('en-US')) + close;
    }
  );
  if (after !== before) {
    fs.writeFileSync(file, after);
    console.log('Updated ' + name);
  }
}
