create table public.storage_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  display_order integer not null check (display_order >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.storage_locations (name, slug, display_order)
values
  ('WIC', 'wic', 10),
  ('Freezer', 'freezer', 20),
  ('Dry Goods', 'dry-goods', 30);

alter table public.items
  add column storage_location_id uuid
  references public.storage_locations(id) on delete set null;

create index items_storage_location_id_idx
  on public.items (storage_location_id);

create trigger storage_locations_set_updated_at
before update on public.storage_locations
for each row execute function public.set_updated_at();

alter table public.storage_locations enable row level security;
revoke all on table public.storage_locations from anon, authenticated;
grant select, insert, update, delete on table public.storage_locations to service_role;

create or replace view public.inventory_overview
with (security_invoker = true)
as
with latest_counts as (
  select distinct on (entry.item_id)
    entry.item_id,
    entry.quantity as current_quantity,
    entry.counted_at as last_counted_at
  from public.inventory_count_entries as entry
  order by entry.item_id, entry.counted_at desc
)
select
  item.id as item_id,
  item.description,
  item.pack_size,
  item.unit_size,
  vendor.id as vendor_id,
  vendor.name as vendor_name,
  item.par_level,
  latest.current_quantity,
  case
    when item.par_level is null or latest.current_quantity is null then null
    else greatest(item.par_level - latest.current_quantity, 0::numeric)
  end as to_order,
  latest.last_counted_at,
  location.id as storage_location_id,
  location.name as storage_location_name
from public.items as item
join public.vendors as vendor on vendor.id = item.vendor_id
left join latest_counts as latest on latest.item_id = item.id
left join public.storage_locations as location on location.id = item.storage_location_id
where item.is_inventory_item = true;

comment on table public.storage_locations is
  'Restaurant-defined physical areas used to organize inventory counts.';

comment on column public.items.storage_location_id is
  'Primary storage location configured for this inventory item.';

comment on view public.inventory_overview is
  'Inventory read model with vendor, storage location, latest count, and calculated order quantity.';

revoke all on table public.inventory_overview from anon, authenticated;
grant select on table public.inventory_overview to service_role;
