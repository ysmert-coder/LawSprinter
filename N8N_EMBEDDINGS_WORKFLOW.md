# 🤖 n8n Embeddings Workflow Dokümantasyonu

## 📋 Genel Bakış

Bu workflow, LawSprinter'dan gelen dokümanları chunk'lara böler ve her chunk için OpenAI embedding oluşturur.

---

## 🔗 Webhook Konfigürasyonu

### **Environment Variable**
```
N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL=https://your-n8n.com/webhook/generate-embeddings
```

### **Webhook Method**
- **Method**: POST
- **Content-Type**: application/json
- **Authentication**: None (veya Bearer token eklenebilir)

---

## 📥 Input (LawSprinter → n8n)

### **Payload Structure**
```json
{
  "docId": "uuid-string",
  "text": "Tam doküman metni...",
  "isPublic": true,
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "lawsprinter"
}
```

### **Field Descriptions**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `docId` | string (UUID) | ✅ Yes | Supabase'deki doküman ID'si |
| `text` | string | ✅ Yes | Chunk'lanacak tam metin |
| `isPublic` | boolean | ✅ Yes | Public/private doküman ayırımı |
| `timestamp` | string (ISO) | ❌ No | İstek zamanı |
| `source` | string | ❌ No | Kaynak sistem (lawsprinter) |

---

## 📤 Output (n8n → LawSprinter)

### **Success Response Structure**
```json
{
  "docId": "uuid-string",
  "chunks": [
    {
      "content": "İlk chunk metni...",
      "embedding": [0.123, 0.456, 0.789, ...]
    },
    {
      "content": "İkinci chunk metni...",
      "embedding": [0.321, 0.654, 0.987, ...]
    }
  ],
  "totalChunks": 15,
  "model": "text-embedding-3-small"
}
```

### **Field Descriptions**
| Field | Type | Description |
|-------|------|-------------|
| `docId` | string | Gönderilen doküman ID'si (echo back) |
| `chunks` | array | Chunk'lar ve embedding'leri |
| `chunks[].content` | string | Chunk metni (max ~512 token) |
| `chunks[].embedding` | number[] | 1536 boyutlu vector (OpenAI) |
| `totalChunks` | number | Toplam chunk sayısı |
| `model` | string | Kullanılan embedding modeli |

### **Error Response Structure**
```json
{
  "error": "Error message",
  "details": "Detailed error information",
  "docId": "uuid-string"
}
```

---

## 🏗️ n8n Workflow Yapısı

### **Adım 1: Webhook Trigger**
- **Node**: Webhook
- **Method**: POST
- **Path**: `/webhook/generate-embeddings`
- **Response Mode**: Wait for response

### **Adım 2: Validate Input**
- **Node**: Code (JavaScript)
- **Validation**:
  - `docId` var mı?
  - `text` var mı ve en az 50 karakter mi?
  - `isPublic` boolean mu?

```javascript
// Validation example
const { docId, text, isPublic } = $input.item.json;

if (!docId || !text || typeof isPublic !== 'boolean') {
  throw new Error('Invalid input: docId, text, and isPublic are required');
}

if (text.length < 50) {
  throw new Error('Text too short: minimum 50 characters');
}

return { docId, text, isPublic };
```

### **Adım 3: Text Chunking**
- **Node**: Code (JavaScript)
- **Chunk Size**: ~512 tokens (yaklaşık 2000 karakter)
- **Overlap**: 50 tokens (yaklaşık 200 karakter)

```javascript
function chunkText(text, chunkSize = 2000, overlap = 200) {
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.substring(start, end));
    start += chunkSize - overlap;
  }
  
  return chunks;
}

const { docId, text, isPublic } = $input.item.json;
const chunks = chunkText(text);

return chunks.map((content, index) => ({
  json: {
    docId,
    chunkIndex: index,
    content,
    isPublic
  }
}));
```

### **Adım 4: Generate Embeddings (Loop)**
- **Node**: OpenAI
- **Operation**: Create Embedding
- **Model**: `text-embedding-3-small` (1536 dimensions)
- **Input**: `{{ $json.content }}`

**Alternatif: HTTP Request Node**
```javascript
// HTTP Request to OpenAI API
{
  "method": "POST",
  "url": "https://api.openai.com/v1/embeddings",
  "headers": {
    "Authorization": "Bearer {{ $env.OPENAI_API_KEY }}",
    "Content-Type": "application/json"
  },
  "body": {
    "input": "{{ $json.content }}",
    "model": "text-embedding-3-small"
  }
}
```

### **Adım 5: Format Response**
- **Node**: Code (JavaScript)
- **Aggregate Results**

```javascript
const items = $input.all();
const docId = items[0].json.docId;

const chunks = items.map(item => ({
  content: item.json.content,
  embedding: item.json.embedding // OpenAI response'dan
}));

return {
  json: {
    docId,
    chunks,
    totalChunks: chunks.length,
    model: 'text-embedding-3-small'
  }
};
```

### **Adım 6: Respond to Webhook**
- **Node**: Respond to Webhook
- **Response Body**: `{{ $json }}`

---

## 🔧 Alternatif: OpenRouter Kullanımı

Eğer OpenRouter kullanıyorsan:

```javascript
// HTTP Request to OpenRouter
{
  "method": "POST",
  "url": "https://openrouter.ai/api/v1/embeddings",
  "headers": {
    "Authorization": "Bearer {{ $env.OPENROUTER_API_KEY }}",
    "Content-Type": "application/json",
    "HTTP-Referer": "https://lawsprinter.onrender.com",
    "X-Title": "LawSprinter"
  },
  "body": {
    "input": "{{ $json.content }}",
    "model": "openai/text-embedding-3-small"
  }
}
```

---

## 🧪 Test Payload

### **Test Request (cURL)**
```bash
curl -X POST https://your-n8n.com/webhook/generate-embeddings \
  -H "Content-Type: application/json" \
  -d '{
    "docId": "123e4567-e89b-12d3-a456-426614174000",
    "text": "Yargıtay 12. Hukuk Dairesi, 2023/1234 E., 2023/5678 K. sayılı kararında...",
    "isPublic": true,
    "timestamp": "2024-01-01T12:00:00.000Z",
    "source": "lawsprinter"
  }'
```

### **Expected Response**
```json
{
  "docId": "123e4567-e89b-12d3-a456-426614174000",
  "chunks": [
    {
      "content": "Yargıtay 12. Hukuk Dairesi...",
      "embedding": [0.123, 0.456, ..., 0.789]
    }
  ],
  "totalChunks": 1,
  "model": "text-embedding-3-small"
}
```

---

## ⚠️ Önemli Notlar

### **1. Embedding Boyutu**
- **OpenAI text-embedding-3-small**: 1536 dimensions
- **OpenAI text-embedding-3-large**: 3072 dimensions
- Supabase'deki `vector(1536)` ile eşleşmeli!

### **2. Rate Limiting**
- OpenAI: 3,000 requests/minute (Tier 1)
- Büyük dokümanlar için chunk'ları batch'le

### **3. Cost**
- text-embedding-3-small: $0.02 / 1M tokens
- Örnek: 100 sayfalık PDF (~50,000 token) = $0.001

### **4. Timeout**
- n8n workflow timeout: 5 dakika (default)
- Çok büyük dokümanlar için async işlem düşün

### **5. Error Handling**
- OpenAI API hatası → Retry 3x
- Chunk başarısız → Tüm dokümanı skip etme, sadece o chunk'ı logla

---

## 🚀 Deployment Checklist

- [ ] n8n workflow oluşturuldu
- [ ] Webhook URL kopyalandı
- [ ] Render'da `N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL` eklendi
- [ ] OpenAI API key n8n'de tanımlı
- [ ] Test payload ile test edildi
- [ ] Error handling test edildi
- [ ] Production'da denendi

---

## 📊 Monitoring

### **n8n Logs**
- Workflow executions → Her çalıştırmayı gör
- Error logs → Başarısız istekleri incele

### **LawSprinter Logs (Render)**
```
[RAG Import] Created doc: abc-123, length: 15000 chars
[n8n] Calling GENERATE_EMBEDDINGS webhook: https://...
[n8n] Payload: { docId: "abc-123", text: "...", isPublic: true }
[n8n] GENERATE_EMBEDDINGS success: { docId: "abc-123", chunks: [...], totalChunks: 8 }
[RAG Import] Inserted 8 chunks for doc abc-123
```

### **Supabase Logs**
- SQL Editor → `SELECT COUNT(*) FROM public_legal_chunks;`
- Storage → `rag_public` bucket'ta dosyalar var mı?

---

## 🔗 Kaynaklar

- [OpenAI Embeddings API](https://platform.openai.com/docs/guides/embeddings)
- [n8n Webhook Node](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)
- [Supabase pgvector](https://supabase.com/docs/guides/ai/vector-columns)

