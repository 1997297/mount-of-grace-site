/* The header and footer markup shared by every page, plus the head tags
   that make the site behave on iOS. Imported by build-pages.js. */

const NAV = [
  ['index.html', 'Home'],
  ['about.html', 'About'],
  ['programs.html', 'Programs'],
  ['impact.html', 'Impact'],
  ['gallery.html', 'Gallery'],
  ['involved.html', 'Get Involved'],
  ['contact.html', 'Contact'],
];

function header(current) {
  const links = NAV.map(([href, label]) => {
    const active = href === current ? ' active' : '';
    return `      <a href="${href}" class="nav-link${active}">${label}</a>`;
  }).join('\n');

  return `<header class="site-header">
  <div class="container header-inner">
    <a href="index.html" class="logo">
      <img src="assets/mog-logo.png" alt="Mount of Grace Outreach" class="logo-img">
      <span class="logo-text">
        Mount of Grace
        <small>OUTREACH</small>
      </span>
    </a>
    <nav class="main-nav" id="mainNav">
${links}
      <a href="donate.html" class="btn btn-primary btn-sm mobile-donate">Donate</a>
    </nav>
    <a href="donate.html" class="btn btn-primary btn-sm desktop-donate">Donate</a>
    <button class="hamburger" id="hamburgerBtn" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mainNav">
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    </button>
  </div>
</header>`;
}

// Social links can be restored when the organisation supplies its profile URLs.
const SOCIAL = '';

/* One footer for the whole site. Every link points at a page that exists —
   the old footers used "#" for all ten programme and legal links. */
const FOOTER = `<footer class="site-footer">
  <div class="container footer-grid">

    <div class="footer-brand">
      <a href="index.html" class="logo">
        <img src="assets/mog-logo.png" alt="Mount of Grace Outreach" class="logo-img">
        <span class="logo-text light">
          Mount of Grace
          <small>OUTREACH</small>
        </span>
      </a>
      <p>Practical care and support for people and communities in Nigeria and the United States.</p>
${SOCIAL}
    </div>

    <div class="footer-col">
      <h4>Organization</h4>
      <a href="about.html">About Us</a>
      <a href="programs.html">Our Programmes</a>
      <a href="impact.html">Our Impact</a>
      <a href="gallery.html">Gallery</a>
      <a href="contact.html">Contact</a>
    </div>

    <div class="footer-col">
      <h4>Programmes</h4>
      <a href="food-financial-aid.html">Food &amp; Financial Aid for Widows and the Elderly</a>
      <a href="christmas-outreach.html">Christmas Outreach for the Less Privileged</a>
      <a href="disability-support.html">Support for the Physically Challenged</a>
      <a href="healthcare.html">Medical Outreach</a>
      <a href="education-youth.html">Education &amp; Youth Development</a>
    </div>

    <div class="footer-col">
      <h4>Get Involved</h4>
      <a href="involved.html">Volunteer With Us</a>
      <a href="donate.html">Make a Donation</a>
      <a href="sponsorship.html">Support a Programme</a>
      <a href="accounts.html">Bank Details</a>
    </div>

    <div class="footer-col footer-contact">
      <h4>Contact</h4>
      <div class="footer-contact-item">
        <span class="footer-contact-label">Where we serve</span>
        <p>Nigeria and the United States</p>
      </div>
      <div class="footer-contact-item">
        <span class="footer-contact-label">Phone</span>
        <a href="tel:+2348132097971">0813 209 7971</a>
        <a href="tel:+2348069135196">0806 913 5196</a>
        <a href="tel:+2347031181996">0703 118 1996</a>
      </div>
      <div class="footer-contact-item">
        <span class="footer-contact-label">Email</span>
        <a href="mailto:info@mountofgrace.org">info@mountofgrace.org</a>
      </div>
    </div>

  </div>

  <div class="container footer-bottom">
    <span>&copy; 2026 Mount of Grace Outreach. All rights reserved.</span>
    <div class="footer-legal">
      <a href="privacy-policy.html">Privacy Policy</a>
      <a href="terms-of-us.html">Terms of Use</a>
      <a href="devdrey.html">Designed by Devdrey</a>
    </div>
  </div>
</footer>`;

/* Head tags every page needs for correct mobile / iOS rendering. */
const HEAD_TAGS = `<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#0e2a1e">
<meta name="format-detection" content="telephone=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Mount of Grace">
<link rel="apple-touch-icon" href="assets/favicon.png">`;

module.exports = { header, FOOTER, HEAD_TAGS, NAV };
