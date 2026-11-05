/* =========================================================
   Eventra — event details page + registration form
   ========================================================= */

const params = new URLSearchParams(location.search);
const currentEvent = getEvent(params.get("id"));
const root = document.getElementById("event-root");

if (!currentEvent) {
  root.remove();
  document.getElementById("not-found").hidden = false;
  document.title = "Event not found — Eventra";
} else {
  renderEvent(currentEvent);
  renderRelated(currentEvent);
  initForm(currentEvent);
}

/* ---------- Details ---------- */
function renderEvent(ev) {
  document.title = `${ev.title} — Eventra`;
  document.querySelector('meta[name="description"]').setAttribute("content", ev.short);

  const past = isPast(ev);
  root.innerHTML = `
  <section class="event-hero">
    <div class="event-hero-media" data-cat="${ev.category}">
      <img src="${IMG(ev.image, 1800)}" alt="${escapeHTML(ev.title)}" data-fallback>
    </div>
    <div class="container event-hero-inner">
      <nav class="breadcrumb" aria-label="Breadcrumb">
        <a href="index.html">Home</a><span aria-hidden="true">/</span>
        <a href="index.html?category=${ev.category}#events">${ev.category}</a><span aria-hidden="true">/</span>
        <span aria-current="page">${escapeHTML(ev.title)}</span>
      </nav>
      <span class="pill">${ev.category}</span>
      <h1 class="event-title">${escapeHTML(ev.title)}</h1>
      <ul class="event-hero-meta">
        <li>${icon("calendar")} ${fmt.date(ev.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</li>
        <li>${icon("clock")} ${fmt.time(ev.date)} – ${ev.endTime}</li>
        <li>${icon("pin")} ${escapeHTML(ev.venue)}, ${escapeHTML(ev.city)}</li>
      </ul>
    </div>
  </section>

  <div class="container event-layout">
    <div class="event-main">
      <section class="panel countdown-panel reveal" aria-label="Countdown">
        <p class="panel-label">${past ? "This event has ended" : "Starts in"}</p>
        <div class="countdown" id="event-countdown">${countdownHTML()}</div>
      </section>

      <section class="event-section reveal" aria-labelledby="about-title">
        <h2 id="about-title">About this event</h2>
        ${ev.description.map((p) => `<p>${escapeHTML(p)}</p>`).join("")}
      </section>

      <section class="event-section reveal" aria-labelledby="hl-title">
        <h2 id="hl-title">Highlights</h2>
        <ul class="highlights">
          ${ev.highlights.map((h) => `<li>${icon("check")}<span>${escapeHTML(h)}</span></li>`).join("")}
        </ul>
      </section>

      <section class="event-section reveal" aria-labelledby="info-title">
        <h2 id="info-title">Event info</h2>
        <dl class="info-grid">
          <div class="info-item">${icon("calendar")}<dt>Date</dt><dd>${fmt.date(ev.date)}</dd></div>
          <div class="info-item">${icon("clock")}<dt>Time</dt><dd>${fmt.time(ev.date)} – ${ev.endTime}</dd></div>
          <div class="info-item">${icon("pin")}<dt>Venue</dt><dd>${escapeHTML(ev.venue)}, ${escapeHTML(ev.city)}</dd></div>
          <div class="info-item">${icon("user")}<dt>Organiser</dt><dd>${escapeHTML(ev.organizer)}</dd></div>
        </dl>
      </section>
    </div>

    <aside class="event-aside" id="register" aria-labelledby="register-title">
      <div class="register-card">
        <div class="register-head">
          <div>
            <p class="register-price">${fmt.price(ev.price)}</p>
            <p class="register-price-note">${ev.price === 0 ? "Registration required" : "per ticket, incl. taxes"}</p>
          </div>
          <button class="icon-btn" type="button" id="share-btn" aria-label="Copy event link">${icon("share")}</button>
        </div>

        <div class="seats" id="seats"></div>

        <h2 class="register-title" id="register-title">Register for this event</h2>
        <div id="form-slot"></div>
      </div>
    </aside>
  </div>`;

  const cd = document.getElementById("event-countdown");
  if (past) cd.classList.add("is-ended");
  startCountdown(cd, ev.date, () => {
    cd.classList.add("is-ended");
  });

  document.getElementById("share-btn").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(location.href);
      toast("Event link copied to clipboard", "success");
    } catch {
      toast("Couldn't copy — use your browser's address bar instead");
    }
  });

  renderSeats(ev);
  observeReveals(root);
}

function renderSeats(ev) {
  const left = seatsLeft(ev);
  const pct = Math.round(((ev.capacity - left) / ev.capacity) * 100);
  const status = eventStatus(ev);
  document.getElementById("seats").innerHTML = `
    <div class="seats-row">
      <span>${icon("seat")} <strong>${left.toLocaleString("en-IN")}</strong> of ${ev.capacity.toLocaleString("en-IN")} seats left</span>
      <span class="status status-${status.key}">${pct}% full</span>
    </div>
    <div class="meter meter-lg" aria-hidden="true"><span style="--fill:${pct}%"></span></div>`;
}

/* ---------- Related ---------- */
function renderRelated(ev) {
  const others = EVENTS.filter((e) => e.id !== ev.id && !isPast(e));
  const same = others.filter((e) => e.category === ev.category);
  const rest = others.filter((e) => e.category !== ev.category).sort((a, b) => new Date(a.date) - new Date(b.date));
  const picks = [...same, ...rest].slice(0, 3);
  if (!picks.length) return;
  document.getElementById("related-grid").innerHTML = picks.map((e) => eventCardHTML(e, { compact: true })).join("");
  document.getElementById("related-section").hidden = false;
  observeReveals(document.getElementById("related-grid"));
}

/* ---------- Registration form ---------- */
function initForm(ev) {
  const slot = document.getElementById("form-slot");
  const status = eventStatus(ev);

  if (status.key === "past" || status.key === "soldout") {
    slot.innerHTML = `
      <div class="closed-note">
        <strong>${status.key === "past" ? "Registration closed" : "This event is sold out"}</strong>
        <p>${status.key === "past" ? "This event has already taken place." : "All seats have been booked."} Check out similar events below.</p>
        <a class="btn btn-ghost btn-block" href="index.html#events">Browse other events</a>
      </div>`;
    return;
  }

  const options = EVENTS.filter((e) => !isPast(e) && seatsLeft(e) > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((e) => `<option value="${e.id}"${e.id === ev.id ? " selected" : ""}>${escapeHTML(e.title)} — ${fmt.date(e.date, { day: "numeric", month: "short" })}</option>`)
    .join("");

  slot.innerHTML = `
  <form id="register-form" class="form" novalidate>
    <div class="field">
      <label for="f-name">Full name</label>
      <input id="f-name" name="name" type="text" autocomplete="name" placeholder="e.g. Priya Sharma" aria-describedby="f-name-error" required>
      <p class="field-error" id="f-name-error"></p>
    </div>

    <div class="field">
      <label for="f-email">Email address</label>
      <input id="f-email" name="email" type="email" autocomplete="email" placeholder="you@example.com" aria-describedby="f-email-error" required>
      <p class="field-error" id="f-email-error"></p>
    </div>

    <div class="field">
      <label for="f-phone">Phone number</label>
      <div class="input-prefix">
        <span aria-hidden="true">+91</span>
        <input id="f-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="98765 43210" maxlength="14" aria-describedby="f-phone-hint f-phone-error" required>
      </div>
      <p class="field-hint" id="f-phone-hint">10-digit Indian mobile number</p>
      <p class="field-error" id="f-phone-error"></p>
    </div>

    <div class="field">
      <label for="f-event">Selected event</label>
      <select id="f-event" name="event" aria-describedby="f-event-error" required>
        <option value="">Choose an event</option>
        ${options}
      </select>
      <p class="field-error" id="f-event-error"></p>
    </div>

    <div class="field">
      <label for="f-tickets">Number of tickets</label>
      <div class="stepper">
        <button type="button" class="stepper-btn" data-step="-1" aria-label="Decrease tickets">−</button>
        <input id="f-tickets" name="tickets" type="number" min="1" max="5" value="1" inputmode="numeric" aria-describedby="f-tickets-error">
        <button type="button" class="stepper-btn" data-step="1" aria-label="Increase tickets">+</button>
        <span class="stepper-total" id="ticket-total"></span>
      </div>
      <p class="field-error" id="f-tickets-error"></p>
    </div>

    <div class="field field-check">
      <input id="f-terms" name="terms" type="checkbox" aria-describedby="f-terms-error">
      <label for="f-terms">I agree to the event guidelines and to receive updates about this event.</label>
      <p class="field-error" id="f-terms-error"></p>
    </div>

    <button class="btn btn-primary btn-block btn-lg" type="submit" id="submit-btn">
      <span class="btn-label">Confirm registration</span>
      <span class="spinner" aria-hidden="true"></span>
    </button>
    <p class="form-note">Your registration is saved on this device. No payment is taken.</p>
  </form>`;

  const form = document.getElementById("register-form");
  const f = {
    name: form.querySelector("#f-name"),
    email: form.querySelector("#f-email"),
    phone: form.querySelector("#f-phone"),
    event: form.querySelector("#f-event"),
    tickets: form.querySelector("#f-tickets"),
    terms: form.querySelector("#f-terms"),
  };

  /* Each rule returns an error message, or "" when valid */
  const rules = {
    name: () => {
      const v = f.name.value.trim();
      if (!v) return "Please enter your full name.";
      if (v.length < 2) return "Name must be at least 2 characters.";
      if (!Validators.name(v)) return "Use letters, spaces, apostrophes or hyphens only.";
      return "";
    },
    email: () => {
      const v = f.email.value.trim();
      if (!v) return "Please enter your email address.";
      if (!Validators.email(v)) return "Enter a valid email, like name@example.com.";
      if (f.event.value && Registrations.exists(f.event.value, v)) return "This email is already registered for the selected event.";
      return "";
    },
    phone: () => {
      const v = f.phone.value.trim();
      if (!v) return "Please enter your phone number.";
      const digits = normalizePhone(v);
      if (/\D/.test(digits)) return "Phone number can contain digits only.";
      if (digits.length !== 10) return "Phone number must be exactly 10 digits.";
      if (!Validators.phone(v)) return "Indian mobile numbers start with 6, 7, 8 or 9.";
      return "";
    },
    event: () => {
      if (!f.event.value) return "Please choose an event.";
      const chosen = getEvent(f.event.value);
      if (!chosen || isPast(chosen)) return "Registration for this event has closed.";
      return "";
    },
    tickets: () => {
      const n = Number(f.tickets.value);
      if (!Number.isInteger(n) || n < 1) return "Choose at least 1 ticket.";
      if (n > 5) return "You can book up to 5 tickets at a time.";
      const chosen = getEvent(f.event.value);
      if (chosen && n > seatsLeft(chosen)) return `Only ${seatsLeft(chosen)} seat(s) left for this event.`;
      return "";
    },
    terms: () => (f.terms.checked ? "" : "Please accept the event guidelines to continue."),
  };

  const touched = new Set();

  function validateField(key) {
    const msg = rules[key]();
    const input = f[key];
    const errorEl = form.querySelector(`#f-${key}-error`);
    errorEl.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    input.closest(".field").classList.toggle("has-error", !!msg);
    input.closest(".field").classList.toggle("is-valid", !msg && key !== "terms" && key !== "tickets");
    return !msg;
  }

  // Validate on blur; once a field has been touched, re-validate live while typing
  Object.keys(f).forEach((key) => {
    const input = f[key];
    const evt = input.type === "checkbox" || input.tagName === "SELECT" ? "change" : "blur";
    input.addEventListener(evt, () => {
      touched.add(key);
      validateField(key);
    });
    input.addEventListener("input", () => touched.has(key) && validateField(key));
  });

  // Keep the phone field to digits / spaces / plus only
  f.phone.addEventListener("input", () => {
    f.phone.value = f.phone.value.replace(/[^\d+\s-]/g, "");
  });

  // Changing the event re-checks email duplicates and ticket limits
  f.event.addEventListener("change", () => {
    if (touched.has("email")) validateField("email");
    validateField("tickets");
    updateTotal();
  });

  // Ticket stepper
  form.querySelectorAll(".stepper-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const next = Math.min(5, Math.max(1, (Number(f.tickets.value) || 1) + Number(btn.dataset.step)));
      f.tickets.value = next;
      validateField("tickets");
      updateTotal();
    })
  );
  f.tickets.addEventListener("input", updateTotal);

  function updateTotal() {
    const chosen = getEvent(f.event.value) || ev;
    const n = Math.max(1, Number(f.tickets.value) || 1);
    document.getElementById("ticket-total").textContent = chosen.price === 0 ? "Free" : `Total ${fmt.price(chosen.price * n)}`;
  }
  updateTotal();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    Object.keys(f).forEach((k) => touched.add(k));
    const results = Object.keys(rules).map((k) => [k, validateField(k)]);
    const firstInvalid = results.find(([, ok]) => !ok);

    if (firstInvalid) {
      f[firstInvalid[0]].focus();
      form.classList.remove("shake");
      void form.offsetWidth; // restart animation
      form.classList.add("shake");
      toast("Please fix the highlighted fields", "error");
      return;
    }

    const btn = document.getElementById("submit-btn");
    btn.classList.add("is-loading");
    btn.disabled = true;

    // Small delay so the loading state is visible — simulates a network request
    setTimeout(() => {
      const chosen = getEvent(f.event.value);
      const reg = {
        id: Registrations.newId(),
        eventId: chosen.id,
        name: f.name.value.trim().replace(/\s+/g, " "),
        email: f.email.value.trim().toLowerCase(),
        phone: normalizePhone(f.phone.value),
        tickets: Number(f.tickets.value),
        createdAt: new Date().toISOString(),
      };

      if (!Registrations.add(reg)) {
        toast("Couldn't save your registration — storage may be disabled", "error");
        btn.classList.remove("is-loading");
        btn.disabled = false;
        return;
      }

      btn.classList.remove("is-loading");
      btn.disabled = false;
      form.reset();
      f.event.value = ev.id;
      touched.clear();
      form.querySelectorAll(".field").forEach((fl) => fl.classList.remove("has-error", "is-valid"));
      updateTotal();
      renderSeats(ev);
      updateTicketBadge();
      showSuccess(reg, chosen);
    }, 700);
  });
}

/* ---------- Success modal ---------- */
function showSuccess(reg, ev) {
  const modal = document.getElementById("success-modal");
  const dialog = modal.querySelector(".modal-dialog");
  const firstName = reg.name.split(" ")[0];

  document.getElementById("modal-sub").textContent =
    `Thanks, ${firstName}! Your registration for ${ev.title} is confirmed. A copy is saved in My Tickets.`;
  document.getElementById("modal-ticket").innerHTML = `
    <div><span>Ticket ID</span><strong>${reg.id}</strong></div>
    <div><span>Date</span><strong>${fmt.date(ev.date, { day: "numeric", month: "short", year: "numeric" })}</strong></div>
    <div><span>Tickets</span><strong>${reg.tickets}</strong></div>
    <div><span>Total</span><strong>${ev.price === 0 ? "Free" : fmt.price(ev.price * reg.tickets)}</strong></div>`;

  const lastFocus = document.activeElement;
  modal.hidden = false;
  requestAnimationFrame(() => modal.classList.add("is-open"));
  document.body.classList.add("modal-open");
  dialog.focus();

  const close = () => {
    modal.classList.remove("is-open");
    document.body.classList.remove("modal-open");
    setTimeout(() => (modal.hidden = true), 250);
    document.removeEventListener("keydown", onKey);
    lastFocus && lastFocus.focus();
  };
  const onKey = (e) => {
    if (e.key === "Escape") close();
    // Simple focus trap
    if (e.key === "Tab") {
      const focusables = dialog.querySelectorAll("a, button");
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  };
  document.addEventListener("keydown", onKey);
  modal.querySelectorAll("[data-close]").forEach((el) => (el.onclick = close));
}
