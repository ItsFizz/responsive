/* =========================================================
   FreshFind Navbar — Behavior
   1. Scroll state (top / scrolled)
   2. Mobile menu open/close + hamburger animation
   3. Bookmark counter (public API)
   4. Auth state:
      - Logged OUT → "Login / Signup" button → freshfind-login.html
      - Logged IN  → user capsule (name pill) + smooth dropdown
                     showing name, email, and Logout button
   ========================================================= */

(function () {
  "use strict";

  var navbar      = document.getElementById("ffNavbar");
  var hamburgerBtn = document.getElementById("ffHamburgerBtn");
  var mobileMenu  = document.getElementById("ffMobileMenu");
  var bookmarkCountEl = document.getElementById("ffBookmarkCount");
  var bookmarkBtn = document.getElementById("ffBookmarkBtn");

  if (!navbar) return;

  /* ── Scroll state ─────────────────────────────────────── */
  var SCROLL_THRESHOLD = 24;
  var ticking = false;

  function updateScrollState() {
    navbar.setAttribute("data-ff-state", window.scrollY > SCROLL_THRESHOLD ? "scrolled" : "top");
    ticking = false;
  }
  window.addEventListener("scroll", function () {
    if (!ticking) { window.requestAnimationFrame(updateScrollState); ticking = true; }
  }, { passive: true });
  updateScrollState();

  /* ── Mobile menu ──────────────────────────────────────── */
  var menuIsOpen = false;

  function openMobileMenu() {
    if (!mobileMenu || !hamburgerBtn) return;
    menuIsOpen = true;
    mobileMenu.hidden = false;
    void mobileMenu.offsetHeight;
    mobileMenu.classList.add("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "true");
    hamburgerBtn.setAttribute("aria-label", "Close menu");
  }

  function closeMobileMenu(returnFocus) {
    if (!mobileMenu || !hamburgerBtn) return;
    menuIsOpen = false;
    mobileMenu.classList.remove("is-open");
    hamburgerBtn.setAttribute("aria-expanded", "false");
    hamburgerBtn.setAttribute("aria-label", "Open menu");
    var onEnd = function (e) {
      if (e.target === mobileMenu && e.propertyName === "max-height") {
        mobileMenu.hidden = true;
        mobileMenu.removeEventListener("transitionend", onEnd);
      }
    };
    mobileMenu.addEventListener("transitionend", onEnd);
    if (returnFocus) hamburgerBtn.focus();
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener("click", function () {
    menuIsOpen ? closeMobileMenu(false) : openMobileMenu();
  });

  if (mobileMenu) {
    mobileMenu.querySelectorAll("[data-ff-nav-link]").forEach(function (link) {
      link.addEventListener("click", function () { closeMobileMenu(false); });
    });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (menuIsOpen) closeMobileMenu(true);
      closeDropdown();
    }
  });

  window.addEventListener("resize", function () {
    if (menuIsOpen && window.innerWidth > 900) closeMobileMenu(false);
  });

  /* ── Active link ──────────────────────────────────────── */
  document.querySelectorAll("[data-ff-nav-link]").forEach(function (link) {
    link.addEventListener("click", function () {
      document.querySelectorAll("[data-ff-nav-link]").forEach(function (l) {
        var match = l.getAttribute("href") === link.getAttribute("href");
        l.classList.toggle("is-active", match);
        if (match) l.setAttribute("aria-current", "page");
        else l.removeAttribute("aria-current");
      });
    });
  });

  /* ── Bookmark counter ─────────────────────────────────── */
  function setBookmarkCount(count) {
    var n = Math.max(0, parseInt(count, 10) || 0);
    if (bookmarkCountEl) bookmarkCountEl.textContent = String(n);
    if (bookmarkBtn) bookmarkBtn.setAttribute("aria-label", "View saved items (" + n + ")");
  }

  /* ── Auth helpers ─────────────────────────────────────── */
  function getUser() {
    try {
      var raw = localStorage.getItem("freshfind_user");
      if (!raw) return null;
      var u = JSON.parse(raw);
      return (u && u.loggedIn) ? u : null;
    } catch (e) { return null; }
  }

  function doLogout() {
    localStorage.removeItem("freshfind_user");
    localStorage.removeItem("freshfind_token");
    window.location.href = "index.html";
  }

  /* ── Dropdown ─────────────────────────────────────────── */
  var dropdownEl = null;
  var dropdownOpen = false;
  var pillRef = null; // keep reference to position the body-appended dropdown

  function positionDropdown() {
    if (!dropdownEl || !pillRef) return;
    var rect = pillRef.getBoundingClientRect();
    dropdownEl.style.top  = (rect.bottom + window.scrollY + 8) + "px";
    dropdownEl.style.left = "auto";
    dropdownEl.style.right = (document.documentElement.clientWidth - rect.right) + "px";
  }

  function closeDropdown() {
    if (!dropdownEl || !dropdownOpen) return;
    dropdownOpen = false;
    dropdownEl.classList.remove("ff-user-dropdown--open");
    if (pillRef) pillRef.setAttribute("aria-expanded", "false");
    setTimeout(function () {
      if (!dropdownOpen && dropdownEl) dropdownEl.setAttribute("aria-hidden", "true");
    }, 260);
  }

  function openDropdown() {
    if (!dropdownEl) return;
    dropdownOpen = true;
    positionDropdown();
    dropdownEl.setAttribute("aria-hidden", "false");
    void dropdownEl.offsetHeight;
    dropdownEl.classList.add("ff-user-dropdown--open");
    if (pillRef) pillRef.setAttribute("aria-expanded", "true");
  }

  function toggleDropdown() {
    dropdownOpen ? closeDropdown() : openDropdown();
  }

  /* Reposition on scroll/resize so it follows the pill */
  window.addEventListener("scroll",  positionDropdown, { passive: true });
  window.addEventListener("resize",  positionDropdown);

  /* Close when clicking outside */
  document.addEventListener("click", function (e) {
    if (!dropdownOpen) return;
    var capsule = navbar.querySelector(".ff-user-capsule");
    if (capsule && !capsule.contains(e.target) &&
        dropdownEl && !dropdownEl.contains(e.target)) {
      closeDropdown();
    }
  });

  /* ── Build logged-in capsule ──────────────────────────── */
  function buildCapsule(user, authEl, isMobile) {
    var firstName = (user.name || "User").split(" ")[0];
    var initial   = firstName.charAt(0).toUpperCase();

    /* ---- wrapper that replaces the old auth link ---- */
    var wrapper = document.createElement("div");
    wrapper.className = "ff-user-capsule" + (isMobile ? " ff-user-capsule--mobile" : "");

    /* pill button */
    var pill = document.createElement("button");
    pill.type = "button";
    pill.className = "ff-user-pill";
    pill.setAttribute("aria-haspopup", "true");
    pill.setAttribute("aria-expanded", "false");
    pill.setAttribute("aria-label", "Account menu for " + firstName);

    var avatar = document.createElement("span");
    avatar.className = "ff-user-pill__avatar";
    avatar.textContent = initial;

    var name = document.createElement("span");
    name.className = "ff-user-pill__name";
    name.textContent = firstName;

    var chevron = document.createElement("span");
    chevron.className = "ff-user-pill__chevron";
    chevron.setAttribute("aria-hidden", "true");
    chevron.innerHTML = '<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    pill.appendChild(avatar);
    pill.appendChild(name);
    pill.appendChild(chevron);

    /* dropdown panel */
    var dropdown = document.createElement("div");
    dropdown.className = "ff-user-dropdown";
    dropdown.setAttribute("aria-hidden", "true");
    dropdown.setAttribute("role", "menu");

    /* profile card inside dropdown */
    var card = document.createElement("div");
    card.className = "ff-user-dropdown__card";

    var bigAvatar = document.createElement("div");
    bigAvatar.className = "ff-user-dropdown__avatar";
    bigAvatar.textContent = initial;

    var info = document.createElement("div");
    info.className = "ff-user-dropdown__info";

    var dName = document.createElement("p");
    dName.className = "ff-user-dropdown__name";
    dName.textContent = user.name || firstName;

    var dEmail = document.createElement("p");
    dEmail.className = "ff-user-dropdown__email";
    dEmail.textContent = user.email || "";

    info.appendChild(dName);
    info.appendChild(dEmail);
    card.appendChild(bigAvatar);
    card.appendChild(info);

    /* divider */
    var divider = document.createElement("hr");
    divider.className = "ff-user-dropdown__divider";

    /* logout button */
    var logoutBtn = document.createElement("button");
    logoutBtn.type = "button";
    logoutBtn.className = "ff-user-dropdown__logout";
    logoutBtn.setAttribute("role", "menuitem");
    logoutBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> Logout';
    logoutBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      doLogout();
    });

    dropdown.appendChild(card);
    dropdown.appendChild(divider);
    dropdown.appendChild(logoutBtn);

    /* wire pill → toggle */
    pill.addEventListener("click", function (e) {
      e.stopPropagation();
      pillRef = pill;
      toggleDropdown();
    });

    wrapper.appendChild(pill);
    /* Append dropdown to body so it escapes overflow:hidden on .ff-navbar__inner */
    document.body.appendChild(dropdown);

    /* store reference so Escape / outside-click can close it */
    dropdownEl = dropdown;

    return wrapper;
  }

  /* ── Build logged-out link ────────────────────────────── */
  function buildLoginLink(isMobile) {
    var a = document.createElement("a");
    a.href = "freshfind-login.html";
    a.className = isMobile ? "ff-mobile-menu__auth" : "ff-navbar__auth";
    a.textContent = "Login / Signup";
    return a;
  }

  /* ── Init auth state ──────────────────────────────────── */
  function initAuthState() {
    var user = getUser();

    /* ---- Desktop auth slot ---- */
    var desktopAuth = navbar.querySelector(".ff-navbar__auth");
    if (desktopAuth) {
      if (user) {
        desktopAuth.replaceWith(buildCapsule(user, desktopAuth, false));
      } else {
        desktopAuth.setAttribute("href", "freshfind-login.html");
        desktopAuth.textContent = "Login / Signup";
      }
    }

    /* ---- Mobile auth slot ---- */
    var mobileAuth = navbar.querySelector(".ff-mobile-menu__auth");
    if (mobileAuth) {
      if (user) {
        /* mobile: simpler — just show name + inline logout */
        mobileAuth.textContent = "";
        mobileAuth.removeAttribute("href");
        mobileAuth.className = "ff-mobile-menu__auth ff-mobile-menu__auth--user";

        var mName = document.createElement("span");
        mName.textContent = (user.name || "User").split(" ")[0];

        var mOut = document.createElement("button");
        mOut.type = "button";
        mOut.className = "ff-mobile-logout-btn";
        mOut.textContent = "Logout";
        mOut.addEventListener("click", function (e) {
          e.stopPropagation();
          doLogout();
        });

        mobileAuth.appendChild(mName);
        mobileAuth.appendChild(mOut);
      } else {
        mobileAuth.setAttribute("href", "freshfind-login.html");
        mobileAuth.textContent = "Login / Signup";
        mobileAuth.className = "ff-mobile-menu__auth";
      }
    }
  }

  initAuthState();

  /* ── Public API ───────────────────────────────────────── */
  window.FreshFindNavbar = {
    setBookmarkCount: setBookmarkCount,
    openMobileMenu:   openMobileMenu,
    closeMobileMenu:  closeMobileMenu
  };

})();
