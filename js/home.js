/* =========================================================
   Eventra — home page: hero, featured, search / filter / sort
   ========================================================= */

const state = {
  query: "",
  category: "All",
  sort: "date",
};

const els = {
  featured: document.getElementById("featured-grid"),
  grid: document.getElementById("events-grid"),
  chips: document.getElementById("chips"),
  search: document.getElementById("search"),
  sort: document.getElementById("sort"),
  count: document.getElementById("results-count"),
  empty: document.getElementById("empty-state"),
  reset: document.getElementById("reset-filters"),
};

const upcoming = () => EVENTS.filter((e) => !isPast(e));

/* ---------- Hero ---------- */
function renderHero() {
  const list = upcoming();
  document.getElementById("hero-count").textContent = list.length;

  const next =
    list.filter((e) => e.featured).sort((a, b) => new Date(a.date) - new Date(b.date))[0] ||
    list.sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  const link = document.getElementById("hero-next-link");
  const cd = document.getElementById("hero-countdown");
  if (!next) {
    document.getElementById("hero-next-title").textContent = "New events coming soon";
    cd.remove();
    return;
  }
  link.href = `event.html?id=${next.id}`;
  link.setAttribute("aria-label", `Next big event: ${next.title}`);
  document.getElementById("hero-next-img").src = IMG(next.image, 700);
  document.getElementById("hero-next-title").textContent = next.title;
  document.getElementById("hero-next-meta").textContent = `${fmt.date(next.date, { day: "numeric", month: "short" })} · ${next.city}`;
  cd.innerHTML = countdownHTML();
  startCountdown(cd, next.date);
}

function animateCounters() {
  // Stats are derived from the catalogue so they never drift out of date
  const setTarget = (label, value, suffix = "") => {
    const dd = [...document.querySelectorAll(".hero-stats div")].find((d) => d.querySelector("dt").textContent === label);
    if (dd) { dd.querySelector("dd").dataset.countTo = value; dd.querySelector("dd").dataset.suffix = suffix; }
  };
  const attendees = EVENTS.reduce((s, e) => s + e.capacity - seatsLeft(e), 0);
  setTarget("Cities", new Set(EVENTS.map((e) => e.city)).size);
  setTarget("Attendees", Math.floor(attendees / 1000), "K+");
  setTarget("Categories", CATEGORIES.length);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll("[data-count-to]").forEach((el) => {
    const end = Number(el.dataset.countTo);
    const suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = end + suffix; return; }
    const start = performance.now();
    const dur = 1200;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(end * eased) + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

/* ---------- Featured ---------- */
function renderFeatured() {
  const featured = upcoming()
    .filter((e) => e.featured)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 3);

  els.featured.innerHTML = featured
    .map(
      (ev, i) => `
    <article class="feature-card reveal ${i === 0 ? "feature-card-lg" : ""}">
      <img src="${IMG(ev.image, i === 0 ? 1200 : 800)}" alt="" loading="lazy" data-fallback>
      <div class="feature-overlay">
        <span class="pill">${ev.category}</span>
        <h3>${escapeHTML(ev.title)}</h3>
        <p class="feature-meta">${icon("calendar")} ${fmt.date(ev.date)} &nbsp;·&nbsp; ${icon("pin")} ${escapeHTML(ev.city)}</p>
        ${i === 0 ? `<p class="feature-desc">${escapeHTML(ev.short)}</p>` : ""}
        <div class="feature-foot">
          <span class="price">${fmt.price(ev.price)}</span>
          <span class="feature-cta">View event <span aria-hidden="true">→</span></span>
        </div>
      </div>
      <a class="card-link" href="event.html?id=${ev.id}" aria-label="${escapeHTML(ev.title)} — view details"></a>
    </article>`
    )
    .join("");
}

/* ---------- Category chips ---------- */
function renderChips() {
  const list = upcoming();
  const all = [{ name: "All", icon: "✦" }, ...CATEGORIES];
  els.chips.innerHTML = all
    .map((c) => {
      const n = c.name === "All" ? list.length : list.filter((e) => e.category === c.name).length;
      const active = state.category === c.name;
      return `<button type="button" class="chip${active ? " is-active" : ""}" data-category="${c.name}" aria-pressed="${active}">
        <span aria-hidden="true">${c.icon}</span> ${c.name} <span class="chip-count">${n}</span>
      </button>`;
    })
    .join("");
}

/* ---------- Filtering + sorting ---------- */
function filtered() {
  const q = state.query.trim().toLowerCase();
  let list = upcoming().filter((e) => {
    const inCat = state.category === "All" || e.category === state.category;
    if (!inCat) return false;
    if (!q) return true;
    const haystack = `${e.title} ${e.category} ${e.city} ${e.venue} ${e.short} ${e.organizer}`.toLowerCase();
    return q.split(/\s+/).every((word) => haystack.includes(word));
  });

  const byDate = (a, b) => new Date(a.date) - new Date(b.date);
  const sorters = {
    date: byDate,
    "price-asc": (a, b) => a.price - b.price || byDate(a, b),
    "price-desc": (a, b) => b.price - a.price || byDate(a, b),
    popular: (a, b) => (b.capacity - seatsLeft(b)) / b.capacity - (a.capacity - seatsLeft(a)) / a.capacity,
  };
  return list.sort(sorters[state.sort]);
}

function renderGrid() {
  const list = filtered();
  els.grid.innerHTML = list.map((ev) => eventCardHTML(ev)).join("");
  els.empty.hidden = list.length > 0;
  const catText = state.category === "All" ? "" : ` in ${state.category}`;
  const qText = state.query.trim() ? ` for “${state.query.trim()}”` : "";
  els.count.textContent = `Showing ${list.length} event${list.length === 1 ? "" : "s"}${catText}${qText}`;
  observeReveals(els.grid);
}

function syncURL() {
  const url = new URL(location.href);
  state.category === "All" ? url.searchParams.delete("category") : url.searchParams.set("category", state.category);
  state.query.trim() ? url.searchParams.set("q", state.query.trim()) : url.searchParams.delete("q");
  history.replaceState(null, "", url);
}

function update() {
  renderChips();
  renderGrid();
  syncURL();
}

/* ---------- Wire up controls ---------- */
function debounce(fn, ms) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

function initControls() {
  // Restore state from the URL (so footer category links + shared links work)
  const params = new URLSearchParams(location.search);
  const cat = params.get("category");
  if (cat && CATEGORIES.some((c) => c.name === cat)) state.category = cat;
  if (params.get("q")) {
    state.query = params.get("q");
    els.search.value = state.query;
  }

  els.search.addEventListener("input", debounce((e) => { state.query = e.target.value; update(); }, 180));
  els.sort.addEventListener("change", (e) => { state.sort = e.target.value; renderGrid(); });

  els.chips.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    update();
  });

  els.reset.addEventListener("click", () => {
    state.query = "";
    state.category = "All";
    els.search.value = "";
    update();
    els.search.focus();
  });

  // Hero search jumps down to the events section with the query applied
  document.getElementById("hero-search").addEventListener("submit", (e) => {
    e.preventDefault();
    const value = document.getElementById("hero-search-input").value;
    state.query = value;
    els.search.value = value;
    update();
    document.getElementById("events").scrollIntoView({ behavior: "smooth" });
  });

  // Press "/" anywhere to jump to search
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
    if (e.key === "/" && !typing) {
      e.preventDefault();
      els.search.focus();
      els.search.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });
}

/* ---------- Init ---------- */
renderHero();
renderFeatured();
initControls();
update();
animateCounters();
