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
app.use(express.json());
app.use(express.static('public'));

const adminAuth = basicAuth({
  users: { 'semih': process.env.ADMIN_PASSWORD || 'semih2024' },
  challenge: true,
  realm: 'Admin',
});

function errMsg(e) {
  if (e && e.message) return e.message;
  return String(e);
}

// DB dosya yolu
const DB_PATH = process.env.DB_PATH || './db.json';

function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      hero: { url: '', public_id: '' },
      projects: {
        'block-out': { name: 'Block Out', studio: 'Grand Games', year: '2025', ios: 'https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568', android: '', about: 'Block-clearing puzzle with bold geometric visual language.', cover: { url: '', public_id: '' }, works: [], credits: { art_direction: 'Semih Sen', concept_art: '', art_3d: '' } },
        'car-match': { name: 'Car Match', studio: 'Grand Games', year: '2024', ios: 'https://apps.apple.com/us/app/car-match-traffic-puzzle/id6504421808', android: 'https://play.google.com/store/apps/details?id=com.grandgames.carmatch', about: 'Parking puzzle with clean, readable art direction.', cover: { url: '', public_id: '' }, works: [], credits: { art_direction: 'Semih Sen', concept_art: '', art_3d: '' } },
        'magic-sort': { name: 'Magic Sort', studio: 'Grand Games', year: '2024', ios: 'https://apps.apple.com/us/app/magic-sort/id6499209744', android: 'https://play.google.com/store/apps/details?id=com.grandgames.magicsort', about: 'Color-sorting puzzle with vibrant visual identity.', cover: { url: '', public_id: '' }, works: [], credits: { art_direction: 'Semih Sen', concept_art: '', art_3d: '' } },
        'match-villains': { name: 'Match Villians', studio: 'GoodJob Games', year: '2023', ios: 'https://apps.apple.com/us/app/match-villains/id6479752688', android: 'https://play.google.com/store/search?q=match+villains&c=apps', about: 'Character-driven match puzzle with bold villain designs.', cover: { url: '', public_id: '' }, works: [], credits: { art_direction: 'Semih Sen', concept_art: '', art_3d: '' } },
        'wonder-blast': { name: 'Wonder Blast', studio: 'GoodJob Games', year: '2022', ios: 'https://apps.apple.com/tr/app/wonder-blast/id1559972235', android: 'https://play.google.com/store/apps/details?id=com.goodjobgames.thebigday', about: 'Blast-mechanics puzzle with rich environments.', cover: { url: '', public_id: '' }, works: [], credits: { art_direction: 'Semih Sen', concept_art: '', art_3d: '' } }
      },
      personal: {
        '1': { name: 'Personal Work 1', about: '', slides: [] },
        '2': { name: 'Personal Work 2', about: '', slides: [] },
        '3': { name: 'Personal Work 3', about: '', slides: [] },
        '4': { name: 'Personal Work 4', about: '', slides: [] },
        '5': { name: 'Personal Work 5', about: '', slides: [] },
        '6': { name: 'Personal Work 6', about: '', slides: [] },
        '7': { name: 'Personal Work 7', about: '', slides: [] }
      },
      resume: { url: '', public_id: '' },
      settings: {
        nav_height: '114px', nav_logo_size: '30px', nav_sub_size: '10px', nav_link_size: '14px',
        hero_height: '500px', thumb_height: '93px',
        color_bg: '#0e0d11', color_bg2: '#19181d', color_text: '#f0eeee', color_muted: '#888680', color_accent: '#4a90e2',
        nav_logo_x: '135', nav_logo_y: '31', nav_sub_x: '138', nav_sub_y: '30'
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

async function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream({ folder }, (err, result) => {
      if (err) reject(err); else resolve(result);
    }).end(buffer);
  });
}

// GET /api/data
app.get('/api/data', (req, res) => {
  try { res.json(getDB()); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// GET /api/settings (alias for preview)
app.get('/api/settings', (req, res) => {
  try { const db = getDB(); res.json(db.settings || {}); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// GET /api/preview-settings
app.get('/api/preview-settings', (req, res) => {
  try { const db = getDB(); res.json(db.settings || {}); } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/settings
app.post('/api/settings', adminAuth, (req, res) => {
  try {
    const db = getDB();
    db.settings = { ...db.settings, ...req.body };
    saveDB(db); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/hero
app.post('/api/upload/hero', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    if (db.hero && db.hero.public_id) await cloudinary.uploader.destroy(db.hero.public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/hero');
    db.hero = { url: result.secure_url, public_id: result.public_id };
    saveDB(db); res.json({ ok: true, url: result.secure_url });
  } catch (e) { console.error('Hero error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/resume
app.post('/api/upload/resume', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    if (db.resume && db.resume.public_id) await cloudinary.uploader.destroy(db.resume.public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/resume');
    db.resume = { url: result.secure_url, public_id: result.public_id };
    saveDB(db); res.json({ ok: true, url: result.secure_url });
  } catch (e) { console.error('Resume error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});
// POST /api/upload/project/:key/cover
app.post('/api/upload/project/:key/cover', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    const proj = db.projects[req.params.key];
    if (!proj) return res.status(404).json({ error: 'Proje bulunamadi' });
    if (proj.cover && proj.cover.public_id) await cloudinary.uploader.destroy(proj.cover.public_id).catch(() => {});
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/projects/' + req.params.key + '/cover');
    proj.cover = { url: result.secure_url, public_id: result.public_id };
    saveDB(db); res.json({ ok: true, url: result.secure_url });
  } catch (e) { console.error('Cover error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/project/:key/work  (yeni: tek gorsel, works[] dizisine ekler)
app.post('/api/upload/project/:key/work', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    const proj = db.projects[req.params.key];
    if (!proj) return res.status(404).json({ error: 'Proje bulunamadi' });
    if (!proj.works) proj.works = [];
    const wi = proj.works.length;
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/projects/' + req.params.key + '/works');
    proj.works.push({
      name: 'Is ' + (wi + 1),
      thumbnail: { url: result.secure_url, public_id: result.public_id },
      slides: [{ url: result.secure_url, public_id: result.public_id }]
    });
    saveDB(db); res.json({ ok: true, url: result.secure_url, public_id: result.public_id });
  } catch (e) { console.error('Work upload error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// DELETE /api/project/:key/work/:wi
app.delete('/api/project/:key/work/:wi', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const proj = db.projects[req.params.key];
    const wi = parseInt(req.params.wi);
    if (!proj || !proj.works || !proj.works[wi]) return res.status(404).json({ error: 'Bulunamadi' });
    const work = proj.works[wi];
    if (work.thumbnail && work.thumbnail.public_id) await cloudinary.uploader.destroy(work.thumbnail.public_id).catch(() => {});
    if (work.slides) { for (const s of work.slides) { await cloudinary.uploader.destroy(s.public_id).catch(() => {}); } }
    proj.works.splice(wi, 1);
    saveDB(db); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/project/:key  (proje bilgilerini guncelle)
app.post('/api/project/:key', adminAuth, (req, res) => {
  try {
    const db = getDB();
    if (!db.projects[req.params.key]) return res.status(404).json({ error: 'Bulunamadi' });
    db.projects[req.params.key] = { ...db.projects[req.params.key], ...req.body };
    saveDB(db); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/personal/:num/slide
app.post('/api/upload/personal/:num/slide', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
    const db = getDB();
    const proj = db.personal[req.params.num];
    if (!proj) return res.status(404).json({ error: 'Bulunamadi' });
    const result = await uploadToCloudinary(req.file.buffer, 'semihsen/personal/' + req.params.num);
    proj.slides.push({ url: result.secure_url, public_id: result.public_id });
    saveDB(db); res.json({ ok: true, url: result.secure_url, slides: proj.slides });
  } catch (e) { console.error('Personal error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/personal/:num  (personal proje bilgilerini guncelle)
app.post('/api/personal/:num', adminAuth, (req, res) => {
  try {
    const db = getDB();
    if (!db.personal[req.params.num]) return res.status(404).json({ error: 'Bulunamadi' });
    db.personal[req.params.num] = { ...db.personal[req.params.num], ...req.body };
    saveDB(db); res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// DELETE /api/personal/:num/slide/:idx
app.delete('/api/personal/:num/slide/:idx', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const proj = db.personal[req.params.num];
    const idx = parseInt(req.params.idx);
    if (!proj || !proj.slides || !proj.slides[idx]) return res.status(404).json({ error: 'Bulunamadi' });
    await cloudinary.uploader.destroy(proj.slides[idx].public_id).catch(() => {});
    proj.slides.splice(idx, 1);
    saveDB(db); res.json({ ok: true, slides: proj.slides });
  } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server calisiyor port:', PORT));
