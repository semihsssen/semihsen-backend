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
  var titles = { "settings": "Boyut & Renk", "hero": "Hero Gorseli", "resume": "Resume CV", "projects": "Projeler" };
  T("tt").textContent = titles[id] || id;
  if (id === "projects") loadProjects();
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

window.addEventListener("DOMContentLoaded", init);
