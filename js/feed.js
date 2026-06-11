/* ============================================================
   HER Circle - Community Feed, Jobs Board & Member Profiles
   Depends on: HCDB (data.js), HCAuth (auth.js), HC (main.js)
   ============================================================ */

const HCFeed = (() => {

  /* ============================================================
     HELPERS
     ============================================================ */

  /** Alias for HC.esc */
  function esc(s) {
    return HC.esc(s);
  }

  /** Find a user record by id */
  function getUser(id) {
    return HCDB.get("users").find(u => u.id === id) || null;
  }

  /** Derive a deterministic colour from a user id */
  function _colorFromId(id) {
    const palette = [
      "#7c3aed", "#6d28d9", "#8b5cf6", "#a78bfa",
      "#c4b5fd", "#be185d", "#db2777", "#ec4899",
      "#3b82f6", "#2563eb", "#1d4ed8", "#60a5fa",
      "#9333ea", "#7e22ce", "#e879f9", "#d946ef"
    ];
    let hash = 0;
    const str = String(id || "");
    for (let i = 0; i < str.length; i++) {
      hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
  }

  /**
   * avatarHTML(user, size)
   * size: "" | "sm" | "xs" | "lg"
   * Returns an HTML string for the avatar div.
   */
  function avatarHTML(user, size) {
    if (!user) {
      const cls = size ? `avatar avatar-${size}` : "avatar";
      return `<div class="${cls}" style="background:#7c3aed;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;">?</div>`;
    }
    const cls = size ? `avatar avatar-${size}` : "avatar";
    const extraStyle = size === "lg" ? "border:3px solid white;" : "";

    if (user.avatarData) {
      return `<div class="${cls}" style="${extraStyle}"><img src="${esc(user.avatarData)}" alt="${esc((user.firstName || "") + " " + (user.lastName || ""))}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"></div>`;
    }
    const initials = ((user.firstName || "?")[0] + (user.lastName || "?")[0]).toUpperCase();
    const bg = _colorFromId(user.id);
    return `<div class="${cls}" style="background:${bg};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;${extraStyle}">${esc(initials)}</div>`;
  }

  /**
   * timeAgo(isoStr)
   * Returns "Xm ago", "Xh ago", "Xd ago", or "just now"
   */
  function timeAgo(isoStr) {
    if (!isoStr) return "";
    const diffMs = Date.now() - new Date(isoStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }


  /* ============================================================
     FEED RENDERING
     ============================================================ */

  /**
   * renderPost(post, currentUserId)
   * Returns an HTML string for a single post card.
   */
  function renderPost(post, currentUserId) {
    const author = getUser(post.authorId) || { id: post.authorId || "", firstName: "Unknown", lastName: "User" };
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const comments = Array.isArray(post.comments) ? post.comments : [];
    const isLiked = !!(currentUserId && likes.includes(currentUserId));

    /* Type badge */
    const typeBadgeClass = post.type === "job" ? "badge-job"
      : post.type === "event" ? "badge-event"
      : "badge-general";
    const typeLabel = post.type === "job" ? "Job" : post.type === "event" ? "Event" : "Post";
    const typeBadge = `<span class="post-type-badge ${typeBadgeClass}">${typeLabel}</span>`;

    /* Optional job card */
    let jobCard = "";
    if (post.jobData) {
      const jd = post.jobData;
      jobCard = `<div class="post-job-card">
        <div class="post-job-title">${esc(jd.title || "")}</div>
        <div class="post-job-meta">
          ${jd.company ? `<span>${esc(jd.company)}</span>` : ""}
          ${jd.location ? `<span>${esc(jd.location)}</span>` : ""}
          ${jd.salary ? `<span>${esc(jd.salary)}</span>` : ""}
        </div>
        ${jd.url ? `<a href="${esc(jd.url)}" target="_blank" rel="noopener" class="post-job-link btn btn-sm btn-outline">View Job</a>` : ""}
      </div>`;
    }

    /* Optional event card */
    let eventCard = "";
    if (post.eventData) {
      const ed = post.eventData;
      eventCard = `<div class="post-event-card">
        <div class="post-event-name">${esc(ed.name || "")}</div>
        <div class="post-event-meta">
          ${ed.date ? `<span>${esc(ed.date)}</span>` : ""}
          ${ed.location ? `<span>${esc(ed.location)}</span>` : ""}
        </div>
      </div>`;
    }

    /* Existing comments */
    const commentsListHTML = comments.map(c => {
      const cAuthor = getUser(c.authorId) || { id: c.authorId || "", firstName: "Unknown", lastName: "User" };
      return `<div class="post-comment-item">
        <a href="member.html?id=${esc(cAuthor.id)}" class="post-comment-avatar">${avatarHTML(cAuthor, "xs")}</a>
        <div class="post-comment-body">
          <span class="post-comment-author">${esc(cAuthor.firstName)} ${esc(cAuthor.lastName)}</span>
          <span class="post-comment-time">${timeAgo(c.createdAt)}</span>
          <p class="post-comment-text">${esc(c.text)}</p>
        </div>
      </div>`;
    }).join("");

    /* Add-comment row */
    const addCommentRow = currentUserId
      ? `<div class="post-add-comment">
          <input class="comment-input" data-id="${esc(post.id)}" type="text" placeholder="Write a comment…" maxlength="500" aria-label="Add a comment">
          <button class="btn btn-sm btn-purple post-comment-submit" data-id="${esc(post.id)}">Submit</button>
        </div>`
      : `<p class="post-login-prompt"><a href="auth.html">Sign in</a> to comment.</p>`;

    /* Comments section (hidden by default) */
    const commentsSection = `<div class="post-comments-section" data-id="${esc(post.id)}" style="display:none;">
      <div class="post-comments-list">${commentsListHTML}</div>
      ${addCommentRow}
    </div>`;

    /* Action bar */
    const likedClass = isLiked ? " liked" : "";
    const actionBar = `<div class="post-action-bar">
      <button class="post-action-btn post-like-btn${likedClass}" data-id="${esc(post.id)}" aria-pressed="${isLiked}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="${isLiked ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        Like${likes.length > 0 ? ` <span class="post-like-count">${likes.length}</span>` : ""}
      </button>
      <button class="post-action-btn post-action-comment" data-id="${esc(post.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
        Comment${comments.length > 0 ? ` <span class="post-comment-count">${comments.length}</span>` : ""}
      </button>
      <button class="post-action-btn post-action-share" data-id="${esc(post.id)}">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        Share
      </button>
    </div>`;

    /* Stats row */
    const statsRow = (likes.length > 0 || comments.length > 0)
      ? `<div class="post-stats">
          ${likes.length > 0 ? `<span class="post-stat">${likes.length} like${likes.length !== 1 ? "s" : ""}</span>` : ""}
          ${comments.length > 0 ? `<span class="post-stat">${comments.length} comment${comments.length !== 1 ? "s" : ""}</span>` : ""}
        </div>`
      : "";

    return `<div class="feed-post" data-id="${esc(post.id)}">
      <div class="post-header">
        <a href="member.html?id=${esc(author.id)}" class="post-author-avatar-link">${avatarHTML(author, "sm")}</a>
        <div class="post-author-info">
          <a href="member.html?id=${esc(author.id)}" class="post-author-name">${esc(author.firstName)} ${esc(author.lastName)}</a>
          ${author.headline ? `<div class="post-author-headline">${esc(author.headline)}</div>` : ""}
          <div class="post-author-time">${timeAgo(post.createdAt)}</div>
        </div>
        <div class="post-type-meta">${typeBadge}</div>
      </div>
      <div class="post-body">
        <p class="post-content">${esc(post.content)}</p>
        ${jobCard}
        ${eventCard}
      </div>
      ${statsRow}
      ${actionBar}
      ${commentsSection}
    </div>`;
  }

  /**
   * renderFeed(containerId, currentUserId)
   * Renders all posts newest-first into the container.
   */
  function renderFeed(containerId, currentUserId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const posts = HCDB.get("posts");
    if (!posts.length) {
      container.innerHTML = `<div class="feed-empty"><p>No posts yet. Be the first to share something with the Circle!</p></div>`;
      return;
    }
    const sorted = [...posts].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    container.innerHTML = sorted.map(p => renderPost(p, currentUserId)).join("");
  }

  /**
   * bindFeedEvents(containerId, currentUserId)
   * Event delegation on the feed container.
   */
  function bindFeedEvents(containerId, currentUserId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.addEventListener("click", e => {

      /* ---- Like button ---- */
      const likeBtn = e.target.closest(".post-like-btn");
      if (likeBtn) {
        if (!currentUserId) { HC.toast("Please sign in to like posts.", "error"); return; }
        const postId = likeBtn.dataset.id;
        const post = HCDB.get("posts").find(p => p.id === postId);
        if (!post) return;
        const likes = Array.isArray(post.likes) ? [...post.likes] : [];
        const idx = likes.indexOf(currentUserId);
        if (idx === -1) likes.push(currentUserId);
        else likes.splice(idx, 1);
        HCDB.update("posts", postId, { likes });
        /* Re-render that single post in place */
        const updatedPost = HCDB.get("posts").find(p => p.id === postId);
        const postEl = container.querySelector(`.feed-post[data-id="${postId}"]`);
        if (postEl && updatedPost) {
          const tmp = document.createElement("template");
          tmp.innerHTML = renderPost(updatedPost, currentUserId);
          postEl.replaceWith(tmp.content.firstElementChild);
        }
        return;
      }

      /* ---- Comment toggle ---- */
      const commentToggle = e.target.closest(".post-action-comment");
      if (commentToggle) {
        const postId = commentToggle.dataset.id;
        const section = container.querySelector(`.post-comments-section[data-id="${postId}"]`);
        if (section) {
          section.style.display = section.style.display === "none" ? "block" : "none";
          if (section.style.display === "block") {
            const input = section.querySelector(".comment-input");
            if (input) input.focus();
          }
        }
        return;
      }

      /* ---- Comment submit ---- */
      const commentSubmit = e.target.closest(".post-comment-submit");
      if (commentSubmit) {
        if (!currentUserId) { HC.toast("Please sign in to comment.", "error"); return; }
        const postId = commentSubmit.dataset.id;
        const input = container.querySelector(`.comment-input[data-id="${postId}"]`);
        if (!input) return;
        const text = input.value.trim();
        if (!text) { HC.toast("Please enter a comment.", "error"); return; }
        const post = HCDB.get("posts").find(p => p.id === postId);
        if (!post) return;
        const comments = Array.isArray(post.comments) ? [...post.comments] : [];
        comments.push({
          id: HCDB.uid(),
          authorId: currentUserId,
          text,
          createdAt: new Date().toISOString()
        });
        HCDB.update("posts", postId, { comments });
        /* Re-render in place, keep comments section visible */
        const updatedPost = HCDB.get("posts").find(p => p.id === postId);
        const postEl = container.querySelector(`.feed-post[data-id="${postId}"]`);
        if (postEl && updatedPost) {
          const tmp = document.createElement("template");
          tmp.innerHTML = renderPost(updatedPost, currentUserId);
          postEl.replaceWith(tmp.content.firstElementChild);
          const newSection = container.querySelector(`.post-comments-section[data-id="${postId}"]`);
          if (newSection) newSection.style.display = "block";
        }
        return;
      }

      /* ---- Share ---- */
      const shareBtn = e.target.closest(".post-action-share");
      if (shareBtn) {
        if (navigator.share) {
          navigator.share({ title: "HER Circle", url: location.href }).catch(() => {});
        } else {
          navigator.clipboard?.writeText(location.href).catch(() => {});
          HC.toast("Link copied to clipboard.", "success");
        }
      }
    });
  }


  /* ============================================================
     POST CREATION MODAL
     ============================================================ */

  /**
   * initCreatePost(currentUser)
   * Wires up #create-post-trigger, #post-modal-overlay, and the modal form.
   */
  function initCreatePost(currentUser) {
    const trigger = document.getElementById("create-post-trigger");
    const overlay = document.getElementById("post-modal-overlay");
    const closeBtn = document.getElementById("pm-close");
    const submitBtn = document.getElementById("pm-submit");
    const typeSelect = document.getElementById("pm-type");
    const jobFields = document.getElementById("pm-job-fields");
    const eventFields = document.getElementById("pm-event-fields");

    if (!trigger || !overlay) return;

    function openModal() {
      overlay.style.display = "flex";
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const contentEl = document.getElementById("pm-content");
      if (contentEl) setTimeout(() => contentEl.focus(), 50);
    }

    function closeModal() {
      overlay.style.display = "none";
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      /* Reset fields */
      const contentEl = document.getElementById("pm-content");
      if (contentEl) contentEl.value = "";
      if (typeSelect) typeSelect.value = "general";
      _syncTypeFields("general");
      ["pm-job-title", "pm-job-company", "pm-job-location", "pm-job-salary", "pm-job-url",
       "pm-event-name", "pm-event-date", "pm-event-location"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });
    }

    function _syncTypeFields(type) {
      if (jobFields) jobFields.style.display = type === "job" ? "block" : "none";
      if (eventFields) eventFields.style.display = type === "event" ? "block" : "none";
    }

    trigger.addEventListener("click", () => {
      if (!currentUser) { HC.toast("Please sign in to post.", "error"); return; }
      openModal();
    });

    if (closeBtn) closeBtn.addEventListener("click", closeModal);

    overlay.addEventListener("click", e => {
      if (e.target === overlay) closeModal();
    });

    if (typeSelect) {
      _syncTypeFields(typeSelect.value || "general");
      typeSelect.addEventListener("change", () => _syncTypeFields(typeSelect.value));
    }

    if (submitBtn) {
      submitBtn.addEventListener("click", () => {
        const contentEl = document.getElementById("pm-content");
        const content = contentEl ? contentEl.value.trim() : "";
        if (!content) { HC.toast("Please enter some content for your post.", "error"); return; }

        const type = typeSelect ? typeSelect.value : "general";
        let jobData = null;
        let eventData = null;

        if (type === "job") {
          jobData = {
            title: (document.getElementById("pm-job-title")?.value || "").trim(),
            company: (document.getElementById("pm-job-company")?.value || "").trim(),
            location: (document.getElementById("pm-job-location")?.value || "").trim(),
            salary: (document.getElementById("pm-job-salary")?.value || "").trim(),
            url: (document.getElementById("pm-job-url")?.value || "").trim()
          };
        } else if (type === "event") {
          eventData = {
            name: (document.getElementById("pm-event-name")?.value || "").trim(),
            date: (document.getElementById("pm-event-date")?.value || "").trim(),
            location: (document.getElementById("pm-event-location")?.value || "").trim()
          };
        }

        const post = {
          id: HCDB.uid(),
          authorId: currentUser.id,
          type,
          content,
          likes: [],
          comments: [],
          createdAt: new Date().toISOString()
        };
        if (jobData) post.jobData = jobData;
        if (eventData) post.eventData = eventData;

        HCDB.insert("posts", post);

        /* Re-render any feed containers present on this page */
        ["community-feed", "feed-container", "feed-posts-container"].forEach(id => {
          const el = document.getElementById(id);
          if (el) { renderFeed(id, currentUser.id); bindFeedEvents(id, currentUser.id); }
        });

        closeModal();
        HC.toast("Posted!");
      });
    }
  }


  /* ============================================================
     PEOPLE SUGGESTIONS
     ============================================================ */

  /**
   * renderPeopleSuggestions(containerId, currentUserId)
   * Renders up to 5 users the current user is not connected to.
   */
  function renderPeopleSuggestions(containerId, currentUserId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const suggestions = HCDB.get("users")
      .filter(u => u.id !== currentUserId && getConnectionStatus(currentUserId, u.id) === "none")
      .slice(0, 5);

    if (!suggestions.length) {
      container.innerHTML = `<p class="suggestions-empty">No new suggestions right now.</p>`;
      return;
    }

    container.innerHTML = suggestions.map(u => `
      <div class="people-suggestion" data-user-id="${esc(u.id)}">
        <a href="member.html?id=${esc(u.id)}" class="suggestion-avatar-link">${avatarHTML(u, "sm")}</a>
        <div class="suggestion-info">
          <a href="member.html?id=${esc(u.id)}" class="suggestion-name">${esc(u.firstName)} ${esc(u.lastName)}</a>
          ${u.headline ? `<div class="suggestion-headline">${esc(u.headline)}</div>` : ""}
        </div>
        <button class="btn btn-sm btn-connect" data-to="${esc(u.id)}" aria-label="Connect with ${esc(u.firstName)} ${esc(u.lastName)}">Connect</button>
      </div>`).join("");

    container.addEventListener("click", e => {
      const btn = e.target.closest(".btn-connect");
      if (!btn) return;
      if (!currentUserId) { HC.toast("Please sign in to connect.", "error"); return; }
      const toId = btn.dataset.to;
      if (!toId || getConnectionStatus(currentUserId, toId) !== "none") return;
      HCDB.insert("connections", {
        fromId: currentUserId,
        toId,
        status: "pending",
        createdAt: new Date().toISOString()
      });
      btn.textContent = "Pending";
      btn.classList.remove("btn-connect");
      btn.classList.add("pending");
      btn.disabled = true;
      HC.toast("Connection request sent!");
    });
  }


  /* ============================================================
     JOB SUGGESTIONS SIDEBAR
     ============================================================ */

  /**
   * renderJobSuggestions(containerId)
   * Renders up to 3 jobs from jobs_board in the sidebar.
   */
  function renderJobSuggestions(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const jobs = HCDB.get("jobs_board").slice(0, 3);
    if (!jobs.length) {
      container.innerHTML = `<p class="suggestions-empty">No job listings yet.</p>`;
      return;
    }
    container.innerHTML = jobs.map(job => `
      <div class="job-suggestion">
        <div class="job-suggestion-title">${esc(job.title || "")}</div>
        <div class="job-suggestion-meta">
          ${job.company ? `<span>${esc(job.company)}</span>` : ""}
          ${job.location ? `<span>${esc(job.location)}</span>` : ""}
        </div>
        <a href="jobs.html" class="job-suggestion-link btn btn-sm btn-outline">View</a>
      </div>`).join("");
  }


  /* ============================================================
     CONNECTION HELPERS
     ============================================================ */

  function getConnectionStatus(fromId, toId) {
    const conn = HCDB.get("connections").find(c =>
      (c.fromId === fromId && c.toId === toId) ||
      (c.fromId === toId && c.toId === fromId)
    );
    if (!conn) return "none";
    return conn.status; // "pending" or "accepted"
  }

  function isConnected(fromId, toId) {
    return getConnectionStatus(fromId, toId) === "accepted";
  }


  /* ============================================================
     JOBS PAGE
     ============================================================ */

  /**
   * initJobsPage(currentUserId)
   * Full jobs board: list + detail panel, search, apply, mentor recs.
   */
  function initJobsPage(currentUserId) {
    const listContainer = document.getElementById("jobs-list-container");
    const detailContainer = document.getElementById("job-detail-container");
    const searchInput = document.getElementById("jobs-search");
    if (!listContainer) return;

    let allJobs = HCDB.get("jobs_board");
    let selectedJobId = allJobs.length ? allJobs[0].id : null;

    /* ---- Render list ---- */
    function renderList(jobs) {
      if (!jobs.length) {
        listContainer.innerHTML = `<div class="jobs-empty"><p>No jobs match your search.</p></div>`;
        return;
      }
      listContainer.innerHTML = jobs.map(job => `
        <div class="job-list-item${selectedJobId === job.id ? " active" : ""}" data-id="${esc(job.id)}" tabindex="0" role="button">
          <div class="job-list-title">${esc(job.title || "")}</div>
          <div class="job-list-company">${esc(job.company || "")}</div>
          <div class="job-list-location">${esc(job.location || "")}</div>
          ${job.type ? `<span class="job-list-type">${esc(job.type)}</span>` : ""}
        </div>`).join("");
    }

    /* ---- Render mentor recs ---- */
    function _recsHTML(jobId) {
      const comments = HCDB.get("job_comments").filter(c => c.jobId === jobId);
      if (!comments.length) {
        return `<p class="recs-empty">No recommendations yet. Be the first to share your insight!</p>`;
      }
      return comments.map(c => {
        const author = getUser(c.authorId) || { id: c.authorId || "", firstName: "Unknown", lastName: "User" };
        return `<div class="mentor-rec-item">
          <div class="mentor-rec-header">
            ${avatarHTML(author, "xs")}
            <span class="mentor-rec-author">${esc(author.firstName)} ${esc(author.lastName)}</span>
            ${c.isMentor ? `<span class="mentor-badge">Mentor</span>` : ""}
            <span class="mentor-rec-time">${timeAgo(c.createdAt)}</span>
          </div>
          <p class="mentor-rec-text">${esc(c.text)}</p>
        </div>`;
      }).join("");
    }

    /* ---- Render detail ---- */
    function renderDetail(job) {
      if (!detailContainer) return;
      if (!job) {
        detailContainer.innerHTML = `<div class="job-detail-empty"><p>Select a job to view details.</p></div>`;
        return;
      }

      /* Update active class in list */
      listContainer.querySelectorAll(".job-list-item").forEach(el => {
        el.classList.toggle("active", el.dataset.id === job.id);
      });

      const requirementsList = Array.isArray(job.requirements) && job.requirements.length
        ? `<ul class="job-requirements">${job.requirements.map(r => `<li>${esc(r)}</li>`).join("")}</ul>`
        : "";

      const alreadyApplied = currentUserId && HCDB.get("jobApplications").some(
        a => a.jobId === job.id && a.userId === currentUserId
      );

      const applySection = currentUserId
        ? (alreadyApplied
          ? `<div id="apply-section" class="apply-section"><p class="apply-already">You have already applied for this position.</p></div>`
          : `<div id="apply-section" class="apply-section">
              <h3>Apply for this Role</h3>
              <textarea id="cover-letter" class="cover-letter-input" rows="5" placeholder="Write a short cover letter or message to the employer…" maxlength="2000"></textarea>
              <button id="apply-btn" class="btn btn-purple">Submit Application</button>
            </div>`)
        : `<div id="apply-section" class="apply-section"><p><a href="auth.html">Sign in</a> to apply for this position.</p></div>`;

      const recAddRow = currentUserId
        ? `<textarea id="rec-input" class="rec-input" rows="3" placeholder="Share your recommendation or insight about this role…" maxlength="1000"></textarea>
           <button id="rec-submit" class="btn btn-sm btn-purple">Add Recommendation</button>`
        : `<p><a href="auth.html">Sign in</a> to add a recommendation.</p>`;

      detailContainer.innerHTML = `<div class="job-detail">
        <div class="job-detail-header">
          <h2 class="job-detail-title">${esc(job.title || "")}</h2>
          <div class="job-detail-company">${esc(job.company || "")}</div>
          <div class="job-detail-location">${esc(job.location || "")}</div>
        </div>
        <div class="job-detail-tags">
          ${job.type ? `<span class="job-tag">${esc(job.type)}</span>` : ""}
          ${job.salary ? `<span class="job-tag">${esc(job.salary)}</span>` : ""}
          ${job.location ? `<span class="job-tag">${esc(job.location)}</span>` : ""}
        </div>
        ${job.description ? `<p class="job-detail-description">${esc(job.description)}</p>` : ""}
        ${requirementsList}
        ${applySection}
        <div id="mentor-recs" class="mentor-recs-section">
          <h3>Mentor Recommendations</h3>
          <div class="mentor-recs-list" id="mentor-recs-list">${_recsHTML(job.id)}</div>
          ${recAddRow}
        </div>
      </div>`;

      /* Apply button */
      const applyBtn = detailContainer.querySelector("#apply-btn");
      if (applyBtn && currentUserId) {
        applyBtn.addEventListener("click", () => {
          const duplicate = HCDB.get("jobApplications").find(
            a => a.jobId === job.id && a.userId === currentUserId
          );
          if (duplicate) { HC.toast("Already applied.", "error"); return; }
          const coverLetterEl = detailContainer.querySelector("#cover-letter");
          const coverLetter = coverLetterEl ? coverLetterEl.value.trim() : "";
          HCDB.insert("jobApplications", {
            jobId: job.id,
            userId: currentUserId,
            coverLetter,
            createdAt: new Date().toISOString()
          });
          HC.toast("Application submitted!");
          applyBtn.textContent = "Application Submitted";
          applyBtn.disabled = true;
          if (coverLetterEl) coverLetterEl.disabled = true;
        });
      }

      /* Rec submit */
      const recSubmit = detailContainer.querySelector("#rec-submit");
      if (recSubmit && currentUserId) {
        recSubmit.addEventListener("click", () => {
          const recInput = detailContainer.querySelector("#rec-input");
          const text = recInput ? recInput.value.trim() : "";
          if (!text) { HC.toast("Please enter your recommendation.", "error"); return; }
          const recAuthor = getUser(currentUserId);
          HCDB.insert("job_comments", {
            jobId: job.id,
            authorId: currentUserId,
            text,
            isMentor: !!(recAuthor && (recAuthor.isMentor || recAuthor.role === "coordinator" || recAuthor.role === "admin")),
            createdAt: new Date().toISOString()
          });
          if (recInput) recInput.value = "";
          const recsListEl = detailContainer.querySelector("#mentor-recs-list");
          if (recsListEl) recsListEl.innerHTML = _recsHTML(job.id);
          HC.toast("Recommendation added!");
        });
      }
    }

    /* Initial render */
    renderList(allJobs);
    if (allJobs.length) renderDetail(allJobs[0]);

    /* List click */
    listContainer.addEventListener("click", e => {
      const item = e.target.closest(".job-list-item");
      if (!item) return;
      selectedJobId = item.dataset.id;
      const job = HCDB.get("jobs_board").find(j => j.id === selectedJobId);
      renderList(allJobs); // refresh active state
      if (job) renderDetail(job);
    });

    /* List keyboard */
    listContainer.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        const item = e.target.closest(".job-list-item");
        if (!item) return;
        selectedJobId = item.dataset.id;
        const job = HCDB.get("jobs_board").find(j => j.id === selectedJobId);
        renderList(allJobs);
        if (job) renderDetail(job);
      }
    });

    /* Search */
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const q = searchInput.value.trim().toLowerCase();
        allJobs = q
          ? HCDB.get("jobs_board").filter(j =>
              (j.title || "").toLowerCase().includes(q) ||
              (j.company || "").toLowerCase().includes(q) ||
              (j.location || "").toLowerCase().includes(q))
          : HCDB.get("jobs_board");
        selectedJobId = allJobs.length ? allJobs[0].id : null;
        renderList(allJobs);
        if (detailContainer) {
          if (allJobs.length) renderDetail(allJobs[0]);
          else detailContainer.innerHTML = `<div class="job-detail-empty"><p>No jobs match your search.</p></div>`;
        }
      });
    }
  }


  /* ============================================================
     PROFILE PAGE
     ============================================================ */

  /**
   * initProfilePage(user)
   * Renders own posts into #my-posts-feed and wires avatar upload.
   */
  function initProfilePage(user) {
    /* Own posts */
    const myPostsFeed = document.getElementById("my-posts-feed");
    if (myPostsFeed) {
      const myPosts = HCDB.get("posts")
        .filter(p => p.authorId === user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!myPosts.length) {
        myPostsFeed.innerHTML = `<div class="feed-empty"><p>You have not posted anything yet.</p></div>`;
      } else {
        myPostsFeed.innerHTML = myPosts.map(p => renderPost(p, user.id)).join("");
        bindFeedEvents("my-posts-feed", user.id);
      }
    }

    /* Avatar upload */
    const avatarInput = document.getElementById("avatar-upload-input");
    if (avatarInput) {
      avatarInput.addEventListener("change", () => {
        const file = avatarInput.files && avatarInput.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
          const result = e.target.result;
          HCDB.update("users", user.id, { avatarData: result });
          /* Update all avatar img elements that belong to this user */
          document.querySelectorAll(`.avatar img`).forEach(img => {
            const link = img.closest("a[href]");
            if (link && link.href && link.href.includes(user.id)) {
              img.src = result;
            }
          });
          HC.toast("Avatar updated!");
        };
        reader.readAsDataURL(file);
      });
    }
  }


  /* ============================================================
     MEMBER PAGE
     ============================================================ */

  /**
   * initMemberPage(memberId, currentUserId)
   * Renders member profile into #member-profile and posts into #member-posts.
   */
  function initMemberPage(memberId, currentUserId) {
    const member = HCDB.get("users").find(u => u.id === memberId);
    const profileContainer = document.getElementById("member-profile");
    const postsContainer = document.getElementById("member-posts");

    if (!profileContainer) return;

    if (!member) {
      profileContainer.innerHTML = `<div class="feed-empty"><p>Member not found.</p></div>`;
      return;
    }

    const connectionCount = HCDB.get("connections").filter(c =>
      (c.fromId === memberId || c.toId === memberId) && c.status === "accepted"
    ).length;

    const connStatus = currentUserId ? getConnectionStatus(currentUserId, memberId) : "none";
    let connectBtnHTML = "";
    if (currentUserId && currentUserId !== memberId) {
      if (connStatus === "none") {
        connectBtnHTML = `<button id="connect-btn" class="btn btn-purple">Connect</button>`;
      } else if (connStatus === "pending") {
        connectBtnHTML = `<button id="connect-btn" class="btn btn-outline pending" disabled>Pending</button>`;
      } else {
        connectBtnHTML = `<button id="connect-btn" class="btn btn-outline connected" disabled>Connected</button>`;
      }
    }

    profileContainer.innerHTML = `<div class="member-profile-card">
      <div class="member-profile-avatar">${avatarHTML(member, "lg")}</div>
      <div class="member-profile-info">
        <h1 class="member-profile-name">${esc(member.firstName)} ${esc(member.lastName)}</h1>
        ${member.headline ? `<p class="member-profile-headline">${esc(member.headline)}</p>` : ""}
        ${member.bio ? `<p class="member-profile-bio">${esc(member.bio)}</p>` : ""}
        <div class="member-profile-stats">
          <span class="member-profile-stat"><strong>${connectionCount}</strong> connection${connectionCount !== 1 ? "s" : ""}</span>
        </div>
        ${connectBtnHTML}
      </div>
    </div>`;

    /* Connect button */
    const connectBtn = profileContainer.querySelector("#connect-btn");
    if (connectBtn && currentUserId && connStatus === "none") {
      connectBtn.addEventListener("click", () => {
        HCDB.insert("connections", {
          fromId: currentUserId,
          toId: memberId,
          status: "pending",
          createdAt: new Date().toISOString()
        });
        connectBtn.textContent = "Pending";
        connectBtn.classList.add("pending");
        connectBtn.disabled = true;
        HC.toast("Connection request sent!");
      });
    }

    /* Member posts */
    if (postsContainer) {
      const memberPosts = HCDB.get("posts")
        .filter(p => p.authorId === memberId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      if (!memberPosts.length) {
        postsContainer.innerHTML = `<div class="feed-empty"><p>${esc(member.firstName)} has not posted anything yet.</p></div>`;
      } else {
        postsContainer.innerHTML = memberPosts.map(p => renderPost(p, currentUserId)).join("");
        bindFeedEvents("member-posts", currentUserId);
      }
    }
  }


  /* ============================================================
     PUBLIC API
     ============================================================ */

  return {
    avatarHTML,
    timeAgo,
    renderFeed,
    bindFeedEvents,
    initCreatePost,
    renderPeopleSuggestions,
    renderJobSuggestions,
    getConnectionStatus,
    isConnected,
    initJobsPage,
    initProfilePage,
    initMemberPage
  };

})();
