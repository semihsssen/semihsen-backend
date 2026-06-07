/* project-editor-history.js
 * Pure client-side memory for the project editor.
 * Saves form values to localStorage when a project is published/saved,
 * and offers them back as autocomplete suggestions + one-click profile fill.
 * Does NOT modify any existing logic — purely additive UI hooks.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'sse_pe_history_v1';
  var MAX_VALUES_PER_FIELD = 20;
  var MAX_PROFILES = 20;

  // Map: id -> human label (for the dropdown suggestion popup)
  var FIELDS = {
    'f-title':     'Title',
    'f-subtitle':  'Subtitle',
    'f-slug':      'Slug',
    'f-role':      'Role',
    'f-client':    'Client',
    'f-year':      'Year',
    'c-artdir':    'Art Direction',
    'c-3d':        '3D Artist',
    'c-ui':        'UI Artist',
    'c-other':     'Other',
    'f-ios':       'App Store URL',
    'f-android':   'Google Play URL',
    'f-category':  'Category',
    'f-pubdate':   'Publish Date',
    'f-seo-title': 'SEO Title',
    'f-seo-desc':  'SEO Description'
  };

  function loadStore() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { fieldValues: {}, profiles: [] };
      var parsed = JSON.parse(raw);
      if (!parsed.fieldValues) parsed.fieldValues = {};
      if (!Array.isArray(parsed.profiles)) parsed.profiles = [];
      return parsed;
    } catch (e) { return { fieldValues: {}, profiles: [] }; }
  }

  function saveStore(s) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch (e) { /* quota or private mode */ }
  }

  function uniqueUnshift(arr, val) {
    if (val == null || val === '') return arr;
    var s = String(val);
    var i = arr.indexOf(s);
    if (i >= 0) arr.splice(i, 1);
    arr.unshift(s);
    return arr.slice(0, MAX_VALUES_PER_FIELD);
  }

  function snapshotForm() {
    var snap = { savedAt: new Date().toISOString(), fields: {}, tags: [], software: [] };
    Object.keys(FIELDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) snap.fields[id] = el.value || '';
    });
    // Description rich text
    var desc = document.getElementById('f-desc');
    if (desc) snap.fields['f-desc'] = desc.innerHTML;
    // Tags (chips inside #tags-container)
    document.querySelectorAll('#tags-container .tag, #tags-container span, #tags-container div').forEach(function (chip) {
      var t = (chip.textContent || '').replace(/\s*[×x]\s*$/, '').trim();
      if (t && snap.tags.indexOf(t) === -1) snap.tags.push(t);
    });
    // Software (checked checkboxes/radios with names like software)
    document.querySelectorAll('#software-chips input:checked, #software-chips .selected').forEach(function (el) {
      var v = el.value || el.textContent.trim();
      if (v && snap.software.indexOf(v) === -1) snap.software.push(v);
    });
    // Featured/showOnHome
    var feat = document.getElementById('t-featured');
    var home = document.getElementById('t-homepage');
    if (feat) snap.featured = !!feat.checked;
    if (home) snap.showOnHome = !!home.checked;
    return snap;
  }

  function recordSubmit() {
    var store = loadStore();
    var snap = snapshotForm();
    // Field-by-field value memory
    Object.keys(snap.fields).forEach(function (id) {
      var v = snap.fields[id];
      if (v == null || v === '') return;
      if (id === 'f-desc') return; // skip raw HTML
      if (!store.fieldValues[id]) store.fieldValues[id] = [];
      store.fieldValues[id] = uniqueUnshift(store.fieldValues[id], v);
    });
    // Full profile (excluding title — title is per project, not reusable)
    var profileLabel = snap.fields['f-title'] || (snap.fields['f-client'] || 'Profile') + ' — ' + new Date().toLocaleDateString();
    var profile = {
      label: profileLabel,
      savedAt: snap.savedAt,
      fields: snap.fields,
      tags: snap.tags,
      software: snap.software,
      featured: snap.featured,
      showOnHome: snap.showOnHome
    };
    store.profiles.unshift(profile);
    store.profiles = store.profiles.slice(0, MAX_PROFILES);
    saveStore(store);
  }

  /* ---------- UI: dropdown suggestion per input ---------- */
  var activePopover = null;
  function closePopover() {
    if (activePopover && activePopover.parentNode) activePopover.parentNode.removeChild(activePopover);
    activePopover = null;
  }
  function showSuggestions(inputEl) {
    var id = inputEl.id;
    var store = loadStore();
    var values = (store.fieldValues[id] || []).filter(function (v) { return v && v !== inputEl.value; });
    if (!values.length) return;
    closePopover();
    var pop = document.createElement('div');
    pop.className = 'sse-pe-pop';
    pop.style.cssText = 'position:absolute;z-index:99999;background:#19181d;border:1px solid rgba(255,255,255,0.12);border-radius:6px;box-shadow:0 6px 24px rgba(0,0,0,0.5);max-height:240px;overflow-y:auto;min-width:220px;font-family:inherit;';
    var header = document.createElement('div');
    header.style.cssText = 'padding:6px 10px;font-size:10px;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;border-bottom:0.5px solid rgba(255,255,255,0.08);display:flex;justify-content:space-between;align-items:center;';
    header.innerHTML = '<span>Onceki degerler</span><span style="cursor:pointer;color:#888;font-size:12px;padding:0 4px;" title="Kapat">&times;</span>';
    header.querySelector('span:last-child').onclick = closePopover;
    pop.appendChild(header);
    values.forEach(function (val) {
      var row = document.createElement('div');
      row.style.cssText = 'padding:8px 12px;cursor:pointer;font-size:13px;color:#e4e4e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:380px;';
      row.title = val;
      row.textContent = val;
      row.onmouseover = function () { row.style.background = 'rgba(74,144,226,0.2)'; };
      row.onmouseout = function () { row.style.background = ''; };
      row.onclick = function () {
        if (inputEl.tagName === 'SELECT') inputEl.value = val;
        else {
          var setter = Object.getOwnPropertyDescriptor(window[inputEl.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype, 'value').set;
          setter.call(inputEl, val);
        }
        inputEl.dispatchEvent(new Event('input', { bubbles: true }));
        inputEl.dispatchEvent(new Event('change', { bubbles: true }));
        closePopover();
      };
      pop.appendChild(row);
    });
    // Position under input
    var r = inputEl.getBoundingClientRect();
    pop.style.left = (window.scrollX + r.left) + 'px';
    pop.style.top  = (window.scrollY + r.bottom + 4) + 'px';
    document.body.appendChild(pop);
    activePopover = pop;
  }

  /* ---------- UI: "Geçmiş Profil" button + modal ---------- */
  function fillFromProfile(p) {
    if (!p) return;
    Object.keys(FIELDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var v = p.fields[id];
      if (v == null) return;
      if (el.tagName === 'SELECT') el.value = v;
      else {
        var setter = Object.getOwnPropertyDescriptor(window[el.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype, 'value').set;
        setter.call(el, v);
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // Description
    var desc = document.getElementById('f-desc');
    if (desc && p.fields['f-desc']) {
      desc.innerHTML = p.fields['f-desc'];
      desc.dispatchEvent(new Event('input', { bubbles: true }));
    }
    // Featured/homepage toggles
    var feat = document.getElementById('t-featured');
    var home = document.getElementById('t-homepage');
    if (feat && p.featured != null) { feat.checked = !!p.featured; feat.dispatchEvent(new Event('change', { bubbles: true })); }
    if (home && p.showOnHome != null) { home.checked = !!p.showOnHome; home.dispatchEvent(new Event('change', { bubbles: true })); }
    // Tags — re-add via global addTag() if available
    if (Array.isArray(p.tags) && typeof window.addTag === 'function') {
      var inp = document.getElementById('tag-input');
      if (inp) {
        p.tags.forEach(function (t) { inp.value = t; window.addTag(); });
        inp.value = '';
      }
    }
  }

  function openProfilesModal() {
    var store = loadStore();
    var existing = document.getElementById('sse-pe-modal');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'sse-pe-modal';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:100000;display:flex;align-items:center;justify-content:center;';
    overlay.onclick = function (e) { if (e.target === overlay) overlay.remove(); };
    var box = document.createElement('div');
    box.style.cssText = 'background:#19181d;border:1px solid rgba(255,255,255,0.12);border-radius:10px;width:560px;max-width:92vw;max-height:80vh;display:flex;flex-direction:column;';
    var head = document.createElement('div');
    head.style.cssText = 'padding:16px 20px;border-bottom:0.5px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;';
    head.innerHTML = '<div><h3 style="font-size:14px;font-weight:700;color:#e4e4e7;letter-spacing:0.04em;margin:0;">Onceki Profillerden Doldur</h3><p style="font-size:11px;color:#71717a;margin:4px 0 0;">Tek tik ile tum form alanlarini onceki bir projenin bilgileriyle doldurur</p></div><span style="cursor:pointer;color:#a1a1aa;font-size:20px;padding:0 6px;" title="Kapat">&times;</span>';
    head.querySelector('span').onclick = function () { overlay.remove(); };
    box.appendChild(head);
    var body = document.createElement('div');
    body.style.cssText = 'flex:1;overflow-y:auto;padding:8px;';
    if (!store.profiles.length) {
      body.innerHTML = '<div style="padding:30px;text-align:center;color:#71717a;font-size:13px;">Henuz kayitli profil yok. Bir proje kaydet/publish et, otomatik olarak hatirla.</div>';
    } else {
      store.profiles.forEach(function (p, idx) {
        var row = document.createElement('div');
        row.style.cssText = 'padding:12px 14px;border-radius:6px;background:#0e0d11;border:0.5px solid rgba(255,255,255,0.06);margin-bottom:6px;cursor:pointer;transition:border-color 0.15s;';
        row.onmouseover = function () { row.style.borderColor = '#4a90e2'; };
        row.onmouseout  = function () { row.style.borderColor = 'rgba(255,255,255,0.06)'; };
        var date = '';
        try { date = new Date(p.savedAt).toLocaleDateString() + ' ' + new Date(p.savedAt).toLocaleTimeString().slice(0,5); } catch (e) {}
        row.innerHTML =
          '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">' +
            '<div style="flex:1;min-width:0;">' +
              '<div style="font-size:13px;font-weight:600;color:#e4e4e7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + (p.label || 'Profile') + '</div>' +
              '<div style="font-size:11px;color:#71717a;margin-top:2px;">' + date + (p.fields['f-category'] ? ' &middot; ' + p.fields['f-category'] : '') + '</div>' +
            '</div>' +
            '<button style="background:#4a90e2;color:#fff;border:0;padding:7px 14px;border-radius:5px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;" data-idx="' + idx + '">Doldur</button>' +
            '<button style="background:transparent;color:#ef4444;border:0.5px solid rgba(239,68,68,0.4);padding:7px 10px;border-radius:5px;font-size:11px;cursor:pointer;font-family:inherit;" data-del="' + idx + '">Sil</button>' +
          '</div>';
        body.appendChild(row);
      });
      body.addEventListener('click', function (e) {
        var fillIdx = e.target.getAttribute && e.target.getAttribute('data-idx');
        var delIdx  = e.target.getAttribute && e.target.getAttribute('data-del');
        if (fillIdx != null) {
          fillFromProfile(store.profiles[+fillIdx]);
          overlay.remove();
        } else if (delIdx != null) {
          var st = loadStore();
          st.profiles.splice(+delIdx, 1);
          saveStore(st);
          overlay.remove();
          openProfilesModal();
        }
      });
    }
    box.appendChild(body);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  /* ---------- Boot: wire up after page is ready ---------- */
  function boot() {
    // Add "Geçmiş Profil" button next to the existing Publish button
    var pubBtn = document.getElementById('publish-btn');
    if (pubBtn && !document.getElementById('sse-pe-history-btn')) {
      var btn = document.createElement('button');
      btn.id = 'sse-pe-history-btn';
      btn.type = 'button';
      btn.className = pubBtn.className.replace('btn-publish', 'btn-secondary');
      btn.style.cssText = (btn.style.cssText || '') + ';background:#3f3f46;color:#e4e4e7;border:0;padding:8px 14px;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;margin-right:6px;';
      btn.textContent = '↻ Onceki Profil';
      btn.title = 'Daha onceki proje bilgilerini kullan';
      btn.onclick = openProfilesModal;
      pubBtn.parentNode.insertBefore(btn, pubBtn);
    }

    // Attach suggestion popover to each known field
    Object.keys(FIELDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('focus', function () { showSuggestions(el); });
      // Re-show on click if same field
      el.addEventListener('click', function () { showSuggestions(el); });
    });

    // Close popover when clicking elsewhere
    document.addEventListener('mousedown', function (e) {
      if (!activePopover) return;
      if (activePopover.contains(e.target)) return;
      if (e.target.id && FIELDS.hasOwnProperty(e.target.id)) return;
      closePopover();
    });

    // Hook into Publish button → record snapshot AFTER user clicks
    if (pubBtn) {
      pubBtn.addEventListener('click', function () {
        // Record after a tick so the form is fully read
        setTimeout(recordSubmit, 600);
      });
    }
    // Also try to detect the "save" path on first input (autosave) — keep latest snapshot in storage on every blur
    Object.keys(FIELDS).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('blur', function () {
        // Don't record empty edits — only if title exists (treat as in-progress profile)
        var titleEl = document.getElementById('f-title');
        if (!titleEl || !titleEl.value.trim()) return;
        // Soft snapshot: update field memory only, no profile push
        var store = loadStore();
        var v = el.value || '';
        if (v) {
          if (!store.fieldValues[id]) store.fieldValues[id] = [];
          store.fieldValues[id] = uniqueUnshift(store.fieldValues[id], v);
          saveStore(store);
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
