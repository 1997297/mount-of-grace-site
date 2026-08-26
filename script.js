<<<<<<< HEAD
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
=======
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
>>>>>>> 4ad081f4413be317721746244afb3de1df682dc6
});