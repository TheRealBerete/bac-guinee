"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  className?: string;
  onQueryChange?: (query: string) => void;
  autoFocus?: boolean;
}

export function SearchBar({ className = "", onQueryChange, autoFocus }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  const handleInputChange = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (onQueryChange) {
        debounceRef.current = setTimeout(() => {
          onQueryChange(value.trim());
        }, 300);
      }
    },
    [onQueryChange]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const q = query.trim();
      if (q.length < 1) return;
      router.push(`/recherche?q=${encodeURIComponent(q)}`);
    },
    [query, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleSubmit(e);
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <form onSubmit={handleSubmit} className={`w-full max-w-[640px] mx-auto ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nom, PV ou établissement..."
          className="w-full bg-white border-2 border-border-soft rounded-[20px] px-5 py-[18px] pr-14 text-lg text-text-primary placeholder:text-text-tertiary focus:outline-hidden focus:border-primary-dark transition-all duration-200 shadow-[0_1px_3px_rgba(16,24,40,0.06),0_1px_2px_rgba(16,24,40,0.04)] font-[family-name:var(--font-sans)]"
        />
        <button
          type="submit"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-xl bg-primary-dark text-white hover:brightness-110 transition-all duration-200"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </button>
      </div>
      <p className="text-center text-text-tertiary text-sm mt-3">
        Recherchez par nom, numéro de PV ou établissement d&apos;origine
      </p>
    </form>
  );
}
