# 🚀 GitHub'a Yükleme ve Vercel'e Deploy Rehberi

## 📋 Repository Bilgileri
- **GitHub URL**: https://github.com/ysmert-coder/LawSprinter.git
- **Proje**: LawSprinter - AI-Powered Legal SaaS

---

## 🎯 Seçenek 1: GitHub Desktop Kullanarak (Kolay - Önerilen)

### Adım 1: GitHub Desktop'ı Açın

1. GitHub Desktop'ı açın (eğer yoksa: https://desktop.github.com)
2. **File** > **Add Local Repository** tıklayın
3. Proje klasörünü seçin: `C:\Users\salih\OneDrive\Masaüstü\cursor proje1`
4. Eğer "This directory does not appear to be a Git repository" hatası alırsanız:
   - **Create a repository** butonuna tıklayın
   - **Create Repository** tıklayın

### Adım 2: Repository'yi GitHub'a Publish Edin

1. GitHub Desktop'ta **Publish repository** butonuna tıklayın
2. Açılan pencerede:
   - **Name**: `LawSprinter` (zaten dolu olmalı)
   - **Description**: "AI-Powered Legal SaaS Platform"
   - **Keep this code private** kutusunu **işaretleyin** (özel tutmak isterseniz)
   - **Organization**: `ysmert-coder` seçin
3. **Publish Repository** tıklayın

### Adım 3: Dosyaları Commit ve Push Edin

1. GitHub Desktop'ta sol panelde değişen dosyalar görünecek
2. Altta **Summary** alanına yazın: "Initial commit - LawSprinter v1.0"
3. **Commit to main** butonuna tıklayın
4. **Push origin** butonuna tıklayın

**Tamamlandı!** ✅ Projeniz GitHub'da!

---

## 🎯 Seçenek 2: Git Command Line ile (Manuel)

### Önkoşul: Git Kurulumu

Eğer git yüklü değilse:
```powershell
# Git indirin ve kurun
# https://git-scm.com/download/win
```

### Adım 1: Git Başlat ve Dosyaları Ekle

```powershell
# Proje dizinine gidin
cd "C:\Users\salih\OneDrive\Masaüstü\cursor proje1"

# Git başlat
git init

# Git kullanıcı bilgilerini ayarla (ilk kez kullanıyorsanız)
git config user.name "ysmert-coder"
git config user.email "your-email@example.com"

# Tüm dosyaları ekle
git add .

# İlk commit
git commit -m "Initial commit - LawSprinter v1.0"

# Branch'i main olarak ayarla
git branch -M main

# Remote repository ekle
git remote add origin https://github.com/ysmert-coder/LawSprinter.git

# Push et
git push -u origin main
```

---

## 🌐 Vercel'e Deploy (Her İki Seçenek İçin)

### Adım 1: Vercel Hesabı Oluşturun

1. https://vercel.com adresine gidin
2. **Sign Up** tıklayın
3. **Continue with GitHub** seçin
4. GitHub hesabınızla giriş yapın
5. Vercel'in GitHub'a erişim iznini verin

### Adım 2: Yeni Proje Oluşturun

1. Vercel Dashboard'da **Add New** > **Project** tıklayın
2. **Import Git Repository** bölümünde `LawSprinter` repository'sini bulun
3. **Import** tıklayın

### Adım 3: Proje Ayarlarını Yapın

**Framework Preset**: Next.js (otomatik algılanmalı)

**Root Directory**: `.` (değiştirmeyin)

**Build and Output Settings**:
- Build Command: `npm run build` (otomatik)
- Output Directory: `.next` (otomatik)
- Install Command: `npm install` (otomatik)

### Adım 4: Environment Variables Ekleyin

**ZORUNLU**:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# n8n Webhooks (Production URL'leri)
N8N_CASE_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/case-assistant
N8N_STRATEGY_WEBHOOK_URL=https://your-n8n.com/webhook/strategy
N8N_CLIENT_PROFILE_WEBHOOK_URL=https://your-n8n.com/webhook/client-profile
N8N_TRAINING_WEBHOOK_URL=https://your-n8n.com/webhook/training
N8N_INVOICE_REMINDER_WEBHOOK_URL=https://your-n8n.com/webhook/invoice-reminder
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=https://your-n8n.com/webhook/contract-analyze
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=https://your-n8n.com/webhook/hearing-followup
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=https://your-n8n.com/webhook/client-status
```

**Environment Variables Nasıl Eklenir**:
1. Vercel project settings'de **Environment Variables** sekmesini açın
2. Her değişken için:
   - **Key**: Değişken adı (örn: `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Değerin kendisi
   - **Environment**: `Production`, `Preview`, `Development` hepsini seçin
3. **Save** tıklayın

### Adım 5: Deploy Edin!

1. Tüm ayarlar tamamlandıktan sonra **Deploy** butonuna tıklayın
2. Vercel projenizi build edecek ve deploy edecek (2-5 dakika)
3. Deploy tamamlanınca size bir URL verilecek:
   - Örnek: `https://law-sprinter.vercel.app`

**Tebrikler!** 🎉 Projeniz canlıda!

---

## ⚠️ Deploy Öncesi Kontrol Listesi

### 1. `.gitignore` Dosyasını Kontrol Edin

`.gitignore` dosyasında şunlar olmalı:
```gitignore
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
```

### 2. `package.json` Scripts Kontrol

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

### 3. Next.js Config Kontrol

`next.config.js` dosyası doğru mu?
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
```

---

## 🔄 Vercel Otomatik Deploy

Vercel GitHub ile entegre çalışır:

✅ **Her `git push`**: Otomatik deploy
✅ **Her PR**: Preview deploy
✅ **Main branch**: Production deploy

```bash
# Örnek workflow:
git add .
git commit -m "Yeni özellik eklendi"
git push origin main

# Vercel otomatik deploy eder!
```

---

## 🌍 n8n Production Deployment

### Seçenek 1: Railway

1. https://railway.app adresine gidin
2. **Deploy n8n** template kullanın
3. Environment variables ekleyin
4. Deploy edin
5. Railway URL'inizi alın: `https://your-app.railway.app`
6. Vercel environment variables'da webhook URL'leri güncelleyin

### Seçenek 2: Render

1. https://render.com adresine gidin
2. **New** > **Web Service**
3. n8n Docker image kullanın: `n8nio/n8n`
4. Environment variables ekleyin
5. Deploy edin
6. Render URL'inizi alın: `https://your-app.onrender.com`

### Seçenek 3: DigitalOcean

1. https://marketplace.digitalocean.com/apps/n8n
2. **Create n8n Droplet**
3. SSH ile bağlanın ve kurulumu tamamlayın
4. Domain bağlayın
5. SSL certificate ekleyin (Let's Encrypt)

---

## 🔐 Güvenlik Notları

### 1. Environment Variables

❌ **ASLA `.env.local` dosyasını commit etmeyin**
✅ **Sadece Vercel'de environment variables kullanın**

### 2. Supabase RLS (Row Level Security)

Supabase'de RLS policies aktif mi kontrol edin:
```sql
-- Tüm tablolar için RLS aktif olmalı
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
-- ... diğer tablolar
```

### 3. n8n Webhook Security

n8n workflow'larınızda authentication ekleyin:
- Basic Auth
- API Key
- JWT Token

---

## 📊 Deploy Sonrası Kontroller

### 1. Health Check
```bash
curl https://your-app.vercel.app/api/health
```

### 2. Supabase Bağlantısı
- Sign up sayfasına gidin
- Test kullanıcı oluşturun
- Dashboard'a erişmeyi deneyin

### 3. n8n Webhooks
```bash
# Test case assistant
curl -X POST https://your-n8n.com/webhook/case-assistant \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","caseType":"criminal","shortDescription":"Test"}'
```

### 4. Error Monitoring

Vercel'de Logs kontrol edin:
- **Deployments** > En son deployment > **Logs**
- **Analytics** > **Errors**

---

## 🐛 Troubleshooting

### Hata: "Build failed"

**Çözüm**:
1. Lokal'de build deneyin: `npm run build`
2. TypeScript hatalarını düzeltin
3. Missing dependencies ekleyin

### Hata: "Module not found"

**Çözüm**:
```bash
# package.json'da dependency var mı kontrol edin
npm install
npm run build
```

### Hata: "Environment variable not found"

**Çözüm**:
1. Vercel Project Settings > Environment Variables
2. Tüm değişkenleri kontrol edin
3. Redeploy edin

### Hata: "Supabase connection failed"

**Çözüm**:
1. Supabase URL doğru mu?
2. Supabase ANON key doğru mu?
3. Supabase projesi aktif mi?

---

## 📈 Performans Optimizasyonu

### 1. Next.js Image Optimization

`next.config.js`:
```javascript
module.exports = {
  images: {
    domains: ['your-supabase-project.supabase.co'],
  },
}
```

### 2. Vercel Analytics

Vercel Dashboard'da **Analytics** aktive edin:
- Core Web Vitals
- User metrics
- Performance insights

### 3. Edge Functions (Opsiyonel)

Hızlı API routes için:
```typescript
// app/api/example/route.ts
export const runtime = 'edge'
```

---

## 🎯 Production Checklist

- [ ] GitHub repository oluşturuldu
- [ ] Proje GitHub'a push edildi
- [ ] Vercel hesabı oluşturuldu
- [ ] Vercel'de proje import edildi
- [ ] Environment variables eklendi
- [ ] İlk deploy tamamlandı
- [ ] Supabase connection test edildi
- [ ] n8n webhooks test edildi
- [ ] Custom domain bağlandı (opsiyonel)
- [ ] SSL certificate aktif
- [ ] Error monitoring kuruldu
- [ ] Analytics aktif

---

## 🔗 Faydalı Linkler

- **Vercel Docs**: https://vercel.com/docs
- **Next.js Deploy**: https://nextjs.org/docs/deployment
- **Supabase Production**: https://supabase.com/docs/guides/platform/going-into-prod
- **n8n Cloud**: https://n8n.io/cloud

---

## 🆘 Yardım

Sorun yaşarsanız:

1. **Vercel Discord**: https://vercel.com/discord
2. **GitHub Issues**: Repository'nizde issue açın
3. **Vercel Support**: support@vercel.com

---

**Hazırlayan**: AI Assistant  
**Tarih**: 2025-11-15  
**Versiyon**: 1.0

---

## 🎊 Özet

### Yapmanız Gerekenler:

1. ✅ **GitHub Desktop** ile projeyi publish edin
2. ✅ **Vercel**'e sign up edin (GitHub ile)
3. ✅ **LawSprinter** repository'sini import edin
4. ✅ **Environment variables** ekleyin (Supabase + n8n)
5. ✅ **Deploy** butonuna tıklayın

**5 dakikada canlıda!** 🚀

### İlk Deploy Sonrası:

- URL alacaksınız: `https://law-sprinter.vercel.app`
- Custom domain bağlayabilirsiniz: `www.lawsprinter.com`
- Her push otomatik deploy olacak
- n8n'i production'a deploy edin (Railway/Render)

**Başarılar!** 🎉

