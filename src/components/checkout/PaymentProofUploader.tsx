import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

interface PaymentProofUploaderProps {
  orderId: string;
  onUploadSuccess: (url: string) => void;
  onError?: (error: string) => void;
}

export const PaymentProofUploader: React.FC<PaymentProofUploaderProps> = ({
  orderId,
  onUploadSuccess,
  onError,
}) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      // Basic validation: max 5MB, images or PDF only
      if (selectedFile.size > 5 * 1024 * 1024) {
        onError?.('File size exceeds 5MB limit.');
        return;
      }
      if (!['image/jpeg', 'image/png', 'application/pdf'].includes(selectedFile.type)) {
        onError?.('Only JPEG, PNG, or PDF files are allowed.');
        return;
      }
      setFile(selectedFile);
      onError?.(''); // Clear error on new valid file
    }
  };

  const uploadProof = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setProgress(0);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${orderId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error } = await supabase.storage
        .from('payment-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw error;
      }

      // Pass the file path to the parent component
      onUploadSuccess(filePath);
      
    } catch (error: any) {
      console.error('Upload error:', error);
      onError?.(error.message || 'Failed to upload payment proof.');
    } finally {
      setUploading(false);
      setProgress(100);
    }
  };

  return (
    <div className="space-y-4 border p-4 rounded-md bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900">Upload Payment Proof</h3>
      <p className="text-sm text-gray-500">
        Please upload a screenshot or photo of your bank transfer receipt.
        (Max 5MB, JPG/PNG/PDF)
      </p>
      
      <div className="flex items-center space-x-4">
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileChange}
          disabled={uploading}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-indigo-50 file:text-indigo-700
            hover:file:bg-indigo-100"
        />
      </div>

      {file && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
          <button
            onClick={uploadProof}
            disabled={uploading}
            className={`px-4 py-2 rounded-md text-white font-medium ${
              uploading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {uploading ? 'Uploading...' : 'Upload Proof'}
          </button>
        </div>
      )}
      
      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div 
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};
