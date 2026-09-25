/* =========================================================
   FreshFind — Ask Sprout (chatbot) page logic
   - every answer comes from the JSON data in chatbot-data.js
     (no backend, works from file:// as well)
   - matching order: market search → best-scoring intent
     (keywords + typo tolerance) → search links for anything else
   - small, safe Markdown renderer for the bot's replies
========================================================= */

const $ = id => document.getElementById(id);

let DATA = null;
const lastPick = {}; // intent id → index of the last reply used, to avoid repeats

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// words people type → day index (English + Roman Urdu)
const DAY_WORDS = {
  sunday: 0, sun: 0, itwar: 0, itwaar: 0,
  monday: 1, mon: 1, peer: 1, pir: 1,
  tuesday: 2, tue: 2, tues: 2, mangal: 2,
  wednesday: 3, wed: 3, budh: 3,
  thursday: 4, thu: 4, thur: 4, thurs: 4, jumeraat: 4, jumerat: 4,
  friday: 5, fri: 5, juma: 5, jumma: 5,
  saturday: 6, sat: 6, hafta: 6, hafte: 6,
};

// words people type → produce category used in the JSON
const PRODUCE_WORDS = {
  vegetable: 'Vegetables', vegetables: 'Vegetables', veggies: 'Vegetables', veg: 'Vegetables', sabzi: 'Vegetables', sabziyan: 'Vegetables',
  fruit: 'Fruits', fruits: 'Fruits', phal: 'Fruits',
  honey: 'Honey', shehad: 'Honey', shahad: 'Honey',
  dairy: 'Dairy', milk: 'Dairy', cheese: 'Dairy', doodh: 'Dairy', yogurt: 'Dairy', dahi: 'Dairy',
  bakery: 'Bakery', bread: 'Bakery', cake: 'Bakery', breads: 'Bakery',
  herb: 'Herbs', herbs: 'Herbs',
  egg: 'Eggs', eggs: 'Eggs', anday: 'Eggs', anda: 'Eggs', ande: 'Eggs',
  flower: 'Flowers', flowers: 'Flowers', phool: 'Flowers',
};

// intents that should lose to a real topic when both match ("hi, what is gravity?")
const SMALL_TALK = new Set(['greeting', 'thanks', 'bye', 'compliment', 'how_are_you']);

/* ---------------------------------------------------------
   TEXT HELPERS
--------------------------------------------------------- */
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/'s\b/g, 's')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance, capped — only used for short typo checks
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 2;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
}

function pick(id, list) {
  if (list.length === 1) return list[0];
  let i;
  do { i = Math.floor(Math.random() * list.length); } while (i === lastPick[id]);
  lastPick[id] = i;
  return list[i];
}

const toMinutes = hhmm => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

function formatTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h >= 12 ? 'PM' : 'AM'}`;
}

/* ---------------------------------------------------------
   DYNAMIC VALUES used inside JSON replies ({email}, {officeStatus} …)
--------------------------------------------------------- */
function officeStatus() {
  const now = new Date();
  const hours = DATA.office.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (hours && mins >= toMinutes(hours[0]) && mins < toMinutes(hours[1])) {
    return `🟢 We're **open right now** — until ${formatTime(hours[1])} today.`;
  }
  return '🔴 We\'re **closed right now**, but you can still send a message from the Contact Us page.';
}

function isMarketOpen(m, now = new Date()) {
  const mins = now.getHours() * 60 + now.getMinutes();
  return m.days.includes(DAY_NAMES[now.getDay()]) && mins >= toMinutes(m.open) && mins < toMinutes(m.close);
}

function marketLine(m) {
  const status = isMarketOpen(m) ? ' — 🟢 *open now*' : '';
  return `- **${m.name}** (${m.area}) · ${m.days.join(', ')} · ${formatTime(m.open)} – ${formatTime(m.close)} · ${m.produce.join(', ')}${status}`;
}

function marketList() {
  return `FreshFind lists **${DATA.markets.length} markets** 🧺:\n\n${DATA.markets.map(marketLine).join('\n')}`;
}

function openToday() {
  const today = new Date().getDay();
  const list = DATA.markets.filter(m => m.days.includes(DAY_NAMES[today]));
  if (!list.length) {
    return `No markets are open on **${DAY_FULL[today]}** 😴. Ask me about another day — e.g. *"markets on Saturday"*.`;
  }
  return `Markets open today (**${DAY_FULL[today]}**) 🧺:\n\n${list.map(marketLine).join('\n')}`;
}

function fillTemplate(text) {
  const values = {
    email: () => DATA.office.email,
    phone: () => DATA.office.phone,
    address: () => DATA.office.address,
    officeStatus,
    marketList,
    openToday,
  };
  return text.replace(/\{(\w+)\}/g, (match, key) => (values[key] ? values[key]() : match));
}

/* ---------------------------------------------------------
   1) MARKET SEARCH — uses the "markets" list in the JSON
   "markets open on sunday", "where can I buy honey",
   "riverside market timing", "which markets are open now"
--------------------------------------------------------- */
function tryMarkets(norm, tokens) {
  // "list my market" / "add my market" is about FreshFind itself, not a search
  if (/\b(my|apna|apni) markets?\b/.test(norm)) return null;

  const hasMarketWord = /\bmarkets?\b|\bbazaar\b|\bbazar\b|\bmandi\b/.test(norm);
  const buyWords = /\b(buy|get|find|where|kahan|kaha|milega|milta|milti|milenge|sell|sells|available)\b/.test(norm);

  const areas = DATA.markets.filter(m => norm.includes(m.area.toLowerCase()) || norm.includes(normalize(m.name)));

  let day = null;
  if (/\btoday\b|\baaj\b/.test(norm)) day = new Date().getDay();
  else if (/\btomorrow\b|\bkal\b/.test(norm)) day = (new Date().getDay() + 1) % 7;
  else if (/\bweekend\b/.test(norm)) day = 'weekend';
  else {
    const word = tokens.find(t => t in DAY_WORDS);
    if (word) day = DAY_WORDS[word];
  }

  const produceWord = tokens.find(t => t in PRODUCE_WORDS);
  const produce = produceWord ? PRODUCE_WORDS[produceWord] : null;
  const openNow = /\bopen now\b|\bopen right now\b|\bcurrently open\b|\babhi khula\b|\babhi open\b/.test(norm);
  const listAll = /\b(all|list|every|sab|saare|sare|show)\b/.test(norm) && hasMarketWord;

  const relevant = areas.length
    || (hasMarketWord && (day !== null || produce || openNow || listAll))
    || (produce && buyWords);
  if (!relevant) return null;

  let results = areas.length ? areas : DATA.markets;
  if (day === 'weekend') results = results.filter(m => m.days.includes('Sat') || m.days.includes('Sun'));
  else if (day !== null) results = results.filter(m => m.days.includes(DAY_NAMES[day]));
  if (produce) results = results.filter(m => m.produce.includes(produce));
  if (openNow) results = results.filter(m => isMarketOpen(m));

  const what = [
    produce ? `selling **${produce.toLowerCase()}**` : '',
    day === 'weekend' ? 'open at the **weekend**'
      : day === new Date().getDay() ? `open **today** (${DAY_FULL[day]})`
      : day !== null ? `open on **${DAY_FULL[day]}**` : '',
    openNow ? 'open **right now**' : '',
  ].filter(Boolean).join(', ');

  if (!results.length) {
    return `I couldn't find any markets ${what || 'matching that'} 🧺. Try another day, or check the full **Market Directory** on the home page.`;
  }

  const lines = results.map(marketLine);

  const intro = areas.length && !what
    ? 'Here you go 🧺'
    : `Found **${results.length}** market${results.length > 1 ? 's' : ''}${what ? ' ' + what : ''} 🧺`;
  return `${intro}:\n\n${lines.join('\n')}`;
}

/* ---------------------------------------------------------
   2) INTENTS — score every intent's keywords against the message
--------------------------------------------------------- */
function scoreIntent(intent, norm, tokens) {
  const padded = ` ${norm} `;
  let score = 0;

  for (const kw of intent.keywords) {
    const words = kw.split(' ');
    if (words.length > 1) {
      if (padded.includes(` ${kw} `)) score += words.length * 1.5;
      else if (words.every(w => tokens.includes(w))) score += words.length * 0.8;
    } else if (tokens.includes(kw)) {
      score += 1.2;
    } else if (kw.length >= 5 && tokens.some(t => t.length >= 4 && editDistance(t, kw) <= 1)) {
      score += 0.9; // small typo: "photosyntesis", "gravty"
    }
  }

  return SMALL_TALK.has(intent.id) ? score * 0.6 : score;
}

function tryIntents(norm, tokens) {
  let best = null;
  let bestScore = 0;
  for (const intent of DATA.intents) {
    const score = scoreIntent(intent, norm, tokens);
    if (score > bestScore) {
      best = intent;
      bestScore = score;
    }
  }
  if (!best || bestScore < 0.7) return null;
  return {
    text: fillTemplate(pick(best.id, best.responses)),
    chips: best.showQuestions ? DATA.quickQuestions : null,
  };
}

/* ---------------------------------------------------------
   3) NOT ABOUT THE WEBSITE — point to search sites + website questions
--------------------------------------------------------- */
function offTopic(text) {
  const { responses, links, after } = DATA.offTopic;
  const query = encodeURIComponent(text.trim());
  const linkLines = links.map(l => `- 🔗 [${l.label}](${l.url.replace('{query}', query)})`).join('\n');
  return {
    text: `${pick('offTopic', responses)}\n\n${linkLines}\n\n${after}`,
    chips: DATA.quickQuestions,
  };
}

// always returns { text, chips } — chips are clickable website questions (or null)
function getReply(text) {
  const norm = normalize(text);
  const tokens = norm.split(' ').filter(Boolean);

  const market = tryMarkets(norm, tokens);
  if (market) return { text: market, chips: null };

  return tryIntents(norm, tokens) ?? offTopic(text);
}

/* ---------------------------------------------------------
   MARKDOWN (escape first, then format — never trusts raw HTML)
--------------------------------------------------------- */
function escapeHtml(text) {
  return text.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function inline(text) {
  const codes = [];
  text = text.replace(/`([^`\n]+)`/g, (_, code) => `\u0000${codes.push(code) - 1}\u0000`);
  text = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  return text.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${escapeHtml(codes[i])}</code>`);
}

function renderMarkdown(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let para = [];
  let list = null; // { type: 'ul' | 'ol', items: [] }

  const flushPara = () => {
    if (para.length) out.push(`<p>${para.map(inline).join('<br>')}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.type}>${list.items.map(i => `<li>${inline(i)}</li>`).join('')}</${list.type}>`);
    list = null;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/^\s*```/.test(line)) {
      flushPara(); flushList();
      const code = [];
      i++;
      while (i < lines.length && !/^\s*```/.test(lines[i])) code.push(lines[i++]);
      out.push(`<pre><code>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);

    if (!line.trim()) {
      flushPara(); flushList();
    } else if (bullet || numbered) {
      flushPara();
      const type = bullet ? 'ul' : 'ol';
      if (list && list.type !== type) flushList();
      if (!list) list = { type, items: [] };
      list.items.push((bullet || numbered)[1]);
    } else {
      flushList();
      para.push(line);
    }
  }
  flushPara(); flushList();
  return out.join('');
}

/* ---------------------------------------------------------
   CHAT UI
--------------------------------------------------------- */
function scrollToBottom() {
  const log = $('chatLog');
  log.scrollTop = log.scrollHeight;
}

function addChips(questions) {
  const wrap = document.createElement('div');
  wrap.className = 'chips';
  questions.forEach(q => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = q;
    btn.addEventListener('click', () => send(q));
    wrap.append(btn);
  });
  $('chatLog').append(wrap);
  scrollToBottom();
}

function addMessage(role, text) {
  const row = document.createElement('div');
  row.className = `msg msg-${role}`;

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';

  if (role === 'user') {
    bubble.textContent = text;
    row.append(bubble);
  } else {
    const avatar = document.createElement('span');
    avatar.className = 'msg-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = '🌱';
    bubble.innerHTML = text === undefined
      ? '<span class="typing" aria-label="Sprout is typing"><span></span><span></span><span></span></span>'
      : renderMarkdown(text);
    row.append(avatar, bubble);
  }

  $('chatLog').append(row);
  scrollToBottom();
  return { row, bubble };
}

let busy = false;
let chatId = 0;

function setBusy(state) {
  busy = state;
  $('sendBtn').disabled = state;
  $('botStatus').textContent = state ? 'Typing…' : 'Online · ready when you are';
  $('chatLog').closest('.chat-card').classList.toggle('is-busy', state);
}

function send(text) {
  text = text.trim();
  if (!text || busy) return;

  addMessage('user', text);

  if (!DATA) {
    const { row } = addMessage('bot', 'My knowledge file (**chatbot-data.js**) didn\'t load 😕. Make sure it is inside the **data** folder.');
    row.classList.add('is-error');
    return;
  }

  const reply = getReply(text);
  const { bubble } = addMessage('bot');
  const thisChat = chatId;
  setBusy(true);

  // a short "typing" pause, a little longer for longer answers
  const delay = Math.min(450 + reply.text.length * 2, 1400);
  setTimeout(() => {
    if (thisChat !== chatId) return; // "New chat" was pressed meanwhile
    bubble.innerHTML = renderMarkdown(reply.text);
    if (reply.chips) addChips(reply.chips);
    setBusy(false);
    scrollToBottom();
    $('prompt').focus();
  }, delay);
}

// the bot greets first, with the website questions attached
function welcome() {
  chatId++;
  $('chatLog').replaceChildren();
  if (!DATA) {
    const { row } = addMessage('bot', 'My knowledge file (**chatbot-data.js**) didn\'t load 😕. Make sure it is inside the **data** folder.');
    row.classList.add('is-error');
    return;
  }
  addMessage('bot', DATA.bot.welcome);
  addChips(DATA.quickQuestions);
}

function autoGrow(el) {
  el.style.height = 'auto';
  el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
}

function initChat() {
  const form = $('composer');
  const prompt = $('prompt');

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (busy || !prompt.value.trim()) return;
    const text = prompt.value;
    prompt.value = '';
    autoGrow(prompt);
    send(text);
  });

  prompt.addEventListener('input', () => autoGrow(prompt));
  prompt.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      form.requestSubmit();
    }
  });

  $('newChatBtn').addEventListener('click', () => {
    welcome();
    setBusy(false);
    prompt.value = '';
    autoGrow(prompt);
    prompt.focus();
  });
}

// chatbot-data.js is a plain <script>, so this works from file:// too
function loadData() {
  if (typeof CHATBOT_DATA === 'undefined') {
    console.error('chatbot-data.js did not load');
    $('botStatus').textContent = 'Offline · knowledge file not loaded';
    return;
  }
  DATA = CHATBOT_DATA;
}

/* ---------------------------------------------------------
   BOOTSTRAP (the navbar is handled by navbar.js)
--------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = $('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  initChat();
  loadData();
  welcome();
});
