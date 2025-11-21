# 🧠 RAG System Setup - Legal Knowledge Base

## 📋 Overview

LawSprinter now includes a **RAG (Retrieval Augmented Generation)** system powered by **pgvector** for semantic search over legal documents and case-specific knowledge.

### What is RAG?

RAG combines:
- **Vector embeddings** (semantic representation of text)
- **Similarity search** (finding relevant content)
- **AI generation** (using retrieved context to generate responses)

This enables AI-powered features like:
- 🔍 Semantic search over Yargıtay decisions
- 📚 Case law retrieval for case analysis
- 📄 Private document search within cases
- 🤖 Context-aware AI responses

---

## 🗄️ Database Schema

### 1. `legal_documents` - Public Legal Knowledge Base

Stores metadata for legal documents (case law, legislation, doctrine).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `title` | TEXT | Document title |
| `source` | TEXT | Source (e.g., 'Yargıtay', 'Kanun', 'Makale') |
| `doc_type` | TEXT | Type: 'mevzuat', 'içtihat', 'doktrin' |
| `court` | TEXT | Court name (e.g., 'Yargıtay', 'Danıştay') |
| `chamber` | TEXT | Chamber (e.g., '9. Hukuk Dairesi') |
| `decision_no` | TEXT | Decision number (e.g., 'E.2023/1234 K.2023/5678') |
| `file_no` | TEXT | File number |
| `date` | DATE | Decision/publication date |
| `url` | TEXT | Original source URL |
| `is_active` | BOOLEAN | Soft delete flag |
| `metadata` | JSONB | Additional flexible metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Indexes:**
- `idx_legal_documents_doc_type` - Filter by document type
- `idx_legal_documents_court` - Filter by court
- `idx_legal_documents_date` - Sort by date
- `idx_legal_documents_source` - Filter by source

### 2. `legal_chunks` - Chunked Content with Embeddings

Stores text chunks with vector embeddings for semantic search.

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `document_id` | UUID | Foreign key to `legal_documents` |
| `chunk_index` | INTEGER | Order of chunk in document (0, 1, 2, ...) |
| `content` | TEXT | The actual text chunk |
| `embedding` | vector(1536) | OpenAI/DeepSeek embedding (1536 dimensions) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_legal_chunks_document_id` - Join with documents
- `idx_legal_chunks_embedding` - IVFFlat index for vector similarity search (cosine distance)

### 3. `private_case_chunks` - Private Case-Specific Knowledge

Stores user-uploaded content specific to cases (isolated by RLS).

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGSERIAL | Primary key |
| `user_id` | UUID | Foreign key to `auth.users` |
| `case_id` | UUID | Foreign key to `cases` |
| `source` | TEXT | Source type: 'uploaded_file', 'note', 'email', 'transcript' |
| `content` | TEXT | The actual text chunk |
| `embedding` | vector(1536) | OpenAI/DeepSeek embedding (1536 dimensions) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

**Indexes:**
- `idx_private_case_chunks_user_case` - Composite index for user + case queries
- `idx_private_case_chunks_embedding` - IVFFlat index for vector similarity search

---

## 🔐 Row Level Security (RLS)

### `legal_documents` & `legal_chunks`
- ✅ **Public read access** - All authenticated users can search
- ⚠️ **Insert/update** - Currently allowed for all authenticated users (TODO: restrict to admin role)

### `private_case_chunks`
- 🔒 **Firm-isolated** - Users can only access chunks from their firm's cases
- ✅ **User-owned** - Users can insert/delete their own chunks
- ✅ **Firm-shared** - Firm members can view each other's case chunks

---

## 🛠️ Installation

### 1. Run the Migration

In Supabase SQL Editor, run:

```sql
-- Run the migration
supabase/migrations/004_rag_legal_knowledge.sql
```

This will:
- ✅ Enable pgvector extension
- ✅ Create 3 new tables
- ✅ Create indexes for performance
- ✅ Set up RLS policies
- ✅ Create helper functions for semantic search

### 2. Verify Installation

```sql
-- Check if pgvector is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';

-- Check tables
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('legal_documents', 'legal_chunks', 'private_case_chunks');

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('search_legal_documents', 'search_private_case_chunks');
```

---

## 📚 TypeScript Types

All types are auto-generated in `types/database.ts`:

```typescript
import { 
  LegalDocument, 
  LegalChunk, 
  PrivateCaseChunk,
  LegalSearchResult,
  PrivateCaseSearchResult
} from '@/types/database'
```

---

## 🔧 Service Layer API

All RAG functions are in `src/lib/services/rag.ts`.

### Legal Documents (Public Knowledge Base)

#### Insert Document with Chunks

```typescript
import { insertLegalDocumentWithChunks } from '@/lib/services/rag'

const document = await insertLegalDocumentWithChunks(
  {
    title: 'Yargıtay 9. HD E.2023/1234 K.2023/5678',
    source: 'Yargıtay',
    docType: 'içtihat',
    court: 'Yargıtay',
    chamber: '9. Hukuk Dairesi',
    decisionNo: 'E.2023/1234 K.2023/5678',
    date: '2023-06-15',
    url: 'https://kazanci.com/...',
    metadata: { keywords: ['kıdem tazminatı', 'iş hukuku'] }
  },
  [
    { 
      content: 'Chunk 1 text...', 
      chunkIndex: 0, 
      embedding: [0.1, 0.2, ...] // 1536-dim array from n8n
    },
    { 
      content: 'Chunk 2 text...', 
      chunkIndex: 1, 
      embedding: [0.3, 0.4, ...] 
    }
  ]
)
```

#### Search Legal Documents

```typescript
import { searchLegalDocuments } from '@/lib/services/rag'

const results = await searchLegalDocuments(
  [0.1, 0.2, ...], // query embedding from n8n (1536-dim)
  {
    matchCount: 5,
    docType: 'içtihat',
    court: 'Yargıtay'
  }
)

// Results include:
// - document_id, chunk_id
// - title, source, doc_type, court, chamber, decision_no
// - content (the matching chunk text)
// - similarity (0-1, higher is better)
```

#### Get Document with Chunks

```typescript
import { getLegalDocumentWithChunks } from '@/lib/services/rag'

const doc = await getLegalDocumentWithChunks('document-uuid')
// Returns: { ...document, chunks: [...] }
```

#### Deactivate Document

```typescript
import { deactivateLegalDocument } from '@/lib/services/rag'

await deactivateLegalDocument('document-uuid')
// Soft delete (sets is_active = false)
```

### Private Case Chunks

#### Insert Private Chunks

```typescript
import { insertPrivateCaseChunks } from '@/lib/services/rag'

const chunkIds = await insertPrivateCaseChunks(
  'user-uuid',
  'case-uuid',
  [
    { 
      content: 'Meeting notes from 2023-06-15...', 
      source: 'note', 
      embedding: [0.1, 0.2, ...] 
    },
    { 
      content: 'Email from client...', 
      source: 'email', 
      embedding: [0.3, 0.4, ...] 
    }
  ]
)
```

#### Search Private Chunks

```typescript
import { searchPrivateCaseChunks } from '@/lib/services/rag'

const results = await searchPrivateCaseChunks(
  'user-uuid',
  'case-uuid',
  [0.1, 0.2, ...], // query embedding from n8n
  5 // match count
)

// Results include:
// - chunk_id
// - source, content
// - similarity (0-1)
// - created_at
```

#### Get All Private Chunks

```typescript
import { getPrivateCaseChunks } from '@/lib/services/rag'

const chunks = await getPrivateCaseChunks('user-uuid', 'case-uuid')
```

#### Delete Private Chunks

```typescript
import { deletePrivateCaseChunks, deleteAllPrivateCaseChunks } from '@/lib/services/rag'

// Delete specific chunks
await deletePrivateCaseChunks('user-uuid', [1, 2, 3])

// Delete all chunks for a case
await deleteAllPrivateCaseChunks('user-uuid', 'case-uuid')
```

### Hybrid Search (Public + Private)

```typescript
import { hybridSearch } from '@/lib/services/rag'

const { publicResults, privateResults } = await hybridSearch(
  'user-uuid',
  'case-uuid',
  [0.1, 0.2, ...], // query embedding
  {
    publicMatchCount: 3,
    privateMatchCount: 2,
    docType: 'içtihat',
    court: 'Yargıtay'
  }
)

// Use both results for AI context
```

### Statistics

```typescript
import { getRagStatistics } from '@/lib/services/rag'

const stats = await getRagStatistics()
// Returns:
// - totalDocuments, totalChunks, totalPrivateChunks
// - documentsByType: [{ doc_type, count }]
// - documentsByCourt: [{ court, count }]
```

---

## 🤖 n8n Integration

### Workflow: Generate Embeddings

Create an n8n workflow to generate embeddings using DeepSeek/OpenAI:

```
1. HTTP Request (Receive document text)
2. Split Text into Chunks (500-1000 tokens each)
3. For Each Chunk:
   - Call DeepSeek/OpenAI Embedding API
   - Store embedding (1536-dim array)
4. HTTP Response (Return chunks with embeddings)
```

### Example n8n Workflow

```json
{
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "parameters": {
        "path": "generate-embeddings"
      }
    },
    {
      "name": "Split Text",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "// Split text into chunks of ~500 tokens\nconst text = $input.item.json.text;\nconst chunkSize = 500;\nconst chunks = [];\n\nfor (let i = 0; i < text.length; i += chunkSize) {\n  chunks.push({\n    content: text.slice(i, i + chunkSize),\n    chunkIndex: Math.floor(i / chunkSize)\n  });\n}\n\nreturn chunks.map(chunk => ({ json: chunk }));"
      }
    },
    {
      "name": "OpenAI Embeddings",
      "type": "n8n-nodes-base.openAi",
      "parameters": {
        "resource": "embedding",
        "text": "={{ $json.content }}",
        "model": "text-embedding-ada-002"
      }
    },
    {
      "name": "Format Response",
      "type": "n8n-nodes-base.code",
      "parameters": {
        "jsCode": "return [{\n  json: {\n    content: $json.content,\n    chunkIndex: $json.chunkIndex,\n    embedding: $json.embedding\n  }\n}];"
      }
    },
    {
      "name": "Respond",
      "type": "n8n-nodes-base.respondToWebhook"
    }
  ]
}
```

### Call from Next.js API Route

```typescript
// app/api/rag/embed/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { text } = await request.json()

  // Call n8n webhook to generate embeddings
  const response = await fetch(process.env.N8N_EMBEDDINGS_WEBHOOK_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  })

  const chunks = await response.json()
  // chunks = [{ content, chunkIndex, embedding: [0.1, 0.2, ...] }]

  return NextResponse.json({ chunks })
}
```

---

## 📊 Use Cases

### 1. AI Case Assistant with RAG

```typescript
// app/api/case-assistant-rag/route.ts
import { hybridSearch } from '@/lib/services/rag'
import { callN8NWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const { userId, caseId, query } = await request.json()

  // 1. Generate embedding for user query
  const { embedding } = await callN8NWebhook(
    process.env.N8N_EMBEDDINGS_WEBHOOK_URL!,
    { text: query }
  )

  // 2. Search both public and private knowledge
  const { publicResults, privateResults } = await hybridSearch(
    userId,
    caseId,
    embedding,
    { publicMatchCount: 3, privateMatchCount: 2 }
  )

  // 3. Build context for AI
  const context = [
    ...publicResults.map(r => `[Yargıtay] ${r.title}: ${r.content}`),
    ...privateResults.map(r => `[Case Note] ${r.content}`)
  ].join('\n\n')

  // 4. Call AI with context
  const aiResponse = await callN8NWebhook(
    process.env.N8N_CASE_ASSISTANT_WEBHOOK_URL!,
    { query, context }
  )

  return Response.json({ response: aiResponse })
}
```

### 2. Legal Document Upload & Indexing

```typescript
// app/api/rag/upload-document/route.ts
import { insertLegalDocumentWithChunks } from '@/lib/services/rag'
import { callN8NWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const { title, source, docType, text } = await request.json()

  // 1. Generate embeddings via n8n
  const { chunks } = await callN8NWebhook(
    process.env.N8N_EMBEDDINGS_WEBHOOK_URL!,
    { text }
  )

  // 2. Insert document with chunks
  const document = await insertLegalDocumentWithChunks(
    { title, source, docType },
    chunks
  )

  return Response.json({ documentId: document.id })
}
```

### 3. Case File Upload & Private Indexing

```typescript
// app/api/cases/[id]/upload-file/route.ts
import { insertPrivateCaseChunks } from '@/lib/services/rag'
import { callN8NWebhook } from '@/lib/n8n'

export async function POST(request: Request) {
  const { userId, caseId, fileText, source } = await request.json()

  // 1. Generate embeddings via n8n
  const { chunks } = await callN8NWebhook(
    process.env.N8N_EMBEDDINGS_WEBHOOK_URL!,
    { text: fileText }
  )

  // 2. Insert private chunks
  const chunkIds = await insertPrivateCaseChunks(
    userId,
    caseId,
    chunks.map(c => ({ ...c, source }))
  )

  return Response.json({ chunkIds })
}
```

---

## 🚀 Performance Optimization

### IVFFlat Index Tuning

The `lists` parameter in the IVFFlat index affects performance:

```sql
-- For < 1M rows: lists = rows / 1000
-- For 100K rows: lists = 100
-- For 1M rows: lists = 1000

CREATE INDEX idx_legal_chunks_embedding 
  ON public.legal_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

### Query Performance

- **Cosine distance** (`<=>`) is used for similarity
- **Similarity score** = `1 - cosine_distance` (0-1, higher is better)
- **Typical threshold**: 0.7+ for good matches

---

## 📈 Monitoring

### Check Index Usage

```sql
SELECT 
  schemaname, 
  tablename, 
  indexname, 
  idx_scan, 
  idx_tup_read, 
  idx_tup_fetch
FROM pg_stat_user_indexes
WHERE indexname LIKE '%embedding%';
```

### Check Table Sizes

```sql
SELECT 
  schemaname, 
  tablename, 
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE tablename IN ('legal_documents', 'legal_chunks', 'private_case_chunks');
```

---

## 🔄 Migration Path

### From Existing System

If you already have legal documents in your system:

1. **Extract text** from existing documents
2. **Generate embeddings** via n8n
3. **Bulk insert** using `insertLegalDocumentWithChunks`

```typescript
// Example bulk migration script
import { insertLegalDocumentWithChunks } from '@/lib/services/rag'

async function migrateExistingDocuments() {
  const documents = await getExistingDocuments() // Your existing data

  for (const doc of documents) {
    // Generate embeddings via n8n
    const { chunks } = await generateEmbeddings(doc.text)

    // Insert into RAG system
    await insertLegalDocumentWithChunks(
      {
        title: doc.title,
        source: doc.source,
        docType: doc.type,
        // ... other fields
      },
      chunks
    )
  }
}
```

---

## 🎯 Next Steps

1. ✅ **Run migration** - `004_rag_legal_knowledge.sql`
2. ✅ **Create n8n embedding workflow**
3. ✅ **Test with sample documents**
4. 🔄 **Integrate with existing AI workflows**
5. 🔄 **Build UI for document upload**
6. 🔄 **Add monitoring dashboard**

---

## 📚 Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI Embeddings](https://platform.openai.com/docs/guides/embeddings)
- [DeepSeek API](https://platform.deepseek.com/docs)
- [RAG Best Practices](https://www.pinecone.io/learn/retrieval-augmented-generation/)

---

**Made with ❤️ for LawSprinter**

*Semantic search powered by pgvector + DeepSeek*

