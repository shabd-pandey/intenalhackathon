create extension if not exists btree_gist;
create type appointment_status as enum ('scheduled','waiting','in_consult','completed','cancelled');
create table doctors (
  id uuid primary key default gen_random_uuid(), name text not null, specialty text not null,
  slot_minutes int not null default 30 check (slot_minutes > 0), accent text not null default '#426b61', active boolean not null default true
);
create table appointments (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null default gen_random_uuid(),
  patient_name text not null, patient_phone text, doctor_id uuid not null references doctors(id),
  starts_at timestamptz not null, ends_at timestamptz not null, reason text,
  status appointment_status not null default 'scheduled', notes text, created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  exclude using gist (doctor_id with =, tstzrange(starts_at, ends_at, '[)') with &&) where (status <> 'cancelled')
);
create index appointments_start_idx on appointments(starts_at) where status <> 'cancelled';
create or replace function book_appointment(p_patient_id uuid,p_patient_name text,p_patient_phone text,p_doctor_id uuid,p_starts_at timestamptz,p_reason text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare d doctors%rowtype; a appointments%rowtype;
begin
 select * into d from doctors where id=p_doctor_id and active=true;
 if not found then raise exception 'Doctor is unavailable'; end if;
 if p_starts_at <= now() then raise exception 'Choose a future time'; end if;
 insert into appointments(patient_id,patient_name,patient_phone,doctor_id,starts_at,ends_at,reason)
 values(p_patient_id,p_patient_name,p_patient_phone,p_doctor_id,p_starts_at,p_starts_at+make_interval(mins=>d.slot_minutes),p_reason) returning * into a;
 return to_jsonb(a);
end $$;
create or replace function reschedule_appointment(p_appointment_id uuid,p_starts_at timestamptz)
returns jsonb language plpgsql security definer set search_path=public as $$
declare a appointments%rowtype; d doctors%rowtype;
begin
 select * into a from appointments where id=p_appointment_id for update;
 if not found or a.status in ('completed','cancelled','in_consult') then raise exception 'Appointment cannot be rescheduled'; end if;
 select * into d from doctors where id=a.doctor_id;
 update appointments set starts_at=p_starts_at,ends_at=p_starts_at+make_interval(mins=>d.slot_minutes),status='scheduled' where id=a.id returning * into a;
 return to_jsonb(a);
end $$;
insert into doctors(name,specialty,slot_minutes,accent) values
('Dr. Maya Chen','Family medicine',30,'#426b61'),('Dr. Elias Park','Cardiology',30,'#b6654e'),('Dr. Nina Patel','Pediatrics',20,'#7c7395');
alter table doctors enable row level security;
alter table appointments enable row level security;
-- The API uses the server-only Supabase service role key. Never expose it in either Vercel frontend.
