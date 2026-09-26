/* =========================================================
   FreshFind — Terms & Services Page JS
   - Reading progress bar
   - Sticky TOC active link highlighting
   - Back to top button
========================================================= */

(function () {
  "use strict";

  /* ── Progress bar ─────────────────────────────────────── */
  var bar = document.getElementById("legalProgress");

  function updateProgress() {
    if (!bar) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    bar.style.width = pct + "%";
  }

  /* ── Back to top ──────────────────────────────────────── */
  var btt = document.getElementById("backToTopLegal");

  function updateBTT() {
    if (!btt) return;
    if (window.scrollY > 400) {
      btt.classList.add("show");
    } else {
      btt.classList.remove("show");
    }
  }

  if (btt) {
    btt.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* ── TOC active link ──────────────────────────────────── */
  var tocLinks = document.querySelectorAll(".legal-toc__list a[href^='#']");
  var sections = [];

  tocLinks.forEach(function (link) {
    var id = link.getAttribute("href").slice(1);
    var el = document.getElementById(id);
    if (el) sections.push({ el: el, link: link });
  });

  function updateTOC() {
    var scrollY = window.scrollY;
    var offset = 120;
    var active = null;

    sections.forEach(function (s) {
      if (s.el.getBoundingClientRect().top + scrollY - offset <= scrollY) {
        active = s;
      }
    });

    tocLinks.forEach(function (l) { l.classList.remove("is-active"); });
    if (active) active.link.classList.add("is-active");
  }

  /* ── Smooth anchor click ──────────────────────────────── */
  tocLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var id = this.getAttribute("href").slice(1);
      var target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /* ── Scroll listener (throttled) ─────────────────────── */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress();
        updateBTT();
        updateTOC();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ── Init ─────────────────────────────────────────────── */
  updateProgress();
  updateBTT();
  updateTOC();

})();
