import React from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
}) => (
  <div className={`relative ${className}`}>
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#69736D]" />
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-[#101412] border border-[#232C28] rounded-lg text-sm py-2.5 pl-10 pr-4 text-[#F2F5F3] placeholder:text-[#69736D] focus:outline-none focus:border-[#22C55E]/60 focus:ring-1 focus:ring-[#22C55E]/30 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
    />
  </div>
);