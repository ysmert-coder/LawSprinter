# 🔌 API Routes Documentation

## n8n Webhook Integration

LawSprinter'da tüm AI işlemleri n8n workflow'ları üzerinden yapılır. Bu dokümantasyon, API route'larının nasıl kullanılacağını açıklar.

---

## 📋 Genel Bilgiler

### Authentication
Tüm endpoint'ler **Supabase authentication** gerektirir:
- ✅ Authenticated user → 200 OK
- ❌ No user → 401 Unauthorized

### Timeout
- **Default:** 20 saniye
- n8n webhook'ları bu süre içinde yanıt vermezse timeout hatası döner

### Error Handling
Tüm endpoint'ler standart error format kullanır:

```json
{
  "error": "Error message here"
}
```

---

## 🎯 Endpoint: Case Assistant

**Path:** `POST /api/case-assistant`

Dava dosyalarını analiz eder ve savunma stratejisi önerir.

### Request Body

```typescript
{
  fileUrl: string;          // Required - Dosya URL'i (PDF, DOCX, vb.)
  caseType: string;         // Required - Dava tipi (ceza, medeni, iş, vb.)
  shortDescription?: string; // Optional - Kısa açıklama
}
```

### Response

```typescript
{
  eventSummary: string;           // Olay özeti
  defenceOutline: string;         // Savunma taslağı
  actionItems: string[];          // Yapılacaklar listesi
  sources?: {                     // Kaynak emsal kararlar (RAG)
    id?: string;
    title?: string;
    court?: string;
    url?: string;
    similarity?: number;
  }[];
  confidenceScore?: number;       // Güven skoru (0-1)
}
```

### Example Request

```bash
curl -X POST https://lawsprinter.onrender.com/api/case-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "fileUrl": "https://storage.supabase.co/files/case-123.pdf",
    "caseType": "ceza",
    "shortDescription": "Hırsızlık suçu"
  }'
```

### Example Response

```json
{
  "eventSummary": "Müvekkil, 15.06.2023 tarihinde mağazadan hırsızlık suçundan tutuklanmıştır...",
  "defenceOutline": "1. Suç kastının bulunmadığı\n2. Delillerin yetersizliği\n3. İyi hal indirimi talep edilmesi...",
  "actionItems": [
    "Müvekkilin ifadesini detaylı almak",
    "Güvenlik kamerası kayıtlarını incelemek",
    "Tanık listesi hazırlamak"
  ],
  "sources": [
    {
      "title": "Yargıtay 15. CD E.2022/1234 K.2022/5678",
      "court": "Yargıtay",
      "url": "https://kazanci.com/...",
      "similarity": 0.89
    }
  ],
  "confidenceScore": 0.85
}
```

### Frontend Usage (React)

```typescript
'use client'

import { useState } from 'react'

export function CaseAssistantForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/case-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileUrl: 'https://storage.supabase.co/files/case-123.pdf',
          caseType: 'ceza',
          shortDescription: 'Hırsızlık suçu'
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Analiz başarısız oldu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <button type="submit" disabled={loading}>
        {loading ? 'Analiz ediliyor...' : 'Analiz Et'}
      </button>
      
      {result && (
        <div>
          <h3>Olay Özeti</h3>
          <p>{result.eventSummary}</p>
          
          <h3>Savunma Taslağı</h3>
          <p>{result.defenceOutline}</p>
          
          <h3>Yapılacaklar</h3>
          <ul>
            {result.actionItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  )
}
```

---

## 🎯 Endpoint: Strategy

**Path:** `POST /api/strategy`

Hukuk alanına göre strateji önerileri üretir.

### Request Body

```typescript
{
  area: 'ceza' | 'gayrimenkul' | 'icra_iflas' | 'aile' | string; // Required
  question: string;                                               // Required
  fileUrl?: string;                                               // Optional
}
```

### Response

```typescript
{
  summary: string;                // Özet
  keyIssues: string[];            // Ana konular
  recommendedStrategy: string;    // Önerilen strateji
  risks?: string[];               // Riskler
  sources?: {                     // Kaynak emsal kararlar (RAG)
    id?: string;
    title?: string;
    court?: string;
    url?: string;
    similarity?: number;
  }[];
  confidenceScore?: number;       // Güven skoru (0-1)
}
```

### Example Request

```bash
curl -X POST https://lawsprinter.onrender.com/api/strategy \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -d '{
    "area": "gayrimenkul",
    "question": "Tapu iptali davası açmak istiyorum. Hangi adımları izlemeliyim?"
  }'
```

### Example Response

```json
{
  "summary": "Tapu iptali davası, taşınmazın tapusunda kayıtlı olan kişinin haksız olduğu durumlarda açılır...",
  "keyIssues": [
    "Tapu kaydının hukuka aykırılığının ispatı",
    "Zamanaşımı süresinin kontrolü",
    "Taşınmazın zilyetlik durumu"
  ],
  "recommendedStrategy": "1. Öncelikle tapu kayıtlarını temin edin\n2. Eski malik ile yapılan işlemleri belgeleyin\n3. Bilirkişi raporu alınmasını talep edin...",
  "risks": [
    "Zamanaşımı süresi dolmuş olabilir",
    "İyiniyetli 3. kişi iktisabı riski",
    "Dava sürecinin uzun olması"
  ],
  "sources": [
    {
      "title": "Yargıtay 1. HD E.2021/3456 K.2021/7890",
      "court": "Yargıtay",
      "url": "https://kazanci.com/...",
      "similarity": 0.92
    }
  ],
  "confidenceScore": 0.88
}
```

### Frontend Usage (React)

```typescript
'use client'

import { useState } from 'react'

export function StrategyForm() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          area: 'gayrimenkul',
          question: 'Tapu iptali davası açmak istiyorum. Hangi adımları izlemeliyim?'
        })
      })

      if (!response.ok) {
        throw new Error('Strategy generation failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Error:', error)
      alert('Strateji oluşturulamadı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <select name="area">
        <option value="ceza">Ceza Hukuku</option>
        <option value="gayrimenkul">Gayrimenkul Hukuku</option>
        <option value="icra_iflas">İcra İflas</option>
        <option value="aile">Aile Hukuku</option>
      </select>
      
      <textarea 
        name="question" 
        placeholder="Sorunuzu yazın..."
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Strateji oluşturuluyor...' : 'Strateji Oluştur'}
      </button>
      
      {result && (
        <div>
          <h3>Özet</h3>
          <p>{result.summary}</p>
          
          <h3>Ana Konular</h3>
          <ul>
            {result.keyIssues.map((issue, i) => (
              <li key={i}>{issue}</li>
            ))}
          </ul>
          
          <h3>Önerilen Strateji</h3>
          <p>{result.recommendedStrategy}</p>
          
          {result.risks && (
            <>
              <h3>Riskler</h3>
              <ul>
                {result.risks.map((risk, i) => (
                  <li key={i}>{risk}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </form>
  )
}
```

---

## 🔧 n8n Webhook Configuration

### Environment Variables

`.env.local` dosyanıza ekleyin:

```bash
# Case Assistant
N8N_CASE_ASSISTANT_WEBHOOK_URL=http://localhost:5678/webhook/case-assistant

# Strategy
N8N_STRATEGY_WEBHOOK_URL=http://localhost:5678/webhook/strategy

# Other webhooks (optional)
N8N_CLIENT_PROFILE_WEBHOOK_URL=http://localhost:5678/webhook/client-profile
N8N_TRAINING_WEBHOOK_URL=http://localhost:5678/webhook/training
N8N_INVOICE_REMINDER_WEBHOOK_URL=http://localhost:5678/webhook/invoice-reminder
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=http://localhost:5678/webhook/contract-analyze
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=http://localhost:5678/webhook/hearing-followup
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=http://localhost:5678/webhook/client-status-notify
```

### n8n Workflow Structure

Her webhook için n8n'de şu yapıyı kullanın:

```
1. Webhook Node (POST)
   ↓
2. Extract Data (Code/Set)
   ↓
3. [Optional] RAG Search (HTTP Request to /api/rag/search)
   ↓
4. AI Processing (DeepSeek/OpenAI)
   ↓
5. Format Response (Code/Set)
   ↓
6. Respond to Webhook
```

### Example n8n Workflow (Case Assistant)

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "case-assistant",
        "responseMode": "responseNode",
        "options": {}
      }
    },
    {
      "name": "Extract Data",
      "type": "n8n-nodes-base.set",
      "parameters": {
        "values": {
          "string": [
            { "name": "userId", "value": "={{ $json.body.userId }}" },
            { "name": "caseType", "value": "={{ $json.body.caseType }}" },
            { "name": "fileUrl", "value": "={{ $json.body.fileUrl }}" }
          ]
        }
      }
    },
    {
      "name": "RAG Search",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "url": "https://lawsprinter.onrender.com/api/rag/search",
        "method": "POST",
        "bodyParameters": {
          "parameters": [
            { "name": "query", "value": "={{ $json.caseType }}" },
            { "name": "docType", "value": "içtihat" },
            { "name": "matchCount", "value": "3" }
          ]
        }
      }
    },
    {
      "name": "DeepSeek AI",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "chat",
        "model": "deepseek-chat",
        "messages": {
          "values": [
            {
              "role": "system",
              "content": "Sen Türk hukuku uzmanısın..."
            },
            {
              "role": "user",
              "content": "={{ $json.caseType }} davası analizi yap..."
            }
          ]
        }
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return [{\n  json: {\n    eventSummary: '...',\n    defenceOutline: '...',\n    actionItems: [...],\n    sources: [...],\n    confidenceScore: 0.85\n  }\n}];"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook"
    }
  ]
}
```

---

## 🧪 Testing

### Test Case Assistant

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/case-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://example.com/test.pdf",
    "caseType": "ceza",
    "shortDescription": "Test case"
  }'
```

### Test Strategy

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "area": "ceza",
    "question": "Test question"
  }'
```

---

## 🐛 Troubleshooting

### 401 Unauthorized
- Supabase authentication token eksik veya geçersiz
- Frontend'de `supabase.auth.getSession()` ile token alın

### 500 Internal Server Error
- n8n webhook URL'i yanlış veya eksik
- n8n workflow'u çalışmıyor
- n8n timeout (20 saniye)

### Timeout Errors
- n8n workflow'u çok yavaş
- AI model yanıt vermiyor
- Timeout süresini artırın: `callN8NWebhook('TYPE', payload, 30000)`

### Check n8n Configuration

```typescript
import { getN8nConfigStatus } from '@/lib/n8n'

const status = getN8nConfigStatus()
console.log('n8n Status:', status)
// {
//   CASE_ASSISTANT: true,
//   STRATEGY: true,
//   ...
// }
```

---

## 📚 Related Documentation

- **n8n Integration:** `N8N_AI_SETUP.md`
- **RAG System:** `RAG_SYSTEM_SETUP.md`
- **Environment Setup:** `ENV_SETUP.md`
- **Service Layer:** `src/lib/services/README.md`

---

**Made with ❤️ for LawSprinter**

