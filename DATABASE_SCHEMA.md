# LawSprinter - Database Schema Documentation

## 📊 Overview

LawSprinter multi-tenant (çok kiracılı) bir B2B SaaS uygulamasıdır. Her firma (`firm`) kendi verilerine sahiptir ve kullanıcılar sadece kendi firmalarının verilerini görebilir.

## 🏗️ Architecture

### Multi-Tenant Design

Tüm tablolar `firm_id` foreign key'i ile firma bazlı izolasyon sağlar:

```
firms (1) ─── (N) profiles
          └─── (N) clients
          └─── (N) cases
          └─── (N) tasks
          └─── (N) deadlines
          └─── (N) documents
          └─── (N) contracts
          └─── (N) case_events
          └─── (N) notifications
          └─── (N) daily_summaries
```

### Row Level Security (RLS)

Her tablo için RLS aktiftir. Kullanıcılar:
1. Kendi profillerini görebilir (`profiles.id = auth.uid()`)
2. Kendi firmalarının verilerini görebilir (`firm_id` kontrolü)

## 📋 Tables

### 1. firms
**Hukuk büroları/firmalar**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Firma adı |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Has many: profiles, clients, cases, tasks, deadlines, documents, contracts, case_events, notifications, daily_summaries

---

### 2. profiles
**Kullanıcı profilleri (auth.users ile bağlantılı)**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auth.users.id) |
| firm_id | UUID | Foreign key → firms |
| email | TEXT | E-posta adresi |
| full_name | TEXT | Ad soyad |
| role | ENUM | Rol: owner, admin, lawyer, member |
| avatar_url | TEXT | Avatar URL |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms
- Has many: tasks (as assignee)

**RLS:**
- Users can view/update their own profile only

---

### 3. clients
**Müvekkiller**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| full_name | TEXT | Müvekkil adı |
| email | TEXT | E-posta |
| phone | TEXT | Telefon |
| address | TEXT | Adres |
| notes | TEXT | Notlar |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms
- Has many: cases, notifications

**Indexes:**
- firm_id, email

---

### 4. cases
**Dosyalar/Davalar**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| client_id | UUID | Foreign key → clients |
| title | TEXT | Dava başlığı |
| case_number | TEXT | Dosya numarası |
| type | ENUM | Tür: civil, criminal, commercial, labor, family, administrative, other |
| status | ENUM | Durum: active, pending, closed, archived |
| description | TEXT | Açıklama |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, clients
- Has many: tasks, deadlines, documents, contracts, case_events, notifications

**Indexes:**
- firm_id, client_id, status, created_at

---

### 5. tasks
**Görevler**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| case_id | UUID | Foreign key → cases |
| assignee_profile_id | UUID | Foreign key → profiles |
| title | TEXT | Görev başlığı |
| description | TEXT | Açıklama |
| due_date | DATE | Bitiş tarihi |
| status | ENUM | Durum: pending, in_progress, completed, cancelled |
| priority | ENUM | Öncelik: low, medium, high, critical |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, cases, profiles (assignee)

**Indexes:**
- firm_id, case_id, assignee_profile_id, status, due_date

---

### 6. deadlines
**Süreler**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| case_id | UUID | Foreign key → cases |
| type | ENUM | Tür: hearing, filing, response, appeal, other |
| description | TEXT | Açıklama |
| date | DATE | Süre tarihi |
| critical_level | ENUM | Kritiklik: low, medium, high, critical |
| completed | BOOLEAN | Tamamlandı mı? |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, cases

**Indexes:**
- firm_id, case_id, date, completed

---

### 7. documents
**Belgeler**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| case_id | UUID | Foreign key → cases |
| title | TEXT | Belge başlığı |
| type | ENUM | Tür: petition, contract, evidence, decision, correspondence, other |
| storage_path | TEXT | Dosya yolu (Supabase Storage) |
| file_size | BIGINT | Dosya boyutu (bytes) |
| mime_type | TEXT | MIME type |
| ai_summary | TEXT | AI özeti |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, cases
- Has many: contracts

**Indexes:**
- firm_id, case_id, type

---

### 8. contracts
**Sözleşmeler (AI analizi ile)**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| case_id | UUID | Foreign key → cases |
| document_id | UUID | Foreign key → documents |
| title | TEXT | Sözleşme başlığı |
| expiry_date | DATE | Bitiş tarihi |
| notice_period_days | INTEGER | İhbar süresi (gün) |
| risk_score | INTEGER | Risk skoru (0-100) |
| summary_for_lawyer | TEXT | Avukat için özet |
| summary_for_client | TEXT | Müvekkil için özet |
| status | ENUM | Durum: active, expiring_soon, expired, renewed |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, cases, documents

**Indexes:**
- firm_id, case_id, expiry_date, status

---

### 9. case_events
**Dava olayları/güncellemeleri**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| case_id | UUID | Foreign key → cases |
| title | TEXT | Olay başlığı |
| description | TEXT | Açıklama |
| event_date | DATE | Olay tarihi |
| visible_to_client | BOOLEAN | Müvekkil görebilir mi? |
| client_message | TEXT | Müvekkil için mesaj |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |
| updated_at | TIMESTAMPTZ | Güncellenme tarihi |

**Relationships:**
- Belongs to: firms, cases

**Indexes:**
- firm_id, case_id, event_date

---

### 10. notifications
**Bildirimler (e-posta, SMS, WhatsApp)**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| client_id | UUID | Foreign key → clients |
| case_id | UUID | Foreign key → cases |
| channel | ENUM | Kanal: email, sms, whatsapp, in_app |
| subject | TEXT | Konu |
| content | TEXT | İçerik |
| status | ENUM | Durum: pending, sent, failed, delivered |
| sent_at | TIMESTAMPTZ | Gönderilme tarihi |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |

**Relationships:**
- Belongs to: firms, clients, cases

**Indexes:**
- firm_id, client_id, status, created_at

---

### 11. daily_summaries
**Günlük AI özetleri**

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| firm_id | UUID | Foreign key → firms |
| summary_date | DATE | Özet tarihi |
| content | TEXT | Özet içeriği (AI generated) |
| created_at | TIMESTAMPTZ | Oluşturulma tarihi |

**Relationships:**
- Belongs to: firms

**Indexes:**
- firm_id, summary_date

**Constraints:**
- UNIQUE(firm_id, summary_date) - Her firma için günde bir özet

---

## 🔐 Security

### Row Level Security Policies

Her tablo için aynı mantık:

```sql
-- SELECT
CREATE POLICY "Users can view own firm data"
  ON table_name FOR SELECT
  USING (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- INSERT
CREATE POLICY "Users can insert own firm data"
  ON table_name FOR INSERT
  WITH CHECK (
    firm_id IN (
      SELECT firm_id FROM profiles WHERE id = auth.uid()
    )
  );

-- UPDATE & DELETE (aynı mantık)
```

**Özel Durum: profiles**
```sql
-- Kullanıcılar sadece kendi profillerini görebilir
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);
```

## 🔄 Triggers

### 1. Auto-create Firm & Profile on Signup

```sql
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  new_firm_id UUID;
BEGIN
  -- Yeni firma oluştur
  INSERT INTO firms (name)
  VALUES (COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Law Firm'))
  RETURNING id INTO new_firm_id;

  -- Profile oluştur
  INSERT INTO profiles (id, firm_id, email, full_name, role)
  VALUES (NEW.id, new_firm_id, NEW.email, NEW.raw_user_meta_data->>'full_name', 'owner');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 2. Auto-update updated_at

Tüm tablolarda `updated_at` otomatik güncellenir:

```sql
CREATE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON table_name
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

## 📊 Common Queries

### Firma verilerini getir

```typescript
// Kullanıcının firmasını getir
const { data: profile } = await supabase
  .from('profiles')
  .select('*, firms(*)')
  .eq('id', user.id)
  .single()

// Firma davalarını getir
const { data: cases } = await supabase
  .from('cases')
  .select('*, clients(*)')
  .eq('firm_id', profile.firm_id)
  .order('created_at', { ascending: false })
```

### Yaklaşan süreler

```typescript
const { data: deadlines } = await supabase
  .from('deadlines')
  .select('*, cases(title)')
  .eq('firm_id', firmId)
  .eq('completed', false)
  .gte('date', new Date().toISOString())
  .order('date', { ascending: true })
  .limit(10)
```

### Kritik görevler

```typescript
const { data: tasks } = await supabase
  .from('tasks')
  .select('*, cases(title), profiles(full_name)')
  .eq('firm_id', firmId)
  .in('status', ['pending', 'in_progress'])
  .in('priority', ['high', 'critical'])
  .order('due_date', { ascending: true })
```

## 🔄 Migration

SQL dosyası: `supabase/migrations/001_initial_schema.sql`

**Çalıştırma:**
1. Supabase Dashboard → SQL Editor
2. Dosya içeriğini kopyala
3. Run

**Rollback (gerekirse):**
```sql
-- Tüm tabloları sil (DİKKAT!)
DROP TABLE IF EXISTS daily_summaries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS case_events CASCADE;
DROP TABLE IF EXISTS contracts CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS deadlines CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS firms CASCADE;

-- Trigger'ları sil
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS handle_updated_at();
```

## 📈 Performance

### Indexes

Tüm foreign key'ler ve sık sorgulanan alanlar indexlenmiştir:
- `firm_id` (tüm tablolarda)
- `client_id`, `case_id` (ilişkili tablolarda)
- `status`, `priority`, `date` (filtreleme için)
- `created_at` (sıralama için)

### Query Optimization Tips

1. **Always filter by firm_id first**
```typescript
// ✅ İyi
.eq('firm_id', firmId)
.eq('status', 'active')

// ❌ Kötü
.eq('status', 'active')
// firm_id filtresi yok!
```

2. **Use select() to limit columns**
```typescript
// ✅ İyi
.select('id, title, status')

// ❌ Kötü
.select('*')
```

3. **Paginate large results**
```typescript
.range(0, 49) // İlk 50 kayıt
```

## 🧪 Testing

### Test Data Oluşturma

```sql
-- Test firması
INSERT INTO firms (name) VALUES ('Test Law Firm');

-- Test müvekkili
INSERT INTO clients (firm_id, full_name, email, phone)
VALUES ('firm-uuid', 'Ahmet Yılmaz', 'ahmet@example.com', '555-1234');

-- Test davası
INSERT INTO cases (firm_id, client_id, title, type, status)
VALUES ('firm-uuid', 'client-uuid', 'Test Davası', 'civil', 'active');
```

## 📚 References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Foreign Keys](https://www.postgresql.org/docs/current/ddl-constraints.html)
- [Multi-tenant Architecture](https://supabase.com/docs/guides/auth/row-level-security#multi-tenancy)

