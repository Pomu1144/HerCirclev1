/* ============================================================
   HER Circle - Events page
   Cards, search/filter/category, detail modal, registration
   with capacity tracking, waitlist, RSVP, reminder opt-in.
   ============================================================ */

(() => {
  const state = { search: "", category: "All", sort: "date" };
  let listEl, modal;

  const CATEGORIES = ["All", "Networking", "Workshop", "Gala", "Mentorship", "Conference"];

  function upcomingEvents() {
    let evs = HCDB.get("events").filter(e => new Date(e.date) > new Date());
    if (state.category !== "All") evs = evs.filter(e => e.category === state.category);
    if (state.search) {
      const q = state.search.toLowerCase();
      evs = evs.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q));
    }
    evs.sort((a, b) => state.sort === "title" ? a.title.localeCompare(b.title) : a.date.localeCompare(b.date));
    return evs;
  }

  function capacityHtml(ev) {
    const confirmed = HCDB.eventConfirmedCount(ev.id);
    const pct = Math.min(100, Math.round(confirmed / ev.capacity * 100));
    const full = confirmed >= ev.capacity;
    return `
      <div class="capacity ${full ? "full" : ""}">
        <div class="bar" role="progressbar" aria-valuenow="${confirmed}" aria-valuemin="0" aria-valuemax="${ev.capacity}" aria-label="Registration capacity">
          <div class="fill" style="width:${pct}%"></div>
        </div>
        <div class="cap-label">${full ? `Full - waitlist open (${confirmed}/${ev.capacity})` : `${confirmed}/${ev.capacity} registered`}</div>
      </div>`;
  }

  function cardHtml(ev, i) {
    const d = new Date(ev.date);
    return `
      <article class="event-card reveal" data-delay="${(i % 3) + 1}" id="${ev.id}">
        <div class="event-banner cat-${ev.category.toLowerCase()}">
          <div class="event-date-badge"><span class="d">${d.getDate()}</span><span class="m">${d.toLocaleString(undefined,{month:"short"})}</span></div>
          <span class="event-cat-chip">${HC.esc(ev.category)}</span>
        </div>
        <div class="event-body">
          <h3>${HC.esc(ev.title)}</h3>
          <div class="event-meta">
            <span>${HC.fmtDate(ev.date, { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>${HC.fmtTime(ev.date)}</span>
            <span>${HC.esc(ev.location)}</span>
          </div>
          <p class="event-desc">${HC.esc(ev.description)}</p>
          <div class="event-foot">
            ${capacityHtml(ev)}
            <button class="btn btn-purple btn-sm" data-open="${ev.id}">Details &amp; RSVP</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const evs = upcomingEvents();
    if (!evs.length) {
      listEl.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="big" aria-hidden="true"></span>No events match your search. Try a different filter.</div>`;
      return;
    }
    listEl.innerHTML = evs.map(cardHtml).join("");
    HC.initReveals();
  }

  /* ---------- Detail modal + registration ---------- */
  function openModal(eventId) {
    const ev = HCDB.get("events").find(e => e.id === eventId);
    if (!ev) return;
    const confirmed = HCDB.eventConfirmedCount(ev.id);
    const full = confirmed >= ev.capacity;
    const user = HCAuth.currentUser();
    const hours = Math.floor(ev.durationMins / 60), mins = ev.durationMins % 60;

    modal.querySelector(".modal").innerHTML = `
      <button class="modal-close" aria-label="Close dialog">X</button>
      <span class="tag gold">${HC.esc(ev.category)}</span>
      <h2 id="modal-title" style="font-size:1.7rem; margin-top:14px">${HC.esc(ev.title)}</h2>
      <div class="event-meta" style="margin:14px 0 18px">
        <span>${HC.fmtDate(ev.date)}</span>
        <span>${HC.fmtTime(ev.date)} - ${hours ? hours + "h" : ""}${mins ? " " + mins + "m" : ""}</span>
        <span>${HC.esc(ev.location)}</span>
        <span>${HC.esc(ev.price)}</span>
      </div>
      ${capacityHtml(ev)}
      <p style="color:var(--gray-600); margin-top:18px">${HC.esc(ev.description)}</p>
      <p style="color:var(--gray-600); font-size:.92rem"><strong>Good to know:</strong> ${HC.esc(ev.details)}</p>
      ${full ? `<p class="impact-calc-result" style="margin-bottom:18px">This event is at capacity - register below to join the <strong>waitlist</strong> and we'll confirm you automatically if a spot opens.</p>` : ""}
      <form id="rsvp-form" novalidate style="margin-top:10px">
        <h3 style="font-size:1.15rem">${full ? "Join the Waitlist" : "Reserve Your Spot"}</h3>
        <div class="form-grid">
          <div class="field">
            <label for="rsvp-first">First Name <span class="req" aria-hidden="true">*</span></label>
            <input id="rsvp-first" name="firstName" autocomplete="given-name" required value="${HC.esc(user?.firstName || "")}">
            <span class="error-msg">Please enter your first name.</span>
          </div>
          <div class="field">
            <label for="rsvp-last">Last Name <span class="req" aria-hidden="true">*</span></label>
            <input id="rsvp-last" name="lastName" autocomplete="family-name" required value="${HC.esc(user?.lastName || "")}">
            <span class="error-msg">Please enter your last name.</span>
          </div>
          <div class="field">
            <label for="rsvp-email">Email <span class="req" aria-hidden="true">*</span></label>
            <input id="rsvp-email" name="email" type="email" autocomplete="email" required value="${HC.esc(user?.email || "")}">
            <span class="error-msg">Please enter a valid email.</span>
          </div>
          <div class="field">
            <label for="rsvp-phone">Phone</label>
            <input id="rsvp-phone" name="phone" type="tel" autocomplete="tel" value="${HC.esc(user?.phone || "")}">
          </div>
          <div class="field full">
            <label for="rsvp-notes">Notes (dietary needs, accessibility, questions)</label>
            <textarea id="rsvp-notes" name="notes" style="min-height:80px"></textarea>
          </div>
          <div class="field full" style="flex-direction:row; align-items:center; gap:10px">
            <input id="rsvp-remind" name="reminderOptIn" type="checkbox" checked style="width:auto">
            <label for="rsvp-remind" style="font-weight:500">Email me a reminder before the event</label>
          </div>
        </div>
        <div class="form-success" id="rsvp-success" role="status"></div>
        <button class="btn ${full ? "btn-outline" : "btn-gold"}" type="submit" style="margin-top:20px; width:100%">
          ${full ? "Join Waitlist" : "Confirm Registration"}
        </button>
      </form>`;

    modal.classList.add("open");
    document.body.style.overflow = "hidden";
    modal.querySelector(".modal-close").addEventListener("click", closeModal);
    modal.querySelector("#rsvp-form").addEventListener("submit", e => submitRsvp(e, ev));
    modal.querySelector(".modal-close").focus();
  }

  function closeModal() {
    modal.classList.remove("open");
    document.body.style.overflow = "";
    render();
  }

  function submitRsvp(e, ev) {
    e.preventDefault();
    const form = e.target;
    let valid = true;
    form.querySelectorAll(".field").forEach(f => f.classList.remove("invalid"));
    const get = n => form.elements[n].value.trim();

    if (!get("firstName")) { form.elements.firstName.closest(".field").classList.add("invalid"); valid = false; }
    if (!get("lastName")) { form.elements.lastName.closest(".field").classList.add("invalid"); valid = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(get("email"))) { form.elements.email.closest(".field").classList.add("invalid"); valid = false; }
    if (!valid) return;

    const result = HCDB.registerForEvent(ev.id, {
      firstName: get("firstName"), lastName: get("lastName"),
      email: get("email"), phone: get("phone"), notes: get("notes"),
      reminderOptIn: form.elements.reminderOptIn.checked
    });

    if (!result.ok) { HC.toast(result.message, "error"); return; }

    const box = form.querySelector("#rsvp-success");
    box.classList.add("show");
    if (result.status === "confirmed") {
      box.innerHTML = ` <strong>You're registered!</strong> A confirmation email has been sent to ${HC.esc(get("email"))}. We can't wait to see you at ${HC.esc(ev.title)}.`;
      HC.toast("Registration confirmed! Check your email.", "success");
    } else {
      box.innerHTML = ` <strong>You're on the waitlist.</strong> We'll email ${HC.esc(get("email"))} the moment a spot opens.`;
      HC.toast("Added to waitlist. We will notify you if a spot opens.", "success");
    }
    form.querySelector("button[type=submit]").disabled = true;
    // Simulated transactional email (production: SendGrid/Resend via API route)
    console.info(`[HER Circle] Confirmation email queued Sign In: ${get("email")} (${result.status}) for "${ev.title}"`);
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    await HCDB.ready;
    listEl = document.getElementById("events-list");
    modal = document.getElementById("event-modal");
    if (!listEl) return;

    // Category chips
    const chipRow = document.getElementById("category-chips");
    chipRow.innerHTML = CATEGORIES.map(c =>
      `<button class="chip" aria-pressed="${c === "All"}" data-cat="${c}">${c}</button>`).join("");
    chipRow.addEventListener("click", e => {
      const btn = e.target.closest(".chip");
      if (!btn) return;
      state.category = btn.dataset.cat;
      chipRow.querySelectorAll(".chip").forEach(c => c.setAttribute("aria-pressed", String(c === btn)));
      render();
    });

    document.getElementById("event-search").addEventListener("input", e => {
      state.search = e.target.value; render();
    });
    document.getElementById("event-sort").addEventListener("change", e => {
      state.sort = e.target.value; render();
    });

    listEl.addEventListener("click", e => {
      const btn = e.target.closest("[data-open]");
      if (btn) openModal(btn.dataset.open);
    });

    modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape" && modal.classList.contains("open")) closeModal(); });

    render();

    // Deep link: events.html#evt-id opens the detail modal
    if (location.hash) {
      const id = location.hash.slice(1);
      if (HCDB.get("events").some(ev => ev.id === id)) setTimeout(() => openModal(id), 350);
    }
  });
})();
