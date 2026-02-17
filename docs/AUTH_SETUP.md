# 🔐 Authentication System Setup

## Ghalinino - Tunisia E-commerce

This guide covers the complete authentication system implementation for the dual-tier (retail/wholesale) e-commerce platform.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Supabase Configuration](#supabase-configuration)
4. [Storage Bucket Setup](#storage-bucket-setup)
5. [Component Reference](#component-reference)
6. [Usage Examples](#usage-examples)
7. [Edge Cases](#edge-cases)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

The authentication system provides:

- **Email/Password Login**: Traditional authentication
- **Magic Link Login**: Passwordless email authentication
- **Retail Registration**: Simple signup for regular customers
- **Wholesale Registration**: Extended signup with business verification
- **Protected Routes**: Route guards based on auth state and roles
- **Guest Cart Migration**: Merges localStorage cart to Supabase on login

---

## ✨ Features

### Authentication Methods

| Method | Description | Use Case |
|--------|-------------|----------|
| Email/Password | Traditional login | Returning users |
| Magic Link | Passwordless via email | Quick access, less tech-savvy users |
| Social OAuth | (Future) Google, Facebook | One-click signup |

### User Types

| Type | Description | Access |
|------|-------------|--------|
| Guest | No account | Browse, add to cart (localStorage) |
| Customer | Basic account | Place orders, view history |
| Wholesale (Pending) | Applied for wholesale | Browse (sees retail prices) |
| Wholesale (Approved) | Approved wholesale | Sees wholesale prices, min quantities |
| Admin | Platform administrator | Full access to admin panel |

### Wholesale Approval Workflow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Register   │────>│   Pending    │────>│   Approved   │
│  (Form + Doc)│     │ (Admin Review)│     │ (Full Access)│
└──────────────┘     └──────┬───────┘     └──────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Rejected   │
                    │ (With Reason)│
                    └──────────────┘
```

---

## ⚙️ Supabase Configuration

### Step 1: Enable Auth Providers

1. Go to **Authentication → Providers** in Supabase Dashboard
2. Enable **Email** provider:
   - ✅ Enable email confirmations
   - ✅ Enable password reset
   - Set minimum password length: **6**
3. Enable **Magic Link** (part of Email provider):
   - Email OTP is automatically enabled with Email

### Step 2: Configure Email Templates

Go to **Authentication → Email Templates** and customize:

#### Confirmation Email (Arabic/French)

```html
<h2>أهلاً بك في غالينينو! | Bienvenue sur Ghalinino!</h2>
<p>يرجى تأكيد بريدك الإلكتروني | Veuillez confirmer votre email:</p>
<p><a href="{{ .ConfirmationURL }}">تأكيد الحساب | Confirmer le compte</a></p>
```

#### Magic Link Email

```html
<h2>رابط الدخول | Lien de connexion</h2>
<p>انقر على الرابط للدخول | Cliquez pour vous connecter:</p>
<p><a href="{{ .ConfirmationURL }}">دخول | Connexion</a></p>
<p>صالح لمدة ساعة واحدة | Valide pendant 1 heure</p>
```

### Step 3: Configure Redirect URLs

Go to **Authentication → URL Configuration**:

```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/auth/callback
  - http://localhost:5173/auth/callback (for development)
```

### Step 4: Security Settings

Go to **Authentication → Settings**:

- **JWT expiry**: 3600 (1 hour)
- **Enable refresh token rotation**: ✅
- **Refresh token reuse interval**: 10 seconds

---

## 📦 Storage Bucket Setup

### Create Buckets

1. Go to **Storage** in Supabase Dashboard
2. Create these buckets:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `business-licenses` | ❌ Private | Wholesale application documents |
| `products` | ✅ Public | Product images |
| `avatars` | ✅ Public | User profile pictures |

### Apply RLS Policies

Run `supabase/migrations/002_storage_buckets.sql` in SQL Editor.

Key policies:

```sql
-- Users upload to their own folder
(storage.foldername(name))[1] = auth.uid()::text

-- Admins can access all files
EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
```

### File Structure

```
business-licenses/
  └── {user_id}/
      └── business-license-{timestamp}.pdf

products/
  └── {category}/
      └── {product_id}/
          └── {image_index}.jpg

avatars/
  └── {user_id}/
      └── avatar.jpg
```

---

## 🧩 Component Reference

### AuthContext (`src/contexts/AuthContext.tsx`)

The central authentication provider.

```tsx
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';

// In App.tsx
<AuthProvider>
  <App />
</AuthProvider>

// In any component
const {
  // State
  user,              // Current user data
  session,           // Supabase session
  profile,           // Full profile from database
  isLoading,         // Auth state loading
  isAuthenticated,   // Is logged in
  isAdmin,           // Is admin/moderator
  isWholesale,       // Is approved wholesale
  isPendingWholesale, // Has pending wholesale application
  
  // Methods
  signIn,            // Email/password login
  signInWithMagicLink, // Magic link login
  signUp,            // Retail registration
  signUpWholesale,   // Wholesale registration
  signOut,           // Logout
  resetPassword,     // Password reset email
  updatePassword,    // Change password
  updateProfile,     // Update profile data
  refreshProfile,    // Refetch profile
} = useAuthContext();
```

### ProtectedRoute (`src/components/auth/ProtectedRoute.tsx`)

Route guard component.

```tsx
import { ProtectedRoute } from '@/components/auth';

// Basic protected route
<Route path="/account" element={
  <ProtectedRoute>
    <AccountPage />
  </ProtectedRoute>
} />

// Admin-only route
<Route path="/admin" element={
  <ProtectedRoute requireAdmin>
    <AdminDashboard />
  </ProtectedRoute>
} />

// Wholesale-only route
<Route path="/wholesale" element={
  <ProtectedRoute requireWholesale>
    <WholesaleCatalog />
  </ProtectedRoute>
} />

// Allow pending wholesale users
<Route path="/wholesale/status" element={
  <ProtectedRoute requireWholesale allowPendingWholesale>
    <WholesaleStatus />
  </ProtectedRoute>
} />
```

### Cart Migration (`src/lib/cartMigration.ts`)

Handles guest cart to authenticated cart migration.

```typescript
import { migrateGuestCart, getGuestCart, addToGuestCart } from '@/lib/cartMigration';

// Add to guest cart (when not logged in)
addToGuestCart('product-id', 2);

// Get guest cart items
const items = getGuestCart();

// Migrate on login (called automatically by AuthContext)
await migrateGuestCart(userId);
```

---

## 💡 Usage Examples

### Login Page

```tsx
import { useAuthContext } from '@/contexts/AuthContext';

function LoginPage() {
  const { signIn, signInWithMagicLink, isLoading } = useAuthContext();
  
  const handleLogin = async (email: string, password: string) => {
    const { error } = await signIn(email, password);
    if (error) {
      // Handle error
    } else {
      // Redirect to home
    }
  };
  
  const handleMagicLink = async (email: string) => {
    const { error } = await signInWithMagicLink(email);
    if (!error) {
      // Show "check your email" message
    }
  };
}
```

### Wholesale Registration

```tsx
const { signUpWholesale } = useAuthContext();

const handleSubmit = async (data: FormData, file: File | null) => {
  const { error } = await signUpWholesale({
    email: data.email,
    password: data.password,
    fullName: data.fullName,
    phone: data.phone,
    businessName: data.businessName,
    businessTaxId: data.businessTaxId,
    businessAddress: data.businessAddress,
    businessPhone: data.businessPhone,
    businessLicense: file || undefined,
  });
  
  if (!error) {
    // Show pending approval message
  }
};
```

### Conditional UI Based on Auth State

```tsx
const { isAuthenticated, isWholesale, user } = useAuthContext();

return (
  <div>
    {!isAuthenticated && (
      <Link to="/login">Sign In</Link>
    )}
    
    {isAuthenticated && (
      <span>Welcome, {user?.fullName}</span>
    )}
    
    {isWholesale && (
      <span className="text-green-600">
        Wholesale Price: {formatPrice(wholesalePrice)}
      </span>
    )}
  </div>
);
```

---

## ⚠️ Edge Cases Handled

### 1. Email Already Exists

```tsx
if (error?.message.includes('already registered')) {
  setError('This email is already registered');
}
```

### 2. Weak Password

Zod validation enforces minimum 6 characters:

```tsx
const schema = z.object({
  password: z.string().min(6),
});
```

### 3. Network Errors

```tsx
try {
  await signIn(email, password);
} catch (error) {
  setError('Network error. Please try again.');
}
```

### 4. Invalid Magic Link

Handled in `AuthCallbackPage.tsx`:

```tsx
const params = new URLSearchParams(window.location.hash.slice(1));
const errorDescription = params.get('error_description');
if (errorDescription) {
  // Show error and redirect to login
}
```

### 5. Session Expiry

Supabase auto-refreshes tokens. On failure:

```tsx
supabase.auth.onAuthStateChange((event) => {
  if (event === 'SIGNED_OUT') {
    // Clear local state
    // Redirect to login
  }
});
```

### 6. Profile Not Created

If database trigger fails, create profile client-side:

```tsx
const { data, error } = await supabase
  .from('profiles')
  .upsert({
    id: userId,
    email: email,
    full_name: fullName,
  });
```

---

## 🐛 Troubleshooting

### "Invalid login credentials"

- Check email/password are correct
- Verify email is confirmed (if confirmations enabled)
- Check user exists in Auth > Users

### Magic link not arriving

- Check spam folder
- Verify SMTP settings in Supabase
- Ensure email provider is enabled

### Profile not created on signup

- Check the `handle_new_user` trigger exists
- Verify RLS policies allow profile insertion
- Check for database errors in Supabase logs

### Storage upload fails

- Verify bucket exists
- Check RLS policies are applied
- Ensure file size < 50MB (Supabase limit)
- Verify file type is allowed

### Cart not migrating

- Check `migrateGuestCart` is called after login
- Verify cart table RLS policies
- Check localStorage is accessible

---

## 📚 Files Reference

```
src/
├── contexts/
│   └── AuthContext.tsx       # Main auth provider
├── components/
│   └── auth/
│       ├── ProtectedRoute.tsx # Route guard
│       └── index.ts
├── pages/
│   ├── LoginPage.tsx         # Login form
│   ├── RegisterPage.tsx      # Retail registration
│   ├── WholesaleRegisterPage.tsx # Wholesale registration
│   ├── AuthCallbackPage.tsx  # Magic link handler
│   └── index.ts
├── lib/
│   └── cartMigration.ts      # Guest cart utilities
└── hooks/
    └── useAuth.ts            # Legacy hook (use AuthContext)

supabase/
└── migrations/
    ├── 001_initial_schema.sql # Database tables + RLS
    └── 002_storage_buckets.sql # Storage RLS policies
```

---

Built with ❤️ for Tunisia 🇹🇳
