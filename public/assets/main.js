const sliderIndex = {};

// API'den veri çek ve siteyi güncelle
async function loadSiteData() {
  try {
    const r = await fetch('/api/data');
    const db = await r.json();
    applySettings(db.settings);
    applyHero(db.hero);
    applyResume(db.resume);
    applyProjects(db.projects);
    applyPersonal(db.personal);
  } catch(e) {
    console.log('API bağlantısı yok, statik mod.');
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
  el.innerHTML = `<img src="${resume.url}" style="width:100%;height:100%;object-fit:cover;">`;
}

function applyProjects(projects) {
  if (!projects) return;
  for (const [key, proj] of Object.entries(projects)) {
    // Slider
    const slider = document.getElementById(`slider-${key}`);
    if (slider && proj.slides && proj.slides.length > 0) {
      slider.innerHTML = proj.slides.map(s => 
        `<div class="detail-slide"><img src="${s.url}" alt="" loading="lazy"></div>`
      ).join('');
      // Dots güncelle
      const dots = document.getElementById(`dots-${key}`);
      if (dots) {
        dots.innerHTML = proj.slides.map((_, i) =>
          `<div class="slider-dot ${i===0?'active':''}" onclick="goSlide('${key}',${i})"></div>`
        ).join('');
      }
    }
    // Grid
    const grid = document.getElementById(`grid-${key}`);
    if (grid && proj.grid && proj.grid.length > 0) {
      const cells = [];
      for (let i = 0; i < 4; i++) {
        if (proj.grid[i]) {
          cells.push(`<div class="inner-cell"><img src="${proj.grid[i].url}" alt="" loading="lazy"></div>`);
        } else {
          cells.push(`<div class="inner-cell inner-cell-ph"><i class="ti ti-photo"></i></div>`);
        }
      }
      grid.innerHTML = cells.join('');
    }
    // Info
    if (proj.name) {
      const nameEl = document.querySelector(`#detail-${key} .detail-proj-name`);
      if (nameEl) nameEl.textContent = proj.name;
    }
    if (proj.about) {
      const descEl = document.querySelector(`#detail-${key} .detail-desc`);
      if (descEl) descEl.textContent = proj.about;
    }
    if (proj.credits) {
      const creditEl = document.querySelector(`#detail-${key} .credit-item`);
      if (creditEl && proj.credits.art_direction) creditEl.textContent = proj.credits.art_direction;
    }
    // Store links
    if (proj.ios) {
      const iosEl = document.querySelector(`#detail-${key} .store-btn[data-store="ios"]`);
      if (iosEl) iosEl.href = proj.ios;
    }
    if (proj.android) {
      const andEl = document.querySelector(`#detail-${key} .store-btn[data-store="android"]`);
      if (andEl) andEl.href = proj.android;
    }
  }
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
  const el = document.getElementById('page-' + id);
  if (el) el.classList.add('active');
  const m = { home:'nav-home', portfolio:'nav-portfolio', game:'nav-portfolio', personal:'nav-portfolio', resume:'nav-resume' };
  if (m[id]) document.getElementById(m[id]).classList.add('active');
  window.scrollTo(0,0);
}

function openDetail(key) {
  document.querySelectorAll('.page, .detail-page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
  document.getElementById('detail-' + key).classList.add('active');
  document.getElementById('nav-portfolio').classList.add('active');
  window.scrollTo(0,0);
}

function closeDetail(back) { showPage(back); }

function slide(key, dir) {
  const s = document.getElementById('slider-' + key);
  const d = document.getElementById('dots-' + key);
  const c = s.children.length;
  sliderIndex[key] = ((sliderIndex[key] || 0) + dir + c) % c;
  s.style.transform = 'translateX(-' + (sliderIndex[key] * 100) + '%)';
  d.querySelectorAll('.slider-dot').forEach((x,i) => x.classList.toggle('active', i === sliderIndex[key]));
}

function goSlide(key, idx) {
  const s = document.getElementById('slider-' + key);
  const d = document.getElementById('dots-' + key);
  sliderIndex[key] = idx;
  s.style.transform = 'translateX(-' + (idx * 100) + '%)';
  d.querySelectorAll('.slider-dot').forEach((x,i) => x.classList.toggle('active', i === idx));
}

document.addEventListener('keydown', function(e) {
  const activeDetail = document.querySelector('.detail-page.active');
  if (!activeDetail) return;
  const key = activeDetail.id.replace('detail-', '');
  if (e.key === 'ArrowLeft') slide(key, -1);
  if (e.key === 'ArrowRight') slide(key, 1);
  if (e.key === 'Escape') { const b = activeDetail.querySelector('.port-back'); if (b) b.click(); }
});

// Sayfa yüklenince veriyi çek
loadSiteData();
