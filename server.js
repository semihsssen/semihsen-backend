const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const basicAuth = require('express-basic-auth');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Admin auth
const adminAuth = basicAuth({
  users: { 'semih': process.env.ADMIN_PASSWORD || 'semih2024' },
  challenge: true,
  realm: 'Admin Panel',
});

// Veritabanı (JSON dosyası)
const DB_PATH = './db.json';
function getDB() {
  if (!fs.existsSync(DB_PATH)) {
    const defaultDB = {
      hero: { url: '', public_id: '' },
      projects: {
        'block-out':      { name:'Block Out',      studio:'Grand Games',    year:'2025', ios:'https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568', android:'', about:'Block-clearing puzzle with bold geometric visual language.', credits:{ art_direction:'Semih Şen', concept_art:'', art_3d:'' }, grid:[], slides:[] },
        'car-match':      { name:'Car Match',       studio:'Grand Games',    year:'2024', ios:'https://apps.apple.com/us/app/car-match-traffic-puzzle/id6504421808', android:'https://play.google.com/store/apps/details?id=com.grandgames.carmatch', about:'Parking puzzle with clean, readable art direction.', credits:{ art_direction:'Semih Şen', concept_art:'', art_3d:'' }, grid:[], slides:[] },
        'magic-sort':     { name:'Magic Sort',      studio:'Grand Games',    year:'2024', ios:'https://apps.apple.com/us/app/magic-sort/id6499209744', android:'https://play.google.com/store/apps/details?id=com.grandgames.magicsort', about:'Color-sorting puzzle with vibrant visual identity.', credits:{ art_direction:'Semih Şen', concept_art:'', art_3d:'' }, grid:[], slides:[] },
        'match-villains':  { name:'Match Villians',  studio:'GoodJob Games',  year:'2023', ios:'https://apps.apple.com/us/app/match-villains/id6479752688', android:'https://play.google.com/store/search?q=match+villains&c=apps', about:'Character-driven match puzzle with bold villain designs.', credits:{ art_direction:'Semih Şen', concept_art:'', art_3d:'' }, grid:[], slides:[] },
        'wonder-blast':   { name:'Wonder Blast',    studio:'GoodJob Games',  year:'2022', ios:'https://apps.apple.com/tr/app/wonder-blast/id1559972235', android:'https://play.google.com/store/apps/details?id=com.goodjobgames.thebigday', about:'Blast-mechanics puzzle with rich environments.', credits:{ art_direction:'Semih Şen', concept_art:'', art_3d:'' }, grid:[], slides:[] },
      },
      personal: {
        '1':{ name:'Personal Work 1', about:'', slides:[] },
        '2':{ name:'Personal Work 2', about:'', slides:[] },
        '3':{ name:'Personal Work 3', about:'', slides:[] },
        '4':{ name:'Personal Work 4', about:'', slides:[] },
        '5':{ name:'Personal Work 5', about:'', slides:[] },
        '6':{ name:'Personal Work 6', about:'', slides:[] },
        '7':{ name:'Personal Work 7', about:'', slides:[] },
      },
      resume: { url: '', public_id: '' },
      settings: {
        nav_height: '88px', nav_logo_size: '20px',
        nav_sub_size: '10px', nav_link_size: '14px',
        hero_height: '500px', thumb_height: '110px',
      }
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDB, null, 2));
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}
function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

// ── API ROUTES ──────────────────────────────────────────────

// Veriyi getir (site için public)
app.get('/api/data', (req, res) => {
  res.json(getDB());
});

// Settings güncelle
app.post('/api/settings', adminAuth, (req, res) => {
  const db = getDB();
  db.settings = { ...db.settings, ...req.body };
  saveDB(db);
  res.json({ ok: true });
});

// Hero görsel yükle
app.post('/api/upload/hero', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const db = getDB();
    if (db.hero.public_id) await cloudinary.uploader.destroy(db.hero.public_id);
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'semihsen/hero', transformation:[{quality:'auto',fetch_format:'auto'}] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file.buffer);
    });
    db.hero = { url: result.secure_url, public_id: result.public_id };
    saveDB(db);
    res.json({ ok: true, url: result.secure_url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Resume görsel yükle
app.post('/api/upload/resume', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const db = getDB();
    if (db.resume.public_id) await cloudinary.uploader.destroy(db.resume.public_id);
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: 'semihsen/resume', transformation:[{quality:'auto',fetch_format:'auto'}] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file.buffer);
    });
    db.resume = { url: result.secure_url, public_id: result.public_id };
    saveDB(db);
    res.json({ ok: true, url: result.secure_url });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Proje slider görsel yükle
app.post('/api/upload/project/:key/slide', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const db = getDB();
    const proj = db.projects[req.params.key];
    if (!proj) return res.status(404).json({ error: 'Proje bulunamadı' });
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: `semihsen/projects/${req.params.key}/slides`, transformation:[{quality:'auto',fetch_format:'auto',width:1920,crop:'limit'}] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file.buffer);
    });
    proj.slides.push({ url: result.secure_url, public_id: result.public_id });
    saveDB(db);
    res.json({ ok: true, url: result.secure_url, slides: proj.slides });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Proje grid görsel yükle
app.post('/api/upload/project/:key/grid', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const db = getDB();
    const proj = db.projects[req.params.key];
    if (!proj) return res.status(404).json({ error: 'Proje bulunamadı' });
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: `semihsen/projects/${req.params.key}/grid`, transformation:[{quality:'auto',fetch_format:'auto',width:600,height:600,crop:'fill'}] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file.buffer);
    });
    if (proj.grid.length >= 4) {
      await cloudinary.uploader.destroy(proj.grid[0].public_id);
      proj.grid.shift();
    }
    proj.grid.push({ url: result.secure_url, public_id: result.public_id });
    saveDB(db);
    res.json({ ok: true, url: result.secure_url, grid: proj.grid });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Proje slide sil
app.delete('/api/project/:key/slide/:idx', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const proj = db.projects[req.params.key];
    const idx = parseInt(req.params.idx);
    if (proj.slides[idx]) {
      await cloudinary.uploader.destroy(proj.slides[idx].public_id);
      proj.slides.splice(idx, 1);
      saveDB(db);
    }
    res.json({ ok: true, slides: proj.slides });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Proje bilgilerini güncelle
app.post('/api/project/:key', adminAuth, (req, res) => {
  const db = getDB();
  if (!db.projects[req.params.key]) return res.status(404).json({ error: 'Proje bulunamadı' });
  db.projects[req.params.key] = { ...db.projects[req.params.key], ...req.body };
  saveDB(db);
  res.json({ ok: true });
});

// Personal proje slide yükle
app.post('/api/upload/personal/:num/slide', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const db = getDB();
    const proj = db.personal[req.params.num];
    if (!proj) return res.status(404).json({ error: 'Proje bulunamadı' });
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream({ folder: `semihsen/personal/${req.params.num}`, transformation:[{quality:'auto',fetch_format:'auto',width:1920,crop:'limit'}] },
        (err, r) => err ? reject(err) : resolve(r)
      ).end(req.file.buffer);
    });
    proj.slides.push({ url: result.secure_url, public_id: result.public_id });
    saveDB(db);
    res.json({ ok: true, url: result.secure_url, slides: proj.slides });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Personal proje bilgi güncelle
app.post('/api/personal/:num', adminAuth, (req, res) => {
  const db = getDB();
  if (!db.personal[req.params.num]) return res.status(404).json({ error: 'Proje bulunamadı' });
  db.personal[req.params.num] = { ...db.personal[req.params.num], ...req.body };
  saveDB(db);
  res.json({ ok: true });
});

// Personal slide sil
app.delete('/api/personal/:num/slide/:idx', adminAuth, async (req, res) => {
  try {
    const db = getDB();
    const proj = db.personal[req.params.num];
    const idx = parseInt(req.params.idx);
    if (proj.slides[idx]) {
      await cloudinary.uploader.destroy(proj.slides[idx].public_id);
      proj.slides.splice(idx, 1);
      saveDB(db);
    }
    res.json({ ok: true, slides: proj.slides });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server çalışıyor: ${PORT}`));
