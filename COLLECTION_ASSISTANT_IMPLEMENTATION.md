# Tahsilat Asistanı (Collection Assistant) Implementation

## 📅 Date: 2024-11-21

## ✅ Completed: AI-Powered Collection Message Generator

### Overview
Implemented a comprehensive AI-powered collection assistant that generates professional debt collection messages via n8n webhooks. The system supports multiple communication channels (email, WhatsApp, SMS) and adjustable tones (soft, neutral, firm).

---

## 🎯 Features

### Core Functionality
- ✅ AI-generated collection messages via n8n
- ✅ Multi-channel support (Email, WhatsApp, SMS)
- ✅ Adjustable tone (Soft, Neutral, Firm)
- ✅ Alternative message suggestions
- ✅ Next steps recommendations
- ✅ Suggested send time
- ✅ Draft-only (no auto-send)

### Security
- ✅ User authentication required
- ✅ Invoice ownership verification
- ✅ Prevents unauthorized access to other users' invoices

### User Experience
- ✅ One-click access from invoice detail
- ✅ Visual channel selection (icons)
- ✅ Tone dropdown with descriptions
- ✅ Copy-to-clipboard functionality
- ✅ Multiple message alternatives (tabs)
- ✅ Clear draft warning

---

## 🔄 Changes Made

### 1. n8n Helper (`src/lib/n8n.ts`)
**Status**: ✅ Updated

**Changes**:
```typescript
// Added to N8NWebhookType union
| 'COLLECTION_ASSISTANT'

// Added to getWebhookUrl mapping
COLLECTION_ASSISTANT: process.env.N8N_COLLECTION_ASSISTANT_WEBHOOK_URL

// Added to getN8nConfigStatus
COLLECTION_ASSISTANT: isWebhookConfigured('COLLECTION_ASSISTANT')
```

**Environment Variable**:
```bash
N8N_COLLECTION_ASSISTANT_WEBHOOK_URL=https://your-n8n.com/webhook/collection-assistant
```

---

### 2. AI Service Layer (`src/lib/services/ai.ts`)
**Status**: ✅ Enhanced

**New Types**:
```typescript
export type CollectionAssistantChannel = 'email' | 'whatsapp' | 'sms'

export interface CollectionAssistantRequest {
  clientId: string
  invoiceIds: string[]
  preferredChannel: CollectionAssistantChannel
  tone?: 'soft' | 'neutral' | 'firm'
}

export interface CollectionAssistantResponse {
  channel: CollectionAssistantChannel
  subject?: string                // email için
  message: string                 // ana metin
  alternativeMessages?: string[]  // AI'den gelen alternatif tekstler
  nextSteps?: string[]            // avukata öneriler
  suggestedSendTime?: string      // ISO string (opsiyonel)
}
```

**New Function**:
```typescript
export async function generateCollectionMessage(
  payload: CollectionAssistantRequest & { userId: string }
): Promise<CollectionAssistantResponse>
```

**Features**:
- Calls n8n COLLECTION_ASSISTANT webhook
- 20-second timeout
- Comprehensive error handling
- Turkish error messages

---

### 3. API Route (`app/api/accounting/collection-assistant/route.ts`)
**Status**: ✅ Created

**Endpoint**: `POST /api/accounting/collection-assistant`

**Request Body**:
```json
{
  "clientId": "uuid",
  "invoiceIds": ["uuid1", "uuid2"],
  "preferredChannel": "email|whatsapp|sms",
  "tone": "soft|neutral|firm"
}
```

**Response**:
```json
{
  "channel": "email",
  "subject": "Ödeme Hatırlatması",
  "message": "Sayın Müvekkil...",
  "alternativeMessages": ["Alt mesaj 1", "Alt mesaj 2"],
  "nextSteps": ["Adım 1", "Adım 2"],
  "suggestedSendTime": "2024-11-22T10:00:00Z"
}
```

**Security Features**:
1. **Authentication Check**: Returns 401 if user not authenticated
2. **Invoice Ownership Verification**:
   ```typescript
   // Fetches invoices with user_id filter
   // Compares count: requested vs. owned
   // Returns 403 if mismatch
   ```
3. **Input Validation**:
   - clientId required
   - invoiceIds must be non-empty array
   - preferredChannel must be valid
   - tone must be valid (if provided)

**Error Handling**:
- 400: Invalid input
- 401: Unauthorized
- 403: Access denied (invoice ownership)
- 500: General error
- 503: Service not configured
- 504: Timeout

---

### 4. Frontend Components

#### a) Collection Assistant Modal (`app/muhasebe/collection-assistant-modal.tsx`)
**Status**: ✅ Created

**Type**: Client Component

**Features**:

**1. Form View** (Before API call):
- **Invoice Info Card**:
  - Client name
  - Description
  - Amount (formatted with currency)
  - Status badge
- **Channel Selection**:
  - 3 visual cards with icons
  - Email (📧), WhatsApp (💬), SMS (📱)
  - Click to select
- **Tone Dropdown**:
  - Yumuşak (Nazik hatırlatma)
  - Nötr (Standart iş dili)
  - Sıkı (Resmi ve ciddi)
- **Warning Box**:
  - Yellow alert about draft nature
  - Reminds to review before sending
- **Loading State**:
  - Spinner + "Mesaj Oluşturuluyor..." text
  - Disabled submit button

**2. Response View** (After API call):
- **Subject Line** (Email only):
  - Read-only input
  - Copy button with success feedback
- **Message Tabs** (if alternatives exist):
  - "Ana Mesaj" tab
  - "Alternatif 1", "Alternatif 2" tabs
  - Switch between messages
- **Message Display**:
  - Large textarea (12 rows)
  - Monospace font
  - Read-only
  - Copy button with success feedback
- **Next Steps** (if provided):
  - Blue info box
  - Bullet list
  - "Ek Öneriler" header
- **Suggested Send Time** (if provided):
  - Green info box
  - Formatted Turkish date/time
- **Draft Warning**:
  - Yellow alert
  - Reminds to review

**UI/UX Details**:
- Modal overlay (z-50)
- Max width: 4xl
- Max height: 90vh with scroll
- Sticky header
- Smooth transitions
- Copy success feedback (2s)
- Responsive design

---

#### b) Invoice Detail Panel (`app/muhasebe/invoice-detail-panel.tsx`)
**Status**: ✅ Updated

**Changes**:
1. **Import**: Added `CollectionAssistantModal`
2. **State**: Added `showCollectionAssistant` boolean
3. **Button**: Added "Tahsilat Asistanı (AI)" button
   - Gradient background (purple to indigo)
   - Lightning bolt icon
   - Only shown for unpaid/non-cancelled invoices
   - Positioned at top of content area
4. **Modal Render**: Conditionally renders modal when button clicked

**Button Styling**:
```tsx
className="inline-flex items-center px-4 py-2 
  bg-gradient-to-r from-purple-600 to-indigo-600 
  text-white text-sm font-medium rounded-lg 
  hover:from-purple-700 hover:to-indigo-700 
  transition-all shadow-sm"
```

---

### 5. Documentation (`N8N_INTEGRATION.md`)
**Status**: ✅ Updated

**New Section**: "9. Collection Assistant (Tahsilat Asistanı)"

**Content Includes**:
- Purpose and use case
- Webhook URL environment variable
- Input payload schema
- Expected output schema
- Suggested n8n workflow (6 steps)
- SQL query example for data fetching
- JavaScript prompt building example
- Important notes and warnings
- Tone mapping guidelines
- Channel-specific considerations
- Example prompts for each tone

**Key Guidelines**:
- ⚠️ Draft only, no auto-send
- ⚠️ Compliance with debt collection laws
- ⚠️ Tone descriptions (soft/neutral/firm)
- ⚠️ Channel best practices

---

## 📊 Data Flow

### Complete Flow
```
User clicks "Tahsilat Asistanı" button
     ↓
Modal opens with form
     ↓
User selects:
  - Channel (email/whatsapp/sms)
  - Tone (soft/neutral/firm)
     ↓
User clicks "Mesaj Oluştur"
     ↓
Frontend: POST /api/accounting/collection-assistant
     ↓
API: Authenticate user
     ↓
API: Verify invoice ownership
     ↓
API: Call generateCollectionMessage()
     ↓
Service: Call n8n webhook (COLLECTION_ASSISTANT)
     ↓
n8n: Fetch client + invoice data from Supabase
     ↓
n8n: Build Turkish prompt with context
     ↓
n8n: Call AI model (Ollama/OpenAI/DeepSeek)
     ↓
n8n: Format response (main + alternatives + next steps)
     ↓
n8n: Return JSON to API
     ↓
API: Return to frontend
     ↓
Modal: Display response
     ↓
User: Review, copy, and manually send
```

---

## 🎨 UI Screenshots (Description)

### 1. Invoice Detail with Button
- Invoice summary card at top
- Purple gradient "Tahsilat Asistanı (AI)" button with lightning icon
- Button only visible for unpaid invoices

### 2. Collection Assistant Modal - Form
- Header: "Tahsilat Asistanı" with subtitle
- Invoice info card (gray background)
- 3 channel cards in a row (visual selection)
- Tone dropdown with descriptions
- Yellow warning box
- Cancel + Submit buttons

### 3. Collection Assistant Modal - Response (Email)
- Subject line with copy button
- Message tabs (if alternatives exist)
- Large message textarea with copy button
- Blue "Ek Öneriler" box (if provided)
- Green "Önerilen gönderim zamanı" box (if provided)
- Yellow draft warning
- Close button

---

## 🔒 Security & Validation

### Authentication
- ✅ Supabase auth check on every API call
- ✅ 401 Unauthorized if no user

### Authorization
- ✅ Invoice ownership verification via SQL query
- ✅ Compares requested invoice count vs. owned count
- ✅ 403 Forbidden if mismatch
- ✅ Prevents cross-user invoice access

### Input Validation
- ✅ clientId required (string)
- ✅ invoiceIds required (non-empty array)
- ✅ preferredChannel enum validation
- ✅ tone enum validation (optional)
- ✅ 400 Bad Request for invalid input

### Error Handling
- ✅ Specific error messages for each scenario
- ✅ Console logging for debugging
- ✅ User-friendly Turkish error messages
- ✅ Timeout handling (504)
- ✅ Configuration check (503)

---

## 🧪 Testing Checklist

### Manual Testing Steps

1. **Access Button**:
   - [ ] Open invoice detail for unpaid invoice
   - [ ] Verify "Tahsilat Asistanı (AI)" button is visible
   - [ ] Verify button NOT visible for paid invoice
   - [ ] Click button, modal opens

2. **Form Validation**:
   - [ ] All 3 channels are selectable
   - [ ] Selected channel is highlighted (indigo border)
   - [ ] Tone dropdown has 3 options
   - [ ] Warning message is visible

3. **API Call - Success**:
   - [ ] Select email channel + neutral tone
   - [ ] Click "Mesaj Oluştur"
   - [ ] Loading state shows (spinner + text)
   - [ ] Response displays after ~5-10s
   - [ ] Subject line visible (email only)
   - [ ] Message is readable
   - [ ] Copy buttons work

4. **API Call - Error**:
   - [ ] Disconnect n8n (or use invalid URL)
   - [ ] Try to generate message
   - [ ] Error message displays in red box
   - [ ] User-friendly Turkish message

5. **Alternative Messages**:
   - [ ] If n8n returns alternativeMessages
   - [ ] Tabs appear ("Ana Mesaj", "Alternatif 1", etc.)
   - [ ] Click tabs to switch messages
   - [ ] Copy button works for each

6. **Next Steps**:
   - [ ] If n8n returns nextSteps
   - [ ] Blue box appears with bullet list
   - [ ] All steps are readable

7. **Copy Functionality**:
   - [ ] Click copy button on subject
   - [ ] Button shows "Kopyalandı" with checkmark
   - [ ] Paste in external app, verify content
   - [ ] Click copy button on message
   - [ ] Verify same behavior

8. **Security**:
   - [ ] Try to access another user's invoice
   - [ ] Verify 403 error
   - [ ] Try without authentication
   - [ ] Verify 401 error

---

## 📁 Files Created/Modified

### Created Files (2)
1. ✅ `app/api/accounting/collection-assistant/route.ts` - API endpoint
2. ✅ `app/muhasebe/collection-assistant-modal.tsx` - Modal component

### Modified Files (4)
1. ✅ `src/lib/n8n.ts` - Added COLLECTION_ASSISTANT support
2. ✅ `src/lib/services/ai.ts` - Added types and helper function
3. ✅ `app/muhasebe/invoice-detail-panel.tsx` - Added button and modal
4. ✅ `N8N_INTEGRATION.md` - Added documentation section

### Documentation Files (1)
1. ✅ `COLLECTION_ASSISTANT_IMPLEMENTATION.md` - This file

---

## 🚀 Deployment Checklist

### Before Deploying

1. **Environment Variables**:
   - [ ] Add `N8N_COLLECTION_ASSISTANT_WEBHOOK_URL` to `.env.local`
   - [ ] Add same variable to Render.com environment variables
   - [ ] Verify URL is accessible

2. **n8n Workflow**:
   - [ ] Create workflow in n8n
   - [ ] Add Webhook node (POST)
   - [ ] Add Supabase/Postgres node for data fetching
   - [ ] Add AI model node (Ollama/OpenAI/DeepSeek)
   - [ ] Add response formatting
   - [ ] Test workflow with sample data
   - [ ] Activate workflow

3. **Code Quality**:
   - [ ] Run `npm run lint` (no errors)
   - [ ] Run `npm run build` (successful)
   - [ ] Test locally with real n8n webhook
   - [ ] Verify all error scenarios

4. **Database**:
   - [ ] Ensure `invoices` table has `client_id`, `user_id`
   - [ ] Ensure `clients` table has `full_name`, `email`, `phone`
   - [ ] Ensure `invoice_installments` table exists (if using)

---

## 💡 Usage Examples

### Example 1: Soft Reminder (Email)
**User Action**:
- Opens overdue invoice (5 days late)
- Clicks "Tahsilat Asistanı"
- Selects: Email, Yumuşak

**n8n Generates**:
```
Konu: Ödeme Hatırlatması - [Müvekkil Adı]

Sayın [Müvekkil Adı],

Umarım bu mesaj sizi iyi sağlıkta bulur. [Tarih] tarihli 
[Tutar] tutarındaki faturanızın ödeme tarihi geçmiş görünüyor.

Ödemenin unutulmuş olabileceğini düşünerek nazikçe 
hatırlatmak istedik. Herhangi bir sorun yaşıyorsanız, 
lütfen bizimle iletişime geçmekten çekinmeyin.

Saygılarımızla,
[Avukat Adı]
```

### Example 2: Firm Notice (WhatsApp)
**User Action**:
- Opens severely overdue invoice (30+ days)
- Clicks "Tahsilat Asistanı"
- Selects: WhatsApp, Sıkı

**n8n Generates**:
```
Sayın [Müvekkil Adı],

[Tarih] tarihli [Tutar] tutarındaki borcunuz 30 günü 
aşkın süredir ödenmemiştir.

Yasal süreçleri başlatmak zorunda kalmamak için 
ödemenizi en geç [Son Tarih] tarihine kadar 
yapmanızı rica ederiz.

Detaylı görüşme için ofisimizi arayabilirsiniz.

[Avukat Adı]
[Telefon]
```

---

## ⚠️ Important Notes

### Legal Compliance
- ⚠️ **Debt Collection Laws**: Ensure messages comply with Turkish debt collection regulations
- ⚠️ **KVKK Compliance**: Respect personal data protection laws
- ⚠️ **Professional Ethics**: Follow bar association guidelines

### Technical Limitations
- ❌ **No Auto-Send**: System does NOT send messages automatically
- ❌ **No Email Integration**: Requires manual copy-paste to email client
- ❌ **No WhatsApp API**: Requires manual sending via WhatsApp Business
- ❌ **No SMS Gateway**: Requires manual sending via SMS service

### Best Practices
- ✅ **Always Review**: Never send AI-generated messages without review
- ✅ **Personalize**: Add personal touches to AI-generated text
- ✅ **Track**: Keep records of all collection communications
- ✅ **Follow Up**: Use "Next Steps" suggestions for follow-up actions

---

## 🎯 Summary

**Total Work**:
- 2 New files (API route + Modal component)
- 4 Modified files (n8n helper, AI service, invoice panel, docs)
- 1 New documentation file

**Features Delivered**:
- ✅ AI-powered collection message generation
- ✅ Multi-channel support (Email, WhatsApp, SMS)
- ✅ Adjustable tone (Soft, Neutral, Firm)
- ✅ Alternative message suggestions
- ✅ Next steps recommendations
- ✅ Copy-to-clipboard functionality
- ✅ Comprehensive security and validation
- ✅ User-friendly UI with clear warnings

**Status**: ✅ **COMPLETE AND READY FOR TESTING**

**Next Actions**:
1. Set up n8n workflow
2. Configure environment variable
3. Test with real invoices
4. Review AI-generated messages
5. Deploy to production

---

## 📞 Support

For questions or issues:
- Check n8n workflow logs
- Review API error messages in browser console
- Verify environment variables are set
- Test n8n webhook directly with Postman/curl

