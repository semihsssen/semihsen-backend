const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('HATA: Cloudinary environment variables eksik!');
} else {
  console.log('Cloudinary konfigurasyon tamam. Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

const adminAuth = basicAuth({
  users: { 'semih': process.env.ADMIN_PASSWORD || 'semih2024' },
  challenge: true,
  realm: 'Admin',
});

function errMsg(e) { return (e && e.message) ? e.message : String(e); }
function newId() { return 'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8); }

const DB_PATH = process.env.DB_PATH || './db.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      hero: { url: '', public_id: '' },
      resume: { url: '', public_id: '' },
      settings: {
        nav_height: '114px', nav_logo_size: '30px', nav_sub_size: '10px', nav_link_size: '14px',
        hero_height: '500px', thumb_height: '93px',
        color_bg: '#0e0d11', color_bg2: '#19181d', color_text: '#f0eeee', color_muted: '#888680', color_accent: '#4a90e2',
        nav_logo_x: '135', nav_logo_y: '31', nav_sub_x: '138', nav_sub_y: '30'
      },
      userProjects: []
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  if (!Array.isArray(db.userProjects)) db.userProjects = [];
  if (!db.resume) db.resume = { url: '', public_id: '' };
  if (!db.settings) db.settings = {};
  return db;
}

function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err); else resolve(result);
    }).end(buffer);
  });
}

app.get('/api/data', (req, res) => {
  try { res.json(getDB()); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.get('/api/settings', (req, res) => {
  try { const db = getDB(); res.json(db.settings || {}); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.get('/api/preview-settings', (req, res) => {
  try { const db = getDB(); res.json(db.settings || {}); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/settings', adminAuth, (req, res) => {
  try {
    const db = getDB();
    db.settings = { ...db.settings, ...req.body };
    saveDB(db); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/upload/hero', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    if (db.hero && db.hero.public_id) await cloudinary.uploader.destroy(db.hero.public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/hero');
    db.hero = { url: result.secure_url, public_id: result.public_id };
    saveDB(db); res.json({ ok: true, url: result.secure_url });
  } catch (e) { console.error('Hero error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/upload/resume', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    if (db.resume && db.resume.public_id) await cloudinary.uploader.destroy(db.resume.public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/resume');
    db.resume = { url: result.secure_url, public_id: result.public_id };
    saveDB(db); res.json({ ok: true, url: result.secure_url });
  } catch (e) { console.error('Resume error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

app.get('/api/projects', (req, res) => {
  try { const db = getDB(); res.json(db.userProjects || []); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const db = getDB();
    const p = (db.userProjects || []).find(x => x.id === req.params.id);
    if (!p) return res.status(404).json({ error: 'Bulunamadi' });
    res.json(p);
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/projects', adminAuth, (req, res) => {
  try {
    const db = getDB();
    const now = new Date().toISOString();
    const proj = {
      id: newId(),
      title: '', subtitle: '', slug: '',
      role: '', client: '', year: new Date().getFullYear(),
      description: '', credits: {},
      category: '', tags: [], software: [],
      ios: '', android: '',
      publishDate: now.slice(0, 10),
      metaTitle: '', metaDesc: '',
      status: 'draft', featured: false, showOnHome: false,
      cover: null, media: [],
      createdAt: now, updatedAt: now,
      ...req.body
    };
    if (!db.userProjects) db.userProjects = [];
    db.userProjects.push(proj);
    saveDB(db);
    res.json({ ok: true, id: proj.id, project: proj });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.put('/api/projects/:id', adminAuth, (req, res) => {
  try {
    const db = getDB();
    const idx = (db.userProjects || []).findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Bulunamadi' });
    const allowed = ['title','subtitle','slug','role','client','year','description','credits','category','tags','software','ios','android','publishDate','metaTitle','metaDesc','status','featured','showOnHome','cover'];
    allowed.forEach(k => { if (req.body[k] !== undefined) db.userProjects[idx][k] = req.body[k]; });
    db.userProjects[idx].updatedAt = new Date().toISOString();
    saveDB(db);
    res.json({ ok: true, project: db.userProjects[idx] });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.delete('/api/projects/:id', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const idx = (db.userProjects || []).findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Bulunamadi' });
    const proj = db.userProjects[idx];
    for (const m of (proj.media || [])) {
      if (m.public_id) await cloudinary.uploader.destroy(m.public_id).catch(() => {});
    }
    if (proj.cover && proj.cover.public_id) await cloudinary.uploader.destroy(proj.cover.public_id).catch(() => {});
    db.userProjects.splice(idx, 1);
    saveDB(db);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/projects/:id/media', adminAuth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    const idx = (db.userProjects || []).findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Bulunamadi' });
    const isVideo = (req.file.mimetype || '').startsWith('video/');
    const opts = { folder: 'semihsen/projects', resource_type: isVideo ? 'video' : 'image' };
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(opts, (err, r) => err ? reject(err) : resolve(r)).end(req.file.buffer);
    });
    const item = {
      id: newId(),
      url: result.secure_url, public_id: result.public_id,
      type: req.file.mimetype, name: req.file.originalname,
      width: result.width || 0, height: result.height || 0, bytes: result.bytes || 0
    };
    if (!db.userProjects[idx].media) db.userProjects[idx].media = [];
    db.userProjects[idx].media.push(item);
    if (!db.userProjects[idx].cover || !db.userProjects[idx].cover.url) {
      db.userProjects[idx].cover = { url: result.secure_url, public_id: result.public_id };
    }
    db.userProjects[idx].updatedAt = new Date().toISOString();
    saveDB(db);
    res.json({ ok: true, media: item });
  } catch (e) { console.error('Project media error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

app.delete('/api/projects/:id/media/:mid', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const idx = (db.userProjects || []).findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Bulunamadi' });
    const mediaArr = db.userProjects[idx].media || [];
    const mi = mediaArr.findIndex(m => m.id === req.params.mid);
    if (mi < 0) return res.status(404).json({ error: 'Media bulunamadi' });
    const m = mediaArr[mi];
    if (m.public_id) await cloudinary.uploader.destroy(m.public_id).catch(() => {});
    mediaArr.splice(mi, 1);
    if (db.userProjects[idx].cover && db.userProjects[idx].cover.public_id === m.public_id) {
      db.userProjects[idx].cover = mediaArr[0] ? { url: mediaArr[0].url, public_id: mediaArr[0].public_id } : null;
    }
    db.userProjects[idx].updatedAt = new Date().toISOString();
    saveDB(db);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/projects/:id/cover', adminAuth, (req, res) => {
  try {
    const db = getDB();
    const idx = (db.userProjects || []).findIndex(x => x.id === req.params.id);
    if (idx < 0) return res.status(404).json({ error: 'Bulunamadi' });
    const mediaId = req.body.mediaId;
    const m = (db.userProjects[idx].media || []).find(x => x.id === mediaId);
    if (!m) return res.status(404).json({ error: 'Media bulunamadi' });
    db.userProjects[idx].cover = { url: m.url, public_id: m.public_id };
    db.userProjects[idx].updatedAt = new Date().toISOString();
    saveDB(db);
    res.json({ ok: true, cover: db.userProjects[idx].cover });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
