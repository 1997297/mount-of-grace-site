const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

document.querySelectorAll(".nav-link").forEach(link => {
    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
    }
});

document.addEventListener("DOMContentLoaded", () => {
  const revealEls = document.querySelectorAll(".reveal");

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target); // animate once, then stop watching
      }
    });
  }, {
    threshold: 0.15, // triggers when 15% of the element is visible
  });

  revealEls.forEach(el => observer.observe(el));
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mainNav = document.getElementById("mainNav");

hamburgerBtn.addEventListener("click", () => {
    mainNav.classList.toggle("open");
    hamburgerBtn.classList.toggle("active");
});

document.querySelectorAll('.video-card').forEach(card => {
  const video = card.querySelector('.program-video-el');
  const btn = card.querySelector('.play-btn');

  btn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      btn.textContent = '⏸';
    } else {
      video.pause();
      btn.textContent = '▶';
    }
  });
});

const videoEls = document.querySelectorAll('.program-video-el');

const videoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const video = entry.target;
    if (entry.isIntersecting) {
      video.play();
    } else {
      video.pause();
    }
  });
}, { threshold: 0.5 });

videoEls.forEach(video => videoObserver.observe(video));

function mogToggleImpact(panelId, btnEl) {
  var panel = document.getElementById(panelId);
  if (!panel) return;

  var wrap = btnEl.closest('.mog-card-wrap');
  var isOpen = !panel.hasAttribute('hidden');

  // Close every other open panel first
  document.querySelectorAll('.mog-impact-panel').forEach(function (otherPanel) {
    if (otherPanel === panel) return;
    if (!otherPanel.hasAttribute('hidden')) {
      otherPanel.setAttribute('hidden', '');
      var otherWrap = otherPanel.closest('.mog-card-wrap');
      if (otherWrap) {
        otherWrap.classList.remove('is-open');
        var otherBtn = otherWrap.querySelector('.mog-see-impact');
        if (otherBtn) otherBtn.textContent = 'See impact ↓';
      }
    }
  });

  // Then toggle the clicked one
  if (isOpen) {
    panel.setAttribute('hidden', '');
    btnEl.textContent = 'See impact ↓';
    if (wrap) wrap.classList.remove('is-open');
  } else {
    panel.removeAttribute('hidden');
    btnEl.textContent = 'Hide details ↑';
    if (wrap) wrap.classList.add('is-open');
  }
}

/* ---------- HOME PAGE PROGRAM CARD "LEARN MORE" DROPDOWN ---------- */
function toggleHomeProgram(btnEl) {
  var wrap = btnEl.closest('.program-card-wrap');
  if (!wrap) return;

  var isOpen = wrap.classList.contains('is-open');

  // close any other open program card first (mutually exclusive, like the impact panels)
  document.querySelectorAll('.program-card-wrap.is-open').forEach(function (openWrap) {
    if (openWrap === wrap) return;
    openWrap.classList.remove('is-open');
    var otherBtn = openWrap.querySelector('.home-program-toggle');
    if (otherBtn) otherBtn.firstChild.textContent = 'Learn more ';
  });

  // then toggle the clicked one
  wrap.classList.toggle('is-open', !isOpen);
  btnEl.firstChild.textContent = isOpen ? 'Learn more ' : 'Show less ';
}

// clicking anywhere outside a program card closes any open dropdown
document.addEventListener('click', function (e) {
  if (e.target.closest('.program-card-wrap')) return;
  document.querySelectorAll('.program-card-wrap.is-open').forEach(function (openWrap) {
    openWrap.classList.remove('is-open');
    var btn = openWrap.querySelector('.home-program-toggle');
    if (btn) btn.firstChild.textContent = 'Learn more ';
  });
});

/* ---------- CONTACT FORM ---------- */
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const successPanel = document.getElementById('contactSuccess');
    contactForm.hidden = true;
    successPanel.hidden = false;
    successPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });
}

/* ---------- GALLERY PAGE TABS ---------- */
const galleryTabs = document.querySelectorAll('.gallery-tab');
if (galleryTabs.length) {
  const galleryItems = document.querySelectorAll('.gallery-item');

  galleryTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      galleryTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const filter = tab.dataset.filter;
      galleryItems.forEach(item => {
        item.classList.toggle('gallery-hide', filter !== 'all' && filter !== item.dataset.type);
      });
    });
  });

  const galleryItemObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        galleryItemObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  galleryItems.forEach(item => galleryItemObserver.observe(item));
}

/* ---------- GALLERY LIGHTBOX (popup viewer) ---------- */
const galleryGrid = document.querySelector('.gallery-grid');
if (galleryGrid) {
  const lightbox = document.createElement('div');
  lightbox.className = 'gallery-lightbox';
  lightbox.innerHTML = `
    <button type="button" class="gallery-lightbox-close" aria-label="Close">&times;</button>
    <button type="button" class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Previous">&#10094;</button>
    <div class="gallery-lightbox-stage"></div>
    <button type="button" class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Next">&#10095;</button>
  `;
  document.body.appendChild(lightbox);

  const stage = lightbox.querySelector('.gallery-lightbox-stage');
  let currentIndex = 0;
  let visibleItems = [];

  function getVisibleItems() {
    return Array.from(document.querySelectorAll('.gallery-item')).filter(item => !item.classList.contains('gallery-hide'));
  }

  function renderStage(item) {
    stage.innerHTML = '';
    const src = item.dataset.src;
    if (item.dataset.type === 'video') {
      const video = document.createElement('video');
      video.src = src;
      video.controls = true;
      video.autoplay = true;
      stage.appendChild(video);
    } else {
      const img = document.createElement('img');
      img.src = src;
      stage.appendChild(img);
    }
  }

  function openLightbox(item) {
    visibleItems = getVisibleItems();
    currentIndex = visibleItems.indexOf(item);
    renderStage(item);
    lightbox.classList.add('is-open');
    document.body.classList.add('gallery-lock-scroll');
  }

  function closeLightbox() {
    lightbox.classList.remove('is-open');
    stage.innerHTML = ''; // stops any playing video immediately
    document.body.classList.remove('gallery-lock-scroll');
  }

  function showByOffset(offset) {
    if (!visibleItems.length) return;
    currentIndex = (currentIndex + offset + visibleItems.length) % visibleItems.length;
    renderStage(visibleItems[currentIndex]);
  }

  document.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click', () => openLightbox(item));
  });

  lightbox.querySelector('.gallery-lightbox-close').addEventListener('click', closeLightbox);
  lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', (e) => { e.stopPropagation(); showByOffset(-1); });
  lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', (e) => { e.stopPropagation(); showByOffset(1); });

  // clicking the dark background (outside the image/video itself) closes the popup
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') showByOffset(1);
    if (e.key === 'ArrowLeft') showByOffset(-1);
  });
}