'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AssetAllocationForm, AssetAllocation } from './asset-allocation-form';
import { Loader2, Save, Eye, EyeOff } from 'lucide-react';
import { validateAllocations } from '@/lib/utils';

export function CreatePortfolioForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Basic portfolio info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState<string>('ANNUALLY');
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5.0);
  const [isPublic, setIsPublic] = useState(false);
  
  // Allocations
  const [allocations, setAllocations] = useState<AssetAllocation[]>([{
    id: crypto.randomUUID(),
    asset: {} as any,
    percentage: 0
  }]);

  const validation = validateAllocations(allocations);
  const canSubmit = name.trim() && 
                   validation.isValid && 
                   allocations.every(a => a.asset.id) &&
                   !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    
    try {
      const portfolioData = {
        name: name.trim(),
        description: description.trim() || undefined,
        rebalance_frequency: rebalanceFrequency,
        rebalance_threshold: rebalanceThreshold,
        is_public: isPublic,
        allocations: allocations.map(allocation => ({
          asset_id: allocation.asset.id,
          percentage: allocation.percentage
        }))
      };

      const response = await fetch('/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create portfolio');
      }

      const result = await response.json();
      
      // Redirect to portfolio detail page or portfolios list
      router.push(`/portfolios/${result.data.id}`);
      
    } catch (error) {
      console.error('Portfolio creation error:', error);
      // TODO: Add proper error handling/toast notification
      alert(error instanceof Error ? error.message : 'Failed to create portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Set up the basic details for your portfolio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Portfolio Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., My Conservative Portfolio"
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublic"
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
              <Label htmlFor="isPublic" className="flex items-center gap-2">
                {isPublic ? (
                  <>
                    <Eye className="h-4 w-4" />
                    Public Portfolio
                  </>
                ) : (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Private Portfolio
                  </>
                )}
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your investment strategy and goals..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Rebalancing Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Rebalancing Settings</CardTitle>
          <CardDescription>
            Configure when and how your portfolio should be rebalanced
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="frequency">Rebalancing Frequency</Label>
              <Select
                value={rebalanceFrequency}
                onValueChange={setRebalanceFrequency}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                  <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                  <SelectItem value="ANNUALLY">Annually</SelectItem>
                  <SelectItem value="NEVER">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="threshold">Rebalancing Threshold (%)</Label>
              <Input
                id="threshold"
                type="number"
                min="1"
                max="50"
                step="0.5"
                value={rebalanceThreshold}
                onChange={(e) => setRebalanceThreshold(parseFloat(e.target.value) || 5)}
                placeholder="5.0"
              />
              <p className="text-xs text-muted-foreground">
                Rebalance when any asset drifts more than this percentage from target
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Asset Allocation */}
      <AssetAllocationForm
        allocations={allocations}
        onAllocationsChange={setAllocations}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {!validation.isValid && (
            <span className="text-destructive">
              Please fix allocation issues before creating portfolio
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            type="submit"
            disabled={!canSubmit}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Portfolio
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}