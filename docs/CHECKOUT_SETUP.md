# 🛒 Checkout System Setup

## Ghalinino - Tunisia E-commerce

This guide covers the complete checkout flow implementation including shipping, payment method selection, and order placement for the Tunisian market.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Checkout Flow](#checkout-flow)
4. [Components](#components)
5. [Utilities](#utilities)
6. [Validation](#validation)
7. [Usage Examples](#usage-examples)

---

## 🎯 Overview

The checkout system provides:

- **Multi-step Checkout**: 4-step flow with progress indicator
- **Guest Checkout**: Users can order without creating an account
- **Tunisia-specific**: Governorate-based shipping, local phone validation
- **Dual Pricing**: Retail vs wholesale totals calculation
- **Payment Methods**: COD (+2 TND fee), Bank Transfer, Flouci

---

## ✨ Features

### Payment Methods

| Method | Fee | Description |
|--------|-----|-------------|
| **COD** | +2 TND | Cash on Delivery - pay when receiving |
| **Bank Transfer** | Free | Pre-payment via bank transfer |
| **Flouci** | Free | Online payment (card, wallet, E-Dinar) |

### Shipping Zones

| Zone | Governorates | Retail Fee | Wholesale Fee |
|------|--------------|------------|---------------|
| **Grand Tunis** | Tunis, Ariana, Ben Arous, Manouba | 5 TND | 4 TND |
| **North** | Nabeul, Bizerte, Béja, Jendouba, etc. | 7 TND | 5 TND |
| **Center** | Sousse, Sfax, Kairouan, etc. | 8 TND | 6 TND |
| **South** | Gabès, Médenine, Tozeur, etc. | 10 TND | 8 TND |

**Note**: Wholesale orders over 500 TND get FREE shipping.

---

## 🔄 Checkout Flow

```
┌─────────────────┐
│  Step 1: Auth   │
│  • Login        │
│  • Register     │
│  • Continue as  │
│    Guest        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 2: Shipping│
│ • Full name     │
│ • Phone (+216)  │
│ • Address       │
│ • Governorate   │
│ • City          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 3: Payment │
│ • COD (+2 TND)  │
│ • Bank Transfer │
│ • Flouci        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Step 4: Review  │
│ • Summary       │
│ • Edit options  │
│ • Place Order   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Order Success   │
│ • Order number  │
│ • Confirmation  │
└─────────────────┘
```

---

## 🧩 Components

### CheckoutProgress

Step indicator with completed states.

```tsx
import { CheckoutProgress, type CheckoutStep } from '@/components/checkout';

<CheckoutProgress
  currentStep="shipping"
  completedSteps={['auth']}
  onStepClick={(step) => goToStep(step)}
/>
```

### ShippingForm

Address form with Tunisia governorates.

```tsx
import { ShippingForm } from '@/components/checkout';

<ShippingForm
  initialData={savedAddress}
  onSubmit={(address, saveToProfile) => {
    setShippingAddress(address);
    goToNextStep();
  }}
  onBack={() => goToPreviousStep()}
/>
```

**Features**:
- Pre-fills name/phone from user profile
- "Use saved address" button
- Tunisia phone validation
- All 24 governorates dropdown
- Optional "Save to profile" checkbox

### PaymentMethodSelector

Radio button selection with method details.

```tsx
import { PaymentMethodSelector } from '@/components/checkout';

<PaymentMethodSelector
  selectedMethod={paymentMethod}
  onSelect={setPaymentMethod}
  onSubmit={() => goToNextStep()}
  onBack={() => goToPreviousStep()}
/>
```

**Features**:
- Visual icons for each method
- Fee indicator ("+2 TND" or "No fee")
- Expanded info when selected
- Bank details preview (hidden RIB)

### CheckoutSummary

Order summary sidebar.

```tsx
import { CheckoutSummary } from '@/components/checkout';

<CheckoutSummary
  shippingAddress={address}
  paymentMethod="cod"
  totals={calculatedTotals}
  showItems={true}
/>
```

**Features**:
- Cart items list with thumbnails
- Subtotal, shipping, COD fee breakdown
- Wholesale discount indicator
- Total in red

### OrderReview

Final review step before placing order.

```tsx
import { OrderReview } from '@/components/checkout';

<OrderReview
  shippingAddress={address}
  paymentMethod="cod"
  totals={totals}
  onPlaceOrder={handlePlaceOrder}
  onBack={() => goToPreviousStep()}
  onEditShipping={() => goToStep('shipping')}
  onEditPayment={() => goToStep('payment')}
  isLoading={isPlacingOrder}
/>
```

---

## ⚙️ Utilities

### src/lib/checkout.ts

```typescript
import {
  calculateCheckoutTotals,
  calculateShippingFee,
  getShippingZone,
  isValidTunisianPhone,
  formatPhone,
  getPaymentMethodInfo,
  PAYMENT_METHODS,
  BANK_DETAILS,
  COD_FEE,
  WHOLESALE_FREE_SHIPPING_THRESHOLD,
} from '@/lib/checkout';

// Calculate all totals
const totals = calculateCheckoutTotals(
  subtotal,           // Cart subtotal in TND
  'tunis',            // Governorate
  'cod',              // Payment method
  isWholesale,        // Is wholesale user
  discountAmount      // Any discounts
);
// Returns: { subtotal, shippingFee, codFee, discount, total }

// Get shipping zone for a governorate
const zone = getShippingZone('nabeul'); // 'north'

// Calculate shipping fee
const fee = calculateShippingFee('sfax', false, 200);
// Retail, 200 TND subtotal → 8 TND

const wholesaleFee = calculateShippingFee('sfax', true, 600);
// Wholesale, 600 TND subtotal → 0 TND (free over 500)

// Validate Tunisian phone
isValidTunisianPhone('+216 23 456 789'); // true
isValidTunisianPhone('23456789');         // true
isValidTunisianPhone('12345678');         // false (starts with 1)

// Format phone for display
formatPhone('23456789'); // '+216 23 456 789'
```

---

## ✅ Validation

### Phone Number

Tunisian mobile numbers must:
- Start with 2-9 (not 0 or 1)
- Be exactly 8 digits
- Optionally prefixed with +216 or 216

```regex
^(\+216)?[2-9]\d{7}$
```

### Shipping Form Schema

```typescript
const shippingSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().refine(isValidTunisianPhone),
  addressLine1: z.string().min(5),
  addressLine2: z.string().optional(),
  city: z.string().min(2),
  governorate: z.string().min(1),
  postalCode: z.string().optional(),
  saveToProfile: z.boolean().optional(),
});
```

---

## 💡 Usage Examples

### Basic Checkout Page

```tsx
import { useState } from 'react';
import { useCartContext } from '@/contexts/CartContext';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  CheckoutProgress,
  ShippingForm,
  PaymentMethodSelector,
  OrderReview,
  CheckoutSummary,
} from '@/components/checkout';
import { calculateCheckoutTotals } from '@/lib/checkout';

function CheckoutPage() {
  const [step, setStep] = useState<CheckoutStep>('auth');
  const [shippingAddress, setShippingAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState(null);
  
  const { subtotal } = useCartContext();
  const { isWholesale } = useAuthContext();
  
  const totals = calculateCheckoutTotals(
    subtotal,
    shippingAddress?.governorate,
    paymentMethod || 'cod',
    isWholesale,
    0
  );
  
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        {step === 'shipping' && (
          <ShippingForm
            onSubmit={(addr) => {
              setShippingAddress(addr);
              setStep('payment');
            }}
          />
        )}
        {step === 'payment' && (
          <PaymentMethodSelector
            selectedMethod={paymentMethod}
            onSelect={setPaymentMethod}
            onSubmit={() => setStep('review')}
          />
        )}
        {step === 'review' && (
          <OrderReview
            shippingAddress={shippingAddress}
            paymentMethod={paymentMethod}
            totals={totals}
            onPlaceOrder={handlePlaceOrder}
          />
        )}
      </div>
      <div>
        <CheckoutSummary
          shippingAddress={shippingAddress}
          paymentMethod={paymentMethod}
          totals={totals}
        />
      </div>
    </div>
  );
}
```

---

## 📁 Files Reference

```
src/
├── lib/
│   └── checkout.ts           # Utilities (fees, validation)
├── components/
│   └── checkout/
│       ├── CheckoutProgress.tsx    # Step indicator
│       ├── ShippingForm.tsx        # Address form
│       ├── PaymentMethodSelector.tsx # Payment selection
│       ├── CheckoutSummary.tsx     # Order summary sidebar
│       ├── OrderReview.tsx         # Final review step
│       └── index.ts
└── pages/
    └── CheckoutPage.tsx      # Main checkout page
```

---

## 🔗 Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/checkout` | CheckoutPage | Full checkout flow |

---

## 🔜 TODO / Future Enhancements

1. **Order Creation**: Connect to Supabase orders table
2. **Flouci Integration**: Add Edge Function for Flouci API
3. **Bank Transfer Details**: Show full RIB after order confirmation
4. **Email Notifications**: Send confirmation emails
5. **Coupon Codes**: Discount code input and validation
6. **Address Book**: Select from saved addresses
7. **Guest Email Collection**: Collect email for guest checkout

---

Built with ❤️ for Tunisia 🇹🇳
