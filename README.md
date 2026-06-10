# HER Circle — Nonprofit Website

> *A community where ambitious women connect, collaborate, grow, and succeed together.*

A premium, production-quality nonprofit website built in **pure HTML / CSS / JavaScript** — no build step, no framework, deployable to any static host. The site delivers a SpaceX/Stripe-calibre visual experience (glassmorphism, parallax, particles, animated counters, cinematic hero) while remaining warm, accessible, and trustworthy.

**Demo data layer:** all "backend" features (auth, events, registrations, contacts, donations, admin) run on a structured `localStorage` store (`js/data.js`) that mirrors the production PostgreSQL schema below, so swapping in a real API later is a drop-in change.

---

## Quick Start

```bash
# Any static server works:
npx serve .
# or
python3 -m http.server 8080
```

Open http://localhost:8080.

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Administrator | `admin@hercircle.org` | `Admin123!` |
| Event Coordinator | `coordinator@hercircle.org` | `Coord123!` |

Sign in at `auth.html`, then visit `admin.html` for the dashboard.

---

## Folder Structure

```
/
├── index.html        # Home — hero, mission, stats, events preview, stories, partners, newsletter
├── about.html        # Story, mission/vision, values, team, timeline, achievements
├── events.html       # Event system — search, filters, categories, RSVP, capacity, waitlist
├── programs.html     # 4 signature programs with impact metrics & volunteer CTAs
├── impact.html       # Interactive stats, dashboards, testimonials, downloadable reports
├── support.html      # Donations (one-time/monthly), impact calculator, campaigns, volunteer, sponsorship
├── contact.html      # Contact form, org info, FAQ, map
├── auth.html         # Sign up / login / forgot password / email verification
├── profile.html      # Profile management + my registrations
├── admin.html        # Admin dashboard (role-gated)
├── css/styles.css    # Full design system
├── js/
│   ├── data.js       # localStorage data layer + seed data (mirrors PostgreSQL schema)
│   ├── auth.js       # Auth: salted hashing, sessions, roles, lockout, reset flows
│   ├── main.js       # Nav/footer, particles, reveals, counters, parallax, carousel, toasts
│   ├── events.js     # Event listing, filtering, registration, waitlist
│   └── admin.js      # Dashboard views + professional XLSX exports (SheetJS)
├── robots.txt
├── sitemap.xml
└── README.md
```

---

## Features

### Public site
- 7-tab sticky navigation with glassmorphism scroll state + mobile hamburger menu
- Full-screen cinematic hero with canvas particle field, gradient glows, staged entrance animations
- Scroll-triggered reveals, parallax bands, animated statistic counters
- Auto-playing success-stories carousel (keyboard & touch friendly)
- Event management: category chips, live search, sorting, detail modals, registration with **capacity tracking + automatic waitlist promotion**, reminder opt-in
- Donation widget with one-time/monthly toggle, preset & custom amounts, **live impact calculator**, campaign progress bars, and queued donor/admin email notifications
- Volunteer signup, sponsorship tiers, newsletter capture
- Contact form (first/last/email/phone/organization/interest/message) with validation
- FAQ accordion, embedded map, downloadable impact reports

### Authentication & roles
- Sign up → simulated email verification → login → profile management
- Forgot-password / reset-token flow
- Salted SHA-256 hashing (WebCrypto), 8-hour sessions, login lockout after 5 failed attempts
- Roles: **Visitor → Registered User → Event Coordinator → Administrator**
- Role-gated routes (`profile.html`, `admin.html`)

### Default demo logins
- Administrator dashboard: `admin@hercircle.org` / `Admin123!`
- Member profile: `member@hercircle.org` / `Member123!`

### Admin dashboard (`admin.html`)
- **Overview:** KPIs (users, registrations, donations, contacts, volunteers, subscribers), 6-month traffic & user-growth charts, event-attendance chart, **audit log** of admin actions
- **Users:** search, sort, role/permission management, Export to Excel
- **Events:** create / edit / delete, view registrants, toggle attendance, **export attendee lists to Excel**
- **Contacts:** filter (status + interest), full-text search, column sorting, **bulk actions** (mark contacted/resolved, archive, delete, export selected), inline internal notes, and **Export to Excel**
- **Community:** volunteers, donations, newsletter subscribers + exports

### Excel (XLSX) exports — SheetJS
All exports are real `.xlsx` files with:
- Professional column headers
- **Auto-sized columns** (computed from content)
- **AutoFilter enabled** on the header row
- True date cells formatted `mmm d, yyyy h:mm AM/PM`
- One-click browser download

Contact export columns: *Name, Email, Phone, Date Submitted, Events Interested In, Notes, Status*.
Attendee export columns: *Name, Email, Phone, Registration Date, Event Name, Attendance Status, Notes*.

### Accessibility & SEO
- Semantic landmarks, skip links, `aria-current`/`aria-pressed`/`aria-live`, labeled controls, focus-visible styling, `prefers-reduced-motion` support
- WCAG AA color contrast on text surfaces
- Per-page meta + Open Graph, JSON-LD (`NGO` schema), `sitemap.xml`, `robots.txt` (admin/auth pages `noindex`)

### Security practices (demo-appropriate)
- All user content HTML-escaped before render (XSS protection)
- Client-side input validation on every form
- Salted password hashing, generic auth errors (no account enumeration), login rate limiting
- Audit logging for admin actions (role changes, event CRUD, bulk contact ops, exports)
- Production list below covers CSRF, server-side rate limiting, env management

---

## Production Database Schema (PostgreSQL)

The localStorage collections map 1:1 to these tables:

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name    TEXT NOT NULL,
  last_name     TEXT NOT NULL,
  email         CITEXT UNIQUE NOT NULL,
  phone         TEXT,
  password_hash TEXT NOT NULL,            -- bcrypt/argon2 in production
  role          TEXT NOT NULL DEFAULT 'user'
                CHECK (role IN ('user','coordinator','admin')),
  verified      BOOLEAN NOT NULL DEFAULT FALSE,
  verify_token  TEXT,
  reset_token   TEXT,
  reset_expires TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  date          TIMESTAMPTZ NOT NULL,
  duration_mins INT NOT NULL DEFAULT 120,
  location      TEXT NOT NULL,
  capacity      INT NOT NULL,
  price         TEXT,
  description   TEXT,
  details       TEXT,
  featured      BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  email           CITEXT NOT NULL,
  phone           TEXT,
  notes           TEXT,
  status          TEXT NOT NULL DEFAULT 'confirmed'
                  CHECK (status IN ('confirmed','waitlist','cancelled')),
  attendance      TEXT NOT NULL DEFAULT 'registered'
                  CHECK (attendance IN ('registered','attended','no-show')),
  reminder_opt_in BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (event_id, email)
);

CREATE TABLE contact_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name     TEXT NOT NULL,
  last_name      TEXT NOT NULL,
  email          CITEXT NOT NULL,
  phone          TEXT,
  organization   TEXT,
  event_interest TEXT,
  message        TEXT NOT NULL,
  notes          TEXT,                    -- internal admin notes
  status         TEXT NOT NULL DEFAULT 'new'
                 CHECK (status IN ('new','contacted','inprogress','resolved','archived')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE volunteers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      CITEXT NOT NULL,
  phone      TEXT,
  role       TEXT NOT NULL,
  notes      TEXT,
  status     TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE donations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id),
  first_name TEXT NOT NULL,
  last_name  TEXT NOT NULL,
  email      CITEXT NOT NULL,
  amount_cents INT NOT NULL,
  frequency  TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once','monthly')),
  campaign   TEXT,
  stripe_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  tagline     TEXT,
  description TEXT,
  impact      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE newsletter_subscribers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      CITEXT UNIQUE NOT NULL,
  source     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE audit_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor      CITEXT NOT NULL,
  action     TEXT NOT NULL,
  detail     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_registrations_event ON registrations(event_id);
CREATE INDEX idx_contacts_status ON contact_submissions(status);
CREATE INDEX idx_donations_created ON donations(created_at);
```

---

## Production API Architecture (Next.js migration path)

When migrating to the full stack (Next.js + TypeScript + Tailwind + Framer Motion + PostgreSQL):

```
app/
├── (public)/                  # Home, About, Events, Programs, Impact, Support, Contact
├── (auth)/login, signup, reset
├── admin/                     # Role-gated layout
└── api/
    ├── auth/[...nextauth]/    # Auth.js (credentials + email provider)
    ├── events/                # GET list · POST create (coordinator+)
    ├── events/[id]/           # GET · PATCH · DELETE
    ├── events/[id]/register/  # POST — capacity check + waitlist in a transaction
    ├── contacts/              # POST (public, rate-limited) · GET (admin)
    ├── contacts/export/       # GET — streams XLSX via ExcelJS
    ├── registrations/export/  # GET ?eventId= — attendee XLSX
    ├── donations/             # POST — Stripe Checkout session
    ├── volunteers/            # POST · GET (admin)
    └── newsletter/            # POST — double opt-in via transactional email
```

**Key production swaps**

| Concern | Demo (this repo) | Production |
|---|---|---|
| Data | localStorage (`js/data.js`) | PostgreSQL via Prisma/Drizzle |
| Passwords | Salted SHA-256 (WebCrypto) | bcrypt / argon2id server-side |
| Sessions | localStorage token, 8h expiry | Auth.js HTTP-only secure cookies / JWT |
| CSRF | N/A (no server) | Auth.js built-in CSRF tokens; SameSite=Lax cookies |
| Rate limiting | Client lockout (5 tries / 5 min) | Upstash Ratelimit / middleware per-IP |
| Email | Simulated (in-app demo links) | Resend / SendGrid (verification, confirmations, reminders, receipts) |
| Payments | Recorded locally | Stripe Checkout + webhooks (incl. recurring) |
| XLSX | SheetJS in-browser | ExcelJS server-side stream |
| Secrets | None needed | `.env` — `DATABASE_URL`, `AUTH_SECRET`, `STRIPE_SECRET_KEY`, `RESEND_API_KEY` |

**Event registration flow (production):** view event → POST `/api/events/[id]/register` → transaction checks capacity (`SELECT … FOR UPDATE`) → insert as `confirmed` or `waitlist` → queue confirmation email → admin views/exports registrants → cancellations auto-promote the waitlist (same logic as `HCDB.promoteWaitlist`).

---

## Deployment

This static site deploys anywhere in seconds:

**Netlify / Vercel** — drag-and-drop the folder or connect the repo; no build command, publish directory `/`.

**GitHub Pages**
```bash
# Settings → Pages → Deploy from branch → main, root
```

**Any web server (nginx example)**
```nginx
server {
  listen 443 ssl http2;
  server_name hercircle.org;
  root /var/www/hercircle;
  index index.html;
  add_header X-Content-Type-Options nosniff;
  add_header X-Frame-Options DENY;
  add_header Referrer-Policy strict-origin-when-cross-origin;
  add_header Content-Security-Policy "default-src 'self'; script-src 'self' https://cdn.sheetjs.com 'unsafe-inline'; style-src 'self' https://fonts.googleapis.com 'unsafe-inline'; font-src https://fonts.gstatic.com; img-src 'self' data:; frame-src https://www.openstreetmap.org";
  location ~* \.(css|js|svg)$ { expires 7d; }
}
```

Update `hercircle.org` URLs in page `<head>`s, `sitemap.xml`, and `robots.txt` to the real domain at launch.

---

## Performance notes

- No framework, no build: first load is HTML + one CSS file + small JS modules
- Fonts preconnected & swapped; SheetJS loads **only** on the admin page
- Animations are transform/opacity-only (GPU-composited), gated by `IntersectionObserver`, and disabled under `prefers-reduced-motion`
- Particle canvas caps at 70 nodes and pauses off-screen pages naturally via rAF throttling
