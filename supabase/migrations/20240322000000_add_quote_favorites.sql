-- Add favorites column to daily_quotes
ALTER TABLE daily_quotes
ADD COLUMN is_favorite BOOLEAN DEFAULT false;

-- Create index for faster favorite quote lookups
CREATE INDEX idx_daily_quotes_favorite
ON daily_quotes(user_id, is_favorite)
WHERE is_favorite = true; 