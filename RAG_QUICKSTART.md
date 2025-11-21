# 🚀 RAG System - Quick Start Guide

## 5-Minute Setup

### Step 1: Run Migration (2 minutes)

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `supabase/migrations/004_rag_legal_knowledge.sql`
3. Paste and click "Run"
4. Wait for success message

**Verify:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Should return 1 row
```

### Step 2: Test Installation (1 minute)

```sql
-- Insert test document
INSERT INTO public.legal_documents (title, source, doc_type)
VALUES ('Test Yargıtay Kararı', 'Yargıtay', 'içtihat')
RETURNING id;

-- Insert test chunk (copy the id from above)
INSERT INTO public.legal_chunks (document_id, chunk_index, content, embedding)
VALUES (
  'paste-id-here',
  0,
  'Test içerik: Kıdem tazminatı hesaplama...',
  array_fill(0.1, ARRAY[1536])::vector
);

-- Test search
SELECT * FROM search_legal_documents(
  array_fill(0.1, ARRAY[1536])::vector,
  5
);
```

### Step 3: Use in Code (2 minutes)

```typescript
// Import
import { getRagStatistics } from '@/lib/services/rag'

// Use
const stats = await getRagStatistics()
console.log('RAG System Ready:', stats)
```

---

## ✅ You're Done!

The RAG system is now ready. Next steps:

1. **Read full docs:** `RAG_SYSTEM_SETUP.md`
2. **Create n8n workflow:** For embedding generation
3. **Start adding documents:** Use `insertLegalDocumentWithChunks()`

---

## 📚 Quick Reference

### Insert Document

```typescript
import { insertLegalDocumentWithChunks } from '@/lib/services/rag'

await insertLegalDocumentWithChunks(
  {
    title: 'Yargıtay 9. HD E.2023/1234',
    source: 'Yargıtay',
    docType: 'içtihat',
    court: 'Yargıtay',
    chamber: '9. Hukuk Dairesi',
  },
  [
    { content: 'Text chunk 1...', chunkIndex: 0, embedding: [...] },
    { content: 'Text chunk 2...', chunkIndex: 1, embedding: [...] }
  ]
)
```

### Search Documents

```typescript
import { searchLegalDocuments } from '@/lib/services/rag'

const results = await searchLegalDocuments(
  queryEmbedding, // from n8n
  {
    matchCount: 5,
    docType: 'içtihat',
    court: 'Yargıtay'
  }
)
```

### Hybrid Search (Public + Private)

```typescript
import { hybridSearch } from '@/lib/services/rag'

const { publicResults, privateResults } = await hybridSearch(
  userId,
  caseId,
  queryEmbedding,
  { publicMatchCount: 3, privateMatchCount: 2 }
)
```

---

## 🎯 Common Use Cases

### 1. Enhance AI Case Assistant

```typescript
// Get relevant case law for user query
const { publicResults } = await hybridSearch(userId, caseId, embedding)

// Build context for AI
const context = publicResults.map(r => 
  `[${r.court}] ${r.title}: ${r.content}`
).join('\n\n')

// Call AI with context
const response = await callAI(query, context)
```

### 2. Upload Case Document

```typescript
// Generate embeddings via n8n
const { chunks } = await generateEmbeddings(documentText)

// Store as private case chunks
await insertPrivateCaseChunks(userId, caseId, chunks)
```

### 3. Search Within Case

```typescript
// Search only within this case's documents
const results = await searchPrivateCaseChunks(
  userId,
  caseId,
  queryEmbedding,
  5
)
```

---

## 🔗 Resources

- **Full Setup Guide:** `RAG_SYSTEM_SETUP.md`
- **Implementation Summary:** `RAG_IMPLEMENTATION_SUMMARY.md`
- **Service Documentation:** `src/lib/services/README.md`
- **Example API Route:** `app/api/rag/search/route.ts`

---

**Happy coding! 🎉**

