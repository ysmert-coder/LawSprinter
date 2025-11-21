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
  "recommendations": ["Recommendation 1", "..."]
}
```

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
  "alternativeStrategies": ["Alternative 1", "..."],
  "precedents": ["Precedent 1", "..."]
}
```

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

## Next Steps

1. Set up n8n instance (self-hosted or cloud)
2. Create workflows for each webhook
3. Test with dummy data
4. Configure AI provider
5. Update `.env.local` with webhook URLs
6. Test in LawSprinter UI

---

## Support

For n8n workflow templates and support:
- n8n Community: https://community.n8n.io
- LawSprinter Issues: [GitHub repo]
