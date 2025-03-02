-- Create quote_categories enum type
CREATE TYPE quote_category AS ENUM (
    'Personal Growth',
    'Success',
    'Motivation',
    'Leadership',
    'Mindfulness',
    'Relationships',
    'Health',
    'Creativity',
    'Wisdom',
    'Other'
);

-- Add category column to daily_quotes
ALTER TABLE daily_quotes
ADD COLUMN category quote_category DEFAULT 'Other';

-- Create index for faster category filtering
CREATE INDEX idx_daily_quotes_category
ON daily_quotes(user_id, category); 