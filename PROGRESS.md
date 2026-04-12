# Project Progress & Test Suite

This document tracks the completion status of all phases in the FIFA World Cup 2026 "Grand Pool" project. 
It has been updated to reflect the transition from MVP to a **Full Multi-Tenancy Platform** where users can create unlimited "Entries" (brackets) and join multiple isolated "Pools" (leagues).

---

## ✅ Phase 6: Initial Action (Completed)
- [x] Set up the Next.js project and Supabase project.
- [x] Create a `seed.ts` file containing all 48 teams and the placeholder 104-match schedule.
- [x] Build the User Signup and the /payment-pending landing page.

---

## ✅ Phase 1: Database Schema & Core Auth (Completed & Upgraded)
- [x] Base Schema Design (`profiles`, `teams`, `matches`).
- [x] **Multi-Tenancy Override:** Created `entries`, `pools`, and `pool_entries` tables.
- [x] Rebuilt `picks` table to link precisely to `entry_id` (so users can have different brackets for different pools).
- [x] Decentralized the "Venmo Gate": Approvals are no longer global. They happen specifically at the `pool_id` level via the `pool_entries` table.

---

## ✅ Phase 2: Administrative Controls (Completed)
- [x] **Super Admin (FIFA Match Control):** Centralized dashboard locking match outcomes.
- [x] Global Lock Toggles: Secure settings to enforce tournament lock times.
- [x] **Decentralized Commissioners (`/manage/[poolId]`):** Independent dashboards for anyone who hosts a pool. They can view members applying via their `invite_code` and click "Approve" entirely on their own!

---

## ✅ Phase 3: The Picking Engine (Completed)
- [x] Phase 1 UI (Groups): 12 accordions. Selecting picks natively parses to `?entryId=`.
- [x] Phase 2 UI (Knockouts): Horizontal scroll gauntlet.
- [x] Auto-Save: Debounced Server Actions to lock in predicted match results quickly.

---

## ✅ Phase 4: The Scoring Logic (Completed)
- [x] Option A: Standard Bracket (Fixed scale based on phase).
- [x] Option B: Weighted Strategic (1.5x multiplier for upsets utilizing pre-seeded FIFA rankings).
- [x] **Performance Optimization Trigger:** When Super Admin enters a real-world score, the database triggers and natively pre-calculates *both* rule sets immediately and saves them to the `picks` row as `points_bracket` and `points_weighted`. This avoids running runtime math against tens of thousands of rows on page-load!

---

## ✅ Phase 5: Leaderboard & Analytics (Completed)
- [x] **Dynamic Big Board (`/leaderboard`):** Reads the exact `.scoring_system` of the specific pool taking place, and queries the respective pre-calculated points column via blazing fast Database RPC.
- [x] Pool Members list with precise sums.

---

## ✅ Phase 7: Automated Data Sync (Completed)
- [x] Integrated Football-Data.org v4 API to retrieve the official 2026 World Cup data.
- [x] Expanded database Schema to map rigid external API IDs (`api_id`) safely to our extensible `UUID` architecture.
- [x] Built a one-click synchronization trigger within the Super Admin dashboard capable of parsing stages, fetching real-time scores, and idempotently upserting DB rows.

---

## 🔮 Future Work & Polish (Down the Line)
- **Email Notifications**: Resend/SendGrid integration so players get an email when the Commissioner approves them, or a reminder email 24 hours before the group stage locks.
- **Visual Bracket View**: Translating the Knockout Gauntlet picks into a classic branching "Tournament Tree" layout.
- **Analytics Dashboard V2**: Let users compare their bracket directly against the "Top Selected" teams for their specific pool.
- **Mobile PWA**: Add a `manifest.json` and minimal service workers so users can install it to their iOS homescreen natively for quick checking while watching games.
- **Live Updating**: Refactor the Leaderboard to use Supabase Realtime subscriptions so when Super Admin updates a goal, everyone's board flashes and updates without refreshing!
