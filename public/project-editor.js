(function () {
  'use strict';
  var STATE = { id: null, project: null, dirty: false, autosaveTimer: null, tags: [], software: [], media: [] };
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function getPwd() { return 'semih2024'; }
  function authHeader() { return 'Basic ' + btoa('semih:' + getPwd()); }
  function slugify(s) {
    return String(s || '').toLowerCase().trim()
      .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
  function toast(msg) {
    var t = $('toast'); if (!t) return;
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(toast._t);
    toast._t = setTimeout(function () { t.style.opacity = '0'; }, 2400);
  }
  function setStatusEl(text) { var el = $('autosave-status'); if (el) el.textContent = text; }

  async function init() {
    var params = new URLSearchParams(location.search);
    STATE.id = params.get('id');
    var pubDate = $('f-pubdate'); if (pubDate) pubDate.value = new Date().toISOString().slice(0, 10);
    if (STATE.id) {
      try {
        var r = await fetch('/api/projects/' + encodeURIComponent(STATE.id));
        if (!r.ok) throw new Error('Project not found');
        STATE.project = await r.json();
        populate();
      } catch (e) { toast('Proje yuklenemedi'); console.error(e); }
    } else {
      STATE.project = blankProject();
    }
    validate();
  }
  function blankProject() {
    return { id: null, title: '', subtitle: '', slug: '', role: '', client: '', year: new Date().getFullYear(),
      description: '', credits: {}, category: '', tags: [], software: [], ios: '', android: '',
      publishDate: new Date().toISOString().slice(0, 10), metaTitle: '', metaDesc: '',
      status: 'draft', featured: false, showOnHome: false, cover: null, media: [] };
  }
  function populate() {
    var p = STATE.project; if (!p) return;
    $('page-title').textContent = p.title || 'New Project';
    $('f-title').value = p.title || '';
    $('f-subtitle').value = p.subtitle || '';
    $('f-slug').value = p.slug || '';
    $('f-role').value = p.role || '';
    $('f-client').value = p.client || '';
    $('f-year').value = p.year || '';
    $('f-desc').innerHTML = p.description || '';
    $('f-ios').value = p.ios || '';
    $('f-android').value = p.android || '';
    $('f-category').value = p.category || '';
    $('f-pubdate').value = p.publishDate || '';
    $('f-seo-title').value = p.metaTitle || '';
    $('f-seo-desc').value = p.metaDesc || '';
    var cr = p.credits || {};
    $('c-artdir').value = cr['Art Direction'] || '';
    $('c-3d').value = cr['3D Artist'] || '';
    $('c-ui').value = cr['UI Artist'] || '';
    $('c-other').value = cr['Other'] || '';
    $('t-featured').checked = !!p.featured;
    $('t-homepage').checked = !!p.showOnHome;
    var st = p.status || 'draft';
    var r = document.querySelector('input[name="pub-status"][value="' + st + '"]');
    if (r) r.checked = true;
    STATE.tags = (p.tags || []).slice();
    STATE.software = (p.software || []).slice();
    STATE.media = (p.media || []).slice();
    renderTags(); renderSoftware(); renderMedia();
    onSEOTitle(); onSEODesc();
  }
  function gatherFormData() {
    return {
      title: $('f-title').value.trim(),
      subtitle: $('f-subtitle').value.trim(),
      slug: $('f-slug').value.trim() || slugify($('f-title').value),
      role: $('f-role').value.trim(), client: $('f-client').value.trim(), year: $('f-year').value.trim(),
      description: $('f-desc').innerHTML,
      ios: $('f-ios').value.trim(), android: $('f-android').value.trim(),
      category: $('f-category').value, publishDate: $('f-pubdate').value,
      metaTitle: $('f-seo-title').value, metaDesc: $('f-seo-desc').value,
      status: (document.querySelector('input[name="pub-status"]:checked') || {}).value || 'draft',
      featured: $('t-featured').checked, showOnHome: $('t-homepage').checked,
      tags: STATE.tags.slice(), software: STATE.software.slice(),
      credits: { 'Art Direction': $('c-artdir').value.trim(), '3D Artist': $('c-3d').value.trim(), 'UI Artist': $('c-ui').value.trim(), 'Other': $('c-other').value.trim() }
    };
  }
  function markDirty() {
    STATE.dirty = true;
    setStatusEl('Unsaved changes');
    clearTimeout(STATE.autosaveTimer);
    STATE.autosaveTimer = setTimeout(autoSave, 1500);
  }
  async function autoSave() {
    var data = gatherFormData();
    if (!data.title) { setStatusEl('Unsaved changes'); return; }
    try { await persistProject(data); setStatusEl('✓ All changes saved'); STATE.dirty = false; }
    catch (e) { setStatusEl('Save failed'); }
  }
  async function persistProject(data) {
    if (!STATE.id) {
      var r = await fetch('/api/projects', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': authHeader() }, body: JSON.stringify(data) });
      var d = await r.json();
      if (!d.ok) throw new Error(d.error || 'Save failed');
      STATE.id = d.id; STATE.project = d.project;
      history.replaceState(null, '', '?id=' + encodeURIComponent(STATE.id));
    } else {
      var r2 = await fetch('/api/projects/' + encodeURIComponent(STATE.id), { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': authHeader() }, body: JSON.stringify(data) });
      var d2 = await r2.json();
      if (!d2.ok) throw new Error(d2.error || 'Save failed');
      STATE.project = d2.project;
    }
  }
  window.saveDraft = async function () {
    setStatus('draft');
    var radio = document.querySelector('input[name="pub-status"][value="draft"]'); if (radio) radio.checked = true;
    var data = gatherFormData();
    if (!data.title) { toast('Baslik gerekli'); return; }
    try { await persistProject(data); toast('Draft kaydedildi'); setStatusEl('✓ All changes saved');
      var b = $('save-banner'); if (b) { b.style.display = 'block'; setTimeout(function () { b.style.display = 'none'; }, 3000); }
    } catch (e) { toast('Kaydetme hatasi: ' + e.message); }
  };
  window.publish = async function () {
    if ($('publish-btn').disabled) return;
    setStatus('published');
    var radio = document.querySelector('input[name="pub-status"][value="published"]'); if (radio) radio.checked = true;
    var data = gatherFormData();
    if (!data.title || !data.category) { toast('Baslik ve kategori gerekli'); return; }
    try { await persistProject(data); toast('Yayinlandi!'); setStatusEl('✓ All changes saved');
      var b = $('save-banner'); if (b) { b.style.display = 'block'; setTimeout(function () { b.style.display = 'none'; }, 4000); }
    } catch (e) { toast('Yayinlama hatasi: ' + e.message); }
  };
  window.onTitleInput = function () {
    var t = $('f-title').value.trim();
    $('page-title').textContent = t || 'New Project';
    if (!STATE.project) STATE.project = blankProject();
    if (!STATE.project._slugTouched) { $('f-slug').value = slugify(t); }
    validate(); markDirty();
  };
  window.onSlugInput = function () {
    var s = slugify($('f-slug').value); $('f-slug').value = s;
    if (STATE.project) STATE.project._slugTouched = true;
    markDirty();
  };
  window.onFieldInput = function () { validate(); markDirty(); };
  window.setStatus = function (s) { if (STATE.project) STATE.project.status = s; markDirty(); };

  function validate() {
    var title = $('f-title').value.trim();
    var hasTitle = title.length > 0;
    var hasCat = $('f-category').value !== '';
    var desc = ($('f-desc').innerText || '').trim();
    var hasDesc = desc.length > 4;
    var hasCover = !!(STATE.project && ((STATE.project.cover && STATE.project.cover.url) || (STATE.media[0] && STATE.media[0].url)));
    setVal('v-title', hasTitle); setVal('v-cover', hasCover); setVal('v-cat', hasCat); setVal('v-desc', hasDesc);
    var btn = $('publish-btn'); if (btn) btn.disabled = !(hasTitle && hasCover && hasCat && hasDesc);
  }
  function setVal(id, pass) {
    var el = $(id); if (!el) return;
    el.className = 'val-row' + (pass ? ' ok' : '');
    var icon = el.querySelector('.val-icon');
    if (icon) { icon.className = 'val-icon ' + (pass ? 'ok' : 'fail'); icon.textContent = pass ? '✓' : '•'; }
  }
  window.fmt = function (cmd) { document.execCommand(cmd); $('f-desc').focus(); onFieldInput(); };
  window.fmtBlock = function (tag) { document.execCommand('formatBlock', false, tag); $('f-desc').focus(); onFieldInput(); };
  window.addTag = function () {
    var inp = $('tag-input'); var v = inp.value.trim().replace(/,$/, '');
    if (!v) return;
    if (STATE.tags.indexOf(v) < 0) STATE.tags.push(v);
    inp.value = ''; renderTags(); markDirty();
  };
  window.onTagKey = function (e) {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }
    else if (e.key === 'Backspace' && !$('tag-input').value && STATE.tags.length) { STATE.tags.pop(); renderTags(); markDirty(); }
  };
  function renderTags() {
    var c = $('tags-container'); c.innerHTML = '';
    STATE.tags.forEach(function (t, i) {
      var sp = document.createElement('span'); sp.className = 'tag active'; sp.textContent = t;
      var btn = document.createElement('button');
      btn.type = 'button'; btn.style.cssText = 'background:none;border:0;color:#71717a;cursor:pointer;font-size:11px;padding:0 2px;';
      btn.textContent = '×';
      btn.onclick = function () { STATE.tags.splice(i, 1); renderTags(); markDirty(); };
      sp.appendChild(btn); c.appendChild(sp);
    });
  }
  window.toggleSoftware = function (el, name) {
    el.classList.toggle('active');
    var i = STATE.software.indexOf(name);
    if (i < 0) STATE.software.push(name); else STATE.software.splice(i, 1);
    markDirty();
  };
  function renderSoftware() {
    var chips = document.querySelectorAll('#software-chips .tag');
    chips.forEach(function (c) { c.classList.toggle('active', STATE.software.indexOf(c.textContent.trim()) >= 0); });
  }
  window.onSEOTitle = function () {
    var v = $('f-seo-title').value; var el = $('seo-title-count');
    el.textContent = v.length + ' / 60';
    el.style.color = v.length > 60 ? '#ef4444' : v.length > 50 ? '#f59e0b' : '#52525b';
    markDirty();
  };
  window.onSEODesc = function () {
    var v = $('f-seo-desc').value; var el = $('seo-desc-count');
    el.textContent = v.length + ' / 160';
    el.style.color = v.length > 160 ? '#ef4444' : v.length > 130 ? '#f59e0b' : '#52525b';
    markDirty();
  };
  function ensureProjectExists() {
    if (STATE.id) return Promise.resolve();
    var data = gatherFormData();
    if (!data.title) { data.title = 'Untitled'; $('f-title').value = 'Untitled'; }
    return persistProject(data);
  }
  window.onFileSelect = async function (ev) {
    var files = Array.from(ev.target.files || []);
    if (!files.length) return;
    await ensureProjectExists();
    await uploadFiles(files);
    ev.target.value = '';
  };
  async function uploadFiles(files) {
    var prog = $('upload-progress-area'), bar = $('upload-progress-bar'), pct = $('upload-pct'), lbl = $('upload-label');
    prog.style.display = 'block'; bar.style.width = '0%';
    var done = 0;
    for (var i = 0; i < files.length; i++) {
      var f = files[i]; lbl.textContent = 'Yukleniyor: ' + f.name;
      try {
        var fd = new FormData(); fd.append('file', f);
        var r = await fetch('/api/projects/' + encodeURIComponent(STATE.id) + '/media', { method: 'POST', headers: { 'Authorization': authHeader() }, body: fd });
        var d = await r.json();
        if (!d.ok) throw new Error(d.error || 'Yukleme hatasi');
        STATE.media.push(d.media);
        if (!STATE.project.cover || !STATE.project.cover.url) { STATE.project.cover = { url: d.media.url, public_id: d.media.public_id }; }
      } catch (e) { toast('Hata: ' + (e.message || e)); }
      done++; bar.style.width = (done / files.length * 100) + '%'; pct.textContent = Math.round(done / files.length * 100) + '%';
    }
    setTimeout(function () { prog.style.display = 'none'; }, 500);
    renderMedia(); validate();
  }
  function renderMedia() {
    var grid = $('media-grid'); grid.innerHTML = '';
    $('media-count').textContent = STATE.media.length + ' ' + (STATE.media.length === 1 ? 'file' : 'files');
    STATE.media.forEach(function (m, idx) {
      var card = document.createElement('div'); card.className = 'media-card';
      var isCover = STATE.project && STATE.project.cover && STATE.project.cover.public_id === m.public_id;
      card.style.border = '1px solid ' + (isCover ? '#3b82f6' : '#27272a');
      var thumb = document.createElement('div');
      thumb.style.cssText = 'height:100px;background:#1a1a1f;overflow:hidden;display:flex;align-items:center;justify-content:center;position:relative;';
      if ((m.type || '').startsWith('video')) {
        var v = document.createElement('video'); v.src = m.url; v.muted = true;
        v.style.cssText = 'width:100%;height:100%;object-fit:cover;'; thumb.appendChild(v);
      } else {
        var img = document.createElement('img'); img.src = m.url;
        img.style.cssText = 'width:100%;height:100%;object-fit:cover;'; thumb.appendChild(img);
      }
      var ordBadge = document.createElement('div');
      ordBadge.style.cssText = 'position:absolute;bottom:4px;left:4px;background:rgba(0,0,0,0.7);color:#fff;font-size:10px;padding:1px 6px;border-radius:3px;font-weight:600;';
      ordBadge.textContent = '#' + (idx + 1);
      thumb.appendChild(ordBadge);

      if (isCover) { var badge = document.createElement('div'); badge.className = 'cover-badge'; badge.textContent = 'COVER'; card.appendChild(badge); }
      var del = document.createElement('button'); del.type = 'button'; del.className = 'delete-btn'; del.textContent = '×';
      del.onclick = function () { deleteMedia(m.id); };

      var info = document.createElement('div'); info.style.cssText = 'padding:6px 8px;background:#0d0d10;';
      var fn = document.createElement('div'); fn.style.cssText = 'font-size:10px;color:#71717a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:5px;'; fn.textContent = m.name || '';

      var btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:4px;align-items:center;';
      var cb = document.createElement('button'); cb.type = 'button'; cb.className = 'cover-btn' + (isCover ? ' active' : '');
      cb.style.cssText = 'flex:1;';
      cb.textContent = isCover ? '✓ Cover' : 'Set Cover';
      cb.onclick = function () { setCover(m.id); };
      var upBtn = document.createElement('button');
      upBtn.type = 'button';
      upBtn.style.cssText = 'background:#1a1a1f;border:1px solid #27272a;color:' + (idx === 0 ? '#3a3a3a' : '#a1a1aa') + ';width:22px;height:22px;font-size:11px;border-radius:3px;cursor:' + (idx === 0 ? 'not-allowed' : 'pointer') + ';line-height:1;padding:0;';
      upBtn.innerHTML = '&#9650;';
      upBtn.title = 'Yukari tasi';
      upBtn.disabled = idx === 0;
      upBtn.onclick = function () { moveMedia(idx, -1); };
      var dnBtn = document.createElement('button');
      dnBtn.type = 'button';
      dnBtn.style.cssText = 'background:#1a1a1f;border:1px solid #27272a;color:' + (idx === STATE.media.length - 1 ? '#3a3a3a' : '#a1a1aa') + ';width:22px;height:22px;font-size:11px;border-radius:3px;cursor:' + (idx === STATE.media.length - 1 ? 'not-allowed' : 'pointer') + ';line-height:1;padding:0;';
      dnBtn.innerHTML = '&#9660;';
      dnBtn.title = 'Asagi tasi';
      dnBtn.disabled = idx === STATE.media.length - 1;
      dnBtn.onclick = function () { moveMedia(idx, 1); };
      btnRow.appendChild(cb); btnRow.appendChild(upBtn); btnRow.appendChild(dnBtn);
      info.appendChild(fn); info.appendChild(btnRow);

      card.appendChild(thumb); card.appendChild(del); card.appendChild(info);
      grid.appendChild(card);
    });
  }
  async function moveMedia(idx, dir) {
    var newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= STATE.media.length) return;
    var tmp = STATE.media[idx]; STATE.media[idx] = STATE.media[newIdx]; STATE.media[newIdx] = tmp;
    renderMedia();
    try {
      await fetch('/api/projects/' + encodeURIComponent(STATE.id) + '/media/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': authHeader() },
        body: JSON.stringify({ order: STATE.media.map(function (m) { return m.id; }) })
      });
    } catch (e) { /* silent — UI already updated */ }
  }
  async function setCover(mediaId) {
    try {
      var r = await fetch('/api/projects/' + encodeURIComponent(STATE.id) + '/cover', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': authHeader() }, body: JSON.stringify({ mediaId: mediaId }) });
      var d = await r.json();
      if (d.ok) { STATE.project.cover = d.cover; renderMedia(); validate(); toast('Cover guncellendi'); } else toast(d.error || 'Hata');
    } catch (e) { toast('Hata: ' + e.message); }
  }
  async function deleteMedia(mediaId) {
    if (!confirm('Bu medyayi sil?')) return;
    try {
      var r = await fetch('/api/projects/' + encodeURIComponent(STATE.id) + '/media/' + encodeURIComponent(mediaId), { method: 'DELETE', headers: { 'Authorization': authHeader() } });
      var d = await r.json();
      if (d.ok) {
        STATE.media = STATE.media.filter(function (m) { return m.id !== mediaId; });
        try { var rr = await fetch('/api/projects/' + encodeURIComponent(STATE.id)); STATE.project = await rr.json(); } catch (e) {}
        renderMedia(); validate(); toast('Silindi');
      } else toast(d.error || 'Hata');
    } catch (e) { toast('Hata: ' + e.message); }
  }
  function bindDrop() {
    var dz = $('drop-zone'); if (!dz) return;
    ['dragenter', 'dragover'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('dragover'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('dragover'); }); });
    dz.addEventListener('drop', async function (e) {
      var files = Array.from(e.dataTransfer.files || []);
      if (!files.length) return;
      await ensureProjectExists(); await uploadFiles(files);
    });
  }
  window.openPreview = function () {
    var d = gatherFormData();
    $('prev-cat').textContent = d.category || '';
    $('prev-title').textContent = d.title || 'Untitled';
    $('prev-subtitle').textContent = d.subtitle || '';
    $('prev-date').textContent = d.publishDate ? new Date(d.publishDate).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' }) : '';
    var info = [];
    if (d.role) info.push(['Role', d.role]);
    if (d.client) info.push(['Client', d.client]);
    if (d.year) info.push(['Year', d.year]);
    $('prev-info').innerHTML = info.map(function (r) { return '<div class="modal-info-row"><span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span></div>'; }).join('');
    var credEntries = Object.entries(d.credits || {}).filter(function (kv) { return kv[1] && kv[1].trim(); });
    if (credEntries.length) {
      $('prev-credits').innerHTML = credEntries.map(function (kv) { return '<div class="modal-credit-row"><p class="modal-credit-role">' + esc(kv[0]) + '</p><p class="modal-credit-names">' + esc(kv[1]).replace(/\n/g, '<br>') + '</p></div>'; }).join('');
      $('prev-credits-sec').style.display = 'block';
    } else $('prev-credits-sec').style.display = 'none';
    var plain = (d.description || '').replace(/<[^>]*>/g, '').trim();
    if (plain) { $('prev-desc-text').innerHTML = d.description; $('prev-desc-sec').style.display = 'block'; } else $('prev-desc-sec').style.display = 'none';
    var btns = [];
    if (d.ios) btns.push('<a class="store-btn" href="' + esc(d.ios) + '" target="_blank" rel="noopener"><span class="store-btn-label">Download on the</span><span class="store-btn-name">App Store</span></a>');
    if (d.android) btns.push('<a class="store-btn" href="' + esc(d.android) + '" target="_blank" rel="noopener"><span class="store-btn-label">Get it on</span><span class="store-btn-name">Google Play</span></a>');
    if (btns.length) { $('prev-links').innerHTML = btns.join(''); $('prev-links-sec').style.display = 'block'; } else $('prev-links-sec').style.display = 'none';
    if (d.software && d.software.length) { $('prev-soft').innerHTML = d.software.map(function (s) { return '<span class="tag">' + esc(s) + '</span>'; }).join(''); $('prev-soft-sec').style.display = 'block'; } else $('prev-soft-sec').style.display = 'none';
    if (d.tags && d.tags.length) { $('prev-tags').innerHTML = d.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join(''); $('prev-tags-sec').style.display = 'block'; } else $('prev-tags-sec').style.display = 'none';
    $('prev-media').innerHTML = STATE.media.map(function (m) {
      if ((m.type || '').startsWith('video')) return '<video src="' + esc(m.url) + '" controls></video>';
      return '<img src="' + esc(m.url) + '" alt="" />';
    }).join('');
    $('preview-modal').classList.add('show');
    document.body.style.overflow = 'hidden';
  };
  window.closePreview = function () { $('preview-modal').classList.remove('show'); document.body.style.overflow = ''; };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
    if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); saveDraft(); }
  });
  window.addEventListener('beforeunload', function (e) { if (STATE.dirty) { e.preventDefault(); e.returnValue = ''; } });
  window.addEventListener('DOMContentLoaded', function () { bindDrop(); init(); });
})();
