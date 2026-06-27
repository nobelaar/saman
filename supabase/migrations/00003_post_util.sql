create table if not exists public.post_util (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create index if not exists idx_post_util_post on public.post_util (post_id);

alter table public.post_util enable row level security;

drop policy if exists "post_util_select_publico" on public.post_util;
create policy "post_util_select_publico"
  on public.post_util for select
  using ( true );

drop policy if exists "post_util_insert_auth" on public.post_util;
create policy "post_util_insert_auth"
  on public.post_util for insert
  to authenticated
  with check ( auth.uid() = user_id );

drop policy if exists "post_util_delete_owner" on public.post_util;
create policy "post_util_delete_owner"
  on public.post_util for delete
  to authenticated
  using ( auth.uid() = user_id );

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'post_util'
  ) then
    alter publication supabase_realtime add table public.post_util;
  end if;
end$$;
