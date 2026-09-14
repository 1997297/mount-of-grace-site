/* Professional stroke-icon set (24x24, currentColor, Lucide-style geometry).
   Exported as a plain map so the replacement script can inline them. */
const S = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"';

const P = {
  'book-open':   '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
  'hospital':    '<path d="M12 6v4"/><path d="M14 8h-4"/><path d="M4 22V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v16"/><path d="M2 22h20"/><path d="M9 22v-4h6v4"/>',
  'stethoscope': '<path d="M4 3H4a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h0"/><path d="M8 15v1a6 6 0 0 0 12 0v-4"/><circle cx="20" cy="10" r="2"/>',
  'flower':      '<circle cx="12" cy="12" r="2.6"/><path d="M12 16.6a4.6 4.6 0 1 1-4.6-4.6A4.6 4.6 0 1 1 12 7.4a4.6 4.6 0 1 1 4.6 4.6A4.6 4.6 0 1 1 12 16.6"/>',
  'construction':'<rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/>',
  'globe':       '<circle cx="12" cy="12" r="10"/><path d="M12 2a15 15 0 0 0 0 20"/><path d="M12 2a15 15 0 0 1 0 20"/><path d="M2 12h20"/>',
  'life-buoy':   '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="m4.93 4.93 4.24 4.24"/><path d="m14.83 9.17 4.24-4.24"/><path d="m14.83 14.83 4.24 4.24"/><path d="m9.17 14.83-4.24 4.24"/>',
  'users':       '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  'clipboard':   '<rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h4"/>',
  'heart':       '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  'hammer':      '<path d="m15 12-8.4 8.4a2.1 2.1 0 0 1-3-3L12 9"/><path d="M17.6 6.4 22 10.8"/><path d="m18 15 4-4"/><path d="m14.5 3.5 6 6"/><path d="M11.4 9.6 9 12l3 3 2.4-2.4"/>',
  'bar-chart':   '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><rect x="7" y="12" width="3" height="5" rx=".5"/><rect x="12" y="8" width="3" height="9" rx=".5"/><rect x="17" y="5" width="3" height="12" rx=".5"/>',
  'sprout':      '<path d="M7 20h10"/><path d="M12 20V10"/><path d="M12 10C12 6 9 4 5 4c0 4 3 6 7 6Z"/><path d="M12 13c0-3.3 2.7-6 6-6 0 3.3-2.7 6-6 6Z"/>',
  'leaf':        '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',
  'lock':        '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16.5" r="1.2"/>',
  'mail':        '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  'map-pin':     '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  'graduation':  '<path d="M21.42 10.42 12.83 6a2 2 0 0 0-1.66 0L2.58 10.42a1 1 0 0 0 0 1.79L11.17 16a2 2 0 0 0 1.66 0l8.59-3.79a1 1 0 0 0 0-1.79Z"/><path d="M22 11v5"/><path d="M6 13.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-3.5"/>',
  'droplet':     '<path d="M12 22a7 7 0 0 0 7-7c0-4-4.5-9-7-13-2.5 4-7 9-7 13a7 7 0 0 0 7 7Z"/>',
  'target':      '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  'sparkles':    '<path d="M12 3 13.9 8.6 19.5 10.5 13.9 12.4 12 18 10.1 12.4 4.5 10.5 10.1 8.6Z"/><path d="M18.5 16.5 19.2 18.3 21 19 19.2 19.7 18.5 21.5 17.8 19.7 16 19 17.8 18.3Z"/>',
  'search':      '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  'zap':         '<path d="M13 2 4.5 13.2A.6.6 0 0 0 5 14h6l-1 8 8.5-11.2A.6.6 0 0 0 18 10h-6Z"/>',
  'landmark':    '<path d="M3 22h18"/><path d="M5 22V10"/><path d="M19 22V10"/><path d="M9 22V10"/><path d="M15 22V10"/><path d="m12 2 9 5H3Z"/>',
  'receipt':     '<path d="M4 2v20l2-1.5L8 22l2-1.5L12 22l2-1.5L16 22l2-1.5L20 22V2l-2 1.5L16 2l-2 1.5L12 2l-2 1.5L8 2 6 3.5Z"/><path d="M8 8h8"/><path d="M8 12h8"/><path d="M8 16h5"/>',
  'user':        '<path d="M19 21v-2a5 5 0 0 0-5-5h-4a5 5 0 0 0-5 5v2"/><circle cx="12" cy="7" r="4"/>',
  'activity':    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  'wallet':      '<path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h15a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5"/><circle cx="17" cy="14" r="1.2"/>',
  'trending-up': '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
  'home':        '<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',
  'wheat':       '<path d="m2 22 6-6"/><path d="M12 2v4"/><path d="M9.5 4.5 12 7l2.5-2.5"/><path d="M9.5 9 12 11.5 14.5 9"/><path d="M9.5 13.5 12 16l2.5-2.5"/><path d="M12 11.5V20"/>',
  'laptop':      '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20"/>',
  'mic':         '<rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10v1a7 7 0 0 0 14 0v-1"/><path d="M12 18v4"/><path d="M8 22h8"/>',
  'school':      '<path d="M14 22v-4a2 2 0 0 0-4 0v4"/><path d="m18 10 3 2v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-9l3-2"/><path d="M18 5v17"/><path d="M6 5v17"/><path d="m12 2 6 3H6Z"/><path d="M12 9v2"/>',
  'play':        '<path d="M8 5.5v13a.5.5 0 0 0 .76.43l10.5-6.5a.5.5 0 0 0 0-.86L8.76 5.07A.5.5 0 0 0 8 5.5Z" fill="currentColor" stroke="none"/>',
  'pause':       '<rect x="7" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/><rect x="13" y="5" width="4" height="14" rx="1" fill="currentColor" stroke="none"/>',
  'diamond':     '<path d="m12 3 2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2Z"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m13 6 6 6-6 6"/>',
  'arrow-left':  '<path d="M19 12H5"/><path d="m11 18-6-6 6-6"/>',
  'arrow-down':  '<path d="M12 5v14"/><path d="m6 13 6 6 6-6"/>',
  'arrow-up':    '<path d="M12 19V5"/><path d="m6 11 6-6 6 6"/>',
  'shield':      '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  'file-text':   '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h5"/>',
  'handshake':   '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 1 0-2.8l.4-.4a2.4 2.4 0 0 1 3.4 0L21 8.4"/><path d="m21 3-3 3"/><path d="M3 8.4 5.6 5.8a2.4 2.4 0 0 1 3.4 0l1 1"/><path d="m3 3 3 3"/><path d="M8 12 6 14a1 1 0 1 0 3 3l1-1"/>',
  'calendar':    '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  'check':       '<path d="M20 6 9 17l-5-5"/>',
  'phone':       '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z"/>',
};

function icon(name, extraClass) {
  const body = P[name];
  if (!body) throw new Error('Unknown icon: ' + name);
  const cls = 'mog-icon' + (extraClass ? ' ' + extraClass : '');
  return '<svg class="' + cls + '" ' + S + '>' + body + '</svg>';
}

module.exports = { icon, names: Object.keys(P) };
