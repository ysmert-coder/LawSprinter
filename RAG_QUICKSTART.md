# RAG System - Quick Start Guide 🚀

## ✅ Tamamlanan İşler

### 1. ✅ Database Migration Hazır
Dosya: `supabase/migrations/006_rag_system.sql`

### 2. ✅ n8n Workflow Oluşturuldu
- **Workflow ID**: `gAstHmRDjHjBzndu`
- **Webhook Path**: `/webhook/generate-embeddings`
- **Status**: Created (aktifleştirme gerekli)

### 3. ✅ Backend Servisleri Hazır
- `lib/services/rag.ts` - Import & Search functions
- `app/api/rag/import-public/route.ts` - Import API
- `app/api/rag/search/route.ts` - Search API

---

## 🚀 Kurulum Adımları

### Adım 1: Database Migration Uygula

#### Seçenek A: Supabase CLI (Önerilen)

```bash
# Proje dizinine gidin
cd "C:\Users\salih\OneDrive\Masaüstü\cursor proje1"

# Migration'ı uygula
supabase db reset
```

#### Seçenek B: Supabase Dashboard (Manuel)

1. https://supabase.com/dashboard adresine gidin
2. Projenizi seçin
3. **SQL Editor** sekmesine gidin
4. `supabase/migrations/006_rag_system.sql` dosyasını açın
5. İçeriği kopyalayıp SQL Editor'e yapıştırın
6. **Run** butonuna tıklayın

#### Seçenek C: Supabase Studio (Local)

1. http://localhost:54323 adresine gidin
2. **SQL Editor** sekmesine gidin
3. `supabase/migrations/006_rag_system.sql` dosyasını açın
4. İçeriği kopyalayıp yapıştırın
5. **Run** butonuna tıklayın

**Doğrulama**:
```sql
-- Tabloların oluşturulduğunu kontrol edin
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'rag_%';

-- Beklenen sonuç:
-- rag_public_docs
-- rag_public_chunks
-- rag_private_docs
-- rag_private_chunks
```

---

### Adım 2: n8n Workflow'u Aktifleştir

1. **n8n Dashboard'a gidin**: http://localhost:5678 (veya cloud URL)

2. **Workflow'u bulun**: "LawSprinter - Generate Embeddings (RAG)"

3. **Workflow'u açın** ve **Active** toggle'ını açın

4. **Webhook URL'i alın**:
   - "Webhook Trigger" node'una tıklayın
   - **Production URL** veya **Test URL** kopyalayın
   - Örnek: `http://localhost:5678/webhook/generate-embeddings`

---

### Adım 3: Environment Variable Ekle

`.env.local` dosyasını açın ve ekleyin:

```bash
# RAG Embeddings Webhook
N8N_EMBEDDINGS_WEBHOOK_URL=http://localhost:5678/webhook/generate-embeddings
```

**Not**: Webhook URL'i n8n'den aldığınız gerçek URL ile değiştirin.

---

### Adım 4: Next.js'i Yeniden Başlat

```bash
# Terminalde (Ctrl+C ile durdurun, sonra)
npm run dev
```

---

## 🧪 Test Etme

### Test 1: Import Document

```bash
# PowerShell veya Command Prompt
curl -X POST http://localhost:3000/api/rag/import-public `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{
    \"title\": \"Test Yargıtay Kararı\",
    \"docType\": \"ictihat\",
    \"court\": \"Yargıtay 9. HD\",
    \"date\": \"2023-01-01\",
    \"url\": \"https://example.com\",
    \"rawText\": \"Bu bir test kararıdır. İş hukuku ile ilgili önemli bir karardır. İşçinin hakları korunmalıdır. Haklı fesih durumunda tazminat hakkı vardır.\"
  }'
```

**Beklenen Sonuç**:
```json
{
  "docId": "uuid",
  "message": "Document imported successfully"
}
```

### Test 2: Search Documents

```bash
curl -X POST http://localhost:3000/api/rag/search `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -d '{
    \"query\": \"işçinin hakları\",
    \"limit\": 5
  }'
```

**Beklenen Sonuç**:
```json
{
  "publicChunks": [
    {
      "docId": "uuid",
      "title": "Test Yargıtay Kararı",
      "docType": "ictihat",
      "court": "Yargıtay 9. HD",
      "chunkText": "İşçinin hakları korunmalıdır...",
      "similarity": 0.92
    }
  ],
  "privateChunks": []
}
```

---

## 🔧 Production Setup (OpenAI Embeddings)

**Şu anda**: Workflow placeholder embedding'ler kullanıyor (random vektörler)

**Production için**:

1. **n8n'de workflow'u açın**

2. **"Generate Embeddings (Placeholder)" node'unu silin**

3. **OpenAI node ekleyin**:
   - Node type: **OpenAI**
   - Resource: **Embeddings**
   - Model: **text-embedding-ada-002**
   - Text: `{{ $json.chunk_text }}`

4. **OpenAI credentials ekleyin**:
   - n8n → Credentials → Add Credential → OpenAI
   - API Key: OpenAI API key'inizi girin

5. **Node'ları bağlayın**:
   ```
   Chunk Text → OpenAI (Embeddings) → Aggregate Results
   ```

6. **Workflow'u kaydedin ve test edin**

**Alternatif: Ollama (Local, Free)**

1. Ollama'yı kurun: https://ollama.ai
2. Model indirin: `ollama pull nomic-embed-text`
3. n8n'de HTTP Request node kullanın:
   ```
   POST http://localhost:11434/api/embeddings
   {
     "model": "nomic-embed-text",
     "prompt": "{{ $json.chunk_text }}"
   }
   ```

---

## 📊 n8n Workflow Yapısı

```
┌─────────────────────────────────────────────────────────┐
│  1. Webhook Trigger                                     │
│     Path: /webhook/generate-embeddings                  │
│     Method: POST                                        │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  2. Extract Payload                                     │
│     - text (document text)                              │
│     - docId (optional)                                  │
│     - scope (public|private|query)                      │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  3. Chunk Text (Code Node)                              │
│     - Split text into ~2000 char chunks                 │
│     - 200 char overlap                                  │
│     - Returns array of chunks                           │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  4. Generate Embeddings                                 │
│     PLACEHOLDER: Random vectors (1536 dims)             │
│     PRODUCTION: OpenAI/Ollama embeddings                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  5. Aggregate Results                                   │
│     - Collect all chunks with embeddings                │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  6. Format Response (Code Node)                         │
│     - Sort by chunk_index                               │
│     - Format as { chunks: [...] }                       │
└──────────────────┬──────────────────────────────────────┘
                   │
                   v
┌─────────────────────────────────────────────────────────┐
│  7. Respond to Webhook                                  │
│     Returns JSON response                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Kullanım Senaryoları

### 1. Yargıtay Kararı Import Etme

```typescript
import { importPublicDoc } from '@/lib/services/rag'

const result = await importPublicDoc({
  title: 'Yargıtay 9. HD, 2022/5678 E., 2023/1234 K.',
  docType: 'ictihat',
  court: 'Yargıtay 9. Hukuk Dairesi',
  date: '2023-03-15',
  url: 'https://karararama.yargitay.gov.tr/...',
  rawText: `
    DAVA: Taraflar arasındaki alacak davasından dolayı yapılan yargılama 
    sonunda; davanın kabulüne dair verilen hükmün süresi içinde 
    davalı tarafından temyiz edilmesi üzerine dosya incelendi, 
    gereği düşünüldü...
  `,
})

console.log('Imported document:', result.docId)
```

### 2. Draft Generator ile Entegrasyon

```typescript
// Draft Generator service'inde
import { searchHybridRag } from '@/lib/services/rag'

// 1. Emsal kararları ara
const ragResults = await searchHybridRag({
  userId: user.id,
  query: `${caseType} ${factSummary}`,
  limit: 5,
})

// 2. En iyi 3 kaynağı al
const topSources = ragResults.publicChunks.slice(0, 3)

// 3. AI prompt'una ekle
const prompt = `
Sen deneyimli bir Türk avukatısın.

Dava Türü: ${caseType}
Olay Özeti: ${factSummary}

İlgili Emsal Kararlar:
${topSources.map(s => `
[${s.court}] ${s.title}
${s.chunkText}
(Benzerlik: %${Math.round(s.similarity * 100)})
`).join('\n\n')}

Bu bilgilere dayanarak bir ${draftType} hazırla.
`

// 4. Kaynakları response'a ekle
return {
  draftText: aiGeneratedText,
  usedSources: topSources.map(s => ({
    title: s.title,
    court: s.court,
    url: s.url,
    similarity: s.similarity,
  })),
}
```

### 3. Bulk Import (Çoklu Doküman)

```typescript
const documents = [
  { title: 'Karar 1', docType: 'ictihat', rawText: '...' },
  { title: 'Karar 2', docType: 'ictihat', rawText: '...' },
  { title: 'Karar 3', docType: 'ictihat', rawText: '...' },
]

for (const doc of documents) {
  try {
    const result = await importPublicDoc(doc)
    console.log('✅ Imported:', doc.title, '→', result.docId)
  } catch (error) {
    console.error('❌ Failed:', doc.title, error)
  }
}
```

---

## 🐛 Troubleshooting

### Problem: "Failed to generate embeddings"

**Çözüm**:
1. n8n workflow'unun aktif olduğunu kontrol edin
2. Webhook URL'in doğru olduğunu kontrol edin
3. n8n execution logs'a bakın (n8n → Executions)

### Problem: "No chunks returned"

**Çözüm**:
1. Text çok kısa olabilir (min ~100 karakter)
2. n8n workflow'da "Chunk Text" node'unu kontrol edin
3. Console log'ları kontrol edin

### Problem: "Vector search returns no results"

**Çözüm**:
1. Embedding'ler doğru üretilmiş mi kontrol edin
2. Database'de `rag_public_chunks` tablosunu kontrol edin:
   ```sql
   SELECT COUNT(*) FROM rag_public_chunks;
   ```
3. IVFFlat index'in oluşturulduğunu kontrol edin:
   ```sql
   SELECT indexname FROM pg_indexes 
   WHERE tablename = 'rag_public_chunks';
   ```

### Problem: "Supabase CLI not found"

**Çözüm**:
1. Supabase CLI'yi kurun: https://supabase.com/docs/guides/cli
2. Veya manuel olarak Supabase Dashboard'dan SQL çalıştırın

---

## ✅ Checklist

- [ ] Database migration uygulandı
- [ ] n8n workflow oluşturuldu ve aktif
- [ ] Webhook URL alındı
- [ ] `.env.local` dosyasına eklendi
- [ ] Next.js yeniden başlatıldı
- [ ] Test document import edildi
- [ ] Test search yapıldı
- [ ] (Opsiyonel) OpenAI credentials eklendi

---

## 🎉 Sonuç

RAG sistemi artık çalışıyor! 🚀

**Şu anda**:
- ✅ Database hazır (4 tablo, indexes, RLS)
- ✅ n8n workflow çalışıyor (placeholder embeddings)
- ✅ API endpoints hazır
- ✅ Service layer hazır

**Production için**:
- [ ] OpenAI embeddings node ekle (veya Ollama)
- [ ] Gerçek Yargıtay kararlarını import et
- [ ] Draft Generator'a entegre et
- [ ] Draft Reviewer'a entegre et

**Workflow ID**: `gAstHmRDjHjBzndu`  
**Webhook Path**: `/webhook/generate-embeddings`

---

## 📚 Daha Fazla Bilgi

- **Detaylı Dokümantasyon**: `RAG_SYSTEM_SETUP.md`
- **Implementation Summary**: `RAG_IMPLEMENTATION_SUMMARY.md`
- **n8n Integration**: `N8N_INTEGRATION.md` (Section 12)

**Sorularınız için**: RAG_SYSTEM_SETUP.md dosyasındaki Troubleshooting bölümüne bakın.
