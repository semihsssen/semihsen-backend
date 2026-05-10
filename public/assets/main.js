// semihsen.art - main.js
let siteDB = null;

async function loadSiteData() {
  try {
    const r = await fetch('/api/data');
    siteDB = await r.json();
    applySettings(siteDB.settings);
    applyColors(siteDB.settings);
    applyHero(siteDB.hero);
    applyResume(siteDB.resume);
    applyGameGrid(siteDB.projects);
    applyPersonal(siteDB.personal);
  } catch(e) {
    console.log('API baglantisi yok, statik mod.');
  }
}

function applySettings(s) {
  if (!s) return;
  const r = document.documentElement.style;
  if (s.nav_height) r.setProperty('--nav-height', s.nav_height);
  if (s.nav_logo_size) r.setProperty('--nav-logo-size', s.nav_logo_size);
  if (s.nav_sub_size) r.setProperty('--nav-sub-size', s.nav_sub_size);
  if (s.nav_link_size) r.setProperty('--nav-link-size', s.nav_link_size);
  if (s.hero_height) r.setProperty('--hero-height', s.hero_height);
  if (s.thumb_height) r.setProperty('--thumb-height', s.thumb_height);
  if (s.nav_logo_x) r.setProperty('--nav-logo-x', s.nav_logo_x + 'px');
  if (s.nav_logo_y) r.setProperty('--nav-logo-y', s.nav_logo_y + 'px');
}

function applyColors(s) {
  if (!s) return;
  const r = document.documentElement.style;
  if (s.color_bg) r.setProperty('--bg', s.color_bg);
  if (s.color_bg2) r.setProperty('--bg2', s.color_bg2);
  if (s.color_text) r.setProperty('--text', s.color_text);
  if (s.color_muted) r.setProperty('--muted', s.color_muted);
  if (s.color_accent) r.setProperty('--accent', s.color_accent);
}

function applyHero(hero) {
  if (!hero || !hero.url) return;
  const el = document.getElementById('hero-img');
  if (!el) return;
  el.style.backgroundImage = 'url(' + hero.url + ')';
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  const ph = el.querySelector('.hero-ph-label');
  if (ph) ph.style.display = 'none';
}

function applyResume(resume) {
  if (!resume || !resume.url) return;
  const el = document.getElementById('resume-img');
  if (!el) return;
  el.style.backgroundImage = 'url(' + resume.url + ')';
  el.style.backgroundSize = 'cover';
  el.style.backgroundPosition = 'center';
  const ph = el.querySelector('.resume-img-ph');
  if (ph) ph.style.display = 'none';
}

// Game Art: 5 oyun kapak izgarasi
function applyGameGrid(projects) {
  if (!projects) return;
  const grid = document.getElementById('game-art-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (const [key, proj] of Object.entries(projects)) {
    const coverUrl = proj.cover && proj.cover.url ? proj.cover.url : '';
    const div = document.createElement('div');
    div.className = 'game-cover-item';
    div.onclick = () => openGameDetail(key);
    div.innerHTML = '<div class="game-cover-img" style="' + (coverUrl ? 'background-image:url(' + coverUrl + ');background-size:cover;background-position:center;' : '') + '">' + (!coverUrl ? '<div class="cover-ph"><i class="ti ti-photo"></i></div>' : '') + '</div><div class="game-cover-label">' + (proj.name || key) + '</div>';
    grid.appendChild(div);
  }
}

let currentGameKey = null;

// Oyuna tiklayin ca: o oyunun tum isleri sonsuz izgara
function openGameDetail(key) {
  if (!siteDB || !siteDB.projects[key]) return;
  currentGameKey = key;
  const proj = siteDB.projects[key];
  const titleEl = document.getElementById('game-detail-title');
  if (titleEl) titleEl.textContent = proj.name || key;
  const grid = document.getElementById('game-works-grid');
  if (!grid) return;
  grid.innerHTML = '';
  if (!proj.works || proj.works.length === 0) {
    grid.innerHTML = '<div style="padding:40px;color:var(--muted);font-family:var(--font);font-size:12px;">Henuz is eklenmemis</div>';
  } else {
    proj.works.forEach((work, wi) => {
      const thumbUrl = work.thumbnail && work.thumbnail.url ? work.thumbnail.url : '';
      const div = document.createElement('div');
      div.className = 'work-inf-item';
      div.onclick = () => openWorkDetail(key, wi);
      div.innerHTML = thumbUrl ? '<img class="work-inf-img" src="' + thumbUrl + '" loading="lazy">' : '<div class="work-inf-ph"><i class="ti ti-photo"></i></div>';
      grid.appendChild(div);
    });
  }
  showPage('game-detail');
}

// Is'e tiklayin ca: kare gorseller scroll ile asagidan asagiya
function openWorkDetail(key, wi) {
  if (!siteDB || !siteDB.projects[key]) return;
  const proj = siteDB.projects[key];
  const work = proj.works[wi];
  if (!work) return;
  const titleEl = document.getElementById('work-detail-title');
  if (titleEl) titleEl.textContent = work.name || (proj.name + ' — Work ' + (wi + 1));
  const backTitle = document.getElementById('work-slider-back-title');
  if (backTitle) backTitle.textContent = proj.name || key;
  // Store butonlari
  const storeBtns = document.getElementById('work-store-btns');
  if (storeBtns) {
    let btnsHTML = '';
    if (proj.ios) btnsHTML += '<a class="store-btn" href="' + proj.ios + '" target="_blank"><i class="ti ti-brand-apple"></i><div class="store-btn-text"><span class="store-btn-label">Download on the</span><span class="store-btn-name">App Store</span></div></a>';
    if (proj.android) btnsHTML += '<a class="store-btn" href="' + proj.android + '" target="_blank"><i class="ti ti-brand-google-play"></i><div class="store-btn-text"><span class="store-btn-label">Get it on</span><span class="store-btn-name">Google Play</span></div></a>';
    storeBtns.innerHTML = btnsHTML;
  }
  // Sag panel: proje bilgileri
  const infoPanel = document.getElementById('work-info-panel');
  if (infoPanel) {
    const cr = proj.credits || {};
    let credHTML = '';
    if (cr.art_direction) credHTML += '<div class="credit-row"><span class="credit-label">Art Direction</span><span class="credit-value">' + cr.art_direction + '</span></div>';
    if (cr.concept_art) credHTML += '<div class="credit-row"><span class="credit-label">Concept Art</span><span class="credit-value">' + cr.concept_art + '</span></div>';
    if (cr.art_3d) credHTML += '<div class="credit-row"><span class="credit-label">3D Art</span><span class="credit-value">' + cr.art_3d + '</span></div>';
    infoPanel.innerHTML = '<div class="work-info-name">' + (proj.name || key) + '</div><div class="work-info-studio">' + (proj.studio || '') + (proj.year ? ' · ' + proj.year : '') + '</div>' + (credHTML ? '<div class="work-info-credits">' + credHTML + '</div>' : '') + (proj.about ? '<div class="work-info-about">' + proj.about + '</div>' : '');
  }
  // Gorsel kareleri: her biri 1:1 oranda, scroll ile
  const scrollEl = document.getElementById('work-slides-scroll');
  if (scrollEl) {
    const slides = work.slides || [];
    if (slides.length === 0) {
      scrollEl.innerHTML = '<div class="work-slide-item"><div class="work-slide-ph"><i class="ti ti-photo"></i></div></div>';
    } else {
      scrollEl.innerHTML = slides.map(s => '<div class="work-slide-item"><img src="' + s.url + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></div>').join('');
    }
  }
  showPage('work-detail');
}

// Personal Works izgara
function applyPersonal(personal) {
  if (!personal) return;
  const grid = document.getElementById('personal-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const colors = ['g1','g2','g3','g4','g5','g6'];
  let idx = 0;
  for (const [key, proj] of Object.entries(personal)) {
    const div = document.createElement('div');
    div.className = 'game-item ' + colors[idx % colors.length];
    div.onclick = () => openPersonalDetail(key);
    const slides = proj.slides || [];
    let ih = '';
    if (slides.length > 0) {
      slides.slice(0,4).forEach(s => { ih += '<div class="inner-cell"><img src="' + s.url + '" loading="lazy"></div>'; });
      for (let i = slides.length; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    } else {
      for (let i = 0; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    }
    div.innerHTML = '<div class="inner-grid">' + ih + '</div><div class="grid-overlay"><div class="grid-title">' + (proj.name || 'Personal Work') + '</div></div>';
    grid.appendChild(div);
    idx++;
  }
}

let currentPersonalKey = null;

function openPersonalDetail(key) {
  if (!siteDB || !siteDB.personal[key]) return;
  currentPersonalKey = key;
  const proj = siteDB.personal[key];
  const titleEl = document.getElementById('personal-detail-title');
  if (titleEl) titleEl.textContent = proj.name || 'Personal Work';
  const scrollEl = document.getElementById('personal-slides-scroll');
  if (!scrollEl) return;
  const slides = proj.slides || [];
  if (slides.length === 0) {
    scrollEl.innerHTML = '<div class="work-slide-item"><div class="work-slide-ph"><i class="ti ti-photo"></i></div></div>';
  } else {
    scrollEl.innerHTML = slides.map(s => '<div class="work-slide-item"><img src="' + s.url + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></div>').join('');
  }
  showPage('personal-detail');
}

// Sayfa goster/gizle
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  const navMap = { home:'nav-home', portfolio:'nav-portfolio', game:'nav-portfolio', 'game-detail':'nav-portfolio', 'work-detail':'nav-portfolio', personal:'nav-portfolio', 'personal-detail':'nav-portfolio', resume:'nav-resume' };
  if (navMap[id]) {
    const navEl = document.getElementById(navMap[id]);
    if (navEl) navEl.classList.add('active');
  }
  const el = document.getElementById('page-' + id);
  if (el) {
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
}

loadSiteData();
