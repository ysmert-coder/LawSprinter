# LawSprinter Kurulum Rehberi

Bu rehber, LawSprinter projesini yerel ortamınızda çalıştırmak için gereken adımları içerir.

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn
- Supabase hesabı (ücretsiz)

## 🚀 Kurulum Adımları

### 1. Bağımlılıkları Yükleyin

```bash
npm install
```

### 2. Supabase Projesi Oluşturun

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. Project Settings > API bölümünden aşağıdaki bilgileri alın:
   - Project URL
   - anon/public key

### 3. Environment Variables Ayarlayın

**ÖNEMLİ**: Tüm environment variable'lar ve n8n webhook URL'leri hazır!

Root dizinde `.env.local` dosyası oluşturun ve `ENV_SETUP.md` dosyasındaki içeriği kopyalayın.

**Hızlı Kurulum**:
```bash
# ENV_SETUP.md dosyasındaki .env.local içeriğini kopyalayın
# Supabase URL ve key'leri doldurun
# n8n webhook URL'leri zaten hazır (localhost:5678)
```

Detaylı bilgi için: **`ENV_SETUP.md`** dosyasına bakın.

```bash
# .env.local

# Supabase Configuration (ZORUNLU)
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# n8n Webhook URLs (OPSİYONEL - Otomasyon için)
# Sözleşme analizi için webhook
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=

# Duruşma takibi için webhook
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=

# Müvekkil bilgilendirme için webhook
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=
```

**ÖNEMLİ:** 
- `.env.local` dosyası git'e eklenmez. Değerlerinizi güvenli tutun.
- n8n webhook URL'leri opsiyoneldir. Otomasyonları kullanmak istiyorsanız n8n kurulumundan sonra ekleyebilirsiniz.

### 4. Supabase Database Schema Oluşturun

**ÖNEMLİ:** Database schema'yı iki migration dosyasında bulabilirsiniz:
- `supabase/migrations/001_initial_schema.sql` - Ana tablolar
- `supabase/migrations/002_additional_tables.sql` - Ek özellikler için tablolar

**Kurulum Adımları:**

1. Supabase Dashboard'a gidin: https://app.supabase.com
2. Projenizi seçin
3. Sol menüden **SQL Editor** seçin
4. **New Query** butonuna tıklayın
5. Önce `supabase/migrations/001_initial_schema.sql` dosyasının içeriğini kopyalayıp yapıştırın
6. **Run** butonuna tıklayın
7. Ardından `supabase/migrations/002_additional_tables.sql` dosyasını da aynı şekilde çalıştırın

**Schema Özellikleri:**

- ✅ Multi-tenant (çok kiracılı) yapı
- ✅ 15 tablo (firms, profiles, clients, cases, tasks, deadlines, documents, contracts, case_events, notifications, daily_summaries, client_messages, training_scenarios, training_results, case_finances)
- ✅ Row Level Security (RLS) tüm tablolarda aktif
- ✅ Otomatik firm ve profile oluşturma (signup trigger)
- ✅ Foreign key ilişkileri
- ✅ Indexler (performans için)
- ✅ Updated_at trigger'ları
- ✅ Enum type'lar (status, priority, vs.)

**Alternatif Yöntem (Manuel):**

Eğer dosyayı kopyalamak istemezseniz, aşağıdaki kısa komutu çalıştırın:

```sql
-- Hızlı test için minimal schema
-- Tam schema için supabase/migrations/001_initial_schema.sql kullanın

-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Firms
CREATE TABLE firms (id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), name TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());

-- Profiles  
CREATE TABLE profiles (id UUID PRIMARY KEY REFERENCES auth.users(id), firm_id UUID REFERENCES firms(id), email TEXT NOT NULL, full_name TEXT, role TEXT DEFAULT 'owner', created_at TIMESTAMPTZ DEFAULT NOW());

-- Auto-create firm on signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
DECLARE new_firm_id UUID;
BEGIN
  INSERT INTO firms (name) VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Firm')) RETURNING id INTO new_firm_id;
  INSERT INTO profiles (id, firm_id, email, full_name, role) VALUES (NEW.id, new_firm_id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Enable RLS
ALTER TABLE firms ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users view own firm" ON firms FOR SELECT USING (id IN (SELECT firm_id FROM profiles WHERE id = auth.uid()));
```

**Not:** Yukarıdaki minimal schema sadece test içindir. Production için mutlaka `001_initial_schema.sql` dosyasını kullanın.

### 5. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Tarayıcınızda [http://localhost:3000](http://localhost:3000) adresini açın.

## 🎯 İlk Kullanım

1. Ana sayfada "Ücretsiz Başla" butonuna tıklayın
2. Kayıt formunu doldurun:
   - Ad Soyad
   - Şirket Adı
   - E-posta
   - Şifre (min 6 karakter)
3. Kayıt olduktan sonra otomatik olarak dashboard'a yönlendirileceksiniz

## 📁 Proje Yapısı

```
lawsprinter/
├── app/
│   ├── auth/
│   │   ├── sign-in/page.tsx      # Giriş sayfası
│   │   └── sign-up/page.tsx      # Kayıt sayfası
│   ├── dashboard/
│   │   ├── layout.tsx            # Dashboard layout (sidebar)
│   │   ├── sidebar.tsx           # Sidebar component
│   │   ├── signout-button.tsx    # Sign out wrapper
│   │   └── page.tsx              # Dashboard ana sayfa (gerçek veri)
│   ├── cases/                    # Dosyalar sayfası
│   ├── deadlines/                # Süreler sayfası
│   ├── contracts/                # Sözleşme Radar
│   ├── clients/                  # Müşteri Yönetimi
│   ├── dava-asistani/            # AI Dava Asistanı
│   ├── dava-strateji/            # Dava Strateji Merkezi
│   ├── muhasebe/                 # Muhasebe
│   ├── reports/                  # Raporlama
│   ├── settings/                 # Ayarlar
│   ├── _deprecated/              # Devre dışı özellikler
│   ├── api/
│   │   └── contracts/analyze/    # Contract AI analysis endpoint
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Landing page
├── lib/
│   ├── supabaseBrowser.ts        # Client-side Supabase
│   ├── supabaseServer.ts         # Server-side Supabase
│   ├── n8n.ts                    # n8n webhook helpers
│   └── services/                 # Service layer
│       ├── cases.ts
│       ├── contracts.ts
│       ├── deadlines.ts
│       ├── caseEvents.ts
│       └── dailySummaries.ts
├── types/
│   └── database.ts               # Database types (generated)
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql
│       └── 002_additional_tables.sql
├── middleware.ts                 # Auth middleware (protected routes)
└── .env.local                    # Environment variables (create this)
```

## 🔐 Authentication Flow

1. **Kayıt (Sign Up):**
   - Kullanıcı `/auth/sign-up` sayfasından kayıt olur
   - Supabase Auth kullanıcı oluşturur
   - Trigger otomatik olarak `profiles` tablosuna kayıt ekler
   - Kullanıcı `/dashboard` sayfasına yönlendirilir

2. **Giriş (Sign In):**
   - Kullanıcı `/auth/sign-in` sayfasından giriş yapar
   - Supabase Auth oturumu doğrular
   - Middleware korumalı sayfalara erişim sağlar
   - Kullanıcı `/dashboard` sayfasına yönlendirilir

3. **Protected Routes:**
   - Tüm ana sayfalar middleware ile korunur:
     - `/dashboard`, `/cases`, `/deadlines`, `/contracts`, `/clients`
     - `/dava-asistani`, `/dava-strateji`
     - `/muhasebe`, `/reports`, `/settings`
   - Oturum yoksa `/auth/sign-in` sayfasına yönlendirilir
   - Oturum varsa auth sayfalarından `/dashboard`'a yönlendirilir

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

1. **Dashboard** - Gerçek verilerle çalışan özet ekranı
   - Kritik işler, yaklaşan süreler
   - Müvekkilden bekleyen işler
   - Sözleşme radar özeti
   - Dosya dağılımı ve aylık istatistikler

2. **Dosyalar (/cases)** - Dosya yönetimi
   - Tüm dosyaları listeleme
   - Arama ve filtreleme
   - Yeni dosya oluşturma
   - Müvekkil ve süre bilgileri

3. **Süreler (/deadlines)** - Süre takibi
   - Bugün, bu hafta, gelecek hafta özeti
   - Süre listesi ve filtreleme
   - Yeni süre ekleme
   - Öncelik seviyesi gösterimi

4. **Sözleşme Radar (/contracts)** - Sözleşme yönetimi
   - Sözleşme listesi ve durum takibi
   - **AI ile Analiz Et** butonu (n8n entegrasyonu)
   - Yenileme süresi ekleme
   - Risk skoru gösterimi

5. **Müşteri Yönetimi (/clients)** - Müvekkil takibi
   - Müvekkil listesi ve detayları
   - İletişim paneli (placeholder)
   - AI mesaj taslağı (gelecek özellik)
   - Müşteri profili analizi (gelecek özellik)

6. **Dava Asistanı (/dava-asistani)** - AI destekli analiz
   - Dosya yükleme alanı
   - Dava türü seçimi
   - AI ile savunma iskeleti oluşturma (placeholder)

7. **Dava Strateji Merkezi (/dava-strateji)** - Hukuk alanlarına özel AI
   - Ceza, Gayrimenkul, İcra, Aile hukuku
   - Alan bazlı strateji üretimi (placeholder)

8. **Muhasebe (/muhasebe)** - Gelir-gider takibi
   - Alacak ve tahsilat özeti
   - Gelir-gider listesi
   - Ödeme hatırlatma (n8n entegrasyonu hazır)

10. **Raporlama (/reports)** - Metrikler ve analizler
    - Aylık dosya ve finansal özet
    - Dosya dağılımı grafikleri
    - Dışa aktarma seçenekleri (placeholder)

11. **Ayarlar (/settings)** - Sistem ayarları
    - Kullanıcı profili
    - Firma bilgileri
    - n8n entegrasyon durumu
    - Bildirim tercihleri (placeholder)

### 🔄 n8n Entegrasyonu

Proje n8n webhook entegrasyonu için hazır:

- **Dava Asistanı (CASE_ASSISTANT):** `/api/case-assistant` - Dosya analizi ve savunma stratejisi
- **Strateji Merkezi (STRATEGY):** `/api/strategy` - Alan bazlı hukuki strateji önerileri
- **Müşteri Profili (CLIENT_PROFILE):** `/api/clients/[id]/messages` - İletişim analizi
- **Tahsilat Asistanı (COLLECTION_ASSISTANT):** `/api/accounting/collection-assistant` - Ödeme hatırlatma mesajları
- **Sözleşme Analizi (CONTRACT_ANALYZE):** `/api/contracts/analyze` - Sözleşme risk analizi
- **Duruşma Takibi (HEARING_FOLLOWUP):** Webhook hazır (gelecek özellik)
- **Müvekkil Bildirimleri (CLIENT_STATUS_NOTIFY):** Webhook hazır (gelecek özellik)

**RAG (Retrieval-Augmented Generation) Desteği:**

CASE_ASSISTANT ve STRATEGY webhook'ları RAG sistemi ile entegre edilebilir:
- `sources`: Emsal kararlar ve yasal kaynaklar (Yargıtay kararları, kanunlar)
- `confidenceScore`: AI güven skoru (0-1 arası)
- `similarity`: Kaynak benzerlik skoru (vektör araması)

Detaylı bilgi için `N8N_INTEGRATION.md` dosyasına bakın.

**TypeScript Tipleri:**

Tüm AI response tipleri `lib/types/ai.ts` dosyasında tanımlıdır:
- `LegalSource`: Hukuki kaynak yapısı
- `CaseAssistantResponse`: Dava asistanı cevap tipi
- `StrategyResponse`: Strateji cevap tipi
- `CaseAssistantRequest`: Dava asistanı istek tipi
- `StrategyRequest`: Strateji istek tipi

**Not:** Tüm AI mesajları taslak niteliğindedir ve avukat onayı gerektirir. Otomatik gönderim yapılmaz.

### 🎨 UI/UX Özellikleri

- ✅ Modern, responsive Tailwind CSS tasarımı
- ✅ Türkçe dil desteği
- ✅ Active route highlighting
- ✅ Loading states ve error handling
- ✅ Empty state mesajları
- ✅ Modal ve form componentleri
- ✅ Filtreleme ve arama özellikleri

## 🛠️ Geliştirme

### Database Types Güncelleme

Supabase'de schema değişikliği yaptıktan sonra:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/database.ts
```

### Build

```bash
npm run build
```

### Production

```bash
npm run start
```

## 🐛 Sorun Giderme

### "Missing Supabase environment variables" Hatası

- `.env.local` dosyasının root dizinde olduğundan emin olun
- Environment variable isimlerinin doğru olduğunu kontrol edin
- Geliştirme sunucusunu yeniden başlatın

### Giriş/Kayıt Çalışmıyor

- Supabase projesinin aktif olduğunu kontrol edin
- API key'lerin doğru olduğunu doğrulayın
- Browser console'da hata mesajlarını kontrol edin

### Database Hatası

- SQL komutlarının tamamının çalıştırıldığından emin olun
- RLS (Row Level Security) policy'lerinin doğru olduğunu kontrol edin

## 📚 Daha Fazla Bilgi

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🤝 Destek

Sorun yaşarsanız veya sorularınız varsa:
- GitHub Issues açın
- Dokümantasyonu inceleyin
- Supabase Discord kanalına katılın

