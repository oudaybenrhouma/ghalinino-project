/**
 * Payment Proof Modal
 * Handles both image and PDF proofs with proper signed URL generation
 */

import { useState, useEffect } from 'react';
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
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isPdf = proofPath?.toLowerCase().endsWith('.pdf');

  // Fetch a fresh signed URL every time the modal opens (or proofPath changes)
  useEffect(() => {
    if (!isOpen || !proofPath) return;

    let cancelled = false;
    setSignedUrl(null);
    setError(null);
    setLoading(true);

    supabase.storage
      .from('payment-proofs')
      .createSignedUrl(proofPath, 3600) // 1 hour
      .then(({ data, error: storageError }) => {
        if (cancelled) return;
        if (storageError) {
          console.error('Signed URL error:', storageError);
          setError(storageError.message);
        } else {
          setSignedUrl(data.signedUrl);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [isOpen, proofPath]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {isPdf ? (
              <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
            <h3 className="font-bold text-slate-800">
              {language === 'ar' ? 'وصل الدفع' : 'Preuve de paiement'}
            </h3>
            <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">
              {isPdf ? 'PDF' : 'Image'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download button */}
            {signedUrl && (
              <a
                href={signedUrl}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 transition-all"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {language === 'ar' ? 'تحميل' : 'Télécharger'}
              </a>
            )}

            {/* Close */}
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden bg-slate-50 rounded-b-2xl min-h-[400px] flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-slate-200 border-t-red-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-500">
                {language === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center gap-3 text-center p-8">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 font-medium">
                {language === 'ar' ? 'تعذّر تحميل الملف' : 'Impossible de charger le fichier'}
              </p>
              <p className="text-xs text-slate-400">{error}</p>
            </div>
          )}

          {signedUrl && !loading && (
            isPdf ? (
              // PDF: use iframe so browser renders it natively
              <iframe
                src={signedUrl}
                className="w-full h-full min-h-[500px] rounded-b-2xl border-0"
                title="Payment proof PDF"
              />
            ) : (
              // Image
              <div className="p-4 w-full h-full flex items-center justify-center">
                <img
                  src={signedUrl}
                  alt="Payment proof"
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-md"
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}