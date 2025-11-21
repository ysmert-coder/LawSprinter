# 🔧 Render + Supabase Bağlantı Kurulumu

## ⚠️ SORUN
Render'da deploy edilen projede **"Kayıt olurken bir hata oluştu"** hatası alınıyor.

**SEBEP:** Supabase environment variables Render Dashboard'a eklenmemiş!

---

## ✅ ÇÖZÜM: Environment Variables Ekleme

### 1️⃣ Supabase Bilgilerini Al

**Supabase Dashboard'a git:**
👉 https://supabase.com/dashboard

1. Projenizi seçin
2. Sol menüden **Settings** > **API** seçeneğine tıklayın
3. Şu bilgileri kopyalayın:
   - **Project URL** (örnek: `https://abcdefgh.supabase.co`)
   - **anon public** key (örnek: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

---

### 2️⃣ Render Dashboard'a Environment Variables Ekle

**Render Dashboard'a git:**
👉 https://dashboard.render.com/web/srv-d4dpu8er433s7385viog

1. **Environment** sekmesine tıkla
2. **Add Environment Variable** butonuna tıkla
3. Şu 2 değişkeni ekle:

#### Variable 1:
```
Key:   NEXT_PUBLIC_SUPABASE_URL
Value: [Supabase Project URL'nizi buraya yapıştırın]
```

#### Variable 2:
```
Key:   NEXT_PUBLIC_SUPABASE_ANON_KEY
Value: [Supabase anon public key'inizi buraya yapıştırın]
```

4. **Save Changes** butonuna tıkla
5. Render otomatik olarak yeniden deploy edecek

---

### 3️⃣ Deploy Tamamlanınca Test Et

Deploy tamamlandıktan sonra (2-3 dakika):

1. https://lawsprinter.onrender.com/auth/sign-up adresine git
2. Kayıt formunu doldur
3. **Kayıt Ol** butonuna tıkla
4. ✅ Başarılı olursa dashboard'a yönlendirileceksin!

---

## 🔍 Hata Ayıklama

Eğer hala hata alıyorsan:

### Console'u Kontrol Et:
1. Sayfada **F12** tuşuna bas
2. **Console** sekmesine git
3. Şu mesajları ara:
   ```
   ❌ Supabase environment variables missing!
   NEXT_PUBLIC_SUPABASE_URL: ✗ Missing
   NEXT_PUBLIC_SUPABASE_ANON_KEY: ✗ Missing
   ```

### Render Logs'u Kontrol Et:
1. Render Dashboard > **Logs** sekmesi
2. Son deploy'un başarılı olduğunu doğrula
3. Environment variables'ın yüklendiğini kontrol et

---

## 📝 Ek Bilgiler

### Supabase Authentication Ayarları

Supabase Dashboard'da authentication ayarlarını kontrol et:

1. **Authentication** > **Settings**
2. **Site URL** ayarını kontrol et:
   ```
   https://lawsprinter.onrender.com
   ```
3. **Redirect URLs** listesine ekle:
   ```
   https://lawsprinter.onrender.com/auth/callback
   https://lawsprinter.onrender.com/dashboard
   ```

### Email Confirmation (Opsiyonel)

Eğer email confirmation kapalıysa:
1. **Authentication** > **Settings**
2. **Enable email confirmations** seçeneğini **KAPAT**
3. Böylece kullanıcılar direkt giriş yapabilir

---

## 🎯 Özet Checklist

- [ ] Supabase Project URL'i kopyalandı
- [ ] Supabase anon key kopyalandı
- [ ] Render'a `NEXT_PUBLIC_SUPABASE_URL` eklendi
- [ ] Render'a `NEXT_PUBLIC_SUPABASE_ANON_KEY` eklendi
- [ ] Render otomatik deploy tamamlandı
- [ ] Kayıt formu test edildi
- [ ] ✅ Başarılı!

---

## 📞 Yardım

Hala sorun yaşıyorsan, Render logs'unu ve browser console'unu kontrol et.

