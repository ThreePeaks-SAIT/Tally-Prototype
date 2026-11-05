import { createServerSupabaseClient } from "@/lib/supabase/server";
import { QueryData } from "@supabase/supabase-js";
import Link from "next/link";
import DynamicSearchBar from "./dynamic_search_bar";

export const columns = [
  {
    id: "item_details", // Required when using a custom cell instead of a direct accessorKey
    header: "Item",
    cell: ({ row }: { row: { original: TableItem } }) => {
      const { description, pack_size, unit_size } = row.original;
      
      // Filter out empty values and join them cleanly with a dot or a space
      const details = [description, pack_size, unit_size]
        .filter(Boolean)
        .join(" · "); // Example output: "Box of Napkins · 10pk · 12oz"
        
      return <span>{details || "-"}</span>;
    },
  },
  {
    accessorKey: "vendor_name",
    header: "Vendor",
  },
  {
    accessorKey: "par_level",
    header: "Par",
    cell: ({ getValue }: { getValue: () => number | null }) => getValue() ?? "-",
  },
  {
    accessorKey: "current_quantity",
    header: "Current",
    cell: ({ getValue }: { getValue: () => number | null }) => getValue() ?? "-",// Replaces null/undefined with a dash
  },
  {
    accessorKey: "to_order",
    header: "To Order",
    cell: ({ getValue }: { getValue: () => number | null }) => getValue() ?? "-", // Replaces null/undefined with a dash
  },
  {
    accessorKey: "last_counted_at",
    header: "Last Count",
    cell: ({ getValue }: { getValue: () => number | null }) => getValue() ?? "-",
  },
];

export interface TableItem {
  id: string;
  description: string | null;
  pack_size: string | null;
  unit_size: string | null;
  vendor_name: string;
  par_level: number | null;
  current_quantity: number | null;
  to_order: number | null;
  last_counted_at: number | null; 
}

interface PageProps {
  searchParams?: { 
    vendor?: string;
    q?: string;
    filter?: string; 
  };
}

export default async function InventoryPage({ searchParams }: PageProps) {
  const supabase = await createServerSupabaseClient();
  const selectedVendorId = searchParams?.vendor;
  const searchQuery = searchParams?.q ?? "";
  const currentFilter = searchParams?.filter ?? "all";

  const { data: dbVendors } = await supabase
    .from("vendors")
    .select(`
      id,
      name, 
      items (
        id
      )
    `)
    .order("name");

    const currentDbVendors = dbVendors ?? [];

    const targetVendorNames = [
    "Sysco",
    "Alforno",
    "Costco",
    "Wholesale",
    "Liquor",
  ];

  const activeVendors = targetVendorNames.map((name, index) => {
    const matchedDbVendor = currentDbVendors.find(
      (v) => v.name.toLowerCase() === name.toLowerCase()
    );

    return {
      
      id: matchedDbVendor ? matchedDbVendor.id : `mock-${index}`, 
      name: name,
      itemCount: matchedDbVendor ? (matchedDbVendor.items?.length ?? 0) : 0,
      isMock: !matchedDbVendor, 
    };
  });

  const totalItemCount = activeVendors.reduce((sum, v) => sum + v.itemCount, 0);
  const isMockSelected = selectedVendorId?.startsWith("mock-");

  let inventoryQuery = supabase
  .from("inventory_overview")
  .select(`
    item_id,
    description,
    pack_size,
    unit_size,
    vendor_name,
    par_level,
    current_quantity,
    to_order,
    last_counted_at
  `)
  .order("description");

  if (selectedVendorId && !isMockSelected) {
    inventoryQuery = inventoryQuery.eq("vendor_id", selectedVendorId);
  }

  if (searchQuery.trim() !== "") {
  const formattedSearch = `%${searchQuery.trim()}%`;
  
  
  const parsedNumericSearch = Number(searchQuery);
  const isValidNumber = !Number.isNaN(parsedNumericSearch);
  const safeNum = isValidNumber ? parsedNumericSearch : -1;

  
  const parsedDate = Date.parse(searchQuery.trim());
  const isValidDate = !Number.isNaN(parsedDate);
  
  const safeDateString = isValidDate ? new Date(parsedDate).toISOString() : "1970-01-01T00:00:00Z";

  if (currentFilter === "description") {
    inventoryQuery = inventoryQuery.ilike("description", formattedSearch);
  } else if (currentFilter === "current_quantity") {
    inventoryQuery = inventoryQuery.eq("current_quantity", safeNum);
  } else if (currentFilter === "last_counted_at") {
    
    inventoryQuery = inventoryQuery.eq("last_counted_at", safeDateString);
  } else {
    
    inventoryQuery = inventoryQuery.or(
      `description.ilike.${formattedSearch},current_quantity.eq.${safeNum},last_counted_at.eq.${safeDateString}`
    );
  }
}

  type SupabaseItemResponse = QueryData<typeof inventoryQuery>;

  const { data: itemsData, error } = await inventoryQuery;

  

  if (error) {
    // This extracts the hidden Postgres error string message, hint, and code details
    console.error("Error loading inventory:", error.message, error.hint, error.details);
    return <div className="p-6 text-[#64748B]">Failed to load inventory data.</div>;
  }

  

  const tableData: TableItem[] = isMockSelected 
    ? [] 
    : (itemsData as SupabaseItemResponse).map((item) => {
        const safeNumber = (val: unknown) => {
        if (val === null || val === undefined || val === "") return null;
        const num = Number(val);
        return Number.isNaN(num) ? null : num;
      };
    
      

        return {

                id: item.item_id,
                description: item.description,
                pack_size: item.pack_size,
                unit_size: item.unit_size,
                vendor_name: item.vendor_name ?? "Unknown Vendor",
                par_level: safeNumber(item.par_level),
                current_quantity: safeNumber(item.current_quantity),
                to_order: safeNumber(item.to_order),
                last_counted_at: safeNumber(item.last_counted_at),
        };
    });


  return (
    <div className="bg-[#F6F4F0] p-6 max-w-7xl mx-auto">
      {/* Header and Search Form Row Side-by-Side Wrapper */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-b-[#E4E6E9] pb-5 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0E1726]">Inventory</h1>
          <p className="text-[#64748B] text-sm mt-1">Manage and track your products across vendors.</p>
        </div>

       <DynamicSearchBar 
          searchQuery={searchQuery} 
          currentFilter={currentFilter} 
          selectedVendorId={selectedVendorId} 
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-[#E4E6E9] pb-4">
        <Link
          href="/inventory"
          className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border transition-all ${
            !selectedVendorId
              ? "bg-[#0E1726] text-[#ffffff]"
              : "bg-[#ffffff] text-[#0E1726] hover:bg-[#FBFAF7]"
          }`}
        >
          <span>Show All</span>
          <span className={`inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
            !selectedVendorId 
              ? "bg-[#0E1726] text-[#ffffff]" 
              : "bg-[#ffffff] text-[#0E1726]"
          }`}>
            {totalItemCount}
          </span>
        </Link>

        {activeVendors.map((v) => {
          const isActive = selectedVendorId === v.id;
          return (
            <Link
              key={v.id}
              href={`/inventory?vendor=${v.id}`}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border transition-all ${
                isActive
                  ? "bg-[#0E1726] text-[#ffffff]"
                  : "bg-[#ffffff] text-[#0E1726] hover:bg-[#FBFAF7]"
              }`}
            >
              <span>{v.name}</span>
              <span className={`inline-flex h-5 items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                isActive 
                  ? "bg-[#0E1726] text-[#ffffff]" 
                  : "bg-[#ffffff] text-[#0E1726]"
              }`}>
                {v.itemCount}
              </span>
            </Link>
          );
        })}
      </div>

      {/* FIXED TABLE IMPLEMENTATION */}
      <div className="overflow-x-auto border border-[#E4E6E9] bg-white rounded-lg shadow-sm">
        <table className="min-w-full divide-y divide-[#E4E6E9] text-left text-sm">
          <thead className="bg-[#FFFFFF] font-semibold text-[#64748B]">
            <tr>
              {columns.map((col) => (
                // FIXED: Uses fallback key when accessorKey doesn't exist
                <th key={col.accessorKey || col.id} className="px-6 py-3.5">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E6E9] bg-[#FFFFFF] text-[#0E1726]">
            {tableData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <p className="text-sm font-semibold text-[#0E1726]">
                      There is currently nothing in stock from this vendor.
                    </p>
                    <p className="text-xs text-[#64748B]">
                      When inventory items are added for this supplier, they will appear here automatically.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              tableData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  {columns.map((col) => {
                    const cellKey = col.accessorKey || col.id;
                    
                    return (
                      <td key={cellKey} className="px-6 py-4">
                        {/* 1. If the column has a custom cell layout formatter, run it */}
                        {col.cell ? (
                          col.cell({ 
                            row: { original: item }, 
                             getValue: () => (item[col.accessorKey as keyof TableItem] ?? null) as (number | null)
                          })
                        ) : col.accessorKey === "vendor_name" ? (
                          // Keeps your clean custom styling block for the Vendor column wrapper
                          <span className="inline-flex items-center rounded-md bg-[#FBFAF7] px-2 py-1 text-xs font-medium text-[#0E1726]">
                            {item.vendor_name}
                          </span>
                        ) : (
                          // 2. Fallback text rendering if no custom cell configuration exists
                          (item[col.accessorKey as keyof TableItem] ?? "-") as React.ReactNode
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
