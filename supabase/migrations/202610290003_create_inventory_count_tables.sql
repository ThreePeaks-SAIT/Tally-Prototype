create type public.inventory_count_status as enum (
  'in_progress',
  'paused',
  'completed'
);

create table public.inventory_count_sessions (
  id uuid primary key default gen_random_uuid(),
  count_date date not null default current_date,
  status public.inventory_count_status not null default 'in_progress',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inventory_count_entries (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.inventory_count_sessions(id) on delete cascade,
  item_id uuid not null references public.items(id) on delete restrict,
  quantity numeric(12, 3) not null check (quantity >= 0),
  counted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (session_id, item_id)
);

create index inventory_count_sessions_status_created_at_idx
  on public.inventory_count_sessions (status, created_at desc);

create index inventory_count_entries_session_id_idx
  on public.inventory_count_entries (session_id);

create trigger inventory_count_sessions_set_updated_at
before update on public.inventory_count_sessions
for each row execute function public.set_updated_at();

create trigger inventory_count_entries_set_updated_at
before update on public.inventory_count_entries
for each row execute function public.set_updated_at();

alter table public.inventory_count_sessions enable row level security;
alter table public.inventory_count_entries enable row level security;

revoke all on table public.inventory_count_sessions from anon, authenticated;
revoke all on table public.inventory_count_entries from anon, authenticated;

grant select, insert, update on table public.inventory_count_sessions to service_role;
grant select, insert, update on table public.inventory_count_entries to service_role;
grant usage on type public.inventory_count_status to service_role;
