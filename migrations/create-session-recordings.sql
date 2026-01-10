-- Create table for session recordings
create table if not exists session_recordings (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references sessions(id) on delete cascade not null,
  url text not null,
  title text not null,
  created_by uuid references users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table session_recordings enable row level security;

-- Policies
create policy "Public read access"
  on session_recordings for select
  using ( true );

create policy "Users can upload recordings"
  on session_recordings for insert
  with check ( auth.uid() = created_by );

create policy "Users can delete their own recordings"
  on session_recordings for delete
  using ( auth.uid() = created_by );
