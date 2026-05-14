-- ============================================================
-- Bracket System Overhaul: group_picks + bracket_picks tables
-- ============================================================

-- 1. Group Picks — user predicts 1st and 2nd place for each group
CREATE TABLE group_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  group_letter VARCHAR(1) NOT NULL,
  first_place_team_id UUID REFERENCES teams(id),
  second_place_team_id UUID REFERENCES teams(id),
  points_earned NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, group_letter),
  CHECK (first_place_team_id != second_place_team_id)
);

-- 2. Bracket Picks — user picks winners through the knockout bracket
CREATE TABLE bracket_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  round VARCHAR(3) NOT NULL CHECK (round IN ('R32', 'R16', 'QF', 'SF', 'F')),
  match_slot INTEGER NOT NULL,
  picked_team_id UUID REFERENCES teams(id),
  points_earned NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, round, match_slot)
);

-- 3. RLS
ALTER TABLE group_picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE bracket_picks ENABLE ROW LEVEL SECURITY;

-- Group Picks policies
CREATE POLICY "Group picks viewable by everyone" ON group_picks FOR SELECT USING (true);

CREATE POLICY "Users can insert own group picks" ON group_picks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

CREATE POLICY "Users can update own group picks" ON group_picks FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

CREATE POLICY "Users can delete own group picks" ON group_picks FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

-- Bracket Picks policies
CREATE POLICY "Bracket picks viewable by everyone" ON bracket_picks FOR SELECT USING (true);

CREATE POLICY "Users can insert own bracket picks" ON bracket_picks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

CREATE POLICY "Users can update own bracket picks" ON bracket_picks FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

CREATE POLICY "Users can delete own bracket picks" ON bracket_picks FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));

-- 4. Triggers for updated_at
CREATE TRIGGER set_group_picks_updated_at
  BEFORE UPDATE ON group_picks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_bracket_picks_updated_at
  BEFORE UPDATE ON bracket_picks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
