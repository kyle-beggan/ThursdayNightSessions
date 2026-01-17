-- Force ensure bucket exists and is public
insert into storage.buckets (id, name, public)
values ('session-media', 'session-media', true)
on conflict (id) do update set public = true;

-- Drop existing policies to ensure clean state
drop policy if exists "Authenticated users can upload session media" on storage.objects;
drop policy if exists "Users can delete their own session media" on storage.objects;
drop policy if exists "Anyone can view session media" on storage.objects;

-- Re-create Insert Policy
create policy "Authenticated users can upload session media"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'session-media' );

-- Re-create Select Policy (Public)
create policy "Anyone can view session media"
on storage.objects for select
to public
using ( bucket_id = 'session-media' );

-- Re-create Delete Policy (Owner only)
create policy "Authenticated users can delete session media"
on storage.objects for delete
to authenticated
using ( bucket_id = 'session-media' and auth.uid() = owner );
