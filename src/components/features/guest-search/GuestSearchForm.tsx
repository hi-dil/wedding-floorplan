"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SearchBar } from "@/components/ui";
import { Guest, Table } from "@/types";

interface SearchResult {
  guest: Guest;
  table: Table | null;
}

interface GuestSearchFormProps {
  onSelect: (result: SearchResult | null) => void;
}

export function GuestSearchForm({ onSelect }: GuestSearchFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const justSelectedRef = useRef(false);

  const searchGuests = useCallback(async (searchQuery: string) => {
    // Don't search if we just selected a result
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }

    if (searchQuery.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/guests/search?q=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowDropdown(true);
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchGuests(query);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [query, searchGuests]);

  const handleSelect = (result: SearchResult) => {
    justSelectedRef.current = true;
    setQuery(result.guest.name);
    setShowDropdown(false);
    setResults([]);
    onSelect(result);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto">
      <SearchBar
        placeholder="Search for your name..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (e.target.value.length < 2) {
            onSelect(null);
          }
        }}
        onFocus={() => {
          if (results.length > 0) setShowDropdown(true);
        }}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </div>
      )}

      {/* Results dropdown */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-60 overflow-auto">
          {results.map((result) => (
            <button
              key={result.guest.id}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center justify-between border-b last:border-b-0"
              onClick={() => handleSelect(result)}
            >
              <span className="font-medium text-gray-900">{result.guest.name}</span>
              {result.table && (
                <span className="text-sm text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                  {result.table.name}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showDropdown && query.length >= 2 && results.length === 0 && !isLoading && (
        <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-200 p-4 text-center text-gray-500">
          No guests found matching "{query}"
        </div>
      )}
    </div>
  );
}
