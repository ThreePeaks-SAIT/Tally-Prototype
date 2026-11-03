import { InventoryPage } from "@/features/inventory";

interface RouteProps {
  searchParams: Promise<{ 
    vendor?: string;
    q?: string; 
  }>;
}

export default async function Page({ searchParams }: RouteProps) {
  
  const resolvedParams = await searchParams;

  
  return <InventoryPage searchParams={resolvedParams} />;
}
