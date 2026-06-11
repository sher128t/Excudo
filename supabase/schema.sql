-- Supabase SQL Schema for Forge
-- Run this in Supabase SQL Editor

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- Create profiles table (linked to auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  tier text default 'free' check (tier in ('free', 'starter', 'pro', 'teams', 'admin')),
  credits_limit int default 5,
  credits_used_today int default 0,
  last_credit_reset timestamptz default now(),
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz default now()
);

-- Create projects table
create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  description text,
  files jsonb default '{}',
  chat_messages jsonb default '[]',
  thumbnail text,  -- Base64 screenshot of preview
  netlify_site_id text,  -- Netlify site for one-click deploy
  deploy_url text,       -- Last successful deploy URL
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Version history snapshots (for rollback)
create table project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  files jsonb not null default '{}',
  label text,
  created_at timestamptz default now()
);

create index project_versions_project_id_idx on project_versions(project_id, created_at desc);

-- Create chats table
create table chats (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  messages jsonb not null default '[]',
  created_at timestamptz default now()
);

-- Row Level Security (RLS)
alter table profiles enable row level security;
alter table projects enable row level security;
alter table chats enable row level security;
alter table project_versions enable row level security;

-- Project versions policies
create policy "Users can view own project versions"
  on project_versions for select
  using (
    exists (
      select 1 from projects
      where projects.id = project_versions.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create project versions"
  on project_versions for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = project_versions.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can delete own project versions"
  on project_versions for delete
  using (
    exists (
      select 1 from projects
      where projects.id = project_versions.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Profiles policies
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Projects policies
create policy "Users can view own projects"
  on projects for select
  using (auth.uid() = user_id);

create policy "Users can create projects"
  on projects for insert
  with check (auth.uid() = user_id);

create policy "Users can update own projects"
  on projects for update
  using (auth.uid() = user_id);

create policy "Users can delete own projects"
  on projects for delete
  using (auth.uid() = user_id);

-- Chats policies
create policy "Users can view own chats"
  on chats for select
  using (
    exists (
      select 1 from projects
      where projects.id = chats.project_id
      and projects.user_id = auth.uid()
    )
  );

create policy "Users can create chats"
  on chats for insert
  with check (
    exists (
      select 1 from projects
      where projects.id = chats.project_id
      and projects.user_id = auth.uid()
    )
  );

-- Function to create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, tier, credits_limit)
  values (new.id, new.email, 'free', 5);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to auto-create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- IMPORTANT: Create your admin account manually after signing up!
-- Run this AFTER you sign up with your email:
-- UPDATE profiles SET tier = 'admin', credits_limit = 999999 WHERE email = 'YOUR_EMAIL@example.com';

-- ============================================================
-- MIGRATION for EXISTING databases (run only if you created the
-- schema before these columns/tables existed):
-- ============================================================
-- alter table profiles add column if not exists full_name text;
-- alter table profiles drop constraint if exists profiles_tier_check;
-- alter table profiles add constraint profiles_tier_check check (tier in ('free', 'starter', 'pro', 'teams', 'admin'));
-- alter table projects add column if not exists netlify_site_id text;
-- alter table projects add column if not exists deploy_url text;
-- (then create the project_versions table, index, RLS and policies above)
