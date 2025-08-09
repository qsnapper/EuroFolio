'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AssetSearch } from '@/components/assets/asset-search';
import { X, Plus, AlertTriangle } from 'lucide-react';
import { Asset } from '@/types';
import { validateAllocations, formatPercentage, formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface AssetAllocation {
  id: string;
  asset: Asset;
  percentage: number;
}

interface AssetAllocationFormProps {
  allocations: AssetAllocation[];
  onAllocationsChange: (allocations: AssetAllocation[]) => void;
  className?: string;
}

export function AssetAllocationForm({ 
  allocations, 
  onAllocationsChange, 
  className 
}: AssetAllocationFormProps) {
  const [totalPercentage, setTotalPercentage] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);

  // Calculate total and validate whenever allocations change
  useEffect(() => {
    const validation = validateAllocations(allocations);
    setTotalPercentage(validation.total);
    setErrors(validation.errors);
  }, [allocations]);

  const addAllocation = () => {
    const newAllocation: AssetAllocation = {
      id: crypto.randomUUID(),
      asset: {} as Asset, // Will be set when user selects an asset
      percentage: 0
    };
    onAllocationsChange([...allocations, newAllocation]);
  };

  const removeAllocation = (id: string) => {
    onAllocationsChange(allocations.filter(a => a.id !== id));
  };

  const updateAllocation = (id: string, updates: Partial<AssetAllocation>) => {
    onAllocationsChange(
      allocations.map(allocation =>
        allocation.id === id ? { ...allocation, ...updates } : allocation
      )
    );
  };

  const autoBalance = () => {
    if (allocations.length === 0) return;
    
    const equalPercentage = Math.floor((100 / allocations.length) * 100) / 100;
    const remainder = 100 - (equalPercentage * allocations.length);
    
    const balanced = allocations.map((allocation, index) => ({
      ...allocation,
      percentage: index === 0 ? equalPercentage + remainder : equalPercentage
    }));
    
    onAllocationsChange(balanced);
  };

  const remainingPercentage = Math.max(0, 100 - totalPercentage);

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Asset Allocation</CardTitle>
            <CardDescription>
              Define your portfolio allocation across different assets
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={totalPercentage === 100 ? "default" : "secondary"}>
              {formatPercentage(totalPercentage)}
            </Badge>
            {allocations.length > 1 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={autoBalance}
              >
                Auto Balance
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Validation Errors */}
        {errors.length > 0 && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <div className="flex items-center gap-2 text-sm text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span className="font-medium">Allocation Issues:</span>
            </div>
            <ul className="mt-1 text-sm text-destructive space-y-1">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Allocation</span>
            <span className={cn(
              "font-medium",
              totalPercentage > 100 ? "text-destructive" : 
              totalPercentage < 100 ? "text-orange-600" : 
              "text-green-600"
            )}>
              {formatPercentage(totalPercentage)} / 100%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                totalPercentage > 100 ? "bg-destructive" :
                totalPercentage < 100 ? "bg-orange-500" :
                "bg-green-500"
              )}
              style={{ width: `${Math.min(totalPercentage, 100)}%` }}
            />
          </div>
          {remainingPercentage > 0 && (
            <p className="text-sm text-muted-foreground">
              Remaining: {formatPercentage(remainingPercentage)}
            </p>
          )}
        </div>

        {/* Allocation Items */}
        <div className="space-y-3">
          {allocations.map((allocation, index) => (
            <div key={allocation.id} className="flex gap-3 p-4 rounded-lg border">
              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor={`asset-${allocation.id}`}>
                    Asset {index + 1}
                  </Label>
                  {allocations.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAllocation(allocation.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <AssetSearch
                  value={allocation.asset.id ? allocation.asset : undefined}
                  onSelect={(asset) => updateAllocation(allocation.id, { asset })}
                  placeholder="Search for assets..."
                  className="w-full"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor={`percentage-${allocation.id}`}>
                      Allocation %
                    </Label>
                    <Input
                      id={`percentage-${allocation.id}`}
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={allocation.percentage || ''}
                      onChange={(e) => updateAllocation(allocation.id, {
                        percentage: parseFloat(e.target.value) || 0
                      })}
                      placeholder="0.00"
                    />
                  </div>
                  
                  {allocation.asset.currency && (
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <div className="flex items-center h-10 px-3 rounded-md border bg-muted">
                        <Badge variant="outline">
                          {allocation.asset.currency}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {allocation.asset.name && (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>{allocation.asset.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {allocation.asset.type}
                      </Badge>
                    </div>
                    <div className="mt-1">
                      {allocation.asset.exchange} • {allocation.asset.country}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Add Asset Button */}
        <Button
          type="button"
          variant="outline"
          onClick={addAllocation}
          className="w-full"
          disabled={allocations.length >= 20} // Reasonable limit
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Asset {allocations.length > 0 && `(${allocations.length}/20)`}
        </Button>

        {/* Summary */}
        {allocations.length > 0 && (
          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Portfolio Summary</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span>Total Assets:</span>
                <span className="font-medium">{allocations.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Allocated:</span>
                <span className={cn(
                  "font-medium",
                  totalPercentage === 100 ? "text-green-600" : "text-orange-600"
                )}>
                  {formatPercentage(totalPercentage)}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}