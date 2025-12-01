# 🔐 Render Environment Variables

## 📋 Gerekli Environment Variables

Render Dashboard → Your Service → Environment → Add Environment Variable

---

## 🚀 **Hızlı Başlangıç (Mock Embeddings ile Test)**

### **Minimum Gerekli Variables:**

```bash
# Admin Email
ADMIN_EMAIL=salihmrtpayoneer@gmail.com

# Mock Embeddings Endpoint (Test için)
N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL=https://lawsprinter.onrender.com/api/mock/embeddings
```

⚠️ **Not**: Mock endpoint gerçek embedding üretmez, sadece test içindir!

---

## 🎯 **Production için Gerçek n8n Webhook**

n8n workflow'unu kurduktan sonra:

```bash
# Gerçek n8n Embeddings Webhook
N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL=https://your-n8n.cloud/webhook/generate-embeddings
```

---

## 📝 **Tüm Environment Variables (Opsiyonel)**

### **Supabase** (Zaten var olmalı)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### **Admin & Security**
```bash
ADMIN_EMAIL=salihmrtpayoneer@gmail.com
PG_ENCRYPTION_KEY=your-random-32-char-string
```

### **n8n Webhooks - AI Features**
```bash
N8N_CASE_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/case-assistant
N8N_STRATEGY_WEBHOOK_URL=https://your-n8n.com/webhook/strategy
N8N_PLEADING_GENERATOR_WEBHOOK_URL=https://your-n8n.com/webhook/pleading-generate
N8N_PLEADING_REVIEW_WEBHOOK_URL=https://your-n8n.com/webhook/pleading-review
```

### **n8n Webhooks - RAG & Embeddings**
```bash
N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL=https://your-n8n.com/webhook/generate-embeddings
N8N_EMBEDDINGS_WEBHOOK_URL=https://your-n8n.com/webhook/embeddings
```

### **n8n Webhooks - Other Features**
```bash
N8N_CLIENT_PROFILE_WEBHOOK_URL=https://your-n8n.com/webhook/client-profile
N8N_TRAINING_WEBHOOK_URL=https://your-n8n.com/webhook/training
N8N_INVOICE_REMINDER_WEBHOOK_URL=https://your-n8n.com/webhook/invoice-reminder
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=https://your-n8n.com/webhook/contract-analyze
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=https://your-n8n.com/webhook/hearing-followup
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=https://your-n8n.com/webhook/client-status-notify
N8N_DRAFT_GENERATOR_WEBHOOK_URL=https://your-n8n.com/webhook/draft-generator
N8N_COLLECTION_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/collection-assistant
N8N_DRAFT_REVIEWER_WEBHOOK_URL=https://your-n8n.com/webhook/draft-reviewer
```

---

## 🔧 **Nasıl Eklenir?**

### **Render Dashboard'da:**

1. **Services** → **lawsprinter** seç
2. Sol menüden **"Environment"** tıkla
3. **"Add Environment Variable"** butonuna tıkla
4. **Key** ve **Value** gir
5. **"Save Changes"** tıkla
6. **Otomatik redeploy** başlar (2-3 dakika)

---

## ⚠️ **Önemli Notlar**

### **1. Mock Endpoint Kullanımı**
- ✅ **Development/Test**: Hızlı test için kullan
- ❌ **Production**: Gerçek embedding üretmez, sadece dummy data
- 🔄 **Geçiş**: n8n hazır olunca URL'i değiştir

### **2. Güvenlik**
- `PG_ENCRYPTION_KEY`: Güçlü random string kullan
  ```bash
  openssl rand -base64 32
  ```
- API key'leri asla commit etme
- Environment variables'ı `.env.local` dosyasına kopyala (local development için)

### **3. n8n Webhook URL Formatı**
```
https://your-n8n-instance.com/webhook/endpoint-name
```
veya n8n Cloud:
```
https://your-workspace.app.n8n.cloud/webhook/endpoint-name
```

---

## 🧪 **Test Etme**

### **1. Mock Endpoint Test**
```bash
curl -X POST https://lawsprinter.onrender.com/api/mock/embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "test-123",
    "text": "Bu bir test metnidir. En az 50 karakter olmalı ki geçerli olsun.",
    "isPublic": true
  }'
```

### **2. Environment Variable Kontrolü**
Render logs'ta şunu ara:
```
[n8n] Calling GENERATE_EMBEDDINGS webhook: https://...
```

---

## 📊 **Hangi Webhook'lar Zorunlu?**

| Webhook | Zorunlu? | Kullanıldığı Yer |
|---------|----------|------------------|
| `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` | ✅ **Evet** | RAG Import (Admin) |
| `N8N_CASE_ASSISTANT_WEBHOOK_URL` | ⚠️ Önerilen | Dava Asistanı |
| `N8N_STRATEGY_WEBHOOK_URL` | ⚠️ Önerilen | Strateji Merkezi |
| `N8N_PLEADING_GENERATOR_WEBHOOK_URL` | ⚠️ Önerilen | Dilekçe Üretici |
| `N8N_PLEADING_REVIEW_WEBHOOK_URL` | ⚠️ Önerilen | Dilekçe İnceleme |
| Diğerleri | ❌ Opsiyonel | Gelecek özellikler |

---

## 🚀 **Hızlı Başlangıç Checklist**

- [ ] Render'a gir
- [ ] Environment → Add Variable
- [ ] `ADMIN_EMAIL` = `salihmrtpayoneer@gmail.com`
- [ ] `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` = `https://lawsprinter.onrender.com/api/mock/embeddings`
- [ ] Save Changes
- [ ] Deploy bitsin (2-3 dakika)
- [ ] `/admin/rag-import` sayfasına git
- [ ] PDF yükle
- [ ] Çalışmalı! 🎉

---

## 🔄 **Mock'tan Real n8n'e Geçiş**

1. n8n workflow'unu kur (`N8N_EMBEDDINGS_WORKFLOW.md`)
2. Webhook URL'ini kopyala
3. Render → Environment
4. `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` değerini güncelle
5. Save → Redeploy
6. Test et!

