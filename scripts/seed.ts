import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
const sampleTeams = [
  // A
  'Argentina', 'Mexico', 'Poland', 'Saudi Arabia',
  // B
  'England', 'USA', 'Iran', 'Wales',
  // C
  'France', 'Denmark', 'Australia', 'Tunisia',
  // D
  'Spain', 'Germany', 'Japan', 'Costa Rica',
  // E
  'Belgium', 'Croatia', 'Morocco', 'Canada',
  // F
  'Brazil', 'Switzerland', 'Serbia', 'Cameroon',
  // G
  'Portugal', 'Uruguay', 'South Korea', 'Ghana',
  // H
  'Netherlands', 'Senegal', 'Ecuador', 'Qatar',
  // I (Placeholder examples for expanded 48-team format)
  'Italy', 'Colombia', 'Nigeria', 'New Zealand',
  // J
  'Chile', 'Sweden', 'Egypt', 'Mali',
  // K
  'Ivory Coast', 'Peru', 'Ukraine', 'Panama',
  // L
  'Algeria', 'Austria', 'Paraguay', 'Jamaica'
];

async function seed() {
  console.log('Starting seed...');

  // 1. Insert Teams
  console.log('Inserting Teams...');
  const teamsToInsert = sampleTeams.map((name, index) => {
    return {
      name,
      group_letter: groups[Math.floor(index / 4)],
      fifa_ranking: index + 1 // Placeholder
    };
  });

  const { data: teamsData, error: teamsError } = await supabase
    .from('teams')
    .insert(teamsToInsert)
    .select();

  if (teamsError || !teamsData) {
    console.error('Error inserting teams:', teamsError);
    return;
  }

  // 2. Map teams by group
  const teamsByGroup: Record<string, any[]> = {};
  teamsData.forEach(team => {
    if (!teamsByGroup[team.group_letter]) teamsByGroup[team.group_letter] = [];
    teamsByGroup[team.group_letter].push(team);
  });

  // 3. Generate matches
  console.log('Generating Matches...');
  const matchesToInsert: any[] = [];

  // Group Stage: 72 matches (6 per group)
  for (const group of groups) {
    const t = teamsByGroup[group];
    const matchups = [
      [t[0], t[1]], [t[2], t[3]],
      [t[0], t[2]], [t[1], t[3]],
      [t[0], t[3]], [t[1], t[2]]
    ];
    
    matchups.forEach((matchup, i) => {
      matchesToInsert.push({
        team_a_id: matchup[0].id,
        team_b_id: matchup[1].id,
        phase: 'group',
        description: `Group ${group} Match ${i + 1}`
      });
    });
  }

  // Knockout Stage: 32 matches
  // Round of 32 (16 matches)
  for (let i = 1; i <= 16; i++) {
    matchesToInsert.push({ phase: 'R32', description: `Round of 32 - Match ${i}` });
  }

  // Round of 16 (8 matches)
  for (let i = 1; i <= 8; i++) {
    matchesToInsert.push({ phase: 'R16', description: `Round of 16 - Match ${i}` });
  }

  // Quarter Finals (4 matches)
  for (let i = 1; i <= 4; i++) {
    matchesToInsert.push({ phase: 'QF', description: `Quarter Final - Match ${i}` });
  }

  // Semi Finals (2 matches)
  for (let i = 1; i <= 2; i++) {
    matchesToInsert.push({ phase: 'SF', description: `Semi Final - Match ${i}` });
  }

  // Third Place & Final
  matchesToInsert.push({ phase: 'F', description: `Third Place Playoff` });
  matchesToInsert.push({ phase: 'F', description: `The Grand Final` }); // Kept under 'F' or can add '3RD' enum later

  const { error: matchesError } = await supabase
    .from('matches')
    .insert(matchesToInsert);

  if (matchesError) {
    console.error('Error inserting matches:', matchesError);
    return;
  }

  console.log(`Successfully seeded ${teamsData.length} teams and ${matchesToInsert.length} matches!`);
}

seed();
