/**
 * Payment Proof Modal
 * View uploaded payment proof image
 */

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/hooks';

interface PaymentProofModalProps {
  proofPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentProofModal({ proofPath, isOpen, onClose }: PaymentProofModalProps) {
  const { language } = useLanguage();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load signed URL when opening
  if (isOpen && !imageUrl && proofPath) {
    const fetchUrl = async () => {
      try {
        // If it's a public bucket, getPublicUrl. If private, createSignedUrl.
        // Assuming 'payment-proofs' is private as per previous instructions.
        const { data, error } = await supabase.storage
          .from('payment-proofs')
          .createSignedUrl(proofPath, 3600); // 1 hour

        if (error) throw error;
        setImageUrl(data.signedUrl);
      } catch (err) {
        console.error('Error loading proof:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUrl();
  }

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="font-bold text-lg">
            {language === 'ar' ? 'وصل الدفع' : 'Preuve de paiement'}
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-slate-100 min-h-[300px]">
          {loading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-red-600"></div>
          ) : imageUrl ? (
            <img src={imageUrl} alt="Payment Proof" className="max-w-full h-auto object-contain shadow-md rounded" />
          ) : (
            <p className="text-red-500">Failed to load image</p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
