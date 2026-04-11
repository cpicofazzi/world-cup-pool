-- Create trigger function to auto-calculate points when a match result is entered
CREATE OR REPLACE FUNCTION public.calculate_match_points_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
    v_base_points INT;
    v_scoring_system TEXT;
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

    -- We must ensure the NEW row actually receives the deduced result
    NEW.result := v_calculated_result::public.match_result;

    -- Only calculate if result is known and changed
    IF NEW.result IS NOT NULL AND (OLD.result IS NULL OR OLD.result <> NEW.result) THEN
        -- Get scoring system
        SELECT active_scoring_system INTO v_scoring_system FROM public.app_settings LIMIT 1;
        
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

        -- If weighted, check for underdog win
        IF v_scoring_system = 'weighted' THEN
            SELECT fifa_ranking INTO v_team_a_rank FROM public.teams WHERE id = NEW.team_a_id;
            SELECT fifa_ranking INTO v_team_b_rank FROM public.teams WHERE id = NEW.team_b_id;
            
            -- Higher number = worse rank (underdog). So if A > B, A is underdog.
            IF v_calculated_result = 'team_a_win' AND v_team_a_rank > v_team_b_rank THEN
                v_multiplier := 1.5;
            ELSIF v_calculated_result = 'team_b_win' AND v_team_b_rank > v_team_a_rank THEN
                v_multiplier := 1.5;
            END IF;
        END IF;

        -- Update picks that got it right
        UPDATE public.picks
        SET points_earned = ROUND(v_base_points * v_multiplier)
        WHERE match_id = NEW.id AND predicted_result = v_calculated_result::public.match_result;

        -- Update picks that got it wrong
        UPDATE public.picks
        SET points_earned = 0
        WHERE match_id = NEW.id AND predicted_result <> v_calculated_result::public.match_result;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger runs BEFORE update to allow us to set NEW.result reliably before it saves
CREATE TRIGGER match_scoring_trigger
BEFORE UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.calculate_match_points_trigger_fn();

-- Leaderboard View
CREATE OR REPLACE VIEW public.leaderboard_standings AS
SELECT 
    p.id as user_id,
    p.username,
    p.total_goals_tiebreaker,
    COALESCE(SUM(pi.points_earned), 0) as total_points,
    COUNT(pi.id) as total_picks_made
FROM 
    public.profiles p
LEFT JOIN 
    public.picks pi ON p.id = pi.user_id AND pi.points_earned IS NOT NULL
WHERE 
    p.role = 'user' AND p.is_approved = true
GROUP BY 
    p.id, p.username, p.total_goals_tiebreaker;

-- Because we're securing the frontend, we need RLS on the view. 
-- In Postgres, Views inherit privileges of the creator natively, but 
-- Supabase PostgREST might expose it if we don't grant correctly.
GRANT SELECT ON public.leaderboard_standings TO authenticated;
GRANT SELECT ON public.leaderboard_standings TO anon;
