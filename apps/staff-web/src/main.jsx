import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Activity,
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  HeartPulse,
  MoreHorizontal,
  RefreshCw,
  Search,
  Stethoscope,
  Users,
  X,
} from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import "./style.css";
const API = import.meta.env.VITE_API_URL || "http://localhost:4000",
  today = new Date().toISOString().slice(0, 10);
const labels = {
    scheduled: "Scheduled",
    waiting: "Waiting",
    in_consult: "In consult",
    completed: "Completed",
    cancelled: "Cancelled",
  },
  nextStatus = {
    scheduled: "waiting",
    waiting: "in_consult",
    in_consult: "completed",
  };
const time = (d) =>
  new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const dateLabel = (d) =>
  new Date(`${d}T12:00:00`).toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
const initials = (n) =>
  n
    .split(" ")
    .map((x) => x[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
function App() {
  const reduceMotion = useReducedMotion();
  const [rows, setRows] = useState([]),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [date, setDate] = useState(today),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [busy, setBusy] = useState(""),
    [selected, setSelected] = useState(null),
    [notes, setNotes] = useState(""),
    [reschedule, setReschedule] = useState(null);
  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/appointments?date=${date}`);
      const d = await r.json();
      if (!r.ok) throw Error(d.error || "Could not load the queue.");
      setRows(d);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [date]);
  useEffect(() => {
    load();
    const i = setInterval(load, 10000);
    return () => clearInterval(i);
  }, [load]);
  const stats = useMemo(
    () => ({
      total: rows.filter((x) => x.status !== "cancelled").length,
      waiting: rows.filter((x) => x.status === "waiting").length,
      consult: rows.filter((x) => x.status === "in_consult").length,
      completed: rows.filter((x) => x.status === "completed").length,
    }),
    [rows],
  );
  const visible = rows.filter(
    (r) =>
      (filter === "all" || r.status === filter) &&
      `${r.patient_name} ${r.doctors?.name || ""} ${r.reason || ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const patch = async (id, status, extra = {}) => {
    setBusy(id);
    try {
      const r = await fetch(`${API}/api/appointments/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, ...extra }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      await load();
      setSelected(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const move = async (id, starts_at) => {
    setBusy(id);
    try {
      const r = await fetch(`${API}/api/appointments/${id}/reschedule`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starts_at }),
      });
      const d = await r.json();
      if (!r.ok) throw Error(d.error);
      setReschedule(null);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  };
  const awaiting = rows.filter((r) =>
    ["scheduled", "waiting"].includes(r.status),
  ).length;
  const onDate = (delta) => {
    const d = new Date(`${date}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setDate(d.toISOString().slice(0, 10));
  };
  return (
    <div className="layout">
      <aside className="sidebar">
        <a className="brand" href="#">
          <span className="brand-icon">
            <HeartPulse size={18} />
          </span>
          <span>
            clinic<span className="brand-light">flow</span>
          </span>
        </a>
        <div className="side-label">WORKSPACE</div>
        <a href="#queue" className="side-item active">
          <CalendarDays size={16} />
          Today’s queue<span className="side-count">{awaiting}</span>
        </a>
        <a
          href={import.meta.env.VITE_PATIENT_URL || "http://localhost:5173"}
          className="side-item"
        >
          <Users size={16} />
          Patient portal
          <ArrowRight size={13} className="side-arrow" />
        </a>
        <div className="side-bottom">
          <div className="clinic-mark">
            <Stethoscope size={16} />
          </div>
          <div>
            <strong>Northside Health</strong>
            <small>Clinic workspace</small>
          </div>
          <MoreHorizontal size={17} />
        </div>
      </aside>
      <main className="main">
        <motion.header
          className="header"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
        >
          <div>
            <div className="breadcrumb">
              Clinic workspace <span>/</span> Queue
            </div>
            <h1>
              Good morning, care team <span>✳</span>
            </h1>
            <p>Here’s what’s happening at your clinic today.</p>
          </div>
          <div className="header-actions">
            <span className="open-chip">
              <i /> Clinic open
            </span>
            <button className="icon-btn" onClick={load} aria-label="Refresh">
              <RefreshCw size={16} />
            </button>
            <div className="staff-avatar">CF</div>
          </div>
        </motion.header>
        <section className="overview">
          <div className="date-switch">
            <button onClick={() => onDate(-1)} aria-label="Previous day">
              <ArrowLeft size={15} />
            </button>
            <div>
              <CalendarDays size={16} />
              <strong>{date === today ? "Today" : dateLabel(date)}</strong>
              <span>
                {date === today ? dateLabel(date) : "Clinic schedule"}
              </span>
            </div>
            <button onClick={() => onDate(1)} aria-label="Next day">
              <ArrowRight size={15} />
            </button>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="stat-cards">
            <div className="stat">
              <span className="stat-icon green">
                <Users size={16} />
              </span>
              <div>
                <span>On today’s list</span>
                <strong>{stats.total}</strong>
              </div>
              <small>patients</small>
            </div>
            <div className="stat">
              <span className="stat-icon amber">
                <Clock3 size={16} />
              </span>
              <div>
                <span>Waiting</span>
                <strong>{stats.waiting}</strong>
              </div>
              <small>in queue</small>
            </div>
            <div className="stat">
              <span className="stat-icon blue">
                <Activity size={16} />
              </span>
              <div>
                <span>In consultation</span>
                <strong>{stats.consult}</strong>
              </div>
              <small>right now</small>
            </div>
            <div className="stat">
              <span className="stat-icon slate">
                <Check size={16} />
              </span>
              <div>
                <span>Completed</span>
                <strong>{stats.completed}</strong>
              </div>
              <small>today</small>
            </div>
          </div>
        </section>
        <section id="queue" className="queue">
          <div className="queue-title">
            <div>
              <div className="section-kicker">THE DAILY FLOW</div>
              <h2>
                Appointment queue{" "}
                <span className="live-tag">
                  <i /> LIVE
                </span>
              </h2>
              <p>
                Appointments stay in chronological order. Status changes update
                the patient portal.
              </p>
            </div>
            <button className="today-btn" onClick={() => setDate(today)}>
              <CalendarDays size={14} /> Today <ChevronDown size={14} />
            </button>
          </div>
          <div className="queue-toolbar">
            <div className="tabs">
              <button
                className={filter === "all" ? "selected" : ""}
                onClick={() => setFilter("all")}
              >
                All <span>{rows.length}</span>
              </button>
              <button
                className={filter === "scheduled" ? "selected" : ""}
                onClick={() => setFilter("scheduled")}
              >
                Scheduled
              </button>
              <button
                className={filter === "waiting" ? "selected" : ""}
                onClick={() => setFilter("waiting")}
              >
                Waiting
              </button>
              <button
                className={filter === "in_consult" ? "selected" : ""}
                onClick={() => setFilter("in_consult")}
              >
                In consult
              </button>
              <button
                className={filter === "completed" ? "selected" : ""}
                onClick={() => setFilter("completed")}
              >
                Completed
              </button>
            </div>
            <label className="search">
              <Search size={15} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a patient"
              />
              <span>⌘ K</span>
            </label>
          </div>
          {error && (
            <div className="error-banner">
              <span>{error}</span>
              <button onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    <span className="th-time">
                      TIME <ArrowDownUp size={12} />
                    </span>
                  </th>
                  <th>PATIENT</th>
                  <th>DOCTOR</th>
                  <th>VISIT NOTE</th>
                  <th>STATUS</th>
                  <th>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      Loading today’s schedule…
                    </td>
                  </tr>
                ) : (
                  visible.map((r, i) => (
                    <motion.tr
                      key={r.id}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { opacity: 0, y: 7 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: reduceMotion ? 0 : 0.2,
                        delay: reduceMotion ? 0 : Math.min(i * 0.025, 0.15),
                      }}
                      className={r.status === "in_consult" ? "current-row" : ""}
                    >
                      <td>
                        <div className="time-cell">
                          <span
                            className={
                              "timeline " +
                              (r.status === "in_consult"
                                ? "timeline-active"
                                : "")
                            }
                          />
                          <strong>{time(r.starts_at)}</strong>
                          <small>
                            {new Date(r.ends_at) - new Date(r.starts_at) > 0
                              ? `${Math.round((new Date(r.ends_at) - new Date(r.starts_at)) / 60000)} min`
                              : ""}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="patient-cell">
                          <span className={`patient-avatar av${i % 5}`}>
                            {initials(r.patient_name)}
                          </span>
                          <div>
                            <strong>{r.patient_name}</strong>
                            <small>
                              {r.patient_phone || "Walk-in / no phone"}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="doctor-cell">
                          <strong>{r.doctors?.name || "—"}</strong>
                          <small>{r.doctors?.specialty || ""}</small>
                        </div>
                      </td>
                      <td>
                        <span className="reason">{r.reason || "—"}</span>
                        {r.status === "completed" && r.notes && (
                          <small className="note-saved">Note saved</small>
                        )}
                      </td>
                      <td>
                        <span className={`status status-${r.status}`}>
                          <i />
                          {labels[r.status]}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          {nextStatus[r.status] && (
                            <button
                              disabled={busy === r.id}
                              className="action-btn"
                              onClick={() =>
                                r.status === "in_consult"
                                  ? (setSelected(r), setNotes(r.notes || ""))
                                  : patch(r.id, nextStatus[r.status])
                              }
                            >
                              {busy === r.id
                                ? "…"
                                : r.status === "scheduled"
                                  ? "Check in"
                                  : r.status === "waiting"
                                    ? "Start visit"
                                    : "Complete"}
                            </button>
                          )}
                          {["scheduled", "waiting"].includes(r.status) && (
                            <button
                              className="more-btn"
                              onClick={() => setReschedule(r)}
                              title="Reschedule or cancel"
                            >
                              <MoreHorizontal size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
                {!loading && !visible.length && (
                  <tr>
                    <td colSpan="6" className="empty-row">
                      <div className="empty-symbol">
                        <CalendarDays size={20} />
                      </div>
                      <strong>No appointments to show</strong>
                      <span>
                        {search
                          ? "Try a different patient name."
                          : "Nothing is scheduled in this view yet."}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>
              Showing <strong>{visible.length}</strong> of{" "}
              <strong>{rows.length}</strong> appointments
            </span>
            <span>
              <span className="foot-live" /> Queue refreshes automatically
            </span>
          </div>
        </section>
        <footer>
          <span>
            ClinicFlow <span>·</span> Northside Health
          </span>
          <span>Patient-first care, thoughtfully coordinated.</span>
        </footer>
      </main>
      {selected && (
        <div
          className="overlay"
          onMouseDown={(e) => e.target === e.currentTarget && setSelected(null)}
        >
          <div className="modal">
            <button className="close" onClick={() => setSelected(null)}>
              <X size={17} />
            </button>
            <div className="modal-kicker">FINISH CONSULTATION</div>
            <h3>{selected.patient_name}</h3>
            <p>
              Save a note for the care team before marking this visit complete.
            </p>
            <label>
              Clinical notes
              <textarea
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Prescription, observations, follow-up…"
              />
            </label>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setSelected(null)}>
                Back to queue
              </button>
              <button
                className="action-btn"
                disabled={busy === selected.id}
                onClick={() => patch(selected.id, "completed", { notes })}
              >
                {busy === selected.id ? "Saving…" : "Save & complete"}
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
      {reschedule && (
        <div
          className="overlay"
          onMouseDown={(e) =>
            e.target === e.currentTarget && setReschedule(null)
          }
        >
          <div className="modal small-modal">
            <button className="close" onClick={() => setReschedule(null)}>
              <X size={17} />
            </button>
            <div className="modal-kicker">APPOINTMENT OPTIONS</div>
            <h3>{reschedule.patient_name}</h3>
            <p>
              Currently booked for {time(reschedule.starts_at)} with{" "}
              {reschedule.doctors?.name}.
            </p>
            <label>
              Move to a new date and time
              <input
                type="datetime-local"
                id="new-time"
                defaultValue={new Date(reschedule.starts_at)
                  .toISOString()
                  .slice(0, 16)}
              />
            </label>
            <div className="modal-actions">
              <button
                className="cancel-btn danger"
                onClick={() => {
                  if (
                    confirm(`Cancel ${reschedule.patient_name}'s appointment?`)
                  )
                    patch(reschedule.id, "cancelled");
                }}
              >
                Cancel visit
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  const v = document.getElementById("new-time").value;
                  if (v) move(reschedule.id, new Date(v).toISOString());
                }}
                disabled={busy === reschedule.id}
              >
                {busy === reschedule.id ? "Saving…" : "Save new time"}
                <Check size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
