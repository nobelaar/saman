-- Add user_id to posts for community posts
alter table public.posts
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_posts_user_created
  on public.posts (user_id, created_at desc);
