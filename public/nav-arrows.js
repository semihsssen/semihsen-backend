/* nav-arrows.js
 * Prev/Next navigation arrows on project detail pages.
 * PURE ADDITIVE — reads DOM/siteDB only; injects two fixed-position arrow buttons.
 * Works for both userProjects (Personal Works) and fixed-game work slides.
 */
(function () {
  'use strict';

  var LEFT_ID = 'sse-nav-prev';
  var RIGHT_ID = 'sse-nav-next';

  var ARROW_STYLE = 'position:fixed;top:50%;transform:translateY(-50%);z-index:9998;width:56px;height:96px;display:flex;align-items:center;justify-content:center;background:transparent;border:0;padding:0;color:#e6e6e6;cursor:pointer;text-decoration:none;font-family:inherit;line-height:1;opacity:0.75;transition:opacity 0.18s, transform 0.18s, color 0.18s;user-select:none;outline:none;';
  var CHEV_LEFT  = '<svg width="40" height="72" viewBox="0 0 24 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M17 4L5 22l12 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var CHEV_RIGHT = '<svg width="40" height="72" viewBox="0 0 24 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7 4l12 18L7 40" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function getSiteDB() {
    if (typeof window.siteDB !== 'undefined' && window.siteDB) return window.siteDB;
    try { return (0, eval)('typeof siteDB !== "undefined" ? siteDB : null'); } catch (e) { return null; }
  }

  function makeArrow(id, symbol, alignRight, onClick, title) {
    var a = document.createElement('button');
    a.id = id;
    a.type = 'button';
    a.setAttribute('aria-label', title);
    a.title = title;
    a.setAttribute('style', ARROW_STYLE + (alignRight ? 'right:22px;' : 'left:22px;'));
    a.innerHTML = symbol;
    a.onmouseover = function () { a.style.opacity = '1'; a.style.color = '#4a90e2'; a.style.transform = 'translateY(-50%) scale(1.08)'; };
    a.onmouseout  = function () { a.style.opacity = '0.75'; a.style.color = '#e6e6e6'; a.style.transform = 'translateY(-50%)'; };
    a.onclick = function (e) { e.preventDefault(); onClick(); };
    return a;
  }

  function removeArrows() {
    ['#' + LEFT_ID, '#' + RIGHT_ID].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });
  }

  function scrollToTopSmooth() { window.scrollTo({ top: 0, behavior: 'smooth' }); }

  function getUserProjectNeighbors(currentId) {
    var db = getSiteDB();
    if (!db || !Array.isArray(db.userProjects)) return null;
    var currentIdx = db.userProjects.findIndex(function (p) { return p.id === currentId; });
    if (currentIdx < 0) return null;
    var cat = db.userProjects[currentIdx].category;
    // Filter siblings in same category & published
    var siblings = db.userProjects.filter(function (p) {
      return p.category === cat && p.status === 'published';
    });
    var pos = siblings.findIndex(function (p) { return p.id === currentId; });
    if (pos < 0) return null;
    var prev = pos > 0 ? siblings[pos - 1] : null;
    var next = pos < siblings.length - 1 ? siblings[pos + 1] : null;
    return { cat: cat, prev: prev, next: next };
  }

  function getFixedWorkNeighbors() {
    // We're on page-work-detail without a userProject id — must be a fixed-game work.
    // Find the current work's index within its game via currentGameKey global.
    var db = getSiteDB();
    var key = window.currentGameKey;
    if (!db || !key || !db.projects || !db.projects[key]) return null;
    var proj = db.projects[key];
    var works = proj.works || [];
    if (!works.length) return null;
    // Find current work by comparing slide URLs (best available signal)
    var scroll = document.getElementById('work-slides-scroll');
    if (!scroll) return null;
    var firstImg = scroll.querySelector('img');
    var currentSlideUrl = firstImg ? firstImg.src : null;
    var currentIdx = -1;
    works.forEach(function (w, i) {
      if (currentIdx >= 0) return;
      var slides = w.slides || [];
      if (slides.some(function (s) { return s.url === currentSlideUrl; })) currentIdx = i;
    });
    if (currentIdx < 0) return null;
    return {
      key: key,
      prevIdx: currentIdx > 0 ? currentIdx - 1 : null,
      nextIdx: currentIdx < works.length - 1 ? currentIdx + 1 : null
    };
  }

  function navigateToUserProject(p) {
    if (!p) return;
    var openFn = (p.category === 'Personal Works') ? window.openUserPersonalDetail : window.openUserWorkDetail;
    if (typeof openFn === 'function') {
      openFn(p.id);
      scrollToTopSmooth();
    }
  }

  function navigateToFixedWork(key, wi) {
    if (typeof window.openWorkDetail === 'function') {
      window.openWorkDetail(key, wi);
      scrollToTopSmooth();
    }
  }

  function updateArrows() {
    removeArrows();

    var wd = document.getElementById('page-work-detail');
    var pd = document.getElementById('page-personal-detail');
    var isWorkDetail = wd && wd.classList.contains('active');
    var isPersonalDetail = pd && pd.classList.contains('active');
    if (!isWorkDetail && !isPersonalDetail) return;

    // Prefer userProject navigation if we have a tracked userProject ID
    var currentUserId = window.__sseCurrentUserProjectId;
    var neighbors = null;
    var mode = null;

    if (currentUserId) {
      neighbors = getUserProjectNeighbors(currentUserId);
      mode = 'user';
    }
    if (!neighbors && isWorkDetail) {
      var fx = getFixedWorkNeighbors();
      if (fx) { neighbors = fx; mode = 'fixed'; }
    }
    if (!neighbors) return;

    var symLeft  = CHEV_LEFT;
    var symRight = CHEV_RIGHT;

    if (mode === 'user') {
      if (neighbors.prev) {
        document.body.appendChild(makeArrow(LEFT_ID, symLeft, false, function () { navigateToUserProject(neighbors.prev); }, 'Onceki: ' + (neighbors.prev.title || 'Proje')));
      }
      if (neighbors.next) {
        document.body.appendChild(makeArrow(RIGHT_ID, symRight, true, function () { navigateToUserProject(neighbors.next); }, 'Sonraki: ' + (neighbors.next.title || 'Proje')));
      }
    } else if (mode === 'fixed') {
      if (neighbors.prevIdx !== null) {
        document.body.appendChild(makeArrow(LEFT_ID, symLeft, false, function () { navigateToFixedWork(neighbors.key, neighbors.prevIdx); }, 'Onceki'));
      }
      if (neighbors.nextIdx !== null) {
        document.body.appendChild(makeArrow(RIGHT_ID, symRight, true, function () { navigateToFixedWork(neighbors.key, neighbors.nextIdx); }, 'Sonraki'));
      }
    }
  }

  // Keyboard shortcuts: left/right arrows
  function onKey(e) {
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    if (e.key === 'ArrowLeft') {
      var l = document.getElementById(LEFT_ID);
      if (l) l.click();
    } else if (e.key === 'ArrowRight') {
      var r = document.getElementById(RIGHT_ID);
      if (r) r.click();
    }
  }

  var pending = null;
  function schedule() {
    if (pending) return;
    pending = setTimeout(function () { pending = null; updateArrows(); }, 400);
  }

  function boot() {
    var mo = new MutationObserver(schedule);
    mo.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'], childList: true });
    document.addEventListener('click', function () { setTimeout(schedule, 500); }, true);
    document.addEventListener('keydown', onKey);
    schedule();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
