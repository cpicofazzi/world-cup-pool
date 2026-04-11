-- MULTI-TENANT REWORK

-- 1. Create Entries Table
CREATE TABLE entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total_goals_tiebreaker INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Entries viewable by everyone." ON entries FOR SELECT USING (true);
CREATE POLICY "Users can insert own entries." ON entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own entries." ON entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own entries." ON entries FOR DELETE USING (auth.uid() = user_id);

-- 2. Create Pools Table
CREATE TABLE pools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  admin_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  venmo_handle TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  scoring_system scoring_system DEFAULT 'bracket',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pools viewable by everyone." ON pools FOR SELECT USING (true);
CREATE POLICY "Users can insert own pools." ON pools FOR INSERT WITH CHECK (auth.uid() = admin_id);
CREATE POLICY "Admin can update own pools." ON pools FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Admin can delete own pools." ON pools FOR DELETE USING (auth.uid() = admin_id);

-- 3. Create Pool Entries Table (Joining table)
CREATE TABLE pool_entries (
  pool_id UUID REFERENCES pools(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (pool_id, entry_id)
);
ALTER TABLE pool_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pool entries viewable by everyone." ON pool_entries FOR SELECT USING (true);
-- Users insert their own entries
CREATE POLICY "Users can insert their own entries into pools" ON pool_entries FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id)
);
-- Admins of the pool can update approvals
CREATE POLICY "Pool admins can update pool entries" ON pool_entries FOR UPDATE USING (
  auth.uid() IN (SELECT admin_id FROM pools WHERE id = pool_id)
);

-- 4. Re-shape Picks Table
DROP TABLE IF EXISTS picks CASCADE;

CREATE TABLE picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID REFERENCES entries(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  predicted_result match_result NOT NULL,
  points_bracket NUMERIC(5,2) DEFAULT 0,
  points_weighted NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(entry_id, match_id)
);
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read all picks." ON picks FOR SELECT USING (true);
CREATE POLICY "Users can insert own picks." ON picks FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id)
);
CREATE POLICY "Users can update own picks." ON picks FOR UPDATE USING (
  auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id)
);

CREATE TRIGGER set_picks_updated_at BEFORE UPDATE ON picks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Clean up old schema remnants
ALTER TABLE profiles DROP COLUMN IF EXISTS is_approved;
ALTER TABLE profiles DROP COLUMN IF EXISTS venmo_handle;
ALTER TABLE profiles DROP COLUMN IF EXISTS total_goals_tiebreaker;
ALTER TABLE app_settings DROP COLUMN IF EXISTS active_scoring_system;

-- 6. Rewrite the calculate triggered function to dual-score natively!
CREATE OR REPLACE FUNCTION public.calculate_match_points_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_base_points INT;
    v_calculated_result TEXT;
    v_team_a_rank INT;
    v_team_b_rank INT;
    v_multiplier NUMERIC := 1.0;
BEGIN
    -- Only run if scores were just added/changed
    IF NEW.team_a_score IS NULL OR NEW.team_b_score IS NULL THEN
        RETURN NEW;
    END IF;

    -- Infer result if frontend didn't pass it directly
    IF NEW.result IS NULL THEN
        IF NEW.team_a_score > NEW.team_b_score THEN
            v_calculated_result := 'team_a_win';
        ELSIF NEW.team_b_score > NEW.team_a_score THEN
            v_calculated_result := 'team_b_win';
        ELSE
            v_calculated_result := 'draw';
        END IF;
    ELSE
        v_calculated_result := NEW.result;
    END IF;

    NEW.result := v_calculated_result::public.match_result;

    IF NEW.result IS NOT NULL AND (OLD.result IS NULL OR OLD.result <> NEW.result) THEN
        
        -- Determine base points by phase
        CASE NEW.phase
            WHEN 'group' THEN v_base_points := 2;
            WHEN 'R32' THEN v_base_points := 4;
            WHEN 'R16' THEN v_base_points := 8;
            WHEN 'QF' THEN v_base_points := 16;
            WHEN 'SF' THEN v_base_points := 32;
            WHEN 'F' THEN v_base_points := 64;
            ELSE v_base_points := 0;
        END CASE;

        -- Weight math
        SELECT fifa_ranking INTO v_team_a_rank FROM public.teams WHERE id = NEW.team_a_id;
        SELECT fifa_ranking INTO v_team_b_rank FROM public.teams WHERE id = NEW.team_b_id;
        
        IF v_calculated_result = 'team_a_win' AND v_team_a_rank > v_team_b_rank THEN
            v_multiplier := 1.5;
        ELSIF v_calculated_result = 'team_b_win' AND v_team_b_rank > v_team_a_rank THEN
            v_multiplier := 1.5;
        END IF;

        -- Update right picks (both values calculated!)
        UPDATE public.picks
        SET 
            points_bracket = v_base_points,
            points_weighted = ROUND(v_base_points * v_multiplier)
        WHERE match_id = NEW.id AND predicted_result = v_calculated_result::public.match_result;

        -- Update wrong picks
        UPDATE public.picks
        SET 
            points_bracket = 0,
            points_weighted = 0
        WHERE match_id = NEW.id AND predicted_result <> v_calculated_result::public.match_result;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Recast the Leaderboard View to RPC
DROP VIEW IF EXISTS public.leaderboard_standings;

CREATE OR REPLACE FUNCTION public.get_pool_leaderboard(p_pool_id UUID)
RETURNS TABLE (
    entry_id UUID,
    entry_name TEXT,
    username TEXT,
    total_goals_tiebreaker INT,
    total_points NUMERIC,
    total_picks_made BIGINT
) AS $$
DECLARE
    v_scoring_system TEXT;
BEGIN
    SELECT scoring_system INTO v_scoring_system FROM public.pools WHERE id = p_pool_id;
    
    RETURN QUERY
    SELECT 
        e.id as entry_id,
        e.name as entry_name,
        pr.username as username,
        e.total_goals_tiebreaker,
        -- Dynamically select the column to sum
        COALESCE(SUM(
            CASE 
                WHEN v_scoring_system = 'weighted' THEN pi.points_weighted
                ELSE pi.points_bracket
            END
        ), 0) as total_points,
        COUNT(pi.id) as total_picks_made
    FROM 
        public.pool_entries pe
    JOIN public.entries e ON pe.entry_id = e.id
    JOIN public.profiles pr ON e.user_id = pr.id
    LEFT JOIN public.picks pi ON e.id = pi.entry_id AND pi.points_bracket IS NOT NULL
    WHERE 
        pe.pool_id = p_pool_id 
        AND pe.is_approved = true
    GROUP BY 
        e.id, e.name, pr.username, e.total_goals_tiebreaker
    ORDER BY 
        total_points DESC, e.total_goals_tiebreaker DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
