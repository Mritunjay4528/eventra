# Eventra: Event Management Website

A modern, fully responsive event discovery and registration website built with **HTML5, CSS3 and vanilla JavaScript**. Built for the **K Explore: Web Designing** task.

Users can browse upcoming events, search and filter them by category, open a detailed page for any event, and register with a validated form. Registrations are saved in the browser with Local Storage and can be managed from a **My Tickets** page.

> **Live demo:** _add your deployed link here (Vercel / Netlify / GitHub Pages)_
> **Repository:** _add your GitHub repo link here_

---

## Features

### Core requirements
| Requirement | How it's implemented |
|---|---|
| Attractive hero section | Large headline, quick search bar, live stats and a "next big event" card with a live countdown |
| Upcoming & featured events | A "Featured this season" grid plus an "Upcoming events" grid of event cards |
| Event cards | Image, category, date badge, name, date & time, venue, short description, price, seats-left status and a capacity bar |
| Search | Live search (debounced) across title, city, venue, category, organiser and description. Press <kbd>/</kbd> to focus it |
| Category filter | Category chips with live counts (Music, Tech, Food, Art, Sports, Wellness, Business) |
| Sorting | Soonest first, price low→high, price high→low, most popular |
| Event details | `event.html?id=…` shows a full banner, description, highlights, info grid, organiser and related events |
| Registration form | Name, email, phone, selected event, number of tickets and a terms checkbox |
| JavaScript validation | Inline, accessible error messages on blur and while typing, plus full validation on submit (see below) |
| Confirmation message | Animated success modal showing the ticket ID, date, quantity and total |
| Responsive | Mobile-first layouts for phones, tablets and desktops, with a hamburger menu on small screens |

### Bonus challenges, all implemented
- **Dark / light mode.** Follows the system preference on the first visit, and the user's choice is remembered in Local Storage. There is no flash of the wrong theme on load.
- **Event countdown timers.** Live day/hour/minute/second countdowns on the hero, the event details page and every upcoming ticket.
- **Animations.** Scroll-reveal cards, hero entrance animations, an infinite category marquee, hover lifts, an animated success checkmark and a shake on invalid submit. All of them respect `prefers-reduced-motion`.
- **Local Storage registration management.** Registrations persist across visits. The **My Tickets** page shows stats, Upcoming/Past/All filters, ticket-style cards and a two-step cancel / clear-all. Seat counts update automatically.

### Form validation rules
| Field | Rule |
|---|---|
| Full name | Required, 2–50 characters, letters / spaces / `'` / `-` only |
| Email | Required, valid format (`name@domain.tld`), and not already registered for the same event |
| Phone | Required, 10-digit Indian mobile number starting with 6–9 (`+91` / `0` prefixes and spaces allowed) |
| Event | Required, must be an upcoming event with seats available |
| Tickets | Whole number from 1 to 5, and no more than the seats left |
| Terms | Must be accepted |

### Extra touches
- Search and category are kept in the URL (`index.html?category=Music&q=mumbai`), so filtered views can be shared and the footer category links work.
- Sold-out and past events automatically close registration.
- A "Copy link" share button and toast notifications.
- Accessibility: semantic landmarks, a skip link, labelled inputs, `aria-invalid` / `aria-describedby` on errors, a focus-trapped modal, visible focus rings and keyboard support.
- If an image fails to load, a category-coloured gradient is shown instead.

---

## Tech stack
- **HTML5:** semantic structure (`header`, `nav`, `main`, `section`, `article`, `aside`, `footer`)
- **CSS3:** custom properties (theme tokens), Grid, Flexbox, `clamp()` fluid typography, `color-mix()`, keyframe animations and media queries
- **JavaScript (ES6+):** no frameworks. Uses modules split by page, IntersectionObserver, Local Storage and URLSearchParams
- **Fonts:** Bricolage Grotesque and DM Sans (Google Fonts)
- **Images:** Unsplash
- **Version control:** Git and GitHub

---

## Project structure
```
.
├── index.html        # Home: hero, featured, search/filter/sort, how it works, newsletter
├── event.html        # Event details + registration form + success modal
├── tickets.html      # My Tickets: Local Storage registration manager
├── css/
│   └── style.css     # All styles: themes, components, animations, responsive rules
├── js/
│   ├── data.js       # Event catalogue + categories
│   ├── app.js        # Shared: theme, header, storage layer, validators, cards, countdown, toast
│   ├── home.js       # Home page logic
│   ├── event.js      # Details page + form validation + submission
│   └── tickets.js    # My Tickets page logic
└── assets/
    └── favicon.svg
```

### How it works
1. **Data:** `js/data.js` holds every event as a plain object (id, title, category, ISO date, venue, price, capacity and so on).
2. **Rendering:** each page script builds its HTML from that data. `eventCardHTML()` in `app.js` is shared by the home page, the related-events grid and search results.
3. **Registration:** on a valid submit, a registration object `{ id, eventId, name, email, phone, tickets, createdAt }` is saved to `localStorage["eventra-registrations"]`. Seats left are calculated as `capacity − seed bookings − local registrations`.
4. **Theme:** a tiny inline script in each `<head>` sets `data-theme` before the page paints. CSS variables do the rest.

---

## Run locally
No build step is needed. Either open `index.html` directly in a browser, or serve the folder:

```bash
python -m http.server 5500
```
Then visit http://localhost:5500.

## Deploy
- **GitHub Pages:** push to GitHub, then go to *Settings → Pages → Deploy from branch → `main` / root*.
- **Netlify:** drag and drop the folder at app.netlify.com/drop, or connect the repo (no build command, publish directory `.`).
- **Vercel:** import the repo with the "Other" framework preset and no build command.

---

## Author
Built by **_your name_** for K Explore: Web Designing.
