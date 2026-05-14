/**
 * FIFA 2026 World Cup Knockout Bracket Structure
 * 
 * 48 teams in 12 groups (A-L).
 * Top 2 from each group (24 teams) + 8 best 3rd-place teams = 32 teams advance.
 * 16 R32 matches → 8 R16 → 4 QF → 2 SF → 1 Final
 * 
 * The 3rd-place team assignments depend on WHICH groups they come from.
 * For our pool, users pick which 8 groups produce advancing 3rd-place teams,
 * and then we use the FIFA-published pairing table to place them into the bracket.
 */

export const GROUP_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as const

// ============================================================
// ROUND OF 32 — Official FIFA Match Structure (Matches 49-64)
// ============================================================
// The 16 R32 matches. Some slots are fixed (1v2, 2v2), and 8 slots
// have a group winner vs "3rd place from one of several possible groups."
// 
// For the pool: the user picks which 8 of 12 groups' 3rd-place teams advance.
// We use a simplified deterministic assignment (not the full 495-combo FIFA table).

export interface R32Match {
  slot: number        // 1-16, our internal numbering
  fifaMatch: number   // FIFA official match number (49-64)
  homeLabel: string   // e.g. "2A", "1C", "3rd"
  awayLabel: string   
  homeType: '1st' | '2nd' | '3rd'
  awayType: '1st' | '2nd' | '3rd'
  homeGroup?: string  // Fixed group if known
  awayGroup?: string  // Fixed group if known
  // For 3rd-place slots, we specify which groups could fill them
  thirdPlaceSlot?: 'home' | 'away'
  thirdPlacePossibleGroups?: string[]
}

// Official FIFA R32 bracket (Matches 49-64)
// Using the published match structure from FIFA.com
export const R32_BRACKET: R32Match[] = [
  // Match 49: 2A vs 2B
  { slot: 1,  fifaMatch: 49, homeLabel: '2A', awayLabel: '2B', homeType: '2nd', awayType: '2nd', homeGroup: 'A', awayGroup: 'B' },
  // Match 50: 1C vs 2F  
  { slot: 2,  fifaMatch: 50, homeLabel: '1C', awayLabel: '2F', homeType: '1st', awayType: '2nd', homeGroup: 'C', awayGroup: 'F' },
  // Match 51: 1E vs 3rd (from A/B/C/D/F)
  { slot: 3,  fifaMatch: 51, homeLabel: '1E', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'E', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['A','B','C','D','F'] },
  // Match 52: 1F vs 2C
  { slot: 4,  fifaMatch: 52, homeLabel: '1F', awayLabel: '2C', homeType: '1st', awayType: '2nd', homeGroup: 'F', awayGroup: 'C' },
  // Match 53: 2E vs 2I
  { slot: 5,  fifaMatch: 53, homeLabel: '2E', awayLabel: '2I', homeType: '2nd', awayType: '2nd', homeGroup: 'E', awayGroup: 'I' },
  // Match 54: 1I vs 3rd (from C/D/F/G/H)
  { slot: 6,  fifaMatch: 54, homeLabel: '1I', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'I', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['C','D','F','G','H'] },
  // Match 55: 1A vs 3rd (from C/E/F/H/I)
  { slot: 7,  fifaMatch: 55, homeLabel: '1A', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'A', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['C','E','F','H','I'] },
  // Match 56: 1L vs 3rd (from E/H/I/J/K)
  { slot: 8,  fifaMatch: 56, homeLabel: '1L', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'L', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['E','H','I','J','K'] },
  // Match 57: 1G vs 3rd (from A/E/H/I/J)
  { slot: 9,  fifaMatch: 57, homeLabel: '1G', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'G', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['A','E','H','I','J'] },
  // Match 58: 1D vs 3rd (from B/E/F/I/J)
  { slot: 10, fifaMatch: 58, homeLabel: '1D', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'D', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['B','E','F','I','J'] },
  // Match 59: 1H vs 2J
  { slot: 11, fifaMatch: 59, homeLabel: '1H', awayLabel: '2J', homeType: '1st', awayType: '2nd', homeGroup: 'H', awayGroup: 'J' },
  // Match 60: 2K vs 2L
  { slot: 12, fifaMatch: 60, homeLabel: '2K', awayLabel: '2L', homeType: '2nd', awayType: '2nd', homeGroup: 'K', awayGroup: 'L' },
  // Match 61: 1B vs 3rd (from E/F/G/I/J)
  { slot: 13, fifaMatch: 61, homeLabel: '1B', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'B', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['E','F','G','I','J'] },
  // Match 62: 2D vs 2G
  { slot: 14, fifaMatch: 62, homeLabel: '2D', awayLabel: '2G', homeType: '2nd', awayType: '2nd', homeGroup: 'D', awayGroup: 'G' },
  // Match 63: 1J vs 2H
  { slot: 15, fifaMatch: 63, homeLabel: '1J', awayLabel: '2H', homeType: '1st', awayType: '2nd', homeGroup: 'J', awayGroup: 'H' },
  // Match 64: 1K vs 3rd (from D/E/I/J/L)
  { slot: 16, fifaMatch: 64, homeLabel: '1K', awayLabel: '3rd', homeType: '1st', awayType: '3rd', homeGroup: 'K', thirdPlaceSlot: 'away', thirdPlacePossibleGroups: ['D','E','I','J','L'] },
]

// ============================================================
// R16 → QF → SF → F Bracket Progression (official FIFA)
// ============================================================
// R16 (Matches 65-72 / FIFA 89-96)
export const R16_FEEDS: { slot: number; feedFrom: [number, number] }[] = [
  { slot: 1, feedFrom: [1, 3] },   // W49 vs W51
  { slot: 2, feedFrom: [2, 6] },   // W50 vs W54
  { slot: 3, feedFrom: [4, 5] },   // W52 vs W53
  { slot: 4, feedFrom: [7, 8] },   // W55 vs W56
  { slot: 5, feedFrom: [11, 12] }, // W59 vs W60
  { slot: 6, feedFrom: [9, 10] },  // W57 vs W58
  { slot: 7, feedFrom: [14, 16] }, // W62 vs W64
  { slot: 8, feedFrom: [13, 15] }, // W61 vs W63
]

// QF (Matches 73-76 / FIFA 97-100)
export const QF_FEEDS: { slot: number; feedFrom: [number, number] }[] = [
  { slot: 1, feedFrom: [1, 2] },   // W-R16-1 vs W-R16-2
  { slot: 2, feedFrom: [5, 6] },   // W-R16-5 vs W-R16-6
  { slot: 3, feedFrom: [3, 4] },   // W-R16-3 vs W-R16-4
  { slot: 4, feedFrom: [7, 8] },   // W-R16-7 vs W-R16-8
]

// SF (Matches 77-78 / FIFA 101-102)
export const SF_FEEDS: { slot: number; feedFrom: [number, number] }[] = [
  { slot: 1, feedFrom: [1, 2] },   // W-QF-1 vs W-QF-2
  { slot: 2, feedFrom: [3, 4] },   // W-QF-3 vs W-QF-4
]

// Final
export const F_FEEDS: { slot: number; feedFrom: [number, number] }[] = [
  { slot: 1, feedFrom: [1, 2] },   // W-SF-1 vs W-SF-2
]

// ============================================================
// SCORING
// ============================================================
export const ROUND_POINTS: Record<string, number> = {
  'R32': 2,
  'R16': 3,
  'QF': 5,
  'SF': 8,
  'F': 13,
}

export const ROUND_MATCH_COUNT: Record<string, number> = {
  'R32': 16,
  'R16': 8,
  'QF': 4,
  'SF': 2,
  'F': 1,
}

export const ROUND_NAMES: Record<string, string> = {
  'R32': 'Round of 32',
  'R16': 'Round of 16',
  'QF': 'Quarter-Finals',
  'SF': 'Semi-Finals',
  'F': 'Final',
}

// Group pick scoring
export const GROUP_PICK_POINTS = {
  CORRECT_TEAM_ADVANCE: 1,   // +1 for correctly picking a team that advances (1st or 2nd)
  CORRECT_POSITION: 1,        // +1 bonus for getting their exact position right
  CORRECT_THIRD_PLACE: 1,     // +1 for correctly picking a 3rd-place team that advances
  MAX_PER_GROUP: 4,            // 2 advancing teams × 2 pts each  
  MAX_GROUP_TOTAL: 48,         // 12 groups × 4 pts
  MAX_THIRD_PLACE_TOTAL: 8,    // 8 correct 3rd-place picks × 1 pt
  MAX_PHASE1_TOTAL: 56,        // 48 + 8
}

// Knockout scoring max
export const KNOCKOUT_MAX = 
  ROUND_POINTS.R32 * ROUND_MATCH_COUNT.R32 +  // 32
  ROUND_POINTS.R16 * ROUND_MATCH_COUNT.R16 +  // 24
  ROUND_POINTS.QF  * ROUND_MATCH_COUNT.QF +   // 20
  ROUND_POINTS.SF  * ROUND_MATCH_COUNT.SF +   // 16
  ROUND_POINTS.F   * ROUND_MATCH_COUNT.F      // 13
  // Total: 105

export const TOTAL_MAX_POINTS = GROUP_PICK_POINTS.MAX_PHASE1_TOTAL + KNOCKOUT_MAX // 161

// ============================================================
// BRACKET HELPER FUNCTIONS
// ============================================================

/**
 * Given user's group picks (1st, 2nd per group) and their 3rd-place picks 
 * (which 8 groups' 3rd-place teams advance), resolve the full R32 lineup.
 * 
 * For 3rd-place slots, we use a simplified deterministic assignment:
 * Each 3rd-place team goes to the first available R32 slot that lists
 * their group in the possible groups.
 */
export function resolveR32Matchups(
  groupPicks: Record<string, { first: string | null; second: string | null }>,
  advancingThirdPlaceTeams: string[] // Ordered list of 8 team IDs
): { slot: number; home: string | null; away: string | null; homeLabel: string; awayLabel: string }[] {

  // We assign the 8 advancing third-place teams strictly in sequential order
  // to the 8 'away' slots marked for '3rd' place teams.
  let thirdPlaceIndex = 0

  return R32_BRACKET.map(match => {
    // Resolve home team
    let home: string | null = null
    if (match.homeType === '1st' && match.homeGroup) {
      home = groupPicks[match.homeGroup]?.first ?? null
    } else if (match.homeType === '2nd' && match.homeGroup) {
      home = groupPicks[match.homeGroup]?.second ?? null
    }

    // Resolve away team
    let away: string | null = null
    let awayLabel = match.awayLabel

    if (match.awayType === '1st' && match.awayGroup) {
      away = groupPicks[match.awayGroup]?.first ?? null
    } else if (match.awayType === '2nd' && match.awayGroup) {
      away = groupPicks[match.awayGroup]?.second ?? null
    } else if (match.awayType === '3rd') {
      // Slot in the next 3rd-place team from the ordered list
      if (thirdPlaceIndex < advancingThirdPlaceTeams.length) {
        away = advancingThirdPlaceTeams[thirdPlaceIndex]
        awayLabel = `3rd (Rank ${thirdPlaceIndex + 1})`
        thirdPlaceIndex++
      }
    }

    return {
      slot: match.slot,
      home,
      away,
      homeLabel: match.homeLabel,
      awayLabel,
    }
  })
}
