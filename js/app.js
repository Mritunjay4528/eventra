/* =========================================================
   Eventra — shared utilities (loaded on every page)
   ========================================================= */

const STORAGE_KEYS = {
  registrations: "eventra-registrations",
  theme: "eventra-theme",
  subscribers: "eventra-subscribers",
};

/* ---------- Safe localStorage wrapper ---------- */
const Store = {
  read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  },
  write(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },
};

/* ---------- Registration data layer ---------- */
const Registrations = {
  all() {
    return Store.read(STORAGE_KEYS.registrations, []);
  },
  forEvent(eventId) {
    return this.all().filter((r) => r.eventId === eventId);
  },
  add(reg) {
    const list = this.all();
    list.push(reg);
    return Store.write(STORAGE_KEYS.registrations, list);
  },
  remove(regId) {
    const list = this.all().filter((r) => r.id !== regId);
    Store.write(STORAGE_KEYS.registrations, list);
  },
  clear() {
    Store.write(STORAGE_KEYS.registrations, []);
  },
  exists(eventId, email) {
    const e = email.trim().toLowerCase();
    return this.all().some((r) => r.eventId === eventId && r.email.toLowerCase() === e);
  },
  newId() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let id = "EVT-";
    for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
    return id;
  },
};

/* ---------- Event helpers ---------- */
const getEvent = (id) => EVENTS.find((e) => e.id === id);
const isPast = (ev) => new Date(ev.date).getTime() < Date.now();

function seatsLeft(ev) {
  const local = Registrations.forEvent(ev.id).reduce((sum, r) => sum + r.tickets, 0);
  return Math.max(0, ev.capacity - ev.booked - local);
}

function eventStatus(ev) {
  if (isPast(ev)) return { key: "past", label: "Event ended" };
  const left = seatsLeft(ev);
  if (left === 0) return { key: "soldout", label: "Sold out" };
  if (left / ev.capacity <= 0.15) return { key: "few", label: `Only ${left} left` };
  return { key: "open", label: `${left.toLocaleString("en-IN")} seats left` };
}

/* ---------- Formatting ---------- */
const fmt = {
  date(iso, opts = { weekday: "short", day: "numeric", month: "short", year: "numeric" }) {
    return new Date(iso).toLocaleDateString("en-IN", { ...opts, timeZone: "Asia/Kolkata" });
  },
  time(iso) {
    return new Date(iso)
      .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" })
      .toUpperCase();
  },
  day(iso) {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", timeZone: "Asia/Kolkata" });
  },
  month(iso) {
    return new Date(iso).toLocaleDateString("en-IN", { month: "short", timeZone: "Asia/Kolkata" });
  },
  price(p) {
    return p === 0 ? "Free" : "₹" + p.toLocaleString("en-IN");
  },
};

function escapeHTML(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/* ---------- Event card markup ---------- */
function eventCardHTML(ev, { compact = false } = {}) {
  const status = eventStatus(ev);
  const pct = Math.min(100, Math.round(((ev.capacity - seatsLeft(ev)) / ev.capacity) * 100));
  return `
  <article class="card reveal" data-category="${ev.category}">
    <a class="card-link" href="event.html?id=${ev.id}" aria-label="${escapeHTML(ev.title)} — view details"></a>
    <div class="card-media" data-cat="${ev.category}">
      <img src="${IMG(ev.image, 700)}" alt="" loading="lazy" decoding="async" data-fallback>
      <span class="pill pill-on-media">${ev.category}</span>
      <div class="date-badge" aria-hidden="true">
        <span class="date-badge-day">${fmt.day(ev.date)}</span>
        <span class="date-badge-month">${fmt.month(ev.date)}</span>
      </div>
    </div>
    <div class="card-body">
      <h3 class="card-title">${escapeHTML(ev.title)}</h3>
      <ul class="card-meta">
        <li>${icon("calendar")}<span>${fmt.date(ev.date)} · ${fmt.time(ev.date)}</span></li>
        <li>${icon("pin")}<span>${escapeHTML(ev.venue)}, ${escapeHTML(ev.city)}</span></li>
      </ul>
      ${compact ? "" : `<p class="card-desc">${escapeHTML(ev.short)}</p>`}
      <div class="card-foot">
        <span class="price">${fmt.price(ev.price)}</span>
        <span class="status status-${status.key}">${status.label}</span>
      </div>
      <div class="meter" aria-hidden="true"><span style="--fill:${pct}%"></span></div>
    </div>
  </article>`;
}

/* ---------- Inline SVG icons ---------- */
function icon(name) {
  const paths = {
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="3"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21Z"/><circle cx="12" cy="9.5" r="2.5"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4Z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4"/>',
    seat: '<path d="M6 11V6a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v5M4 11h16v4H4zM6 15v5M18 15v5"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || ""}</svg>`;
}

/* ---------- Countdown ---------- */
function startCountdown(el, iso, onDone) {
  const target = new Date(iso).getTime();
  const units = ["days", "hours", "mins", "secs"];
  const tick = () => {
    let diff = Math.max(0, target - Date.now());
    const values = [
      Math.floor(diff / 86400000),
      Math.floor((diff % 86400000) / 3600000),
      Math.floor((diff % 3600000) / 60000),
      Math.floor((diff % 60000) / 1000),
    ];
    units.forEach((u, i) => {
      const node = el.querySelector(`[data-unit="${u}"]`);
      if (node) node.textContent = String(values[i]).padStart(2, "0");
    });
    if (diff === 0) {
      clearInterval(timer);
      onDone && onDone();
    }
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer);
}

function countdownHTML() {
  return ["days", "hours", "mins", "secs"]
    .map((u) => `<div class="cd-unit"><span class="cd-num" data-unit="${u}">00</span><span class="cd-label">${u}</span></div>`)
    .join("");
}

/* ---------- Toast ---------- */
function toast(message, type = "info") {
  let region = document.querySelector(".toast-region");
  if (!region) {
    region = document.createElement("div");
    region.className = "toast-region";
    region.setAttribute("role", "status");
    region.setAttribute("aria-live", "polite");
    document.body.appendChild(region);
  }
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = message;
  region.appendChild(t);
  requestAnimationFrame(() => t.classList.add("is-in"));
  setTimeout(() => {
    t.classList.remove("is-in");
    t.addEventListener("transitionend", () => t.remove(), { once: true });
  }, 3200);
}

/* ---------- Scroll reveal ---------- */
const revealObserver =
  "IntersectionObserver" in window
    ? new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver.unobserve(entry.target);
            }
          }),
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
      )
    : null;

function observeReveals(root = document) {
  const items = root.querySelectorAll(".reveal:not(.is-visible)");
  items.forEach((el, i) => {
    el.style.setProperty("--delay", `${Math.min(i % 6, 5) * 60}ms`);
    revealObserver ? revealObserver.observe(el) : el.classList.add("is-visible");
  });
}

/* ---------- Theme toggle ---------- */
function initTheme() {
  const btn = document.querySelector("[data-theme-toggle]");
  if (!btn) return;
  const sync = () => {
    const dark = document.documentElement.dataset.theme === "dark";
    btn.setAttribute("aria-pressed", String(dark));
    btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
  };
  sync();
  btn.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.classList.add("theme-transition");
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(STORAGE_KEYS.theme, next); } catch {}
    sync();
    setTimeout(() => document.documentElement.classList.remove("theme-transition"), 400);
  });
}

/* ---------- Header: mobile menu, scroll state, ticket count ---------- */
function initHeader() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (toggle && nav) {
    const close = () => {
      toggle.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      document.body.classList.remove("nav-open");
    };
    toggle.addEventListener("click", () => {
      const open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      document.body.classList.toggle("nav-open", open);
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
    document.addEventListener("keydown", (e) => e.key === "Escape" && close());
    window.matchMedia("(min-width: 860px)").addEventListener("change", (e) => e.matches && close());
  }

  const onScroll = () => header && header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  updateTicketBadge();
}

function updateTicketBadge() {
  const count = Registrations.all().length;
  document.querySelectorAll("[data-ticket-count]").forEach((b) => {
    b.textContent = count;
    b.hidden = count === 0;
  });
}

/* ---------- Broken-image fallback (shows category gradient) ---------- */
document.addEventListener(
  "error",
  (e) => {
    const img = e.target;
    if (img.tagName === "IMG" && img.hasAttribute("data-fallback")) {
      img.classList.add("img-failed");
    }
  },
  true
);

/* ---------- Newsletter (footer / CTA band) ---------- */
function initNewsletter() {
  document.querySelectorAll("[data-newsletter]").forEach((form) => {
    const input = form.querySelector("input[type=email]");
    const msg = form.querySelector(".newsletter-msg");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = input.value.trim();
      if (!Validators.email(email)) {
        msg.textContent = "Please enter a valid email address.";
        msg.className = "newsletter-msg is-error";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      const subs = Store.read(STORAGE_KEYS.subscribers, []);
      if (!subs.includes(email.toLowerCase())) subs.push(email.toLowerCase());
      Store.write(STORAGE_KEYS.subscribers, subs);
      input.value = "";
      input.removeAttribute("aria-invalid");
      msg.textContent = "You're on the list! We'll send the best events your way.";
      msg.className = "newsletter-msg is-success";
    });
  });
}

/* ---------- Validators (shared with the registration form) ---------- */
const Validators = {
  name: (v) => /^[A-Za-z][A-Za-z .'-]{1,49}$/.test(v.trim()) && v.replace(/[^A-Za-z]/g, "").length >= 2,
  email: (v) => /^[^\s@]+@[^\s@]+\.[A-Za-z]{2,}$/.test(v.trim()),
  phone: (v) => /^[6-9]\d{9}$/.test(normalizePhone(v)),
};

function normalizePhone(v) {
  let digits = v.replace(/[\s()-]/g, "");
  if (digits.startsWith("+91")) digits = digits.slice(3);
  else if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/* ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initHeader();
  initNewsletter();
  observeReveals();
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
});
