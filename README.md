# ClinicFlow

ClinicFlow is a small clinic scheduling and live queue system with two independent Vercel frontends and one Node/Express API backed by Supabase.

## Run locally

Use Node.js 22 or newer. The API's Supabase client requires the native WebSocket support provided by Node.js 22+.

1. Create a Supabase project and run `supabase/migrations/001_clinicflow.sql` in its SQL editor.
2. Copy `apps/api/.env.example` to `apps/api/.env`, then set the project URL and service role key. Keep that key on the API server only.
3. Run `npm install`, then `npm run dev`.
4. Patient portal: `http://localhost:5173`. Staff queue: `http://localhost:5174`.

## Deploy

Deploy `apps/api` as a Node service (or Vercel Node function) and set `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and comma-separated `CORS_ORIGINS`. Deploy `apps/patient-web` and `apps/staff-web` as separate Vercel projects, setting `VITE_API_URL` to the API origin on each.

Appointment overlap is blocked by a PostgreSQL exclusion constraint, including concurrent booking requests. The queue is ordered by appointment time. Status changes follow Scheduled → Waiting → In consult → Completed; staff can cancel or reschedule before a consultation.
