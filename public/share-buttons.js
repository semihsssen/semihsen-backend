/* share-buttons.js v2
 * Adds Facebook / Pinterest / X / LinkedIn share buttons to project detail pages,
 * with proper deep-link URLs (/p/{id}) so LinkedIn/FB previews show the actual project.
 * PURE ADDITIVE — does not modify main.js, db.json, Cloudinary, or any uploaded data.
 */
(function () {
  'use strict';

  var SHARE_BAR_ID = 'sse-share-bar';
  var SITE_URL = 'https://www.semihsen.art';

  var STYLE = 'display:flex;gap:14px;align-items:center;padding:16px 0;margin-top:14px;border-top:0.5px solid rgba(255,255,255,0.08);flex-wrap:wrap;';
  var BTN = 'display:inline-flex;align-items:center;gap:6px;background:transparent;border:0;color:#9a9a95;font-family:inherit;font-size:12px;font-weight:600;cursor:pointer;padding:6px 4px;transition:color 0.15s;text-decoration:none;letter-spacing:0.02em;';
  var ICON = 'width:14px;height:14px;display:inline-block;';

  function svg(path, viewBox, fill) {
    return '<svg style="' + ICON + '" viewBox="' + (viewBox || '0 0 24 24') + '" fill="' + (fill || 'currentColor') + '"><path d="' + path + '"/></svg>';
  }
  var ICONS = {
    facebook:  svg('M22 12a10 10 0 1 0-11.56 9.88v-7H8v-2.88h2.44V9.8c0-2.41 1.44-3.75 3.64-3.75 1.06 0 2.16.19 2.16.19v2.37h-1.22c-1.2 0-1.57.75-1.57 1.51v1.82h2.68l-.43 2.88h-2.25v7A10 10 0 0 0 22 12Z'),
    pinterest: svg('M12.01 2C6.48 2 2 6.48 2 12c0 4.24 2.64 7.86 6.36 9.31-.09-.79-.17-2 .04-2.86.19-.78 1.22-4.94 1.22-4.94s-.31-.62-.31-1.54c0-1.45.84-2.53 1.88-2.53.89 0 1.32.67 1.32 1.47 0 .89-.57 2.22-.86 3.45-.25 1.04.52 1.88 1.54 1.88 1.85 0 3.27-1.95 3.27-4.76 0-2.49-1.79-4.23-4.34-4.23-2.96 0-4.7 2.22-4.7 4.51 0 .89.34 1.85.77 2.37.09.1.1.19.07.29-.08.32-.26 1.04-.29 1.19-.05.19-.15.24-.35.14-1.29-.6-2.09-2.48-2.09-3.99 0-3.24 2.36-6.22 6.79-6.22 3.57 0 6.34 2.54 6.34 5.94 0 3.54-2.24 6.4-5.34 6.4-1.04 0-2.02-.54-2.36-1.18l-.64 2.45c-.23.89-.86 2-1.28 2.68A10 10 0 0 0 22 12c0-5.52-4.48-10-9.99-10Z'),
    x:         svg('M18.244 2H21.6l-7.6 8.71L23 22h-6.94l-5.44-6.94L4.5 22H1.14l8.14-9.31L1 2h7.11l4.92 6.36L18.24 2Zm-1.22 18h1.86L7.06 4H5.1l11.92 16Z'),
    linkedin:  svg('M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14ZM8.34 18v-8H5.67v8h2.67Zm-1.34-9.13a1.55 1.55 0 1 0 0-3.1 1.55 1.55 0 0 0 0 3.1ZM18.34 18v-4.4c0-2.32-1.24-3.4-2.9-3.4-1.34 0-1.94.74-2.28 1.26v-1.08H10.5c.03.76 0 8 0 8h2.66V13.6c0-.24.02-.48.09-.65.19-.48.63-.98 1.36-.98.96 0 1.34.73 1.34 1.8V18h2.4Z')
  };
  var COLORS = { facebook: '#1877F2', pinterest: '#E60023', x: '#FFFFFF', linkedin: '#0A66C2' };

  /* ---- Track current userProject ID by wrapping openXxx functions ---- */
  window.__sseCurrentUserProjectId = null;
  function wrapOpeners() {
    ['openUserPersonalDetail', 'openUserWorkDetail'].forEach(function (fn) {
      var orig = window[fn];
      if (typeof orig !== 'function') return;
      if (orig.__sseWrapped) return;
      var wrapped = function (id) {
        window.__sseCurrentUserProjectId = id;
        return orig.apply(this, arguments);
      };
      wrapped.__sseWrapped = true;
      window[fn] = wrapped;
    });
    // For fixed game/personal (not userProject), clear the id so we know share should be homepage
    ['openWorkDetail', 'openPersonalDetail'].forEach(function (fn) {
      var orig = window[fn];
      if (typeof orig !== 'function') return;
      if (orig.__sseWrappedClear) return;
      var wrapped = function () {
        window.__sseCurrentUserProjectId = null;
        return orig.apply(this, arguments);
      };
      wrapped.__sseWrappedClear = true;
      window[fn] = wrapped;
    });
  }

  function getActiveProjectInfo() {
    var page = document.querySelector('#page-work-detail.active, #page-personal-detail.active');
    if (!page) return null;
    var title = '';
    var titleEl = page.querySelector('#work-detail-title, #personal-detail-title');
    if (titleEl) title = (titleEl.textContent || '').trim();
    var img = page.querySelector('.work-slides-scroll img, #work-slides-scroll img, #personal-slides-scroll img');
    var mediaUrl = img ? img.src : '';
    return { title: title, mediaUrl: mediaUrl, page: page, projectId: window.__sseCurrentUserProjectId };
  }

  function buildShareBar(info) {
    // If we have a userProject ID, share the deep-link URL (which serves proper OG tags)
    var url = info.projectId ? (SITE_URL + '/p/' + info.projectId) : SITE_URL;
    var text = info.title ? (info.title + ' — Semih Sen') : 'Semih Sen | Lead Game Artist';
    var encText = encodeURIComponent(text);
    var encUrl = encodeURIComponent(url);
    var encImg = encodeURIComponent(info.mediaUrl || '');
    var links = [
      { key: 'facebook',  label: 'Share', href: 'https://www.facebook.com/sharer/sharer.php?u=' + encUrl },
      { key: 'pinterest', label: 'Save',  href: 'https://pinterest.com/pin/create/button/?url=' + encUrl + '&media=' + encImg + '&description=' + encText },
      { key: 'x',         label: 'Share', href: 'https://twitter.com/intent/tweet?url=' + encUrl + '&text=' + encText },
      { key: 'linkedin',  label: 'Share', href: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encUrl }
    ];
    var bar = document.createElement('div');
    bar.id = SHARE_BAR_ID;
    bar.className = 'share-bar';
    bar.setAttribute('style', STYLE);
    links.forEach(function (l) {
      var a = document.createElement('a');
      a.href = l.href;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('style', BTN + 'color:' + COLORS[l.key] + ';');
      a.innerHTML = ICONS[l.key] + '<span>' + l.label + '</span>';
      a.title = l.key.charAt(0).toUpperCase() + l.key.slice(1) + '\'de paylaş';
      bar.appendChild(a);
    });
    return bar;
  }

  function insertShareBar() {
    var old = document.getElementById(SHARE_BAR_ID);
    if (old && old.parentNode) old.parentNode.removeChild(old);
    var info = getActiveProjectInfo();
    if (!info) return;
    var targetPanel =
      info.page.querySelector('.work-slider-right') ||
      info.page.querySelector('.work-info') ||
      info.page.querySelector('#work-info-panel') ||
      info.page.querySelector('.work-slider-page') ||
      info.page;
    var bar = buildShareBar(info);
    targetPanel.appendChild(bar);
  }

  function cleanupIfInactive() {
    var anyActive = document.querySelector('#page-work-detail.active, #page-personal-detail.active');
    var bar = document.getElementById(SHARE_BAR_ID);
    if (!anyActive && bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  var pending = null;
  function scheduleUpdate() {
    if (pending) return;
    pending = setTimeout(function () {
      pending = null;
      wrapOpeners(); // re-wrap in case main.js re-defined
      var info = getActiveProjectInfo();
      if (info) {
        var existing = document.getElementById(SHARE_BAR_ID);
        if (!existing) insertShareBar();
      } else {
        cleanupIfInactive();
      }
    }, 350);
  }

  /* ---- Deep-link support: if /p/:id served page with __initialProjectId, auto-open it ---- */
  function getSiteDB() {
    // main.js declares `let siteDB` at top level — with let this doesn't attach to window.
    // Try window first (in case someone changes to var later), else eval bare identifier.
    if (typeof window.siteDB !== 'undefined' && window.siteDB) return window.siteDB;
    try { return (0, eval)('typeof siteDB !== "undefined" ? siteDB : null'); } catch (e) { return null; }
  }
  function tryOpenInitial() {
    var id = window.__initialProjectId;
    if (!id) return;
    var attempts = 0;
    var iv = setInterval(function () {
      attempts++;
      if (attempts > 60) { clearInterval(iv); return; } // 30s max
      var db = getSiteDB();
      if (!db || !Array.isArray(db.userProjects)) return;
      var proj = db.userProjects.find(function (p) { return p.id === id; });
      if (!proj) { clearInterval(iv); return; }
      wrapOpeners();
      clearInterval(iv);
      if (proj.category === 'Personal Works' && typeof window.openUserPersonalDetail === 'function') {
        window.openUserPersonalDetail(id);
      } else if (typeof window.openUserWorkDetail === 'function') {
        window.openUserWorkDetail(id);
      }
      window.__initialProjectId = null;
    }, 400);
  }

  function boot() {
    wrapOpeners();
    var observer = new MutationObserver(function () { scheduleUpdate(); });
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'], childList: true });
    scheduleUpdate();
    document.addEventListener('click', function () { setTimeout(scheduleUpdate, 400); }, true);
    tryOpenInitial();
    var cnt = 0;
    var reWrap = setInterval(function () { wrapOpeners(); if (++cnt > 10) clearInterval(reWrap); }, 500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
ing') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
