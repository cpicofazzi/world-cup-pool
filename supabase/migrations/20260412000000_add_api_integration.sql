-- Add API integration columns to teams
ALTER TABLE public.teams
ADD COLUMN api_id INT UNIQUE,
ADD COLUMN tla VARCHAR(3);

-- Add API integration columns to matches
ALTER TABLE public.matches
ADD COLUMN api_id INT UNIQUE,
ADD COLUMN venue TEXT;
