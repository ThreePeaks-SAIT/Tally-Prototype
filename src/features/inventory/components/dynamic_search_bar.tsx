'use client';

import { useRouter } from "next/navigation";
import { useState, useEffect, ChangeEvent } from "react";

interface SearchBarProps {
  searchQuery: string;
  currentFilter: string;
  selectedVendorId?: string;
}

export default function DynamicSearchBar({ searchQuery, currentFilter, selectedVendorId }: SearchBarProps) {
  const router = useRouter();
  
  
  const [text, setText] = useState(searchQuery);
  const [filter, setFilter] = useState(currentFilter);

  
  useEffect(() => {
    setText(searchQuery);
  }, [searchQuery]);

  
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedVendorId) params.set("vendor", selectedVendorId);
    if (text.trim()) params.set("q", text.trim());
    if (filter !== "all") params.set("filter", filter);

    const delayDebounceFn = setTimeout(() => {
      
      router.push(`/inventory?${params.toString()}`, { scroll: false });
    }, 300); 

    return () => clearTimeout(delayDebounceFn);
  }, [text, filter, selectedVendorId, router]);

  return (
    <div className="flex items-center gap-2 w-full md:w-auto max-w-xl">
      <div className="flex-1 md:w-64">
        <input
          type="text"
          value={text}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setText(e.target.value)}
          placeholder="Type your query..."
          className="w-full px-3.5 py-2 text-sm border border-[#E4E6E9] rounded-md bg-[#ffffff] text-[#0E1726] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#0E1726] h-[38px]"
        />
      </div>
      
      {text && (
        <button
          type="button"
          onClick={() => setText("")}
          className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md border border-[#E4E6E9] bg-[#ffffff] text-[#0E1726] hover:bg-[#FBFAF7] transition-all h-[38px]"
        >
          Clear
        </button>
      )}

      
      <select
        value={filter}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => setFilter(e.target.value)}
        className="px-3 py-2 text-sm border border-[#E4E6E9] rounded-md bg-[#ffffff] text-[#0E1726] font-medium focus:outline-none focus:ring-1 focus:ring-[#0E1726] cursor-pointer h-[38px]"
      >
        <option value="all">Search All</option>
        <option value="description">Description</option>
        <option value="current_quantity">Current</option>
        <option value="last_count">Last Count</option>
      </select>
    </div>
  );
}