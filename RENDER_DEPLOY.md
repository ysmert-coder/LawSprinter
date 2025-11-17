# 🚀 Render.com'a Deploy Rehberi

## Neden Render.com?

✅ **Ücretsiz tier çok cömert** (Vercel'den daha iyi)
✅ **Aylık 750 saat** ücretsiz çalışma
✅ **Otomatik SSL** sertifikası
✅ **GitHub entegrasyonu** (otomatik deploy)
✅ **Kolay environment variables** yönetimi
✅ **Türkiye'ye yakın** Frankfurt sunucuları

---

## 📋 Ön Hazırlık

### 1. GitHub'a Son Değişiklikleri Push Et

```bash
cd "/c/Users/salih/OneDrive/Masaüstü/cursor proje1"
git add .
git commit -m "Render.com deployment optimization"
git push origin main
```

### 2. Render.com Hesabı Oluştur

1. https://render.com adresine git
2. **"Get Started for Free"** butonuna tıkla
3. **GitHub ile giriş yap** (en kolay yöntem)
4. GitHub hesabını bağla ve yetkilendir

---

## 🎯 Deploy Adımları

### Adım 1: Yeni Web Service Oluştur

1. Render Dashboard'da **"New +"** butonuna tıkla
2. **"Web Service"** seçeneğini seç
3. **GitHub repository'ni bağla:**
   - "Connect a repository" bölümünde
   - **"ysmert-coder/LawSprinter"** repository'sini bul
   - **"Connect"** butonuna tıkla

### Adım 2: Proje Ayarlarını Yapılandır

Render otomatik olarak şunları algılayacak:

- **Name:** `lawsprinter` (veya istediğin isim)
- **Region:** `Frankfurt (EU Central)` seç (Türkiye'ye en yakın)
- **Branch:** `main`
- **Root Directory:** boş bırak
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

### Adım 3: Environment Variables Ekle

**"Advanced"** butonuna tıkla ve şu environment variables'ları ekle:

#### Supabase Ayarları (Zorunlu)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### n8n Webhook URLs (Zorunlu - 8 adet)
```
N8N_WEBHOOK_CONTRACT_ANALYZE=http://localhost:5678/webhook/contract-analyze
N8N_WEBHOOK_HEARING_FOLLOWUP=http://localhost:5678/webhook/hearing-followup
N8N_WEBHOOK_CLIENT_STATUS_NOTIFY=http://localhost:5678/webhook/client-status-notify
N8N_WEBHOOK_CASE_ASSISTANT=http://localhost:5678/webhook/case-assistant
N8N_WEBHOOK_STRATEGY_GENERATOR=http://localhost:5678/webhook/strategy-generator
N8N_WEBHOOK_CLIENT_PROFILE=http://localhost:5678/webhook/client-profile
N8N_WEBHOOK_TRAINING=http://localhost:5678/webhook/training
N8N_WEBHOOK_INVOICE_REMINDER=http://localhost:5678/webhook/invoice-reminder
```

#### Node Ayarları (Otomatik)
```
NODE_ENV=production
```

### Adım 4: Deploy Et!

1. **"Create Web Service"** butonuna tıkla
2. Render otomatik olarak:
   - Repository'yi klonlayacak
   - Dependencies'leri yükleyecek (`npm install`)
   - Projeyi build edecek (`npm run build`)
   - Uygulamayı başlatacak (`npm start`)

**İlk deploy 5-10 dakika sürebilir.** ☕

---

## 📊 Deploy Durumunu Takip Et

Deploy sırasında Render Dashboard'da:

1. **Logs** sekmesinde gerçek zamanlı logları görebilirsin
2. **Events** sekmesinde deploy geçmişini görebilirsin
3. Deploy tamamlandığında **"Live"** durumuna geçecek

---

## 🌐 Canlı URL'ini Al

Deploy başarılı olduğunda:

1. Render sana otomatik bir URL verecek:
   ```
   https://lawsprinter.onrender.com
   ```

2. Bu URL'yi tarayıcıda aç ve uygulamanı test et!

---

## 🔧 Önemli Notlar

### Free Tier Limitleri

- ✅ **750 saat/ay** ücretsiz çalışma
- ✅ **512 MB RAM**
- ✅ **Otomatik SSL**
- ⚠️ **15 dakika inaktivite sonrası sleep** (ilk istek 30 saniye sürebilir)
- ✅ **Sınırsız bandwidth**

### Otomatik Deploy

Render, GitHub'a her push yaptığında otomatik olarak yeniden deploy eder:

```bash
git add .
git commit -m "Update feature"
git push origin main
# Render otomatik olarak yeni versiyonu deploy eder
```

### Custom Domain Bağlama (Opsiyonel)

1. Render Dashboard → Web Service → Settings
2. **"Custom Domain"** bölümüne git
3. Domain'ini ekle (örn: `lawsprinter.com`)
4. DNS ayarlarını yapılandır

---

## 🐛 Sorun Giderme

### Build Hatası Alıyorsan

1. **Logs** sekmesini kontrol et
2. Hata mesajını oku
3. Genellikle environment variables eksiktir

### Environment Variables Eksikse

1. Dashboard → Web Service → Environment
2. **"Add Environment Variable"** butonuna tıkla
3. Eksik değişkenleri ekle
4. **"Save Changes"** → Otomatik redeploy olur

### n8n Webhooks Çalışmıyorsa

1. n8n instance'ının **public URL**'sini kullan
2. `localhost:5678` yerine gerçek URL kullan:
   ```
   https://your-n8n-instance.com/webhook/...
   ```

### Supabase Bağlantı Hatası

1. Supabase Dashboard → Settings → API
2. **URL** ve **anon key**'i kopyala
3. Render'da environment variables'ı güncelle

---

## 🎉 Başarılı Deploy Sonrası

1. ✅ Uygulamayı tarayıcıda aç: `https://lawsprinter.onrender.com`
2. ✅ Giriş yap ve test et
3. ✅ Supabase bağlantısını kontrol et
4. ✅ n8n webhook'larını test et

---

## 📞 Yardım

Sorun yaşarsan:

1. **Render Logs'u** kontrol et
2. **GitHub Issues** aç
3. **Render Community** forumlarına sor: https://community.render.com

---

## 🚀 Hızlı Komutlar

```bash
# GitHub'a push et
git add .
git commit -m "Deploy to Render"
git push origin main

# Render otomatik olarak deploy eder!
```

**BAŞARILAR! 🎊**

