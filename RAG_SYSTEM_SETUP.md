# RAG (Retrieval-Augmented Generation) System

## Genel Bakış

LawSprinter'da RAG sistemi, hukuki belgeleri vektör embedding'leri ile saklar ve semantik arama yapar. İki tip doküman vardır:

1. **Public Documents**: Yargıtay kararları, mevzuat, doktrin (tüm kullanıcılar için paylaşımlı)
2. **Private Documents**: Kullanıcıya/davaya özel belgeler (RLS korumalı)

## 🏗️ Mimari

```
┌─────────────────────────────────────────────────────────┐
│                    LawSprinter App                      │
│  ┌─────────────────────┐    ┌────────────────────────┐ │
│  │  Import Document    │    │   Semantic Search      │ │
│  │  (API Endpoint)     │    │   (API Endpoint)       │ │
│  └──────────┬──────────┘    └──────────┬─────────────┘ │
│             │                           │               │
│             v                           v               │
│  ┌─────────────────────────────────────────────────┐   │
│  │         lib/services/rag.ts                     │   │
│  │  - importPublicDoc()                            │   │
│  │  - searchHybridRag()                            │   │
│  └──────────┬──────────────────────┬────────────────┘  │
└─────────────┼──────────────────────┼────────────────────┘
              │                      │
              v                      v
    ┌─────────────────┐    ┌──────────────────┐
    │  n8n Webhook    │    │    Supabase      │
    │  (Embeddings)   │    │  (pgvector)      │
    │                 │    │                  │
    │ - Chunk text    │    │ - rag_public_*   │
    │ - Generate      │    │ - rag_private_*  │
    │   embeddings    │    │ - Vector search  │
    └─────────────────┘    └──────────────────┘
```

## 📊 Database Schema

### Public Documents

```sql
-- rag_public_docs: Metadata
CREATE TABLE rag_public_docs (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL,  -- 'mevzuat', 'ictihat', 'doktrin'
  court TEXT,              -- Yargıtay 9. HD, etc.
  date DATE,               -- Decision/publication date
  url TEXT,                -- Link to source
  raw_text TEXT NOT NULL,  -- Full document text
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- rag_public_chunks: Vector embeddings
CREATE TABLE rag_public_chunks (
  id UUID PRIMARY KEY,
  doc_id UUID REFERENCES rag_public_docs(id),
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),  -- OpenAI ada-002
  created_at TIMESTAMPTZ
);
```

### Private Documents

```sql
-- rag_private_docs: Metadata (RLS protected)
CREATE TABLE rag_private_docs (
  id UUID PRIMARY KEY,
  firm_id UUID REFERENCES firms(id),
  case_id UUID REFERENCES cases(id),
  title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- rag_private_chunks: Vector embeddings (RLS protected)
CREATE TABLE rag_private_chunks (
  id UUID PRIMARY KEY,
  doc_id UUID REFERENCES rag_private_docs(id),
  firm_id UUID REFERENCES firms(id),
  chunk_index INTEGER NOT NULL,
  chunk_text TEXT NOT NULL,
  embedding vector(1536),
  created_at TIMESTAMPTZ
);
```

## 🔧 Setup

### 1. Database Migration

Migration dosyası zaten oluşturuldu: `supabase/migrations/006_rag_system.sql`

Supabase'e uygulama:

```bash
# Local development
supabase db reset

# Production
supabase db push
```

### 2. n8n Embeddings Webhook

n8n'de bir "generate-embeddings" workflow'u oluşturun:

**Input Payload**:
```json
{
  "text": "Long document text...",
  "docId": "uuid or null",
  "scope": "public|private|query"
}
```

**Expected Output**:
```json
{
  "chunks": [
    {
      "chunk_index": 0,
      "chunk_text": "First chunk of text...",
      "embedding": [0.123, -0.456, 0.789, ...]  // 1536 dimensions
    },
    {
      "chunk_index": 1,
      "chunk_text": "Second chunk of text...",
      "embedding": [0.234, -0.567, 0.890, ...]
    }
  ]
}
```

**Suggested n8n Workflow**:

1. **Webhook Trigger** - Receive payload
2. **Function (JS)** - Split text into chunks (~500 tokens each)
3. **OpenAI Embeddings Node** (or Ollama) - Generate embeddings for each chunk
4. **Function (JS)** - Format response
5. **Respond to Webhook** - Return chunks array

**Example Chunking Logic**:
```javascript
const text = $input.item.json.text;
const chunkSize = 500; // tokens (roughly 2000 characters)
const overlap = 50;    // token overlap between chunks

// Simple chunking by characters (improve with tiktoken for production)
const chunks = [];
const textLength = text.length;
const chunkCharSize = chunkSize * 4; // rough estimate
const overlapCharSize = overlap * 4;

for (let i = 0; i < textLength; i += (chunkCharSize - overlapCharSize)) {
  const chunk = text.slice(i, i + chunkCharSize);
  if (chunk.trim()) {
    chunks.push({
      chunk_index: chunks.length,
      chunk_text: chunk.trim()
    });
  }
}

return chunks.map(chunk => ({ json: chunk }));
```

### 3. Environment Variables

`.env.local` dosyasına ekleyin:

```bash
# RAG Embeddings Webhook
N8N_EMBEDDINGS_WEBHOOK_URL=http://localhost:5678/webhook/generate-embeddings
```

### 4. Restart Application

```bash
npm run dev
```

## 📚 API Usage

### Import Public Document

**Endpoint**: `POST /api/rag/import-public`

**Request**:
```json
{
  "title": "Yargıtay 9. HD, 2022/5678 E., 2023/1234 K.",
  "docType": "ictihat",
  "court": "Yargıtay 9. Hukuk Dairesi",
  "date": "2023-03-15",
  "url": "https://karararama.yargitay.gov.tr/...",
  "rawText": "DAVA: Taraflar arasındaki alacak davasından dolayı yapılan yargılama sonunda..."
}
```

**Response (Success - 200)**:
```json
{
  "docId": "uuid",
  "message": "Document imported successfully"
}
```

**Response (Error - 400)**:
```json
{
  "error": "title is required"
}
```

**Response (Error - 500)**:
```json
{
  "error": "Failed to generate embeddings: No chunks returned"
}
```

### Hybrid Search

**Endpoint**: `POST /api/rag/search`

**Request**:
```json
{
  "query": "İş sözleşmesinin haklı nedenle feshi durumunda işçinin hakları nelerdir?",
  "limit": 10
}
```

**Response (Success - 200)**:
```json
{
  "publicChunks": [
    {
      "docId": "uuid",
      "title": "Yargıtay 9. HD, 2022/5678",
      "docType": "ictihat",
      "court": "Yargıtay 9. Hukuk Dairesi",
      "date": "2023-03-15",
      "url": "https://...",
      "chunkText": "İş sözleşmesinin haklı nedenle feshi...",
      "similarity": 0.92
    }
  ],
  "privateChunks": [
    {
      "docId": "uuid",
      "title": "Müvekkil Dilekçesi - Ahmet Yılmaz",
      "caseId": "uuid",
      "chunkText": "Müvekkilim 5 yıl boyunca...",
      "similarity": 0.87
    }
  ]
}
```

## 🔍 Service Layer Usage

### Import Document (TypeScript)

```typescript
import { importPublicDoc } from '@/lib/services/rag'

const result = await importPublicDoc({
  title: 'Yargıtay 9. HD, 2022/5678',
  docType: 'ictihat',
  court: 'Yargıtay 9. Hukuk Dairesi',
  date: '2023-03-15',
  url: 'https://karararama.yargitay.gov.tr/...',
  rawText: 'DAVA: Taraflar arasındaki...',
})

console.log('Imported document ID:', result.docId)
```

### Semantic Search (TypeScript)

```typescript
import { searchHybridRag } from '@/lib/services/rag'

const results = await searchHybridRag({
  userId: user.id,
  query: 'İş sözleşmesinin haklı nedenle feshi',
  limit: 10,
})

console.log('Public chunks:', results.publicChunks.length)
console.log('Private chunks:', results.privateChunks.length)

// Use in AI prompt
const context = results.publicChunks
  .map(chunk => `[${chunk.court}] ${chunk.chunkText}`)
  .join('\n\n')
```

## 🎯 Integration with AI Features

### Draft Generator with RAG

```typescript
// In Draft Generator n8n workflow or service
import { searchHybridRag } from '@/lib/services/rag'

// 1. Search for relevant precedents
const ragResults = await searchHybridRag({
  userId: user.id,
  query: factSummary + ' ' + caseType,
  limit: 5,
})

// 2. Build context from top results
const legalContext = ragResults.publicChunks
  .slice(0, 3)
  .map(chunk => ({
    source: `${chunk.court} - ${chunk.title}`,
    text: chunk.chunkText,
    similarity: chunk.similarity,
  }))

// 3. Include in AI prompt
const prompt = `
Sen deneyimli bir Türk avukatısın. Aşağıdaki bilgilere dayanarak bir ${draftType} hazırla.

Dava Türü: ${caseType}
Olay Özeti: ${factSummary}

İlgili Emsal Kararlar:
${legalContext.map(c => `- ${c.source}\n  ${c.text}`).join('\n\n')}

Dilekçeyi hazırla...
`

// 4. Return sources in response
return {
  draftText: aiGeneratedText,
  usedSources: legalContext.map(c => ({
    title: c.source,
    court: chunk.court,
    url: chunk.url,
    similarity: c.similarity,
  })),
}
```

### Draft Reviewer with RAG

```typescript
// In Draft Reviewer n8n workflow or service
import { searchHybridRag } from '@/lib/services/rag'

// 1. Extract key legal terms from draft
const keyTerms = extractLegalTerms(draftText) // Your logic

// 2. Search for relevant precedents
const ragResults = await searchHybridRag({
  userId: user.id,
  query: keyTerms.join(' '),
  limit: 5,
})

// 3. Suggest missing citations
const suggestedCitations = ragResults.publicChunks
  .filter(chunk => !draftText.includes(chunk.title))
  .slice(0, 3)
  .map(chunk => ({
    title: chunk.title,
    court: chunk.court,
    url: chunk.url,
    similarity: chunk.similarity,
  }))

return {
  issues: [...],
  suggestions: [...],
  suggestedCitations: suggestedCitations,
}
```

## 🔒 Security & RLS

### Public Documents
- **Read**: Everyone (authenticated users)
- **Write**: Admin only (not implemented in API yet)

### Private Documents
- **Read**: Only users from same firm (RLS enforced)
- **Write**: Only users from same firm (RLS enforced)

RLS policies are automatically enforced by Supabase.

## 📈 Performance

### Vector Search
- Uses **IVFFlat** index for fast approximate nearest neighbor search
- Cosine similarity metric
- Typical search time: 50-200ms for 10k documents

### Optimization Tips
1. **Chunk Size**: 500 tokens (~2000 chars) is optimal
2. **Overlap**: 50 tokens prevents context loss
3. **Index Tuning**: Adjust `lists` parameter based on document count
   - 100 lists for 10k-100k documents
   - 1000 lists for 100k-1M documents

## 🧪 Testing

### Test Import

```bash
curl -X POST http://localhost:3000/api/rag/import-public \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Test Yargıtay Kararı",
    "docType": "ictihat",
    "court": "Yargıtay 9. HD",
    "date": "2023-01-01",
    "url": "https://example.com",
    "rawText": "Bu bir test kararıdır. İş hukuku ile ilgili önemli bir karardır. İşçinin hakları korunmalıdır."
  }'
```

### Test Search

```bash
curl -X POST http://localhost:3000/api/rag/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "query": "işçinin hakları",
    "limit": 5
  }'
```

## 🐛 Troubleshooting

### "Failed to generate embeddings"
- Check n8n webhook is active
- Verify `N8N_EMBEDDINGS_WEBHOOK_URL` is correct
- Check n8n execution logs

### "No chunks returned"
- Text might be too short (min ~100 characters)
- Check chunking logic in n8n workflow
- Verify OpenAI API key is valid

### "Vector search returns no results"
- Ensure embeddings were generated correctly
- Check vector dimension matches (1536 for ada-002)
- Verify IVFFlat index is created

### RLS blocking private search
- Ensure user has valid `firm_id` in profiles table
- Check RLS policies are enabled
- Verify user is authenticated

## 🚀 Future Enhancements

- [ ] Bulk import API
- [ ] Private document import API
- [ ] Document update/delete APIs
- [ ] Metadata filtering (by date, court, type)
- [ ] Hybrid search with keyword + semantic
- [ ] Re-ranking with cross-encoder
- [ ] Document versioning
- [ ] Admin UI for public document management
- [ ] Analytics (most searched terms, popular documents)

## 📝 Key Features

✅ **Automatic Embedding Generation**: n8n webhook handles chunking and embedding  
✅ **Hybrid Search**: Searches both public and private documents  
✅ **Metadata Rich**: Court, date, URL, document type  
✅ **RLS Protected**: Private documents secured by firm_id  
✅ **Similarity Scores**: Cosine similarity for ranking  
✅ **Type Safe**: Full TypeScript support  
✅ **Error Handling**: Graceful rollback on failures  

## 🎉 Summary

RAG sistemi artık tamamen entegre:

1. ✅ Database migration (`006_rag_system.sql`)
2. ✅ Service layer (`lib/services/rag.ts`)
3. ✅ API endpoints (`/api/rag/import-public`, `/api/rag/search`)
4. ✅ n8n webhook integration (`EMBEDDINGS`)
5. ✅ Type definitions
6. ✅ RLS security
7. ✅ Documentation

**Tek yapmanız gereken**: n8n'de embeddings workflow'unu oluşturup webhook URL'i environment variable olarak eklemek! 🚀
