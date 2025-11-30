# RAG System Configuration

Bu dosya, RAG (Retrieval-Augmented Generation) sisteminin kurulumu için gerekli environment variable'ları açıklar.

## Environment Variables

`.env.local` dosyanıza şu satırları ekleyin:

```bash
# Admin Configuration
ADMIN_EMAIL=salihmrtpayoneer@gmail.com

# n8n Webhooks - RAG
N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL=https://your-n8n-instance.com/webhook/generate-embeddings
```

## Render Environment Variables

Render dashboard'dan şu environment variable'ları ekleyin:

1. **ADMIN_EMAIL**: `salihmrtpayoneer@gmail.com`
2. **N8N_GENERATE_EMBEDDINGS_WEBHOOK_URL**: n8n embedding webhook URL'iniz

## Admin User Setup

### Şifre
```
LawSprinter2025!Admin#Secure
```

### Supabase'de Admin User Oluşturma

1. Supabase Dashboard → Authentication → Users
2. "Add User" butonuna tıklayın
3. Email: `salihmrtpayoneer@gmail.com`
4. Password: `LawSprinter2025!Admin#Secure`
5. "Create User" tıklayın

## Supabase Storage Bucket

RAG sistemi için `rag_public` bucket'ı oluşturun:

1. Supabase Dashboard → Storage
2. "New bucket" butonuna tıklayın
3. Name: `rag_public`
4. Public bucket: **Yes** (evet)
5. "Create bucket" tıklayın

### Bucket Policies

Storage bucket için RLS policies:

```sql
-- Allow authenticated users to read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'rag_public');

-- Allow admin to upload
CREATE POLICY "Admin upload access"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'rag_public' 
  AND auth.email() = 'salihmrtpayoneer@gmail.com'
);

-- Allow admin to delete
CREATE POLICY "Admin delete access"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'rag_public' 
  AND auth.email() = 'salihmrtpayoneer@gmail.com'
);
```

## n8n Embedding Workflow

n8n'de "Generate Embeddings" workflow'u oluşturun:

### Input (Webhook)
```json
{
  "docId": "uuid",
  "text": "full document text",
  "isPublic": true
}
```

### Processing Steps
1. Text chunking (örn: 500 kelimelik parçalar, 50 kelime overlap)
2. Her chunk için OpenAI Embeddings API çağrısı
3. Response hazırlama

### Output (Response)
```json
{
  "docId": "uuid",
  "chunks": [
    {
      "content": "chunk text 1",
      "embedding": [0.12, -0.03, 0.45, ...]
    },
    {
      "content": "chunk text 2",
      "embedding": [0.09, 0.22, -0.11, ...]
    }
  ],
  "totalChunks": 2,
  "model": "text-embedding-3-small"
}
```

## Test

Admin olarak giriş yaptıktan sonra:

1. `/admin/rag-import` sayfasına gidin
2. Bir test PDF/DOCX/TXT dosyası yükleyin
3. Embedding oluşturulmasını bekleyin
4. Supabase'de `public_legal_docs` ve `public_legal_chunks` tablolarını kontrol edin

## Kullanım

RAG sistemi şu API route'larında otomatik kullanılır:
- `/api/case-assistant`
- `/api/strategy`
- `/api/pleading-generate`
- `/api/pleading-review`

Bu endpoint'ler `searchHybridRag()` fonksiyonunu kullanarak hem public hem private dokümanlardan ilgili içerikleri bulur ve AI'ya context olarak gönderir.

