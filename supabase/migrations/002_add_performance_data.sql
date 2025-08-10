-- Add detailed performance data storage to backtest_results
-- This enables advanced analytics charts with historical time series

ALTER TABLE backtest_results 
ADD COLUMN performance_data JSONB,
ADD COLUMN monthly_returns JSONB,
ADD COLUMN drawdown_periods JSONB,
ADD COLUMN advanced_metrics JSONB;

-- Add indexes for performance
CREATE INDEX idx_backtest_results_portfolio_created ON backtest_results(portfolio_id, created_at DESC);

-- Comments for documentation
COMMENT ON COLUMN backtest_results.performance_data IS 'Daily portfolio values as PerformancePoint[] for charting';
COMMENT ON COLUMN backtest_results.monthly_returns IS 'Monthly returns breakdown as MonthlyReturn[] for heatmap';
COMMENT ON COLUMN backtest_results.drawdown_periods IS 'Drawdown periods analysis as DrawdownPeriod[] for underwater chart';
COMMENT ON COLUMN backtest_results.advanced_metrics IS 'Advanced metrics like Sortino/Calmar ratios as AdvancedMetrics';