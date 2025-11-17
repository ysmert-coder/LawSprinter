# Environment Variables Setup

## 📋 `.env.local` Dosyası Oluşturma

Proje kök dizininde `.env.local` dosyası oluşturun ve aşağıdaki içeriği ekleyin:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# n8n Webhook URLs
# All workflows are created and active in your n8n instance
# Base URL: http://localhost:5678 (or your n8n production URL)

# Case Assistant - AI-powered case analysis
N8N_CASE_ASSISTANT_WEBHOOK_URL=http://localhost:5678/webhook/case-assistant

# Strategy Generator - Legal strategy generation by area
N8N_STRATEGY_WEBHOOK_URL=http://localhost:5678/webhook/strategy

# Client Profile Analyzer - AI client communication analysis
N8N_CLIENT_PROFILE_WEBHOOK_URL=http://localhost:5678/webhook/client-profile

# Training Content Generator - Lawyer academy content
N8N_TRAINING_WEBHOOK_URL=http://localhost:5678/webhook/training

# Invoice Reminder - Payment reminder message generator
N8N_INVOICE_REMINDER_WEBHOOK_URL=http://localhost:5678/webhook/invoice-reminder

# Contract Analyzer - Existing workflow
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=http://localhost:5678/webhook/contract-analyze

# Hearing Follow-up - Existing workflow
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=http://localhost:5678/webhook/hearing-followup

# Client Status Notification - Existing workflow
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=http://localhost:5678/webhook/client-status
```

## ✅ Oluşturulan n8n Workflow'ları

Tüm workflow'lar n8n instance'ınızda oluşturuldu ve **AI entegrasyonu tamamlandı**!

### 🤖 AI-Powered Workflows (DeepSeek Chat Model)

| Workflow | ID | Path | Nodes | Status |
|----------|----|----|-------|--------|
| **Case Assistant** | `hEz3wkS9H2MqFSqP` | `/webhook/case-assistant` | 6 | ✅ Active + AI |
| **Strategy Generator** | `mf0pPYuaN4KeHlop` | `/webhook/strategy` | 6 | ✅ Active + AI |
| **Client Profile Analyzer** | `wTueIQqzOQBh3c3b` | `/webhook/client-profile` | 6 | ✅ Active + AI |
| **Training Content Generator** | `9N0pATaMtOp3MCVX` | `/webhook/training` | 6 | ✅ Active + AI |
| **Invoice Reminder** | `1bhuMS5j6VUNoZOW` | `/webhook/invoice-reminder` | 6 | ✅ Active + AI |

### 📋 Simple Workflows (Mock Data)

| Workflow | ID | Path | Nodes | Status |
|----------|----|----|-------|--------|
| **Contract Analyze** | `W1Ahehe2lZl4ctxs` | `/webhook/contract-analyze` | 3 | ✅ Active |
| **Hearing Followup** | `jWx3C6XbXrwZuHG2` | `/webhook/hearing-followup` | 3 | ✅ Active |
| **Client Status Notify** | `8cj6MIvEyRtO4TB0` | `/webhook/client-status` | 3 | ✅ Active |

## 🚀 Hızlı Başlangıç

### 1. Supabase Bilgilerini Alın

1. Supabase projenize gidin: https://supabase.com/dashboard
2. **Settings** > **API** bölümüne gidin
3. **Project URL** ve **anon/public** key'i kopyalayın
4. `.env.local` dosyasındaki ilgili alanlara yapıştırın

### 2. DeepSeek API Key Alın ve n8n'e Ekleyin

**ÖNEMLİ**: AI workflow'ları çalışması için DeepSeek API key gerekli!

#### Adım 2.1: DeepSeek API Key Alın
1. https://platform.deepseek.com adresine gidin
2. Hesap oluşturun (ücretsiz)
3. **API Keys** bölümüne gidin
4. **Create new secret key** tıklayın
5. API key'i kopyalayın (bir daha gösterilmeyecek!)

#### Adım 2.2: n8n'de Credential Oluşturun
1. n8n UI'ı açın: http://localhost:5678
2. Sağ üst **Settings** > **Credentials**
3. **Add Credential** tıklayın
4. **DeepSeek API** seçin
5. Bilgileri girin:
   - **Name**: `DeepSeek API` (tam bu isim!)
   - **API Key**: Kopyaladığınız key
6. **Save** tıklayın

#### Adım 2.3: Workflow'lara Credential Bağlayın
Her AI workflow için (5 adet):
1. Workflow'u açın (Case Assistant, Strategy Generator, vb.)
2. **DeepSeek Chat Model** node'una tıklayın
3. **Credentials** dropdown'dan `DeepSeek API` seçin
4. **Save** tıklayın
5. Workflow'u kaydedin

**Not**: Tüm workflow'lar zaten **ACTIVE** durumda! Sadece credential bağlamanız yeterli.

### 3. Webhook URL'lerini Test Edin

```bash
# Case Assistant Test
curl -X POST http://localhost:5678/webhook/case-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "caseType": "criminal",
    "shortDescription": "Test case",
    "timestamp": "2025-01-01T00:00:00Z"
  }'

# Strategy Generator Test
curl -X POST http://localhost:5678/webhook/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "area": "criminal",
    "question": "Test question",
    "timestamp": "2025-01-01T00:00:00Z"
  }'
```

## 📝 Production Deployment

### n8n Production URL

Production'da n8n'inizi deploy ettiyseniz (örn: Railway, Render, DigitalOcean):

```bash
# .env.local dosyasındaki tüm localhost:5678'leri değiştirin:
# Eski:
N8N_CASE_ASSISTANT_WEBHOOK_URL=http://localhost:5678/webhook/case-assistant

# Yeni:
N8N_CASE_ASSISTANT_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/case-assistant
```

### Güvenlik Notları

1. **Webhook Authentication**: n8n workflow'larınızda authentication ekleyin
2. **Rate Limiting**: n8n'de rate limiting yapılandırın
3. **HTTPS**: Production'da mutlaka HTTPS kullanın
4. **API Keys**: `.env.local` dosyasını asla commit etmeyin

## 🔧 Troubleshooting

### Webhook çalışmıyor?

1. **n8n çalışıyor mu?**
   ```bash
   curl http://localhost:5678/healthz
   ```

2. **Workflow aktif mi?**
   - n8n UI'da workflow'un "Active" olduğunu kontrol edin

3. **Webhook path doğru mu?**
   - n8n UI'da Webhook node'una tıklayın
   - "Webhook URLs" bölümünde production URL'i görün

4. **Console logları kontrol edin**
   - n8n UI'da workflow execution history'ye bakın
   - Next.js console'da hata mesajlarını kontrol edin

### AI yanıtları çok basit?

Şu an tüm workflow'lar **mock data** döndürüyor. Gerçek AI kullanmak için:

1. n8n workflow'larını açın
2. "Process" function node'larını AI node'larıyla değiştirin
3. OpenAI, Ollama veya DeepSeek node'u ekleyin
4. API key'leri yapılandırın

Detaylı talimatlar için: `N8N_INTEGRATION.md`

## 📚 Daha Fazla Bilgi

- **n8n Dokümantasyonu**: https://docs.n8n.io
- **Supabase Dokümantasyonu**: https://supabase.com/docs
- **LawSprinter n8n Entegrasyonu**: `N8N_INTEGRATION.md`
- **Database Setup**: `SETUP.md`

