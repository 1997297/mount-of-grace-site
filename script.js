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