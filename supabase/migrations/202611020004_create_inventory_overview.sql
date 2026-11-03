alter table public.items
  drop column if exists brand;

create view public.inventory_overview
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
  latest.last_counted_at
from public.items as item
join public.vendors as vendor on vendor.id = item.vendor_id
left join latest_counts as latest on latest.item_id = item.id
where item.is_inventory_item = true;

comment on view public.inventory_overview is
  'Inventory read model. Current quantity and last count come from the latest count entry; to order is calculated as max(par minus current, zero).';

revoke all on table public.inventory_overview from anon, authenticated;
grant select on table public.inventory_overview to service_role;
