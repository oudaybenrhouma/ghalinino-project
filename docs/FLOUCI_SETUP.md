# Flouci Payment Integration Setup

## Overview
The Flouci integration allows customers to pay online using cards, Flouci wallet, or E-Dinar. It uses Supabase Edge Functions to securely communicate with the Flouci API (V2).

## Prerequisites
1. **Flouci Developer Account**: Get your credentials from [developers.flouci.com](https://developers.flouci.com).
2. **Supabase Project**: With Edge Functions enabled.

## Environment Variables (Secrets)
Set the following secrets in your Supabase project via CLI or Dashboard:

```bash
supabase secrets set FLOUCI_APP_TOKEN=your_app_token_here
supabase secrets set FLOUCI_APP_SECRET=your_app_secret_here
```

Also ensure standard Supabase secrets are set (automatically available in Edge Functions):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (for admin operations)

## Deployment
Deploy the Edge Functions:

```bash
supabase functions deploy flouci-payment-generate
supabase functions deploy flouci-payment-verify
```

## How It Works

1. **Generation (`flouci-payment-generate`)**:
   - Client calls this function with `amount` and `order_id`.
   - Function calls Flouci API `generate_payment` (V2).
   - Function updates order `meta` with `flouci_payment_id`.
   - Returns redirect link.

2. **Verification (`flouci-payment-verify`)**:
   - Client (Success Page) calls this function with `order_id`.
   - Function looks up `flouci_payment_id` from order.
   - Function calls Flouci API `verify_payment/{id}` (V2).
   - If success:
     - Updates order `status` to `processing` and `payment_status` to `paid`.
     - Inserts record into `payment_verifications`.

## Testing
Use the Flouci Sandbox credentials provided in the developer portal.
- App Token: (Sandbox Token)
- App Secret: (Sandbox Secret)

## Frontend Integration
- **CheckoutPage**: Calls `generateFlouciPayment`.
- **OrderSuccessPage**: Calls `verifyFlouciPayment` on mount if `payment_method=flouci`.
- **OrderFailedPage**: Displayed if payment fails or user cancels.
