/* ============================================================
   HER Circle - Data Layer
   localStorage-backed store. Mirrors the production PostgreSQL
   schema (see README.md) so it can be swapped for real API calls.
   ============================================================ */

const HCDB = (() => {
  const PREFIX = "hc_";
  const VERSION = 5;

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

  const SEED_COMMUNITY_USERS = [
    { id: "uid-priya-sharma", firstName: "Priya", lastName: "Sharma", email: "priya@hercircle.org", phone: "(555) 020-1001", role: "user", headline: "Business Coach & Mentor", bio: "15 years helping women founders scale to 7 figures. Passionate about closing the funding gap.", verified: true, isMentor: true },
    { id: "uid-diana-wells", firstName: "Diana", lastName: "Wells", email: "diana@hercircle.org", phone: "(555) 020-1002", role: "user", headline: "Executive Director | Nonprofit Leader", bio: "Building community infrastructure for the next generation of women leaders.", verified: true, isMentor: true },
    { id: "uid-kezia-obi", firstName: "Kezia", lastName: "Obi", email: "kezia@hercircle.org", phone: "(555) 020-1003", role: "user", headline: "Founder at LuminaBox | E-commerce", bio: "Turned a side hustle into a 6-figure brand. HER Circle changed everything for me.", verified: true, isMentor: false },
    { id: "uid-sofia-reyes", firstName: "Sofia", lastName: "Reyes", email: "sofia@hercircle.org", phone: "(555) 020-1004", role: "user", headline: "UX Designer | Creative Director", bio: "Design should be accessible to everyone. Building tools that empower underrepresented founders.", verified: true, isMentor: false },
    { id: "uid-naomi-chen", firstName: "Naomi", lastName: "Chen", email: "naomi@hercircle.org", phone: "(555) 020-1005", role: "user", headline: "Marketing Director at Vantage Co.", bio: "Brand storytelling and growth marketing for women-led businesses.", verified: true, isMentor: false }
  ];

  const SEED_POSTS = [
    {
      id: "post-priya-1",
      authorId: "uid-priya-sharma",
      type: "general",
      content: "The most powerful thing you can do as a woman entrepreneur is invest in your own learning. Every dollar you put into your skills comes back tenfold. 15 years in business coaching has proven this to me over and over. Who else is committed to growth this quarter?",
      likes: ["uid-diana-wells", "uid-kezia-obi", "uid-sofia-reyes"],
      comments: [
        { id: "cmt-p1-1", authorId: "uid-diana-wells", text: "Yes! This is the foundation of everything. Raising my hand for growth this quarter!", createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
    },
    {
      id: "post-diana-1",
      authorId: "uid-diana-wells",
      type: "job",
      content: "Exciting opportunity at HER Circle! We are looking for a passionate Head of Community to help scale our impact. If you know someone who would be a great fit, please share!",
      jobData: { title: "Head of Community", company: "HER Circle", location: "Remote", salary: "$75k-$95k", applyUrl: "" },
      likes: ["uid-priya-sharma", "uid-naomi-chen"],
      comments: [
        { id: "cmt-d1-1", authorId: "uid-sofia-reyes", text: "Sharing this with my network right now!", createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    },
    {
      id: "post-kezia-1",
      authorId: "uid-kezia-obi",
      type: "general",
      content: "Two years ago I was packaging orders in my kitchen. This week LuminaBox hit $500k in revenue. None of this would have happened without HER Circle, my mentor Priya, and this incredible community. Your network is your net worth, and mine is priceless.",
      likes: ["uid-priya-sharma", "uid-diana-wells", "uid-sofia-reyes", "uid-naomi-chen"],
      comments: [
        { id: "cmt-k1-1", authorId: "uid-priya-sharma", text: "Watching your journey has been one of my greatest privileges. Keep going!", createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString() },
        { id: "cmt-k1-2", authorId: "uid-diana-wells", text: "This is exactly what HER Circle is for. Congratulations Kezia!", createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
    },
    {
      id: "post-naomi-1",
      authorId: "uid-naomi-chen",
      type: "event",
      content: "Mark your calendars! We are hosting Pitch Night: Women in Tech in 10 days. Come ready to pitch, connect with investors, and support your fellow founders. Spots are limited — register early!",
      eventData: { name: "Pitch Night: Women in Tech", date: futureDate(10), location: "HER Circle Hub" },
      likes: ["uid-priya-sharma", "uid-kezia-obi"],
      comments: [
        { id: "cmt-n1-1", authorId: "uid-sofia-reyes", text: "Already registered! Cannot wait.", createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
    },
    {
      id: "post-sofia-1",
      authorId: "uid-sofia-reyes",
      type: "general",
      content: "Hot take: most startup websites fail not because of bad product but because of bad UX. I have audited 40+ women-led business sites and the pattern is clear: unclear value prop above the fold, no social proof, and a CTA that's buried. Your website is your hardest-working employee. Invest in it.",
      likes: ["uid-naomi-chen", "uid-kezia-obi"],
      comments: [
        { id: "cmt-s1-1", authorId: "uid-naomi-chen", text: "Every marketer needs to read this. The CTA point is so real.", createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString() }
      ],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString()
    },
    {
      id: "post-naomi-2",
      authorId: "uid-naomi-chen",
      type: "job",
      content: "Bloom Media is hiring a Marketing Manager! Great role for someone ready to step into a leadership position at a fast-growing agency. Full-time, NYC hybrid. Apply link in the job card below.",
      jobData: { title: "Marketing Manager", company: "Bloom Media", location: "New York, NY", salary: "$65k-$80k", applyUrl: "" },
      likes: ["uid-diana-wells", "uid-sofia-reyes"],
      comments: [],
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    }
  ];

  const SEED_JOBS_BOARD = [
    {
      id: "job-head-community",
      title: "Head of Community",
      company: "HER Circle",
      location: "Remote",
      type: "Full-time",
      salary: "$75k-$95k",
      description: "As Head of Community at HER Circle, you will be the architect of our member experience. You'll design and oversee programming, manage community coordinators, build partnerships, and ensure every member feels genuinely supported on their journey. You'll work directly with our Executive Director and report to the Board on community health metrics.",
      requirements: [
        "5+ years experience in community management, program management, or nonprofit leadership",
        "Demonstrated ability to build and scale engaged communities (online and in-person)",
        "Strong interpersonal and public speaking skills; experience facilitating group workshops",
        "Data-driven mindset with experience using community metrics to inform decisions",
        "Deep commitment to gender equity and women's entrepreneurship"
      ],
      postedBy: "uid-diana-wells",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
    },
    {
      id: "job-ux-lead",
      title: "UX Design Lead",
      company: "Lumina Creative",
      location: "New York, NY",
      type: "Full-time",
      salary: "$90k-$115k",
      description: "Lumina Creative is looking for a UX Design Lead to own the design process from research through delivery. You'll lead a small team of designers, collaborate closely with product and engineering, and champion user-centered design practices across all client work. Our clients are predominantly women-owned businesses and mission-driven organizations.",
      requirements: [
        "7+ years of UX/product design experience with a strong portfolio demonstrating end-to-end design process",
        "Experience leading and mentoring a design team of 2-5 designers",
        "Proficiency in Figma and design systems methodology",
        "Strong user research skills including usability testing, interviews, and synthesis",
        "Excellent communication skills and ability to present design rationale to stakeholders"
      ],
      postedBy: "uid-sofia-reyes",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
    },
    {
      id: "job-mktg-mgr",
      title: "Marketing Manager",
      company: "Bloom Media",
      location: "Hybrid - NYC",
      type: "Full-time",
      salary: "$65k-$80k",
      description: "Bloom Media is a boutique marketing agency specializing in growth marketing for women-led brands. We are looking for a Marketing Manager who can develop and execute multi-channel campaigns, manage client relationships, and mentor junior team members. You'll work on a portfolio of 8-12 exciting brands across e-commerce, wellness, and professional services.",
      requirements: [
        "4+ years of marketing experience, agency background preferred",
        "Hands-on experience with paid social, email marketing, and SEO/content strategy",
        "Strong analytical skills with experience reporting on campaign performance",
        "Excellent project management skills and ability to manage multiple client accounts simultaneously",
        "Experience with tools such as HubSpot, Meta Ads Manager, and Google Analytics"
      ],
      postedBy: "uid-naomi-chen",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString()
    },
    {
      id: "job-biz-dev",
      title: "Business Development Lead",
      company: "Vantage Legal Partners",
      location: "Chicago, IL",
      type: "Full-time",
      salary: "$80k-$100k + commission",
      description: "Vantage Legal Partners is a woman-owned law firm seeking a Business Development Lead to drive growth through strategic partnerships, speaking opportunities, and relationship-based sales. You'll work with our partners to identify new client verticals and develop outreach strategies that reflect our firm's values and commitment to underrepresented clients.",
      requirements: [
        "5+ years in business development, sales, or strategic partnerships — legal or professional services background a plus",
        "Track record of hitting revenue targets and building long-term client relationships",
        "Exceptional networking skills and comfort presenting to C-suite and executive audiences",
        "Experience developing proposals, pitch decks, and business cases",
        "Proficiency in Salesforce or similar CRM platform"
      ],
      postedBy: "uid-priya-sharma",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString()
    },
    {
      id: "job-brand-mgr",
      title: "Brand & Content Manager",
      company: "LuminaBox",
      location: "Remote",
      type: "Contract",
      salary: "$50-$70/hr",
      description: "LuminaBox is a fast-growing e-commerce brand looking for a Brand & Content Manager on a contract basis (20-30 hrs/week) to own our brand voice, manage content creation, and oversee social media channels. You'll work directly with the founder and have real creative ownership over how LuminaBox shows up in the world.",
      requirements: [
        "3+ years of brand management or content marketing experience",
        "Strong copywriting skills and an eye for visual brand consistency",
        "Experience managing social channels (Instagram, TikTok, Pinterest) for a consumer brand",
        "Familiarity with e-commerce platforms (Shopify preferred) and basic email marketing",
        "Self-directed with the ability to manage your own workflow and deadlines remotely"
      ],
      postedBy: "uid-kezia-obi",
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString()
    }
  ];

  const SEED_JOB_COMMENTS = [
    { id: "jc-1", jobId: "job-head-community", authorId: "uid-priya-sharma", isMentor: true, text: "This role is a rare opportunity to shape a community from the inside. The person who lands this will have genuine impact. I know Diana — she is an exceptional leader to work with.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
    { id: "jc-2", jobId: "job-head-community", authorId: "uid-naomi-chen", isMentor: false, text: "Highly recommend this org. I've collaborated with the HER Circle team on multiple campaigns and their culture is everything. Don't sleep on this application.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString() },
    { id: "jc-3", jobId: "job-ux-lead", authorId: "uid-diana-wells", isMentor: true, text: "Sofia runs one of the most thoughtful design studios I've seen. If you're a UX designer looking for a real leadership role with mentorship built in, apply.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString() },
    { id: "jc-4", jobId: "job-ux-lead", authorId: "uid-kezia-obi", isMentor: false, text: "Lumina Creative did our brand redesign and the process was incredible. The team is so collaborative.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
    { id: "jc-5", jobId: "job-mktg-mgr", authorId: "uid-priya-sharma", isMentor: true, text: "Great entry point for someone wanting to move from individual contributor to management. Naomi is a generous mentor — she'll actually teach you the business side of marketing.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString() },
    { id: "jc-6", jobId: "job-biz-dev", authorId: "uid-diana-wells", isMentor: true, text: "Business development at a woman-owned law firm is a unique and valuable experience. Priya's network is extraordinary — this role will open many doors.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 65).toISOString() },
    { id: "jc-7", jobId: "job-biz-dev", authorId: "uid-sofia-reyes", isMentor: false, text: "I worked with Vantage on a branding project — the team is sharp and the partners really invest in their staff's growth.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 60).toISOString() },
    { id: "jc-8", jobId: "job-brand-mgr", authorId: "uid-priya-sharma", isMentor: true, text: "If you want real creative ownership and direct founder access, this is the role. Kezia gives her team the freedom to take risks and the support to succeed.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 88).toISOString() },
    { id: "jc-9", jobId: "job-brand-mgr", authorId: "uid-naomi-chen", isMentor: false, text: "LuminaBox has such a strong brand identity. Managing content for them would be a portfolio-builder for sure.", createdAt: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString() }
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
    if (!read("connections", null)) write("connections", []);
    if (!read("jobApplications", null)) write("jobApplications", []);
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

    // Seed community users
    const allUsers = read("users", []);
    for (const cu of SEED_COMMUNITY_USERS) {
      if (!allUsers.some(u => u.email === cu.email)) {
        const salt = uid();
        allUsers.push({
          ...cu,
          salt,
          passwordHash: await sha256("Member123!" + salt),
          createdAt: new Date().toISOString()
        });
      }
    }
    write("users", allUsers);

    // Seed posts
    if (!read("posts", null)) write("posts", SEED_POSTS);

    // Seed jobs board
    if (!read("jobs_board", null)) write("jobs_board", SEED_JOBS_BOARD);

    // Seed job comments
    if (!read("job_comments", null)) write("job_comments", SEED_JOB_COMMENTS);

    // Initialize empty collections
    if (!read("connections", null)) write("connections", []);
    if (!read("jobApplications", null)) write("jobApplications", []);

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
