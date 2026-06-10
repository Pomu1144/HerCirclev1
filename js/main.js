/* ============================================================
   HER Circle - Shared site behavior
   Nav/footer injection, particles, scroll reveals, counters,
   carousel, parallax, toasts, newsletter.
   ============================================================ */

const HC = (() => {
  const PAGES = [
    ["index.html", "Home"],
    ["about.html", "About Us"],
    ["events.html", "Events"],
    ["programs.html", "Programs"],
    ["impact.html", "Impact"],
    ["support.html", "Support Us"],
    ["contact.html", "Contact"]
  ];

  function currentPage() {
    return location.pathname.split("/").pop() || "index.html";
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Navigation ---------- */
  function renderNav() {
    const mount = document.getElementById("site-nav");
    if (!mount) return;
    const page = currentPage();
    const user = HCAuth.currentUser();

    const links = PAGES.map(([href, label]) =>
      `<li><a href="${href}" ${href === page ? 'aria-current="page"' : ""}>${label}</a></li>`
    ).join("");

    let account;
    if (user) {
      const initials = (user.firstName[0] + (user.lastName[0] || "")).toUpperCase();
      const dest = user.role === "admin" || user.role === "coordinator" ? "admin.html" : "profile.html";
      account = `<a class="account-chip nav-account" href="${dest}"><span class="av" aria-hidden="true">${esc(initials)}</span>${esc(user.firstName)}</a>`;
    } else {
      account = `<a class="account-chip nav-account" href="auth.html"><span class="av" aria-hidden="true">Sign In:</span>Sign In</a>`;
    }

    mount.innerHTML = `
      <nav class="nav" aria-label="Main navigation">
        <div class="nav-inner">
          <a class="nav-logo" href="index.html" aria-label="HER Circle home">
            <span class="mark" aria-hidden="true">HC</span><span>HER <em>Circle</em></span>
          </a>
          <button class="nav-toggle" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation menu">
            <span></span><span></span><span></span>
          </button>
          <ul class="nav-links" id="nav-menu">${links}</ul>
          <div class="nav-cta">
            ${account}
            <a class="btn btn-gold btn-sm" href="support.html">Donate</a>
          </div>
        </div>
      </nav>`;

    const nav = mount.querySelector(".nav");
    const toggle = mount.querySelector(".nav-toggle");
    const menu = mount.querySelector(".nav-links");

    if (document.body.dataset.nav === "solid") nav.classList.add("solid");

    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", e => {
      if (e.target.tagName === "A") { menu.classList.remove("open"); toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Footer ---------- */
  function renderFooter() {
    const mount = document.getElementById("site-footer");
    if (!mount) return;
    mount.innerHTML = `
      <footer class="footer">
        <div class="container">
          <div class="footer-grid">
            <div class="footer-brand">
              <a class="nav-logo" href="index.html"><span class="mark" aria-hidden="true">HC</span><span>HER <em>Circle</em></span></a>
              <p>A community where ambitious women connect, collaborate, grow, and succeed together.</p>
              <div class="social-row">
                <a href="https://instagram.com" target="_blank" rel="noopener" aria-label="Instagram">IG</a>
                <a href="https://linkedin.com" target="_blank" rel="noopener" aria-label="LinkedIn">in</a>
                <a href="https://facebook.com" target="_blank" rel="noopener" aria-label="Facebook">f</a>
                <a href="https://youtube.com" target="_blank" rel="noopener" aria-label="YouTube">YT</a>
              </div>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>
                <li><a href="about.html">About Us</a></li>
                <li><a href="events.html">Events</a></li>
                <li><a href="programs.html">Programs</a></li>
                <li><a href="impact.html">Impact</a></li>
              </ul>
            </div>
            <div>
              <h4>Get Involved</h4>
              <ul>
                <li><a href="support.html">Donate</a></li>
                <li><a href="support.html#volunteer">Volunteer</a></li>
                <li><a href="support.html#sponsor">Sponsorship</a></li>
                <li><a href="auth.html">Become a Member</a></li>
              </ul>
            </div>
            <div>
              <h4>Contact</h4>
              <ul>
                <li><a href="mailto:hello@hercircle.org">hello@hercircle.org</a></li>
                <li><a href="tel:+15550101144">(555) 010-1144</a></li>
                <li>HER Circle Hub, Suite 200<br>123 Community Way</li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <span>(c) ${new Date().getFullYear()} HER Circle. A registered nonprofit organization. All rights reserved.</span>
            <span>Built with purpose - <a href="contact.html">Privacy &amp; Terms</a></span>
          </div>
        </div>
      </footer>`;
  }


  /* ---------- Homepage opener video ---------- */
  function initOpenerVideo() {
    const video = document.querySelector(".hero-opener-video");
    if (!video) return;
    video.addEventListener("error", () => video.classList.add("is-unavailable"));
    video.querySelectorAll("source").forEach(source => {
      source.addEventListener("error", () => video.classList.add("is-unavailable"));
    });
    video.play?.().catch(() => {
      // Autoplay can be blocked by browser policy; the visual fallback remains visible.
    });
  }

  /* ---------- Particles (lightweight canvas) ---------- */
  function initParticles() {
    const canvas = document.getElementById("particles");
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    let w, h, dots = [];

    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      w = canvas.width = r.width;
      h = canvas.height = r.height;
      const count = Math.min(70, Math.floor(w / 18));
      dots = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        r: Math.random() * 1.8 + .6,
        vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25,
        gold: Math.random() < .3,
        a: Math.random() * .5 + .2
      }));
    }
    resize();
    window.addEventListener("resize", resize);

    (function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.x += d.vx; d.y += d.vy;
        if (d.x < 0 || d.x > w) d.vx *= -1;
        if (d.y < 0 || d.y > h) d.vy *= -1;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = d.gold ? `rgba(212,175,55,${d.a})` : `rgba(255,255,255,${d.a * .7})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    })();
  }

  /* ---------- Scroll reveal ---------- */
  function initReveals() {
    const els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: .12, rootMargin: "0px 0px -40px" });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  function initCounters() {
    const els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const prefix = el.dataset.prefix || "";
        const decimals = (el.dataset.count.split(".")[1] || "").length;
        const dur = 1800, start = performance.now();
        (function step(now) {
          const t = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - t, 3);
          el.textContent = prefix + (target * eased).toLocaleString(undefined, { maximumFractionDigits: decimals, minimumFractionDigits: decimals }) + suffix;
          if (t < 1) requestAnimationFrame(step);
        })(start);
      });
    }, { threshold: .4 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- Parallax bands ---------- */
  function initParallax() {
    const layers = document.querySelectorAll(".px-layer");
    if (!layers.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        layers.forEach(layer => {
          const r = layer.parentElement.getBoundingClientRect();
          if (r.bottom > 0 && r.top < innerHeight) {
            const progress = (innerHeight - r.top) / (innerHeight + r.height);
            layer.style.transform = `translateY(${(progress - .5) * 80}px)`;
          }
        });
        ticking = false;
      });
    }, { passive: true });
  }

  /* ---------- Carousel ---------- */
  function initCarousel(root) {
    root = root || document.querySelector(".carousel");
    if (!root || root.dataset.carouselInit) return;
    const slidesEl = root.querySelector(".carousel-slides");
    const slides = root.querySelectorAll(".carousel-slide");
    if (!slides.length) return; // page will inject slides then call HC.initCarousel
    root.dataset.carouselInit = "1";
    const dotsWrap = root.querySelector(".carousel-nav");
    let i = 0, timer;

    slides.forEach((_, n) => {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.setAttribute("aria-label", `Go to slide ${n + 1}`);
      dot.addEventListener("click", () => go(n, true));
      dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap.querySelectorAll(".carousel-dot");

    function go(n, manual) {
      i = (n + slides.length) % slides.length;
      slidesEl.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, k) => d.setAttribute("aria-current", String(k === i)));
      if (manual) restart();
    }
    function restart() {
      clearInterval(timer);
      timer = setInterval(() => go(i + 1), 6500);
    }
    root.querySelector(".carousel-arrow.prev")?.addEventListener("click", () => go(i - 1, true));
    root.querySelector(".carousel-arrow.next")?.addEventListener("click", () => go(i + 1, true));
    root.addEventListener("mouseenter", () => clearInterval(timer));
    root.addEventListener("mouseleave", restart);
    go(0); restart();
  }

  /* ---------- Toast ---------- */
  function toast(message, type = "") {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      wrap.setAttribute("role", "status");
      wrap.setAttribute("aria-live", "polite");
      document.body.appendChild(wrap);
    }
    const t = document.createElement("div");
    t.className = "toast " + type;
    t.textContent = message;
    wrap.appendChild(t);
    setTimeout(() => { t.style.opacity = "0"; t.style.transition = "opacity .4s"; setTimeout(() => t.remove(), 420); }, 4200);
  }

  /* ---------- Newsletter ---------- */
  function initNewsletter() {
    document.querySelectorAll(".newsletter-form").forEach(form => {
      form.addEventListener("submit", e => {
        e.preventDefault();
        const input = form.querySelector("input[type='email']");
        const email = input.value.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast("Please enter a valid email address.", "error"); return; }
        const subs = HCDB.get("subscribers");
        if (subs.some(s => s.email === email)) { toast("You are already on the list. Thank you.", "success"); }
        else {
          HCDB.insert("subscribers", { email, source: currentPage() });
          toast("Welcome to the Circle. You are subscribed.", "success");
        }
        input.value = "";
      });
    });
  }

  /* ---------- Helpers ---------- */
  function fmtDate(iso, opts) {
    return new Date(iso).toLocaleDateString(undefined, opts || { weekday: "short", month: "long", day: "numeric", year: "numeric" });
  }
  function fmtTime(iso) {
    return new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }

  /* ---------- Boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    await HCDB.ready;
    renderNav();
    renderFooter();
    initOpenerVideo();
    initParticles();
    initReveals();
    initCounters();
    initParallax();
    document.querySelectorAll(".carousel").forEach(initCarousel);
    initNewsletter();
  });

  return { toast, esc, fmtDate, fmtTime, currentPage, initReveals, initCounters, initCarousel };
})();
