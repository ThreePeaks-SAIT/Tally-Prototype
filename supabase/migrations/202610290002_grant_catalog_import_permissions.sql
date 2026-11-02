grant usage on schema public to service_role;
grant usage on type public.purchase_type to service_role;

grant select, insert, update on table public.vendors to service_role;
grant select, insert, update on table public.items to service_role;
grant select, insert, update on table public.monthly_purchase_history to service_role;
