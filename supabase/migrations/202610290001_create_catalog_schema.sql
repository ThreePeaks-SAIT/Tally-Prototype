create type public.purchase_type as enum (
  'full_case',
  'broken_case',
  'non_inventory'
);

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  created_at timestamptz not null default now()
);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  sysco_item_number text not null unique check (btrim(sysco_item_number) <> ''),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  manufacturer_name text,
  description text not null check (btrim(description) <> ''),
  pack_size integer not null check (pack_size > 0),
  unit_size text not null check (btrim(unit_size) <> ''),
  brand text,
  is_inventory_item boolean not null default true,
  par_level numeric(12, 3) check (par_level is null or par_level >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.items.par_level is
  'Manual par level configured by staff. Historical purchases do not set this value.';

create table public.monthly_purchase_history (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete restrict,
  month date not null check (month = date_trunc('month', month)::date),
  purchase_type public.purchase_type not null,
  quantity_shipped numeric(12, 3) not null,
  sales_amount numeric(12, 2) not null,
  unit_price numeric(12, 4) generated always as (
    case
      when quantity_shipped > 0 then round(sales_amount / quantity_shipped, 4)
      else null
    end
  ) stored,
  manufacturer_name text,
  vendor_item_number text,
  source_file_name text not null check (btrim(source_file_name) <> ''),
  source_row_number integer not null check (source_row_number > 1),
  source_key text not null unique check (btrim(source_key) <> ''),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index monthly_purchase_history_item_month_idx
  on public.monthly_purchase_history (item_id, month);

create index monthly_purchase_history_month_idx
  on public.monthly_purchase_history (month);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger items_set_updated_at
before update on public.items
for each row execute function public.set_updated_at();

create trigger monthly_purchase_history_set_updated_at
before update on public.monthly_purchase_history
for each row execute function public.set_updated_at();

alter table public.vendors enable row level security;
alter table public.items enable row level security;
alter table public.monthly_purchase_history enable row level security;

revoke all on table public.vendors from anon, authenticated;
revoke all on table public.items from anon, authenticated;
revoke all on table public.monthly_purchase_history from anon, authenticated;
