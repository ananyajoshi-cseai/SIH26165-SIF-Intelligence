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

function WorkerReportDialog({ worker, onClose, onSaved }) {
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
    onClose();
  };

  return (
    <div className="wi-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section className="wi-report-dialog" role="dialog" aria-modal="true" aria-labelledby="wi-report-title">
        <button className="wi-icon-button wi-modal-close" type="button" onClick={onClose} aria-label="Close report"><X size={18} /></button>
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
  const [workers, setWorkers] = useState(readSavedWorkers);
  const [inputs, setInputs] = useState(readSavedInputs);
  const [selectedWorkerId, setSelectedWorkerId] = useState(null);
  const [reportingWorkerId, setReportingWorkerId] = useState(null);
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("All sites");
  const [notice, setNotice] = useState("");
  const selectedWorker = workers.find((worker) => worker.id === selectedWorkerId);
  const reportingWorker = workers.find((worker) => worker.id === reportingWorkerId);
  const sites = ["All sites", ...new Set(workers.map((worker) => worker.site))];
  const filteredWorkers = workers.filter((worker) => {
    const matchesSearch = `${worker.id} ${worker.site} ${worker.role}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (siteFilter === "All sites" || worker.site === siteFilter);
  });
  const veryHighCount = workers.filter((worker) => worker.fatigueLevel === "VERY HIGH").length;
  const highCount = workers.filter((worker) => worker.fatigueLevel === "HIGH").length;
  const consecutiveCount = workers.filter((worker) => worker.consecutiveShifts >= 6).length;
  const pendingInputs = inputs.filter((input) => input.status.includes("PENDING") || input.status.includes("ANALYSIS PENDING")).length;

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
    if (fatigueSignal?.workerId !== "ANONYMOUS") {
      setWorkers((previous) => previous.map((worker) => worker.id === fatigueSignal.workerId ? {
        ...worker,
        fatigueLevel: fatigueSignal.fatigueLevel,
        fatigueSignal: `Self-reported signal: ${fatigueSignal.fatigueLevel.toLowerCase()}`,
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
        <div className="wi-header-right"><span className="wi-authority"><span /> AUTHORIZED HSE VIEW</span><button className="wi-back-button" type="button" onClick={onBack}><ArrowLeft size={15} /> Command Center</button></div>
      </header>

      <div className="wi-content">
        <div className="wi-page-heading"><div><p className="wi-kicker">WORKFORCE RISK · FATIGUE · FIELD SIGNALS</p><h2>How are our people doing?</h2><p>Aggregate fatigue trends, individual HSE follow-up, and frontline safety reports.</p></div><button className="wi-primary-button" type="button" onClick={() => setReportingWorkerId(selectedWorker?.id || workers[0]?.id || null)}><AlertTriangle size={16} /> Report something</button></div>

        <div className="wi-demo-banner"><span>DEMONSTRATION DATA</span><p>Worker profiles and roster indicators are sample records. No calibrated fatigue model or production workforce feed is connected.</p><b>Fatigue score: not calibrated</b></div>

        {notice && <div className="wi-notice" role="status"><Check size={15} /> {notice}</div>}

        <section className="wi-summary-grid" aria-label="Workforce summary">
          <article className="wi-summary-card wi-summary-card--total"><div><UsersRound size={17} /><span>Total workers</span></div><strong>1,284</strong><small>Aggregate demo roster</small></article>
          <article className="wi-summary-card wi-summary-card--very-high"><div><AlertTriangle size={17} /><span>Very high fatigue</span></div><strong>{veryHighCount}</strong><small>Requires prompt HSE review</small></article>
          <article className="wi-summary-card wi-summary-card--high"><div><Activity size={17} /><span>High fatigue</span></div><strong>{highCount}</strong><small>Sample profiles in this view</small></article>
          <article className="wi-summary-card wi-summary-card--shifts"><div><Clock3 size={17} /><span>Extended consecutive shifts</span></div><strong>{consecutiveCount}</strong><small>6+ consecutive shifts · sample view</small></article>
          <article className="wi-summary-card wi-summary-card--pending"><div><ShieldAlert size={17} /><span>Signals awaiting review</span></div><strong>{pendingInputs}</strong><small>Worker and site signal queue</small></article>
        </section>

        <section className="wi-correlation-strip">
          <div className="wi-correlation-label"><span className="wi-kicker">SITE CORRELATION</span><strong>Fatigue concentration ↔ safety precursors</strong></div>
          {[
            { site: "Duliajan", fatigue: "HIGH", precursors: 5 },
            { site: "Moran", fatigue: "MEDIUM", precursors: 2 },
            { site: "Naharkatiya", fatigue: "LOW", precursors: 1 },
          ].map((row) => <div className="wi-correlation-site" key={row.site}><strong>{row.site}</strong><span className={`wi-level wi-level--${levelTone(row.fatigue)}`}>{row.fatigue} fatigue</span><span>{row.precursors} precursor signals</span></div>)}
          <small>Illustrative association only · not causal or live workforce data</small>
        </section>

        <section className="wi-register-section">
          <div className="wi-section-heading"><div><span className="wi-kicker">AUTHORIZED PERSONNEL</span><h2>Worker risk register</h2><p>Identity is limited to worker ID; no personal names are displayed.</p></div><button className="wi-secondary-button" type="button" onClick={() => setReportingWorkerId(workers[0]?.id || null)}><Mic size={15} /> Speak / report</button></div>
          <div className="wi-table-controls"><label className="wi-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find worker, site, role" /></label><label className="wi-select-label">SITE<select value={siteFilter} onChange={(event) => setSiteFilter(event.target.value)}>{sites.map((site) => <option key={site}>{site}</option>)}</select></label><span className="wi-result-count">{filteredWorkers.length} sample profiles</span></div>

          <div className="wi-table-scroll"><table className="wi-worker-table"><thead><tr><th>Worker ID</th><th>Site / camp</th><th>Role</th><th>Shifts</th><th>Hours</th><th>Night</th><th>Near misses</th><th>Fatigue</th><th>HSE status</th><th /></tr></thead><tbody>
            {filteredWorkers.map((worker) => <tr key={worker.id} onClick={() => setSelectedWorkerId(worker.id)} tabIndex={0} onKeyDown={(event) => { if (event.key === "Enter") setSelectedWorkerId(worker.id); }}>
              <td><strong>{worker.id}</strong></td><td><span>{worker.site}</span><small>{worker.camp}</small></td><td>{worker.role}</td><td>{worker.shifts}</td><td>{worker.hours} h</td><td>{worker.nightShifts}</td><td>{worker.nearMisses}</td><td><span className={`wi-level wi-level--${levelTone(worker.fatigueLevel)}`}>{worker.fatigueLevel}</span><small className="wi-score-unavailable">Score uncalibrated</small></td><td><span className={`wi-review-status ${worker.review === "Pending" ? "pending" : "reviewed"}`}>{worker.review}</span></td><td><button className="wi-row-action" type="button" onClick={(event) => { event.stopPropagation(); setSelectedWorkerId(worker.id); }} aria-label={`Open ${worker.id} profile`}><ChevronRight size={17} /></button></td>
            </tr>)}
            {!filteredWorkers.length && <tr><td className="wi-empty-cell" colSpan={10}>No workers match those filters.</td></tr>}
          </tbody></table></div>
        </section>

        <section className="wi-input-feed">
          <div className="wi-section-heading"><div><span className="wi-kicker">ONE INPUT · TWO INTELLIGENCE PATHS</span><h2>Worker voice &amp; text signals</h2><p>Worker condition reports update fatigue signals. Equipment reports are sent to site-risk analysis.</p></div><span className="wi-queue-count">{inputs.length} recent inputs</span></div>
          <div className="wi-feed-list">{inputs.slice(0, 6).map((input) => <article className="wi-feed-item" key={input.id}><div className={`wi-feed-icon ${input.type.includes("SITE") ? "site" : "worker"}`}>{input.type.includes("SITE") ? <AlertTriangle size={16} /> : <UsersRound size={16} />}</div><div className="wi-feed-copy"><div><strong>{input.type}</strong><span>{input.created}</span></div><p>{input.description || input.text}</p><small>{input.workerId} · {input.site}{input.fatigueLevel ? ` · Fatigue signal: ${input.fatigueLevel}` : ""}</small>{input.analysis?.risk_score != null && <small>Site analysis: {input.analysis.risk_level} · {input.analysis.risk_score}/100 · HSE review required</small>}{input.error && <small className="wi-alert-error">Analysis pending: {input.error}</small>}</div><span className={`wi-feed-status ${input.status.includes("PENDING") ? "pending" : "complete"}`}>{input.status}</span></article>)}</div>
        </section>

        <footer className="wi-footer-note"><ShieldAlert size={14} /> Self-reported fatigue is treated as a safety signal, not a medical diagnosis. HSE review remains the decision authority.</footer>
      </div>

      {selectedWorker && <WorkerDetail worker={selectedWorker} onClose={() => setSelectedWorkerId(null)} onReport={(workerId) => { setSelectedWorkerId(null); setReportingWorkerId(workerId); }} onReview={(workerId) => setWorkers((previous) => previous.map((worker) => worker.id === workerId ? { ...worker, review: "Reviewed", reviewedBy: "HSE-OFFICER" } : worker))} />}
      {reportingWorkerId !== null && <WorkerReportDialog worker={reportingWorker} onClose={() => setReportingWorkerId(null)} onSaved={saveSignals} />}
    </main>
  );
}
