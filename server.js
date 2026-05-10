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
      console.error('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING');
      console.error('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING');
      console.error('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING');
} else {
      console.log('Cloudinary konfigürasyon tamam. Cloud name:', process.env.CLOUDINARY_CLOUD_NAME);
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
      if (e && e.error && e.error.message) return e.error.message;
      if (typeof e === 'string') return e;
      try { return JSON.stringify(e); } catch(_) { return String(e); }
}

const DB_PATH = './db.json';
function getDB() {
      if (!fs.existsSync(DB_PATH)) {
              const def = {
                        hero: { url: '', public_id: '' },
                        projects: {
                                    'block-out': {
                                                  name: 'Block Out', studio: 'Grand Games', year: '2025',
                                                  ios: 'https://apps.apple.com/us/app/block-out-color-sort-puzzle/id6752672568', android: '',
                                                  about: 'Block-clearing puzzle with bold geometric visual language.',
                                                  cover: { url: '', public_id: '' },
                                                  works: []
                                    },
                                    'car-match': {
                                                  name: 'Car Match', studio: 'Grand Games', year: '2024',
                                                  ios: 'https://apps.apple.com/us/app/car-match-traffic-puzzle/id6504421808',
                                                  android: 'https://play.google.com/store/apps/details?id=com.grandgames.carmatch',
                                                  about: 'Parking puzzle with clean, readable art direction.',
                                                  cover: { url: '', public_id: '' },
                                                  works: []
                                    },
                                    'magic-sort': {
                                                  name: 'Magic Sort', studio: 'Grand Games', year: '2024',
                                                  ios: 'https://apps.apple.com/us/app/magic-sort/id6499209744',
                                                  android: 'https://play.google.com/store/apps/details?id=com.grandgames.magicsort',
                                                  about: 'Color-sorting puzzle with vibrant visual identity.',
                                                  cover: { url: '', public_id: '' },
                                                  works: []
                                    },
                                    'match-villains': {
                                                  name: 'Match Villians', studio: 'GoodJob Games', year: '2023',
                                                  ios: 'https://apps.apple.com/us/app/match-villains/id6479752688',
                                                  android: 'https://play.google.com/store/search?q=match+villains&c=apps',
                                                  about: 'Character-driven match puzzle with bold villain designs.',
                                                  cover: { url: '', public_id: '' },
                                                  works: []
                                    },
                                    'wonder-blast': {
                                                  name: 'Wonder Blast', studio: 'GoodJob Games', year: '2022',
                                                  ios: 'https://apps.apple.com/tr/app/wonder-blast/id1559972235',
                                                  android: 'https://play.google.com/store/apps/details?id=com.goodjobgames.thebigday',
                                                  about: 'Blast-mechanics puzzle with rich environments.',
                                                  cover: { url: '', public_id: '' },
                                                  works: []
                                    },
                        },
                        personal: {
                                    '1': { name: 'Personal Work 1', about: '', slides: [] },
                                    '2': { name: 'Personal Work 2', about: '', slides: [] },
                                    '3': { name: 'Personal Work 3', about: '', slides: [] },
                                    '4': { name: 'Personal Work 4', about: '', slides: [] },
                                    '5': { name: 'Personal Work 5', about: '', slides: [] },
                                    '6': { name: 'Personal Work 6', about: '', slides: [] },
                                    '7': { name: 'Personal Work 7', about: '', slides: [] },
                        },
                        resume: { url: '', public_id: '' },
                        settings: { nav_height: '88px', nav_logo_size: '20px', nav_sub_size: '10px', nav_link_size: '14px', hero_height: '500px', thumb_height: '110px' }
              };
              fs.writeFileSync(DB_PATH, JSON.stringify(def, null, 2));
      }
      const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
      // Migrate old format projects
  for (const key of Object.keys(db.projects || {})) {
          const p = db.projects[key];
          if (!p.cover) p.cover = { url: '', public_id: '' };
          if (!p.works) {
                    // Migrate old grid/slides to works
            p.works = [];
                    if (p.slides && p.slides.length > 0) {
                                p.works.push({ name: 'Work 1', thumbnail: p.slides[0] || { url: '', public_id: '' }, slides: p.slides });
                    }
                    delete p.grid;
                    delete p.slides;
          }
          if (!p.credits) p.credits = { art_direction: 'Semih Sen', concept_art: '', art_3d: '' };
  }
      return db;
}
function saveDB(db) { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2)); }

function uploadToCloudinary(buffer, folder, opts = {}) {
      return new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream({ folder, ...opts }, (err, result) => {
                        if (err) { reject(err); return; }
                        if (!result) { reject(new Error('Cloudinary result is empty')); return; }
                        resolve(result);
              }).end(buffer);
      });
}

app.get('/api/data', (req, res) => res.json(getDB()));

app.post('/api/settings', adminAuth, (req, res) => {
      const db = getDB(); db.settings = { ...db.settings, ...req.body }; saveDB(db); res.json({ ok: true });
});

// Hero
app.post('/api/upload/hero', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB();
              if (db.hero.public_id) await cloudinary.uploader.destroy(db.hero.public_id).catch(() => {});
              const result = await uploadToCloudinary(req.file.buffer, 'semihsen/hero');
              db.hero = { url: result.secure_url, public_id: result.public_id };
              saveDB(db); res.json({ ok: true, url: result.secure_url });
      } catch (e) { console.error('Hero error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// Resume
app.post('/api/upload/resume', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB();
              const result = await uploadToCloudinary(req.file.buffer, 'semihsen/resume');
              db.resume = { url: result.secure_url, public_id: result.public_id };
              saveDB(db); res.json({ ok: true, url: result.secure_url });
      } catch (e) { console.error('Resume error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// Project cover (tek kapak gorseli - Game Art izgara icin)
app.post('/api/upload/project/:key/cover', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB();
              const proj = db.projects[req.params.key];
              if (!proj) return res.status(404).json({ error: 'Not found' });
              if (proj.cover && proj.cover.public_id) await cloudinary.uploader.destroy(proj.cover.public_id).catch(() => {});
              const result = await uploadToCloudinary(req.file.buffer, `semihsen/projects/${req.params.key}/cover`);
              proj.cover = { url: result.secure_url, public_id: result.public_id };
              saveDB(db); res.json({ ok: true, url: result.secure_url });
      } catch (e) { console.error('Cover error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// Add new work to project
app.post('/api/project/:key/works', adminAuth, (req, res) => {
      const db = getDB();
      const proj = db.projects[req.params.key];
      if (!proj) return res.status(404).json({ error: 'Not found' });
      const workName = req.body.name || ('Work ' + (proj.works.length + 1));
      proj.works.push({ name: workName, thumbnail: { url: '', public_id: '' }, slides: [] });
      saveDB(db); res.json({ ok: true, works: proj.works, workIndex: proj.works.length - 1 });
});

// Upload work thumbnail
app.post('/api/upload/project/:key/work/:wi/thumbnail', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB();
              const proj = db.projects[req.params.key];
              if (!proj) return res.status(404).json({ error: 'Not found' });
              const wi = parseInt(req.params.wi);
              if (!proj.works[wi]) return res.status(404).json({ error: 'Work not found' });
              const work = proj.works[wi];
              if (work.thumbnail && work.thumbnail.public_id) await cloudinary.uploader.destroy(work.thumbnail.public_id).catch(() => {});
              const result = await uploadToCloudinary(req.file.buffer, `semihsen/projects/${req.params.key}/works/${wi}/thumb`);
              work.thumbnail = { url: result.secure_url, public_id: result.public_id };
              saveDB(db); res.json({ ok: true, url: result.secure_url });
      } catch (e) { console.error('Thumb error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// Upload work slide
app.post('/api/upload/project/:key/work/:wi/slide', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB();
              const proj = db.projects[req.params.key];
              if (!proj) return res.status(404).json({ error: 'Not found' });
              const wi = parseInt(req.params.wi);
              if (!proj.works[wi]) return res.status(404).json({ error: 'Work not found' });
              const result = await uploadToCloudinary(req.file.buffer, `semihsen/projects/${req.params.key}/works/${wi}/slides`);
              proj.works[wi].slides.push({ url: result.secure_url, public_id: result.public_id });
              saveDB(db); res.json({ ok: true, url: result.secure_url, slides: proj.works[wi].slides });
      } catch (e) { console.error('Work slide error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

// Delete work slide
app.delete('/api/project/:key/work/:wi/slide/:idx', adminAuth, async (req, res) => {
      try {
              const db = getDB();
              const proj = db.projects[req.params.key];
              const wi = parseInt(req.params.wi);
              const idx = parseInt(req.params.idx);
              if (proj && proj.works[wi] && proj.works[wi].slides[idx]) {
                        await cloudinary.uploader.destroy(proj.works[wi].slides[idx].public_id).catch(() => {});
                        proj.works[wi].slides.splice(idx, 1);
                        saveDB(db);
              }
              res.json({ ok: true, slides: proj ? proj.works[wi].slides : [] });
      } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// Delete work
app.delete('/api/project/:key/work/:wi', adminAuth, async (req, res) => {
      try {
              const db = getDB();
              const proj = db.projects[req.params.key];
              const wi = parseInt(req.params.wi);
              if (proj && proj.works[wi]) {
                        const work = proj.works[wi];
                        if (work.thumbnail && work.thumbnail.public_id) await cloudinary.uploader.destroy(work.thumbnail.public_id).catch(() => {});
                        for (const s of work.slides) { await cloudinary.uploader.destroy(s.public_id).catch(() => {}); }
                        proj.works.splice(wi, 1);
                        saveDB(db);
              }
              res.json({ ok: true });
      } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

// Update work name
app.post('/api/project/:key/work/:wi', adminAuth, (req, res) => {
      const db = getDB();
      const proj = db.projects[req.params.key];
      const wi = parseInt(req.params.wi);
      if (!proj || !proj.works[wi]) return res.status(404).json({ error: 'Not found' });
      proj.works[wi] = { ...proj.works[wi], ...req.body };
      saveDB(db); res.json({ ok: true });
});

// Update project info
app.post('/api/project/:key', adminAuth, (req, res) => {
      const db = getDB();
      if (!db.projects[req.params.key]) return res.status(404).json({ error: 'Not found' });
      db.projects[req.params.key] = { ...db.projects[req.params.key], ...req.body };
      saveDB(db); res.json({ ok: true });
});

// Personal works
app.post('/api/upload/personal/:num/slide', adminAuth, upload.single('image'), async (req, res) => {
      try {
              if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadi' });
              const db = getDB(); const proj = db.personal[req.params.num];
              if (!proj) return res.status(404).json({ error: 'Not found' });
              const result = await uploadToCloudinary(req.file.buffer, `semihsen/personal/${req.params.num}`);
              proj.slides.push({ url: result.secure_url, public_id: result.public_id });
              saveDB(db); res.json({ ok: true, url: result.secure_url, slides: proj.slides });
      } catch (e) { console.error('Personal error:', errMsg(e), e); res.status(500).json({ error: errMsg(e) }); }
});

app.post('/api/personal/:num', adminAuth, (req, res) => {
      const db = getDB();
      if (!db.personal[req.params.num]) return res.status(404).json({ error: 'Not found' });
      db.personal[req.params.num] = { ...db.personal[req.params.num], ...req.body };
      saveDB(db); res.json({ ok: true });
});

app.delete('/api/personal/:num/slide/:idx', adminAuth, async (req, res) => {
      try {
              const db = getDB(); const proj = db.personal[req.params.num]; const idx = parseInt(req.params.idx);
              if (proj && proj.slides[idx]) { await cloudinary.uploader.destroy(proj.slides[idx].public_id).catch(() => {}); proj.slides.splice(idx, 1); saveDB(db); }
              res.json({ ok: true, slides: proj ? proj.slides : [] });
      } catch (e) { res.status(500).json({ error: errMsg(e) }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server calisiyour: ${PORT}`));
