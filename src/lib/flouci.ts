
import { supabase } from './supabase';

export interface GeneratePaymentResponse {
  success: boolean;
  redirect_link?: string;
  payment_id?: string;
  error?: string;
}

export interface VerifyPaymentResponse {
  success: boolean;
  status?: string;
  order?: any;
  error?: string;
}

export async function generateFlouciPayment(
  amount: number,
  orderId: string
): Promise<GeneratePaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('flouci-payment-generate', {
      body: {
        amount, // TND
        order_id: orderId,
        success_link: `${window.location.origin}/order-success/${orderId}?payment_method=flouci`,
        fail_link: `${window.location.origin}/order-failed/${orderId}`,
      },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Flouci generate error:', err);
    return { success: false, error: err.message };
  }
}

export async function verifyFlouciPayment(orderId: string): Promise<VerifyPaymentResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('flouci-payment-verify', {
      body: { order_id: orderId },
    });

    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Flouci verify error:', err);
    return { success: false, error: err.message };
  }
}
