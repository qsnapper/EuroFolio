'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AssetAllocationForm, AssetAllocation } from './asset-allocation-form';
import { Loader2, Save, Eye, EyeOff, ArrowLeft, Star } from 'lucide-react';
import { validateAllocations } from '@/lib/utils';
import { Portfolio } from '@/types';
import { useAuth } from '@/context/auth-context';

interface EditPortfolioFormProps {
  portfolioId: string;
}

export function EditPortfolioForm({ portfolioId }: EditPortfolioFormProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Portfolio data
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  
  // Form fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState<string>('ANNUALLY');
  const [rebalanceThreshold, setRebalanceThreshold] = useState(5.0);
  const [isPublic, setIsPublic] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const [allocations, setAllocations] = useState<AssetAllocation[]>([]);

  const isAdmin = profile?.is_admin || false;

  // Load portfolio data
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/portfolios/${portfolioId}`);
        if (!response.ok) {
          throw new Error('Failed to load portfolio');
        }

        const { data: portfolioData } = await response.json();
        setPortfolio(portfolioData);

        // Populate form fields
        setName(portfolioData.name);
        setDescription(portfolioData.description || '');
        setRebalanceFrequency(portfolioData.rebalance_frequency);
        setRebalanceThreshold(portfolioData.rebalance_threshold);
        setIsPublic(portfolioData.is_public);
        setIsPopular(portfolioData.is_popular);

        // Convert portfolio allocations to form format
        if (portfolioData.portfolio_allocations) {
          const formAllocations: AssetAllocation[] = portfolioData.portfolio_allocations.map((allocation: any) => ({
            id: allocation.id,
            asset: allocation.assets,
            percentage: allocation.percentage,
            expense_ratio: allocation.expense_ratio || allocation.assets?.expense_ratio
          }));
          setAllocations(formAllocations);
        }

      } catch (error) {
        console.error('Error loading portfolio:', error);
        setError(error instanceof Error ? error.message : 'Failed to load portfolio');
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolio();
  }, [portfolioId]);

  const validation = validateAllocations(allocations);
  const canSubmit = name.trim() && 
                   validation.isValid && 
                   allocations.every(a => a.asset.id) &&
                   !isSubmitting &&
                   !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const portfolioData = {
        name: name.trim(),
        description: description.trim() || undefined,
        rebalance_frequency: rebalanceFrequency,
        rebalance_threshold: rebalanceThreshold,
        is_public: isPublic,
        is_popular: isAdmin ? isPopular : undefined, // Only admins can set popular
        allocations: allocations.map(allocation => ({
          asset_id: allocation.asset.id,
          percentage: allocation.percentage,
          expense_ratio: allocation.expense_ratio
        }))
      };

      const response = await fetch(`/api/portfolios/${portfolioId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portfolioData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update portfolio');
      }

      // Redirect back to portfolio detail page
      router.push(`/portfolios/${portfolioId}`);
      
    } catch (error) {
      console.error('Portfolio update error:', error);
      setError(error instanceof Error ? error.message : 'Failed to update portfolio');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive mb-4">{error}</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground mb-4">Portfolio not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            Update the basic details for your portfolio
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
            
            <div className="space-y-3">
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
              
              {isAdmin && isPublic && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPopular"
                    checked={isPopular}
                    onCheckedChange={setIsPopular}
                  />
                  <Label htmlFor="isPopular" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Mark as Popular
                  </Label>
                </div>
              )}
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
        showTER={true}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="text-sm text-muted-foreground">
          {!validation.isValid && (
            <span className="text-destructive">
              Please fix allocation issues before saving changes
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
            <ArrowLeft className="mr-2 h-4 w-4" />
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
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}