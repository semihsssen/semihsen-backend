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

// GET /api/settings
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
    } catch (e) { console.error('Hero error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
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
    } catch (e) { console.error('Resume error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/project/:key (update project info)
app.post('/api/project/:key', adminAuth, (req, res) => {
    try {
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          const { name, studio, year, ios, android, about, art_direction, concept_art, art_3d } = req.body;
          if (name !== undefined) p.name = name;
          if (studio !== undefined) p.studio = studio;
          if (year !== undefined) p.year = year;
          if (ios !== undefined) p.ios = ios;
          if (android !== undefined) p.android = android;
          if (about !== undefined) p.about = about;
          if (!p.credits) p.credits = {};
          if (art_direction !== undefined) p.credits.art_direction = art_direction;
          if (concept_art !== undefined) p.credits.concept_art = concept_art;
          if (art_3d !== undefined) p.credits.art_3d = art_3d;
          saveDB(db); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/project/:key/cover
app.post('/api/upload/project/:key/cover', adminAuth, upload.single('image'), async (req, res) => {
    try {
          if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          if (p.cover && p.cover.public_id) await cloudinary.uploader.destroy(p.cover.public_id).catch(() => {});
          const result = await uploadToCloudinary(req.file.buffer, 'semihsen/covers');
          p.cover = { url: result.secure_url, public_id: result.public_id };
          saveDB(db); res.json({ ok: true, url: result.secure_url });
    } catch (e) { console.error('Cover error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/project/:key/work (add a work thumbnail to works[])
app.post('/api/upload/project/:key/work', adminAuth, upload.single('image'), async (req, res) => {
    try {
          if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          if (!p.works) p.works = [];
          const result = await uploadToCloudinary(req.file.buffer, 'semihsen/works');
          p.works.push({ url: result.secure_url, public_id: result.public_id, slides: [] });
          saveDB(db); res.json({ ok: true, url: result.secure_url, wi: p.works.length - 1 });
    } catch (e) { console.error('Work error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

// DELETE /api/project/:key/work/:wi (delete a work item)
app.delete('/api/project/:key/work/:wi', adminAuth, async (req, res) => {
    try {
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          const wi = parseInt(req.params.wi);
          if (!p.works || wi < 0 || wi >= p.works.length) return res.status(404).json({ error: 'Work bulunamadi' });
          const w = p.works[wi];
          if (w.public_id) await cloudinary.uploader.destroy(w.public_id).catch(() => {});
          if (w.slides) {
                  for (const s of w.slides) {
                            if (s.public_id) await cloudinary.uploader.destroy(s.public_id).catch(() => {});
                  }
          }
          p.works.splice(wi, 1);
          saveDB(db); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/project/:key/work/:wi/slide (add slide to a work item)
app.post('/api/upload/project/:key/work/:wi/slide', adminAuth, upload.single('image'), async (req, res) => {
    try {
          if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          const wi = parseInt(req.params.wi);
          if (!p.works || wi < 0 || wi >= p.works.length) return res.status(404).json({ error: 'Work bulunamadi' });
          if (!p.works[wi].slides) p.works[wi].slides = [];
          const result = await uploadToCloudinary(req.file.buffer, 'semihsen/slides');
          p.works[wi].slides.push({ url: result.secure_url, public_id: result.public_id });
          saveDB(db); res.json({ ok: true, url: result.secure_url, si: p.works[wi].slides.length - 1 });
    } catch (e) { console.error('Work slide error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

// DELETE /api/project/:key/work/:wi/slide/:si
app.delete('/api/project/:key/work/:wi/slide/:si', adminAuth, async (req, res) => {
    try {
          const db = getDB();
          const p = db.projects[req.params.key];
          if (!p) return res.status(404).json({ error: 'Proje bulunamadi' });
          const wi = parseInt(req.params.wi);
          const si = parseInt(req.params.si);
          if (!p.works || wi < 0 || wi >= p.works.length) return res.status(404).json({ error: 'Work bulunamadi' });
          if (!p.works[wi].slides || si < 0 || si >= p.works[wi].slides.length) return res.status(404).json({ error: 'Slide bulunamadi' });
          const slide = p.works[wi].slides[si];
          if (slide.public_id) await cloudinary.uploader.destroy(slide.public_id).catch(() => {});
          p.works[wi].slides.splice(si, 1);
          saveDB(db); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/personal/:num (update personal info)
app.post('/api/personal/:num', adminAuth, (req, res) => {
    try {
          const db = getDB();
          const p = db.personal[req.params.num];
          if (!p) return res.status(404).json({ error: 'Personal bulunamadi' });
          const { name, about } = req.body;
          if (name !== undefined) p.name = name;
          if (about !== undefined) p.about = about;
          saveDB(db); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// POST /api/upload/personal/:num/slide
app.post('/api/upload/personal/:num/slide', adminAuth, upload.single('image'), async (req, res) => {
    try {
          if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
          const db = getDB();
          const p = db.personal[req.params.num];
          if (!p) return res.status(404).json({ error: 'Personal bulunamadi' });
          if (!p.slides) p.slides = [];
          const result = await uploadToCloudinary(req.file.buffer, 'semihsen/personal');
          p.slides.push({ url: result.secure_url, public_id: result.public_id });
          saveDB(db); res.json({ ok: true, url: result.secure_url });
    } catch (e) { console.error('Personal slide error:', errMsg(e)); res.status(500).json({ error: errMsg(e) }); }
});

// DELETE /api/personal/:num/slide/:idx
app.delete('/api/personal/:num/slide/:idx', adminAuth, async (req, res) => {
    try {
          const db = getDB();
          const p = db.personal[req.params.num];
          if (!p) return res.status(404).json({ error: 'Personal bulunamadi' });
          const idx = parseInt(req.params.idx);
          if (!p.slides || idx < 0 || idx >= p.slides.length) return res.status(404).json({ error: 'Slide bulunamadi' });
          const slide = p.slides[idx];
          if (slide.public_id) await cloudinary.uploader.destroy(slide.public_id).catch(() => {});
          p.slides.splice(idx, 1);
          saveDB(db); res.json({ ok: true });
    } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on port', PORT));
