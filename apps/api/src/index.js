import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();
app.use(cors({ origin: (process.env.CORS_ORIGINS || '*').split(',') }));
app.use(express.json());
const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  : null;
const db = () => { if (!supabase) throw Object.assign(new Error('Supabase is not configured. Copy apps/api/.env.example to apps/api/.env.'), { status: 503 }); return supabase; };
const wrap = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
app.get('/api/health', (_req,res) => res.json({ ok:true, service:'ClinicFlow API' }));
app.get('/api/doctors', wrap(async (_req,res) => { const { data,error }=await db().from('doctors').select('id,name,specialty,slot_minutes,accent').eq('active',true).order('name'); if(error) throw error; res.json(data); }));
app.get('/api/appointments', wrap(async (req,res) => { const { date, patient_id }=req.query; let q=db().from('appointments').select('*,doctors(name,specialty)').order('starts_at'); if(date) q=q.gte('starts_at',`${date}T00:00:00`).lt('starts_at',`${date}T23:59:59`); if(patient_id) q=q.eq('patient_id',patient_id); const {data,error}=await q; if(error) throw error; res.json(data); }));
app.post('/api/appointments', wrap(async (req,res) => { const { patient_id,patient_name,patient_phone,doctor_id,starts_at,reason }=req.body; if(!patient_id||!patient_name?.trim()||!doctor_id||!starts_at) return res.status(400).json({error:'Patient, name, doctor, and time are required.'}); const {data,error}=await db().rpc('book_appointment',{p_patient_id:patient_id,p_patient_name:patient_name.trim(),p_patient_phone:patient_phone||null,p_doctor_id:doctor_id,p_starts_at:starts_at,p_reason:reason||null}); if(error) throw error; res.status(201).json(data); }));
app.patch('/api/appointments/:id/status', wrap(async (req,res) => { const allowed=['waiting','in_consult','completed','cancelled']; if(!allowed.includes(req.body.status)) return res.status(400).json({error:'Invalid status.'}); const {data:old,error:readErr}=await db().from('appointments').select('status').eq('id',req.params.id).single(); if(readErr) throw readErr; const next={scheduled:['waiting','cancelled'],waiting:['in_consult','cancelled'],in_consult:['completed'],completed:[],cancelled:[]}; if(!next[old.status]?.includes(req.body.status)) return res.status(409).json({error:`Cannot move ${old.status} to ${req.body.status}.`}); const {data,error}=await db().from('appointments').update({status:req.body.status,notes:req.body.notes??undefined}).eq('id',req.params.id).select('*,doctors(name,specialty)').single(); if(error) throw error; res.json(data); }));
app.patch('/api/appointments/:id/reschedule', wrap(async (req,res) => { const {starts_at}=req.body; if(!starts_at) return res.status(400).json({error:'Choose a new time.'}); const {data,error}=await db().rpc('reschedule_appointment',{p_appointment_id:req.params.id,p_starts_at:starts_at}); if(error) throw error; res.json(data); }));
app.use((err,_req,res,_next)=>{ console.error(err); res.status(err.status||500).json({error:err.code==='23P01'?'That time has just been booked. Please choose another slot.':err.message||'Something went wrong.'}); });
export default app;
if (!process.env.VERCEL) { const port=process.env.PORT||4000; app.listen(port,()=>console.log(`ClinicFlow API listening on ${port}`)); }
