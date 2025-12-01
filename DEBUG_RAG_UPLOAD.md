# 🔍 RAG Upload Hata Ayıklama

## Olası Sorunlar ve Çözümler:

### 1. ❌ **Supabase Storage Bucket Yok**
**Semptom**: "Dosya yüklenemedi" hatası

**Çözüm**:
1. Supabase Dashboard → Storage
2. `rag_public` bucket'ı var mı kontrol et
3. Yoksa oluştur:
   - Name: `rag_public`
   - Public: ✅ **Yes**

---

### 2. ❌ **Storage Policies Eksik**
**Semptom**: 403 Forbidden veya "Dosya yüklenemedi"

**Çözüm - SQL Editor'da Çalıştır**:
```sql
-- Public read access
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'rag_public');

-- Admin upload access
CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rag_public' 
  AND auth.email() = 'salihmrtpayoneer@gmail.com'
);

-- Admin update access
CREATE POLICY "Admin update access"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'rag_public' 
  AND auth.email() = 'salihmrtpayoneer@gmail.com'
);

-- Admin delete access
CREATE POLICY "Admin delete access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rag_public' 
  AND auth.email() = 'salihmrtpayoneer@gmail.com'
);
```

---

### 3. ❌ **Migration Çalışmadı (Tablolar Yok)**
**Semptom**: "public_legal_docs does not exist" hatası

**Çözüm**:
- Migration SQL'i çalıştır (007_billing_and_plans.sql)
- Tablolar oluşturulmalı:
  - `public_legal_docs`
  - `public_legal_chunks`
  - `firm_billing`
  - `firm_ai_settings`
  - `ai_usage_log`

---

### 4. ❌ **PDF Parse Kütüphanesi Eksik**
**Semptom**: "Dosya işlenemedi" hatası

**Çözüm**:
```bash
npm install pdf-parse mammoth
```

---

### 5. ❌ **n8n Webhook URL Eksik**
**Semptom**: "Embedding oluşturulamadı" hatası

**Çözüm - Render Environment Variables**:
- `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` = (n8n webhook URL'in)

---

### 6. ❌ **Admin Email Eşleşmiyor**
**Semptom**: "Admin yetkisi gerekli" hatası (403)

**Çözüm**:
1. Render Environment Variables:
   - `ADMIN_EMAIL` = `salihmrtpayoneer@gmail.com`
2. Giriş yaptığın email bu olmalı

---

## 🧪 Test Adımları:

### 1. **Browser Console'u Aç** (F12)
```javascript
// Network tab'ında /api/rag/import/public isteğini bul
// Response'u kontrol et:
// - Status: 401 → Auth sorunu
// - Status: 403 → Admin yetkisi yok
// - Status: 400 → Validation hatası
// - Status: 500 → Backend hatası
```

### 2. **Supabase Logs'u Kontrol Et**
- Supabase Dashboard → Logs → API Logs
- Storage hatalarını ara

### 3. **Render Logs'u Kontrol Et**
- Render Dashboard → Logs
- `[RAG Import]` ile başlayan logları ara

---

## 🔧 Hızlı Test:

### Test 1: Storage Erişimi
```sql
-- SQL Editor'da çalıştır:
SELECT * FROM storage.buckets WHERE name = 'rag_public';
-- Sonuç geliyorsa bucket var
```

### Test 2: Tablolar
```sql
-- SQL Editor'da çalıştır:
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('public_legal_docs', 'public_legal_chunks');
-- İki tablo da görünmeli
```

### Test 3: Admin Kontrolü
```sql
-- SQL Editor'da çalıştır (giriş yaptıktan sonra):
SELECT auth.email();
-- Sonuç: salihmrtpayoneer@gmail.com olmalı
```

---

## 📋 Checklist:

- [ ] Supabase'de `rag_public` bucket var mı?
- [ ] Storage policies oluşturuldu mu?
- [ ] Migration çalıştırıldı mı? (tablolar var mı?)
- [ ] `pdf-parse` ve `mammoth` yüklü mü?
- [ ] Render'da `ADMIN_EMAIL` env var mı?
- [ ] Render'da `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` var mı?
- [ ] Admin email ile giriş yapıldı mı?

---

## 🚨 Acil Çözüm (Tüm Adımlar):

```bash
# 1. Dependencies
npm install pdf-parse mammoth uuid

# 2. Supabase SQL Editor'da:
# - Migration SQL'i çalıştır (007_billing_and_plans.sql)
# - Storage policies SQL'i çalıştır

# 3. Supabase Storage:
# - rag_public bucket oluştur (Public: Yes)

# 4. Render Environment:
# - ADMIN_EMAIL = salihmrtpayoneer@gmail.com
# - N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL = (webhook URL)
# - PG_ENCRYPTION_KEY = (random string)

# 5. Deploy
git add -A
git commit -m "fix: RAG upload dependencies and setup"
git push origin main
```

