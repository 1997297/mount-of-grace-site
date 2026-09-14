/* =========================================================================
   MOUNT OF GRACE OUTREACH — SITE SCRIPT
   Loads on every page. Every lookup is guarded so a page that lacks a
   given component can never break the components that follow it.
   Requires icons-runtime.js to have loaded first (window.MOG_ICON).
   ========================================================================= */
(function () {
  'use strict';

  var ICON = window.MOG_ICON || {};
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------------
     iOS viewport unit fix.
     On iOS Safari 100vh includes the address bar, so full-height sections
     get clipped. We publish the real viewport height as --vh and use
     calc(var(--vh) * 100) in the stylesheet.
     --------------------------------------------------------------------- */
  function setViewportUnit() {
    document.documentElement.style.setProperty('--vh', window.innerHeight * 0.01 + 'px');
  }
  setViewportUnit();
  window.addEventListener('resize', setViewportUnit);
  window.addEventListener('orientationchange', function () {
    setTimeout(setViewportUnit, 200); // iOS reports the old size immediately
  });

  /* ---------------------------------------------------------------------
     ACTIVE NAV LINK
     --------------------------------------------------------------------- */
  var currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(function (link) {
    if (link.getAttribute('href') === currentPage) link.classList.add('active');
  });

  /* ---------------------------------------------------------------------
     MOBILE NAVIGATION
     --------------------------------------------------------------------- */
  var hamburgerBtn = document.getElementById('hamburgerBtn');
  var mainNav = document.getElementById('mainNav');

  if (hamburgerBtn && mainNav) {
    hamburgerBtn.setAttribute('aria-expanded', 'false');
    hamburgerBtn.setAttribute('aria-controls', 'mainNav');

    var setNav = function (open) {
      mainNav.classList.toggle('open', open);
      hamburgerBtn.classList.toggle('active', open);
      hamburgerBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      // Stop the page behind the drawer from scrolling on touch devices.
      document.body.classList.toggle('nav-open', open);
    };

    hamburgerBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      setNav(!mainNav.classList.contains('open'));
    });

    // Tapping a destination should close the drawer.
    mainNav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });

    document.addEventListener('click', function (e) {
      if (!mainNav.classList.contains('open')) return;
      if (mainNav.contains(e.target) || hamburgerBtn.contains(e.target)) return;
      setNav(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mainNav.classList.contains('open')) {
        setNav(false);
        hamburgerBtn.focus();
      }
    });

    // Rotating a tablet into a width where the full nav shows must not
    // leave the drawer state (and the body scroll lock) stuck on.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 1024) setNav(false);
    });
  }

  /* ---------------------------------------------------------------------
     SCROLL REVEAL
     --------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    var revealEls = document.querySelectorAll('.reveal');
    if (!revealEls.length) return;

    if (reduceMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(function (el) { observer.observe(el); });
  });

  /* ---------------------------------------------------------------------
     PROGRAM VIDEOS
     iOS refuses to autoplay unless a video is muted AND playsinline, and
     it rejects play() with a promise instead of throwing — so every call
     is caught to avoid unhandled rejections in the console.
     --------------------------------------------------------------------- */
  var videoEls = document.querySelectorAll('.program-video-el');

  videoEls.forEach(function (video) {
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
  });

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.catch === 'function') p.catch(function () { /* autoplay blocked */ });
  }

  document.querySelectorAll('.video-card').forEach(function (card) {
    var video = card.querySelector('.program-video-el');
    var btn = card.querySelector('.play-btn');
    if (!video || !btn) return;

    var syncBtn = function () {
      btn.innerHTML = video.paused ? ICON.play || '' : ICON.pause || '';
      btn.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
    };

    btn.addEventListener('click', function () {
      if (video.paused) safePlay(video); else video.pause();
    });

    video.addEventListener('play', syncBtn);
    video.addEventListener('pause', syncBtn);
    syncBtn();
  });

  if (videoEls.length && 'IntersectionObserver' in window && !reduceMotion) {
    var videoObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) safePlay(entry.target);
        else entry.target.pause();
      });
    }, { threshold: 0.5 });
    videoEls.forEach(function (video) { videoObserver.observe(video); });
  }

  /* ---------------------------------------------------------------------
     PROGRAMS PAGE — "SEE IMPACT" PANELS
     Exposed globally because the markup wires it with inline onclick.
     --------------------------------------------------------------------- */
  window.mogToggleImpact = function (panelId, btnEl) {
    var panel = document.getElementById(panelId);
    if (!panel) return;

    var wrap = btnEl.closest('.mog-card-wrap');
    var isOpen = !panel.hasAttribute('hidden');

    document.querySelectorAll('.mog-impact-panel').forEach(function (other) {
      if (other === panel || other.hasAttribute('hidden')) return;
      other.setAttribute('hidden', '');
      var otherWrap = other.closest('.mog-card-wrap');
      if (!otherWrap) return;
      otherWrap.classList.remove('is-open');
      var otherBtn = otherWrap.querySelector('.mog-see-impact');
      if (otherBtn) {
        otherBtn.innerHTML = '<span>See impact</span>' + (ICON.arrowDown || '');
        otherBtn.setAttribute('aria-expanded', 'false');
      }
    });

    if (isOpen) {
      panel.setAttribute('hidden', '');
      btnEl.innerHTML = '<span>See impact</span>' + (ICON.arrowDown || '');
    } else {
      panel.removeAttribute('hidden');
      btnEl.innerHTML = '<span>Hide details</span>' + (ICON.arrowUp || '');
    }
    btnEl.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    if (wrap) wrap.classList.toggle('is-open', !isOpen);
  };

  /* ---------------------------------------------------------------------
     HOME PAGE — PROGRAM CARD "LEARN MORE"
     --------------------------------------------------------------------- */
  function setHomeProgramLabel(btn, open) {
    var label = btn.querySelector('span:first-child');
    if (label) label.textContent = open ? 'Show less' : 'Learn more';
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    var dropdown = btn.closest('.program-card-wrap').querySelector('.home-program-dropdown');
    if (dropdown) dropdown.inert = !open;
  }

  window.toggleHomeProgram = function (btnEl) {
    var wrap = btnEl.closest('.program-card-wrap');
    if (!wrap) return;
    var isOpen = wrap.classList.contains('is-open');

    document.querySelectorAll('.program-card-wrap.is-open').forEach(function (openWrap) {
      if (openWrap === wrap) return;
      openWrap.classList.remove('is-open');
      var otherBtn = openWrap.querySelector('.home-program-toggle');
      if (otherBtn) setHomeProgramLabel(otherBtn, false);
    });

    wrap.classList.toggle('is-open', !isOpen);
    setHomeProgramLabel(btnEl, !isOpen);
  };

  document.addEventListener('click', function (e) {
    if (e.target.closest('.program-card-wrap')) return;
    document.querySelectorAll('.program-card-wrap.is-open').forEach(function (openWrap) {
      openWrap.classList.remove('is-open');
      var btn = openWrap.querySelector('.home-program-toggle');
      if (btn) setHomeProgramLabel(btn, false);
    });
  });

  /* ---------------------------------------------------------------------
     GALLERY — FILTER TABS
     --------------------------------------------------------------------- */
  var galleryTabs = document.querySelectorAll('.gallery-tab');
  if (galleryTabs.length) {
    var galleryItems = document.querySelectorAll('.gallery-item');

    galleryTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        galleryTabs.forEach(function (t) {
          t.classList.remove('active');
          t.setAttribute('aria-pressed', 'false');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-pressed', 'true');

        var filter = tab.dataset.filter;
        galleryItems.forEach(function (item) {
          item.classList.toggle('gallery-hide', filter !== 'all' && filter !== item.dataset.type);
        });
      });
    });

    if ('IntersectionObserver' in window && !reduceMotion) {
      var itemObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          itemObserver.unobserve(entry.target);
        });
      }, { threshold: 0.1 });
      galleryItems.forEach(function (item) { itemObserver.observe(item); });
    } else {
      galleryItems.forEach(function (item) { item.classList.add('is-visible'); });
    }
  }

  /* ---------------------------------------------------------------------
     GALLERY — LIGHTBOX
     --------------------------------------------------------------------- */
  var galleryGrid = document.querySelector('.gallery-grid');
  if (galleryGrid) {
    var lightbox = document.createElement('div');
    lightbox.className = 'gallery-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', 'Gallery viewer');
    lightbox.innerHTML =
      '<button type="button" class="gallery-lightbox-close" aria-label="Close">&times;</button>' +
      '<button type="button" class="gallery-lightbox-nav gallery-lightbox-prev" aria-label="Previous">&#10094;</button>' +
      '<div class="gallery-lightbox-stage"></div>' +
      '<button type="button" class="gallery-lightbox-nav gallery-lightbox-next" aria-label="Next">&#10095;</button>';
    document.body.appendChild(lightbox);

    var stage = lightbox.querySelector('.gallery-lightbox-stage');
    var currentIndex = 0;
    var visibleItems = [];
    var lastFocused = null;

    function clearStage() {
      var playing = stage.querySelector('video');
      if (playing) {
        playing.onerror = null;
        playing.pause();
        playing.removeAttribute('src');
        playing.load();
      }
      stage.textContent = '';
    }

    function showMediaError(media, message) {
      if (!stage.contains(media)) return;
      clearStage();
      var notice = document.createElement('p');
      notice.className = 'eyebrow-light';
      notice.setAttribute('role', 'status');
      notice.textContent = message;
      stage.appendChild(notice);
    }

    function renderStage(item) {
      clearStage();
      var src = item.dataset.src;
      lightbox.setAttribute('aria-label', item.dataset.caption || 'Gallery viewer');
      if (item.dataset.type === 'video') {
        var video = document.createElement('video');
        video.controls = true;
        video.preload = 'metadata';
        // Playback is requested only after the visitor opens or navigates the viewer.
        video.autoplay = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('aria-label', item.dataset.caption || 'Outreach video');
        video.onerror = function () {
          showMediaError(video, 'This video is not available yet. Please choose another video.');
        };
        video.src = src;
        stage.appendChild(video);
      } else {
        var img = document.createElement('img');
        var preview = item.querySelector('img');
        img.alt = item.dataset.caption || (preview ? preview.alt : 'Outreach photograph');
        img.onerror = function () {
          showMediaError(img, 'This photo could not load. Please choose another photo.');
        };
        img.src = src;
        stage.appendChild(img);
      }
    }

    function openLightbox(item) {
      lastFocused = document.activeElement;
      visibleItems = Array.prototype.slice
        .call(document.querySelectorAll('.gallery-item'))
        .filter(function (i) { return !i.classList.contains('gallery-hide'); });
      currentIndex = visibleItems.indexOf(item);
      renderStage(item);
      lightbox.classList.add('is-open');
      document.body.classList.add('gallery-lock-scroll');
      lightbox.querySelector('.gallery-lightbox-close').focus();
    }

    function closeLightbox() {
      lightbox.classList.remove('is-open');
      clearStage();
      document.body.classList.remove('gallery-lock-scroll');
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    function showByOffset(offset) {
      if (!visibleItems.length) return;
      currentIndex = (currentIndex + offset + visibleItems.length) % visibleItems.length;
      renderStage(visibleItems[currentIndex]);
    }

    document.querySelectorAll('.gallery-item').forEach(function (item) {
      // Keep every MP4 off the initial network path. A deliberate hover or
      // keyboard focus can request a still preview; opening requests playback.
      function preparePreview() {
        if (item.dataset.type !== 'video' || item.dataset.pending === 'true') return;
        var preview = item.querySelector('video');
        var source = preview && preview.querySelector('source[data-src]');
        if (!source || source.hasAttribute('src')) return;
        preview.preload = 'metadata';
        source.src = source.dataset.src;
        preview.load();
      }
      item.addEventListener('pointerenter', preparePreview, { once: true });
      item.addEventListener('focus', preparePreview, { once: true });
      item.addEventListener('click', function () { openLightbox(item); });
      item.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(item); }
      });
    });

    lightbox.querySelector('.gallery-lightbox-close').addEventListener('click', closeLightbox);
    lightbox.querySelector('.gallery-lightbox-prev').addEventListener('click', function (e) {
      e.stopPropagation(); showByOffset(-1);
    });
    lightbox.querySelector('.gallery-lightbox-next').addEventListener('click', function (e) {
      e.stopPropagation(); showByOffset(1);
    });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); return; }
      if (e.key === 'Tab') {
        var controls = lightbox.querySelectorAll('button, video[controls]');
        var first = controls[0];
        var last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
      if (e.target.tagName !== 'VIDEO') {
        if (e.key === 'ArrowRight') { e.preventDefault(); showByOffset(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); showByOffset(-1); }
      }
    });

    /* Swipe between images on touch devices. */
    var touchStartX = 0;
    stage.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });
    stage.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) > 50) showByOffset(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
})();
