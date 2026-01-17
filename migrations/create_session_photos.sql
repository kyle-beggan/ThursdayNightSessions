-- Create table for session photos
create table if not exists session_photos (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  user_id uuid references users(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table session_photos enable row level security;

-- Policies for session_photos table
create policy "Public read access for session photos"
  on session_photos for select
  using ( true );

create policy "Users can upload photos"
  on session_photos for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own photos"
  on session_photos for delete
  using ( auth.uid() = user_id );

-- Create a new storage bucket for session media
insert into storage.buckets (id, name, public)
values ('session-media', 'session-media', true)
on conflict (id) do nothing;

-- Policies for session-media bucket
create policy "Authenticated users can upload session media"
  on storage.objects for insert
  to authenticated
  with check ( bucket_id = 'session-media' );

create policy "Users can delete their own session media"
  on storage.objects for delete
  to authenticated
  using ( bucket_id = 'session-media' and auth.uid() = owner );

create policy "Anyone can view session media"
  on storage.objects for select
  to public
  using ( bucket_id = 'session-media' );
