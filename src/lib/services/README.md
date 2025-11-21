# LawSprinter Service Layer

Bu klasör, Supabase ile konuşan tüm service fonksiyonlarını içerir. Tüm servisler:

- ✅ **Type-safe:** `types/database.ts` tiplerini kullanır
- ✅ **Server-side:** `lib/supabaseServer.ts` client'ı kullanır
- ✅ **Error handling:** Try/catch ile hata yönetimi
- ✅ **Logging:** Console logging ile debug desteği
- ✅ **Multi-tenant:** Tüm fonksiyonlar `firmId` gerektirir

## 📁 Dosyalar

### `cases.ts`
Dava/dosya yönetimi

**Fonksiyonlar:**
- `getFirmCases(firmId)` - Firma davalarını listele
- `createCase(firmId, data)` - Yeni dava oluştur
- `getCaseById(firmId, caseId)` - Dava detayını getir (ilişkili verilerle)
- `updateCaseStatus(firmId, caseId, status)` - Dava durumunu güncelle
- `getCasesByStatus(firmId, status)` - Duruma göre davaları listele

### `contracts.ts`
Sözleşme yönetimi (AI analizi ile)

**Fonksiyonlar:**
- `createContractWithDocument(firmId, caseId, data)` - Belge + sözleşme oluştur
- `updateContractAnalysis(contractId, analysis)` - AI analiz sonuçlarını kaydet
- `getExpiringContracts(firmId, daysAhead)` - Süresi yaklaşan sözleşmeler
- `getContractById(firmId, contractId)` - Sözleşme detayı
- `updateContractStatus(contractId, status)` - Sözleşme durumunu güncelle

### `deadlines.ts`
Süre yönetimi

**Fonksiyonlar:**
- `createDeadline(firmId, caseId, data)` - Yeni süre oluştur
- `getUpcomingDeadlines(firmId, fromDate, toDate)` - Yaklaşan süreler
- `getCriticalDeadlines(firmId, daysAhead)` - Kritik süreler
- `markDeadlineCompleted(firmId, deadlineId)` - Süreyi tamamlandı olarak işaretle
- `getOverdueDeadlines(firmId)` - Geçmiş süreler
- `getCaseDeadlines(firmId, caseId)` - Davaya ait süreler

### `caseEvents.ts`
Dava olayları/güncellemeleri

**Fonksiyonlar:**
- `createCaseEvent(firmId, caseId, data)` - Yeni olay oluştur
- `markEventClientMessage(caseEventId, clientMessage)` - Müvekkil mesajı ekle
- `getCaseEvents(firmId, caseId)` - Dava olaylarını listele
- `getClientVisibleEvents(firmId, caseId)` - Müvekkil görebileceği olaylar
- `toggleEventVisibility(firmId, caseEventId, visible)` - Görünürlüğü değiştir
- `getRecentFirmEvents(firmId, limit)` - Son olaylar (tüm davalar)
- `deleteCaseEvent(firmId, caseEventId)` - Olay sil

### `dailySummaries.ts`
Günlük AI özetleri

**Fonksiyonlar:**
- `upsertDailySummary(firmId, date, content)` - Özet oluştur/güncelle
- `getLatestSummary(firmId)` - En son özeti getir
- `getSummaryByDate(firmId, date)` - Tarihe göre özet
- `getSummariesByDateRange(firmId, fromDate, toDate)` - Tarih aralığı
- `getRecentSummaries(firmId, days)` - Son N günün özetleri
- `deleteDailySummary(firmId, date)` - Özet sil
- `getSummaryStats(firmId)` - Özet istatistikleri

### `rag.ts` ✨ NEW!
RAG (Retrieval Augmented Generation) - Semantik arama ve bilgi tabanı

**Legal Documents (Public):**
- `insertLegalDocumentWithChunks(doc, chunks)` - Hukuk belgesi + embeddingler ekle
- `searchLegalDocuments(embedding, options)` - Semantik arama (Yargıtay, mevzuat)
- `getLegalDocumentWithChunks(documentId)` - Belge + chunk'ları getir
- `deactivateLegalDocument(documentId)` - Belgeyi pasifleştir

**Private Case Chunks:**
- `insertPrivateCaseChunks(userId, caseId, chunks)` - Dosya bazlı özel bilgi ekle
- `searchPrivateCaseChunks(userId, caseId, embedding, count)` - Dosya içi arama
- `getPrivateCaseChunks(userId, caseId)` - Tüm chunk'ları getir
- `deletePrivateCaseChunks(userId, chunkIds)` - Chunk'ları sil
- `deleteAllPrivateCaseChunks(userId, caseId)` - Tüm chunk'ları sil

**Hybrid Search:**
- `hybridSearch(userId, caseId, embedding, options)` - Public + Private birleşik arama

**Statistics:**
- `getRagStatistics()` - RAG sistem istatistikleri

**Detaylı Dokümantasyon:** `RAG_SYSTEM_SETUP.md`

## 🚀 Kullanım

### Import

```typescript
// Tüm servisleri import et
import * as CaseService from '@/lib/services/cases'
import * as ContractService from '@/lib/services/contracts'
import * as DeadlineService from '@/lib/services/deadlines'
import * as CaseEventService from '@/lib/services/caseEvents'
import * as DailySummaryService from '@/lib/services/dailySummaries'

// Veya index'ten toplu import
import {
  getFirmCases,
  createCase,
  createDeadline,
  upsertDailySummary,
  // RAG System ✨ NEW!
  searchLegalDocuments,
  hybridSearch,
} from '@/lib/services'
```

### Server Component'te Kullanım

```typescript
import { getFirmCases } from '@/lib/services/cases'
import { createClient } from '@/lib/supabaseServer'

export default async function CasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }

  // Get user's firm_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  // Use service
  const cases = await getFirmCases(profile.firm_id)

  return (
    <div>
      {cases.map(case => (
        <div key={case.id}>{case.title}</div>
      ))}
    </div>
  )
}
```

### Server Action'da Kullanım

```typescript
'use server'

import { createCase } from '@/lib/services/cases'
import { createClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'

export async function createNewCase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('firm_id')
    .eq('id', user.id)
    .single()

  const newCase = await createCase(profile.firm_id, {
    client_id: formData.get('client_id') as string,
    title: formData.get('title') as string,
    type: formData.get('type') as any,
    description: formData.get('description') as string,
  })

  revalidatePath('/dashboard/cases')
  return newCase
}
```

### API Route'ta Kullanım

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getCriticalDeadlines } from '@/lib/services/deadlines'
import { createClient } from '@/lib/supabaseServer'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('firm_id')
      .eq('id', user.id)
      .single()

    const deadlines = await getCriticalDeadlines(profile.firm_id, 7)

    return NextResponse.json({ deadlines })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
```

## 📊 Örnek Kullanım Senaryoları

### 1. Yeni Dava Oluştur

```typescript
import { createCase } from '@/lib/services/cases'

const newCase = await createCase(firmId, {
  client_id: 'client-uuid',
  title: 'İş Davası - Ahmet Yılmaz',
  type: 'labor',
  description: 'İşçi alacakları davası',
  case_number: '2024/123',
  status: 'active',
})
```

### 2. Sözleşme + Belge Oluştur

```typescript
import { createContractWithDocument } from '@/lib/services/contracts'

const { contract, document } = await createContractWithDocument(
  firmId,
  caseId,
  {
    title: 'Hizmet Sözleşmesi',
    type: 'contract',
    storage_path: 'contracts/2024/contract-123.pdf',
    file_size: 1024000,
    mime_type: 'application/pdf',
  }
)

// AI analizi sonrası güncelle
await updateContractAnalysis(contract.id, {
  expiry_date: '2025-12-31',
  notice_period_days: 30,
  risk_score: 25,
  summary_for_lawyer: 'Standart hizmet sözleşmesi...',
  summary_for_client: 'Sözleşmeniz 2025 sonuna kadar geçerli...',
})
```

### 3. Kritik Süreleri Getir

```typescript
import { getCriticalDeadlines } from '@/lib/services/deadlines'

// Önümüzdeki 7 günün kritik süreleri
const criticalDeadlines = await getCriticalDeadlines(firmId, 7)

criticalDeadlines.forEach(deadline => {
  console.log(`${deadline.description} - ${deadline.date}`)
})
```

### 4. Dava Olayı Oluştur

```typescript
import { createCaseEvent } from '@/lib/services/caseEvents'

const event = await createCaseEvent(firmId, caseId, {
  title: 'Duruşma Yapıldı',
  description: 'İlk duruşma gerçekleşti. Bilirkişi raporu talep edildi.',
  event_date: '2024-11-15',
  visible_to_client: true,
  client_message: 'Duruşma başarılı geçti. Bilirkişi raporu bekleniyor.',
})
```

### 5. Günlük Özet Oluştur

```typescript
import { upsertDailySummary } from '@/lib/services/dailySummaries'

const today = new Date().toISOString().split('T')[0]

const summary = await upsertDailySummary(
  firmId,
  today,
  `Bugün 3 duruşma yapıldı, 2 dilekçe hazırlandı. 
   Kritik süreler: Yıldız A.Ş. davası için 2 gün içinde cevap verilmeli.`
)
```

## 🔐 Güvenlik

Tüm servisler:
- ✅ `firmId` parametresi gerektirir
- ✅ RLS (Row Level Security) ile korunur
- ✅ Server-side çalışır (client'ta kullanılamaz)
- ✅ Authentication kontrolü yapılmalı (service'ten önce)

## ⚠️ Önemli Notlar

### 1. firmId Kontrolü

```typescript
// ❌ Yanlış - firmId kontrolü yok
const cases = await getFirmCases(someRandomId)

// ✅ Doğru - Kullanıcının firmId'si
const { data: profile } = await supabase
  .from('profiles')
  .select('firm_id')
  .eq('id', user.id)
  .single()

const cases = await getFirmCases(profile.firm_id)
```

### 2. Error Handling

```typescript
try {
  const cases = await getFirmCases(firmId)
  // Success
} catch (error) {
  console.error('Failed to fetch cases:', error)
  // Handle error (show toast, redirect, etc.)
}
```

### 3. Type Safety

```typescript
import { Database } from '@/types/database'

// Enum kullanımı
const caseType: Database['public']['Enums']['case_type'] = 'civil'
const status: Database['public']['Enums']['case_status'] = 'active'

await createCase(firmId, {
  client_id: 'uuid',
  title: 'Test',
  type: caseType, // Type-safe
  status: status,  // Type-safe
})
```

## 🧪 Testing

```typescript
// Mock Supabase client for testing
jest.mock('@/lib/supabaseServer', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => ({
            data: mockData,
            error: null,
          })),
        })),
      })),
    })),
  })),
}))
```

## 📚 Daha Fazla Bilgi

- **Database Schema:** `DATABASE_SCHEMA.md`
- **RAG System:** `RAG_SYSTEM_SETUP.md` ✨ NEW!
- **Type Definitions:** `types/database.ts`
- **Supabase Client:** `lib/supabaseServer.ts`

