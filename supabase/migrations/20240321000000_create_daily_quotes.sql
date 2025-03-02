-- Create daily_quotes table
CREATE TABLE IF NOT EXISTS daily_quotes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quote_text TEXT NOT NULL,
    author TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    shared_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies
ALTER TABLE daily_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
    ON daily_quotes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
    ON daily_quotes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
    ON daily_quotes FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_quotes_updated_at
    BEFORE UPDATE ON daily_quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 