# غالينينو | Ghalinino

A Tunisia-focused dual-tier (retail/wholesale) e-commerce SPA built with React, TypeScript, Tailwind CSS, and Supabase.

## 🇹🇳 Features

- **Bilingual Support**: Full Arabic/French support with RTL layout
- **Tunisia-Optimized**: TND currency (3 decimals), governorates, shipping zones
- **Payment Methods**: COD, Bank Transfer, Flouci (via Edge Functions)
- **Trust-First UX**: Designed for the Tunisian market
- **Supabase Backend**: Auth, Database, Storage, Real-time, RLS

## 📁 Project Structure

```
src/
├── components/
│   ├── common/         # Shared UI components (Button, LanguageToggle, etc.)
│   ├── products/       # Product-related components
│   ├── cart/           # Shopping cart components
│   ├── checkout/       # Checkout flow components
│   ├── account/        # User account components
│   └── admin/          # Admin dashboard components
├── hooks/
│   ├── useAuth.ts      # Authentication hook
│   ├── useLanguage.ts  # i18n hook
│   └── index.ts        # Hook exports
├── lib/
│   ├── supabase.ts     # Supabase client (single instance)
│   ├── utils.ts        # Utility functions
│   └── i18n.ts         # Translations and i18n config
├── store/
│   └── index.ts        # Zustand global store
├── types/
│   ├── database.ts     # Supabase database types
│   └── index.ts        # TypeScript type definitions
├── pages/              # Page components
├── App.tsx             # Main app component
├── main.tsx            # React entry point
└── index.css           # Global styles with Tailwind
```

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env.local` file in the project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App Configuration
VITE_APP_NAME=Souq Tunisia
VITE_APP_ENV=development
```

### 2. Supabase Project Setup

1. **Create Project**: Go to [supabase.com](https://supabase.com) and create a new project

2. **Get Credentials**: Navigate to Settings → API and copy:
   - Project URL → `VITE_SUPABASE_URL`
   - `anon` public key → `VITE_SUPABASE_ANON_KEY`

3. **Enable Authentication**:
   - Go to Authentication → Providers
   - Enable **Email** provider
   - Enable **Magic Link** (passwordless login)
   - Configure email templates (optional)

4. **Set Up Database Tables**: 
   
   Run the complete migration script in the SQL Editor:
   - Open `supabase/migrations/001_initial_schema.sql`
   - Copy the entire file contents
   - Paste into SQL Editor and click **Run**
   
   See `supabase/README.md` for detailed documentation of all tables and RLS policies.

   **Key Features of the Schema:**
   - ✅ 9 tables with full RLS security
   - ✅ Dual pricing (retail/wholesale)
   - ✅ Wholesale approval workflow
   - ✅ Order lifecycle with stock tracking
   - ✅ Auto-generated order numbers (ORD-YYYYMMDD-XXXX)
   - ✅ Bilingual content (Arabic/French)
   - ✅ 5 sample products for testing

5. **Configure Storage** (optional):
   - Create a bucket named `products` for product images
   - Set appropriate RLS policies

### 3. Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **React 19** | UI Framework |
| **TypeScript** | Type Safety (Strict Mode) |
| **Vite** | Build Tool |
| **Tailwind CSS 4** | Styling (JIT Mode) |
| **Supabase** | Backend (Postgres, Auth, Storage, Realtime) |
| **Zustand** | State Management |
| **React Hook Form** | Form Handling |
| **Zod** | Validation |
| **React Router** | Routing |

## 💰 Currency Handling

Tunisian Dinar (TND) has 3 decimal places. In the database, prices are stored as `DECIMAL(10, 2)` in TND directly:

```sql
-- Database: 89.90 (TND as decimal)
-- Display: 89.900 TND or 89.900 د.ت

-- Example product pricing:
price = 89.90           -- Retail price
wholesale_price = 65.00  -- Wholesale price
```

For the frontend store (using millimes for precision):
```typescript
import { formatPrice } from '@/lib/utils';

formatPrice(89900, 'ar'); // "89.900 د.ت"
formatPrice(89900, 'fr'); // "89.900 TND"
```

**Note:** The frontend uses millimes (×1000) for integer arithmetic precision, while the database uses DECIMAL for simplicity.

## 🚚 Shipping Zones

| Zone | Governorates | Price |
|------|--------------|-------|
| Grand Tunis | Tunis, Ariana, Ben Arous, Manouba | 5 TND |
| North | Nabeul, Bizerte, Béja, etc. | 7 TND |
| Center | Sousse, Sfax, Kairouan, etc. | 8 TND |
| South | Gabès, Médenine, Tozeur, etc. | 10 TND |

## 🔐 Authentication

The app supports:
- **Email + Password**: Traditional signup/signin
- **Magic Link**: Passwordless email login
- **Retail Registration**: Simple customer signup
- **Wholesale Registration**: Business signup with document upload
- **Protected Routes**: Role-based access control
- **Guest Cart Migration**: Merges cart on login

See [docs/AUTH_SETUP.md](docs/AUTH_SETUP.md) for complete authentication documentation.

## 🛒 Checkout System

Multi-step checkout with Tunisia-specific features:
- **Guest Checkout**: Order without creating an account
- **Shipping Form**: All 24 Tunisian governorates, phone validation
- **Payment Methods**: COD (+2 TND), Bank Transfer, Flouci
- **Order Review**: Full summary before placement
- **Dual Pricing**: Automatic retail/wholesale totals

See [docs/CHECKOUT_SETUP.md](docs/CHECKOUT_SETUP.md) for complete checkout documentation.

## 📝 License

MIT License - Feel free to use this for your projects!

---

Built with ❤️ for Tunisia 🇹🇳
