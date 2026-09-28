import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  HeartPulse,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Stethoscope,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import "./style.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000";
const key = "clinicflow-patient-id";
const getPatientId = () => {
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
};
const statusLabel = {
  scheduled: "Appointment confirmed",
  waiting: "You’re in the queue",
  in_consult: "Your consultation is in progress",
  completed: "Visit completed",
  cancelled: "Appointment cancelled",
};
const fmt = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const today = new Date().toISOString().slice(0, 10);
function App() {
  const reduceMotion = useReducedMotion();
  const [doctors, setDoctors] = useState([]),
    [appointments, setAppointments] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  const [form, setForm] = useState({
    patient_name: "",
    patient_phone: "",
    doctor_id: "",
    date: today,
    time: "10:00",
    reason: "",
  });
  const patientId = useMemo(getPatientId, []);
  const load = async () => {
    try {
      const [d, a] = await Promise.all([
        fetch(`${API}/api/doctors`),
        fetch(`${API}/api/appointments?patient_id=${patientId}`),
      ]);
      if (!d.ok || !a.ok)
        throw Error(
          "The clinic service is unavailable. Try again in a moment.",
        );
      setDoctors(await d.json());
      setAppointments(await a.json());
      setError("");
    } catch (e) {
      setError(e.message);
    }
  };
  useEffect(() => {
    load();
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (doctors.length && !form.doctor_id)
      setForm((f) => ({ ...f, doctor_id: doctors[0].id }));
  }, [doctors]);
  const active = appointments.find(
    (a) => !["completed", "cancelled"].includes(a.status),
  );
  const position =
    active?.status === "waiting"
      ? appointments.filter(
          (a) => a.status === "waiting" && a.starts_at <= active.starts_at,
        ).length
      : null;
  const wait = position ? Math.max(5, (position - 1) * 12) : 0;
  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const book = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const starts_at = new Date(`${form.date}T${form.time}`).toISOString();
      const r = await fetch(`${API}/api/appointments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, patient_id: patientId, starts_at }),
      });
      const data = await r.json();
      if (!r.ok) throw Error(data.error || "Could not book this appointment.");
      setDone(true);
      setForm((f) => ({
        ...f,
        patient_name: "",
        patient_phone: "",
        reason: "",
      }));
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="app">
      <header className="topbar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <HeartPulse size={19} />
          </span>
          <span>
            clinic<span className="brand-light">flow</span>
          </span>
        </a>
        <nav>
          <a className="nav-active" href="#book">
            Book a visit
          </a>
          <a href="#visit">My visit</a>
        </nav>
        <a
          className="staff-link"
          href={import.meta.env.VITE_STAFF_URL || "http://localhost:5174"}
        >
          Staff portal <ArrowRight size={15} />
        </a>
      </header>
      <main>
        <motion.section
          className="hero"
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }}
        >
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="live-dot" /> CARE, WITHOUT THE WAITING ROOM
              GUESSWORK
            </div>
            <h1>
              Your health visit,
              <br />a little <em>more human.</em>
            </h1>
            <p>
              Book a time that works for you, then follow your place in line
              from wherever you feel most comfortable.
            </p>
            <motion.a
              className="hero-cta"
              href="#book"
              whileHover={reduceMotion ? undefined : { y: -2 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            >
              Find a time <ArrowRight size={16} />
            </motion.a>
            <div className="hero-meta">
              <span>
                <ShieldCheck size={15} /> Your information stays private
              </span>
              <span>
                <Clock3 size={15} /> Real-time queue updates
              </span>
            </div>
          </div>
          <div className="hero-art">
            <div className="art-sun" />
            <div className="art-card">
              <div className="art-card-top">
                <span className="mini-mark">
                  <HeartPulse size={15} />
                </span>
                <span>YOUR VISIT, TODAY</span>
                <Activity size={16} />
              </div>
              <div className="art-time">
                10<span>:</span>30 <small>AM</small>
              </div>
              <div className="art-divider" />
              <div className="art-doctor">
                <div className="avatar">MC</div>
                <div>
                  <strong>Dr. Maya Chen</strong>
                  <small>Family medicine</small>
                </div>
                <span className="confirmed">
                  <Check size={13} />
                </span>
              </div>
              <div className="art-progress">
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="art-footer">
                <span>Looking good</span>
                <span>On track</span>
              </div>
            </div>
            <div className="float-note">
              <span className="note-icon">
                <Clock3 size={15} />
              </span>
              <div>
                <strong>12 min</strong>
                <small>average wait</small>
              </div>
            </div>
            <div className="art-caption">
              Good care starts
              <br />
              with feeling in control.
            </div>
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
          </div>
        </motion.section>
        <section id="book" className="booking-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">A GOOD PLACE TO START</span>
              <h2>Plan your visit</h2>
            </div>
            <span className="section-note">
              A few details, then you’re all set.
            </span>
          </div>
          <div className="booking-grid">
            <motion.form
              className="booking-card"
              initial={reduceMotion ? false : { opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
              onSubmit={book}
            >
              <div className="card-head">
                <span className="step">01</span>
                <div>
                  <h3>Book an appointment</h3>
                  <p>Choose your doctor and a time that suits you.</p>
                </div>
                <CalendarDays className="head-icon" size={20} />
              </div>
              <label>
                Your name
                <input
                  required
                  value={form.patient_name}
                  onChange={(e) => update("patient_name", e.target.value)}
                  placeholder="e.g. Alex Morgan"
                />
              </label>
              <div className="two-col">
                <label>
                  Phone number <span className="optional">OPTIONAL</span>
                  <input
                    value={form.patient_phone}
                    onChange={(e) => update("patient_phone", e.target.value)}
                    placeholder="(555) 000-0000"
                  />
                </label>
                <label>
                  Doctor
                  <select
                    required
                    value={form.doctor_id}
                    onChange={(e) => update("doctor_id", e.target.value)}
                  >
                    <option value="" disabled>
                      Choose a doctor
                    </option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} · {d.specialty}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="two-col">
                <label>
                  Date
                  <input
                    type="date"
                    min={today}
                    required
                    value={form.date}
                    onChange={(e) => update("date", e.target.value)}
                  />
                </label>
                <label>
                  Time
                  <select
                    value={form.time}
                    onChange={(e) => update("time", e.target.value)}
                  >
                    {[
                      "08:30",
                      "09:00",
                      "09:30",
                      "10:00",
                      "10:30",
                      "11:00",
                      "11:30",
                      "13:00",
                      "13:30",
                      "14:00",
                      "14:30",
                      "15:00",
                      "15:30",
                      "16:00",
                    ].map((t) => (
                      <option key={t} value={t}>
                        {new Date(`2000-01-01T${t}`).toLocaleTimeString([], {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <label>
                What brings you in? <span className="optional">OPTIONAL</span>
                <textarea
                  rows="2"
                  value={form.reason}
                  onChange={(e) => update("reason", e.target.value)}
                  placeholder="A short note for the care team"
                />
              </label>
              {error && <div className="error-box">{error}</div>}
              {done && (
                <div className="success-box">
                  <Check size={15} /> Appointment booked. We’ll see you soon.
                </div>
              )}
              <motion.button
                className="submit-btn"
                disabled={busy}
                whileHover={reduceMotion || busy ? undefined : { y: -1 }}
                whileTap={reduceMotion || busy ? undefined : { scale: 0.99 }}
              >
                {busy ? "Checking availability…" : "Find my appointment"}
                <ArrowRight size={16} />
              </motion.button>
              <div className="secure-note">
                <ShieldCheck size={14} /> Your details are only shared with your
                care team.
              </div>
            </motion.form>
            <aside id="visit" className="visit-column">
              <div className="visit-card">
                <div className="visit-card-head">
                  <div>
                    <span className="eyebrow">YOUR CLINIC</span>
                    <h3>Northside Health</h3>
                  </div>
                  <div className="clinic-badge">
                    <Stethoscope size={18} />
                  </div>
                </div>
                <div className="clinic-line">
                  <MapPin size={15} /> 248 Willow Street, Suite 2
                </div>
                <div className="clinic-line">
                  <Clock3 size={15} /> Open today, 8:30 AM – 5 PM
                </div>
                <div className="clinic-rule" />
                <div className="support">
                  <span className="support-dot" />
                  <div>
                    <strong>Here when you need us</strong>
                    <small>Questions? Call (555) 014-2200</small>
                  </div>
                </div>
              </div>
              {active ? (
                <div className="live-card">
                  <div className="live-card-top">
                    <span className="live-pulse">
                      <i />
                    </span>
                    <span>LIVE VISIT STATUS</span>
                    <button aria-label="Refresh status" onClick={load}>
                      <RefreshCw size={14} />
                    </button>
                  </div>
                  <div className="live-status">
                    {statusLabel[active.status]}
                  </div>
                  <div className="live-doctor">
                    with {active.doctors?.name || "your care team"}
                  </div>
                  <div className="visit-details">
                    <span>
                      <CalendarDays size={14} />
                      {new Date(active.starts_at).toLocaleDateString([], {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <span>
                      <Clock3 size={14} />
                      {fmt(active.starts_at)}
                    </span>
                  </div>
                  {position !== null && (
                    <div className="wait-panel">
                      <div>
                        <strong>#{position}</strong>
                        <span>in line</span>
                      </div>
                      <div className="wait-divider" />
                      <div>
                        <strong>~{wait} min</strong>
                        <span>estimated wait</span>
                      </div>
                    </div>
                  )}
                  <p className="update-caption">
                    Updates automatically every few seconds.
                  </p>
                </div>
              ) : (
                <div className="empty-visit">
                  <div className="empty-icon">
                    <CalendarDays size={19} />
                  </div>
                  <h3>
                    Your next visit
                    <br />
                    will show up here.
                  </h3>
                  <p>
                    Once you’ve booked, follow your appointment status and queue
                    position from this card.
                  </p>
                  <a href="#book">
                    Book a visit <ArrowRight size={14} />
                  </a>
                </div>
              )}
              <div className="reassurance">
                <span className="reassurance-icon">
                  <HeartPulse size={17} />
                </span>
                <p>
                  <strong>Care that keeps you in the loop.</strong>
                  <br />
                  Know where things stand, without having to ask.
                </p>
              </div>
            </aside>
          </div>
        </section>
        <footer>
          <a className="brand footer-brand" href="#">
            <span className="brand-icon">
              <HeartPulse size={17} />
            </span>
            <span>
              clinic<span className="brand-light">flow</span>
            </span>
          </a>
          <span>Thoughtful care, one step at a time.</span>
          <span>© 2025 Northside Health</span>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
