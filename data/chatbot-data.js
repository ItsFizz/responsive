/* =========================================================
   FreshFind — Chatbot Knowledge Base (chatbot-data.js)
   Must match the schema expected by js/chatbot.js exactly:
   - markets[].days   → string array e.g. ['Sun', 'Mon']
   - markets[].open   → "HH:MM" 24-hour string
   - markets[].close  → "HH:MM" 24-hour string
   - markets[].produce → string array
   - intents[].responses (not replies)
   - bot.welcome
   - office.email / phone / address / hours
   - quickQuestions
   - offTopic
========================================================= */

const CHATBOT_DATA = {

  /* ── Bot meta ─────────────────────────────────────── */
  bot: {
    name: "Sprout",
    welcome: "Hey! 👋 I'm **Sprout**, FreshFind's assistant. I know every market, timing, and seasonal produce on this site.\n\nAsk me anything — English ya Roman Urdu, sab chalega! Type **help** to see what I can do."
  },

  /* ── Office info (used in {email}, {phone} templates) ─ */
  office: {
    email: "hello@freshfind.example",
    phone: "(555) 018-2024",
    address: "Shahrah-e-Pakistan, Federal B Area Block 10, Gulberg Town, Karachi",
    hours: {
      0: null,
      1: ["09:00", "17:00"],
      2: ["09:00", "17:00"],
      3: ["09:00", "17:00"],
      4: ["09:00", "17:00"],
      5: ["09:00", "17:00"],
      6: ["09:00", "13:00"]
    }
  },

  /* ── Markets ──────────────────────────────────────── */
  markets: [
    {
      name: "Saddar Sunday Market",
      area: "Saddar",
      days: ["Sun"],
      open: "06:00",
      close: "14:00",
      produce: ["Fruits", "Vegetables", "Herbs"],
      description: "Fresh fruits, vegetables, and local produce every Sunday morning."
    },
    {
      name: "Gulshan Fresh Market",
      area: "Gulshan-e-Iqbal",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      open: "05:00",
      close: "12:00",
      produce: ["Vegetables", "Herbs", "Fruits"],
      description: "Daily fresh vegetables, herbs, and seasonal fruits from local farms."
    },
    {
      name: "Defence Farmers Market",
      area: "DHA Phase 2",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
      open: "07:00",
      close: "20:00",
      produce: ["Fruits", "Vegetables", "Dairy", "Bakery", "Honey"],
      description: "Premium organic produce, dairy, and imported fruits in Defence."
    },
    {
      name: "Bahadurabad Sabzi Mandi",
      area: "Bahadurabad",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      open: "05:30",
      close: "11:00",
      produce: ["Vegetables", "Herbs", "Fruits"],
      description: "One of Karachi's oldest and busiest vegetable markets."
    },
    {
      name: "Clifton Weekend Bazaar",
      area: "Clifton",
      days: ["Sat", "Sun"],
      open: "08:00",
      close: "18:00",
      produce: ["Fruits", "Vegetables", "Honey", "Dairy", "Bakery"],
      description: "Weekend market with premium fresh produce and artisan goods."
    }
  ],

  /* ── Quick question chips shown after welcome + off-topic ── */
  quickQuestions: [
    "Which markets are open today?",
    "Where can I buy vegetables?",
    "What are the market hours?",
    "What's in season right now?",
    "How do I contact FreshFind?"
  ],

  /* ── Off-topic fallback ───────────────────────────── */
  offTopic: {
    responses: [
      "Hmm, that's outside my zone 😅 — I only know FreshFind stuff like markets, produce, and timings. For other things, try one of these:",
      "I'm a markets expert, not a general chatbot 🌱! That one's beyond me, but here are some links that might help:",
      "Good question, but I'm only trained on FreshFind! Here's where you can search for that:"
    ],
    links: [
      { label: "Search on Google", url: "https://www.google.com/search?q={query}" },
      { label: "Search on Wikipedia", url: "https://en.wikipedia.org/wiki/Special:Search?search={query}" }
    ],
    after: "Meanwhile, feel free to ask me about **markets, produce, or FreshFind** — that's my sweet spot! 🥬"
  },

  /* ── Intents ──────────────────────────────────────── */
  intents: [
    {
      id: "greeting",
      keywords: ["hello", "hi", "hey", "salam", "assalam", "good morning", "good evening", "assalamualaikum"],
      responses: [
        "Hello! 👋 I'm Sprout, FreshFind's assistant. Ask me about markets, produce, timings — anything!",
        "Hi there! 😊 Ready to help you find fresh local produce. What do you need?",
        "Salam! 🌱 I know everything about Karachi's markets. What would you like to know?"
      ]
    },
    {
      id: "help",
      keywords: ["help", "what can you do", "topics", "madad", "kya kar sakte ho"],
      responses: [
        "Here's what I can help with:\n\n✅ **Markets** — find by area, day, or produce\n✅ **Timings** — opening and closing hours\n✅ **Seasonal produce** — what's fresh right now\n✅ **FreshFind info** — about us, contact, features\n\nJust ask in English or Roman Urdu!"
      ],
      showQuestions: true
    },
    {
      id: "thanks",
      keywords: ["thanks", "thank you", "shukriya", "appreciate", "jazakallah"],
      responses: [
        "You're welcome! Happy to help! 🌱",
        "Anytime! Let me know if you need anything else. 😊",
        "Glad I could help! Feel free to ask more."
      ]
    },
    {
      id: "bye",
      keywords: ["bye", "goodbye", "see you", "later", "alvida", "khuda hafiz"],
      responses: [
        "Goodbye! 🥬 Come back whenever you need fresh market info!",
        "See you later! Happy market hunting! 🛒",
        "Bye! Don't forget to check what's in season! 🌿"
      ]
    },
    {
      id: "how_are_you",
      keywords: ["how are you", "kya haal", "kaisa hai", "how r u"],
      responses: [
        "I'm great, thanks! 🌱 Always ready to help you find fresh produce. What do you need?",
        "Doing well! 😊 Excited to help you discover Karachi's best markets. What's up?"
      ]
    },
    {
      id: "about_freshfind",
      keywords: ["what is freshfind", "about freshfind", "freshfind kya hai", "tell me about", "who made"],
      responses: [
        "**FreshFind** is a platform that helps you discover local farmers markets in Karachi! 🥬\n\nWe show you:\n- Market **locations** and **timings**\n- **Seasonal produce** availability\n- What's **fresh right now**\n\nAll in one simple, easy-to-use place — and it's 100% free!"
      ]
    },
    {
      id: "seasonal",
      keywords: ["season", "seasonal", "what's fresh", "kya taza hai", "in season", "fresh now", "abhi kya"],
      responses: [
        "Right now it's great season for 🥬:\n\n- **Leafy greens** (spinach, fenugreek, coriander)\n- **Winter vegetables** (carrots, turnips, radish)\n- **Citrus fruits** (oranges, guavas, kinnow)\n- **Herbs** (mint, dill, parsley)\n\nAsk me about a specific produce or which market sells it!"
      ]
    },
    {
      id: "contact",
      keywords: ["contact", "email", "phone", "support", "rabta", "reach", "get in touch"],
      responses: [
        "You can reach FreshFind at:\n\n📧 **{email}**\n📞 **{phone}**\n📍 {address}\n\n{officeStatus}\n\nOr use the **Contact Us** page to send a message directly!"
      ]
    },
    {
      id: "office_hours",
      keywords: ["office hours", "when are you open", "working hours", "office timing", "support hours"],
      responses: [
        "Our office hours are:\n\n- **Monday – Friday:** 9:00 AM – 5:00 PM\n- **Saturday:** 9:00 AM – 1:00 PM\n- **Sunday:** Closed\n\n{officeStatus}"
      ]
    },
    {
      id: "free",
      keywords: ["free", "cost", "price", "payment", "muft", "paid", "subscription", "charge"],
      responses: [
        "Yes! FreshFind is **100% free** to use. 🎉\n\nNo subscriptions, no hidden fees — we just want to help you find fresh local produce!"
      ]
    },
    {
      id: "features",
      keywords: ["features", "what does it do", "how does it work", "kaise kaam karta", "functionality"],
      responses: [
        "FreshFind has these key features:\n\n🗺️ **Market Directory** — browse all markets with locations and timings\n🌿 **Seasonal Produce** — discover what's fresh in each season\n🤖 **Ask Sprout** — that's me! AI assistant for any question\n📞 **Contact** — reach the team directly\n📌 **Bookmarks** — save your favourite markets\n\nAll free, all in one place!"
      ]
    },
    {
      id: "markets_general",
      keywords: ["markets", "mandi", "bazaar", "bazar", "karachi markets", "local markets", "farmers market"],
      responses: [
        "Here's what we have in FreshFind right now:\n\n{marketList}\n\nAsk me about a specific **area**, **day**, or **produce** to narrow it down!"
      ]
    },
    {
      id: "open_now",
      keywords: ["open now", "open today", "abhi khaula", "aaj khaula", "currently open", "koi market"],
      responses: [
        "{openToday}"
      ]
    }
  ]
};

// Make data available globally
if (typeof window !== 'undefined') {
  window.CHATBOT_DATA = CHATBOT_DATA;
}
