// semihsen.art - main.js (v4 — supports userProjects from new admin)
let siteDB = null;

// Map editor category labels to fixed project keys used by the homepage
const CAT_TO_KEY = {
  'Block Out': 'block-out',
  'Car Match': 'car-match',
  'Magic Sort': 'magic-sort',
  'Match Villians': 'match-villains',
  'Wonder Blast': 'wonder-blast'
};

async function loadSiteData() {
  try {
    const r = await fetch('/api/data');
    siteDB = await r.json();
    applySettings(siteDB.settings);
    applyColors(siteDB.settings);
    applyHero(siteDB.hero);
    applyResume(siteDB.resume);
    applyGameGrid(siteDB.projects);
    applyPersonal(siteDB.personal, siteDB.userProjects);
  } catch (e) {
    console.log('API baglantisi yok, statik mod.', e);
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

// Game Art covers grid — 5 fixed games
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

// Render the top tab bar with all 5 games, active = current
function renderGameTabs(activeKey) {
  if (!siteDB || !siteDB.projects) return;
  let bar = document.getElementById('game-tabs-bar');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'game-tabs-bar';
    bar.className = 'game-tabs-bar';
    const page = document.getElementById('page-game-detail');
    const header = page && page.querySelector('.port-inner-header');
    if (header && header.parentNode) header.parentNode.insertBefore(bar, header.nextSibling);
  }
  bar.innerHTML = Object.entries(siteDB.projects).map(([key, p]) =>
    '<button class="game-tab ' + (key === activeKey ? 'active' : '') + '" data-key="' + key + '">' + (p.name || key) + '</button>'
  ).join('');
  Array.from(bar.querySelectorAll('.game-tab')).forEach(b => {
    b.addEventListener('click', () => openGameDetail(b.dataset.key));
  });
}

// Open a specific Game Art project — shows its works grid + ANY userProjects matching this category
function openGameDetail(key) {
  if (!siteDB || !siteDB.projects[key]) return;
  currentGameKey = key;
  renderGameTabs(key);
  const proj = siteDB.projects[key];
  const titleEl = document.getElementById('game-detail-title');
  if (titleEl) titleEl.textContent = proj.name || key;

  const grid = document.getElementById('game-works-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // 1) Existing fixed works for this project
  const fixedWorks = proj.works || [];
  fixedWorks.forEach((work, wi) => {
    const thumbUrl = work.thumbnail && work.thumbnail.url ? work.thumbnail.url : (work.url || '');
    const div = document.createElement('div');
    div.className = 'work-inf-item';
    div.onclick = () => openWorkDetail(key, wi);
    div.innerHTML = thumbUrl
      ? '<img class="work-inf-img" src="' + thumbUrl + '" loading="lazy">'
      : '<div class="work-inf-ph"><i class="ti ti-photo"></i></div>';
    grid.appendChild(div);
  });

  // 2) NEW: User projects whose category maps to this fixed game
  const matchingUserProjects = (siteDB.userProjects || []).filter(p =>
    p.status === 'published' && CAT_TO_KEY[p.category] === key
  );
  matchingUserProjects.forEach(p => {
    const media = p.media || [];
    if (!media.length && !(p.cover && p.cover.url)) return;
    const thumbUrl = (p.cover && p.cover.url) || (media[0] && media[0].url) || '';
    const div = document.createElement('div');
    div.className = 'work-inf-item';
    div.onclick = () => openUserWorkDetail(p.id);
    div.innerHTML = thumbUrl
      ? '<img class="work-inf-img" src="' + thumbUrl + '" loading="lazy">'
      : '<div class="work-inf-ph"><i class="ti ti-photo"></i></div>';
    grid.appendChild(div);
  });

  if (fixedWorks.length === 0 && matchingUserProjects.length === 0) {
    grid.innerHTML = '<div style="padding:40px;color:var(--muted);font-family:var(--font);font-size:12px;">Henuz is eklenmemis</div>';
  }

  showPage('game-detail');
}

// Open a fixed-project work detail (existing v3 logic)
function openWorkDetail(key, wi) {
  if (!siteDB || !siteDB.projects[key]) return;
  const proj = siteDB.projects[key];
  const work = proj.works[wi];
  if (!work) return;
  const titleEl = document.getElementById('work-detail-title');
  if (titleEl) titleEl.textContent = work.name || (proj.name + ' — Work ' + (wi + 1));
  const backTitle = document.getElementById('work-slider-back-title');
  if (backTitle) backTitle.textContent = proj.name || key;
  const storeBtns = document.getElementById('work-store-btns');
  if (storeBtns) {
    let btnsHTML = '';
    if (proj.ios) btnsHTML += '<a class="store-btn" href="' + proj.ios + '" target="_blank"><i class="ti ti-brand-apple"></i><div class="store-btn-text"><span class="store-btn-label">Download on the</span><span class="store-btn-name">App Store</span></div></a>';
    if (proj.android) btnsHTML += '<a class="store-btn" href="' + proj.android + '" target="_blank"><i class="ti ti-brand-google-play"></i><div class="store-btn-text"><span class="store-btn-label">Get it on</span><span class="store-btn-name">Google Play</span></div></a>';
    storeBtns.innerHTML = btnsHTML;
  }
  const infoPanel = document.getElementById('work-info-panel');
  if (infoPanel) {
    const cr = proj.credits || {};
    let credHTML = '';
    if (cr.art_direction) credHTML += '<div class="credit-row"><span class="credit-label">Art Direction</span><span class="credit-value">' + cr.art_direction + '</span></div>';
    if (cr.concept_art) credHTML += '<div class="credit-row"><span class="credit-label">Concept Art</span><span class="credit-value">' + cr.concept_art + '</span></div>';
    if (cr.art_3d) credHTML += '<div class="credit-row"><span class="credit-label">3D Art</span><span class="credit-value">' + cr.art_3d + '</span></div>';
    infoPanel.innerHTML = '<div class="work-info-name">' + (proj.name || key) + '</div><div class="work-info-studio">' + (proj.studio || '') + (proj.year ? ' · ' + proj.year : '') + '</div>' + (credHTML ? '<div class="work-info-credits">' + credHTML + '</div>' : '') + (proj.about ? '<div class="work-info-about">' + proj.about + '</div>' : '');
  }
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

// NEW: Open a userProject as a work-detail page (reuses the same DOM)
function openUserWorkDetail(id) {
  const p = (siteDB.userProjects || []).find(x => x.id === id);
  if (!p) return;
  const titleEl = document.getElementById('work-detail-title');
  if (titleEl) titleEl.textContent = p.title || 'Project';
  const backTitle = document.getElementById('work-slider-back-title');
  if (backTitle) backTitle.textContent = p.category || 'Game Art';

  // Store buttons
  const storeBtns = document.getElementById('work-store-btns');
  if (storeBtns) {
    let btnsHTML = '';
    if (p.ios)     btnsHTML += '<a class="store-btn" href="' + p.ios + '" target="_blank"><i class="ti ti-brand-apple"></i><div class="store-btn-text"><span class="store-btn-label">Download on the</span><span class="store-btn-name">App Store</span></div></a>';
    if (p.android) btnsHTML += '<a class="store-btn" href="' + p.android + '" target="_blank"><i class="ti ti-brand-google-play"></i><div class="store-btn-text"><span class="store-btn-label">Get it on</span><span class="store-btn-name">Google Play</span></div></a>';
    storeBtns.innerHTML = btnsHTML;
  }

  // Info panel
  const infoPanel = document.getElementById('work-info-panel');
  if (infoPanel) {
    const cr = p.credits || {};
    let credHTML = '';
    if (cr['Art Direction']) credHTML += '<div class="credit-row"><span class="credit-label">Art Direction</span><span class="credit-value">' + cr['Art Direction'] + '</span></div>';
    if (cr['3D Artist'])     credHTML += '<div class="credit-row"><span class="credit-label">3D Artist</span><span class="credit-value">' + cr['3D Artist'] + '</span></div>';
    if (cr['UI Artist'])     credHTML += '<div class="credit-row"><span class="credit-label">UI Artist</span><span class="credit-value">' + cr['UI Artist'] + '</span></div>';
    if (cr['Other'])         credHTML += '<div class="credit-row"><span class="credit-label">Other</span><span class="credit-value">' + cr['Other'] + '</span></div>';
    const aboutText = (p.description || '').replace(/<[^>]*>/g, '').trim();
    const studioLine = (p.client || '') + (p.year ? ' · ' + p.year : '');
    infoPanel.innerHTML =
      '<div class="work-info-name">' + (p.title || '') + '</div>' +
      (studioLine ? '<div class="work-info-studio">' + studioLine + '</div>' : '') +
      (credHTML ? '<div class="work-info-credits">' + credHTML + '</div>' : '') +
      (aboutText ? '<div class="work-info-about">' + aboutText + '</div>' : '');
  }

  // Slides scroller = the project's media list
  const scrollEl = document.getElementById('work-slides-scroll');
  if (scrollEl) {
    const media = p.media || [];
    if (media.length === 0) {
      scrollEl.innerHTML = '<div class="work-slide-item"><div class="work-slide-ph"><i class="ti ti-photo"></i></div></div>';
    } else {
      scrollEl.innerHTML = media.map(m => {
        if ((m.type || '').startsWith('video')) {
          return '<div class="work-slide-item"><video src="' + m.url + '" controls style="width:100%;height:100%;object-fit:cover;"></video></div>';
        }
        return '<div class="work-slide-item"><img src="' + m.url + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></div>';
      }).join('');
    }
  }
  showPage('work-detail');
}

// Personal Works grid: 7 fixed slots + ANY userProjects with Personal Works category
function applyPersonal(personal, userProjects) {
  const grid = document.getElementById('personal-grid');
  if (!grid) return;
  grid.innerHTML = '';
  const colors = ['g1','g2','g3','g4','g5','g6'];
  let idx = 0;

  // 1) Existing personal slots
  for (const [key, proj] of Object.entries(personal || {})) {
    const div = document.createElement('div');
    div.className = 'game-item ' + colors[idx % colors.length];
    div.onclick = () => openPersonalDetail(key);
    const slides = proj.slides || [];
    let ih = '';
    if (slides.length > 0) {
      slides.slice(0, 4).forEach(s => { ih += '<div class="inner-cell"><img src="' + s.url + '" loading="lazy"></div>'; });
      for (let i = slides.length; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    } else {
      for (let i = 0; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    }
    div.innerHTML = '<div class="inner-grid">' + ih + '</div><div class="grid-overlay"><div class="grid-title">' + (proj.name || 'Personal Work') + '</div></div>';
    grid.appendChild(div);
    idx++;
  }

  // 2) NEW: userProjects with Personal Works category
  const personalUserProjects = (userProjects || []).filter(p =>
    p.status === 'published' && p.category === 'Personal Works'
  );
  personalUserProjects.forEach(p => {
    const div = document.createElement('div');
    div.className = 'game-item ' + colors[idx % colors.length];
    div.onclick = () => openUserPersonalDetail(p.id);
    const media = (p.media || []).filter(m => !((m.type || '').startsWith('video')));
    let ih = '';
    if (media.length > 0) {
      media.slice(0, 4).forEach(s => { ih += '<div class="inner-cell"><img src="' + s.url + '" loading="lazy"></div>'; });
      for (let i = media.length; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    } else {
      for (let i = 0; i < 4; i++) ih += '<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>';
    }
    div.innerHTML = '<div class="inner-grid">' + ih + '</div><div class="grid-overlay"><div class="grid-title">' + (p.title || 'Personal Work') + '</div></div>';
    grid.appendChild(div);
    idx++;
  });
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

// NEW: Open a userProject as personal-detail
function openUserPersonalDetail(id) {
  const p = (siteDB.userProjects || []).find(x => x.id === id);
  if (!p) return;
  const titleEl = document.getElementById('personal-detail-title');
  if (titleEl) titleEl.textContent = p.title || 'Personal Work';
  const scrollEl = document.getElementById('personal-slides-scroll');
  if (!scrollEl) return;
  const media = p.media || [];
  if (media.length === 0) {
    scrollEl.innerHTML = '<div class="work-slide-item"><div class="work-slide-ph"><i class="ti ti-photo"></i></div></div>';
  } else {
    scrollEl.innerHTML = media.map(m => {
      if ((m.type || '').startsWith('video')) {
        return '<div class="work-slide-item"><video src="' + m.url + '" controls style="width:100%;height:100%;object-fit:cover;"></video></div>';
      }
      return '<div class="work-slide-item"><img src="' + m.url + '" loading="lazy" style="width:100%;height:100%;object-fit:cover;"></div>';
    }).join('');
  }
  showPage('personal-detail');
}

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
