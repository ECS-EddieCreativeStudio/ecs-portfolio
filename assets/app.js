/* ECS portfolio — reads content/site.json and content/projects.json (edited from /admin) */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const bust = "?v=" + Date.now();
  let SITE = {}, PROJECTS = [], filter = "all";

  const waLink = (msg) => {
    const n = (SITE.whatsapp || "").replace(/\D/g, "").replace(/^0/, "234");
    if (n) return "https://wa.me/" + n + "?text=" + encodeURIComponent(msg || "Hi ECS, I'd like to book a design.");
    if (SITE.instagram) return "https://instagram.com/" + SITE.instagram.replace(/^@/, "");
    return "#contact";
  };

  // turn a YouTube / Instagram / TikTok link into an embeddable URL
  const embed = (u) => {
    if (!u) return "";
    let m = u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/);
    if (m) return "https://www.youtube.com/embed/" + m[1];
    m = u.match(/instagram\.com\/(?:p|reel)\/([\w-]+)/);
    if (m) return "https://www.instagram.com/reel/" + m[1] + "/embed";
    m = u.match(/tiktok\.com\/.*video\/(\d+)/);
    if (m) return "https://www.tiktok.com/embed/v2/" + m[1];
    return "";
  };

  function fillSite() {
    document.querySelectorAll("[data-site]").forEach((el) => {
      const v = SITE[el.dataset.site];
      if (v) el.textContent = v;
    });
    // gradient on the second sentence of the headline
    const h1 = $(".hero h1");
    const parts = (SITE.headline || h1.textContent).split(/(?<=\.)\s+/);
    if (parts.length > 1) h1.innerHTML = esc(parts[0]) + " <em>" + esc(parts.slice(1).join(" ")) + "</em>";
    if (SITE.studio_name) document.title = SITE.studio_name + " — Portfolio";

    document.querySelectorAll(".js-wa").forEach((a) => { a.href = waLink(); a.target = "_blank"; a.rel = "noopener"; });

    $("#steps").innerHTML = (SITE.order_steps || []).map((s) => `<li><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></li>`).join("");

    const links = [];
    if (SITE.whatsapp) links.push(`<a class="btn" href="${waLink()}" target="_blank" rel="noopener">WhatsApp</a>`);
    if (SITE.instagram) links.push(`<a class="btn ${links.length ? "btn-ghost" : ""}" href="https://instagram.com/${esc(SITE.instagram.replace(/^@/, ""))}" target="_blank" rel="noopener">Instagram @${esc(SITE.instagram.replace(/^@/, ""))}</a>`);
    if (SITE.email) links.push(`<a class="btn btn-ghost" href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>`);
    $("#contactLinks").innerHTML = links.join("");
  }

  const playIcon = `<span class="play" aria-hidden="true"><svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><path d="M7 4v16l13-8z"/></svg></span>`;
  const card = (p, i) => `
    <button class="card" data-i="${i}" style="animation-delay:${(i % 8) * 50}ms" aria-label="Open ${esc(p.title)}">
      <div class="card-media"><img src="${esc(p.cover || (p.images && p.images[0] && p.images[0].image) || "/assets/ecs-mark-600.png")}" alt="${esc(p.title)}" loading="lazy"></div>
      <span class="tag">${esc(p.category)}</span>${p.video || p.video_link ? playIcon : ""}
      <div class="card-body"><h3>${esc(p.title)}</h3><p>${esc(p.client || "")}</p></div>
    </button>`;

  function renderGrid() {
    const list = PROJECTS.map((p, i) => [p, i]).filter(([p]) => filter === "all" || p.category === filter);
    $("#grid").innerHTML = list.map(([p, i]) => card(p, i)).join("");
    $("#empty").hidden = list.length > 0;
  }

  function renderFeatured() {
    const f = PROJECTS.map((p, i) => [p, i]).filter(([p]) => p.featured);
    $("#featured").hidden = f.length === 0;
    $("#featuredRow").innerHTML = f.map(([p, i]) => card(p, i)).join("");
  }

  function openProject(i) {
    const p = PROJECTS[i]; if (!p) return;
    let media = "";
    const em = embed(p.video_link);
    if (p.video) media += `<video src="${esc(p.video)}" poster="${esc(p.cover || "")}" controls playsinline autoplay></video>`;
    else if (em) media += `<iframe src="${esc(em)}" allow="autoplay; encrypted-media" allowfullscreen loading="lazy"></iframe>`;
    const imgs = (p.images || []).map((x) => x.image || x).filter(Boolean);
    if (!p.video && !em && p.cover && !imgs.includes(p.cover)) imgs.unshift(p.cover);
    media += imgs.map((src) => `<img src="${esc(src)}" alt="${esc(p.title)}" loading="lazy">`).join("");
    $("#mMedia").innerHTML = media;
    $("#mCat").textContent = p.category || "";
    $("#mTitle").textContent = p.title || "";
    $("#mClient").textContent = p.client || "";
    $("#mDesc").textContent = p.description || "";
    $("#mServices").textContent = p.services || "";
    $("#modal .js-wa").href = waLink("Hi ECS, I saw " + (p.title || "your work") + " and I'd like something similar.");
    $("#modal").hidden = false;
    document.body.style.overflow = "hidden";
    $(".modal-close").focus();
  }
  function closeModal() {
    $("#modal").hidden = true;
    $("#mMedia").innerHTML = "";
    document.body.style.overflow = "";
  }

  document.addEventListener("click", (e) => {
    const c = e.target.closest(".card");
    if (c) return openProject(+c.dataset.i);
    if (e.target.closest("[data-close]")) return closeModal();
    const chip = e.target.closest(".chip");
    if (chip) {
      filter = chip.dataset.filter;
      document.querySelectorAll(".chip").forEach((b) => { const on = b === chip; b.classList.toggle("is-active", on); b.setAttribute("aria-selected", on); });
      renderGrid();
    }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#modal").hidden) closeModal(); });
  $("#year").textContent = new Date().getFullYear();

  Promise.all([
    fetch("/content/site.json" + bust).then((r) => r.json()).catch(() => ({})),
    fetch("/content/projects.json" + bust).then((r) => r.json()).catch(() => ({ projects: [] })),
  ]).then(([s, p]) => {
    SITE = s || {};
    PROJECTS = (p.projects || []).slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
    fillSite(); renderFeatured(); renderGrid();
  });
})();
