# semihsen.art — Backend Kurulum Rehberi

## Railway'e Deploy Adımları

### 1. GitHub hesabı aç
- github.com → Sign up (email ile)

### 2. Bu klasörü GitHub'a yükle
- github.com → New repository → "semihsen-backend" → Create
- Upload files → tüm dosyaları sürükle bırak → Commit

### 3. Railway'e bağla
- railway.app → Sign in with GitHub
- New Project → Deploy from GitHub repo → semihsen-backend seç
- Deploy et

### 4. Environment Variables ekle
Railway dashboard → Variables sekmesi → şunları ekle:

```
CLOUDINARY_CLOUD_NAME = dfwp7d3ha
CLOUDINARY_API_KEY    = 382222217319589
CLOUDINARY_API_SECRET = bSH6-F8_7yKie95FORmtB7JRHto
ADMIN_PASSWORD        = (istediğin şifre — örn: semih2024!)
PORT                  = 3000
```

### 5. Domain al
Railway → Settings → Networking → Generate Domain
Sana şöyle bir URL verir: semihsen-backend.up.railway.app

### 6. Admin paneline gir
https://semihsen-backend.up.railway.app/admin.html
- Kullanıcı adı: semih
- Şifre: yukarıda yazdığın şifre

---

## Ne yapabilirsin?

✅ Hero görseli yükle
✅ CV görseli yükle  
✅ Her proje için slider görseli ekle/sil
✅ Her proje için ızgara görseli ekle
✅ Proje adı, açıklama, kredi isimlerini düzenle
✅ App Store / Google Play linklerini güncelle
✅ Personal Works görseli ve bilgilerini düzenle
✅ Nav ve hero boyutlarını ayarla
