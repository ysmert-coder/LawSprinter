# ⚖️ LawSprinter

**AI-Powered Legal SaaS Platform** - Türk Hukuk Bürolarına Özel Akıllı Yönetim Sistemi

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-green)](https://supabase.com/)
[![n8n](https://img.shields.io/badge/n8n-Automation-orange)](https://n8n.io/)
[![DeepSeek](https://img.shields.io/badge/DeepSeek-AI-purple)](https://deepseek.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8)](https://tailwindcss.com/)

---

## 🚀 Özellikler

### 🤖 AI-Powered Özellikler
- **Dava Asistanı**: Otomatik dava analizi, savunma stratejisi ve yapılacaklar listesi
- **Strateji Merkezi**: Hukuk alanına göre detaylı strateji önerileri
- **Müşteri Profil Analizi**: AI ile müşteri psikolojisi ve iletişim tarzı analizi
- **Avukat Akademi**: Seviye bazlı eğitim içeriği üretimi
- **Akıllı Hatırlatmalar**: Nazik ve profesyonel ödeme hatırlatma mesajları

### 📋 Dosya & Süre Yönetimi
- Dava dosyaları yönetimi (Ceza, Medeni, İş, Aile, Ticaret, İdare, İcra)
- Süre takibi ve kritik tarih hatırlatmaları
- Sözleşme radar sistemi
- Duruşma takibi

### 💼 Müşteri Yönetimi
- Müvekkil profil yönetimi
- İletişim geçmişi
- Dosya bazlı müşteri görünümleri

### 💰 Muhasebe
- Fatura oluşturma ve takibi
- Ödeme hatırlatmaları
- Gelir-gider raporları

### 📊 Dashboard & Raporlama
- Gerçek zamanlı istatistikler
- Grafik ve tablolar
- Dosya dağılımı analizi

---

## 🛠️ Teknoloji Stack

### Frontend
- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Modern UI
- **Headless UI** - Accessible components

### Backend
- **Supabase** - Database, Auth, Storage
- **PostgreSQL** - Relational database
- **pgvector** ✨ NEW! - Vector similarity search
- **Row Level Security** - Multi-tenant güvenlik

### AI & Automation
- **DeepSeek Chat Model** - Cost-effective AI ($0.14/1M tokens)
- **n8n** - Workflow automation
- **LangChain** - AI orchestration

### Deployment
- **Vercel** - Hosting & CI/CD
- **Railway/Render** - n8n hosting

---

## 📦 Kurulum

### Gereksinimler
- Node.js 18.x veya üzeri
- npm veya yarn
- Supabase hesabı (ücretsiz)
- n8n instance (lokal veya cloud)
- DeepSeek API key (ücretsiz)

### 1. Repository'yi Clone Edin
```bash
git clone https://github.com/ysmert-coder/LawSprinter.git
cd LawSprinter
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Environment Variables
`.env.local` dosyası oluşturun (detaylar için `ENV_SETUP.md`):
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key

# n8n Webhooks
N8N_CASE_ASSISTANT_WEBHOOK_URL=http://localhost:5678/webhook/case-assistant
# ... diğer webhook'lar
```

### 4. Supabase Database Kurulumu
```bash
# Migration dosyalarını çalıştırın
# Supabase SQL Editor'de:
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_additional_tables.sql
supabase/migrations/003_extended_features.sql
supabase/migrations/004_rag_legal_knowledge.sql  # ✨ NEW! RAG System
```

### 5. n8n Workflow'larını Kurun
- n8n'i başlatın: `npx n8n`
- DeepSeek API key ekleyin
- Workflow'ları import edin (detaylar: `N8N_AI_SETUP.md`)

### 6. Uygulamayı Başlatın
```bash
npm run dev
```

Tarayıcıda açın: http://localhost:3000

---

## 📚 Dokümantasyon

### Kurulum & Setup
- **`SETUP.md`** - Genel kurulum rehberi
- **`ENV_SETUP.md`** - Environment variables ve webhook setup
- **`DATABASE_SCHEMA.md`** - Database yapısı ve tablolar
- **`RAG_SYSTEM_SETUP.md`** ⭐ **NEW!** - RAG sistemi ve pgvector kurulumu

### n8n & AI Entegrasyonu
- **`N8N_AI_SETUP.md`** ⭐ - AI workflow'ları detaylı kurulum
- **`N8N_INTEGRATION.md`** - n8n genel entegrasyon
- **`AI_WORKFLOWS_SUMMARY.md`** - AI özet rapor

### Deploy
- **`GITHUB_VERCEL_DEPLOY.md`** ⭐ - GitHub ve Vercel deploy rehberi

---

## 🌐 Vercel'e Deploy

### Hızlı Deploy (5 Dakika)

1. **GitHub'a Push**:
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Vercel'e Import**:
- https://vercel.com adresine gidin
- "Import Project" > GitHub'dan `LawSprinter` seçin
- Environment variables ekleyin
- Deploy!

3. **Production URL**:
- `https://your-app.vercel.app`
- Custom domain: `www.lawsprinter.com`

**Detaylı rehber**: `GITHUB_VERCEL_DEPLOY.md`

---

## 🤖 AI Workflow'lar

### 5 AI-Powered Workflow (DeepSeek)

| Workflow | Özellik | Token/Request | Maliyet |
|----------|---------|---------------|---------|
| **Case Assistant** | Dava analizi, savunma stratejisi | 3500 | $0.0007 |
| **Strategy Generator** | Hukuk alanına göre strateji | 4000 | $0.0008 |
| **Client Profile** | Müşteri psikoloji analizi | 2500 | $0.0005 |
| **Training Generator** | Eğitim içeriği üretimi | 5000 | $0.0010 |
| **Invoice Reminder** | Hatırlatma mesajları | 800 | $0.0002 |

**Toplam Maliyet**: ~$3/ay (1000 request için) 🎉

---

## 📊 Database Schema

### Ana Tablolar
- `firms` - Hukuk büroları
- `profiles` - Kullanıcı profilleri
- `clients` - Müvekkillar
- `cases` - Dava dosyaları
- `deadlines` - Süre takibi
- `contracts` - Sözleşmeler
- `case_events` - Dosya olayları
- `documents` - Belgeler
- `invoices` - Faturalar
- `client_messages` - Müşteri mesajları
- `client_profiles` - AI profil analizleri

### RAG Tabloları ✨ NEW!
- `legal_documents` - Hukuk bilgi tabanı (Yargıtay, mevzuat, doktrin)
- `legal_chunks` - Vektör embeddingler ile semantik arama
- `private_case_chunks` - Dosya bazlı özel bilgi (kullanıcı yüklemeleri)

**Detaylı şema**: `DATABASE_SCHEMA.md` | **RAG Dokümantasyonu**: `RAG_SYSTEM_SETUP.md`

---

## 🔐 Güvenlik

### Multi-Tenant Architecture
- Row Level Security (RLS) ile veri izolasyonu
- Firm bazlı veri erişimi
- Authenticated routes

### Environment Variables
- Supabase credentials
- n8n webhook URLs
- DeepSeek API keys
- Asla commit edilmez (`.gitignore`)

### API Security
- n8n webhook authentication
- Rate limiting
- HTTPS only (production)

---

## 🎯 Roadmap

### v1.0 (Mevcut)
- ✅ Dashboard & istatistikler
- ✅ Dosya & süre yönetimi
- ✅ Müşteri yönetimi
- ✅ Muhasebe
- ✅ 5 AI workflow
- ✅ Türkçe hukuk terminolojisi

### v1.1 (Planlanan)
- [ ] Mobil uygulama
- [ ] WhatsApp entegrasyonu
- [ ] E-imza sistemi
- [ ] Otomatik belge oluşturma
- [ ] Takvim entegrasyonu
- [ ] Email bildirimler

### v2.0 (Gelecek)
- [x] **RAG (Retrieval Augmented Generation)** ✨ NEW!
- [x] **Emsal karar veritabanı** (pgvector + semantic search) ✨ NEW!
- [ ] Gelişmiş raporlama
- [ ] Multi-language support
- [ ] API marketplace

---

## 💻 Geliştirme

### Proje Yapısı
```
LawSprinter/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── cases/             # Case management
│   ├── deadlines/         # Deadline tracking
│   ├── contracts/         # Contract radar
│   ├── clients/           # Client management
│   ├── dava-asistani/     # AI Case Assistant
│   ├── dava-strateji/     # Strategy Center
│   ├── akademi/           # Lawyer Academy
│   ├── muhasebe/          # Accounting
│   └── api/               # API routes
├── lib/                   # Utilities & services
│   ├── services/          # Supabase services
│   ├── supabaseServer.ts  # Server client
│   ├── supabaseBrowser.ts # Browser client
│   └── n8n.ts             # n8n helper
├── components/            # React components
├── supabase/             # Database migrations
│   └── migrations/
├── types/                # TypeScript types
└── public/               # Static files
```

### Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📄 Lisans

Bu proje özel bir projedir. Kullanım için izin gereklidir.

---

## 👥 İletişim

- **GitHub**: [@ysmert-coder](https://github.com/ysmert-coder)
- **Email**: shopifysmert@gmail.com
- **Repository**: https://github.com/ysmert-coder/LawSprinter

---

## 🙏 Teşekkürler

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [n8n](https://n8n.io/)
- [DeepSeek](https://deepseek.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Vercel](https://vercel.com/)

---

## 📈 İstatistikler

- **8 Aktif Workflow** (5 AI-powered)
- **15 Database Tablosu** (3 RAG tablosu eklendi ✨)
- **15+ Sayfa/Ekran**
- **TypeScript %100**
- **Türkçe Yerelleştirme**
- **Multi-tenant Architecture**
- **pgvector Semantic Search** ✨ NEW!

---

**Made with ❤️ for Turkish Law Offices**

*LawSprinter - Hukuk Bürolarına Özel AI-Powered SaaS Platform*
