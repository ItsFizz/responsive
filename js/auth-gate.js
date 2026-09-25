/* =========================================================
   FreshFind — Auth Gate
   Protected pages only (not index / login / signup).
   Shows a stylish "Login Required" toast, then redirects.
   ========================================================= */

(function () {
  "use strict";

  var PUBLIC_PAGES = ["index.html", "freshfind-login.html", "freshfind-signup.html", ""];

  function isLoggedIn() {
    try {
      var raw = localStorage.getItem("freshfind_user");
      if (!raw) return false;
      var user = JSON.parse(raw);
      return !!(user && user.loggedIn);
    } catch (e) { return false; }
  }

  function getCurrentPage() {
    var path = window.location.pathname;
    return path.substring(path.lastIndexOf("/") + 1) || "index.html";
  }

  var page = getCurrentPage();
  if (PUBLIC_PAGES.indexOf(page) !== -1) return;
  if (isLoggedIn()) return;

  /* ── Save intended destination ── */
  try { sessionStorage.setItem("freshfind_redirect", window.location.href); } catch (e) {}

  /* ── Inject toast CSS ── */
  var style = document.createElement("style");
  style.textContent = [
    "@keyframes ff-toast-in{from{opacity:0;transform:translateY(20px) scale(.94)}to{opacity:1;transform:translateY(0) scale(1)}}",
    "@keyframes ff-toast-out{from{opacity:1;transform:translateY(0) scale(1)}to{opacity:0;transform:translateY(16px) scale(.94)}}",
    "@keyframes ff-progress{from{width:100%}to{width:0%}}",
    "#ff-auth-toast{",
      "position:fixed;bottom:28px;right:28px;z-index:99999;",
      "background:#1F4635;color:#fff;",
      "padding:0;border-radius:16px;",
      "box-shadow:0 8px 32px rgba(15,35,25,.35),0 2px 8px rgba(15,35,25,.18);",
      "width:320px;max-width:calc(100vw - 40px);",
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Manrope',sans-serif;",
      "animation:ff-toast-in .38s cubic-bezier(.34,1.56,.64,1) forwards;",
      "overflow:hidden;",
    "}",
    "#ff-auth-toast.ff-toast-hiding{animation:ff-toast-out .28s ease forwards;}",
    "#ff-auth-toast-body{padding:18px 18px 14px;}",
    "#ff-auth-toast-top{display:flex;align-items:flex-start;gap:13px;}",
    "#ff-auth-toast-icon{",
      "width:40px;height:40px;border-radius:10px;flex-shrink:0;",
      "background:rgba(255,255,255,.15);",
      "display:flex;align-items:center;justify-content:center;",
    "}",
    "#ff-auth-toast-icon svg{display:block;}",
    "#ff-auth-toast-text{flex:1;min-width:0;}",
    "#ff-auth-toast-title{",
      "font-size:.95rem;font-weight:700;margin:0 0 3px;color:#fff;letter-spacing:-.01em;",
    "}",
    "#ff-auth-toast-msg{",
      "font-size:.8rem;margin:0;color:rgba(255,255,255,.75);line-height:1.45;",
    "}",
    "#ff-auth-toast-actions{display:flex;gap:8px;margin-top:14px;}",
    "#ff-auth-toast-login{",
      "flex:1;padding:.55rem 1rem;border-radius:8px;border:none;cursor:pointer;",
      "background:#6F9F72;color:#fff;font-size:.82rem;font-weight:700;",
      "font-family:inherit;transition:background .2s;",
    "}",
    "#ff-auth-toast-login:hover{background:#5a8a5d;}",
    "#ff-auth-toast-dismiss{",
      "padding:.55rem .9rem;border-radius:8px;border:1px solid rgba(255,255,255,.22);",
      "background:transparent;color:rgba(255,255,255,.8);font-size:.82rem;font-weight:600;",
      "cursor:pointer;font-family:inherit;transition:background .2s,color .2s;",
    "}",
    "#ff-auth-toast-dismiss:hover{background:rgba(255,255,255,.12);color:#fff;}",
    "#ff-auth-toast-bar{height:3px;background:rgba(255,255,255,.18);}",
    "#ff-auth-toast-progress{",
      "height:100%;background:#6F9F72;",
      "animation:ff-progress 2.2s linear forwards;",
    "}"
  ].join("");
  document.head.appendChild(style);

  /* ── Build toast DOM ── */
  var toast = document.createElement("div");
  toast.id = "ff-auth-toast";
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");

  toast.innerHTML = [
    '<div id="ff-auth-toast-body">',
      '<div id="ff-auth-toast-top">',
        '<div id="ff-auth-toast-icon">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
            '<rect x="3" y="11" width="18" height="11" rx="2"/>',
            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
          '</svg>',
        '</div>',
        '<div id="ff-auth-toast-text">',
          '<p id="ff-auth-toast-title">Login Required</p>',
          '<p id="ff-auth-toast-msg">Please sign in to access this page.</p>',
        '</div>',
      '</div>',
      '<div id="ff-auth-toast-actions">',
        '<button id="ff-auth-toast-login">Login / Sign Up</button>',
        '<button id="ff-auth-toast-dismiss">Dismiss</button>',
      '</div>',
    '</div>',
    '<div id="ff-auth-toast-bar"><div id="ff-auth-toast-progress"></div></div>'
  ].join("");

  /* Wait for body to exist before appending */
  function mountToast() {
    document.body.appendChild(toast);

    function doRedirect() {
      toast.classList.add("ff-toast-hiding");
      setTimeout(function () {
        window.location.replace("freshfind-login.html");
      }, 300);
    }

    /* Auto-redirect after 2.5s (progress bar matches) */
    var timer = setTimeout(doRedirect, 2500);

    /* Login button — redirect immediately */
    document.getElementById("ff-auth-toast-login").addEventListener("click", function () {
      clearTimeout(timer);
      doRedirect();
    });

    /* Dismiss — remove toast, also redirect (page is protected anyway) */
    document.getElementById("ff-auth-toast-dismiss").addEventListener("click", function () {
      clearTimeout(timer);
      doRedirect();
    });
  }

  if (document.body) {
    mountToast();
  } else {
    document.addEventListener("DOMContentLoaded", mountToast);
  }

})();
