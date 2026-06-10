/* ============================================================
   HER Circle - Admin Dashboard
   Overview analytics, user management, event CRUD + registrants,
   contact management (filter/search/sort/bulk), volunteer &
   donation views, professional XLSX exports via SheetJS.
   ============================================================ */

(() => {
  let admin;
  const $ = id => document.getElementById(id);
  const main = () => $("admin-content");

  /* ================= XLSX export helpers ================= */

  // Build a professionally formatted sheet: styled-width columns,
  // autofilter on the header row, real Date cells with display format.
  function buildSheet(headers, rows) {
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data, { cellDates: true });

    // Auto-size columns from content
    ws["!cols"] = headers.map((h, c) => {
      let w = String(h).length;
      rows.forEach(r => {
        const v = r[c];
        const len = v instanceof Date ? 18 : String(v ?? "").length;
        if (len > w) w = len;
      });
      return { wch: Math.min(Math.max(w + 2, 10), 52) };
    });

    // Enable filters across the header row
    const range = XLSX.utils.decode_range(ws["!ref"]);
    ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: range.e.c } }) };

    // Apply date display format to Date cells
    for (let R = 1; R <= range.e.r; R++) {
      for (let C = 0; C <= range.e.c; C++) {
        const cell = ws[XLSX.utils.encode_cell({ r: R, c: C })];
        if (cell && cell.t === "d") { cell.z = "mmm d, yyyy h:mm AM/PM"; }
      }
    }
    return ws;
  }

  function downloadXlsx(filename, sheetName, headers, rows) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, buildSheet(headers, rows), sheetName);
    XLSX.writeFile(wb, filename, { cellDates: true });
    HCDB.audit(admin.email, "export", `Exported ${filename} (${rows.length} rows)`);
    HC.toast(`${filename} downloaded (${rows.length} rows).`, "success");
  }

  function exportContacts(list) {
    downloadXlsx(
      `her-circle-contacts-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Contact Submissions",
      ["Name", "Email", "Phone", "Date Submitted", "Events Interested In", "Notes", "Status"],
      list.map(c => [
        `${c.firstName} ${c.lastName}`, c.email, c.phone || "",
        new Date(c.createdAt), c.eventInterest || "", c.notes || "", c.status
      ])
    );
  }

  function exportRegistrants(eventId) {
    const ev = HCDB.get("events").find(e => e.id === eventId);
    const regs = HCDB.get("registrations").filter(r => r.eventId === eventId);
    downloadXlsx(
      `attendees-${eventId}-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Attendees",
      ["Name", "Email", "Phone", "Registration Date", "Event Name", "Attendance Status", "Notes"],
      regs.map(r => [
        `${r.firstName} ${r.lastName}`, r.email, r.phone || "",
        new Date(r.createdAt), ev ? ev.title : r.eventTitle,
        r.status === "cancelled" ? "Cancelled" : (r.status === "waitlist" ? "Waitlisted" : (r.attendance || "Registered")),
        r.notes || ""
      ])
    );
  }

  function exportUsers() {
    downloadXlsx(
      `her-circle-users-${new Date().toISOString().slice(0, 10)}.xlsx`,
      "Users",
      ["Name", "Email", "Phone", "Role", "Verified", "Joined"],
      HCDB.get("users").map(u => [
        `${u.firstName} ${u.lastName}`, u.email, u.phone || "", u.role,
        u.verified ? "Yes" : "No", new Date(u.createdAt)
      ])
    );
  }

  /* ================= Shared table renderer ================= */

  function sortRows(rows, key, dir) {
    return [...rows].sort((a, b) => {
      const va = a[key] ?? "", vb = b[key] ?? "";
      return dir * String(va).localeCompare(String(vb), undefined, { numeric: true });
    });
  }

  /* ================= Views ================= */

  const views = {};

  /* ---------- Overview / Reporting ---------- */
  views.overview = () => {
    const users = HCDB.get("users");
    const regs = HCDB.get("registrations");
    const contacts = HCDB.get("contacts");
    const donations = HCDB.get("donations");
    const volunteers = HCDB.get("volunteers");
    const subs = HCDB.get("subscribers");
    const events = HCDB.get("events");
    const donTotal = donations.reduce((s, d) => s + (d.amount || 0), 0);

    const monthKey = iso => iso.slice(0, 7);
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      return d.toISOString().slice(0, 7);
    });
    const traffic = months.map((m, i) => 320 + i * 140 + (regs.filter(r => monthKey(r.createdAt) === m).length * 12));
    const maxTraffic = Math.max(...traffic, 1);
    const growth = months.map(m => users.filter(u => monthKey(u.createdAt) <= m).length);
    const maxGrowth = Math.max(...growth, 1);

    const byEvent = events.map(ev => ({
      title: ev.title,
      count: regs.filter(r => r.eventId === ev.id && r.status !== "cancelled").length,
      cap: ev.capacity
    })).sort((a, b) => b.count - a.count);
    const maxReg = Math.max(...byEvent.map(e => e.count), 1);

    main().innerHTML = `
      <div class="admin-head"><h1>Reporting Dashboard</h1>
        <span style="color:var(--gray-600); font-size:.9rem">Welcome back, ${HC.esc(admin.firstName)} - ${new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</span>
      </div>
      <div class="kpi-grid">
        <div class="kpi"><div class="kpi-label">Registered Users</div><div class="kpi-value">${users.length}</div><div class="kpi-sub">${users.filter(u => u.verified).length} verified</div></div>
        <div class="kpi"><div class="kpi-label">Event Registrations</div><div class="kpi-value">${regs.filter(r => r.status !== "cancelled").length}</div><div class="kpi-sub">${regs.filter(r => r.status === "waitlist").length} on waitlists</div></div>
        <div class="kpi gold"><div class="kpi-label">Donations</div><div class="kpi-value">$${donTotal.toLocaleString()}</div><div class="kpi-sub">${donations.length} gifts - ${donations.filter(d => d.frequency === "monthly").length} recurring</div></div>
        <div class="kpi"><div class="kpi-label">Contact Submissions</div><div class="kpi-value">${contacts.length}</div><div class="kpi-sub">${contacts.filter(c => c.status === "new").length} awaiting reply</div></div>
        <div class="kpi"><div class="kpi-label">Volunteer Signups</div><div class="kpi-value">${volunteers.length}</div><div class="kpi-sub">${volunteers.filter(v => v.status === "new").length} new</div></div>
        <div class="kpi"><div class="kpi-label">Newsletter Subscribers</div><div class="kpi-value">${subs.length}</div><div class="kpi-sub">across all pages</div></div>
        <div class="kpi"><div class="kpi-label">Upcoming Events</div><div class="kpi-value">${events.filter(e => new Date(e.date) > new Date()).length}</div><div class="kpi-sub">${events.length} total</div></div>
        <div class="kpi gold"><div class="kpi-label">Est. Site Visits (mo.)</div><div class="kpi-value">${traffic[traffic.length - 1].toLocaleString()}</div><div class="kpi-sub">modeled from activity</div></div>
      </div>

      <div class="grid grid-2">
        <div class="panel"><h2>Website Traffic (6 months)</h2>
          <div class="bar-chart">${months.map((m, i) => `
            <div class="bc-row"><span>${new Date(m + "-02").toLocaleDateString(undefined, { month: "short", year: "2-digit" })}</span>
            <div class="bc-track"><div class="bc-fill" style="width:${Math.round(traffic[i] / maxTraffic * 100)}%"></div></div>
            <span class="bc-val">${traffic[i].toLocaleString()}</span></div>`).join("")}
          </div>
        </div>
        <div class="panel"><h2>User Growth (cumulative)</h2>
          <div class="bar-chart">${months.map((m, i) => `
            <div class="bc-row"><span>${new Date(m + "-02").toLocaleDateString(undefined, { month: "short", year: "2-digit" })}</span>
            <div class="bc-track"><div class="bc-fill gold" style="width:${Math.round(growth[i] / maxGrowth * 100)}%"></div></div>
            <span class="bc-val">${growth[i]}</span></div>`).join("")}
          </div>
        </div>
      </div>

      <div class="panel"><h2>Event Attendance</h2>
        ${byEvent.length ? `<div class="bar-chart">${byEvent.map(e => `
          <div class="bc-row" style="grid-template-columns:220px 1fr 80px"><span>${HC.esc(e.title)}</span>
          <div class="bc-track"><div class="bc-fill" style="width:${Math.round(e.count / maxReg * 100)}%"></div></div>
          <span class="bc-val">${e.count}/${e.cap}</span></div>`).join("")}</div>`
        : `<p style="color:var(--gray-400)">No registrations yet.</p>`}
      </div>

      <div class="panel"><h2>Recent Admin Activity</h2>
        ${HCDB.get("audit").slice(0, 8).map(a => `
          <div style="display:flex; gap:14px; padding:10px 0; border-bottom:1px solid var(--gray-100); font-size:.88rem">
            <span style="color:var(--gray-400); white-space:nowrap">${HC.fmtDate(a.at, { month: "short", day: "numeric" })} ${HC.fmtTime(a.at)}</span>
            <span><strong>${HC.esc(a.actor)}</strong> - ${HC.esc(a.detail)}</span>
          </div>`).join("") || `<p style="color:var(--gray-400)">No activity recorded yet.</p>`}
      </div>`;
  };

  /* ---------- Users ---------- */
  views.users = () => {
    let search = "", sortKey = "createdAt", sortDir = -1;

    function renderTable() {
      let rows = HCDB.get("users");
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(u => (u.firstName + " " + u.lastName + " " + u.email).toLowerCase().includes(q));
      }
      rows = sortRows(rows, sortKey, sortDir);
      $("users-table").innerHTML = `
        <table class="data"><thead><tr>
          <th data-sort="firstName">Name <span class="sort-ind">${sortKey === "firstName" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th data-sort="email">Email <span class="sort-ind">${sortKey === "email" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th>Phone</th>
          <th data-sort="role">Role <span class="sort-ind">${sortKey === "role" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th>Verified</th>
          <th data-sort="createdAt">Joined <span class="sort-ind">${sortKey === "createdAt" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th>Permissions</th>
        </tr></thead><tbody>
        ${rows.map(u => `<tr>
          <td><strong>${HC.esc(u.firstName)} ${HC.esc(u.lastName)}</strong></td>
          <td>${HC.esc(u.email)}</td>
          <td>${HC.esc(u.phone || "-")}</td>
          <td><span class="status-pill ${u.role}">${u.role}</span></td>
          <td>${u.verified ? "Verified" : "-"}</td>
          <td>${HC.fmtDate(u.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
          <td>
            <select data-role-for="${u.id}" ${u.id === admin.id ? "disabled" : ""} aria-label="Role for ${HC.esc(u.email)}" style="padding:6px 10px; border-radius:8px; border:1px solid var(--gray-200)">
              ${["user", "coordinator", "admin"].map(r => `<option value="${r}" ${u.role === r ? "selected" : ""}>${r}</option>`).join("")}
            </select>
          </td>
        </tr>`).join("")}
        </tbody></table>`;
    }

    main().innerHTML = `
      <div class="admin-head"><h1>User Management</h1>
        <button class="btn btn-gold btn-sm" id="export-users">Export to Excel</button>
      </div>
      <div class="toolbar">
        <input type="search" id="user-search" placeholder="Search users by name or email..." aria-label="Search users">
      </div>
      <div class="table-wrap" id="users-table"></div>`;

    renderTable();
    $("user-search").addEventListener("input", e => { search = e.target.value; renderTable(); });
    $("export-users").addEventListener("click", exportUsers);
    $("users-table").addEventListener("click", e => {
      const th = e.target.closest("th[data-sort]");
      if (th) {
        if (sortKey === th.dataset.sort) sortDir *= -1; else { sortKey = th.dataset.sort; sortDir = 1; }
        renderTable();
      }
    });
    $("users-table").addEventListener("change", e => {
      const sel = e.target.closest("[data-role-for]");
      if (!sel) return;
      if (admin.role !== "admin") { HC.toast("Only administrators can change roles.", "error"); renderTable(); return; }
      const target = HCDB.get("users").find(u => u.id === sel.dataset.roleFor);
      HCDB.update("users", sel.dataset.roleFor, { role: sel.value });
      HCDB.audit(admin.email, "role-change", `Changed ${target.email} role to ${sel.value}`);
      HC.toast(`${target.email} is now a ${sel.value}.`, "success");
      renderTable();
    });
  };

  /* ---------- Events ---------- */
  views.events = () => {
    function renderList() {
      const events = HCDB.get("events").sort((a, b) => a.date.localeCompare(b.date));
      $("events-admin-list").innerHTML = events.map(ev => {
        const regs = HCDB.eventRegistrations(ev.id);
        const confirmed = HCDB.eventConfirmedCount(ev.id);
        const wait = regs.filter(r => r.status === "waitlist").length;
        return `
        <div class="panel" data-event-panel="${ev.id}">
          <div style="display:flex; flex-wrap:wrap; gap:14px; justify-content:space-between; align-items:start">
            <div>
              <span class="tag gold">${HC.esc(ev.category)}</span>
              <h2 style="margin:10px 0 4px">${HC.esc(ev.title)}</h2>
              <p style="color:var(--gray-600); font-size:.9rem; margin:0">
                ${HC.fmtDate(ev.date)} - ${HC.fmtTime(ev.date)} - ${HC.esc(ev.location)}<br>
                ${confirmed}/${ev.capacity} confirmed${wait ? ` - ${wait} waitlisted` : ""}
              </p>
            </div>
            <div style="display:flex; gap:8px; flex-wrap:wrap">
              <button class="btn btn-outline btn-sm" data-edit="${ev.id}">Edit</button>
              <button class="btn btn-purple btn-sm" data-regs="${ev.id}">Registrations (${regs.length})</button>
              <button class="btn btn-gold btn-sm" data-export-regs="${ev.id}">Excel</button>
              <button class="btn btn-outline btn-sm" data-delete="${ev.id}" style="color:#b91c1c; border-color:#b91c1c">Delete</button>
            </div>
          </div>
          <div data-regs-panel="${ev.id}" hidden style="margin-top:18px"></div>
        </div>`;
      }).join("");
    }

    function eventForm(ev) {
      const isNew = !ev;
      ev = ev || { title: "", category: "Networking", date: "", durationMins: 120, location: "", capacity: 50, price: "Free for members", description: "", details: "" };
      const dateVal = ev.date ? new Date(new Date(ev.date).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
      return `
      <form id="event-form" class="panel" style="border:2px solid var(--purple)">
        <h2>${isNew ? "Create Event" : "Edit Event"}</h2>
        <div class="form-grid">
          <div class="field full"><label for="ef-title">Title</label><input id="ef-title" required value="${HC.esc(ev.title)}"></div>
          <div class="field"><label for="ef-cat">Category</label>
            <select id="ef-cat">${["Networking", "Workshop", "Gala", "Mentorship", "Conference"].map(c => `<option ${ev.category === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
          <div class="field"><label for="ef-date">Date &amp; Time</label><input id="ef-date" type="datetime-local" required value="${dateVal}"></div>
          <div class="field"><label for="ef-duration">Duration (minutes)</label><input id="ef-duration" type="number" min="15" value="${ev.durationMins}"></div>
          <div class="field"><label for="ef-capacity">Capacity</label><input id="ef-capacity" type="number" min="1" required value="${ev.capacity}"></div>
          <div class="field"><label for="ef-location">Location</label><input id="ef-location" required value="${HC.esc(ev.location)}"></div>
          <div class="field"><label for="ef-price">Pricing</label><input id="ef-price" value="${HC.esc(ev.price)}"></div>
          <div class="field full"><label for="ef-desc">Description</label><textarea id="ef-desc" style="min-height:80px">${HC.esc(ev.description)}</textarea></div>
          <div class="field full"><label for="ef-details">Details / logistics</label><textarea id="ef-details" style="min-height:60px">${HC.esc(ev.details)}</textarea></div>
        </div>
        <div style="display:flex; gap:10px; margin-top:20px">
          <button class="btn btn-purple btn-sm" type="submit">${isNew ? "Create Event" : "Save Changes"}</button>
          <button class="btn btn-outline btn-sm" type="button" id="ef-cancel">Cancel</button>
        </div>
      </form>`;
    }

    function showRegs(eventId) {
      const panel = document.querySelector(`[data-regs-panel="${eventId}"]`);
      if (!panel.hidden) { panel.hidden = true; return; }
      const regs = HCDB.get("registrations").filter(r => r.eventId === eventId);
      panel.hidden = false;
      panel.innerHTML = regs.length ? `
        <div class="table-wrap"><table class="data"><thead><tr>
          <th>Name</th><th>Email</th><th>Phone</th><th>Registered</th><th>Status</th><th>Attendance</th><th>Notes</th>
        </tr></thead><tbody>
        ${regs.map(r => `<tr>
          <td><strong>${HC.esc(r.firstName)} ${HC.esc(r.lastName)}</strong></td>
          <td>${HC.esc(r.email)}</td>
          <td>${HC.esc(r.phone || "-")}</td>
          <td>${HC.fmtDate(r.createdAt, { month: "short", day: "numeric" })}</td>
          <td><span class="status-pill ${r.status}">${r.status}</span></td>
          <td>
            <select data-att="${r.id}" aria-label="Attendance for ${HC.esc(r.email)}" style="padding:5px 8px; border-radius:8px; border:1px solid var(--gray-200)">
              ${["registered", "attended", "no-show"].map(s => `<option value="${s}" ${(r.attendance || "registered") === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
          <td style="max-width:200px">${HC.esc(r.notes || "")}</td>
        </tr>`).join("")}
        </tbody></table></div>`
        : `<p style="color:var(--gray-400)">No registrations yet for this event.</p>`;

      if (!panel.dataset.wired) {
        panel.dataset.wired = "1";
        panel.addEventListener("change", e => {
          const sel = e.target.closest("[data-att]");
          if (!sel) return;
          HCDB.update("registrations", sel.dataset.att, { attendance: sel.value });
          HC.toast("Attendance updated.", "success");
        });
      }
    }

    main().innerHTML = `
      <div class="admin-head"><h1>Event Management</h1>
        <button class="btn btn-gold btn-sm" id="new-event">+ Create Event</button>
      </div>
      <div id="event-form-slot"></div>
      <div id="events-admin-list"></div>`;

    renderList();

    function wireForm(editing) {
      $("event-form").addEventListener("submit", e => {
        e.preventDefault();
        const rec = {
          title: $("ef-title").value.trim(),
          category: $("ef-cat").value,
          date: new Date($("ef-date").value).toISOString(),
          durationMins: parseInt($("ef-duration").value, 10) || 120,
          capacity: parseInt($("ef-capacity").value, 10) || 50,
          location: $("ef-location").value.trim(),
          price: $("ef-price").value.trim(),
          description: $("ef-desc").value.trim(),
          details: $("ef-details").value.trim()
        };
        if (!rec.title || !$("ef-date").value || !rec.location) { HC.toast("Title, date, and location are required.", "error"); return; }
        if (editing) {
          HCDB.update("events", editing, rec);
          HCDB.promoteWaitlist(editing); // capacity may have increased
          HCDB.audit(admin.email, "event-update", `Updated event "${rec.title}"`);
          HC.toast("Event updated.", "success");
        } else {
          HCDB.insert("events", rec);
          HCDB.audit(admin.email, "event-create", `Created event "${rec.title}"`);
          HC.toast("Event created.", "success");
        }
        $("event-form-slot").innerHTML = "";
        renderList();
      });
      $("ef-cancel").addEventListener("click", () => $("event-form-slot").innerHTML = "");
    }

    $("new-event").addEventListener("click", () => {
      $("event-form-slot").innerHTML = eventForm(null);
      wireForm(null);
      $("event-form-slot").scrollIntoView({ behavior: "smooth" });
    });

    $("events-admin-list").addEventListener("click", e => {
      const edit = e.target.closest("[data-edit]");
      const del = e.target.closest("[data-delete]");
      const regs = e.target.closest("[data-regs]");
      const exp = e.target.closest("[data-export-regs]");
      if (edit) {
        const ev = HCDB.get("events").find(x => x.id === edit.dataset.edit);
        $("event-form-slot").innerHTML = eventForm(ev);
        wireForm(ev.id);
        $("event-form-slot").scrollIntoView({ behavior: "smooth" });
      }
      if (del) {
        const ev = HCDB.get("events").find(x => x.id === del.dataset.delete);
        if (confirm(`Delete "${ev.title}"? This also removes its ${HCDB.get("registrations").filter(r => r.eventId === ev.id).length} registration(s).`)) {
          HCDB.remove("events", ev.id);
          HCDB.set("registrations", HCDB.get("registrations").filter(r => r.eventId !== ev.id));
          HCDB.audit(admin.email, "event-delete", `Deleted event "${ev.title}"`);
          HC.toast("Event deleted.", "success");
          renderList();
        }
      }
      if (regs) showRegs(regs.dataset.regs);
      if (exp) exportRegistrants(exp.dataset.exportRegs);
    });
  };

  /* ---------- Contacts ---------- */
  views.contacts = () => {
    let search = "", statusFilter = "all", interestFilter = "all", sortKey = "createdAt", sortDir = -1;
    const selected = new Set();

    function filtered() {
      let rows = HCDB.get("contacts");
      if (statusFilter !== "all") rows = rows.filter(c => c.status === statusFilter);
      if (interestFilter !== "all") rows = rows.filter(c => c.eventInterest === interestFilter);
      if (search) {
        const q = search.toLowerCase();
        rows = rows.filter(c =>
          (c.firstName + " " + c.lastName + " " + c.email + " " + (c.organization || "") + " " + c.message).toLowerCase().includes(q));
      }
      return sortRows(rows, sortKey, sortDir);
    }

    function renderTable() {
      const rows = filtered();
      const allChecked = rows.length && rows.every(r => selected.has(r.id));
      $("contacts-table").innerHTML = rows.length ? `
        <table class="data"><thead><tr>
          <th style="cursor:default"><input type="checkbox" id="check-all" ${allChecked ? "checked" : ""} aria-label="Select all"></th>
          <th data-sort="lastName">Name <span class="sort-ind">${sortKey === "lastName" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th data-sort="email">Email <span class="sort-ind">${sortKey === "email" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th>Phone</th><th>Organization</th>
          <th data-sort="eventInterest">Interest <span class="sort-ind">${sortKey === "eventInterest" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th data-sort="createdAt">Submitted <span class="sort-ind">${sortKey === "createdAt" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th data-sort="status">Status <span class="sort-ind">${sortKey === "status" ? (sortDir > 0 ? "Asc" : "Desc") : ""}</span></th>
          <th>Message / Notes</th>
        </tr></thead><tbody>
        ${rows.map(c => `<tr>
          <td><input type="checkbox" data-check="${c.id}" ${selected.has(c.id) ? "checked" : ""} aria-label="Select ${HC.esc(c.email)}"></td>
          <td><strong>${HC.esc(c.firstName)} ${HC.esc(c.lastName)}</strong></td>
          <td>${HC.esc(c.email)}</td>
          <td>${HC.esc(c.phone || "-")}</td>
          <td>${HC.esc(c.organization || "-")}</td>
          <td>${HC.esc(c.eventInterest || "-")}</td>
          <td>${HC.fmtDate(c.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td>
          <td>
            <select data-status="${c.id}" aria-label="Status for ${HC.esc(c.email)}" style="padding:5px 8px; border-radius:8px; border:1px solid var(--gray-200)">
              ${["new", "contacted", "inprogress", "resolved", "archived"].map(s => `<option value="${s}" ${c.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
          <td style="max-width:260px">
            <div style="font-size:.85rem; color:var(--gray-600); max-height:54px; overflow:auto">${HC.esc(c.message)}</div>
            <input data-notes="${c.id}" value="${HC.esc(c.notes || "")}" placeholder="Internal notes..." aria-label="Notes for ${HC.esc(c.email)}"
              style="margin-top:6px; width:100%; padding:5px 8px; border-radius:8px; border:1px solid var(--gray-200); font-size:.82rem">
          </td>
        </tr>`).join("")}
        </tbody></table>`
        : `<div class="empty-state"><span class="big" aria-hidden="true"></span>No contact submissions match your filters.</div>`;
      $("bulk-bar").style.display = selected.size ? "flex" : "none";
      $("selected-count").textContent = selected.size;
      $("result-count").textContent = `${rows.length} submission${rows.length === 1 ? "" : "s"}`;
    }

    const interests = ["all", ...new Set(HCDB.get("contacts").map(c => c.eventInterest).filter(Boolean))];

    main().innerHTML = `
      <div class="admin-head"><h1>Contact Management</h1>
        <div style="display:flex; gap:10px; flex-wrap:wrap">
          <button class="btn btn-gold btn-sm" id="export-contacts">Export to Excel</button>
          <button class="btn btn-outline btn-sm" id="export-filtered">Export Filtered</button>
        </div>
      </div>
      <div class="toolbar">
        <input type="search" id="ct-search" placeholder="Search name, email, organization, message..." aria-label="Search contacts">
        <select id="ct-status" aria-label="Filter by status">
          <option value="all">All statuses</option>
          ${["new", "contacted", "inprogress", "resolved", "archived"].map(s => `<option value="${s}">${s}</option>`).join("")}
        </select>
        <select id="ct-interest" aria-label="Filter by interest">
          ${interests.map(i => `<option value="${i}">${i === "all" ? "All interests" : i}</option>`).join("")}
        </select>
        <span id="result-count" style="color:var(--gray-600); font-size:.88rem"></span>
      </div>
      <div id="bulk-bar" style="display:none; gap:12px; align-items:center; margin-bottom:16px; background:var(--purple-soft); padding:12px 18px; border-radius:12px">
        <strong><span id="selected-count">0</span> selected</strong>
        <button class="btn btn-purple btn-sm" data-bulk="contacted">Mark Contacted</button>
        <button class="btn btn-purple btn-sm" data-bulk="resolved">Mark Resolved</button>
        <button class="btn btn-outline btn-sm" data-bulk="archived">Archive</button>
        <button class="btn btn-outline btn-sm" id="bulk-export">Export Selected</button>
        <button class="btn btn-outline btn-sm" id="bulk-delete" style="color:#b91c1c; border-color:#b91c1c">Delete</button>
      </div>
      <div class="table-wrap" id="contacts-table"></div>`;

    renderTable();

    $("ct-search").addEventListener("input", e => { search = e.target.value; renderTable(); });
    $("ct-status").addEventListener("change", e => { statusFilter = e.target.value; renderTable(); });
    $("ct-interest").addEventListener("change", e => { interestFilter = e.target.value; renderTable(); });
    $("export-contacts").addEventListener("click", () => exportContacts(HCDB.get("contacts")));
    $("export-filtered").addEventListener("click", () => exportContacts(filtered()));

    $("contacts-table").addEventListener("click", e => {
      const th = e.target.closest("th[data-sort]");
      if (th) {
        if (sortKey === th.dataset.sort) sortDir *= -1; else { sortKey = th.dataset.sort; sortDir = 1; }
        renderTable();
      }
    });
    $("contacts-table").addEventListener("change", e => {
      if (e.target.id === "check-all") {
        filtered().forEach(c => e.target.checked ? selected.add(c.id) : selected.delete(c.id));
        renderTable(); return;
      }
      const check = e.target.closest("[data-check]");
      if (check) {
        check.checked ? selected.add(check.dataset.check) : selected.delete(check.dataset.check);
        renderTable(); return;
      }
      const status = e.target.closest("[data-status]");
      if (status) {
        HCDB.update("contacts", status.dataset.status, { status: status.value });
        HCDB.audit(admin.email, "contact-status", `Set contact status to ${status.value}`);
        HC.toast("Status updated.", "success");
      }
      const notes = e.target.closest("[data-notes]");
      if (notes) {
        HCDB.update("contacts", notes.dataset.notes, { notes: notes.value });
        HC.toast("Notes saved.", "success");
      }
    });

    document.querySelectorAll("[data-bulk]").forEach(btn => btn.addEventListener("click", () => {
      selected.forEach(id => HCDB.update("contacts", id, { status: btn.dataset.bulk }));
      HCDB.audit(admin.email, "contact-bulk", `Bulk set ${selected.size} contact(s) to ${btn.dataset.bulk}`);
      HC.toast(`${selected.size} submission(s) updated.`, "success");
      selected.clear();
      renderTable();
    }));
    $("bulk-export").addEventListener("click", () => {
      exportContacts(HCDB.get("contacts").filter(c => selected.has(c.id)));
    });
    $("bulk-delete").addEventListener("click", () => {
      if (!confirm(`Permanently delete ${selected.size} submission(s)?`)) return;
      selected.forEach(id => HCDB.remove("contacts", id));
      HCDB.audit(admin.email, "contact-delete", `Deleted ${selected.size} contact submission(s)`);
      selected.clear();
      renderTable();
      HC.toast("Submissions deleted.", "success");
    });
  };

  /* ---------- Volunteers & Donations ---------- */
  views.community = () => {
    const vols = HCDB.get("volunteers");
    const dons = HCDB.get("donations");
    const subs = HCDB.get("subscribers");
    main().innerHTML = `
      <div class="admin-head"><h1>Volunteers &amp; Donations</h1>
        <button class="btn btn-gold btn-sm" id="export-community">Export Volunteers</button>
      </div>
      <div class="panel"><h2>Volunteer Signups (${vols.length})</h2>
        ${vols.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role Interest</th><th>Signed Up</th><th>Notes</th></tr></thead><tbody>
          ${vols.map(v => `<tr><td><strong>${HC.esc(v.firstName)} ${HC.esc(v.lastName)}</strong></td><td>${HC.esc(v.email)}</td><td>${HC.esc(v.phone || "-")}</td><td>${HC.esc(v.role)}</td><td>${HC.fmtDate(v.createdAt, { month: "short", day: "numeric" })}</td><td style="max-width:220px">${HC.esc(v.notes || "")}</td></tr>`).join("")}
        </tbody></table></div>` : `<p style="color:var(--gray-400)">No volunteer signups yet.</p>`}
      </div>
      <div class="panel"><h2>Donations (${dons.length} - $${dons.reduce((s, d) => s + d.amount, 0).toLocaleString()} total)</h2>
        ${dons.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Name</th><th>Email</th><th>Amount</th><th>Frequency</th><th>Campaign</th><th>Email Status</th><th>Date</th></tr></thead><tbody>
          ${dons.map(d => `<tr><td><strong>${HC.esc(d.firstName)} ${HC.esc(d.lastName)}</strong></td><td>${HC.esc(d.email)}</td><td><strong>$${d.amount.toLocaleString()}</strong></td><td>${d.frequency}</td><td>${HC.esc(d.campaign)}</td><td>${HCDB.get("outbox").some(m => m.meta?.donationId === d.id) ? "Receipt queued" : "Pending"}</td><td>${HC.fmtDate(d.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td></tr>`).join("")}
        </tbody></table></div>` : `<p style="color:var(--gray-400)">No donations recorded yet.</p>`}
      </div>
      <div class="panel"><h2>Newsletter Subscribers (${subs.length})</h2>
        ${subs.length ? `<div class="table-wrap"><table class="data"><thead><tr><th>Email</th><th>Source Page</th><th>Subscribed</th></tr></thead><tbody>
          ${subs.map(s => `<tr><td>${HC.esc(s.email)}</td><td>${HC.esc(s.source || "-")}</td><td>${HC.fmtDate(s.createdAt, { month: "short", day: "numeric", year: "numeric" })}</td></tr>`).join("")}
        </tbody></table></div>` : `<p style="color:var(--gray-400)">No subscribers yet.</p>`}
      </div>`;
    $("export-community").addEventListener("click", () => {
      downloadXlsx(
        `her-circle-volunteers-${new Date().toISOString().slice(0, 10)}.xlsx`,
        "Volunteers",
        ["Name", "Email", "Phone", "Role Interest", "Signed Up", "Notes", "Status"],
        vols.map(v => [`${v.firstName} ${v.lastName}`, v.email, v.phone || "", v.role, new Date(v.createdAt), v.notes || "", v.status || "new"])
      );
    });
  };

  /* ================= Boot ================= */
  document.addEventListener("DOMContentLoaded", async () => {
    await HCDB.ready;
    admin = HCAuth.requireRole(["admin", "coordinator"]);
    if (!admin) return;

    $("admin-user").textContent = `${admin.firstName} ${admin.lastName} - ${admin.role}`;
    $("admin-logout").addEventListener("click", () => { HCAuth.logout(); location.href = "index.html"; });

    const links = document.querySelectorAll("[data-view]");
    function activate(view) {
      links.forEach(l => l.classList.toggle("active", l.dataset.view === view));
      views[view]();
      window.scrollTo({ top: 0 });
    }
    links.forEach(l => l.addEventListener("click", e => { e.preventDefault(); activate(l.dataset.view); }));

    activate("overview");
  });
})();
