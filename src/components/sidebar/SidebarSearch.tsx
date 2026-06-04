import React from 'react';
import { Search } from 'lucide-react';

interface Props {
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  inputRef?: React.RefObject<HTMLInputElement>;
}

export default function SidebarSearch({ searchQuery, setSearchQuery, inputRef }: Props) {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-neutral-400 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-neutral-200 rounded-lg focus:outline-none focus:border-neutral-400 focus:bg-white transition-colors tracking-tight placeholder:text-neutral-400"
        placeholder="Search..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
    </div>
  );
}
