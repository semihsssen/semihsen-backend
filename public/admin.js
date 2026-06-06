/* semihsen.art - admin.js v5 (clean) */
var DB = {};
var ALL_PROJECTS = [];
var CURRENT_FOLDER = "__all";
var RESUME_DATA = { experience: [], achievements: "", skills: [] };

var CATEGORIES = [
  { group: "GAME ART", folders: ["Block Out", "Car Match", "Magic Sort", "Match Villians", "Wonder Blast"] },
  { group: "PERSONAL", folders: ["Personal Works"] }
];

var GAME_KEYS = [
  { key: "block-out",      label: "Block Out" },
  { key: "car-match",      label: "Car Match" },
  { key: "magic-sort",     label: "Magic Sort" },
  { key: "match-villains", label: "Match Villians" },
  { key: "wonder-blast",   label: "Wonder Blast" }
];

function T(id) { return document.getElementById(id); }
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function getPwd() { return "semih2024"; }
function authHeader() { return "Basic " + btoa("semih:" + getPwd()); }
function toast(m, err) {
  var t = T("toast"); if (!t) return;
  t.textContent = m;
  t.style.background = err ? "#c0392b" : "#4a90e2";
  t.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(function () { t.classList.remove("show"); }, 2600);
}

function SP(id, el) {
  document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
  document.querySelectorAll(".ni").forEach(function (n) { n.classList.remove("active"); });
  var p = T("pn-" + id); if (p) p.classList.add("active");
  if (el) el.classList.add("active");
  var titles = {
    "settings": "Boyut & Renk", "hero": "Hero Gorseli",
    "resume": "Resume Gorseli", "resumeedit": "Resume Duzenle",
    "favicon": "Tarayici Ikonu",
    "covers": "Oyun Kapaklari", "portfolio-covers": "Portfolio Panelleri",
    "projects": "Projeler"
  };
  T("tt").textContent = titles[id] || id;
  if (id === "projects") loadProjects();
  if (id === "covers") renderCovers();
  if (id === "portfolio-covers") renderPortfolioCovers();
  if (id === "resumeedit") renderResumeEdit();
  if (id === "favicon") loadFavicon();
}

async function init() {
  try {
    var r = await fetch("/api/data");
    DB = await r.json();
    loadSets(); loadHero(); loadResume();
  } catch (e) { toast("Veri yuklenemedi", true); }
}

/* ========== SETTINGS ========== */
function loadSets() {
  var s = DB.settings || {};
  var sc = { "c-bg": "color_bg", "c-bg2": "color_bg2", "c-text": "color_text", "c-muted": "color_muted", "c-accent": "color_accent" };
  for (var k in sc) { if (s[sc[k]]) { var el = T(k); if (el) el.value = s[sc[k]]; } }
  var sl = { "s-lx": ["nav_logo_x", "v-lx"], "s-ly": ["nav_logo_y", "v-ly"], "s-sx": ["nav_sub_x", "v-sx"], "s-sy": ["nav_sub_y", "v-sy"] };
  for (var sid in sl) {
    var d = sl[sid];
    if (s[d[0]]) {
      var se = T(sid); if (se) se.value = s[d[0]];
      var ve = T(d[1]); if (ve) ve.textContent = s[d[0]];
    }
  }
}
async function saveSettings() {
  var sc = { "c-bg": "color_bg", "c-bg2": "color_bg2", "c-text": "color_text", "c-muted": "color_muted", "c-accent": "color_accent" };
  var data = {};
  for (var k in sc) { var el = T(k); if (el) data[sc[k]] = el.value; }
  var sl = { "s-lx": "nav_logo_x", "s-ly": "nav_logo_y", "s-sx": "nav_sub_x", "s-sy": "nav_sub_y" };
  for (var sid in sl) { var se = T(sid); if (se) data[sl[sid]] = se.value; }
  try {
    var r = await fetch("/api/settings", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": authHeader() }, body: JSON.stringify(data) });
    var d = await r.json();
    if (d.ok) toast("Ayarlar kaydedildi"); else toast(d.error || "Hata", true);
  } catch (e) { toast("Kaydetme hatasi", true); }
}

/* ========== HERO / RESUME IMG ========== */
function loadHero() {
  var h = DB.hero;
  if (h && h.url) { var i = T("hero-img"), p = T("hero-prev"); if (i) i.src = h.url; if (p) p.style.display = "block"; }
}
async function uploadHero(inp) {
  if (!inp.files[0]) return;
  var fd = new FormData(); fd.append("image", inp.files[0]);
  try {
    var r = await fetch("/api/upload/hero", { method: "POST", headers: { "Authorization": authHeader() }, body: fd });
    var d = await r.json();
    if (d.ok) { toast("Hero yuklendi"); DB.hero = { url: d.url }; var i = T("hero-img"), p = T("hero-prev"); if (i) i.src = d.url; if (p) p.style.display = "block"; }
    else toast(d.error || "Hata", true);
  } catch (e) { toast("Yukleme hatasi", true); }
}
function loadResume() {
  var r = DB.resume;
  if (r && r.url) { var i = T("resume-img"), p = T("resume-prev"); if (i) i.src = r.url; if (p) p.style.display = "block"; }
}
async function uploadResume(inp) {
  if (!inp.files[0]) return;
  var fd = new FormData(); fd.append("image", inp.files[0]);
  try {
    var r = await fetch("/api/upload/resume", { method: "POST", headers: { "Authorization": authHeader() }, body: fd });
    var d = await r.json();
    if (d.ok) { toast("Resume yuklendi"); DB.resume = { url: d.url }; var i = T("resume-img"), p = T("resume-prev"); if (i) i.src = d.url; if (p) p.style.display = "block"; }
    else toast(d.error || "Hata", true);
  } catch (e) { toast("Yukleme hatasi", true); }
}

/* ========== FAVICON ========== */
async function loadFavicon() {
  try {
    var r = await fetch("/api/favicon");
    var d = await r.json();
    if (d && d.url) {
      var i = T("favicon-img"), p = T("favicon-prev");
      if (i) i.src = d.url;
      if (p) p.style.display = "block";
    }
  } catch (e) {}
}
async function uploadFavicon(inp) {
  if (!inp.files[0]) return;
  var fd = new FormData(); fd.append("image", inp.files[0]);
  try {
    var r = await fetch("/api/upload/favicon", { method: "POST", headers: { "Authorization": authHeader() }, body: fd });
    var d = await r.json();
    if (d.ok) {
      toast("Favicon yuklendi");
      var i = T("favicon-img"), p = T("favicon-prev");
      if (i) i.src = d.url;
      if (p) p.style.display = "block";
    } else toast(d.error || "Hata", true);
  } catch (e) { toast("Yukleme hatasi", true); }
}

/* ========== PROJECTS DASHBOARD ========== */
async function loadProjects() {
  try {
    var r = await fetch("/api/projects");
    var d = await r.json();
    ALL_PROJECTS = Array.isArray(d) ? d : (d.projects || []);
    renderTabs(); renderList();
  } catch (e) { toast("Projeler yuklenemedi", true); }
}
function renderTabs() {
  var tabs = T("proj-tabs"); if (!tabs) return;
  function count(folder) { return folder === "__all" ? ALL_PROJECTS.length : ALL_PROJECTS.filter(function (p) { return p.category === folder; }).length; }
  var html = '<button class="proj-tab active" data-folder="__all">Tumu<span class="count">' + count("__all") + '</span></button>';
  CATEGORIES.forEach(function (g) {
    g.folders.forEach(function (f) {
      html += '<button class="proj-tab" data-folder="' + esc(f) + '" title="' + esc(g.group) + '">' + esc(f) + '<span class="count">' + count(f) + '</span></button>';
    });
  });
  tabs.innerHTML = html;
  Array.prototype.slice.call(tabs.querySelectorAll(".proj-tab")).forEach(function (t) {
    if (t.dataset.folder === CURRENT_FOLDER) {
      tabs.querySelectorAll(".proj-tab").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
    }
    t.addEventListener("click", function () {
      tabs.querySelectorAll(".proj-tab").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      CURRENT_FOLDER = t.dataset.folder;
      renderList();
    });
  });
}
function renderList() {
  var list = T("proj-list"); var empty = T("proj-empty");
  if (!list) return;
  var items = ALL_PROJECTS.slice();
  if (CURRENT_FOLDER !== "__all") items = items.filter(function (p) { return p.category === CURRENT_FOLDER; });
  items.sort(function (a, b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); });
  if (!items.length) { list.innerHTML = ""; if (empty) empty.style.display = "block"; return; }
  if (empty) empty.style.display = "none";
  list.innerHTML = items.map(function (p) {
    var cover = p.cover && p.cover.url ? p.cover.url : ((p.media && p.media[0] && p.media[0].url) || "");
    var coverHtml = cover
      ? '<div class="proj-cover"><img src="' + esc(cover) + '" alt=""><span class="proj-status ' + esc(p.status || "draft") + '">' + esc(p.status || "draft") + '</span></div>'
      : '<div class="proj-cover"><div class="proj-cover-empty">No cover</div><span class="proj-status ' + esc(p.status || "draft") + '">' + esc(p.status || "draft") + '</span></div>';
    var date = p.updatedAt ? new Date(p.updatedAt).toLocaleDateString("tr-TR") : "";
    return '<article class="proj-card">' + coverHtml +
      '<div class="proj-body"><p class="proj-cat">' + esc(p.category || "Uncategorized") + '</p><h3 class="proj-title">' + esc(p.title || "Untitled") + '</h3><p class="proj-meta">' + (date ? "Updated " + date : "New") + '</p></div>' +
      '<div class="proj-actions"><a href="project-editor.html?id=' + encodeURIComponent(p.id) + '">Edit</a><button class="danger" data-id="' + esc(p.id) + '" onclick="deleteProject(this.dataset.id)">Sil</button></div></article>';
  }).join("");
}
async function deleteProject(id) {
  if (!confirm("Bu projeyi silmek istediginden emin misin?")) return;
  try {
    var r = await fetch("/api/projects/" + encodeURIComponent(id), { method: "DELETE", headers: { "Authorization": authHeader() } });
    var d = await r.json();
    if (d.ok) { toast("Silindi"); loadProjects(); } else toast(d.error || "Hata", true);
  } catch (e) { toast("Silme hatasi", true); }
}

/* ========== GAME COVERS ========== */
function renderCovers() {
  var grid = T("covers-grid"); if (!grid) return;
  grid.innerHTML = "";
  GAME_KEYS.forEach(function (g) {
    var proj = (DB.projects || {})[g.key] || {};
    var coverUrl = proj.cover && proj.cover.url ? proj.cover.url : "";
    var card = document.createElement("div");
    card.style.cssText = "background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;padding:12px;";

    var thumb = document.createElement("label");
    thumb.style.cssText = "aspect-ratio:1/1;background:#1e1d22;border:1.5px dashed rgba(255,255,255,0.12);border-radius:6px;margin-bottom:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;transition:border-color 0.15s;";
    thumb.onmouseenter = function(){ thumb.style.borderColor = "var(--accent)"; };
    thumb.onmouseleave = function(){ thumb.style.borderColor = "rgba(255,255,255,0.12)"; };

    if (coverUrl) {
      var img = document.createElement("img");
      img.src = coverUrl;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      thumb.appendChild(img);
      var ov = document.createElement("div");
      ov.style.cssText = "position:absolute;inset:0;background:rgba(0,0,0,0.55);opacity:0;display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;letter-spacing:0.1em;text-transform:uppercase;font-weight:700;font-family:Jost,Futura,sans-serif;transition:opacity 0.15s;";
      ov.textContent = "Degistir";
      thumb.appendChild(ov);
      thumb.onmouseenter = function(){ ov.style.opacity = "1"; thumb.style.borderColor = "var(--accent)"; };
      thumb.onmouseleave = function(){ ov.style.opacity = "0"; thumb.style.borderColor = "rgba(255,255,255,0.12)"; };
    } else {
      var ph = document.createElement("div");
      ph.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:6px;";
      ph.innerHTML = '<i class="ti ti-cloud-upload" style="font-size:28px;color:var(--muted);opacity:0.5;"></i><div style="font-size:11px;color:var(--muted);">Kapak yukle</div>';
      thumb.appendChild(ph);
    }
    var input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.style.cssText = "position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;";
    input.onchange = (function (key) { return function (e) { uploadGameCover(key, e.target); }; })(g.key);
    thumb.appendChild(input);

    var label = document.createElement("div");
    label.style.cssText = "font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.1em;font-family:Jost,Futura,sans-serif;text-align:center;";
    label.textContent = g.label;
    card.appendChild(thumb); card.appendChild(label);
    grid.appendChild(card);
  });
}
async function uploadGameCover(key, inp) {
  if (!inp.files[0]) return;
  var fd = new FormData(); fd.append("image", inp.files[0]);
  try {
    var r = await fetch("/api/upload/project/" + encodeURIComponent(key) + "/cover", { method: "POST", headers: { "Authorization": authHeader() }, body: fd });
    var d = await r.json();
    if (d.ok) {
      toast("Kapak yuklendi: " + key);
      if (!DB.projects) DB.projects = {};
      if (!DB.projects[key]) DB.projects[key] = {};
      DB.projects[key].cover = { url: d.url };
      renderCovers();
    } else { toast(d.error || "Hata", true); }
  } catch (e) { toast("Yukleme hatasi", true); }
}

/* ========== PORTFOLIO PANEL COVERS (Game Art / Personal Works tile backgrounds) ========== */
var PORTFOLIO_PANELS = [
  { key: "game-art",       label: "Game Art Panel"       },
  { key: "personal-works", label: "Personal Works Panel" }
];
function renderPortfolioCovers() {
  var grid = T("pc-grid"); if (!grid) return;
  grid.innerHTML = "";
  PORTFOLIO_PANELS.forEach(function (p) {
    var data = (DB.portfolio_covers || {})[p.key] || {};
    var url = data.url || "";
    var card = document.createElement("div");
    card.style.cssText = "background:var(--bg2);border:0.5px solid var(--border);border-radius:8px;padding:14px;";

    var thumb = document.createElement("label");
    thumb.style.cssText = "aspect-ratio:4/3;background:#1e1d22;border:1.5px dashed rgba(255,255,255,0.12);border-radius:6px;margin-bottom:10px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;";

    if (url) {
      var img = document.createElement("img");
      img.src = url; img.style.cssText = "width:100%;height:100%;object-fit:cover;";
      thumb.appendChild(img);
    } else {
      thumb.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;"><i class="ti ti-cloud-upload" style="font-size:32px;color:var(--muted);opacity:0.5;"></i><div style="font-size:12px;color:var(--muted);">Panel kapagi yukle</div></div>';
    }
    var input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.style.cssText = "position:absolute;inset:0;opacity:0;cursor:pointer;";
    input.onchange = (function (key) { return function (e) { uploadPortfolioCover(key, e.target); }; })(p.key);
    thumb.appendChild(input);

    var label = document.createElement("div");
    label.style.cssText = "font-size:12px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.1em;font-family:Jost,Futura,sans-serif;";
    label.textContent = p.label;
    card.appendChild(thumb); card.appendChild(label);
    grid.appendChild(card);
  });
}
async function uploadPortfolioCover(key, inp) {
  if (!inp.files[0]) return;
  var fd = new FormData(); fd.append("image", inp.files[0]);
  try {
    var r = await fetch("/api/upload/portfolio-cover/" + encodeURIComponent(key), { method: "POST", headers: { "Authorization": authHeader() }, body: fd });
    var d = await r.json();
    if (d.ok) {
      toast("Panel kapagi yuklendi: " + key);
      if (!DB.portfolio_covers) DB.portfolio_covers = {};
      DB.portfolio_covers[key] = { url: d.url };
      renderPortfolioCovers();
    } else { toast(d.error || "Hata", true); }
  } catch (e) { toast("Yukleme hatasi", true); }
}

/* ========== RESUME EDIT ========== */
async function renderResumeEdit() {
  try {
    var r = await fetch("/api/resume");
    if (r.ok) DB.resume_data = await r.json();
  } catch (e) {}
  RESUME_DATA = DB.resume_data || { experience: [], achievements: "", skills: [] };
  if (!Array.isArray(RESUME_DATA.experience))   RESUME_DATA.experience = [];
  // Achievements is now a single free-form string. Backward compat: if API returned an array, flatten to string.
  if (Array.isArray(RESUME_DATA.achievements)) {
    RESUME_DATA.achievements = RESUME_DATA.achievements
      .map(function (a) {
        if (typeof a === "string") return a;
        if (a && typeof a === "object") return [a.title, a.company, a.year, a.projects].filter(Boolean).join(" - ");
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  } else if (typeof RESUME_DATA.achievements !== "string") {
    RESUME_DATA.achievements = "";
  }
  if (!Array.isArray(RESUME_DATA.skills))       RESUME_DATA.skills = [];
  renderResumeList("exp");
  var achInput = T("ach-input");
  if (achInput) {
    achInput.value = RESUME_DATA.achievements || "";
    achInput.oninput = function (e) { RESUME_DATA.achievements = e.target.value; };
  }
  T("skills-input").value = RESUME_DATA.skills.join(", ");
}
function resumeRowHTML(item, idx, kind) {
  return '<div style="background:#1e1d22;border:0.5px solid var(--border);border-radius:6px;padding:14px;margin-bottom:10px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 140px;gap:10px;margin-bottom:10px;">' +
      resumeInput("Title",   item.title,   idx, kind, "title")   +
      resumeInput("Company", item.company, idx, kind, "company") +
      resumeInput("Year",    item.year,    idx, kind, "year")    +
    '</div>' +
    resumeInput("Projects / Detail", item.projects, idx, kind, "projects") +
    '<button style="margin-top:12px;background:transparent;border:0.5px solid rgba(239,68,68,0.4);color:#ef4444;padding:6px 14px;border-radius:4px;font-size:11px;font-weight:600;cursor:pointer;font-family:Jost,Futura,sans-serif;letter-spacing:0.06em;text-transform:uppercase;" onclick="removeResumeItem(\'' + kind + '\',' + idx + ')">Sil</button>' +
  '</div>';
}
function resumeInput(labelTxt, val, idx, kind, field) {
  return '<div>' +
    '<label style="font-size:10px;color:var(--muted);display:block;margin-bottom:4px;letter-spacing:0.06em;">' + labelTxt + '</label>' +
    '<input type="text" data-kind="' + kind + '" data-i="' + idx + '" data-f="' + field + '" value="' + esc(val || "") + '" style="background:#0e0d11;border:0.5px solid var(--border);border-radius:4px;padding:8px 11px;color:var(--text);font-size:12px;width:100%;font-family:Jost,Futura,sans-serif;outline:none;">' +
  '</div>';
}
function renderResumeList(kind) {
  // Only used for experience now; achievements is a single textarea handled in renderResumeEdit.
  if (kind !== "exp") return;
  var list = T("exp-list"); if (!list) return;
  var arr = RESUME_DATA.experience;
  if (!arr.length) {
    list.innerHTML = '<div style="text-align:center;padding:30px;color:var(--muted);font-size:12px;font-family:Jost,Futura,sans-serif;">Henuz deneyim eklenmemis. Yukaridaki "+ Ekle" ile baslay.</div>';
    return;
  }
  list.innerHTML = arr.map(function (it, i) { return resumeRowHTML(it, i, "exp"); }).join("");
  list.querySelectorAll("input[data-kind]").forEach(function (inp) {
    inp.oninput = function (e) {
      var i = parseInt(e.target.getAttribute("data-i"), 10);
      var f = e.target.getAttribute("data-f");
      if (RESUME_DATA.experience[i]) RESUME_DATA.experience[i][f] = e.target.value;
    };
  });
}
function addExperience() {
  RESUME_DATA.experience.push({ title: "", company: "", year: "", projects: "" });
  renderResumeList("exp");
}
function removeResumeItem(kind, idx) {
  if (kind !== "exp") return;
  if (!confirm("Sil?")) return;
  RESUME_DATA.experience.splice(idx, 1);
  renderResumeList("exp");
}
async function saveResumeData() {
  RESUME_DATA.skills = T("skills-input").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
  var achInput = T("ach-input");
  if (achInput) RESUME_DATA.achievements = achInput.value;
  try {
    var r = await fetch("/api/resume", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": authHeader() },
      body: JSON.stringify(RESUME_DATA)
    });
    var d = await r.json();
    if (d.ok) { toast("Resume kaydedildi"); DB.resume_data = JSON.parse(JSON.stringify(RESUME_DATA)); }
    else { toast(d.error || "Hata", true); }
  } catch (e) { toast("Kaydetme hatasi", true); }
}

window.addEventListener("DOMContentLoaded", init);
