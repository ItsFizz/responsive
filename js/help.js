/* =========================================================
   FreshFind — Help Centre JS
   - Live search (filters accordion items instantly)
   - Category filter cards
   - Accordion open/close with smooth animation
   - Progress bar + back to top
========================================================= */

(function () {
  "use strict";

  /* ── Elements ─────────────────────────────────────────── */
  var searchInput  = document.getElementById("helpSearch");
  var clearBtn     = document.getElementById("helpSearchClear");
  var accordion    = document.getElementById("helpAccordion");
  var faqTitle     = document.getElementById("helpFaqTitle");
  var faqCount     = document.getElementById("helpFaqCount");
  var noResults    = document.getElementById("helpNoResults");
  var catCards     = document.querySelectorAll(".help-cat-card");
  var bar          = document.getElementById("helpProgress");
  var btt          = document.getElementById("backToTopHelp");
  var allItems     = document.querySelectorAll(".help-item");

  /* ── State ────────────────────────────────────────────── */
  var activeCategory = "all";
  var searchQuery    = "";

  /* ── Progress bar ─────────────────────────────────────── */
  function updateProgress() {
    if (!bar) return;
    var scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0) + "%";
  }

  /* ── Back to top ──────────────────────────────────────── */
  if (btt) {
    btt.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
  function updateBTT() {
    if (btt) btt.classList.toggle("show", window.scrollY > 400);
  }

  /* ── Accordion ────────────────────────────────────────── */
  allItems.forEach(function (item) {
    var btn = item.querySelector(".help-item__btn");
    if (!btn) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      /* close all */
      allItems.forEach(function (i) { i.classList.remove("is-open"); });
      /* toggle clicked */
      if (!isOpen) item.classList.add("is-open");
    });
  });

  /* ── Filter engine ────────────────────────────────────── */
  function applyFilters() {
    var query = searchQuery.toLowerCase().trim();
    var visibleCount = 0;

    allItems.forEach(function (item) {
      var cat   = item.getAttribute("data-category") || "all";
      var qText = (item.getAttribute("data-search") || "").toLowerCase();

      var catMatch    = activeCategory === "all" || cat === activeCategory;
      var searchMatch = !query || qText.includes(query);

      if (catMatch && searchMatch) {
        item.classList.remove("is-hidden");
        visibleCount++;
      } else {
        item.classList.add("is-hidden");
        item.classList.remove("is-open");
      }
    });

    /* Update count badge */
    if (faqCount) faqCount.textContent = visibleCount + " article" + (visibleCount !== 1 ? "s" : "");

    /* No-results state */
    if (noResults) noResults.classList.toggle("visible", visibleCount === 0);

    /* Update title */
    if (faqTitle) {
      if (activeCategory !== "all") {
        var activeCard = document.querySelector(".help-cat-card.is-active");
        if (activeCard) {
          var titleEl = activeCard.querySelector(".help-cat-card__title");
          faqTitle.textContent = titleEl ? titleEl.textContent : "Results";
        }
      } else {
        faqTitle.textContent = query ? "Search Results" : "All Articles";
      }
    }
  }

  /* ── Search input ─────────────────────────────────────── */
  if (searchInput) {
    searchInput.addEventListener("input", function () {
      searchQuery = this.value;
      if (clearBtn) clearBtn.classList.toggle("visible", searchQuery.length > 0);
      applyFilters();
      /* Auto-expand first visible result when searching */
      if (searchQuery.length > 1) {
        var first = accordion ? accordion.querySelector(".help-item:not(.is-hidden)") : null;
        if (first && !first.classList.contains("is-open")) {
          allItems.forEach(function (i) { i.classList.remove("is-open"); });
          first.classList.add("is-open");
        }
      }
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      if (searchInput) { searchInput.value = ""; searchInput.focus(); }
      searchQuery = "";
      clearBtn.classList.remove("visible");
      applyFilters();
    });
  }

  /* ── Category cards ───────────────────────────────────── */
  catCards.forEach(function (card) {
    card.addEventListener("click", function () {
      catCards.forEach(function (c) { c.classList.remove("is-active"); });
      card.classList.add("is-active");
      activeCategory = card.getAttribute("data-cat") || "all";
      /* Clear search when switching categories */
      if (searchInput) { searchInput.value = ""; }
      searchQuery = "";
      if (clearBtn) clearBtn.classList.remove("visible");
      applyFilters();
      /* Smooth scroll to FAQ section */
      var faqSection = document.getElementById("helpFaqSection");
      if (faqSection) faqSection.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  /* ── Scroll listener ──────────────────────────────────── */
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        updateProgress(); updateBTT(); ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  /* ── Init ─────────────────────────────────────────────── */
  updateProgress(); updateBTT(); applyFilters();

  /* Open first item by default */
  var firstItem = accordion ? accordion.querySelector(".help-item") : null;
  if (firstItem) firstItem.classList.add("is-open");

})();
