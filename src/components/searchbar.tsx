"use client";
import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SearchProps {
  onSearch: (query: string) => void;
}

export function SearchComponent({ onSearch }: SearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  return (
    <div className="w-full max-w-3xl mx-auto relative">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          value={searchQuery}
          className="pl-12 pr-12 py-3 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 rounded-xl shadow-sm"
          placeholder="Search your chats..."
          onChange={handleSearchChange}
        />
        {searchQuery && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 transform -translate-y-1/2 hover:bg-gray-100 rounded-full"
            onClick={handleClear}
          >
            <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
          </Button>
        )}
      </div>
    </div>
  );
}

export default SearchComponent;