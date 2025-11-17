# LawSprinter - Proje Yapısı

## 📂 Dizin Yapısı

```
lawsprinter/
│
├── app/                          # Next.js App Router
│   ├── auth/                     # Authentication sayfaları
│   │   ├── sign-in/
│   │   │   └── page.tsx         # Giriş sayfası (Supabase Auth)
│   │   └── sign-up/
│   │       └── page.tsx         # Kayıt sayfası (Supabase Auth)
│   │
│   ├── dashboard/               # Protected dashboard sayfaları
│   │   ├── layout.tsx          # Dashboard layout (sidebar, nav)
│   │   └── page.tsx            # Dashboard ana sayfa
│   │
│   ├── layout.tsx              # Root layout (font, metadata)
│   ├── page.tsx                # Landing page
│   └── globals.css             # Global Tailwind styles
│
├── lib/                         # Utility libraries
│   ├── supabaseBrowser.ts      # Client-side Supabase client
│   └── supabaseServer.ts       # Server-side Supabase client
│
├── types/                       # TypeScript type definitions
│   └── database.ts             # Supabase database types
│
├── middleware.ts               # Next.js middleware (auth protection)
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
├── README.md                   # Proje açıklaması
├── SETUP.md                    # Kurulum rehberi
└── .env.local                  # Environment variables (create manually)
```

## 🔑 Önemli Dosyalar

### Authentication

**`lib/supabaseBrowser.ts`**
- Client-side Supabase client
- Client Component'lerde kullanılır
- Browser'da çalışır

**`lib/supabaseServer.ts`**
- Server-side Supabase client
- Server Component'lerde kullanılır
- Server'da çalışır, cookie'leri yönetir

**`middleware.ts`**
- Route protection
- Auth durumuna göre redirect
- Session refresh

### Pages

**`app/page.tsx`**
- Landing page
- Public route
- Sign-in/Sign-up linkleri

**`app/auth/sign-in/page.tsx`**
- Login formu
- Supabase signInWithPassword
- Error handling
- Dashboard'a redirect

**`app/auth/sign-up/page.tsx`**
- Kayıt formu
- Supabase signUp
- User metadata (full_name, company_name)
- Dashboard'a redirect

**`app/dashboard/layout.tsx`**
- Protected layout
- Sidebar navigation
- User menu
- Sign out functionality

**`app/dashboard/page.tsx`**
- Dashboard ana sayfa
- Stats cards
- Quick actions
- Recent activity

### Configuration

**`types/database.ts`**
- Supabase database types
- Table definitions (profiles, cases)
- Type helpers

**`tailwind.config.ts`**
- Custom colors
- Font configuration (Inter)
- Container settings

## 🔐 Authentication Flow

### Sign Up Flow
```
User → /auth/sign-up
  ↓
Form Submit → supabase.auth.signUp()
  ↓
Supabase creates user
  ↓
Trigger creates profile in DB
  ↓
Success → Redirect to /dashboard
```

### Sign In Flow
```
User → /auth/sign-in
  ↓
Form Submit → supabase.auth.signInWithPassword()
  ↓
Supabase validates credentials
  ↓
Session created
  ↓
Success → Redirect to /dashboard
```

### Protected Route Access
```
User visits /dashboard
  ↓
Middleware checks session
  ↓
No session? → Redirect to /auth/sign-in
  ↓
Has session? → Allow access
```

## 🛣️ Route Protection

### Public Routes
- `/` - Landing page
- `/auth/sign-in` - Login
- `/auth/sign-up` - Register

### Protected Routes (Require Auth)
- `/dashboard` - Dashboard
- `/dashboard/*` - All dashboard sub-routes

### Middleware Logic
- Logged in + trying to access auth pages → Redirect to `/dashboard`
- Not logged in + trying to access dashboard → Redirect to `/auth/sign-in`
- Logged in + accessing dashboard → Allow
- Not logged in + accessing public pages → Allow

## 📊 Database Schema

### profiles
```sql
- id: uuid (PK, references auth.users)
- email: text
- full_name: text
- company_name: text
- avatar_url: text
- created_at: timestamp
- updated_at: timestamp
```

### cases
```sql
- id: uuid (PK)
- user_id: uuid (FK → profiles.id)
- title: text
- description: text
- status: enum ('active', 'pending', 'closed')
- case_number: text
- client_name: text
- created_at: timestamp
- updated_at: timestamp
```

## 🎨 UI Components

### Tailwind Classes Kullanımı

**Colors:**
- Primary: `indigo-600`, `indigo-700`
- Success: `green-600`
- Warning: `yellow-600`
- Danger: `red-600`
- Gray scale: `gray-50` to `gray-900`

**Common Patterns:**
- Cards: `bg-white rounded-lg shadow-sm border border-gray-200 p-6`
- Buttons: `px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700`
- Inputs: `px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500`

## 🔄 State Management

Şu anda state management için:
- React useState (local state)
- Supabase Auth (user session)
- Server Components (server-side data)

Gelecekte eklenebilir:
- Zustand / Jotai (global state)
- React Query (server state)
- SWR (data fetching)

## 🚀 Deployment Checklist

1. ✅ Environment variables ayarlandı mı?
2. ✅ Supabase database schema oluşturuldu mu?
3. ✅ RLS policies aktif mi?
4. ✅ Trigger'lar çalışıyor mu?
5. ⏳ Production build test edildi mi?
6. ⏳ Vercel/deployment platform ayarlandı mı?

## 📝 Next Steps

### Immediate (Şimdi)
1. `.env.local` dosyası oluştur
2. Supabase projesi kur
3. Database schema'yı çalıştır
4. Test kullanıcısı oluştur

### Short Term (Yakın gelecek)
1. Dashboard sub-pages (/cases, /clients, /documents, /tasks)
2. CRUD operations
3. File upload
4. Search & filters

### Long Term (Uzun vadeli)
1. n8n webhook entegrasyonu
2. Email notifications
3. Document generation
4. Analytics dashboard
5. Multi-tenant support
6. Role-based access control

## 🛠️ Development Commands

```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint

# Type check
npx tsc --noEmit
```

## 📚 Tech Stack

- **Framework:** Next.js 14.2.18 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 3.4.15
- **Database:** Supabase (PostgreSQL)
- **Auth:** Supabase Auth
- **Deployment:** Vercel (recommended)

## 🔗 Useful Links

- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [TypeScript Docs](https://www.typescriptlang.org/docs)

