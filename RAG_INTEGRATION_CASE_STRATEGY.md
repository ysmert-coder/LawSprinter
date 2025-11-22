# RAG Integration - Case Assistant & Strategy API

## ✅ Tamamlanan İşler

Case Assistant ve Dava Strateji Merkezi API'leri artık RAG (Retrieval-Augmented Generation) ile entegre edildi. Her iki endpoint de kullanıcı sorgusuna göre ilgili hukuki kaynakları otomatik olarak bulup AI'ya context olarak sağlıyor.

---

## 📁 Güncellenen Dosyalar

### 1. `app/api/case-assistant/route.ts` ✅

**Değişiklikler**:
- ✅ `searchHybridRag` import edildi
- ✅ `CaseAssistantSource` tipi eklendi
- ✅ RAG search entegrasyonu (8 kaynak, public + private)
- ✅ Sources array'i n8n webhook'una gönderiliyor
- ✅ Error handling (RAG fail olursa boş sources ile devam)

**Akış**:
```typescript
1. Auth kontrolü (Supabase)
2. Request body parse (fileUrl, caseType, shortDescription)
3. RAG Search:
   - Query: shortDescription || 'Genel dava analizi'
   - Limit: 8 sources
   - Public + Private chunks
4. Sources array oluştur:
   - id, title, court, url, similarity
   - scope: 'public' | 'private'
   - snippet: ilk 400 karakter
5. n8n webhook çağır (sources dahil)
6. Response döndür
```

**Request Body**:
```json
{
  "fileUrl": "https://...",
  "caseType": "labor",
  "shortDescription": "İşçi haklı fesih tazminat davası"
}
```

**n8n Payload** (sources eklendi):
```json
{
  "userId": "uuid",
  "caseType": "labor",
  "shortDescription": "İşçi haklı fesih...",
  "fileUrl": "https://...",
  "sources": [
    {
      "id": "uuid",
      "title": "Yargıtay 9. HD, 2022/5678",
      "court": "Yargıtay 9. Hukuk Dairesi",
      "url": "https://...",
      "similarity": 0.92,
      "scope": "public",
      "snippet": "İş sözleşmesinin haklı nedenle feshi..."
    }
  ]
}
```

**Response**:
```json
{
  "eventSummary": "...",
  "defenceOutline": "...",
  "actionItems": ["..."],
  "strengths": ["..."],
  "weaknesses": ["..."],
  "recommendations": ["..."],
  "sources": [...],
  "confidenceScore": 0.87
}
```

---

### 2. `app/api/strategy/route.ts` ✅

**Değişiklikler**:
- ✅ `searchHybridRag` import edildi
- ✅ `StrategySource` tipi eklendi
- ✅ RAG search entegrasyonu (8 kaynak, public + private)
- ✅ Sources array'i n8n webhook'una gönderiliyor
- ✅ Error handling (RAG fail olursa boş sources ile devam)

**Akış**:
```typescript
1. Auth kontrolü (Supabase)
2. Request body parse (area, question, fileUrl?)
3. RAG Search:
   - Query: question
   - Limit: 8 sources
   - Public + Private chunks
4. Sources array oluştur (Case Assistant ile aynı format)
5. n8n webhook çağır (sources dahil)
6. Response döndür
```

**Request Body**:
```json
{
  "area": "ceza",
  "question": "Hırsızlık suçunda ceza indirimi nasıl uygulanır?",
  "fileUrl": "https://..." // optional
}
```

**n8n Payload** (sources eklendi):
```json
{
  "userId": "uuid",
  "area": "ceza",
  "question": "Hırsızlık suçunda ceza indirimi...",
  "fileUrl": "https://...",
  "sources": [
    {
      "id": "uuid",
      "title": "Yargıtay 5. CD, 2023/1234",
      "court": "Yargıtay 5. Ceza Dairesi",
      "url": "https://...",
      "similarity": 0.89,
      "scope": "public",
      "snippet": "Hırsızlık suçunda etkin pişmanlık..."
    }
  ]
}
```

**Response**:
```json
{
  "summary": "...",
  "keyIssues": ["..."],
  "recommendedStrategy": "...",
  "risks": ["..."],
  "sources": [...],
  "confidenceScore": 0.85
}
```

---

### 3. `lib/types/ai.ts` ✅

**Değişiklikler**:
- ✅ `LegalSource` tipine `scope` ve `snippet` alanları eklendi

**Güncellenmiş LegalSource**:
```typescript
export type LegalSource = {
  id?: string
  title?: string
  court?: string
  url?: string
  similarity?: number
  scope?: 'public' | 'private'  // YENİ
  snippet?: string              // YENİ
}
```

---

## 🔧 n8n Workflow Güncellemeleri

### Case Assistant Workflow

n8n workflow'unuzda şu değişiklikleri yapın:

**Eski Payload**:
```javascript
{
  userId: string,
  caseType: string,
  shortDescription: string | null,
  fileUrl: string
}
```

**Yeni Payload** (sources eklendi):
```javascript
{
  userId: string,
  caseType: string,
  shortDescription: string | null,
  fileUrl: string,
  sources: [                    // YENİ
    {
      id: string,
      title?: string,
      court?: string,
      url?: string,
      similarity?: number,
      scope: 'public' | 'private',
      snippet: string
    }
  ]
}
```

**AI Prompt'a Ekleme**:
```javascript
const sources = $input.item.json.sources || [];

const prompt = `
Sen deneyimli bir Türk avukatısın.

Dava Türü: ${caseType}
Açıklama: ${shortDescription}
Dosya: ${fileUrl}

İlgili Emsal Kararlar ve Kaynaklar:
${sources.map((s, i) => `
${i + 1}. ${s.title || 'Kaynak ' + (i + 1)}
   ${s.court ? `Mahkeme: ${s.court}` : ''}
   ${s.scope === 'public' ? '(Genel Kaynak)' : '(Özel Kaynak)'}
   Benzerlik: %${Math.round((s.similarity || 0) * 100)}
   
   ${s.snippet}
`).join('\n')}

Yukarıdaki bilgilere dayanarak:
1. Olay özetini çıkar
2. Savunma stratejisi öner
3. Yapılması gereken işlemleri listele
4. Güçlü ve zayıf yönleri belirt
`;
```

**Response'a Sources Ekleme**:
```javascript
return {
  eventSummary: "...",
  defenceOutline: "...",
  actionItems: ["..."],
  strengths: ["..."],
  weaknesses: ["..."],
  recommendations: ["..."],
  sources: $input.item.json.sources, // Kaynakları geri döndür
  confidenceScore: 0.87
};
```

---

### Strategy Workflow

Aynı mantık Strategy workflow'u için de geçerli:

**AI Prompt'a Ekleme**:
```javascript
const sources = $input.item.json.sources || [];

const prompt = `
Sen deneyimli bir Türk avukatısın.

Alan: ${area}
Soru: ${question}

İlgili Emsal Kararlar ve Kaynaklar:
${sources.map((s, i) => `
${i + 1}. ${s.title || 'Kaynak ' + (i + 1)}
   ${s.court ? `Mahkeme: ${s.court}` : ''}
   Benzerlik: %${Math.round((s.similarity || 0) * 100)}
   
   ${s.snippet}
`).join('\n')}

Bu bilgilere dayanarak:
1. Durumu özetle
2. Anahtar hukuki konuları belirle
3. Strateji öner
4. Riskleri değerlendir
`;
```

---

## 🎨 Frontend Güncellemeleri (Önerilen)

### Case Assistant UI (`app/dava-asistani/page.tsx`)

Response'da gelen `sources` array'ini göstermek için:

```tsx
{result.sources && result.sources.length > 0 && (
  <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
    <h4 className="text-md font-semibold text-gray-900 mb-3 flex items-center">
      <svg className="w-5 h-5 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      Kullanılan Kaynaklar ({result.sources.length})
    </h4>
    <div className="space-y-3">
      {result.sources.map((source, index) => (
        <div key={index} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h5 className="text-sm font-semibold text-gray-900">
                {source.title || `Kaynak ${index + 1}`}
              </h5>
              {source.court && (
                <p className="text-xs text-gray-600 mt-1">{source.court}</p>
              )}
              {source.snippet && (
                <p className="text-xs text-gray-700 mt-2 italic">
                  "{source.snippet}"
                </p>
              )}
              {source.url && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-700 mt-1 inline-flex items-center"
                >
                  Kaynağı Görüntüle
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              )}
            </div>
            <div className="ml-4 flex flex-col items-end">
              {source.similarity !== undefined && (
                <span className="inline-flex items-center px-2 py-1 bg-indigo-100 text-indigo-700 text-xs font-medium rounded">
                  %{Math.round(source.similarity * 100)} ilgili
                </span>
              )}
              {source.scope && (
                <span className={`mt-1 inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                  source.scope === 'public' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {source.scope === 'public' ? 'Genel' : 'Özel'}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{result.confidenceScore !== undefined && (
  <div className="mt-4 inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">
    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    AI Güven Skoru: %{Math.round(result.confidenceScore * 100)}
  </div>
)}
```

### Strategy UI (`app/dava-strateji-merkezi/page.tsx`)

Aynı UI pattern'i Strategy sayfası için de kullanılabilir.

---

## 🔍 RAG Search Mantığı

### Nasıl Çalışıyor?

1. **Query Oluşturma**:
   - Case Assistant: `shortDescription || 'Genel dava analizi'`
   - Strategy: `question`

2. **Hybrid Search**:
   - Public chunks: Yargıtay kararları, mevzuat, doktrin
   - Private chunks: Kullanıcının kendi davaları ve belgeleri
   - Limit: 8 kaynak (toplamda)

3. **Similarity Scoring**:
   - Cosine similarity (0-1 arası)
   - Yüksek skor = daha ilgili kaynak

4. **Snippet Creation**:
   - İlk 400 karakter alınır
   - Uzunsa "..." eklenir
   - AI prompt'unda context olarak kullanılır

5. **Error Handling**:
   - RAG search fail olursa: `sources = []` (boş array)
   - API çağrısı devam eder
   - n8n workflow boş sources ile çalışır

---

## 🧪 Test Senaryoları

### Test 1: Case Assistant with RAG

**Önce**: RAG'e doküman ekleyin
```bash
curl -X POST http://localhost:3000/api/rag/import-public \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yargıtay 9. HD, İş Hukuku Kararı",
    "docType": "ictihat",
    "court": "Yargıtay 9. Hukuk Dairesi",
    "rawText": "İş sözleşmesinin haklı nedenle feshi durumunda işçi tazminat hakkına sahiptir..."
  }'
```

**Sonra**: Case Assistant'ı test edin
```bash
curl -X POST http://localhost:3000/api/case-assistant \
  -H "Content-Type: application/json" \
  -d '{
    "fileUrl": "https://example.com/case.pdf",
    "caseType": "labor",
    "shortDescription": "İşçi haklı fesih tazminat davası"
  }'
```

**Beklenen**: Response'da `sources` array'inde Yargıtay kararı olmalı.

### Test 2: Strategy with RAG

```bash
curl -X POST http://localhost:3000/api/strategy \
  -H "Content-Type: application/json" \
  -d '{
    "area": "is_hukuku",
    "question": "İşçinin haklı fesih durumunda hakları nelerdir?"
  }'
```

**Beklenen**: Response'da ilgili Yargıtay kararları `sources` içinde.

---

## 📊 Avantajlar

### 1. **Context-Aware AI**
- AI artık sadece genel bilgiye değil, spesifik emsal kararlara dayanıyor
- Daha doğru ve güvenilir yanıtlar

### 2. **Transparency**
- Kullanılan kaynaklar kullanıcıya gösteriliyor
- Avukat kaynakları kontrol edebiliyor

### 3. **Hybrid Search**
- Hem genel kaynaklar (public) hem özel belgeler (private)
- Kullanıcının kendi davalarından da öğreniyor

### 4. **Graceful Degradation**
- RAG fail olsa bile API çalışmaya devam ediyor
- Boş sources ile devam ediyor

### 5. **Similarity Scores**
- En ilgili kaynaklar önce gösteriliyor
- Kullanıcı kaynak kalitesini değerlendirebiliyor

---

## 🐛 Troubleshooting

### "RAG search failed, continuing without sources"

**Neden**: 
- RAG sistemi henüz kurulmamış
- n8n embeddings workflow çalışmıyor
- Database'de doküman yok

**Çözüm**:
1. RAG sistemini kurun (`RAG_QUICKSTART.md`)
2. n8n embeddings workflow'unu aktifleştirin
3. Test dokümanı import edin

### "No sources in response"

**Neden**:
- Database'de ilgili doküman yok
- Query çok spesifik, benzer kaynak bulunamadı

**Çözüm**:
1. Daha fazla doküman import edin
2. Query'yi genelleştirin
3. Similarity threshold'u düşürün (ileride)

### "Sources array is empty but RAG is working"

**Normal**: 
- Query ile ilgili kaynak bulunamadı
- Similarity score çok düşük
- Bu durumda API boş sources ile devam eder

---

## ✅ Checklist

- [x] Case Assistant API'ye RAG entegrasyonu eklendi
- [x] Strategy API'ye RAG entegrasyonu eklendi
- [x] `LegalSource` tipine `scope` ve `snippet` eklendi
- [x] Error handling (RAG fail → boş sources)
- [x] Lint hataları yok
- [x] TypeScript type-safe
- [ ] Frontend UI güncellemesi (sources gösterimi)
- [ ] n8n workflow'ları güncellenmeli (sources kullanımı)
- [ ] Test edilmeli (RAG + Case Assistant/Strategy)

---

## 🎉 Sonuç

Case Assistant ve Strategy API'leri artık RAG ile entegre! 🚀

**Akış**:
```
User Request
    ↓
API Route (auth)
    ↓
RAG Search (8 sources)
    ↓
n8n Webhook (sources dahil)
    ↓
AI Analysis (context-aware)
    ↓
Response (sources + confidence)
    ↓
Frontend (sources gösterimi)
```

**Avantajlar**:
- ✅ Context-aware AI responses
- ✅ Transparent source attribution
- ✅ Hybrid search (public + private)
- ✅ Graceful error handling
- ✅ Type-safe implementation

**Sırada**:
1. Frontend UI güncellemesi (sources gösterimi)
2. n8n workflow'larını güncelleme (sources kullanımı)
3. Test ve iyileştirme

