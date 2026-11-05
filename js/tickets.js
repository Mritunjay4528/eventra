/* =========================================================
   Eventra — My Tickets (Local Storage registration manager)
   ========================================================= */

const list = document.getElementById("tickets-list");
const empty = document.getElementById("tickets-empty");
const emptyText = document.getElementById("tickets-empty-text");
const toolbar = document.getElementById("tickets-toolbar");
const stats = document.getElementById("ticket-stats");
const clearBtn = document.getElementById("clear-all");

let filter = "upcoming";
const timers = [];

/* Registrations joined with their event, newest event date first for past, soonest for upcoming */
function joined() {
  return Registrations.all()
    .map((r) => ({ reg: r, ev: getEvent(r.eventId) }))
    .filter((x) => x.ev)
    .sort((a, b) => new Date(a.ev.date) - new Date(b.ev.date));
}

function renderStats(items) {
  const upcomingItems = items.filter((x) => !isPast(x.ev));
  const totalTickets = items.reduce((s, x) => s + x.reg.tickets, 0);
  const spent = items.reduce((s, x) => s + x.ev.price * x.reg.tickets, 0);
  stats.innerHTML = `
    <div><dt>Registrations</dt><dd>${items.length}</dd></div>
    <div><dt>Upcoming</dt><dd>${upcomingItems.length}</dd></div>
    <div><dt>Tickets</dt><dd>${totalTickets}</dd></div>
    <div><dt>Total value</dt><dd>${spent === 0 ? "₹0" : fmt.price(spent)}</dd></div>`;
}

function ticketHTML({ reg, ev }) {
  const past = isPast(ev);
  return `
  <article class="ticket reveal${past ? " is-past" : ""}" data-id="${reg.id}">
    <a class="ticket-media" href="event.html?id=${ev.id}" data-cat="${ev.category}" tabindex="-1" aria-hidden="true">
      <img src="${IMG(ev.image, 500)}" alt="" loading="lazy" data-fallback>
    </a>
    <div class="ticket-body">
      <div class="ticket-top">
        <span class="pill pill-soft">${ev.category}</span>
        <span class="status status-${past ? "past" : "open"}">${past ? "Attended" : "Confirmed"}</span>
      </div>
      <h2 class="ticket-title"><a href="event.html?id=${ev.id}">${escapeHTML(ev.title)}</a></h2>
      <ul class="card-meta">
        <li>${icon("calendar")}<span>${fmt.date(ev.date)} · ${fmt.time(ev.date)}</span></li>
        <li>${icon("pin")}<span>${escapeHTML(ev.venue)}, ${escapeHTML(ev.city)}</span></li>
        <li>${icon("user")}<span>${escapeHTML(reg.name)} · ${escapeHTML(reg.email)}</span></li>
      </ul>
      ${past ? "" : `<div class="countdown countdown-xs" data-countdown="${ev.date}">${countdownHTML()}</div>`}
    </div>
    <div class="ticket-stub">
      <div class="stub-row"><span>Ticket ID</span><strong class="mono">${reg.id}</strong></div>
      <div class="stub-row"><span>Qty</span><strong>${reg.tickets}</strong></div>
      <div class="stub-row"><span>Total</span><strong>${ev.price === 0 ? "Free" : fmt.price(ev.price * reg.tickets)}</strong></div>
      <div class="barcode" aria-hidden="true">${barcode(reg.id)}</div>
      ${past ? "" : `<button type="button" class="btn btn-ghost btn-sm btn-danger-text" data-cancel="${reg.id}">Cancel registration</button>`}
    </div>
  </article>`;
}

/* Decorative barcode generated from the ticket ID */
function barcode(id) {
  let bars = "";
  for (let i = 0; i < id.length * 3; i++) {
    const w = ((id.charCodeAt(i % id.length) * (i + 3)) % 3) + 1;
    bars += `<i style="--w:${w}px"></i>`;
  }
  return bars;
}

function render() {
  timers.splice(0).forEach((stop) => stop());
  const items = joined();
  renderStats(items);

  const shown = items.filter((x) => (filter === "all" ? true : filter === "past" ? isPast(x.ev) : !isPast(x.ev)));
  if (filter === "past") shown.reverse();

  toolbar.hidden = items.length === 0;
  list.innerHTML = shown.map(ticketHTML).join("");
  empty.hidden = shown.length > 0;
  emptyText.textContent =
    items.length === 0
      ? "When you register for an event, your ticket will show up here."
      : filter === "past"
      ? "No past events yet — your attended events will appear here."
      : "No upcoming tickets. Time to find your next event!";

  list.querySelectorAll("[data-countdown]").forEach((el) => timers.push(startCountdown(el, el.dataset.countdown)));
  observeReveals(list);
  updateTicketBadge();
}

/* Two-step confirm: first click arms the button, second click within 4s cancels */
function armConfirm(btn, label, onConfirm) {
  if (btn.dataset.armed === "true") {
    onConfirm();
    return;
  }
  const original = btn.textContent;
  btn.dataset.armed = "true";
  btn.textContent = label;
  btn.classList.add("is-armed");
  setTimeout(() => {
    if (!btn.isConnected) return;
    btn.dataset.armed = "false";
    btn.textContent = original;
    btn.classList.remove("is-armed");
  }, 4000);
}

list.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cancel]");
  if (!btn) return;
  armConfirm(btn, "Tap again to confirm", () => {
    const card = btn.closest(".ticket");
    card.classList.add("is-removing");
    setTimeout(() => {
      Registrations.remove(btn.dataset.cancel);
      render();
      toast("Registration cancelled");
    }, 280);
  });
});

clearBtn.addEventListener("click", () =>
  armConfirm(clearBtn, "Confirm clear all?", () => {
    Registrations.clear();
    clearBtn.dataset.armed = "false";
    clearBtn.textContent = "Clear all";
    clearBtn.classList.remove("is-armed");
    render();
    toast("All registrations cleared");
  })
);

document.querySelectorAll("[data-filter]").forEach((b) =>
  b.addEventListener("click", () => {
    filter = b.dataset.filter;
    document.querySelectorAll("[data-filter]").forEach((x) => {
      x.classList.toggle("is-active", x === b);
      x.setAttribute("aria-pressed", String(x === b));
    });
    render();
  })
);

// Keep in sync if registrations change in another tab
window.addEventListener("storage", (e) => e.key === STORAGE_KEYS.registrations && render());

render();
