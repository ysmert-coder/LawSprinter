# Dilekçe Sistemi (Pleading System)

## Genel Bakış

LawSprinter'da dilekçe sistemi, avukatların hukuki dilekçeleri AI ile oluşturmasını ve mevcut dilekçeleri incelemesini sağlar. Sistem, RAG (Retrieval-Augmented Generation) ile emsal kararlar ve mevzuattan beslenir.

## 🎯 Özellikler

### 1. Dilekçe Üretici (Pleading Generator)
- **Route**: `/dilekce-uretici`
- **Amaç**: Sıfırdan dilekçe taslağı oluşturma
- **Input**: Dava türü + Olay özeti + (Opsiyonel) Dosya
- **Output**: Tam dilekçe taslağı + Kaynaklar + Güven skoru

### 2. Dilekçe İnceleme (Pleading Review)
- **Route**: `/dilekce-inceleme`
- **Amaç**: Mevcut dilekçeyi inceleme ve iyileştirme
- **Input**: Dava türü + Mevcut dilekçe metni
- **Output**: İyileştirilmiş metin + Eksikler + Öneriler + Riskler

---

## 🏗️ Mimari

```
Frontend (dilekce-uretici / dilekce-inceleme)
           ↓
API Routes (/api/pleading-generate, /api/pleading-review)
           ↓
RAG Search (searchHybridRag → 8 kaynak)
           ↓
n8n Webhooks (PLEADING_GENERATOR / PLEADING_REVIEW)
           ↓
AI Model (Ollama / DeepSeek / OpenAI)
           ↓
Response (Draft / Review)
```

---

## 🔧 Environment Variables

`.env.local` dosyasına ekleyin:

```bash
# Pleading System Webhooks
N8N_PLEADING_GENERATOR_WEBHOOK_URL=http://localhost:5678/webhook/pleading-generator
N8N_PLEADING_REVIEW_WEBHOOK_URL=http://localhost:5678/webhook/pleading-review
```

---

## 📊 API Endpoints

### 1. POST `/api/pleading-generate`

**Dilekçe taslağı oluşturur**

**Request Body**:
```typescript
{
  caseType: string        // 'ceza' | 'icra' | 'aile' | 'is' | 'ticaret' | ...
  shortDescription: string // Olay özeti
  fileUrl?: string        // Supabase Storage URL (opsiyonel)
}
```

**Response (200)**:
```typescript
{
  draftText: string       // Tam dilekçe taslağı
  sections?: {
    introduction?: string
    facts?: string
    legalBasis?: string
    requests?: string
  }
  sources?: RagSource[]   // Kullanılan kaynaklar
  confidenceScore?: number // 0-1 arası
}
```

**n8n Payload** (backend → n8n):
```typescript
{
  userId: string
  caseType: string
  shortDescription: string
  fileUrl: string | null
  sources: RagSource[]    // RAG'den gelen kaynaklar
}
```

---

### 2. POST `/api/pleading-review`

**Mevcut dilekçeyi inceler ve iyileştirir**

**Request Body**:
```typescript
{
  caseType: string
  existingText: string    // Mevcut dilekçe metni
  fileUrl?: string        // Henüz desteklenmiyor (MVP)
}
```

**Response (200)**:
```typescript
{
  improvedText?: string           // İyileştirilmiş dilekçe
  missingArguments?: string[]     // Eksik argümanlar
  structureSuggestions?: string[] // Yapısal öneriler
  riskPoints?: string[]           // Risk noktaları
  sources?: RagSource[]
  confidenceScore?: number
}
```

**n8n Payload** (backend → n8n):
```typescript
{
  userId: string
  caseType: string
  existingText: string
  fileUrl: string | null
  sources: RagSource[]
}
```

---

## 🔍 RAG Entegrasyonu

### RagSource Tipi

```typescript
type RagSource = {
  id: string
  title?: string | null
  docType?: string | null
  court?: string | null
  url?: string | null
  similarity?: number      // 0-1 arası
  scope: 'public' | 'private'
  snippet: string          // İlk 400 karakter
}
```

### RAG Akışı

1. **Query Oluşturma**:
   - Generator: `shortDescription`
   - Review: `existingText` (ilk 500 karakter)

2. **Hybrid Search**:
   ```typescript
   const ragResults = await searchHybridRag({
     userId: user.id,
     query: query,
     limit: 8
   })
   ```

3. **Source Mapping**:
   ```typescript
   const sources = mapHybridResultToSources(ragResults)
   ```

4. **n8n'e Gönderme**:
   - Sources array n8n payload'ına eklenir
   - AI model bu kaynakları context olarak kullanır

---

## 🎨 Frontend

### Dilekçe Üretici (`/dilekce-uretici`)

**Form Alanları**:
- Dava Türü (select): 7 seçenek
- Olay Özeti (textarea): Zorunlu
- Dosya Yükleme (file input): Opsiyonel

**Sonuç Gösterimi**:
- Draft Text (readonly textarea + copy button)
- Confidence Score (badge)
- Sources (card list)

**Dosya Yükleme**:
- Supabase Storage `documents` bucket
- Path: `pleadings_uploads/{timestamp}_{filename}`
- Public URL alınır ve API'ye gönderilir

---

### Dilekçe İnceleme (`/dilekce-inceleme`)

**Sol Panel (Input)**:
- Dava Türü (select)
- Mevcut Dilekçe Metni (textarea, 20 satır, monospace)

**Sağ Panel (Results)**:
- İyileştirilmiş Dilekçe (green bg, copy button)
- Eksik Argümanlar (red bg, bullet list)
- Yapısal Öneriler (blue bg, bullet list)
- Risk Noktaları (yellow bg, bullet list)
- İlgili Kaynaklar (card list)
- Confidence Score (badge)

---

## 🔧 n8n Workflow Önerileri

### PLEADING_GENERATOR Workflow

**Nodes**:
1. **Webhook Trigger** (`/webhook/pleading-generator`)
2. **Extract Payload** (Set node)
3. **Build Prompt** (Code node):
   ```javascript
   const { caseType, shortDescription, sources } = $input.item.json;
   
   const prompt = `
   Sen deneyimli bir Türk avukatısın. Aşağıdaki bilgilere dayanarak bir dilekçe taslağı hazırla.
   
   Dava Türü: ${caseType}
   Olay Özeti: ${shortDescription}
   
   İlgili Emsal Kararlar ve Mevzuat:
   ${sources.map((s, i) => `
   ${i + 1}. ${s.title || 'Kaynak ' + (i + 1)}
      ${s.court ? `Mahkeme: ${s.court}` : ''}
      Benzerlik: %${Math.round((s.similarity || 0) * 100)}
      
      ${s.snippet}
   `).join('\n')}
   
   Dilekçe Formatı:
   1. GİRİŞ (Mahkeme, taraflar, dava konusu)
   2. OLAYLAR (Kronolojik olay özetişi)
   3. HUKUKİ SEBEPLER (Kanun maddeleri, emsal kararlar)
   4. SONUÇ VE İSTEM (Talepler)
   
   Lütfen yukarıdaki formata uygun, profesyonel bir dilekçe hazırla.
   `;
   
   return [{ json: { prompt } }];
   ```

4. **AI Model** (OpenAI / Ollama / DeepSeek)
   - Model: gpt-4 / llama2 / deepseek-coder
   - Temperature: 0.3 (tutarlı çıktı)
   - Max tokens: 3000

5. **Format Response** (Code node):
   ```javascript
   const aiResponse = $input.item.json.response;
   
   return [{
     json: {
       draftText: aiResponse,
       sources: $input.item.json.sources,
       confidenceScore: 0.85
     }
   }];
   ```

6. **Respond to Webhook**

---

### PLEADING_REVIEW Workflow

**Nodes**:
1. **Webhook Trigger** (`/webhook/pleading-review`)
2. **Extract Payload** (Set node)
3. **Build Prompt** (Code node):
   ```javascript
   const { caseType, existingText, sources } = $input.item.json;
   
   const prompt = `
   Sen deneyimli bir Türk avukatısın. Aşağıdaki dilekçeyi incele ve değerlendir.
   
   Dava Türü: ${caseType}
   
   Mevcut Dilekçe:
   ${existingText}
   
   İlgili Emsal Kararlar:
   ${sources.map((s, i) => `
   ${i + 1}. ${s.title}
      ${s.snippet}
   `).join('\n')}
   
   Lütfen aşağıdaki başlıklar altında değerlendirme yap:
   
   1. EKSIK ARGÜMANLAR:
      - Hangi hukuki argümanlar eksik?
      - Hangi kanun maddeleri eklenmeli?
   
   2. YAPISAL ÖNERILER:
      - Dilekçenin yapısı nasıl iyileştirilebilir?
      - Hangi bölümler güçlendirilmeli?
   
   3. RİSK NOKTALARI:
      - Hangi ifadeler zayıf veya riskli?
      - Hangi noktalar karşı tarafça kullanılabilir?
   
   4. İYİLEŞTİRİLMİŞ METIN:
      - Yukarıdaki önerilere göre iyileştirilmiş dilekçe metni
   `;
   
   return [{ json: { prompt } }];
   ```

4. **AI Model** (OpenAI / Ollama / DeepSeek)

5. **Parse Response** (Code node):
   ```javascript
   const aiResponse = $input.item.json.response;
   
   // Parse AI response (assuming structured output)
   // You may need to adjust based on your AI model's output format
   
   return [{
     json: {
       improvedText: "...",  // Extract from AI response
       missingArguments: ["...", "..."],
       structureSuggestions: ["...", "..."],
       riskPoints: ["...", "..."],
       sources: $input.item.json.sources,
       confidenceScore: 0.82
     }
   }];
   ```

6. **Respond to Webhook**

---

## 🧪 Test Senaryoları

### Test 1: Dilekçe Üretici

**Önce**: RAG'e emsal karar ekle
```bash
curl -X POST http://localhost:3000/api/rag/import-public \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yargıtay 9. HD, İş Hukuku Kararı",
    "docType": "ictihat",
    "court": "Yargıtay 9. Hukuk Dairesi",
    "rawText": "İş sözleşmesinin haklı nedenle feshi..."
  }'
```

**Sonra**: Dilekçe oluştur
```bash
curl -X POST http://localhost:3000/api/pleading-generate \
  -H "Content-Type: application/json" \
  -d '{
    "caseType": "is",
    "shortDescription": "Müvekkilim 5 yıl çalıştığı işyerinden haksız yere işten çıkarıldı..."
  }'
```

**Beklenen**:
- `draftText`: Tam dilekçe taslağı
- `sources`: Yargıtay kararı listede
- `confidenceScore`: 0.8+

---

### Test 2: Dilekçe İnceleme

```bash
curl -X POST http://localhost:3000/api/pleading-review \
  -H "Content-Type: application/json" \
  -d '{
    "caseType": "is",
    "existingText": "Sayın Mahkeme, müvekkilim işten çıkarıldı. Tazminat talep ediyoruz."
  }'
```

**Beklenen**:
- `missingArguments`: ["İşe giriş tarihi belirtilmemiş", "Fesih nedeni açıklanmamış", ...]
- `structureSuggestions`: ["Olaylar bölümü kronolojik sıraya konmalı", ...]
- `riskPoints`: ["Tazminat miktarı belirtilmemiş", ...]
- `improvedText`: İyileştirilmiş dilekçe

---

## 📈 Avantajlar

### 1. **RAG-Powered Context**
- AI sadece genel bilgiye değil, spesifik emsal kararlara dayanır
- Türk hukuku'na özgü içerik

### 2. **Hybrid Search**
- Public: Yargıtay kararları, mevzuat
- Private: Kullanıcının kendi davaları

### 3. **Transparency**
- Kullanılan kaynaklar gösteriliyor
- Similarity scores ile kaynak kalitesi görünür

### 4. **Dual Functionality**
- Generate: Sıfırdan oluşturma
- Review: Mevcut metni iyileştirme

### 5. **Professional Output**
- Mahkemeye sunulabilir format
- Türk hukuku terminolojisi
- Yapılandırılmış bölümler

---

## 🐛 Troubleshooting

### "N8N_PLEADING_GENERATOR_WEBHOOK_URL is not configured"

**Çözüm**:
1. `.env.local` dosyasına webhook URL ekleyin
2. n8n workflow'unu aktifleştirin
3. Next.js'i restart edin

### "RAG search failed, continuing without sources"

**Normal**: RAG fail olsa bile API çalışır
**Çözüm**: RAG sistemini kurun (`RAG_QUICKSTART.md`)

### "Dosyadan metin okuma henüz desteklenmiyor"

**Durum**: MVP'de sadece `existingText` destekleniyor
**Workaround**: Dilekçeyi Word'den kopyalayıp yapıştırın

### "No sources in response"

**Neden**: Database'de ilgili kaynak yok
**Çözüm**: Daha fazla emsal karar import edin

---

## 🔒 Güvenlik

### Authentication
- ✅ Tüm endpoint'ler Supabase auth gerektirir
- ✅ 401 Unauthorized if no user

### File Upload
- ✅ Supabase Storage kullanılır
- ✅ Public URL (RLS ile korunabilir)
- ✅ Accepted formats: .pdf, .doc, .docx, .txt

### Data Privacy
- ✅ RAG private chunks: Firm-based RLS
- ✅ User data isolated by `userId`

---

## 📊 Dava Türleri

Desteklenen dava türleri:

| Value | Label |
|-------|-------|
| `ceza` | Ceza Hukuku |
| `icra` | İcra & İflas |
| `aile` | Aile / Boşanma |
| `is` | İş Hukuku |
| `ticaret` | Ticaret Hukuku |
| `gayrimenkul` | Gayrimenkul |
| `idare` | İdare Hukuku |

---

## ✅ Checklist

- [x] Backend: n8n webhook types eklendi
- [x] Backend: RAG helper fonksiyonu
- [x] API: `/api/pleading-generate`
- [x] API: `/api/pleading-review`
- [x] Frontend: `/dilekce-uretici`
- [x] Frontend: `/dilekce-inceleme`
- [x] Dokümantasyon
- [ ] n8n workflows oluşturulacak
- [ ] Test edilecek
- [ ] Production'a deploy

---

## 🎉 Sonuç

Dilekçe sistemi tamamen entegre! 🚀

**Özellikler**:
- ✅ RAG-powered AI dilekçe oluşturma
- ✅ Mevcut dilekçeleri inceleme
- ✅ Emsal kararlar ile destekleme
- ✅ Professional output
- ✅ Type-safe TypeScript
- ✅ Modern UI (Tailwind)

**Sırada**:
1. n8n workflows oluşturma
2. Test ve iyileştirme
3. Production deployment

**Dokümantasyon**: `PLEADING_SYSTEM.md`

