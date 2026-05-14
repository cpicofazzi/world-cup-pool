-- Add write policies for admin users on teams, matches, and app_settings

-- Teams: Allow admins to insert and update
CREATE POLICY "Admins can insert teams" ON teams FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update teams" ON teams FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Matches: Allow admins to insert and update
CREATE POLICY "Admins can insert matches" ON matches FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "Admins can update matches" ON matches FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));

-- App Settings: Allow admins to update
CREATE POLICY "Admins can update app settings" ON app_settings FOR UPDATE
  USING (auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin'));
