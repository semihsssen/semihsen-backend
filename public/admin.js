var DB = {};
var ALL_PROJECTS = [];
var CURRENT_FOLDER = "__all";

var CATEGORIES = [
  { group: "GAME ART", folders: ["Block Out", "Car Match", "Magic Sort", "Match Villians", "Wonder Blast"] },
  { group: "PERSONAL", folders: ["Personal Works"] }
];

function T(id) { return document.getElementById(id); }
function toast(m, e) {
  var t = T("toast"); if (!t) return;
  t.textContent = m;
  t.style.background = e ? "#c0392b" : "#4a90e2";
  t.classList.add("show");
  setTimeout(function () { t.classList.remove("show"); }, 3000);
}
function esc(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function getPwd() { return "semih2024"; }
function authHeader() { return "Basic " + btoa("semih:" + getPwd()); }

function SP(id, el) {
  document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
  document.querySelectorAll(".ni").forEach(function (n) { n.classList.remove("active"); });
  var p = T("pn-" + id); if (p) p.classList.add("active");
  if (el) el.classList.add("active");
  var titles = { "settings": "Boyut & Renk", "hero": "Hero Gorseli", "resume": "Resume Gorseli", "resumeedit": "Resume Duzenle", "covers": "Oyun Kapaklari", "projects": "Projeler" };
  T("tt").textContent = titles[id] || id;
  if (id === "projects") loadProjects();
  if (id === "covers") renderCovers();
  if (id === "resumeedit") renderResumeEdit();
}

async function init() {
  try {
    var r = await fetch("/api/data");
    DB = await r.json();
    loadSets(); loadHero(); loadResume();
  } catch (e) { toast("Veri yuklenemedi", true); }
}

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
    if (d.ok) { toast("Hero yuklendi"); DB.hero = { url: d.url }; var i = T("hero-img"), p = T("hero-prev"); if (i) i.src = d.url; if (p) p.style.display = "block"; } else toast(d.error || "Hata", true);
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
    if (d.ok) { toast("Resume yuklendi"); DB.resume = { url: d.url }; var i = T("resume-img"), p = T("resume-prev"); if (i) i.src = d.url; if (p) p.style.display = "block"; } else toast(d.error || "Hata", true);
  } catch (e) { toast("Yukleme hatasi", true); }
}

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

// ===== OYUN KAPAKLARI =====
var GAME_KEYS = [
  { key: "block-out", label: "Block Out" },
  { key: "car-match", label: "Car Match" },
  { key: "magic-sort", label: "Magic Sort" },
  { key: "match-villains", label: "Match Villians" },
  { key: "wonder-blast", label: "Wonder Blast" }
];

function renderCovers() {
  var grid = T("covers-grid"); if (!grid) return;
  grid.innerHTML = "";
  GAME_KEYS.forEach(function (g) {
    var proj = (DB.projects || {})[g.key] || {};
    var coverUrl = proj.cover && proj.cover.url ? proj.cover.url : "";
    var card = document.createElement("div");
    card.style.cssText = "background:var(--bg2);border:0.5px solid var(--border);border-radius:6px;padding:10px;";
    var thumb = document.createElement("div");
    thumb.style.cssText = "aspect-ratio:1/1;background:#1e1d22;border-radius:4px;margin-bottom:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative;";
    if (coverUrl) {
      var img = document.createElement("img");
      img.src = coverUrl;
      img.style.cssText = "width:100%;height:100%;object-fit:cover;display:block;";
      thumb.appendChild(img);
    } else {
      var icon = document.createElement("i");
      icon.className = "ti ti-photo-up";
      icon.style.cssText = "font-size:32px;color:var(--muted);opacity:0.4;";
      thumb.appendChild(icon);
    }
    var input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.style.cssText = "position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;";
    input.onchange = (function (key) { return function (e) { uploadGameCover(key, e.target); }; })(g.key);
    thumb.appendChild(input);
    var label = document.createElement("div");
    label.style.cssText = "font-size:11px;font-weight:700;color:var(--text);text-transform:uppercase;letter-spacing:0.1em;font-family:Inter,sans-serif;text-align:center;";
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

// ===== RESUME DUZENLE =====
var RESUME_DATA = { experience: [], achievements: [], skills: [] };

async function renderResumeEdit() {
  try {
    var r = await fetch("/api/resume");
    if (r.ok) DB.resume_data = await r.json();
  } catch (e) {}
  RESUME_DATA = DB.resume_data || { experience: [], achievements: [], skills: [] };
  if (!Array.isArray(RESUME_DATA.experience)) RESUME_DATA.experience = [];
  if (!Array.isArray(RESUME_DATA.achievements)) RESUME_DATA.achievements = [];
  if (!Array.isArray(RESUME_DATA.skills)) RESUME_DATA.skills = [];
  renderExpList();
  renderAchList();
  T("skills-input").value = RESUME_DATA.skills.join(", ");
}

function expCardHTML(item, idx, kind) {
  return '<div style="background:#1e1d22;border:0.5px solid var(--border);border-radius:6px;padding:14px;margin-bottom:10px;">' +
    '<div style="display:grid;grid-template-columns:1fr 1fr 130px;gap:10px;margin-bottom:10px;">' +
      '<div><label style="font-size:10px;color:var(--muted);">Title</label><input type="text" data-kind="' + kind + '" data-i="' + idx + '" data-f="title" value="' + esc(item.title || "") + '" style="background:#0e0d11;border:0.5px solid var(--border);border-radius:4px;padding:7px 10px;color:var(--text);font-size:12px;width:100%;font-family:Inter,sans-serif;"></div>' +
      '<div><label style="font-size:10px;color:var(--muted);">Company</label><input type="text" data-kind="' + kind + '" data-i="' + idx + '" data-f="company" value="' + esc(item.company || "") + '" style="background:#0e0d11;border:0.5px solid var(--border);border-radius:4px;padding:7px 10px;color:var(--text);font-size:12px;width:100%;font-family:Inter,sans-serif;"></div>' +
      '<div><label style="font-size:10px;color:var(--muted);">Year</label><input type="text" data-kind="' + kind + '" data-i="' + idx + '" data-f="year" value="' + esc(item.year || "") + '" style="background:#0e0d11;border:0.5px solid var(--border);border-radius:4px;padding:7px 10px;color:var(--text);font-size:12px;width:100%;font-family:Inter,sans-serif;"></div>' +
    '</div>' +
    '<div><label style="font-size:10px;color:var(--muted);">Projects / Detail</label><input type="text" data-kind="' + kind + '" data-i="' + idx + '" data-f="projects" value="' + esc(item.projects || "") + '" style="background:#0e0d11;border:0.5px solid var(--border);border-radius:4px;padding:7px 10px;color:var(--text);font-size:12px;width:100%;font-family:Inter,sans-serif;"></div>' +
    '<button style="margin-top:10px;background:transparent;border:0.5px solid rgba(239,68,68,0.3);color:#ef4444;padding:7px 12px;border-radius:4px;font-size:11px;cursor:pointer;font-family:Inter,sans-serif;" onclick="removeItem(\'' + kind + '\',' + idx + ')">Sil</button>' +
  '</div>';
}

function renderExpList() {
  var list = T("exp-list"); if (!list) return;
  list.innerHTML = RESUME_DATA.experience.map(function (it, i) { return expCardHTML(it, i, "exp"); }).join("");
  bindEditInputs();
}
function renderAchList() {
  var list = T("ach-list"); if (!list) return;
  list.innerHTML = RESUME_DATA.achievements.map(function (it, i) { return expCardHTML(it, i, "ach"); }).join("");
  bindEditInputs();
}
function bindEditInputs() {
  document.querySelectorAll('input[data-kind]').forEach(function (inp) {
    inp.oninput = function (e) {
      var k = e.target.getAttribute("data-kind");
      var i = parseInt(e.target.getAttribute("data-i"), 10);
      var f = e.target.getAttribute("data-f");
      var arr = k === "exp" ? RESUME_DATA.experience : RESUME_DATA.achievements;
      if (arr[i]) arr[i][f] = e.target.value;
    };
  });
}

function addExperience() {
  RESUME_DATA.experience.push({ title: "", company: "", year: "", projects: "" });
  renderExpList();
}
function addAchievement() {
  RESUME_DATA.achievements.push({ title: "", company: "", year: "", projects: "" });
  renderAchList();
}
function removeItem(kind, idx) {
  if (!confirm("Sil?")) return;
  var arr = kind === "exp" ? RESUME_DATA.experience : RESUME_DATA.achievements;
  arr.splice(idx, 1);
  if (kind === "exp") renderExpList(); else renderAchList();
}

async function saveResumeData() {
  RESUME_DATA.skills = T("skills-input").value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
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
