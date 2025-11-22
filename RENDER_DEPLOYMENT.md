# Render Deployment Guide - LawSprinter

## ✅ GitHub Push Tamamlandı!

Commit: `fea4b74`
Branch: `main`
Repository: `https://github.com/ysmert-coder/LawSprinter.git`

**Eklenen Özellikler**:
- ✅ RAG System (Vector embeddings + Hybrid search)
- ✅ Pleading System (Draft generation + Review)
- ✅ CRM (Client management + AI profiling)
- ✅ Accounting (Multi-currency invoices + Installments)
- ✅ Reports (Monthly stats + Yearly trends)
- ✅ Collection Assistant (AI payment reminders)
- ✅ 14 n8n webhook integrations
- ✅ 3 new Supabase migrations

**Dosya İstatistikleri**:
- 74 dosya değişti
- +16,380 satır eklendi
- -1,554 satır silindi

---

## 🚀 Render Deployment Adımları

### Otomatik Deployment (Önerilen)

Eğer Render'da **Auto-Deploy** aktifse:

1. ✅ **GitHub push tamamlandı** (yukarıda)
2. ⏳ **Render otomatik deploy başlatacak** (1-2 dakika içinde)
3. 🔍 **Deployment'ı izleyin**: https://dashboard.render.com

**Deployment süresi**: ~5-10 dakika

---

### Manuel Deployment (Gerekirse)

Eğer auto-deploy yoksa:

1. **Render Dashboard'a gidin**: https://dashboard.render.com
2. **LawSprinter service'ini seçin**
3. **"Manual Deploy"** butonuna tıklayın
4. **Branch**: `main` seçin
5. **"Deploy"** butonuna tıklayın

---

## 🔧 Environment Variables Kontrolü

Render'da bu environment variable'ların tanımlı olduğundan emin olun:

### Supabase
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### n8n Webhooks (14 adet)
```bash
# Core Features
N8N_CASE_ASSISTANT_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/case-assistant
N8N_STRATEGY_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/strategy

# Client & Training
N8N_CLIENT_PROFILE_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/client-profile
N8N_TRAINING_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/training

# Accounting
N8N_INVOICE_REMINDER_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/invoice-reminder
N8N_COLLECTION_ASSISTANT_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/collection-assistant

# Legal Documents
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/contract-analyze
N8N_DRAFT_GENERATOR_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/draft-generator
N8N_DRAFT_REVIEWER_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/draft-reviewer

# Pleading System (YENİ)
N8N_PLEADING_GENERATOR_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/pleading-generator
N8N_PLEADING_REVIEW_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/pleading-review

# Notifications
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/hearing-followup
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/client-status-notify

# RAG System (YENİ)
N8N_EMBEDDINGS_WEBHOOK_URL=https://your-n8n.app.n8n.cloud/webhook/generate-embeddings
```

### Diğer
```bash
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-app.onrender.com
```

---

## 📊 Supabase Migrations

Yeni migration'lar eklendi. Supabase'de uygulanması gerekiyor:

### 1. Accounting Enhancements
**Dosya**: `supabase/migrations/005_accounting_enhancements.sql`

**Özellikler**:
- Multi-currency support (TRY, USD, EUR, GBP)
- Invoice installments
- Payment tracking
- Exchange rates

**Uygulama**:
```bash
# Option 1: Supabase CLI
supabase db push

# Option 2: Supabase Dashboard
# SQL Editor → Paste migration → Run
```

### 2. Invoice Installments
**Dosya**: `supabase/migrations/006_invoice_installments.sql`

**Özellikler**:
- Installment plans
- Payment schedules
- Status tracking

### 3. RAG System
**Dosya**: `supabase/migrations/006_rag_system.sql`

**Özellikler**:
- pgvector extension
- rag_public_docs & rag_public_chunks
- rag_private_docs & rag_private_chunks
- Vector similarity search
- RLS policies

**ÖNEMLİ**: Bu migration pgvector extension gerektirir!

---

## 🧪 Post-Deployment Checklist

Deployment tamamlandıktan sonra:

### 1. Health Check
```bash
curl https://your-app.onrender.com/api/health
```

### 2. Supabase Connection
- Dashboard'a giriş yapabilme
- Veri görüntüleme

### 3. n8n Webhooks Test
```bash
# Test Case Assistant
curl -X POST https://your-app.onrender.com/api/case-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"fileUrl":"test.pdf","caseType":"labor","shortDescription":"test"}'
```

### 4. Yeni Özellikler Test

#### RAG System
```bash
# Import test document
curl -X POST https://your-app.onrender.com/api/rag/import-public \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","docType":"ictihat","rawText":"Test content"}'

# Search
curl -X POST https://your-app.onrender.com/api/rag/search \
  -H "Content-Type: application/json" \
  -d '{"query":"test","limit":5}'
```

#### Pleading System
```bash
# Generate
curl -X POST https://your-app.onrender.com/api/pleading-generate \
  -H "Content-Type: application/json" \
  -d '{"caseType":"ceza","shortDescription":"Test case"}'

# Review
curl -X POST https://your-app.onrender.com/api/pleading-review \
  -H "Content-Type: application/json" \
  -d '{"caseType":"ceza","existingText":"Test pleading"}'
```

### 5. UI Test
- ✅ `/dilekce-uretici` - Pleading Generator
- ✅ `/dilekce-inceleme` - Pleading Review
- ✅ `/musteri-yonetimi` - CRM
- ✅ `/muhasebe` - Accounting
- ✅ `/raporlama` - Reports
- ✅ `/dosyalar/[id]` - Case detail with Draft Generator/Reviewer

---

## 🐛 Troubleshooting

### Deployment Failed

**Çözüm**:
1. Render logs'a bakın
2. Build errors kontrol edin
3. Environment variables kontrol edin

### Database Connection Error

**Çözüm**:
1. Supabase credentials kontrol edin
2. Supabase project aktif mi kontrol edin
3. RLS policies kontrol edin

### n8n Webhook Errors

**Çözüm**:
1. n8n workflows aktif mi kontrol edin
2. Webhook URLs doğru mu kontrol edin
3. n8n execution logs kontrol edin

### Migration Errors

**Çözüm**:
1. pgvector extension kurulu mu kontrol edin:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
2. Migration'ları sırayla uygulayın
3. Supabase logs kontrol edin

---

## 📈 Monitoring

### Render Dashboard
- **Metrics**: CPU, Memory, Response time
- **Logs**: Real-time application logs
- **Deploys**: Deployment history

### Supabase Dashboard
- **Database**: Table sizes, queries
- **Auth**: User activity
- **Storage**: File uploads
- **Logs**: Database logs

### n8n Dashboard
- **Executions**: Workflow runs
- **Errors**: Failed executions
- **Performance**: Execution times

---

## 🔄 Rollback (Gerekirse)

Eğer deployment'ta sorun olursa:

### Option 1: Render Dashboard
1. **Deploys** sekmesine gidin
2. Önceki başarılı deployment'ı bulun
3. **"Rollback to this deploy"** tıklayın

### Option 2: Git Revert
```bash
# Son commit'i geri al
git revert fea4b74

# Push
git push origin main
```

---

## 📊 Deployment Özeti

### Yeni Özellikler (Production'da)
1. ✅ **RAG System**: Vector search + Hybrid retrieval
2. ✅ **Pleading System**: AI draft generation + review
3. ✅ **CRM**: Client 360° view + AI profiling
4. ✅ **Accounting**: Multi-currency + Installments
5. ✅ **Reports**: Analytics dashboard
6. ✅ **Collection Assistant**: AI payment reminders

### API Endpoints (Yeni)
- `/api/rag/import-public` - RAG document import
- `/api/rag/search` - Hybrid search
- `/api/pleading-generate` - Draft generation
- `/api/pleading-review` - Draft review
- `/api/clients/*` - CRM endpoints
- `/api/accounting/*` - Accounting endpoints
- `/api/reports/*` - Reports endpoints

### UI Routes (Yeni)
- `/dilekce-uretici` - Pleading generator
- `/dilekce-inceleme` - Pleading review
- `/musteri-yonetimi` - CRM
- `/muhasebe` - Accounting
- `/raporlama` - Reports
- `/dosyalar/[id]` - Case detail

### Database Changes
- 3 new migrations
- 8 new tables (RAG + Accounting)
- pgvector extension
- New RLS policies

---

## ✅ Success Criteria

Deployment başarılı sayılır eğer:

1. ✅ Build successful (no errors)
2. ✅ Health check returns 200
3. ✅ Dashboard loads
4. ✅ Login works
5. ✅ New features accessible
6. ✅ No console errors
7. ✅ Database migrations applied
8. ✅ n8n webhooks responding

---

## 🎉 Sonuç

**GitHub Push**: ✅ Tamamlandı  
**Commit**: `fea4b74`  
**Branch**: `main`  
**Files Changed**: 74  
**Lines Added**: +16,380  

**Render Deployment**: ⏳ Otomatik başlayacak (veya manuel tetikleyin)

**Tahmini Süre**: 5-10 dakika

**Monitoring**: https://dashboard.render.com

---

## 📚 İlgili Dokümantasyon

- **RAG System**: `RAG_SYSTEM_SETUP.md`
- **Pleading System**: `PLEADING_SYSTEM.md`
- **CRM**: `CRM_IMPLEMENTATION.md`
- **Accounting**: `ACCOUNTING_IMPLEMENTATION_SUMMARY.md`
- **Reports**: `REPORTS_IMPLEMENTATION.md`
- **n8n Integration**: `N8N_INTEGRATION.md`

---

## 🆘 Destek

Sorun olursa:
1. Render logs kontrol edin
2. Supabase logs kontrol edin
3. n8n execution logs kontrol edin
4. GitHub issues açın
5. Dokümantasyona bakın

**Deployment başarılı olsun! 🚀**

