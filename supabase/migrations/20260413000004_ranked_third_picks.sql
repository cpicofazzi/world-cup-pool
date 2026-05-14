-- Drop third_place_team_id from group_picks
ALTER TABLE group_picks DROP CONSTRAINT group_picks_all_different;

ALTER TABLE group_picks DROP COLUMN third_place_team_id;

-- Add constraint: 1st and 2nd must be different
ALTER TABLE group_picks ADD CONSTRAINT group_picks_all_different 
  CHECK (
    first_place_team_id IS DISTINCT FROM second_place_team_id
  );

-- Wipe out current third_place_picks to change schema safely
DELETE FROM third_place_picks;

-- Modify third_place_picks
ALTER TABLE third_place_picks DROP COLUMN group_letter;
ALTER TABLE third_place_picks ADD COLUMN team_id UUID NOT NULL REFERENCES teams(id);
ALTER TABLE third_place_picks ADD COLUMN order_rank INT NOT NULL;

ALTER TABLE third_place_picks ADD CONSTRAINT third_place_picks_order_check CHECK (order_rank >= 1 AND order_rank <= 8);

ALTER TABLE third_place_picks ADD CONSTRAINT unique_entry_team UNIQUE(entry_id, team_id);
ALTER TABLE third_place_picks ADD CONSTRAINT unique_entry_rank UNIQUE(entry_id, order_rank);
