-- Create enums
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE match_phase AS ENUM ('group', 'R32', 'R16', 'QF', 'SF', 'F');
CREATE TYPE match_result AS ENUM ('team_a_win', 'team_b_win', 'draw');
CREATE TYPE scoring_system AS ENUM ('bracket', 'weighted');

-- Create profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  username TEXT UNIQUE,
  venmo_handle TEXT,
  is_approved BOOLEAN DEFAULT false,
  total_goals_tiebreaker INT,
  role user_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  flag_url TEXT,
  group_letter VARCHAR(1) CHECK (group_letter IN ('A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L')),
  fifa_ranking INT
);

-- Create matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_a_id UUID REFERENCES teams(id),
  team_b_id UUID REFERENCES teams(id),
  phase match_phase NOT NULL,
  kickoff_time TIMESTAMPTZ,
  result match_result,
  team_a_score INT,
  team_b_score INT,
  description TEXT -- For knockouts, e.g., "Winner Group A vs Runner-up Group B" if teams are not yet determined
);

-- Create picks table
CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_result match_result NOT NULL,
  points_earned NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, match_id)
);

-- Create app_settings table
CREATE TABLE app_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  phase_1_locked BOOLEAN DEFAULT false,
  phase_2_locked BOOLEAN DEFAULT false,
  active_scoring_system scoring_system DEFAULT 'bracket'
);

-- Initial settings insert
INSERT INTO app_settings (id, phase_1_locked, phase_2_locked, active_scoring_system) VALUES (1, false, false, 'bracket');

-- RLS Setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all approved profiles, but can only update their own
CREATE POLICY "Public profiles are viewable by everyone." ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON profiles FOR UPDATE USING (auth.uid() = id);

-- Teams: Viewable by all. Only admin can modify (modify policies can be added later)
CREATE POLICY "Teams viewable by everyone." ON teams FOR SELECT USING (true);

-- Matches: Viewable by all.
CREATE POLICY "Matches viewable by everyone." ON matches FOR SELECT USING (true);

-- Picks: Viewable by all if phase locked, otherwise only self (to be enhanced, simple for now)
CREATE POLICY "Users can read all picks." ON picks FOR SELECT USING (true);
CREATE POLICY "Users can insert own picks." ON picks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own picks." ON picks FOR UPDATE USING (auth.uid() = user_id);

-- App Settings: Viewable by all
CREATE POLICY "App settings viewable by everyone." ON app_settings FOR SELECT USING (true);

-- Trigger for updated_at on profiles & picks
CREATE OR REPLACE FUNCTION handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
CREATE TRIGGER set_picks_updated_at BEFORE UPDATE ON picks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Trigger for inserting a profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();
