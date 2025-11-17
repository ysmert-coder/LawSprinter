# 🚀 Database Quick Start

## Hızlı Kurulum (5 Dakika)

### 1️⃣ Supabase'e Git
https://app.supabase.com → Projenizi seçin

### 2️⃣ SQL Editor'ı Aç
Sol menüden **SQL Editor** → **New Query**

### 3️⃣ Migration'ı Çalıştır
`supabase/migrations/001_initial_schema.sql` dosyasını kopyala → Yapıştır → **Run**

### 4️⃣ Tamamlandı! ✅

Artık şunlar hazır:
- ✅ 11 tablo (multi-tenant)
- ✅ Row Level Security (RLS)
- ✅ Otomatik firm oluşturma
- ✅ Foreign keys & indexes
- ✅ Triggers

---

## 📊 Tablolar

| Tablo | Açıklama |
|-------|----------|
| `firms` | Hukuk büroları |
| `profiles` | Kullanıcı profilleri |
| `clients` | Müvekkiller |
| `cases` | Dosyalar/Davalar |
| `tasks` | Görevler |
| `deadlines` | Süreler |
| `documents` | Belgeler |
| `contracts` | Sözleşmeler (AI analizi) |
| `case_events` | Dava olayları |
| `notifications` | Bildirimler |
| `daily_summaries` | Günlük AI özetleri |

---

## 🔐 Güvenlik

**Multi-Tenant:** Her firma sadece kendi verilerini görür.

**RLS:** Tüm tablolarda aktif. Kullanıcılar:
1. Kendi profillerini görebilir
2. Kendi firmalarının verilerini görebilir

---

## 🧪 Test

### Kayıt Ol
1. `/auth/sign-up` sayfasına git
2. Formu doldur (Ad, Şirket, E-posta, Şifre)
3. Kayıt ol

### Otomatik Oluşturulur
- ✅ Yeni firma (`firms`)
- ✅ Kullanıcı profili (`profiles`)
- ✅ Firma sahibi rolü (`role = 'owner'`)

### Dashboard'a Gir
- ✅ `/dashboard` sayfası açılır
- ✅ Kullanıcı bilgileri görünür
- ✅ Firma adı görünür

---

## 📝 İlk Veri Ekleme

### TypeScript ile

```typescript
import { createClient } from '@/lib/supabaseServer'

// Müvekkil ekle
const { data: client } = await supabase
  .from('clients')
  .insert({
    firm_id: user.firm_id,
    full_name: 'Ahmet Yılmaz',
    email: 'ahmet@example.com',
    phone: '555-1234'
  })
  .select()
  .single()

// Dava ekle
const { data: case } = await supabase
  .from('cases')
  .insert({
    firm_id: user.firm_id,
    client_id: client.id,
    title: 'İş Davası',
    type: 'labor',
    status: 'active'
  })
  .select()
  .single()
```

### SQL ile (Test)

```sql
-- Müvekkil ekle
INSERT INTO clients (firm_id, full_name, email)
VALUES ('your-firm-id', 'Test Müvekkil', 'test@example.com');

-- Dava ekle
INSERT INTO cases (firm_id, client_id, title, type, status)
VALUES ('your-firm-id', 'client-id', 'Test Davası', 'civil', 'active');
```

---

## 🔍 Sık Kullanılan Sorgular

### Firma bilgilerini getir

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*, firms(*)')
  .eq('id', user.id)
  .single()
```

### Aktif davaları listele

```typescript
const { data: cases } = await supabase
  .from('cases')
  .select('*, clients(full_name)')
  .eq('firm_id', firmId)
  .eq('status', 'active')
  .order('created_at', { ascending: false })
```

### Yaklaşan süreleri getir

```typescript
const { data: deadlines } = await supabase
  .from('deadlines')
  .select('*, cases(title)')
  .eq('firm_id', firmId)
  .eq('completed', false)
  .gte('date', new Date().toISOString())
  .order('date', { ascending: true })
  .limit(10)
```

---

## ⚠️ Önemli Notlar

### 1. firm_id Her Zaman Gerekli
```typescript
// ✅ Doğru
.insert({ firm_id: user.firm_id, title: 'Test' })

// ❌ Yanlış
.insert({ title: 'Test' }) // firm_id eksik!
```

### 2. RLS Aktif
```typescript
// Kullanıcı sadece kendi firmasının verilerini görebilir
// firm_id kontrolü otomatik yapılır
```

### 3. Otomatik Alanlar
```typescript
// Bu alanlar otomatik doldurulur:
// - id (UUID)
// - created_at (NOW)
// - updated_at (NOW, trigger ile)
```

---

## 🐛 Sorun Giderme

### "Row Level Security" Hatası
**Sebep:** RLS aktif ama kullanıcı authenticated değil.

**Çözüm:**
```typescript
// Server Component'te
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  redirect('/auth/sign-in')
}
```

### "Foreign Key" Hatası
**Sebep:** İlişkili kayıt bulunamadı.

**Çözüm:**
```typescript
// Önce parent kaydı kontrol et
const { data: client } = await supabase
  .from('clients')
  .select('id')
  .eq('id', clientId)
  .single()

if (!client) {
  throw new Error('Client not found')
}
```

### "firm_id" Bulunamıyor
**Sebep:** Profile'da firm_id yok.

**Çözüm:**
```typescript
// Profile'ı kontrol et
const { data: profile } = await supabase
  .from('profiles')
  .select('firm_id')
  .eq('id', user.id)
  .single()

console.log('Firm ID:', profile.firm_id)
```

---

## 📚 Daha Fazla Bilgi

- **Detaylı Schema:** `DATABASE_SCHEMA.md`
- **Kurulum Rehberi:** `SETUP.md`
- **Proje Yapısı:** `PROJECT_STRUCTURE.md`

---

## ✅ Checklist

- [ ] Supabase projesi oluşturuldu
- [ ] `.env.local` dosyası oluşturuldu
- [ ] Environment variables eklendi
- [ ] Migration çalıştırıldı (`001_initial_schema.sql`)
- [ ] Test kullanıcısı oluşturuldu
- [ ] Dashboard açıldı
- [ ] İlk müvekkil eklendi
- [ ] İlk dava oluşturuldu

Hepsi tamamlandı mı? 🎉 Artık geliştirmeye başlayabilirsiniz!

