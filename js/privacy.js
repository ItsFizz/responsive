/* =========================================================
   FreshFind — Privacy Policy Page JS
========================================================= */
(function () {
  "use strict";

  var bar = document.getElementById("privProgress");
  var btt = document.getElementById("backToTopPriv");
  var tocLinks = document.querySelectorAll(".priv-toc__list a[href^='#']");
  var sections = [];

  tocLinks.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    var el = document.getElementById(id);
    if (el) sections.push({ el: el, link: link });
  });

  function updateProgress() {
    if (!bar) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0) + "%";
  }

  function updateBTT() {
    if (!btt) return;
    btt.classList.toggle("show", window.scrollY > 400);
  }

  function updateTOC() {
    var scrollY = window.scrollY;
    var offset = 120;
    var active = null;
    sections.forEach(function (s) {
      if (s.el.getBoundingClientRect().top + scrollY - offset <= scrollY) active = s;
    });
    tocLinks.forEach(function (l) { l.classList.remove("is-active"); });
    if (active) active.link.classList.add("is-active");
  }

  tocLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var el = document.getElementById(this.getAttribute("href").slice(1));
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  if (btt) btt.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress(); updateBTT(); updateTOC(); ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  updateProgress(); updateBTT(); updateTOC();
})();
