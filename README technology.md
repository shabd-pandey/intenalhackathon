# ClinicFlow Technology Stack

Presentation-ready technology overview for the ClinicFlow hospital appointment and queue system.

## Project in one line

ClinicFlow is a hospital scheduling system with a patient appointment portal, a staff queue dashboard, and a REST API connected to a Supabase PostgreSQL database.

## Languages and runtimes

- **JavaScript (ES modules):** API server and React application logic.
- **JSX:** React component markup in both web applications.
- **HTML5:** Frontend document shells.
- **CSS3:** Responsive layout, styling, and interface motion support.
- **SQL:** Supabase schema, tables, indexes, constraints, and security settings.
- **PL/pgSQL:** PostgreSQL functions for booking and rescheduling appointments.
- **Node.js 22+:** Runtime for the Express API and development scripts.

## Frontend

- **React 18:** User interfaces for the patient portal and staff dashboard.
- **Vite 6:** Frontend development server and production build tool.
- **Motion for React (`motion`):** Interface entrance, press, and queue update animations, with reduced-motion support.
- **Lucide React:** Interface icon library.
- **DM Sans and Manrope:** Web fonts used for interface typography.

### Patient portal

Patients can choose a doctor, appointment date and time, enter visit details, book an appointment, and view their live appointment status and queue position.

### Staff dashboard

Clinic staff can view and search the daily queue, filter by appointment status, check patients in, update consultation status, add completion notes, and cancel or reschedule visits.

## Backend and API

- **Node.js:** JavaScript server runtime.
- **Express 4:** HTTP server and REST API routing.
- **Supabase JavaScript client:** Server-side connection to Supabase services and PostgreSQL data.
- **REST/JSON:** Communication format between both web applications and the API.
- **CORS middleware:** Allows configured frontend origins to access the API.
- **dotenv:** Loads local API configuration from environment variables.

Main API operations include listing doctors and appointments, booking appointments, updating appointment status, and rescheduling appointments.

## Database and data services

- **Supabase:** Hosted backend platform used to connect ClinicFlow to its database.
- **PostgreSQL:** Relational database for doctor and appointment records.
- **PL/pgSQL database functions:** Perform booking and rescheduling operations in the database.
- **PostgreSQL exclusion constraint:** Prevents overlapping appointments for the same doctor, including concurrent booking attempts.
- **Row-level security (RLS):** Enabled on the doctors and appointments tables. The API uses a server-side Supabase service-role key; that key must not be placed in either frontend.

## Hosting and development tools

- **Vercel:** Deployment target configured for the two frontends and the Node API.
- **npm workspaces:** Manage the API and both frontends in one repository.
- **concurrently:** Starts the API, patient portal, and staff dashboard together during local development.
- **Vite development servers:** Patient portal on port `5173`; staff dashboard on port `5174`.

## How the parts connect

```text
Patient portal (React + Vite) ─┐
                               ├─ REST/JSON ─> Express API (Node.js) ─> Supabase PostgreSQL
Staff dashboard (React + Vite) ┘                        │
                                                        └─ Database booking/rescheduling functions
```

The API is the shared backend for both interfaces. PostgreSQL stores appointment data and enforces scheduling rules.

## Suggested presentation summary

> ClinicFlow uses React and Vite to provide separate patient and staff web interfaces. An Express REST API running on Node.js connects both interfaces to Supabase PostgreSQL. Database functions and constraints handle appointment booking, rescheduling, and overlap prevention. Vercel is configured for deployment, and Motion provides subtle, accessible interface animations.
