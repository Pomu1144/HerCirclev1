/* ============================================================
   HER Circle - Data Layer
   localStorage-backed store. Mirrors the production PostgreSQL
   schema (see README.md) so it can be swapped for real API calls.
   ============================================================ */

const HCDB = (() => {
  const PREFIX = "hc_";
  const VERSION = 4;

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  }
  function write(key, value) {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  /* ---------- Seed data ---------- */

  function futureDate(daysAhead, hour = 18) {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  const SEED_EVENTS = [
    {
      id: "evt-launch-gala", title: "HER Circle Launch Gala",
      category: "Gala", date: futureDate(24, 18), durationMins: 240,
      location: "The Grand Ballroom, Downtown", capacity: 150,
      price: "Ticketed", description:
        "An unforgettable evening celebrating the official launch of HER Circle. Join founders, executives, and entrepreneurs for dinner, inspiring keynotes, and the connections that will define the year ahead.",
      details: "Cocktail attire. Includes a three-course dinner, keynote address, member recognition awards, and live entertainment. Valet parking available.",
      featured: true
    },
    {
      id: "evt-power-network", title: "Power Hour Networking Breakfast",
      category: "Networking", date: futureDate(9, 8), durationMins: 90,
      location: "Riverside Conference Center", capacity: 60,
      price: "Free for members", description:
        "Start your morning with intention. Structured speed-networking designed to spark real business relationships - every attendee leaves with at least five new connections.",
      details: "Coffee and a light breakfast provided. Bring business cards. Doors open 7:45 AM.",
      featured: true
    },
    {
      id: "evt-pitch-workshop", title: "Pitch Perfect: Tell Your Business Story",
      category: "Workshop", date: futureDate(16, 17), durationMins: 150,
      location: "HER Circle Hub - Suite 200", capacity: 30,
      price: "Ticketed", description:
        "A hands-on workshop where you'll craft and practice a compelling pitch for your business or personal brand, with live coaching from communication experts.",
      details: "Limited to 30 seats for personalized feedback. Bring a one-paragraph description of your business or goal.",
      featured: true
    },
    {
      id: "evt-mentor-match", title: "Mentorship Circle Kickoff",
      category: "Mentorship", date: futureDate(31, 18), durationMins: 120,
      location: "Virtual (Zoom)", capacity: 80,
      price: "Free for members", description:
        "Meet your mentorship cohort. We pair emerging entrepreneurs with seasoned leaders for a structured six-month growth journey.",
      details: "Mentor/mentee pairings announced live. Six-month program with monthly circle sessions.",
      featured: false
    },
    {
      id: "evt-leadership-summit", title: "Women in Leadership Summit",
      category: "Conference", date: futureDate(52, 9), durationMins: 480,
      location: "Metropolitan Convention Center", capacity: 300,
      price: "Ticketed", description:
        "A full-day summit featuring panels, breakout sessions, and keynotes from women leading companies, nonprofits, and communities. Our flagship learning event of the year.",
      details: "Includes lunch, summit workbook, and access to the speaker meet-and-greet. Early-bird pricing available.",
      featured: false
    },
    {
      id: "evt-finance-masterclass", title: "Funding & Finance Masterclass",
      category: "Workshop", date: futureDate(38, 17), durationMins: 120,
      location: "HER Circle Hub - Suite 200", capacity: 40,
      price: "Free for members", description:
        "Demystify business finance: funding options, credit, cash flow, and how to talk to lenders and investors with confidence.",
      details: "Led by a panel of finance professionals and small-business lenders. Q&A included.",
      featured: false
    }
  ];

  const SEED_PROGRAMS = [
    {
      id: "prog-mentorship", title: "Circle Mentorship",
      tagline: "Six-month guided mentorship pairing emerging women entrepreneurs with seasoned leaders.",
      icon: "Mentorship",
      impact: { mentees: 48, completion: 92, satisfaction: 4.8 },
      description: "Our flagship program pairs members with experienced mentors for a structured six-month journey: monthly one-on-ones, quarterly circle sessions, and a personal growth roadmap. Mentees set measurable goals and graduate with an expanded network and a clear plan.",
      volunteer: "Become a mentor - share 3 hours a month to change a career trajectory."
    },
    {
      id: "prog-academy", title: "HER Business Academy",
      tagline: "Practical workshops on finance, marketing, operations, and leadership for women building businesses.",
      icon: "Academy",
      impact: { workshops: 24, attendees: 600, launched: 35 },
      description: "A rolling curriculum of expert-led workshops covering the real mechanics of building a business - pricing, funding, marketing, hiring, and legal foundations. Members earn certificates and lifetime access to session resources.",
      volunteer: "Teach a workshop - we welcome professionals to share their expertise."
    },
    {
      id: "prog-connect", title: "Connect & Collaborate",
      tagline: "Monthly networking experiences engineered for genuine connection, not card-swapping.",
      icon: "Network",
      impact: { events: 36, connections: 2400, collaborations: 85 },
      description: "From structured power-hours to industry roundtables and social mixers, our events are designed so every woman walks away with relationships that matter. Members report an average of five meaningful new connections per event.",
      volunteer: "Host or co-host an event - venue partners and facilitators welcome."
    },
    {
      id: "prog-visibility", title: "Visibility Project",
      tagline: "Spotlighting member businesses through features, showcases, and community campaigns.",
      icon: "Visibility",
      impact: { features: 120, reach: 50000, spotlights: 52 },
      description: "We amplify our members: weekly business spotlights, a member directory, showcase pop-ups, and collaborative marketing campaigns that put women-owned businesses in front of new audiences.",
      volunteer: "Join the media team - writers, photographers, and social storytellers needed."
    }
  ];

  const SEED_TESTIMONIALS = [
    { quote: "HER Circle changed the trajectory of my business. Within three months I found a mentor, two collaborators, and the confidence to triple my prices.", who: "Amara J.", role: "Founder, Bloom Skincare Co." },
    { quote: "I've been to a hundred networking events. This is the first community where women genuinely open doors for each other.", who: "Denise W.", role: "VP of Operations, Regional Health Group" },
    { quote: "The Business Academy gave me the financial literacy I never got anywhere else. I secured my first business loan six weeks later.", who: "Priya S.", role: "Owner, Saffron Catering" },
    { quote: "As a mentor, I get back more than I give. Watching my mentee launch her firm was one of the proudest moments of my career.", who: "Carolyn T.", role: "Attorney & Circle Mentor" }
  ];

  const SEED_CAMPAIGNS = [
    { id: "camp-scholarship", title: "Founders Scholarship Fund", goal: 25000, raised: 16750, description: "Covers Academy tuition and membership for 50 women entrepreneurs facing financial barriers." },
    { id: "camp-hub", title: "HER Circle Hub Expansion", goal: 60000, raised: 22400, description: "Expanding our community hub with a co-working space, podcast studio, and event venue for members." },
    { id: "camp-mentorship", title: "Mentorship Program Growth", goal: 15000, raised: 11200, description: "Training, matching, and supporting 100 new mentor-mentee pairs this year." }
  ];

  /* ---------- Initialization ---------- */

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  async function init() {
    if (read("version", 0) >= VERSION) return;
    write("version", VERSION);
    if (!read("events")) write("events", SEED_EVENTS);
    if (!read("programs")) write("programs", SEED_PROGRAMS);
    if (!read("testimonials")) write("testimonials", SEED_TESTIMONIALS);
    if (!read("campaigns")) write("campaigns", SEED_CAMPAIGNS);
    if (!read("registrations")) write("registrations", []);
    if (!read("contacts")) write("contacts", []);
    if (!read("donations")) write("donations", []);
    if (!read("volunteers")) write("volunteers", []);
    if (!read("subscribers")) write("subscribers", []);
    if (!read("outbox")) write("outbox", []);
    if (!read("audit")) write("audit", []);
    if (!read("audit", []).length) write("audit", [
      { id: uid(), actor: "system@hercircle.org", action: "dashboard-review", detail: "Dashboard health check completed: users, events, donations, contacts, volunteers, and subscribers reviewed.", at: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
      { id: uid(), actor: "system@hercircle.org", action: "export-ready", detail: "Admin reporting exports prepared for users, contacts, attendees, volunteers, and donations.", at: new Date(Date.now() - 1000 * 60 * 90).toISOString() },
      { id: uid(), actor: "system@hercircle.org", action: "email-service", detail: "Donation receipt and team notification email templates are active in the local mail outbox.", at: new Date(Date.now() - 1000 * 60 * 120).toISOString() }
    ]);

    // Seed demo accounts (demo only - production uses server-side bcrypt; see README)
    const users = read("users", []);
    if (!users.some(u => u.email === "admin@hercircle.org")) {
      const salt = uid();
      users.push({
        id: uid(), firstName: "Alexis", lastName: "Carter",
        email: "admin@hercircle.org", phone: "(555) 010-1000",
        role: "admin", verified: true, salt,
        passwordHash: await sha256("Admin123!" + salt),
        createdAt: new Date().toISOString()
      });
      const salt2 = uid();
      users.push({
        id: uid(), firstName: "Jordan", lastName: "Lee",
        email: "coordinator@hercircle.org", phone: "(555) 010-2000",
        role: "coordinator", verified: true, salt: salt2,
        passwordHash: await sha256("Coord123!" + salt2),
        createdAt: new Date().toISOString()
      });
      write("users", users);
    }

    const currentUsers = read("users", []);
    if (!currentUsers.some(u => u.email === "member@hercircle.org")) {
      const salt3 = uid();
      currentUsers.push({
        id: uid(), firstName: "Morgan", lastName: "Taylor",
        email: "member@hercircle.org", phone: "(555) 010-3000",
        role: "user", verified: true, salt: salt3,
        passwordHash: await sha256("Member123!" + salt3),
        createdAt: new Date().toISOString()
      });
      write("users", currentUsers);
    }

    const demoUser = read("users", []).find(u => u.email === "member@hercircle.org");
    if (demoUser && !read("registrations", []).some(r => r.email === demoUser.email)) {
      const firstEvent = read("events", [])[0];
      if (firstEvent) {
        insert("registrations", {
          eventId: firstEvent.id, eventTitle: firstEvent.title,
          firstName: demoUser.firstName, lastName: demoUser.lastName, email: demoUser.email, phone: demoUser.phone,
          notes: "Default member registration for dashboard review.", status: "confirmed", attendance: "registered", reminderOptIn: true
        });
      }
      insert("donations", {
        firstName: demoUser.firstName, lastName: demoUser.lastName, email: demoUser.email, amount: 50, frequency: "monthly", campaign: "General Fund"
      });
      insert("subscribers", { email: demoUser.email, source: "default-account" });
    }
  }

  /* ---------- Collection helpers ---------- */

  const get = (key) => read(key, []);
  const set = (key, val) => write(key, val);

  function insert(key, record) {
    const rows = get(key);
    record.id = record.id || uid();
    record.createdAt = record.createdAt || new Date().toISOString();
    rows.push(record);
    set(key, rows);
    return record;
  }

  function update(key, id, patch) {
    const rows = get(key);
    const i = rows.findIndex(r => r.id === id);
    if (i === -1) return null;
    rows[i] = { ...rows[i], ...patch, updatedAt: new Date().toISOString() };
    set(key, rows);
    return rows[i];
  }

  function remove(key, id) {
    set(key, get(key).filter(r => r.id !== id));
  }

  function audit(actorEmail, action, detail) {
    const rows = get("audit");
    rows.unshift({ id: uid(), actor: actorEmail, action, detail, at: new Date().toISOString() });
    set("audit", rows.slice(0, 500));
  }

  function queueEmail({ to, subject, message, type = "general", meta = {} }) {
    const email = insert("outbox", {
      to, subject, message, type, meta, status: "queued", queuedAt: new Date().toISOString()
    });
    console.info(`[HER Circle] Email queued: ${subject} -> ${to}`);
    return email;
  }

  function sendDonationEmails(donation) {
    const donorName = `${donation.firstName} ${donation.lastName}`.trim();
    const amountLabel = `$${Number(donation.amount || 0).toLocaleString()}`;
    queueEmail({
      to: donation.email,
      subject: `HER Circle donation receipt - ${amountLabel}`,
      type: "donation-receipt",
      meta: { donationId: donation.id },
      message: `Dear ${donorName}, thank you for your ${donation.frequency === "monthly" ? "monthly " : ""}gift of ${amountLabel} to HER Circle. This receipt confirms your contribution to the ${donation.campaign || "General Fund"}.`
    });
    queueEmail({
      to: "donations@hercircle.org",
      subject: `New donation received - ${amountLabel}`,
      type: "donation-admin",
      meta: { donationId: donation.id },
      message: `${donorName} (${donation.email}) submitted a ${donation.frequency || "once"} donation of ${amountLabel} for ${donation.campaign || "General Fund"}.`
    });
    audit("system@hercircle.org", "donation-email", `Queued receipt and admin notification for ${donation.email}`);
  }

  /* ---------- Domain helpers ---------- */

  function eventRegistrations(eventId) {
    return get("registrations").filter(r => r.eventId === eventId && r.status !== "cancelled");
  }
  function eventConfirmedCount(eventId) {
    return get("registrations").filter(r => r.eventId === eventId && r.status === "confirmed").length;
  }

  function registerForEvent(eventId, person) {
    const ev = get("events").find(e => e.id === eventId);
    if (!ev) return { ok: false, message: "Event not found." };
    const regs = get("registrations");
    if (regs.some(r => r.eventId === eventId && r.email.toLowerCase() === person.email.toLowerCase() && r.status !== "cancelled")) {
      return { ok: false, message: "This email is already registered for this event." };
    }
    const confirmed = eventConfirmedCount(eventId);
    const status = confirmed >= ev.capacity ? "waitlist" : "confirmed";
    const rec = insert("registrations", {
      eventId, eventTitle: ev.title,
      firstName: person.firstName, lastName: person.lastName,
      email: person.email, phone: person.phone || "",
      notes: person.notes || "", status,
      attendance: "registered",
      reminderOptIn: !!person.reminderOptIn
    });
    return { ok: true, status, record: rec, event: ev };
  }

  /* Promote first waitlisted person when a confirmed spot opens */
  function promoteWaitlist(eventId) {
    const ev = get("events").find(e => e.id === eventId);
    if (!ev) return;
    if (eventConfirmedCount(eventId) >= ev.capacity) return;
    const next = get("registrations")
      .filter(r => r.eventId === eventId && r.status === "waitlist")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
    if (next) update("registrations", next.id, { status: "confirmed" });
  }

  return {
    init, uid, sha256, get, set, insert, update, remove, audit, queueEmail, sendDonationEmails,
    eventRegistrations, eventConfirmedCount, registerForEvent, promoteWaitlist
  };
})();

HCDB.ready = HCDB.init();
