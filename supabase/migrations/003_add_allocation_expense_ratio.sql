-- Add expense_ratio field to portfolio_allocations table
-- This allows users to override the default TER for specific allocations

ALTER TABLE portfolio_allocations 
ADD COLUMN expense_ratio DECIMAL(5,4);

-- Comment for clarity
COMMENT ON COLUMN portfolio_allocations.expense_ratio IS 'Manual override for expense ratio, takes precedence over asset.expense_ratio';