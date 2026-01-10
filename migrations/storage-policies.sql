-- Policy to allow authenticated users to upload files to the 'recordings' bucket
create policy "Authenticated users can upload recordings"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'recordings' );

-- Policy to allow users to update/delete their own files (optional, but good practice)
create policy "Users can update own recordings"
on storage.objects for update
to authenticated
using ( auth.uid() = owner )
with check ( bucket_id = 'recordings' );

create policy "Users can delete own recordings"
on storage.objects for delete
to authenticated
using ( (auth.uid() = owner) and (bucket_id = 'recordings') );

-- Note: Select policy is usually handled by 'Public' bucket setting, 
-- but adding an explicit one doesn't hurt.
create policy "Public read access"
on storage.objects for select
using ( bucket_id = 'recordings' );
