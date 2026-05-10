// Slider index per work
const sliderIndex = {};

// Global data
let siteDB = null;

async function loadSiteData() {
    try {
          const r = await fetch('/api/data');
          siteDB = await r.json();
          applySettings(siteDB.settings);
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
    const root = document.documentElement.style;
    if (s.nav_height) root.setProperty('--nav-height', s.nav_height);
    if (s.nav_logo_size) root.setProperty('--nav-logo-size', s.nav_logo_size);
    if (s.nav_sub_size) root.setProperty('--nav-sub-size', s.nav_sub_size);
    if (s.nav_link_size) root.setProperty('--nav-link-size', s.nav_link_size);
    if (s.hero_height) root.setProperty('--hero-height', s.hero_height);
    if (s.thumb_height) root.setProperty('--thumb-height', s.thumb_height);
}

function applyHero(hero) {
    if (!hero || !hero.url) return;
    const el = document.getElementById('hero-img');
    if (!el) return;
    el.style.backgroundImage = `url(${hero.url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    const ph = el.querySelector('.hero-ph-label');
    if (ph) ph.style.display = 'none';
}

function applyResume(resume) {
    if (!resume || !resume.url) return;
    const el = document.getElementById('resume-img');
    if (!el) return;
    el.style.backgroundImage = `url(${resume.url})`;
    el.style.backgroundSize = 'cover';
    el.style.backgroundPosition = 'center';
    const ph = el.querySelector('.resume-img-ph');
    if (ph) ph.style.display = 'none';
}

// Game Art izgara: her oyun icin tek kapak gorseli + isim
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
          div.innerHTML = `
                <div class="game-cover-img" style="${coverUrl ? 'background-image:url(' + coverUrl + ');background-size:cover;background-position:center;' : ''}">
                        ${!coverUrl ? '<div class="cover-ph"><i class="ti ti-photo"></i></div>' : ''}
                              </div>
                                    <div class="game-cover-label">${proj.name || key}</div>
                                        `;
          grid.appendChild(div);
    }
}

// Oyun detay sayfasi: o oyunun isleri izgara halinde
function openGameDetail(key) {
    if (!siteDB || !siteDB.projects[key]) return;
    const proj = siteDB.projects[key];
    currentGameKey = key;

  // Header
  const titleEl = document.getElementById('game-detail-title');
    if (titleEl) titleEl.textContent = proj.name || key;
    const backBtn = document.getElementById('game-detail-back');
    if (backBtn) backBtn.onclick = () => showPage('game');

  // Works izgara
  const worksGrid = document.getElementById('game-works-grid');
    if (!worksGrid) return;
    worksGrid.innerHTML = '';

  if (!proj.works || proj.works.length === 0) {
        worksGrid.innerHTML = '<div class="works-empty">Henuz is eklenmemis</div>';
  } else {
        proj.works.forEach((work, wi) => {
                const thumbUrl = work.thumbnail && work.thumbnail.url ? work.thumbnail.url : '';
                const div = document.createElement('div');
                div.className = 'work-thumb-item';
                div.onclick = () => openWorkSlider(key, wi);
                div.innerHTML = `
                        <div class="work-thumb-img" style="${thumbUrl ? 'background-image:url(' + thumbUrl + ');background-size:cover;background-position:center;' : ''}">
                                  ${!thumbUrl ? '<div class="cover-ph"><i class="ti ti-photo"></i></div>' : ''}
                                          </div>
                                                  <div class="work-thumb-label">${work.name || ('Work ' + (wi + 1))}</div>
                                                        `;
                worksGrid.appendChild(div);
        });
  }

  showPage('game-detail');
}

let currentGameKey = null;
let currentWorkIndex = null;

// Work slider acma
function openWorkSlider(key, wi) {
    const proj = siteDB && siteDB.projects[key];
    if (!proj || !proj.works[wi]) return;
    currentGameKey = key;
    currentWorkIndex = wi;
    const work = proj.works[wi];
    const sliderEl = document.getElementById('work-slider');
    const dotsEl = document.getElementById('work-slider-dots');
    const titleEl = document.getElementById('work-slider-title');

  if (titleEl) titleEl.textContent = work.name || ('Work ' + (wi + 1));

  const slides = work.slides || [];
    const slKey = key + '-' + wi;
    sliderIndex[slKey] = 0;

  if (sliderEl) {
        if (slides.length > 0) {
                sliderEl.innerHTML = slides.map(s =>
                          `<div class="detail-slide"><img src="${s.url}" alt="" loading="lazy"></div>`
                                                      ).join('');
                sliderEl.style.transform = 'translateX(0%)';
        } else {
                sliderEl.innerHTML = '<div class="detail-slide slide-empty"><i class="ti ti-photo"></i><span>Gorsel yok</span></div>';
        }
  }

  if (dotsEl) {
        dotsEl.innerHTML = slides.map((_,i) =>
                `<div class="slider-dot ${i===0?'active':''}" onclick="goWorkSlide(${i})"></div>`
                                          ).join('');
  }

  showPage('work-detail');
}

function slideWork(dir) {
    if (currentGameKey === null || currentWorkIndex === null) return;
    const slKey = currentGameKey + '-' + currentWorkIndex;
    const s = document.getElementById('work-slider');
    const d = document.getElementById('work-slider-dots');
    if (!s) return;
    const c = s.children.length;
    sliderIndex[slKey] = ((sliderIndex[slKey] || 0) + dir + c) % c;
    s.style.transform = `translateX(-${sliderIndex[slKey] * 100}%)`;
    if (d) d.querySelectorAll('.slider-dot').forEach((x, i) => x.classList.toggle('active', i === sliderIndex[slKey]));
}

function goWorkSlide(idx) {
    if (currentGameKey === null || currentWorkIndex === null) return;
    const slKey = currentGameKey + '-' + currentWorkIndex;
    sliderIndex[slKey] = idx;
    const s = document.getElementById('work-slider');
    const d = document.getElementById('work-slider-dots');
    if (!s) return;
    s.style.transform = `translateX(-${idx * 100}%)`;
    if (d) d.querySelectorAll('.slider-dot').forEach((x, i) => x.classList.toggle('active', i === idx));
}

function applyPersonal(personal) {
    if (!personal) return;
    for (const [num, proj] of Object.entries(personal)) {
          const slider = document.getElementById(`slider-personal${num}`);
          if (slider && proj.slides && proj.slides.length > 0) {
                  slider.innerHTML = proj.slides.map(s =>
                            `<div class="detail-slide"><img src="${s.url}" alt="" loading="lazy"></div>`
                                                           ).join('');
                  const dots = document.getElementById(`dots-personal${num}`);
                  if (dots) {
                            dots.innerHTML = proj.slides.map((_,i) =>
                                        `<div class="slider-dot ${i===0?'active':''}" onclick="goSlide('personal${num}',${i})"></div>`
                                                                     ).join('');
                  }
          }
          if (proj.name) {
                  const nameEl = document.querySelector(`#detail-personal${num} .detail-proj-name`);
                  if (nameEl) nameEl.textContent = proj.name;
          }
          if (proj.about) {
                  const descEl = document.querySelector(`#detail-personal${num} .detail-desc`);
                  if (descEl) descEl.textContent = proj.about;
          }
    }
}

// Navigasyon
function showPage(id) {
    document.querySelectorAll('.page, .detail-page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));

  const m = { home:'nav-home', portfolio:'nav-portfolio', game:'nav-portfolio', 'game-detail':'nav-portfolio', 'work-detail':'nav-portfolio', personal:'nav-portfolio', resume:'nav-resume' };
    if (m[id]) {
          const navEl = document.getElementById(m[id]);
          if (navEl) navEl.classList.add('active');
    }

  const el = document.getElementById('page-' + id) || document.getElementById('detail-' + id);
    if (el) el.classList.add('active');
    window.scrollTo(0,0);
}

function openDetail(key) {
    showPage('game-detail');
}

function closeDetail(back) { showPage(back); }

// Personal slider (eski sistem)
function slide(key, dir) {
    const s = document.getElementById('slider-' + key);
    const d = document.getElementById('dots-' + key);
    if (!s) return;
    const c = s.children.length;
    sliderIndex[key] = ((sliderIndex[key] || 0) + dir + c) % c;
    s.style.transform = `translateX(-${sliderIndex[key] * 100}%)`;
    if (d) d.querySelectorAll('.slider-dot').forEach((x,i) => x.classList.toggle('active', i === sliderIndex[key]));
}

function goSlide(key, idx) {
    sliderIndex[key] = idx;
    const s = document.getElementById('slider-' + key);
    const d = document.getElementById('dots-' + key);
    if (!s) return;
    s.style.transform = `translateX(-${idx * 100}%)`;
    if (d) d.querySelectorAll('.slider-dot').forEach((x,i) => x.classList.toggle('active', i === idx));
}

document.addEventListener('keydown', function(e) {
    const activePage = document.querySelector('.page.active, .detail-page.active');
    if (!activePage) return;
    const pageId = activePage.id;

                            if (pageId === 'page-work-detail') {
                                  if (e.key === 'ArrowLeft') slideWork(-1);
                                  if (e.key === 'ArrowRight') slideWork(1);
                                  if (e.key === 'Escape') showPage('game-detail');
                                  return;
                            }

                            const activeDetail = document.querySelector('.detail-page.active');
    if (!activeDetail) return;
    const key = activeDetail.id.replace('detail-', '');
    if (e.key === 'ArrowLeft') slide(key, -1);
    if (e.key === 'ArrowRight') slide(key, 1);
    if (e.key === 'Escape') { const b = activeDetail.querySelector('.port-back'); if (b) b.click(); }
});

loadSiteData();
