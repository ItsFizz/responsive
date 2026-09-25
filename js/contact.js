/* =========================================================
   FreshFind — Contact Us page logic
   - scroll progress, back-to-top, reveal on scroll
   - contact form: validation + hand-off to the user's email app
     (no backend, per the SRS constraints)
   - office hours: highlights today and shows open / closed
   - map: office location, or a route from the visitor's
     live location (Geolocation API + Google Maps embed)
   - rule-based chatbot and the demo login modal
========================================================= */

const OFFICE = { lat: 40.705, lng: -73.97, email: 'hello@freshfind.example' };

// Office hours by weekday (0 = Sunday), in minutes from midnight
const OFFICE_HOURS = {
  0: null,
  1: [540, 1020], 2: [540, 1020], 3: [540, 1020], 4: [540, 1020], 5: [540, 1020],
  6: [540, 780],
};

const $ = id => document.getElementById(id);

function showToast(text) {
  const toast = $('toast');
  toast.textContent = text;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function formatMinutes(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${period}`;
}

function distanceKm(a, b) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/* ---------------------------------------------------------
   SCROLL (the navbar itself is handled by navbar.js)
--------------------------------------------------------- */
function initScrollExtras() {
  const bar = $('scrollProgress');
  const backToTop = $('backToTop');

  const update = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = `${scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0}%`;
    backToTop.classList.toggle('show', window.scrollY > 500);
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
  backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initReveal() {
  const items = document.querySelectorAll('.reveal');
  if (!('IntersectionObserver' in window)) {
    items.forEach(el => el.classList.add('in-view'));
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  items.forEach(el => observer.observe(el));
}

/* ---------------------------------------------------------
   OFFICE HOURS
--------------------------------------------------------- */
function initOfficeHours() {
  const status = $('officeStatus');

  function update() {
    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const today = OFFICE_HOURS[day];

    document.querySelectorAll('#hoursTable tr').forEach(row => {
      row.classList.toggle('is-today', row.dataset.days.split(',').map(Number).includes(day));
    });

    const isOpen = today && minutes >= today[0] && minutes < today[1];
    status.classList.toggle('is-open', Boolean(isOpen));

    if (isOpen) {
      status.textContent = `Open now · closes at ${formatMinutes(today[1])}`;
      return;
    }
    if (today && minutes < today[0]) {
      status.textContent = `Closed · opens today at ${formatMinutes(today[0])}`;
      return;
    }
    // find the next day with hours
    for (let i = 1; i <= 7; i++) {
      const next = OFFICE_HOURS[(day + i) % 7];
      if (next) {
        const label = i === 1 ? 'tomorrow' : new Date(now.getTime() + i * 864e5).toLocaleDateString([], { weekday: 'long' });
        status.textContent = `Closed · opens ${label} at ${formatMinutes(next[0])}`;
        return;
      }
    }
  }

  update();
  setInterval(update, 60 * 1000);
}

/* ---------------------------------------------------------
   CONTACT FORM
--------------------------------------------------------- */
function initContactForm() {
  const form = $('contactForm');
  const success = $('formSuccess');
  const message = $('cMessage');
  const counter = $('charCount');
  const marketField = $('marketField');

  const rules = {
    cName: v => (v.trim().length >= 2 ? '' : 'Please enter your name.'),
    cEmail: v => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.'),
    cMessage: v => (v.trim().length >= 10 ? '' : 'A few more words, please (at least 10 characters).'),
  };

  function validateField(id) {
    const input = $(id);
    const error = rules[id](input.value);
    input.closest('.form-field').classList.toggle('has-error', Boolean(error));
    input.setAttribute('aria-invalid', String(Boolean(error)));
    form.querySelector(`[data-error-for="${id}"]`).textContent = error;
    return !error;
  }

  // validate a field once the visitor leaves it, then live while they fix it
  Object.keys(rules).forEach(id => {
    const input = $(id);
    input.addEventListener('blur', () => validateField(id));
    input.addEventListener('input', () => {
      if (input.closest('.form-field').classList.contains('has-error')) validateField(id);
    });
  });

  message.addEventListener('input', () => {
    counter.textContent = `${message.value.length} / ${message.maxLength}`;
  });

  // the "which market?" field only matters for market-related topics
  form.querySelectorAll('input[name="topic"]').forEach(radio => {
    radio.addEventListener('change', () => {
      const needsMarket = ['Wrong market timing', 'List my market'].includes(radio.value);
      marketField.hidden = !needsMarket;
    });
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    const results = Object.keys(rules).map(validateField);
    if (results.includes(false)) {
      const firstInvalid = form.querySelector('.has-error input, .has-error textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const data = new FormData(form);
    const topic = data.get('topic');
    const market = (data.get('market') || '').trim();
    const body = [
      data.get('message').trim(),
      '',
      market ? `Market: ${market}` : '',
      `— ${data.get('name').trim()} (${data.get('email').trim()})`,
    ].filter((line, i, arr) => line || arr[i - 1]).join('\n');

    const subject = `[FreshFind] ${topic}${market ? ` — ${market}` : ''}`;
    window.location.href = `mailto:${OFFICE.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    form.hidden = true;
    success.hidden = false;
  });

  $('newMessageBtn').addEventListener('click', () => {
    form.reset();
    counter.textContent = `0 / ${message.maxLength}`;
    marketField.hidden = true;
    success.hidden = true;
    form.hidden = false;
    $('cName').focus();
  });
}

/* ---------------------------------------------------------
   MAP + LIVE LOCATION
--------------------------------------------------------- */
function initMap() {
  const frame = $('mapFrame');
  const status = $('mapStatus');
  const locateBtn = $('locateBtn');
  const resetBtn = $('resetMapBtn');
  const officeSrc = frame.src;

  locateBtn.addEventListener('click', () => {
    if (!('geolocation' in navigator)) {
      status.textContent = 'Your browser does not support location access.';
      return;
    }
    locateBtn.disabled = true;
    status.textContent = 'Finding your location…';

    navigator.geolocation.getCurrentPosition(
      pos => {
        const me = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const km = distanceKm(me, OFFICE);
        frame.src = `https://www.google.com/maps?saddr=${me.lat},${me.lng}&daddr=${OFFICE.lat},${OFFICE.lng}&output=embed`;
        frame.title = 'Map showing the route from your location to the FreshFind office';
        status.textContent = `Route from your location · about ${km < 10 ? km.toFixed(1) : Math.round(km)} km away (straight line).`;
        resetBtn.hidden = false;
        locateBtn.disabled = false;
      },
      err => {
        status.textContent = err.code === err.PERMISSION_DENIED
          ? 'Location permission was declined — showing the office only.'
          : 'Could not get your location right now. Please try again.';
        locateBtn.disabled = false;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });

  resetBtn.addEventListener('click', () => {
    frame.src = officeSrc;
    frame.title = 'Map showing the FreshFind office';
    status.textContent = 'Showing the FreshFind office in Harbor View.';
    resetBtn.hidden = true;
  });
}

/* ---------------------------------------------------------
   CHATBOT (rule-based, pre-scripted — no external AI)
--------------------------------------------------------- */
const CHAT_RULES = [
  { keys: ['hi', 'hello', 'hey'], reply: 'Hello! Ask me about office hours, directions, reply times or listing a market.' },
  { keys: ['hour', 'open', 'timing', 'time', 'close'], reply: 'The office is open Monday–Friday 9 AM–5 PM and Saturday 9 AM–1 PM. We are closed on Sundays.' },
  { keys: ['where', 'address', 'office', 'direction', 'location', 'map'], reply: 'We are at 123 Greenway Avenue, Harbor View. Tap “Show route from my location” above the map for directions.' },
  { keys: ['list', 'add', 'organiser', 'organizer', 'my market'], reply: 'Choose “List my market” in the form and include the name, address, days and hours, and typical produce. Listing is free.' },
  { keys: ['reply', 'long', 'response', 'wait'], reply: 'We reply within one working day.' },
  { keys: ['wrong', 'incorrect', 'mistake', 'update'], reply: 'Sorry about that! Pick “Wrong timing” in the form and tell us which market — we will check with the organiser.' },
  { keys: ['email', 'phone', 'call', 'contact'], reply: 'Email hello@freshfind.example or call (555) 018-2024.' },
  { keys: ['thank', 'thanks'], reply: 'You are welcome!' },
];

function chatReply(text) {
  const lower = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  CHAT_RULES.forEach(rule => {
    const score = rule.keys.filter(k => new RegExp(`\\b${k}`).test(lower)).length;
    if (score > bestScore) { best = rule; bestScore = score; }
  });
  return best ? best.reply : 'I am not sure about that one. Try the form on this page and the team will help.';
}

function initChatbot() {
  const launcher = $('chatbotLauncher');
  const win = $('chatWindow');
  const body = $('chatBody');
  const form = $('chatForm');
  const input = $('chatInput');

  function toggle(open) {
    win.classList.toggle('open', open);
    win.setAttribute('aria-hidden', String(!open));
    if (open) input.focus();
  }

  function add(text, from) {
    const msg = document.createElement('div');
    msg.className = `msg ${from}`;
    msg.textContent = text;
    body.appendChild(msg);
    body.scrollTop = body.scrollHeight;
  }

  function ask(text) {
    add(text, 'user');
    const typing = document.createElement('div');
    typing.className = 'msg bot typing';
    typing.innerHTML = '<span></span><span></span><span></span>';
    body.appendChild(typing);
    body.scrollTop = body.scrollHeight;
    setTimeout(() => { typing.remove(); add(chatReply(text), 'bot'); }, 550);
  }

  launcher.addEventListener('click', () => toggle(!win.classList.contains('open')));
  $('closeChat').addEventListener('click', () => toggle(false));

  form.addEventListener('submit', e => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    ask(text);
  });

  $('quickReplies').addEventListener('click', e => {
    const btn = e.target.closest('button[data-q]');
    if (btn) ask(btn.dataset.q);
  });
}

/* ---------------------------------------------------------
   BOOTSTRAP
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  initScrollExtras();
  initReveal();
  initOfficeHours();
  initContactForm();
  initMap();
  initChatbot();
});
