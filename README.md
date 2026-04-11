# FIFA World Cup 2026 "Grand Pool"

The ultimate 2026 World Cup Bracket & Prediction tool. This web application allows users to sign up, join a competitive pool, make their picks for the 104 matches of the 2026 FIFA World Cup, and compete on a global leaderboard.

## Features Currently Implemented (MVP)
* **Premium UI**: Glassmorphic, highly aesthetic signup and login pages built with Tailwind CSS.
* **Supabase Authentication**: Secure user registration and login.
* **The "Venmo Gate" Middleware**: A security layer that blocks unapproved users from accessing the main app and redirects them to a "Payment Pending" screen containing the commissioner's Venmo details.
* **Database Schema**: Full schema prepared for Profiles, Teams, Matches, Picks, and App Settings.

## Tech Stack
* **Framework**: Next.js (App Router)
* **Styling**: Tailwind CSS
* **Database & Auth**: Supabase
* **Language**: TypeScript

---

## Local Setup & Testing

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup (Local Dev)
Make sure Docker Desktop is running on your machine, then initialize and start the local Supabase instance:
```bash
# Start local Supabase instance
npx supabase start
```
*Note: The initialization automatically applies the migrations for the Phase 1 Schema (Profiles, Teams, Matches, Picks, App Settings).*

Copy `.env.local.example` to `.env.local` (or create one) with the configuration output by the `supabase start` command. You will need:
- `NEXT_PUBLIC_SUPABASE_URL` 
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (Needed for seeding)

### 3. Seeding Initial Data
To populate the database with the 48 placeholder teams and 104 matches:
```bash
npx tsx scripts/seed.ts
```

### 4. Run the Application
Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Test the Flow
1. **Signup**: Navigate to `/signup` and create a new account.
2. **Venmo Gate**: Upon successful signup, you will be automatically redirected to `/payment-pending`. This occurs because your new user profile defaults to `is_approved: false`.
3. **Approval (Manual for now)**: To test the approved state, you would need to access your local Supabase studio (usually `http://localhost:54323`), go to the `profiles` table, and check the `is_approved` boolean for your user.
4. **App Access**: Once approved, returning to the app will grant you access to the main dashboard.

---

## Production Supabase Setup

To set up the production environment when you are ready to deploy:
1. Create a new project in the [Supabase Dashboard](https://supabase.com/dashboard).
2. Link your local project to the remote project using the Supabase CLI:
   ```bash
   npx supabase link --project-ref <your-project-ref>
   ```
3. Push the local migrations to the production database:
   ```bash
   npx supabase db push
   ```
4. Find your Project URL and anon API key under Project Settings -> API.
5. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables on your hosting provider (e.g. Vercel).
