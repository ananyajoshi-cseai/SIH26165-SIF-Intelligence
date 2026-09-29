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

function WorkerDetail({ worker, onClose, onReport, onReview }) {
  return (
    <div className="wi-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="wi-worker-detail" role="dialog" aria-modal="true" aria-labelledby="wi-detail-title">
        <button className="wi-icon-button wi-modal-close" type="button" onClick={onClose} aria-label="Close worker profile"><X size={18} /></button>
        <div className="wi-kicker">AUTHORIZED HSE VIEW · PSEUDONYMOUS ID</div>
        <div className="wi-detail-heading"><div><h2 id="wi-detail-title">Worker {worker.id}</h2><p><MapPin size={14} /> {worker.site} · {worker.camp}</p></div><span className={`wi-level wi-level--${levelTone(worker.fatigueLevel)}`}>{worker.fatigueLevel} FATIGUE</span></div>

        <div className="wi-detail-metrics">
          <div><span>ROLE / JOB TYPE</span><strong>{worker.role}</strong></div>
          <div><span>CURRENT FATIGUE SCORE</span><strong>Not calibrated</strong><small>Validated model weights required</small></div>
          <div><span>LAST HSE REVIEW</span><strong>{worker.review}</strong><small>{worker.reviewedBy}</small></div>
          <div><span>SELF-REPORTED SIGNAL</span><strong>{worker.fatigueSignal}</strong></div>
        </div>

        <div className="wi-detail-columns">
          <div className="wi-detail-section"><h3><Activity size={15} /> Contributing factors</h3><div className="wi-factor-list">{worker.factors.map((factor) => <div key={factor}><span className="wi-factor-dot" />{factor}</div>)}</div><p className="wi-disclaimer">Fatigue is a safety signal, not a medical diagnosis. No composite score is shown until a model is calibrated on validated workforce data.</p></div>
          <div className="wi-detail-section"><h3><FileText size={15} /> Safety history</h3><dl className="wi-detail-list"><div><dt>Shifts / roster</dt><dd>{worker.shifts}</dd></div><div><dt>Hours worked</dt><dd>{worker.hours} h</dd></div><div><dt>Consecutive shifts</dt><dd>{worker.consecutiveShifts}</dd></div><div><dt>Night shifts</dt><dd>{worker.nightShifts}</dd></div><div><dt>Overtime</dt><dd>{worker.overtime} h</dd></div><div><dt>Rest between shifts</dt><dd>{worker.restHours} h avg</dd></div><div><dt>Last rest period</dt><dd>{worker.lastRest}</dd></div><div><dt>Training / certification</dt><dd>{worker.training}</dd></div><div><dt>Accidents / near misses</dt><dd>{worker.accidents} / {worker.nearMisses}</dd></div><div><dt>Safety observations</dt><dd>{worker.observations}</dd></div></dl></div>
        </div>
        <div className="wi-detail-footer"><div><span className="wi-kicker">RECOMMENDED HSE ACTION</span><strong>{worker.review === "Pending" ? "Review required · confirm roster, rest, and worker-reported signals." : "Continue monitoring · verify training and shift-rest controls."}</strong></div><div className="wi-detail-actions">{worker.review === "Pending" && <button className="wi-review-button" type="button" onClick={() => onReview(worker.id)}><Check size={14} /> Mark reviewed</button>}<button className="wi-primary-button" type="button" onClick={() => onReport(worker.id)}>Report / Speak <ArrowRight size={15} /></button></div></div>
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
  const [activeWorkerId, setActiveWorkerId] = useState(() => readSavedWorkers()[0]?.id || SAMPLE_WORKERS[0].id);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [notice, setNotice] = useState("");
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);
  const activeWorker = workers.find((worker) => worker.id === activeWorkerId) || workers[0];
  const workerInputs = inputs.filter((input) => input.workerId === activeWorker?.id);

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

  return (
    <main className="wi-root">
      <header className="wi-header">
        <div className="wi-brand"><div className="wi-brand-mark"><ShieldAlert size={19} /></div><div><div className="wi-kicker">OIL SENTINEL · FRONTLINE SAFETY</div><h1>Workforce Intelligence</h1></div></div>
        <div className="wi-header-right">
          <label className="wi-worker-switcher"><span>WORKER PROFILE</span><select value={activeWorker.id} onChange={(event) => setActiveWorkerId(event.target.value)}>{workers.map((worker) => <option key={worker.id} value={worker.id}>{worker.id} · {worker.site}</option>)}</select></label>
          <span className="wi-authority"><span /> AUTHORIZED HSE VIEW</span>
          <button className="wi-back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Command Center</button>
        </div>
      </header>

      <div className="wi-content">
        {notice && <div className="wi-notice" role="status"><Check size={15} /> {notice}</div>}
        <WorkerReportDialog worker={activeWorker} embedded onSaved={saveSignals} onClose={() => {}} />

        <section className="wi-individual-profile" aria-label={`Worker profile ${activeWorker.id}`}>
          <div className="wi-individual-heading">
            <div><p className="wi-kicker">WORKER PROFILE · {activeWorker.id}</p><h2>{activeWorker.role}</h2><p>{activeWorker.site} · {activeWorker.camp}</p></div>
            <div className="wi-fatigue-summary"><span className={`wi-level wi-level--${levelTone(activeWorker.fatigueLevel)}`}>{activeWorker.fatigueLevel} FATIGUE</span><strong>Score not calibrated</strong><small>Multi-factor signals are shown; no arbitrary numeric score is assigned.</small></div>
          </div>
          <div className="wi-profile-facts">
            <div><span>NO. OF SHIFTS</span><strong>{activeWorker.shifts}</strong></div>
            <div><span>HOURS WORKED</span><strong>{activeWorker.hours} h</strong></div>
            <div><span>CONSECUTIVE SHIFTS</span><strong>{activeWorker.consecutiveShifts}</strong></div>
            <div><span>NIGHT SHIFTS</span><strong>{activeWorker.nightShifts}</strong></div>
            <div><span>OVERTIME</span><strong>{activeWorker.overtime} h</strong></div>
            <div><span>REST BETWEEN SHIFTS</span><strong>{activeWorker.restHours} h avg</strong></div>
            <div><span>RECENT LEAVE / REST</span><strong>{activeWorker.lastRest}</strong></div>
            <div><span>TRAINING / CERTIFICATION</span><strong>{activeWorker.training}</strong></div>
            <div><span>ACCIDENTS / NEAR MISSES</span><strong>{activeWorker.accidents} / {activeWorker.nearMisses}</strong></div>
            <div><span>SAFETY OBSERVATIONS</span><strong>{activeWorker.observations}</strong></div>
          </div>
          <div className="wi-profile-lower">
            <section className="wi-profile-panel"><h3>Fatigue contributing signals</h3><div className="wi-factor-list">{activeWorker.factors.map((factor) => <div key={factor}><span className="wi-factor-dot" />{factor}</div>)}</div><p className="wi-disclaimer">Self-reported fatigue is a safety signal, not a medical diagnosis. Fatigue scoring requires validation and calibration before a numeric score is shown.</p></section>
            <section className="wi-profile-panel wi-hse-action"><p className="wi-kicker">HSE ACTION · LAST REVIEW {activeWorker.reviewedBy === "Unassigned" ? "NOT RECORDED" : `BY ${activeWorker.reviewedBy}`}</p><h3>{activeWorker.review === "Pending" ? "Review required" : "Currently monitored"}</h3><p>{activeWorker.review === "Pending" ? "Confirm the worker-reported signal, roster, rest interval, and task assignment." : "Review the roster and worker inputs again if the fatigue signal changes."}</p><div className="wi-hse-actions"><button className="wi-primary-button" type="button" onClick={() => setWorkers((previous) => previous.map((worker) => worker.id === activeWorker.id ? { ...worker, review: worker.review === "Pending" ? "Reviewed" : "Pending", reviewedBy: worker.review === "Pending" ? "HSE-OFFICER" : "Unassigned" } : worker))}>{activeWorker.review === "Pending" ? "Mark HSE review complete" : "Reopen HSE review"}</button><button className="wi-secondary-button" type="button" onClick={() => setSelectedWorkerId(activeWorker.id)}>Full worker record</button></div></section>
          </div>
          <section className="wi-worker-recent"><div className="wi-section-heading"><div><p className="wi-kicker">THIS WORKER</p><h2>Recent inputs</h2></div><span>{workerInputs.length} signals</span></div>{workerInputs.length ? workerInputs.slice(0, 5).map((input) => <article className="wi-worker-signal" key={input.id}><div><strong>{input.type}</strong><small>{input.created} · {input.site}</small></div><p>{input.description || input.text}</p><span className={`wi-feed-status ${input.status.includes("PENDING") ? "pending" : "complete"}`}>{input.status}</span>{input.analysis?.risk_score != null && <small>Site assessment: {input.analysis.risk_level} · {input.analysis.risk_score}/100</small>}</article>) : <p className="wi-empty-priority">No reports from this worker yet.</p>}</section>
        </section>
        <p className="wi-demo-note">Demonstration profile · roster and fatigue categories are sample records. The fatigue model is not calibrated.</p>
      </div>

      {selectedWorker && <WorkerDetail worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} onReport={(workerId) => { setSelectedWorkerId(null); setActiveWorkerId(workerId); document.getElementById("worker-intake")?.scrollIntoView({ behavior: "smooth" }); }} onReview={(workerId) => setWorkers((previous) => previous.map((worker) => worker.id === workerId ? { ...worker, review: "Reviewed", reviewedBy: "HSE-OFFICER" } : worker))} />}
    </main>
  );
}
