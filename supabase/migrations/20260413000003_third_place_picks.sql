-- Add third_place_team_id to group_picks
ALTER TABLE group_picks ADD COLUMN third_place_team_id UUID REFERENCES teams(id);

-- Add constraint: all three picks must be different
ALTER TABLE group_picks ADD CONSTRAINT group_picks_all_different 
  CHECK (
    first_place_team_id IS DISTINCT FROM second_place_team_id AND
    first_place_team_id IS DISTINCT FROM third_place_team_id AND
    second_place_team_id IS DISTINCT FROM third_place_team_id
  );

-- New table: tracks which 8 groups' 3rd-place teams the user thinks will advance
CREATE TABLE third_place_picks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entries(id) ON DELETE CASCADE,
  group_letter VARCHAR(1) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, group_letter)
);

ALTER TABLE third_place_picks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Third place picks viewable by everyone" ON third_place_picks FOR SELECT USING (true);
CREATE POLICY "Users can insert own third place picks" ON third_place_picks FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));
CREATE POLICY "Users can update own third place picks" ON third_place_picks FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));
CREATE POLICY "Users can delete own third place picks" ON third_place_picks FOR DELETE
  USING (auth.uid() IN (SELECT user_id FROM entries WHERE id = entry_id));
