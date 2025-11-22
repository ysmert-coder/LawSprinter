# n8n Integration Guide for LawSprinter

## Overview

LawSprinter uses **n8n webhooks** for all AI and automation features. This architecture keeps the Next.js application **free from direct AI provider dependencies** and allows you to choose any AI provider (OpenAI, Ollama, DeepSeek, etc.) in your n8n workflows.

## Why n8n?

✅ **Cost-effective**: Use free/self-hosted AI models (Ollama)  
✅ **Flexible**: Switch AI providers without code changes  
✅ **Scalable**: n8n handles rate limiting and retries  
✅ **Transparent**: See all AI calls in n8n execution logs  

## Environment Variables

Add these to your `.env.local`:

```bash
# n8n Webhook URLs
N8N_CASE_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/case-assistant
N8N_STRATEGY_WEBHOOK_URL=https://your-n8n.com/webhook/strategy
N8N_CLIENT_PROFILE_WEBHOOK_URL=https://your-n8n.com/webhook/client-profile
N8N_TRAINING_WEBHOOK_URL=https://your-n8n.com/webhook/training
N8N_INVOICE_REMINDER_WEBHOOK_URL=https://your-n8n.com/webhook/invoice-reminder
N8N_CONTRACT_ANALYZE_WEBHOOK_URL=https://your-n8n.com/webhook/contract-analyze
N8N_HEARING_FOLLOWUP_WEBHOOK_URL=https://your-n8n.com/webhook/hearing-followup
N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL=https://your-n8n.com/webhook/client-status
N8N_COLLECTION_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/collection-assistant
```

## Webhook Workflows

### 1. Case Assistant (Dava Asistanı)

**Purpose**: Analyze legal documents and generate defense strategies

**Webhook URL**: `N8N_CASE_ASSISTANT_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "fileUrl": "https://...",
  "caseType": "criminal|civil|labor|family|...",
  "shortDescription": "Brief case description",
  "caseId": "uuid (optional)",
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "eventSummary": "Summary of the case events",
  "defenceOutline": "Suggested defense strategy",
  "actionItems": ["Task 1", "Task 2", "..."],
  "strengths": ["Strength 1", "..."],
  "weaknesses": ["Weakness 1", "..."],
  "recommendations": ["Recommendation 1", "..."],
  "sources": [
    {
      "id": "optional-source-id",
      "title": "Yargıtay 2. HD, 2023/1234",
      "court": "Yargıtay 2. Hukuk Dairesi",
      "url": "https://karararama.yargitay.gov.tr/...",
      "similarity": 0.87
    }
  ],
  "confidenceScore": 0.85
}
```

**RAG Integration (Optional)**:
- `sources`: Array of relevant case law from vector database (RAG system)
- `similarity`: Cosine similarity score (0-1) from vector search
- `confidenceScore`: Overall AI confidence in the analysis (0-1)

**Note**: If implementing RAG, the n8n workflow should:
1. Extract key legal concepts from the case
2. Query a vector database (Pinecone, Weaviate, Qdrant, etc.)
3. Return top 3-5 most relevant precedents
4. Include similarity scores for transparency

**n8n Workflow Structure**:
```
Webhook Trigger
  ↓
[Optional] Download File from fileUrl
  ↓
[Optional] Extract Text (PDF/DOCX parser)
  ↓
AI Node (OpenAI/Ollama/DeepSeek)
  - System Prompt: "You are a Turkish legal assistant..."
  - User Prompt: Include case type, description, file content
  ↓
Function Node (Format Response)
  ↓
Webhook Response
```

**AI Provider Options**:
- **OpenAI**: Use OpenAI node with GPT-4
- **Ollama** (Free): Use HTTP Request node → `http://localhost:11434/api/generate`
- **DeepSeek** (Cheap): Use HTTP Request node with OpenAI-compatible endpoint

---

### 2. Strategy Generator (Dava Strateji Merkezi)

**Purpose**: Generate area-specific legal strategies

**Webhook URL**: `N8N_STRATEGY_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "area": "criminal|real_estate|enforcement|family|commercial|labor|other",
  "fileUrl": "https://... (optional)",
  "question": "User's legal question",
  "caseId": "uuid (optional)",
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "summary": "Case summary",
  "keyIssues": ["Issue 1", "Issue 2", "..."],
  "recommendedStrategy": "Detailed strategy",
  "risks": ["Risk 1", "Risk 2", "..."],
  "sources": [
    {
      "id": "optional-source-id",
      "title": "İcra İflas Kanunu Madde 45",
      "court": "Yargıtay 12. HD",
      "url": "https://...",
      "similarity": 0.92
    }
  ],
  "confidenceScore": 0.88
}
```

**RAG Integration (Optional)**:
- `sources`: Array of relevant legal sources (case law, statutes, regulations)
- `similarity`: Vector search similarity score (0-1)
- `confidenceScore`: AI confidence in the strategy recommendation (0-1)

**Note**: Strategy workflows should query area-specific legal databases:
- Criminal Law → Ceza Kanunu, TCK precedents
- Real Estate → TMK, Tapu Kanunu precedents
- Enforcement → İcra İflas Kanunu precedents
- Family Law → TMK, Aile Mahkemesi kararları

**n8n Workflow Structure**:
```
Webhook Trigger
  ↓
Switch Node (by area)
  ├─ Criminal Law → AI with criminal law context
  ├─ Real Estate → AI with real estate context
  ├─ Family Law → AI with family law context
  └─ ... other areas
  ↓
Webhook Response
```

---

### 3. Client Profile Analyzer (Müşteri Profili)

**Purpose**: Analyze client communication patterns and emotional state

**Webhook URL**: `N8N_CLIENT_PROFILE_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "clientId": "uuid",
  "lastMessage": "Latest message text",
  "allMessages": [
    {
      "direction": "inbound|outbound",
      "message": "Message text",
      "timestamp": "ISO 8601"
    }
  ],
  "currentProfile": { /* existing profile if any */ },
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "sentimentScore": 0.5,  // -1 to 1
  "riskLevel": "low|medium|high",
  "communicationStyle": "Description of style",
  "emotionalState": "anxious|calm|impatient|...",
  "recommendations": ["Recommendation 1", "..."],
  "profileSummary": "Overall client profile"
}
```

---

### 4. Training Content Generator (Deprecated)

**Status**: ⚠️ **DEPRECATED** - This feature has been temporarily disabled.

**Previous Purpose**: Generate educational content for lawyers (Avukat Akademi)

**Note**: The Avukat Akademi feature has been moved to `app/_deprecated/akademi/`. 
To re-enable, see instructions in the deprecated file.

---

### 5. Invoice Reminder Generator (Ödeme Hatırlatma)

**Purpose**: Generate polite payment reminder messages

**Webhook URL**: `N8N_INVOICE_REMINDER_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "invoiceId": "uuid",
  "clientName": "Client name",
  "amount": 5000,
  "currency": "TRY",
  "dueDate": "2025-01-15",
  "daysOverdue": 5,
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "message": "Polite reminder message",
  "subject": "Email subject (optional)"
}
```

**n8n Workflow Structure**:
```
Webhook Trigger
  ↓
AI Node (Generate polite reminder)
  ↓
[Optional] Send via WhatsApp/Email/SMS
  ↓
Webhook Response
```

---

### 6. Contract Analyzer (Sözleşme Analizi)

**Purpose**: Analyze contracts for expiry dates and risks

**Webhook URL**: `N8N_CONTRACT_ANALYZE_WEBHOOK_URL`

**Input Payload**:
```json
{
  "contractId": "uuid",
  "timestamp": "ISO 8601",
  "source": "lawsprinter"
}
```

**Workflow**:
```
Webhook Trigger
  ↓
Supabase: Fetch contract & document
  ↓
Download file from storage
  ↓
AI: Extract expiry date, notice period, risk score
  ↓
Supabase: Update contract record
  ↓
Webhook Response
```

---

### 7. Hearing Follow-up (Duruşma Takibi)

**Purpose**: Generate follow-up tasks after hearings

**Webhook URL**: `N8N_HEARING_FOLLOWUP_WEBHOOK_URL`

---

### 8. Client Status Notification (Müvekkil Bildirimi)

**Purpose**: Send case updates to clients

**Webhook URL**: `N8N_CLIENT_STATUS_NOTIFY_WEBHOOK_URL`

**Important**: Messages are **lawyer-approved** before sending. The webhook receives the approved message text.

---

## AI Provider Setup Examples

### Option 1: Ollama (Free, Self-Hosted)

1. Install Ollama: `https://ollama.ai`
2. Pull a model: `ollama pull llama2`
3. In n8n, use HTTP Request node:
   - URL: `http://localhost:11434/api/generate`
   - Method: POST
   - Body:
     ```json
     {
       "model": "llama2",
       "prompt": "{{ $json.prompt }}",
       "stream": false
     }
     ```

### Option 2: OpenAI (Paid)

1. Get API key from OpenAI
2. In n8n, use OpenAI node:
   - Model: gpt-4 or gpt-3.5-turbo
   - Max Tokens: 2000
   - Temperature: 0.7

### Option 3: DeepSeek (Cheap)

1. Get API key from DeepSeek
2. Use HTTP Request node with OpenAI-compatible endpoint
3. Much cheaper than OpenAI

---

## Testing Webhooks

Use the n8n test feature or curl:

```bash
curl -X POST https://your-n8n.com/webhook/case-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test-user",
    "caseType": "criminal",
    "shortDescription": "Test case",
    "timestamp": "2025-01-01T00:00:00Z"
  }'
```

---

## Security Notes

1. **Webhook URLs**: Keep these secret in `.env.local`
2. **Authentication**: n8n webhooks should validate requests (check timestamp, user ID)
3. **Rate Limiting**: Implement in n8n to prevent abuse
4. **Data Privacy**: Ensure AI providers comply with GDPR/KVKK

---

## Troubleshooting

### Webhook not responding
- Check n8n workflow is **active**
- Check webhook URL is correct in `.env.local`
- Check n8n execution logs

### AI responses are poor quality
- Improve system prompts in n8n
- Use a better AI model (GPT-4 vs GPT-3.5)
- Provide more context in prompts

### Slow responses
- Use streaming responses (not yet implemented)
- Cache common responses
- Use faster AI models

---

### 9. Collection Assistant (Tahsilat Asistanı) 🆕

**Purpose**: Generate AI-powered collection messages for overdue invoices

**Webhook URL**: `N8N_COLLECTION_ASSISTANT_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "clientId": "uuid",
  "invoiceIds": ["uuid1", "uuid2"],
  "preferredChannel": "email|whatsapp|sms",
  "tone": "soft|neutral|firm",
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "channel": "email|whatsapp|sms",
  "subject": "Ödeme Hatırlatması (email için)",
  "message": "Ana tahsilat mesajı",
  "alternativeMessages": [
    "Alternatif mesaj 1",
    "Alternatif mesaj 2"
  ],
  "nextSteps": [
    "Önerilen adım 1",
    "Önerilen adım 2"
  ],
  "suggestedSendTime": "ISO 8601 (opsiyonel)"
}
```

**Suggested n8n Workflow**:

1. **Webhook Node** - Receives payload
2. **HTTP Request / Postgres Node** - Fetch client, invoice(s), and installment data from Supabase:
   ```sql
   SELECT 
     c.full_name, c.email, c.phone,
     i.amount, i.currency, i.due_date, i.status,
     ii.due_date as installment_due_date, ii.amount as installment_amount
   FROM invoices i
   LEFT JOIN clients c ON i.client_id = c.id
   LEFT JOIN invoice_installments ii ON i.id = ii.invoice_id
   WHERE i.id = ANY($1)
   ```
3. **Function (JS)** - Build detailed Turkish prompt:
   ```javascript
   // Calculate total debt, overdue days, payment history
   const totalDebt = invoices.reduce((sum, inv) => sum + inv.amount, 0);
   const daysOverdue = Math.max(...invoices.map(inv => 
     Math.floor((Date.now() - new Date(inv.due_date)) / (1000 * 60 * 60 * 24))
   ));
   
   const prompt = `
   Müvekkil: ${client.full_name}
   Toplam Borç: ${totalDebt} ${currency}
   Gecikme Süresi: ${daysOverdue} gün
   Kanal: ${preferredChannel}
   Ton: ${tone}
   
   Lütfen profesyonel bir tahsilat mesajı oluştur...
   `;
   ```
4. **AI Model Node** (Ollama / OpenAI / DeepSeek) - Generate collection messages:
   - Main message
   - 2-3 alternative versions
   - Next steps for lawyer
   - Suggested send time (business hours)
5. **Function (JS)** - Format response to match `CollectionAssistantResponse` type
6. **Respond to Webhook** - Return JSON

**Important Notes**:
- ⚠️ **Draft Only**: Messages are drafts and require lawyer approval before sending
- ⚠️ **No Auto-Send**: System does NOT automatically send emails/WhatsApp/SMS
- ⚠️ **Compliance**: Ensure messages comply with local debt collection laws
- ⚠️ **Tone Mapping**:
  - `soft`: Polite reminder, understanding tone
  - `neutral`: Professional business language
  - `firm`: Formal, serious, mentions legal consequences
- ⚠️ **Channel Considerations**:
  - `email`: Include subject line, formal structure
  - `whatsapp`: Conversational, shorter, emoji-friendly
  - `sms`: Very short (160 chars), direct

**Example Prompts by Tone**:

**Soft**:
```
Nazik bir hatırlatma mesajı oluştur. Müvekkille iyi ilişkileri korumak önemli.
Ödemenin unutulmuş olabileceğini varsay. Yardımcı olmak iste.
```

**Neutral**:
```
Standart iş dili kullan. Profesyonel ama dostane ol.
Ödeme tarihini ve tutarı net belirt. Ödeme seçeneklerini sun.
```

**Firm**:
```
Resmi ve ciddi bir dil kullan. Gecikmenin ciddiyetini vurgula.
Yasal süreçlere atıfta bulun. Son tarih belirt.
```

---

### 10. Draft Generator (Dilekçe Taslak Üretici) 🆕

**Purpose**: Generate AI-powered legal document drafts (petitions, responses, appeals)

**Webhook URL**: `N8N_DRAFT_GENERATOR_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "caseId": "uuid",
  "caseType": "labor|criminal|civil|family|...",
  "draftType": "dava_dilekcesi|cevap_dilekcesi|istinaf|temyiz",
  "factSummary": "Detailed case description",
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "draftText": "Full draft text in Turkish legal format",
  "usedSources": [
    {
      "title": "Yargıtay 2. HD, 2023/1234",
      "court": "Yargıtay 2. Hukuk Dairesi",
      "url": "https://karararama.yargitay.gov.tr/...",
      "similarity": 0.89
    }
  ],
  "actionItems": [
    "Tarafların tam kimlik bilgilerini ekleyin",
    "Mahkeme adını ve dosya numarasını güncelleyin"
  ],
  "notes": "Bu taslak AI tarafından üretilmiştir."
}
```

**Draft Types**:
- `dava_dilekcesi`: Initial petition to file a lawsuit
- `cevap_dilekcesi`: Response petition to a lawsuit
- `istinaf`: Appeal to regional court
- `temyiz`: Appeal to Supreme Court (Yargıtay)

**Suggested n8n Workflow**: See workflow ID `jZzmUXu5V5otcNsk` created via MCP

**Important Notes**:
- ⚠️ **Draft Only**: Generated text is a draft and requires lawyer review
- ⚠️ **No Auto-Send**: System does NOT automatically file petitions
- ⚠️ **Compliance**: Ensure drafts comply with Turkish legal format standards (HMK)
- ⚠️ **RAG Recommended**: Use vector database for better quality (Yargıtay decisions)

---

## Next Steps

1. Set up n8n instance (self-hosted or cloud)
2. Create workflows for each webhook
3. Test with dummy data
4. Configure AI provider
5. Update `.env.local` with webhook URLs
6. Test in LawSprinter UI

---

---

## RAG (Retrieval-Augmented Generation) Implementation

### Overview

RAG enhances AI responses by retrieving relevant legal documents from a vector database before generating answers. This provides:

✅ **Accuracy**: Grounded in actual case law  
✅ **Transparency**: Shows source documents  
✅ **Trust**: Lawyers can verify AI claims  
✅ **Compliance**: Reduces hallucinations  

### Architecture

```
User Query → n8n Workflow
  ↓
Extract Key Concepts (AI)
  ↓
Vector Search (Pinecone/Weaviate/Qdrant)
  ↓
Top 3-5 Similar Documents
  ↓
AI Generation (with context)
  ↓
Response + Sources + Confidence Score
```

### Vector Database Options

1. **Pinecone** (Managed, Easy)
   - Pros: No setup, fast, scalable
   - Cons: Paid service
   - n8n: Use HTTP Request node

2. **Weaviate** (Self-hosted, Open Source)
   - Pros: Free, powerful, GraphQL API
   - Cons: Requires hosting
   - n8n: Use Weaviate node

3. **Qdrant** (Self-hosted, Fast)
   - Pros: Fast, Rust-based, free
   - Cons: Requires hosting
   - n8n: Use HTTP Request node

4. **Supabase pgvector** (Integrated)
   - Pros: Already using Supabase
   - Cons: Limited features vs dedicated vector DB
   - n8n: Use Postgres node

### Data Sources for Turkish Legal RAG

1. **Yargıtay Kararları** (Supreme Court Decisions)
   - Source: https://karararama.yargitay.gov.tr
   - Scrape and vectorize key decisions

2. **Kanunlar** (Laws and Regulations)
   - TCK (Türk Ceza Kanunu)
   - TMK (Türk Medeni Kanunu)
   - İİK (İcra İflas Kanunu)
   - Source: mevzuat.gov.tr

3. **Legal Doctrine** (Optional)
   - Academic papers
   - Legal commentary

### Example n8n RAG Workflow

```
1. Webhook Trigger (receives case details)
   ↓
2. AI Node: Extract legal concepts
   Input: "Analyze this case and extract key legal concepts"
   Output: ["iş akdi feshi", "kıdem tazminatı", "ihbar tazminatı"]
   ↓
3. HTTP Request: Query Vector DB
   POST https://api.pinecone.io/query
   Body: {
     "vector": [0.1, 0.2, ...],  // embedding of concepts
     "topK": 5,
     "includeMetadata": true
   }
   ↓
4. Function: Format sources
   Map results to LegalSource[] type
   ↓
5. AI Node: Generate response with context
   System: "You are a Turkish legal assistant. Use these precedents..."
   Context: [source documents]
   User: [original question]
   ↓
6. Function: Calculate confidence score
   Based on similarity scores and AI certainty
   ↓
7. Respond to Webhook
   Return: {
     ...analysis,
     sources: [...],
     confidenceScore: 0.87
   }
```

### Embedding Models

For Turkish legal text, consider:

1. **OpenAI text-embedding-ada-002** (Paid, Good)
   - 1536 dimensions
   - Multilingual, works well with Turkish

2. **sentence-transformers/paraphrase-multilingual-mpnet-base-v2** (Free)
   - 768 dimensions
   - Good for Turkish

3. **dbmdz/bert-base-turkish-cased** (Free, Turkish-specific)
   - 768 dimensions
   - Trained on Turkish corpus

### Confidence Score Calculation

```javascript
// In n8n Function node
const avgSimilarity = sources.reduce((sum, s) => sum + s.similarity, 0) / sources.length;
const hasHighSimilarity = sources.some(s => s.similarity > 0.85);
const sourceCount = sources.length;

let confidenceScore = 0.5; // baseline

if (hasHighSimilarity) confidenceScore += 0.2;
if (avgSimilarity > 0.7) confidenceScore += 0.15;
if (sourceCount >= 3) confidenceScore += 0.15;

// AI can also provide its own confidence
// Combine both for final score
return Math.min(confidenceScore, 1.0);
```

### Frontend Display

The LawSprinter UI automatically displays:

- **Sources Section**: List of precedents with court, title, similarity %
- **Confidence Badge**: Green badge showing AI confidence (e.g., "%87 Güven Skoru")
- **Source Links**: Clickable links to original documents

### Testing RAG

1. **Without RAG** (baseline):
   ```json
   {
     "eventSummary": "...",
     "defenceOutline": "..."
   }
   ```

2. **With RAG** (enhanced):
   ```json
   {
     "eventSummary": "...",
     "defenceOutline": "...",
     "sources": [...],
     "confidenceScore": 0.87
   }
   ```

The frontend gracefully handles both formats.

---

## TypeScript Types Reference

All AI response types are defined in `lib/types/ai.ts`:

- `LegalSource`: Structure for case law references
- `CaseAssistantResponse`: CASE_ASSISTANT webhook response
- `StrategyResponse`: STRATEGY webhook response
- `CaseAssistantRequest`: CASE_ASSISTANT webhook input
- `StrategyRequest`: STRATEGY webhook input

Import these types in your n8n workflow documentation or API contracts.

---

---

### 11. Draft Reviewer (Taslak İnceleyici) 🆕

**Purpose**: AI-powered review of legal drafts to identify issues and suggest improvements

**Webhook URL**: `N8N_DRAFT_REVIEWER_WEBHOOK_URL`

**Input Payload**:
```json
{
  "userId": "uuid",
  "caseId": "uuid (optional)",
  "caseType": "labor|criminal|civil|... (optional)",
  "draftText": "Full draft text to review",
  "timestamp": "ISO 8601"
}
```

**Expected Output**:
```json
{
  "issues": [
    "Tarafların kimlik bilgileri eksik",
    "Deliller listesi yeterince detaylı değil"
  ],
  "suggestions": [
    "Olay özetini kronolojik sıraya göre düzenleyin",
    "Her iddia için kanun maddesi referansı ekleyin"
  ],
  "suggestedCitations": [
    {
      "title": "Yargıtay 9. HD, 2022/5678",
      "court": "Yargıtay 9. Hukuk Dairesi",
      "url": "https://karararama.yargitay.gov.tr/...",
      "similarity": 0.85
    }
  ],
  "overallComment": "Dilekçe genel olarak iyi yapılandırılmış..."
}
```

**Review Categories**:
1. **Issues**: Problems (missing info, contradictions, legal errors)
2. **Suggestions**: Improvement recommendations
3. **Suggested Citations**: Relevant case law (RAG-powered)
4. **Overall Comment**: General assessment

**Suggested n8n Workflow**: See workflow ID `rseVmTl0sq94NcND` created via MCP

**Important Notes**:
- ⚠️ **Advisory Only**: Review is for guidance, not final legal opinion
- ⚠️ **No Auto-Edit**: System does NOT automatically modify drafts
- ⚠️ **Constructive**: Feedback should be professional and actionable

---

### 12. Embeddings Generator (RAG System) 🆕

**Purpose**: Generate vector embeddings for legal documents to enable semantic search

**Webhook URL**: `N8N_EMBEDDINGS_WEBHOOK_URL`

**Input Payload**:
```json
{
  "text": "Long document text to chunk and embed...",
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
      "embedding": [0.123, -0.456, 0.789, ...]
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

1. **Webhook Node** - Receives text payload
2. **Function (JS)** - Split text into chunks (~500 tokens, 50 token overlap)
3. **Loop Over Items** - Process each chunk
4. **OpenAI Embeddings Node** (or Ollama) - Generate embedding (ada-002: 1536 dimensions)
5. **Aggregate** - Collect all chunks with embeddings
6. **Respond to Webhook** - Return chunks array

**Chunking Strategy**:
- Chunk size: ~500 tokens (roughly 2000 characters)
- Overlap: 50 tokens (prevents context loss at boundaries)
- For Turkish text: Consider sentence boundaries

**Important Notes**:
- ⚠️ **Vector Dimension**: Must match database schema (1536 for OpenAI ada-002)
- ⚠️ **Chunking**: Preserve semantic meaning, don't split mid-sentence
- ⚠️ **Performance**: Batch embeddings when possible (OpenAI supports up to 2048 inputs)
- ⚠️ **Cost**: OpenAI ada-002 is ~$0.0001 per 1K tokens

**Integration Points**:
- `importPublicDoc()`: Automatically chunks and embeds documents
- `searchHybridRag()`: Embeds query and searches vector database
- Draft Generator: Uses RAG to find relevant precedents
- Draft Reviewer: Suggests missing citations via RAG

**See Also**: `RAG_SYSTEM_SETUP.md` for complete documentation

---

## Support

For n8n workflow templates and support:
- n8n Community: https://community.n8n.io
- LawSprinter Issues: [GitHub repo]
- RAG Implementation: See `lib/types/ai.ts` for type definitions
