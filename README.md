# FIFA World Cup 2026 "Grand Pool"

The ultimate 2026 World Cup Bracket & Prediction tool. 

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Supabase Setup (Local Dev)
Make sure Docker is running on your machine.
```bash
# Start local Supabase instance
npx supabase start

# The initialization includes migrations for the Phase 1 Schema (Profiles, Teams, Matches, Picks, App Settings).
```

Copy `.env.local.example` (or set up `.env.local`) with the values output by the `supabase start` command (specifically `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` mapping to the local API URL and anon key).

### 3. Run the App
```bash
npm run dev
```

## Production Supabase Setup

To set up the production environment:
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
6. Configure Auth Providers: If you intend to use Google/Apple auth, configure them under Authentication -> Providers in the Dashboard.

## Seeding Initial Data
To populate the database with the 48 placeholder teams and 104 matches, run:
```bash
npx tsx scripts/seed.ts
```
*(Ensure your `.env.local` is set with the `SUPABASE_SERVICE_ROLE_KEY` if running against local, which `supabase start` outputs).*
