import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  Check,
  ChevronRight,
  Clock3,
  FileText,
  MapPin,
  Mic,
  Search,
  Send,
  ShieldAlert,
  UsersRound,
  X,
} from "lucide-react";
import { analyzeImage, analyzeReport } from "../src/api.js";
import "./workforce-intelligence.css";

const SAMPLE_WORKERS = [
  {
    id: "W1024",
    site: "Duliajan",
    camp: "Duliajan Oil Camp",
    role: "Field Operator",
    shifts: 7,
    hours: 58,
    consecutiveShifts: 7,
    nightShifts: 4,
    overtime: 12,
    restHours: 6.5,
    lastRest: "1 day ago",
    training: "Permit-to-work current",
    accidents: 0,
    nearMisses: 1,
    observations: 3,
    fatigueLevel: "HIGH",
    fatigueSignal: "Self-reported fatigue: high",
    review: "Pending",
    reviewedBy: "Unassigned",
    factors: ["7 consecutive shifts", "58 hours this roster", "4 night shifts", "6.5 h average rest", "1 previous near miss"],
  },
  {
    id: "W1082",
    site: "Moran",
    camp: "Moran Field Camp",
    role: "Maintenance Technician",
    shifts: 5,
    hours: 42,
    consecutiveShifts: 5,
    nightShifts: 2,
    overtime: 4,
    restHours: 8.2,
    lastRest: "2 days ago",
    training: "LOTO refresher due",
    accidents: 0,
    nearMisses: 0,
    observations: 2,
    fatigueLevel: "MEDIUM",
    fatigueSignal: "No recent self-report",
    review: "Reviewed",
    reviewedBy: "HSE-014",
    factors: ["5 consecutive shifts", "42 hours this roster", "2 night shifts", "8.2 h average rest", "Training refresher due"],
  },
  {
    id: "W1219",
    site: "Duliajan",
    camp: "Duliajan Oil Camp",
    role: "Instrumentation Technician",
    shifts: 8,
    hours: 64,
    consecutiveShifts: 8,
    nightShifts: 5,
    overtime: 16,
    restHours: 5.2,
    lastRest: "3 days ago",
    training: "Instrument isolation refresher due",
    accidents: 0,
    nearMisses: 1,
    observations: 4,
    fatigueLevel: "VERY HIGH",
    fatigueSignal: "Self-reported: extremely tired",
    review: "Pending",
    reviewedBy: "Unassigned",
    factors: ["8 consecutive shifts", "64 hours this roster", "5 night shifts", "5.2 h average rest", "Self-reported extreme fatigue", "1 previous near miss"],
  },
  {
    id: "W1157",
    site: "Naharkatiya",
    camp: "Naharkatiya Camp",
    role: "Well Services Operator",
    shifts: 4,
    hours: 36,
    consecutiveShifts: 2,
    nightShifts: 0,
    overtime: 0,
    restHours: 11,
    lastRest: "Today",
    training: "All certifications current",
    accidents: 0,
    nearMisses: 0,
    observations: 1,
    fatigueLevel: "LOW",
    fatigueSignal: "No recent self-report",
    review: "Reviewed",
    reviewedBy: "HSE-008",
    factors: ["2 consecutive shifts", "36 hours this roster", "No night shifts", "11 h average rest", "No recorded events"],
  },
];

const SAMPLE_INPUTS = [
  { id: "IN-2307", workerId: "W1024", site: "Duliajan", created: "Today · 14:32", type: "WORKER CONDITION", description: "Feeling extremely tired after the night shift.", status: "HSE REVIEW PENDING", fatigueLevel: "HIGH" },
  { id: "IN-2306", workerId: "W1082", site: "Moran", created: "Today · 10:15", type: "SITE / EQUIPMENT", description: "Pressure valve near the compressor is sticking.", status: "AI ASSESSMENT COMPLETE" },
];

const STORAGE_KEY = "oil-sentinel-workforce-inputs-v1";
const WORKERS_STORAGE_KEY = "oil-sentinel-workforce-roster-v1";
const fatigueTerms = /tired|fatigue|exhaust|sleep|dizz|rested|overwork|night shift|can't focus|cannot focus/i;
const siteTerms = /valve|compressor|pressure|leak|machine|equipment|pump|isolation|malfunction|not working|unsafe|unsafe act|unsafe condition|near.?miss|near miss|hazard|spill|fire|smoke|vibration|broken/i;

function classifyInputIntent(text) {
  const workerCondition = fatigueTerms.test(text);
  const siteCondition = siteTerms.test(text);
  if (workerCondition && siteCondition) return "MULTIPLE SIGNALS";
  if (workerCondition) return "WORKER CONDITION";
  if (siteCondition) return "SITE / EQUIPMENT";
  return "SAFETY REPORT · HSE TRIAGE";
}

function fatigueSignalLevel(text) {
  if (/extremely|very|severe|dizzy|can't focus|cannot focus/i.test(text)) return "VERY HIGH";
  if (/tired|fatigue|exhaust|sleep|overwork|night shift/i.test(text)) return "HIGH";
  return "MEDIUM";
}

function readSavedInputs() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null");
    return Array.isArray(saved)
      ? saved.map((input) => ({
        ...input,
        type: input.type || input.kind || "SAFETY REPORT",
        description: input.description || input.text || "",
        status: input.status || "HSE REVIEW PENDING",
      }))
      : SAMPLE_INPUTS;
  } catch {
    return SAMPLE_INPUTS;
  }
}

function readSavedWorkers() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(WORKERS_STORAGE_KEY) || "null");
    return Array.isArray(saved) ? saved : SAMPLE_WORKERS;
  } catch {
    return SAMPLE_WORKERS;
  }
}

function levelTone(level) {
  return level === "VERY HIGH" || level === "HIGH" ? "high" : level === "MEDIUM" ? "medium" : "low";
}

function fatiguePoint(level) {
  return level === "VERY HIGH" ? 90 : level === "HIGH" ? 72 : level === "MEDIUM" ? 45 : 18;
}

function WorkerRecentInputs({ workerInputs }) {
  return <section className="wi-worker-recent"><div className="wi-section-heading"><div><p className="wi-kicker">MY SAFETY INPUTS</p><h2>Recent inputs</h2></div><span>{workerInputs.length} signals</span></div>{workerInputs.length ? workerInputs.slice(0, 5).map((input) => <article className="wi-worker-signal" key={input.id}><div><strong>{input.type}</strong><small>{input.created} · {input.site}</small></div><p>{input.description || input.text}</p><span className={`wi-feed-status ${input.status.includes("PENDING") ? "pending" : "complete"}`}>{input.status}</span>{input.analysis?.risk_score != null && <small>Site assessment: {input.analysis.risk_level} · {input.analysis.risk_score}/100</small>}</article>) : <p className="wi-empty-priority">No reports from you yet.</p>}</section>;
}

function WorkerDetail({ worker, onClose, onReport, onReview, onAction }) {
  return (
    <div className="wi-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wi-worker-detail" role="dialog" aria-modal="true" aria-labelledby="wi-detail-title">
        <button className="wi-icon-button wi-modal-close" type="button" onClick={onClose} aria-label="Close worker profile"><X size={18} /></button>
        <div className="wi-kicker">AUTHORIZED HSE VIEW · PSEUDONYMOUS ID</div>
        <div className="wi-detail-heading"><div><h2 id="wi-detail-title">Worker {worker.id}</h2><p><MapPin size={14} /> {worker.site} · {worker.camp}</p></div><span className={`wi-level wi-level--${levelTone(worker.fatigueLevel)}`}>{worker.fatigueLevel} FATIGUE</span></div>

        <div className="wi-detail-metrics">
          <div><span>ROLE / JOB TYPE</span><strong>{worker.role}</strong></div>
          <div><span>INDICATIVE FATIGUE SCORE</span><strong>{fatiguePoint(worker.fatigueLevel)} / 100</strong><small>Representative signal, not a calibrated model score</small></div>
          <div><span>HSE FOLLOW-UP</span><strong>{worker.review === "Pending" ? "Pending" : worker.review}</strong><small>{worker.reviewedBy}</small></div>
          <div><span>WORKER CONDITION SIGNAL</span><strong>{worker.fatigueSignal}</strong></div>
        </div>

          <div className="wi-detail-columns">
          <div className="wi-detail-section"><h3><Activity size={15} /> Contributing factors</h3><div className="wi-factor-list">{worker.factors.map((factor) => <div key={factor}><span className="wi-factor-dot" />{factor}</div>)}</div><p className="wi-disclaimer">Fatigue is a safety signal, not a medical diagnosis. The point shown on your profile is a representative safety signal.</p></div>
          <div className="wi-detail-section"><h3><FileText size={15} /> Safety history</h3><dl className="wi-detail-list"><div><dt>Shifts / roster</dt><dd>{worker.shifts}</dd></div><div><dt>Hours worked</dt><dd>{worker.hours} h</dd></div><div><dt>Consecutive shifts</dt><dd>{worker.consecutiveShifts}</dd></div><div><dt>Night shifts</dt><dd>{worker.nightShifts}</dd></div><div><dt>Overtime</dt><dd>{worker.overtime} h</dd></div><div><dt>Rest between shifts</dt><dd>{worker.restHours} h avg</dd></div><div><dt>Last rest period</dt><dd>{worker.lastRest}</dd></div><div><dt>Training / certification</dt><dd>{worker.training}</dd></div><div><dt>Accidents / near misses</dt><dd>{worker.accidents} / {worker.nearMisses}</dd></div><div><dt>Safety observations</dt><dd>{worker.observations}</dd></div></dl></div>
        </div>
        <div className="wi-detail-footer"><div><span className="wi-kicker">HSE RESPONSE</span><strong>{worker.action ? `${worker.action}${worker.actionAt ? ` · ${worker.actionAt}` : ""}` : worker.review === "Pending" ? "Follow up with the worker and verify rest before safety-critical duties." : "No active response recorded · continue monitoring roster and rest controls."}</strong></div><div className="wi-detail-actions">{worker.review === "Pending" && <button className="wi-review-button" type="button" onClick={() => onReview(worker.id)}><Check size={14} /> Mark reviewed</button>}<button className="wi-primary-button" type="button" onClick={() => onAction(worker.id)}>Record HSE action <ArrowRight size={15} /></button><button className="wi-secondary-button" type="button" onClick={() => onReport(worker.id)}>Log signal</button></div></div>
      </section>
    </div>
  );
}

function HSEActionDialog({ worker, onClose, onSave }) {
  const [action, setAction] = useState("Arrange immediate rest and relief cover");
  const [note, setNote] = useState("");
  const actions = [
    "Arrange immediate rest and relief cover",
    "Temporarily remove from safety-critical duty",
    "Conduct supervisor welfare check",
    "Review next shift and rest plan",
  ];

  return (
    <div className="wi-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wi-report-dialog wi-action-dialog" role="dialog" aria-modal="true" aria-labelledby="wi-action-title">
        <button className="wi-icon-button wi-modal-close" type="button" onClick={onClose} aria-label="Close HSE action"><X size={18} /></button>
        <div className="wi-kicker">HSE FOLLOW-UP · {worker.site}</div>
        <h2 id="wi-action-title">Record action for {worker.id}</h2>
        <p className="wi-report-lede">{worker.role} · indicative fatigue signal {fatiguePoint(worker.fatigueLevel)}/100 ({worker.fatigueLevel}). Confirm the worker’s condition directly and apply site procedure.</p>
        <form onSubmit={(event) => { event.preventDefault(); onSave(worker.id, action, note); }}>
          <label className="wi-form-label">RESPONSE<select value={action} onChange={(event) => setAction(event.target.value)}>{actions.map((option) => <option key={option}>{option}</option>)}</select></label>
          <label className="wi-form-label">HANDOVER NOTE · OPTIONAL<textarea rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Add an owner, due time, or follow-up detail." /></label>
          <div className="wi-action-caution"><AlertTriangle size={15} /><span>Fatigue indicators are safety signals, not medical diagnoses. Follow site escalation and fitness-for-duty procedures.</span></div>
          <div className="wi-action-dialog-buttons"><button className="wi-secondary-button" type="button" onClick={onClose}>Cancel</button><button className="wi-primary-button" type="submit"><Check size={14} /> Save HSE action</button></div>
        </form>
      </section>
    </div>
  );
}

function WorkerReportDialog({ worker, onClose, onSaved, embedded = false }) {
  const [inputMode, setInputMode] = useState("text");
  const [text, setText] = useState("");
  const [site, setSite] = useState(worker?.site || "Duliajan");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photo, setPhoto] = useState(null);
  const [photoName, setPhotoName] = useState("");
  const fileRef = useRef(null);
  const recognitionRef = useRef(null);
  const intent = useMemo(() => classifyInputIntent(text), [text]);
  const hasWorkerSignal = intent === "WORKER CONDITION" || intent === "MULTIPLE SIGNALS";
  const hasSiteSignal = intent !== "WORKER CONDITION";

  useEffect(() => () => recognitionRef.current?.stop(), []);
  useEffect(() => {
    setSite(worker?.site || "Duliajan");
    setError("");
  }, [worker?.id]);

  const startSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is unavailable in this browser. Choose Type to enter the report.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event) => setText((previous) => `${previous}${previous ? " " : ""}${event.results[0][0].transcript}`);
    recognition.onerror = (event) => setError(`Speech capture failed: ${event.error}`);
    recognition.onend = () => { recognitionRef.current = null; };
    recognitionRef.current = recognition;
    recognition.start();
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim() && !photo) return;
    setBusy(true);
    setError("");
    const signals = [];
    if (hasWorkerSignal && text.trim()) {
      signals.push({
        type: "WORKER CONDITION",
        fatigueLevel: fatigueSignalLevel(text),
        description: text.trim(),
        workerId: worker?.id || "ANONYMOUS",
        site,
        status: "HSE REVIEW PENDING",
      });
    }
    if (hasSiteSignal && text.trim()) {
      try {
        const analysis = await analyzeReport({ site, text: text.trim() });
        signals.push({ type: "SITE / EQUIPMENT", description: text.trim(), workerId: worker?.id || "ANONYMOUS", site, status: "AI ASSESSMENT COMPLETE", analysis });
      } catch (analysisError) {
        signals.push({ type: "SITE / EQUIPMENT", description: text.trim(), workerId: worker?.id || "ANONYMOUS", site, status: "ANALYSIS PENDING", error: analysisError.message });
      }
    }
    if (photo) {
      try {
        const analysis = await analyzeImage(photo, site);
        signals.push({ type: "SITE / IMAGE EVIDENCE", description: photoName || "Worker-submitted image", workerId: worker?.id || "ANONYMOUS", site, status: "OCR / AI ASSESSMENT COMPLETE", analysis });
      } catch (analysisError) {
        signals.push({ type: "SITE / IMAGE EVIDENCE", description: photoName || "Worker-submitted image", workerId: worker?.id || "ANONYMOUS", site, status: "ANALYSIS PENDING", error: analysisError.message });
      }
    }
    if (signals.length) onSaved(signals);
    setBusy(false);
    if (embedded) {
      setText("");
      setPhoto(null);
      setPhotoName("");
      setInputMode("text");
    } else {
      onClose();
    }
  };

  return (
    <div id={embedded ? "worker-intake" : undefined} className={embedded ? "wi-report-inline" : "wi-modal-backdrop"} role={embedded ? undefined : "presentation"} onMouseDown={embedded ? undefined : (event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className={`wi-report-dialog ${embedded ? "wi-report-composer" : ""}`} role={embedded ? undefined : "dialog"} aria-modal={embedded ? undefined : "true"} aria-labelledby="wi-report-title">
        {!embedded && <button className="wi-icon-button wi-modal-close" type="button" onClick={onClose} aria-label="Close report"><X size={18} /></button>}
        <div className="wi-kicker">FRONTLINE SIGNAL INTAKE</div>
        <h2 id="wi-report-title">Report something</h2>
        <p className="wi-report-lede">Worker condition and site hazard reports are routed separately. A mixed report can create both signals.</p>

        <div className="wi-report-mode" role="tablist" aria-label="Report input method">
          <button type="button" className={inputMode === "text" ? "active" : ""} onClick={() => setInputMode("text")}><FileText size={15} /> Type</button>
          <button type="button" className={inputMode === "speak" ? "active" : ""} onClick={() => { setInputMode("speak"); startSpeech(); }}><Mic size={15} /> Speak</button>
          <button type="button" className={inputMode === "photo" ? "active" : ""} onClick={() => { setInputMode("photo"); fileRef.current?.click(); }}><Camera size={15} /> Photo</button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" hidden onChange={(event) => { const selected = event.target.files?.[0]; if (selected) { setPhoto(selected); setPhotoName(selected.name); } event.target.value = ""; }} />
        </div>

        <form onSubmit={submit}>
          <label className="wi-form-label">WORKER ID<input value={worker?.id || "Anonymous"} readOnly aria-label="Worker ID" /></label>
          <label className="wi-form-label">SITE / OIL CAMP<input value={site} onChange={(event) => setSite(event.target.value)} /></label>
          <label className="wi-form-label">REPORT<textarea rows={5} value={text} onChange={(event) => setText(event.target.value)} placeholder="Example: I'm exhausted after several night shifts. The isolation valve near the pump is also not working." /></label>
          {photoName && <div className="wi-photo-chip"><Camera size={13} /> {photoName}<button type="button" onClick={() => { setPhoto(null); setPhotoName(""); }} aria-label="Remove photo"><X size={13} /></button></div>}
          <div className="wi-route-preview">
            <div className="wi-route-title"><Activity size={15} /><span>Input intent</span><b>{photo && !text.trim() ? "SITE / IMAGE EVIDENCE" : intent}</b></div>
            <div className="wi-route-paths">
              {hasWorkerSignal && <div className="wi-route-path wi-route-path--worker"><strong>Worker condition</strong><span>Self-reported fatigue signal → HSE review</span><small>Not a medical diagnosis; score unchanged pending calibrated model.</small></div>}
              {hasSiteSignal && <div className="wi-route-path wi-route-path--site"><strong>Site / equipment</strong><span>Hazard analysis → SIF / PSIF and barrier assessment</span><small>Sent to the existing report analysis service for the selected site.</small></div>}
              {photo && <div className="wi-route-path wi-route-path--site"><strong>Image evidence</strong><span>OCR / vision analysis → site risk assessment</span><small>Worker image is handled as site evidence, not as fatigue evidence.</small></div>}
            </div>
          </div>
          {error && <p className="wi-error">{error}</p>}
          <button className="wi-primary-button wi-submit-report" type="submit" disabled={busy || (!text.trim() && !photo)}>{busy ? "Submitting signal..." : "Submit report"}<Send size={15} /></button>
        </form>
      </section>
    </div>
  );
}

export default function WorkforceIntelligence({ onBack }) {
  const [workers, setWorkers] = useState(() => {
    const savedWorkers = readSavedWorkers();
    return savedWorkers.length ? savedWorkers : SAMPLE_WORKERS;
  });
  const [inputs, setInputs] = useState(readSavedInputs);
  const [siteFilter, setSiteFilter] = useState("All sites");
  const [fatigueFilter, setFatigueFilter] = useState("All levels");
  const [query, setQuery] = useState("");
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [actionWorkerId, setActionWorkerId] = useState(null);
  const [reportWorkerId, setReportWorkerId] = useState(null);
  const [notice, setNotice] = useState("");
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);
  const actionWorker = workers.find((worker) => worker.id === actionWorkerId);
  const reportWorker = workers.find((worker) => worker.id === reportWorkerId);
  const siteNames = [...new Set(workers.map((worker) => worker.site))].sort();
  const highFatigueCount = workers.filter((worker) => fatiguePoint(worker.fatigueLevel) >= 70).length;
  const urgentCount = workers.filter((worker) => fatiguePoint(worker.fatigueLevel) >= 90).length;
  const pendingCount = workers.filter((worker) => worker.review === "Pending").length;
  const filteredWorkers = workers
    .filter((worker) => siteFilter === "All sites" || worker.site === siteFilter)
    .filter((worker) => {
      const score = fatiguePoint(worker.fatigueLevel);
      if (fatigueFilter === "High or above") return score >= 70;
      if (fatigueFilter === "Medium") return score >= 40 && score < 70;
      if (fatigueFilter === "Low") return score < 40;
      return true;
    })
    .filter((worker) => `${worker.id} ${worker.role} ${worker.site} ${worker.camp}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((left, right) => fatiguePoint(right.fatigueLevel) - fatiguePoint(left.fatigueLevel));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
    } catch {
      setNotice("Browser storage is unavailable; new reports will remain in this session only.");
    }
  }, [inputs]);

  useEffect(() => {
    try {
      window.localStorage.setItem(WORKERS_STORAGE_KEY, JSON.stringify(workers));
    } catch {
      setNotice("Browser storage is unavailable; profile updates will remain in this session only.");
    }
  }, [workers]);

  const saveSignals = (signals) => {
    const now = new Date();
    const timestamp = `Today · ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
    const savedSignals = signals.map((signal, index) => ({
      ...signal,
      id: `IN-${Date.now().toString().slice(-6)}-${index + 1}`,
      created: timestamp,
    }));
    setInputs((previous) => [...savedSignals, ...previous]);

    const fatigueSignal = savedSignals.find((signal) => signal.type === "WORKER CONDITION");
    if (fatigueSignal && fatigueSignal.workerId !== "ANONYMOUS") {
      setActiveWorkerId(fatigueSignal.workerId);
      setWorkers((previous) => previous.map((worker) => worker.id === fatigueSignal.workerId ? {
        ...worker,
        fatigueLevel: fatigueSignal.fatigueLevel,
        fatigueSignal: `Self-reported signal: ${fatigueSignal.fatigueLevel.toLowerCase()}`,
        factors: [...new Set([...worker.factors, `Self-reported fatigue: ${fatigueSignal.fatigueLevel.toLowerCase()}`])],
        review: "Pending",
        reviewedBy: "Unassigned",
      } : worker));
    }
    setNotice(`${savedSignals.length} signal${savedSignals.length === 1 ? "" : "s"} routed for HSE review.`);
    window.setTimeout(() => setNotice(""), 5000);
  };

  const markReviewed = (workerId) => {
    setWorkers((previous) => previous.map((worker) => worker.id === workerId ? { ...worker, review: "Reviewed", reviewedBy: "HSE-OFFICER" } : worker));
    setInputs((previous) => previous.map((input) => input.workerId === workerId && input.status.includes("PENDING") ? { ...input, status: "HSE REVIEWED" } : input));
    setNotice(`Worker ${workerId} marked reviewed.`);
  };

  const saveAction = (workerId, action, note) => {
    const timestamp = new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
    setWorkers((previous) => previous.map((worker) => worker.id === workerId ? {
      ...worker,
      action,
      actionNote: note.trim(),
      actionAt: timestamp,
      review: "Action assigned",
      reviewedBy: "HSE-OFFICER",
    } : worker));
    setInputs((previous) => previous.map((input) => input.workerId === workerId && input.status.includes("PENDING") ? { ...input, status: "HSE ACTION ASSIGNED" } : input));
    setActionWorkerId(null);
    setNotice(`HSE action recorded for worker ${workerId}.`);
    window.setTimeout(() => setNotice(""), 5000);
  };

  return (
    <main className="wi-root">
      <header className="wi-header">
        <div className="wi-brand"><div className="wi-brand-mark"><ShieldAlert size={19} /></div><div><div className="wi-kicker">OIL SENTINEL · HSE OPERATIONS</div><h1>Workforce Risk Monitor</h1></div></div>
        <div className="wi-header-right">
          <span className="wi-authority"><span /> HSE OFFICER VIEW</span>
          <button className="wi-back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Command Center</button>
        </div>
      </header>

      <div className="wi-content">
        {notice && <div className="wi-notice" role="status"><Check size={15} /> {notice}</div>}
        <section className="wi-page-heading wi-hse-heading">
          <div><p className="wi-kicker">HSE WORKFORCE · SITE-WISE CONDITION MONITORING</p><h2>Worker condition by site</h2><p>Review fatigue signals, shift and rest exposure, and open follow-up across the workforce.</p></div>
          <div className="wi-live-indicator"><span /> ROSTER MONITORING</div>
        </section>

        <div className="wi-demo-banner"><span>DEMONSTRATION DATA</span><p>Roster and fatigue indicators are sample signals for this prototype. Verify conditions with the worker and site procedure before acting.</p><b>Indicative score · not a diagnosis</b></div>

        <section className="wi-summary-grid wi-hse-summary" aria-label="Workforce overview">
          <article className="wi-summary-card wi-summary-card--workers"><div><UsersRound size={15} /> WORKERS MONITORED</div><strong>{workers.length}</strong><small>Across {siteNames.length} active sites</small></article>
          <article className="wi-summary-card wi-summary-card--high"><div><AlertTriangle size={15} /> HIGH FATIGUE · 70+</div><strong>{highFatigueCount}</strong><small>Prioritize direct HSE follow-up</small></article>
          <article className="wi-summary-card wi-summary-card--very-high"><div><Activity size={15} /> URGENT · 90+</div><strong>{urgentCount}</strong><small>Review before safety-critical work</small></article>
          <article className="wi-summary-card wi-summary-card--pending"><div><Clock3 size={15} /> FOLLOW-UP PENDING</div><strong>{pendingCount}</strong><small>Workers awaiting HSE review</small></article>
        </section>

        <section className="wi-site-overview" aria-labelledby="wi-site-overview-title">
          <div className="wi-section-heading"><div><p className="wi-kicker">SITE BREAKDOWN</p><h2 id="wi-site-overview-title">Where attention is needed</h2></div><span className="wi-site-hint">Select a site to filter the worker register</span></div>
          <div className="wi-site-grid">
            {siteNames.map((site) => {
              const siteWorkers = workers.filter((worker) => worker.site === site);
              const siteHigh = siteWorkers.filter((worker) => fatiguePoint(worker.fatigueLevel) >= 70).length;
              const average = Math.round(siteWorkers.reduce((total, worker) => total + fatiguePoint(worker.fatigueLevel), 0) / siteWorkers.length);
              return <button className={`wi-site-card ${siteFilter === site ? "active" : ""}`} type="button" key={site} onClick={() => setSiteFilter(siteFilter === site ? "All sites" : site)}>
                <span className="wi-site-card-name"><MapPin size={14} /> {site}</span><strong>{siteWorkers.length}<small> workers</small></strong><div className="wi-site-card-bottom"><span>{siteHigh} high fatigue</span><span>Avg {average}/100</span></div><span className="wi-site-meter"><i style={{ width: `${average}%` }} /></span>
              </button>;
            })}
          </div>
        </section>

        <section className="wi-register-section wi-hse-register" aria-labelledby="wi-register-title">
          <div className="wi-section-heading"><div><p className="wi-kicker">WORKER REGISTER · SORTED BY FATIGUE</p><h2 id="wi-register-title">Individual condition and HSE follow-up</h2></div><span className="wi-queue-count">{highFatigueCount} high-risk workers</span></div>
          <div className="wi-table-controls wi-hse-controls">
            <label className="wi-search"><Search size={14} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search worker, role, or site" aria-label="Search workers" /></label>
            <label className="wi-select-label">SITE<select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}><option>All sites</option>{siteNames.map((site) => <option key={site}>{site}</option>)}</select></label>
            <label className="wi-select-label">FATIGUE<select value={fatigueFilter} onChange={(event) => setFatigueFilter(event.target.value)}><option>All levels</option><option>High or above</option><option>Medium</option><option>Low</option></select></label>
            <span className="wi-result-count">Showing {filteredWorkers.length} of {workers.length}</span>
          </div>
          <div className="wi-table-scroll"><table className="wi-worker-table wi-hse-table"><thead><tr><th>Worker / condition signal</th><th>Site / role</th><th>Roster / rest</th><th>Fatigue indicator</th><th>HSE follow-up</th><th>Officer action</th></tr></thead><tbody>
            {filteredWorkers.map((worker) => {
              const score = fatiguePoint(worker.fatigueLevel);
              return <tr key={worker.id}>
                <td><strong>{worker.id}</strong><small>{worker.fatigueSignal}</small><small>{worker.factors.slice(0, 2).join(" · ")}</small></td>
                <td>{worker.site}<small>{worker.role}</small></td>
                <td>{worker.hours} h · {worker.shifts} shifts<small>{worker.restHours} h avg rest · {worker.nightShifts} night shifts</small></td>
                <td><div className={`wi-table-score wi-table-score--${levelTone(worker.fatigueLevel)}`}><strong>{score}</strong><span>/100</span><b>{worker.fatigueLevel}</b></div><span className="wi-score-track"><i style={{ width: `${score}%` }} /></span></td>
                <td><span className={`wi-review-status ${worker.review === "Pending" ? "pending" : worker.review === "Action assigned" ? "assigned" : "reviewed"}`}>{worker.review === "Pending" ? "Pending review" : worker.review}</span>{worker.action && <small className="wi-assigned-action">{worker.action}</small>}</td>
                <td><div className="wi-hse-row-actions"><button type="button" className="wi-row-action wi-profile-action" onClick={() => setSelectedWorkerId(worker.id)} aria-label={`View worker ${worker.id}`}>View</button><button type="button" className={`wi-primary-button wi-row-action-button ${score >= 70 ? "urgent" : ""}`} onClick={() => setActionWorkerId(worker.id)}>{worker.action ? "Update action" : "Record action"}</button></div></td>
              </tr>;
            })}
            {!filteredWorkers.length && <tr><td className="wi-empty-cell" colSpan="6">No workers match these filters.</td></tr>}
          </tbody></table></div>
        </section>

        <section className="wi-input-feed wi-hse-feed" aria-labelledby="wi-input-feed-title">
          <div className="wi-section-heading"><div><p className="wi-kicker">FRONTLINE REPORTS</p><h2 id="wi-input-feed-title">Latest worker and site signals</h2></div><span className="wi-queue-count">{inputs.length} signals</span></div>
          <div className="wi-feed-list">{inputs.length ? inputs.slice(0, 4).map((input) => <article className="wi-feed-item" key={input.id}>
            <div className={`wi-feed-icon ${input.type.includes("SITE") ? "site" : ""}`}>{input.type.includes("SITE") ? <AlertTriangle size={15} /> : <Activity size={15} />}</div>
            <div className="wi-feed-copy"><div><strong>{input.type}</strong><span>{input.created} · {input.site}</span></div><p>{input.description || input.text}</p><small>Worker {input.workerId} · {input.status}</small></div>
            {input.workerId !== "ANONYMOUS" && workers.some((worker) => worker.id === input.workerId) && <button type="button" className="wi-row-action" onClick={() => setSelectedWorkerId(input.workerId)} aria-label={`Review worker ${input.workerId}`}><ChevronRight size={15} /></button>}
          </article>) : <p className="wi-empty-priority">No frontline signals have been submitted.</p>}</div>
        </section>
        <p className="wi-footer-note"><ShieldAlert size={14} /> Use fatigue indicators to prompt a direct welfare check and site-procedure response. Do not treat the indicative score as a medical or fitness-for-duty determination.</p>
      </div>

      {selectedWorker && <WorkerDetail worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} onReport={(workerId) => { setSelectedWorkerId(null); setReportWorkerId(workerId); }} onReview={(workerId) => { markReviewed(workerId); setSelectedWorkerId(null); }} onAction={(workerId) => { setSelectedWorkerId(null); setActionWorkerId(workerId); }} />}
      {actionWorker && <HSEActionDialog worker={actionWorker} onClose={() => setActionWorkerId(null)} onSave={saveAction} />}
      {reportWorker && <WorkerReportDialog worker={reportWorker} onSaved={(signals) => { saveSignals(signals); setReportWorkerId(null); }} onClose={() => setReportWorkerId(null)} />}
    </main>
  );
}
