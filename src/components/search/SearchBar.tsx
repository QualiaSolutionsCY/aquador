'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/lib/supabase/types';

interface SearchBarProps {
  variant?: 'navbar' | 'shop';
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
}

export default function SearchBar({
  variant = 'navbar',
  placeholder = 'Search fragrances...',
  onSearch,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounced search
  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%,brand.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(6);

      setResults(data || []);

      // If onSearch callback provided (shop page), call it
      if (onSearch) {
        onSearch(query);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(value.length >= 2);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
    if (onSearch) {
      onSearch('');
    }
  }, [onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    } else if (e.key === 'Enter' && query.length >= 2) {
      setIsOpen(false);
      router.push(`/shop?search=${encodeURIComponent(query)}`);
    }
  }, [query, router]);

  const handleResultClick = useCallback(() => {
    setIsOpen(false);
    setQuery('');
  }, []);

  const isNavbar = variant === 'navbar';

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div
        className={`
          relative flex items-center transition-all duration-300
          ${isNavbar
            ? `${isFocused ? 'w-[420px]' : 'w-[356px]'} bg-white/5 border border-gold-500/20 hover:border-gold-500/40 focus-within:border-gold-500 rounded-none`
            : 'w-full bg-white/5 border border-gold-500/20 focus-within:border-gold-500 rounded-none'
          }
        `}
      >
        <Search className={`${isNavbar ? 'w-5 h-5 ml-4' : 'w-5 h-5 ml-4'} text-gray-400`} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            if (query.length >= 2) setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            w-full bg-transparent border-none outline-none text-black placeholder-gray-400/70 focus-visible:ring-2 focus-visible:ring-gold-500
            ${isNavbar ? 'px-3 py-3 text-sm' : 'px-4 py-3.5 text-base'}
          `}
        />
        {query && (
          <button
            onClick={handleClear}
            className={`${isNavbar ? 'mr-3' : 'mr-4'} text-gray-400 hover:text-black transition-colors`}
          >
            <X className={isNavbar ? 'w-5 h-5' : 'w-5 h-5'} />
          </button>
        )}
      </div>

      {/* Dropdown Results (navbar only - shop page handles its own results) */}
      {isNavbar && (
        <AnimatePresence>
          {isOpen && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl border border-gold/20 shadow-xl overflow-hidden z-50"
            >
              <div className="max-h-[400px] overflow-y-auto">
                {results.map((product) => (
                  <Link
                    key={product.id}
                    href={`/products/${product.id}`}
                    onClick={handleResultClick}
                    className="flex items-center gap-4 p-4 hover:bg-gold/10 transition-colors border-b border-gold/10 last:border-b-0"
                  >
                    <div className="relative w-14 h-14 flex-shrink-0 bg-white overflow-hidden">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-contain p-1"
                        sizes="48px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      {product.brand && (
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                          {product.brand}
                        </p>
                      )}
                      <p className="text-sm text-black truncate">{product.name}</p>
                      <p className="text-xs text-gold">{formatPrice(product.sale_price || product.price)}</p>
                    </div>
                  </Link>
                ))}
              </div>

              {/* View all results link */}
              <Link
                href={`/shop?search=${encodeURIComponent(query)}`}
                onClick={handleResultClick}
                className="block px-4 py-3 text-center text-sm text-gold hover:bg-gold/10 transition-colors border-t border-gold/20"
              >
                View all results for &quot;{query}&quot;
              </Link>
            </motion.div>
          )}

          {isOpen && query.length >= 2 && results.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-0 right-0 mt-1 bg-white/95 backdrop-blur-xl border border-gold/20 shadow-xl p-4 z-50"
            >
              <p className="text-gray-600 text-sm text-center">No products found for &quot;{query}&quot;</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
