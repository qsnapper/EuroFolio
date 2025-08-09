'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Search, Loader2 } from 'lucide-react';
import { cn, debounce } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useAssetSearch } from '@/hooks/use-asset-search';
import { Asset } from '@/types';

interface AssetSearchProps {
  value?: Asset;
  onSelect: (asset: Asset) => void;
  placeholder?: string;
  className?: string;
}

export function AssetSearch({ 
  value, 
  onSelect, 
  placeholder = "Search assets...",
  className 
}: AssetSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query to avoid too many API calls
  const debouncedSetQuery = debounce((query: string) => {
    setDebouncedQuery(query);
  }, 300);

  useEffect(() => {
    debouncedSetQuery(searchQuery);
  }, [searchQuery, debouncedSetQuery]);

  const { data, isLoading, error } = useAssetSearch(debouncedQuery);

  const handleSelect = (asset: Asset) => {
    onSelect(asset);
    setOpen(false);
    setSearchQuery('');
    setDebouncedQuery('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
        >
          {value ? (
            <div className="flex items-center gap-2 truncate">
              <span className="truncate">{value.name}</span>
              <Badge variant="secondary" className="text-xs">
                {value.symbol}
              </Badge>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <CommandInput
              placeholder="Search by symbol or name..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            />
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
          <CommandList className="max-h-[300px]">
            {error && (
              <div className="p-4 text-center text-sm text-destructive">
                Failed to search assets. Please try again.
              </div>
            )}
            
            {!isLoading && !error && data?.data.length === 0 && debouncedQuery.length >= 2 && (
              <CommandEmpty>
                No assets found for "{debouncedQuery}"
              </CommandEmpty>
            )}
            
            {!isLoading && debouncedQuery.length < 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search...
              </div>
            )}

            {data?.data && data.data.length > 0 && (
              <CommandGroup>
                {data.data.map((asset) => (
                  <CommandItem
                    key={`${asset.symbol}-${asset.exchange}`}
                    value={`${asset.symbol} ${asset.name} ${asset.exchange}`}
                    onSelect={() => handleSelect(asset)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{asset.symbol}</span>
                          <Badge variant="outline" className="text-xs">
                            {asset.exchange}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {asset.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground truncate">
                          {asset.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {asset.currency} • {asset.country}
                        </div>
                      </div>
                      <Check
                        className={cn(
                          "ml-2 h-4 w-4",
                          value?.id === asset.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {data?.source && data.source.total > 0 && (
              <div className="border-t p-2 text-xs text-muted-foreground text-center">
                Found {data.source.total} results 
                ({data.source.cached} cached, {data.source.api} from API)
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}