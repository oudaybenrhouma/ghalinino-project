-- Add bank_transfer_proof_url column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS bank_transfer_proof_url TEXT;
