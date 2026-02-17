-- Create the storage bucket for payment proofs
insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false);

-- Policy: Allow authenticated users to upload files to their own order folders
-- Assumes folder structure: payment-proofs/{order_id}/{filename}
create policy "Users can upload payment proofs for their own orders"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'payment-proofs' and
  exists (
    select 1 from orders
    where id::text = (storage.foldername(name))[1]
    and user_id = auth.uid()
  )
);

-- Policy: Allow users to view their own uploaded proofs
create policy "Users can view their own payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs' and
  exists (
    select 1 from orders
    where id::text = (storage.foldername(name))[1]
    and user_id = auth.uid()
  )
);

-- Policy: Admins can view all proofs
create policy "Admins can view all payment proofs"
on storage.objects for select
to authenticated
using (
  bucket_id = 'payment-proofs' and
  exists (
    select 1 from profiles
    where id = auth.uid()
    and role in ('admin', 'moderator')
  )
);
