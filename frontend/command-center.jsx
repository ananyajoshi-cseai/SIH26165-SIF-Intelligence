import React, { useEffect, useMemo, useRef, useState } from "react";
import indiaMap from "@svg-maps/india";
import {
  AlertTriangle,
  FileText,
  ShieldAlert,
  TrendingUp,
  ShieldCheck,
  MapPinned,
  Minus,
  Plus,
  RadioTower,
  Gauge,
  ArrowRight,
  Check,
  HardHat,
  X,
  Activity,
  Bell,
  Mic,
  FileUp,
  ClipboardCheck,
  History,
  BrainCircuit,
  UsersRound,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  analyzeImage,
  analyzeReport,
  getBarrierIntelligence,
  getDashboardSummary,
  getEmergingPatterns,
  getEvaluationMetrics,
  getSimilarReports,
  submitFeedback,
  uploadReports,
} from "../src/api.js";
import featureImage1 from "./img&vid/img1.png";
import featureImage2 from "./img&vid/img2.png";
import featureImage3 from "./img&vid/img3.png";
import featureImage4 from "./img&vid/img4.png";
import "./command-center.css";

const C = {
  navy: "#120F12",
  navyDeep: "#090A0D",
  saffron: "#FF6B4A",
  green: "#1FBF73",
  paper: "#0E1014",
  card: "#171A1F",
  ink: "#F7F8FA",
  inkSoft: "#A7B0BA",
  line: "rgba(255,255,255,0.09)",
  red: "#B91C1C",
  redBright: "#F24B45",
  orange: "#FF9A3E",
  yellow: "#F4C95D",
  greenGood: "#2FCF88",
};

function Emblem({ size = 44 }) {
  return (
    <svg className="cc-emblem" width={size} height={size} viewBox="0 0 100 100">
      <circle
        cx="50"
        cy="50"
        r="48"
        fill="none"
        stroke="#D9C68A"
        strokeWidth="2"
      />
      <circle
        cx="50"
        cy="50"
        r="40"
        fill="none"
        stroke="#D9C68A"
        strokeWidth="1"
      />

      {Array.from({ length: 24 }).map((_, i) => {
        const a = (i / 24) * Math.PI * 2;

        return (
          <line
            key={i}
            x1={50 + 40 * Math.cos(a)}
            y1={50 + 40 * Math.sin(a)}
            x2={50 + 46 * Math.cos(a)}
            y2={50 + 46 * Math.sin(a)}
            stroke="#D9C68A"
            strokeWidth="1.4"
          />
        );
      })}

      <circle cx="50" cy="50" r="6" fill="#D9C68A" />

      <path
        d="M50 20 L54 44 L50 50 L46 44 Z"
        fill="#D9C68A"
        opacity="0.9"
      />
    </svg>
  );
}

function CommandHeader({ activeTab, onTabChange }) {
  const navItems = [
    { key: "overview", label: "Operations" },
    { key: "analyze-report", label: "Analyze" },
    { key: "sites", label: "Sites" },
    { key: "historical", label: "History" },
    { key: "precursors", label: "Precursors" },
    { key: "workforce", label: "Workforce" },
    { key: "models", label: "Models" },
  ];

  return (
    <div className="cc-header">
      <div className="cc-top-strip" />
      <div className="cc-header-band">
        <div className="cc-header-inner">
          <div className="cc-brand-wrap">
            <div className="cc-emblem-shell"><Emblem /></div>
            <div className="cc-brand-copy">
              <span className="cc-mini-kicker">GOVERNMENT OF INDIA · MINISTRY OF PETROLEUM &amp; NATURAL GAS</span>
              <h2 className="cc-brand-title">OIL SENTINEL</h2>
              <span className="cc-command-subtitle">Command Center / Operations</span>
            </div>
          </div>

          <div className="cc-header-tools">
            <button className="cc-alert-button" type="button" onClick={() => onTabChange("hse-review")} aria-label="Open HSE review alerts">
              <Bell size={16} /><span>Alerts</span><b>!</b>
            </button>
            <div className="cc-header-profile"><span className="cc-profile-avatar">HSE</span><span><strong>HSE Officer</strong><small>Operations</small></span></div>
          </div>
        </div>

        <div className="cc-nav-bar" role="tablist" aria-label="Command Center workspaces">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={activeTab === item.key}
              className={`cc-nav-button ${activeTab === item.key ? "active" : ""}`}
              onClick={() => onTabChange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function CommandFooter() {
  return (
    <div
      className="cc-footer"
      style={{
        background: C.navyDeep,
        color: "#9FB0BB",
        textAlign: "center",
        padding: "16px 0",
        fontFamily: "'Inter', sans-serif",
        fontSize: 12,
        marginTop: 40,
      }}
    >
      Oil Safety Intelligence Portal · Live analysis from submitted reports
    </div>
  );
}

function BarrierFailureChart({ data }) {
  return (
    <section
      className="cc-panel"
      style={{
        marginTop: "28px",
        background: "linear-gradient(180deg, rgba(19,22,26,0.98), rgba(8,10,13,0.96))",
        border: `1px solid ${C.line}`,
        borderRadius: "16px",
        padding: "22px",
        boxShadow: "0 22px 34px -30px rgba(242,75,69,0.6)",
      }}
    >
      <div
        className="cc-panel-head"
        style={{
          margin: "-22px -22px 20px -22px",
          padding: "20px 22px",
          background: `linear-gradient(90deg, ${C.navy}, #123B59)`,
          borderBottom: `3px solid ${C.saffron}`,
          borderRadius: "8px 8px 0 0",
        }}
      >
        <h2
          style={{
            margin: 0,
            fontSize: "20px",
            color: "#FFFFFF",
            fontFamily: "'Merriweather', serif",
            fontWeight: 700,
          }}
        >
          Barrier Failure Overview
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: "#C7D3DC",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          SIF intelligence identifies the most frequently failed safety barriers
        </p>
      </div>

      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={C.line}
              vertical={true}
              horizontal={false}
            />

            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{
                fontSize: 11,
                fill: C.inkSoft,
                fontFamily: "'Inter', sans-serif",
              }}
              axisLine={{ stroke: C.line }}
              tickLine={false}
            />

            <YAxis
              type="category"
              dataKey="label"
              width={140}
              tick={{
                fontSize: 12,
                fill: C.ink,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip />

            <Bar
              dataKey="score"
              name="Failure Score"
              fill={C.redBright}
              radius={[0, 4, 4, 0]}
              barSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function KPICard({ label, value, subtext, icon: Icon }) {
  const isHighSIF = label === "High SIF Precursors" || label === "High SIF";
  const isPattern = label === "Emerging Pattern Flag";

  return (
    <div
      className={`cc-kpi ${isHighSIF ? "cc-kpi--critical" : isPattern ? "cc-kpi--pattern" : "cc-kpi--signal"}`}
      style={{
        "--kpi-accent": isHighSIF ? C.redBright : isPattern ? C.orange : C.saffron,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "18px",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "12px",
            fontWeight: 700,
            color: C.inkSoft,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          {label}
        </p>

        <div
          className="cc-kpi-icon"
          style={{
            width: 38,
            height: 38,
            borderRadius: "10px",
            background: "linear-gradient(135deg, rgba(242,75,69,0.18), rgba(255,255,255,0.04))",
            border: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={20}
            color={
              isHighSIF
                ? C.redBright
                : isPattern
                  ? C.orange
                  : C.saffron
            }
          />
        </div>
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: label === "Top Hazard" ? "17px" : "30px",
          fontWeight: 700,
          color: "#FFFFFF",
          fontFamily: "'Merriweather', serif",
        }}
      >
        {value}
      </h2>

      <p
        style={{
          marginTop: "8px",
          marginBottom: 0,
          fontSize: "12px",
          color: C.inkSoft,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {subtext}
      </p>
    </div>

  );
}

function SiteRiskComparison({ data }) {
  return (
    <section id="site-ranking" className="cc-ranking-panel">
      <div className="cc-ranking-heading">
        <div><p className="cc-panel-kicker">SITE INTELLIGENCE · TOP FIVE</p><h2>Highest risk locations</h2></div>
        <span>COMPOSITE RISK · 0–100</span>
      </div>
        <div className="cc-ranking-scale"><span>SITE</span><div>{[0, 20, 40, 60, 80, 100].map((value) => <span key={value}>{value}%</span>)}</div></div>
      <div className="cc-ranking-rows">
        {data.slice(0, 5).map((site, index) => (
          <div className="cc-ranking-row" key={site.site}>
            <div className="cc-ranking-site"><b>{String(index + 1).padStart(2, "0")}</b><span>{site.site}</span></div>
            <div className="cc-ranking-track" aria-label={`${site.site}: ${site.risk} out of 100 risk`}>
              <div className={`cc-ranking-fill cc-ranking-fill--${site.level.toLowerCase()}`} style={{ width: `${Math.max(0, Math.min(100, site.risk))}%` }}><span>{String(index + 1).padStart(2, "0")}</span></div>
            </div>
            <strong className={`cc-ranking-score cc-ranking-score--${site.level.toLowerCase()}`}>{site.risk}%</strong>
          </div>
        ))}
        {!data.length && <p className="cc-ranking-empty">No site risk scores available yet.</p>}
      </div>
      <div className="cc-ranking-legend"><span><i className="high" />High</span><span><i className="medium" />Medium</span><span><i className="low" />Low</span></div>
    </section>
  );
}

function HighSIFReports({ reports, setView }) {
  // Newest first, max 5. Data comes from dashboard.recent_high_sif_reports
  const topReports = [...(reports || [])]
    .sort((x, y) => new Date(y.date) - new Date(x.date))
    .slice(0, 5);

  return (
    <section
      id="reports"
      className="cc-panel"
      style={{
        marginTop: "28px",
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 2px 8px rgba(10,42,67,0.08)",
      }}
    >
      {/* Section Header */}
      <div
        className="cc-panel-head"
        style={{
          padding: "20px 22px",
          background: "linear-gradient(90deg, rgba(20,20,22,0.98), rgba(89,15,15,0.9))",
          borderBottom: `3px solid ${C.saffron}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "20px",
              color: "#FFFFFF",
              fontFamily: "'Merriweather', serif",
              fontWeight: 700,
            }}
          >
            Top 5 Recent HIGH SIF Reports
          </h2>

          <p
            style={{
              margin: "6px 0 0",
              fontSize: "12px",
              color: "#C7D3DC",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            Priority reports requiring immediate review
          </p>
        </div>

        <div
          className="cc-priority-badge"
          style={{
            background: C.redBright,
            color: "#FFFFFF",
            padding: "7px 12px",
            borderRadius: "4px",
            fontSize: "10px",
            fontWeight: 800,
            letterSpacing: "0.7px",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          HIGH PRIORITY
        </div>
      </div>

      {/* Column Header */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "90px 150px 1fr 110px 80px 85px",
          gap: "14px",
          alignItems: "center",
          padding: "11px 22px",
          background: C.paper,
          borderBottom: `1px solid ${C.line}`,
          fontSize: "10px",
          fontWeight: 800,
          color: C.inkSoft,
          textTransform: "uppercase",
          letterSpacing: "0.7px",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div>Report ID</div>
        <div>Site</div>
        <div>Incident</div>
        <div>Date</div>
        <div>Risk</div>
        <div>Action</div>
      </div>

      {/* Reports */}
      {topReports.length === 0 && (
        <div style={{ padding: "18px 22px" }}>
          <p style={emptyTextStyle}>No high-risk SIF reports available.</p>
        </div>
      )}
      {topReports.map((report, index) => (
        <div
          key={String(report.id).slice(0, 8)}
          className="cc-row"
          style={{
            display: "grid",
            gridTemplateColumns: "90px 150px 1fr 110px 80px 85px",
            gap: "14px",
            alignItems: "center",
            padding: "15px 22px",
            background: index % 2 === 0 ? "rgba(255,255,255,0.01)" : "rgba(242,75,69,0.04)",
            borderBottom:
              index !== topReports.length - 1
                ? `1px solid ${C.line}`
                : "none",
          }}
        >
          {/* ID */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "#FFFFFF",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {String(report.id).slice(0, 8)}
          </div>

          {/* Site */}
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#FFFFFF",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              {report.site}
            </div>

            <div
              style={{
                marginTop: "3px",
                fontSize: "10px",
                color: C.inkSoft,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Safety Report
            </div>
          </div>

          {/* Incident */}
          <div
            style={{
              fontSize: "12px",
              color: "#E6EDF3",
              lineHeight: 1.45,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {report.incident}
          </div>

          {/* Date */}
          <div
            style={{
              fontSize: "11px",
              color: C.inkSoft,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {new Date(report.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </div>

          {/* Risk Score */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "48px",
              padding: "6px 0",
              background: "#FCE8E6",
              color: C.redBright,
              border: `1px solid #E8B8B4`,
              borderRadius: "4px",
              fontSize: "13px",
              fontWeight: 800,
              fontFamily: "'Inter', sans-serif",
            }}
          >
            {report.score}
          </div>

          {/* Review */}
          <button
            className="cc-btn-outline"
            onClick={() => {
              setView({
                page: "report-detail",
                reportId: report.id,
              });
            }}
            style={{
              border: `1px solid rgba(255,255,255,0.14)`,
              background: "rgba(242,75,69,0.08)",
              color: "#FFF3F0",
              borderRadius: "6px",
              padding: "7px 11px",
              fontSize: "10px",
              fontWeight: 800,
              letterSpacing: "0.4px",
              cursor: "pointer",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            REVIEW
          </button>
        </div>
      ))}
    </section>
  );
}

function CommandUpload({ onIngest, setView }) {
  const [site, setSite] = useState("Numaligarh Refinery");
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [editedExtraction, setEditedExtraction] = useState({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const recognitionRef = React.useRef(null);
  const fileRef = React.useRef(null);

  const extractFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setCsvFile(null);
    setError("");
    setAnalysis(null);
    setStatus("Extracting source text...");
    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv") {
        setCsvFile(file);
        setText(await file.text());
        setStatus("CSV text extracted. Edit it before analysis, or import its rows as a structured batch.");
        return;
      }
      if (["txt"].includes(extension)) {
        setText(await file.text());
      } else if (extension === "pdf") {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
        const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const pages = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => item.str).join(" "));
        }
        const extracted = pages.join("\n\n").trim();
        if (!extracted) throw new Error("No embedded text found. Scanned PDFs need image OCR before analysis.");
        setText(extracted);
      } else if (["xlsx", "xls"].includes(extension)) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        setText(workbook.SheetNames.map((name) => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join("\n\n"));
      } else if (file.type.startsWith("image/")) {
        const result = await analyzeImage(file, site);
        setAnalysis(result);
        setEditedExtraction(result.extraction || {});
        setStatus("OCR and AI analysis complete. Review or correct the extracted fields before HSE validation.");
      } else if (file.type.startsWith("audio/")) {
        setAudioUrl(URL.createObjectURL(file));
        setStatus("Recording loaded. Use browser speech capture or enter the transcript below; uploaded-audio transcription is not configured on this server.");
      } else {
        throw new Error("Choose a PDF, CSV, Excel, TXT, image, or audio recording.");
      }
    } catch (uploadError) {
      setError(uploadError.message || "Unable to extract report text.");
      setStatus("");
    }
  };

  const startSpeechCapture = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech capture is not supported in this browser. Upload a recording and add its transcript manually.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ");
      setText(transcript);
    };
    recognition.onerror = (event) => setError(`Speech capture failed: ${event.error}`);
    recognition.onend = () => setStatus("Speech capture ended. Review the transcript before analysis.");
    recognitionRef.current = recognition;
    setStatus("Listening. Review the transcript below before analysis.");
    recognition.start();
  };

  const runAnalysis = async () => {
    if (!text.trim()) {
      setError("Extract or enter report text before starting analysis.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await analyzeReport({ site, text: text.trim() });
      setAnalysis(result);
      setEditedExtraction(result.extraction || {});
      setStatus("AI analysis complete. HSE validation is required before this record is considered final.");
      await onIngest?.();
    } catch (analysisError) {
      setError(analysisError.message || "Analysis failed.");
    } finally {
      setBusy(false);
    }
  };

  const importCsvBatch = async () => {
    if (!csvFile) return;
    setBusy(true);
    setError("");
    try {
      const result = await uploadReports(csvFile);
      setStatus(`${result.analyzed || 0} reports imported and analyzed from ${csvFile.name}.`);
      await onIngest?.();
    } catch (importError) {
      setError(importError.message || "CSV batch import failed.");
    } finally {
      setBusy(false);
    }
  };

  const saveDecision = async (decision) => {
    if (!analysis?.report_id) return;
    setBusy(true);
    setError("");
    try {
      await submitFeedback(analysis.report_id, editedExtraction, decision);
      setStatus(`HSE ${decision === "VALIDATED" ? "approved" : "rejected"} the record. The decision and corrections are saved as model feedback.`);
      await onIngest?.();
    } catch (validationError) {
      setError(validationError.message || "Unable to save HSE decision.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="analyze-report" className="cc-analysis-workspace">
      <div className="cc-workspace-heading">
        <div><p className="cc-panel-kicker">ANALYZE · VALIDATE · LEARN</p><h2>Report Analysis &amp; HSE Validation</h2><p>AI supports the investigation. HSE personnel make the final decision.</p></div>
        <span className="cc-human-authority"><ClipboardCheck size={15} /> HUMAN VALIDATION REQUIRED</span>
      </div>
      <div className="cc-analysis-grid">
        <div className="cc-analysis-intake">
          <label className="cc-field-label">SITE<input value={site} onChange={(event) => setSite(event.target.value)} /></label>
          <div className="cc-intake-actions">
            <button type="button" onClick={() => fileRef.current?.click()}><FileUp size={16} /> Choose report</button>
            <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.txt,image/*,audio/*,.wav,.mp3,.m4a,.webm" onChange={(event) => { extractFile(event.target.files?.[0]); event.target.value = ""; }} hidden />
            <button type="button" className="cc-speech-button" onClick={startSpeechCapture}><Mic size={16} /> Capture speech</button>
          </div>
          {fileName && <div className="cc-file-label">{fileName}</div>}
          {audioUrl && <audio controls src={audioUrl} className="cc-audio-player" />}
          <label className="cc-field-label">EDITABLE EXTRACTED TEXT<textarea rows={9} value={text} onChange={(event) => setText(event.target.value)} placeholder="Extracted PDF, spreadsheet, OCR, or speech text appears here. Edit it before analysis." /></label>
          <div className="cc-pipeline" aria-label="Analysis pipeline">
            {["Extract", "Classify", "SIF / PSIF", "Hazard & exposure", "Barriers & LSR", "Risk score", "Similarity & patterns", "HSE validation"].map((step, index) => <span key={step} className={analysis && index < 7 ? "complete" : ""}><i>{analysis && index < 7 ? <Check size={11} /> : index + 1}</i>{step}</span>)}
          </div>
          <button type="button" className="cc-analyze-button" disabled={busy || !text.trim()} onClick={runAnalysis}>{busy ? "Analyzing..." : "Analyze report"}<ArrowRight size={16} /></button>
          {csvFile && <button type="button" className="cc-csv-import-button" disabled={busy} onClick={importCsvBatch}>Import CSV rows as a batch</button>}
          {status && <p className="cc-status-message">{status}</p>}{error && <p className="cc-error-message">{error}</p>}
        </div>

        <div className="cc-validation-pane">
          <div className="cc-validation-title"><div><p className="cc-panel-kicker">AI ANALYSIS</p><h3>Decision record</h3></div><span className={analysis ? "cc-validation-live" : "cc-validation-pending"}>{analysis ? "READY FOR HSE" : "AWAITING REPORT"}</span></div>
          {analysis ? (
            <>
              <div className="cc-analysis-score"><strong>{analysis.risk_score ?? "--"}</strong><span>/100 RISK</span><b>{analysis.risk_level || "Pending"}</b></div>
              <div className="cc-editable-fields">{["report_type", "sif_potential", "hazard", "activity", "exposure", "barrier_failure", "potential_consequence"].map((field) => <label key={field}>{field.replaceAll("_", " ")}<input value={editedExtraction[field] || ""} onChange={(event) => setEditedExtraction((previous) => ({ ...previous, [field]: event.target.value }))} /></label>)}</div>
              <div className="cc-provenance"><span>AI-generated information</span><i /><span>HSE correction</span><i /><strong>Final validated record</strong></div>
              <div className="cc-decision-buttons"><button type="button" disabled={busy} onClick={() => saveDecision("VALIDATED")}><Check size={15} /> Approve</button><button type="button" disabled={busy} onClick={() => saveDecision("REJECTED")}><X size={15} /> Reject</button></div>
              {analysis.report_id && <button type="button" className="cc-open-analysis" onClick={() => setView({ page: "report-detail", reportId: analysis.report_id })}>Open full investigation <ArrowRight size={14} /></button>}
            </>
          ) : <div className="cc-validation-empty"><ClipboardCheck size={25} /><strong>AI findings appear here</strong><span>Classification, SIF potential, hazards, failed barriers, and risk score will be reviewed by an HSE officer.</span></div>}
        </div>
      </div>
    </section>
  );
}

function IntelligenceLayers({ dashboard, barriers, patterns, reports, mode, similarReports = [] }) {
  const hazardRows = dashboard?.top_hazards || [];
  const barrierRows = barriers.length ? barriers.slice(0, 4) : dashboard?.barrier_failures || [];
  const patternRows = patterns.slice(0, 4);
  const [searchText, setSearchText] = useState("");
  const [reviewedWorkers, setReviewedWorkers] = useState([]);

  const filteredReports = (reports || []).filter((report) => `${report.site} ${report.incident}`.toLowerCase().includes(searchText.toLowerCase()));
  const matchingPatterns = patternRows.length ? patternRows : hazardRows;
  const priorityWorkers = [
    { id: "W1219", site: "Duliajan", role: "Instrumentation Technician", level: "VERY HIGH", indicators: "8 consecutive shifts · 64 h roster · 5.2 h avg rest", signal: "Self-reported extremely tired", review: "Pending" },
    { id: "W1024", site: "Duliajan", role: "Field Operator", level: "HIGH", indicators: "7 consecutive shifts · 58 h roster · 4 night shifts", signal: "Self-reported fatigue: high", review: "Pending" },
  ];

  return (
    <section className="cc-intelligence-workspace" aria-label={`${mode} intelligence`}>
      <div className="cc-workspace-heading"><div><p className="cc-panel-kicker">CONNECTED SIGNALS</p><h2>{mode === "precursors" ? "Recurring Precursor Intelligence" : mode === "historical" ? "Historical Intelligence" : mode === "workforce" ? "Workforce Intelligence" : "HSE Review Queue"}</h2><p>{mode === "historical" ? "Have we seen something like this before?" : mode === "workforce" ? "Aggregate fatigue signals and precursor concentration." : mode === "hse-review" ? "HSE personnel remain the final decision-maker." : "Repeated signals, failed controls, and emerging risk."}</p></div></div>
      <div className="cc-intelligence-grid">
        {mode === "precursors" && <>
          <article id="precursors" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><Activity size={17} /><div><h3>Recurring Precursor Intelligence</h3><small>Patterns · barrier failure · affected operations</small></div></div>
          {matchingPatterns.length ? matchingPatterns.map((item, index) => <div className="cc-pattern-row" key={item.precursor || item.label || index}><div><strong>{item.precursor || item.label}</strong><small>{item.current_count ?? item.count ?? 0} reports · {item.affected_sites?.length || Math.min(5, index + 2)} sites</small></div><b>{item.percentage_increase == null ? "TRACKING" : `${item.percentage_increase > 0 ? "+" : ""}${item.percentage_increase}%`}</b></div>) : <p className="cc-empty-inline">No recurring precursor patterns returned by the service.</p>}
          <div className="cc-module-foot">Repeated hazards · activities · locations · failed barriers · Life-Saving Rules</div>
          </article>
          <article className="cc-intel-module"><div className="cc-module-title"><ShieldAlert size={17} /><div><h3>Failed Barriers</h3><small>Critical protection gaps</small></div></div>
            {barrierRows.slice(0, 4).map((item, index) => <div className="cc-barrier-row" key={item.barrier_failure || item.label || index}><span>{item.barrier_failure || item.label}</span><b>{item.incident_count ?? item.count ?? 0}</b></div>)}
            {!barrierRows.length && <p className="cc-empty-inline">No barrier failures available yet.</p>}
          </article>
        </>}
        {mode === "historical" && <article id="historical" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><History size={17} /><div><h3>Historical Similarity</h3><small>Semantic matches against analyzed reports</small></div></div>
          <div className="cc-similarity-stat"><strong>{similarReports.length || 0}</strong><span>similar reports found</span></div>
          <div className="cc-similarity-breakdown"><span>{similarReports.filter((item) => item.site === reports?.[0]?.site).length} same site</span><span>{new Set(similarReports.map((item) => item.hazard).filter(Boolean)).size} related hazards</span><span>{barrierRows.length} barrier signals</span></div>
          <input className="cc-search-input" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search recent incidents" aria-label="Search recent incidents" />
          <div className="cc-history-results">{similarReports.map((report) => <div key={report.report_id}><strong>{report.site} · {report.hazard || "Related report"}</strong><span>{report.text}</span></div>)}{!similarReports.length && filteredReports.slice(0, 3).map((report) => <div key={report.id}><strong>{report.site}</strong><span>{report.incident}</span></div>)}{!filteredReports.length && !similarReports.length && <small>No matching reports in the current summary.</small>}</div>
          <div className="cc-module-foot">Previous HSE actions and outcomes are not returned by the current similarity endpoint.</div>
        </article>}
        {mode === "workforce" && <article id="workforce" className="cc-intel-module cc-intel-module--wide cc-workforce-module"><div className="cc-module-title"><UsersRound size={17} /><div><h3>Workforce Fatigue</h3><small>Aggregate view · illustrative until fatigue feed connected</small></div></div>
          <div className="cc-fatigue-metrics"><div><b>1,284</b><span>Workers</span></div><div className="fatigue-very-high"><b>4%</b><span>Very high</span></div><div className="fatigue-high"><b>12%</b><span>High</span></div><div className="fatigue-medium"><b>31%</b><span>Medium</span></div><div className="fatigue-low"><b>53%</b><span>Low</span></div></div>
          <div className="cc-fatigue-correlation"><span>Fatigue concentration</span><i /><span>SIF / PSIF precursors</span><b>Monitor</b></div>
          <div className="cc-priority-heading"><div><strong>Priority worker review</strong><small>High and very high fatigue signals requiring HSE attention</small></div><span>{priorityWorkers.filter((worker) => !reviewedWorkers.includes(worker.id)).length} open</span></div>
          <div className="cc-worker-priority-list">{priorityWorkers.map((worker) => {
            const reviewed = reviewedWorkers.includes(worker.id);
            return <div className={`cc-worker-priority-row ${reviewed ? "is-reviewed" : ""}`} key={worker.id}>
              <div className="cc-worker-priority-main"><div><strong>{worker.id}</strong><span>{worker.role} · {worker.site}</span></div><b className={`cc-fatigue-band cc-fatigue-band--${worker.level.toLowerCase().replace(" ", "-")}`}>{worker.level}</b></div>
              <div className="cc-worker-priority-details"><span>{worker.indicators}</span><small>{worker.signal} · {reviewed ? "Reviewed by HSE" : worker.review}</small></div>
              <button type="button" className="cc-worker-review-button" onClick={() => setReviewedWorkers((current) => reviewed ? current.filter((id) => id !== worker.id) : [...current, worker.id])}>{reviewed ? "Reopen review" : "Mark reviewed"}<Check size={13} /></button>
            </div>;
          })}</div>
          <div className="cc-module-foot">Aggregate fatigue bands are representative signals, not live personnel data. Confirm each priority record against the current roster.</div>
        </article>}
        {mode === "hse-review" && <article id="hse-review" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><ClipboardCheck size={17} /><div><h3>Recent HSE Actions</h3><small>Validation queue</small></div></div>
          {(reports || []).slice(0, 4).map((report) => <div className="cc-action-row" key={report.id}><span className="cc-action-dot" /><div><strong>{report.site}</strong><small>{report.incident}</small></div><b>REVIEW</b></div>)}
          {!reports?.length && <p className="cc-empty-inline">No recent HSE review actions.</p>}
          <div className="cc-module-foot">Open the Analyze tab to approve, reject, or correct an AI analysis.</div>
        </article>}
      </div>
    </section>
  );
}

function SiteIntelligenceWorkspace({ dashboard, selectedSite, patterns = [] }) {
  const sites = dashboard?.highest_risk_locations || [];
  const hazards = dashboard?.top_hazards || [];
  const barriers = dashboard?.barrier_failures || [];
  const topSite = selectedSite || sites[0] || oilSites[0];
  const siteName = topSite?.site || topSite?.name;
  const siteReports = (dashboard?.recent_high_sif_reports || []).filter((report) => report.site === siteName);
  const trend = dashboard?.trends?.[0];

  return (
    <section id="sites" className="cc-site-workspace">
      <div className="cc-workspace-heading"><div><p className="cc-panel-kicker">DRILL DOWN · WHY IS IT HAPPENING?</p><h2>Site Risk Intelligence{siteName ? ` — ${siteName}` : ""}</h2><p>Risk context, recurring signals, barriers, and HSE status from analyzed reports.</p>{(selectedSite?.isSample || !selectedSite) && <span className="cc-representative-label">REPRESENTATIVE SITE PROFILE · VERIFY AGAINST LIVE RECORDS</span>}</div></div>
      <div className="cc-site-overview-grid">
        <div className="cc-site-overview-score"><span>RISK SCORE</span><strong>{topSite?.risk ?? "--"}<small>/100</small></strong><b>{topSite?.level || (topSite ? siteRiskLevel(topSite.risk) : "AWAITING DATA")}</b></div>
        <div className="cc-site-metric"><span>SIF PRECURSORS</span><strong>{topSite?.sif ?? dashboard?.high_sif_precursors ?? 0}</strong><small>{topSite?.sif != null ? "representative site profile" : "network reports"}</small></div>
        <div className="cc-site-metric"><span>HIGH PSIF SIGNALS</span><strong>{topSite?.psifHigh ?? topSite?.reports ?? 0}</strong><small>{topSite?.psifHigh != null ? "representative site profile" : "linked site reports"}</small></div>
        <div className="cc-site-metric"><span>LAST REVIEWED</span><strong>{topSite?.lastReviewed || "Pending"}</strong><small>{topSite?.lastReviewed ? "representative profile date" : "reviewer assignment required"}</small></div>
      </div>
      <div className="cc-site-insight-grid">
        <div className="cc-site-insight"><h3>Top hazards &amp; activities</h3>{hazards.slice(0, 4).map((item, index) => <div className="cc-site-data-row" key={item.label}><span>{index + 1}. {item.label}</span><b>{item.count} reports</b></div>)}<p className="cc-site-note">Activity details are available in each report investigation.</p></div>
        <div className="cc-site-insight"><h3>Failed / missing barriers</h3>{barriers.slice(0, 4).map((item, index) => <div className="cc-site-data-row" key={item.label}><span>{item.label}</span><b>{item.count}</b></div>)}<p className="cc-site-note">Barrier intelligence is aggregated across analyzed reports.</p></div>
        <div className="cc-site-insight"><h3>SIF / PSIF trend context</h3>{trend ? <><div className="cc-trend-comparison"><div><span>Previous period</span><b>{trend.previous_count}</b></div><i /><div><span>Current period</span><b>{trend.current_count}</b></div><strong>{trend.percentage_change == null ? "NO BASELINE" : `${trend.percentage_change > 0 ? "+" : ""}${trend.percentage_change}%`}</strong></div><p className="cc-site-note">Network trend; the current API does not return a per-site monthly series.</p></> : <p className="cc-site-note">No trend data returned.</p>}
          <h4 className="cc-subsection-label">Linked recent SIF reports</h4>{siteReports.slice(0, 3).map((report) => <div className="cc-site-data-row" key={report.id}><span>{report.date ? new Date(report.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent"} · {report.incident}</span><b>{report.score}/100</b></div>)}{!siteReports.length && <p className="cc-site-note">No recent report linked to this site in the summary.</p>}</div>
        <div className="cc-site-insight"><h3>Recurring &amp; emerging risks</h3>{patterns.slice(0, 3).map((item, index) => <div className="cc-site-data-row" key={item.precursor || index}><span>{item.precursor}</span><b>{item.current_count ?? 0} reports</b></div>)}{!patterns.length && <p className="cc-site-note">No emerging-risk patterns returned.</p>}<h4 className="cc-subsection-label">Life-Saving Rule distribution</h4><p className="cc-site-note">Rule-level counts are not provided by the current site intelligence API.</p></div>
        <div className="cc-site-insight cc-prevention-card"><h3>Preventive recommendations</h3><p>Prioritize verification of critical controls at the highest-risk site.</p><p>Review repeat precursor activity and assign a named HSE owner.</p><p>Validate fatigue indicators before scheduling safety-critical work.</p><span>HSE validation status · Pending</span></div>
      </div>
    </section>
  );
}

function ModelPerformance({ metrics }) {
  const panels = [
    { key: "report_type_classification", label: "Report Type Classification" },
    { key: "sif_potential_classification", label: "SIF Potential Classification" },
  ];
  return (
    <section id="models" className="cc-model-workspace">
      <div className="cc-workspace-heading"><div><p className="cc-panel-kicker">MODEL PERFORMANCE · EVALUATOR VIEW</p><h2>Classification Performance</h2><p>{metrics?.dataset_info?.total_records || 0} evaluation records · {metrics?.dataset_info?.source || "Metrics service unavailable"}</p></div><BrainCircuit size={22} /></div>
      <div className="cc-model-grid">{panels.map(({ key, label }) => {
        const result = metrics?.[key];
        const values = result ? [["Accuracy", result.accuracy], ["Precision", result.macro_precision], ["Recall", result.macro_recall], ["F1 Score", result.macro_f1]] : [];
        const labels = result?.per_class_metrics?.map((item) => item.label) || [];
        return <article className="cc-model-panel" key={key}><div className="cc-model-panel-title"><div><h3>{label}</h3><small>{result ? `${result.total_samples} labeled samples · macro average` : "Loading evaluation data"}</small></div><span>{result?.correct_predictions ?? "--"}<small>correct</small></span></div>
          <div className="cc-model-metrics">{values.map(([name, value]) => <div key={name}><span>{name}</span><b>{typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "--"}</b><i><em style={{ width: `${Math.max(0, Math.min(100, (value || 0) * 100))}%` }} /></i></div>)}<div><span>PR-AUC</span><b>N/A</b><small>Score probabilities are not returned by the evaluator.</small></div></div>
          {result?.confusion_matrix && <div className="cc-confusion-wrap"><h4>Confusion matrix</h4><table className="cc-confusion-matrix"><thead><tr><th>Actual ↓ / Predicted →</th>{labels.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{labels.map((actual) => <tr key={actual}><th>{actual}</th>{labels.map((predicted) => <td key={predicted}>{result.confusion_matrix[actual]?.[predicted] ?? 0}</td>)}</tr>)}</tbody></table></div>}
        </article>;
      })}</div>
    </section>
  );
}

const oilSites = [
  { name: "Numaligarh Refinery Limited (NRL)", category: "Refinery & petrochemical", mapX: 520, mapY: 281, risk: 88, sif: 8, psifHigh: 5, fatigue: "HIGH", workers: { veryHigh: 12, high: 24, medium: 38, low: 61 }, lastReviewed: "18 Sep 2026", hazard: "Energy isolation", activity: "Maintenance and hot work", barrier: "Permit verification", reports: 12 },
  { name: "Brahmaputra Cracker and Polymer Limited (BCPL)", category: "Refinery & petrochemical", mapX: 545, mapY: 251, risk: 77, sif: 6, psifHigh: 4, fatigue: "MEDIUM", workers: { veryHigh: 7, high: 19, medium: 42, low: 75 }, lastReviewed: "12 Sep 2026", hazard: "Gas release", activity: "Process operations", barrier: "Gas detection", reports: 8 },
  { name: "Duliajan Liquid Petroleum Gas (LPG) Plant", category: "Refinery & petrochemical", mapX: 535, mapY: 256, risk: 72, sif: 5, psifHigh: 3, fatigue: "HIGH", workers: { veryHigh: 9, high: 21, medium: 31, low: 48 }, lastReviewed: "09 Sep 2026", hazard: "Fire and explosion", activity: "LPG transfer", barrier: "Ignition control", reports: 7 },
  { name: "Naharkatiya Oilfield", category: "Onshore field & production hub", mapX: 530, mapY: 266, risk: 66, sif: 4, psifHigh: 2, fatigue: "MEDIUM", workers: { veryHigh: 5, high: 14, medium: 28, low: 63 }, lastReviewed: "21 Aug 2026", hazard: "Line of fire", activity: "Well servicing", barrier: "Exclusion zone", reports: 6 },
  { name: "Moran Field", category: "Onshore field & production hub", mapX: 520, mapY: 276, risk: 61, sif: 3, psifHigh: 1, fatigue: "LOW", workers: { veryHigh: 3, high: 9, medium: 24, low: 72 }, lastReviewed: "04 Sep 2026", hazard: "Dropped objects", activity: "Drilling operations", barrier: "Lifting plan", reports: 5 },
  { name: "Jorajan Oilfield", category: "Onshore field & production hub", mapX: 535, mapY: 261, risk: 55, sif: 2, psifHigh: 1, fatigue: "MEDIUM", workers: { veryHigh: 4, high: 11, medium: 26, low: 54 }, lastReviewed: "26 Aug 2026", hazard: "Vehicle movement", activity: "Field logistics", barrier: "Journey management", reports: 4 },
  { name: "Kumchai Field", category: "Onshore field & production hub", mapX: 545, mapY: 246, risk: 48, sif: 2, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 2, high: 6, medium: 18, low: 49 }, lastReviewed: "30 Aug 2026", hazard: "Pressure release", activity: "Well intervention", barrier: "Isolation verification", reports: 3 },
  { name: "Bhaghewala Field", category: "Onshore field & production hub", mapX: 91, mapY: 260, risk: 45, sif: 1, psifHigh: 0, fatigue: "MEDIUM", workers: { veryHigh: 3, high: 7, medium: 17, low: 38 }, lastReviewed: "15 Aug 2026", hazard: "Manual handling", activity: "Field operations", barrier: "Task risk assessment", reports: 3 },
  { name: "Dandewala Field", category: "Onshore field & production hub", mapX: 116, mapY: 286, risk: 39, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 1, high: 4, medium: 12, low: 43 }, lastReviewed: "02 Sep 2026", hazard: "Vehicle movement", activity: "Site transport", barrier: "Journey management", reports: 2 },
  { name: "Madhuban Central Tank Farm (CTF)", category: "Processing & collection station", mapX: 525, mapY: 271, risk: 71, sif: 4, psifHigh: 2, fatigue: "HIGH", workers: { veryHigh: 8, high: 17, medium: 29, low: 52 }, lastReviewed: "19 Sep 2026", hazard: "Tank overfill", activity: "Tank farm operations", barrier: "Level alarm response", reports: 6 },
  { name: "Tengakhat Oil Collecting Station (OCS)", category: "Processing & collection station", mapX: 515, mapY: 286, risk: 51, sif: 2, psifHigh: 0, fatigue: "MEDIUM", workers: { veryHigh: 2, high: 8, medium: 20, low: 44 }, lastReviewed: "11 Aug 2026", hazard: "Electrical contact", activity: "Equipment maintenance", barrier: "LOTO", reports: 4 },
  { name: "Barekhuri Gas Compressor Station (GCS)", category: "Processing & collection station", mapX: 510, mapY: 296, risk: 42, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 1, high: 5, medium: 16, low: 41 }, lastReviewed: "25 Aug 2026", hazard: "Fall from height", activity: "Inspection", barrier: "Work-at-height control", reports: 2 },
  { name: "Shalmari Early Production System (EPS)", category: "Processing & collection station", mapX: 505, mapY: 306, risk: 33, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 0, high: 3, medium: 13, low: 37 }, lastReviewed: "05 Sep 2026", hazard: "Pressure release", activity: "Well operations", barrier: "Pressure testing", reports: 1 },
];

const siteRiskLevel = (score) => score >= 70 ? "HIGH" : score >= 45 ? "MEDIUM" : "LOW";
const riskMarkerColor = (level) => level === "HIGH" ? "#F24B45" : level === "MEDIUM" ? "#F4C95D" : "#2FCF88";

export function IndiaLiveRiskMap({ dashboard = null, onSiteAnalysis }) {
  const [selectedSite, setSelectedSite] = useState(oilSites[0]);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapPan, setMapPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);
  const networkLinks = [[0, 1], [0, 2], [2, 3], [3, 4], [3, 5], [5, 6], [7, 8], [8, 9], [2, 9], [9, 10], [10, 11], [11, 12]];
  const riskLocations = dashboard?.highest_risk_locations || [];
  const sites = oilSites.map((site) => {
    const live = riskLocations.find((item) => item.site.toLowerCase().includes(site.name.toLowerCase()) || site.name.toLowerCase().includes(item.site.toLowerCase()));
    return live ? { ...site, risk: live.risk, reports: live.reports, isSample: false } : { ...site, isSample: true };
  });
  const highestAttention = [...sites].sort((a, b) => b.risk - a.risk)[0];
  const fatigueColor = (level) => level === "HIGH" ? "#F24B45" : level === "MEDIUM" ? "#F4C95D" : "#2FCF88";
  const updateMapZoom = (delta) => setMapZoom((current) => {
    const next = Math.min(2.4, Math.max(1, Number((current + delta).toFixed(2))));
    if (next === 1) setMapPan({ x: 0, y: 0 });
    return next;
  });
  const handleMapWheel = (event) => {
    updateMapZoom(event.deltaY < 0 ? 0.15 : -0.15);
  };
  const handleMapPointerDown = (event) => {
    if (event.button !== 0 || event.target.closest("button, select, option, label")) return;
    dragRef.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: mapPan.x, originY: mapPan.y };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const handleMapPointerMove = (event) => {
    if (!dragRef.current) return;
    const limit = Math.max(24, (mapZoom - 1) * 260);
    const nextX = dragRef.current.originX + event.clientX - dragRef.current.startX;
    const nextY = dragRef.current.originY + event.clientY - dragRef.current.startY;
    setMapPan({ x: Math.max(-limit, Math.min(limit, nextX)), y: Math.max(-limit * .62, Math.min(limit * .62, nextY)) });
  };
  const stopMapDrag = (event) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null;
  };
  const handleMapMouseDown = (event) => {
    if (event.button !== 0 || event.target.closest("button, select, option, label")) return;
    dragRef.current = { pointerId: "mouse", startX: event.clientX, startY: event.clientY, originX: mapPan.x, originY: mapPan.y };
  };
  const handleMapMouseMove = (event) => {
    if (dragRef.current?.pointerId !== "mouse") return;
    handleMapPointerMove({ clientX: event.clientX, clientY: event.clientY, pointerId: "mouse" });
  };
  const handleMapMouseUp = () => {
    if (dragRef.current?.pointerId === "mouse") dragRef.current = null;
  };

  return (
    <section id="live-risk" className="cc-map-workspace">
      <div className="cc-map-titlebar">
        <div>
          <p className="cc-panel-kicker">OPERATIONS · LIVE SIGNALS</p>
          <h2>India Live Risk Map</h2>
          <p>OIL locations · Site risk and aggregate workforce fatigue</p>
        </div>
        <div className="cc-map-title-actions">
          <label className="cc-site-selector"><MapPinned size={14} /><span>SITE</span><select value={selectedSite.name} onChange={(event) => { const site = sites.find((item) => item.name === event.target.value); if (site) { setSelectedSite(site); setMapZoom(1.25); setMapPan({ x: 0, y: 0 }); } }} aria-label="Select an operations site">
            {sites.map((site) => <option key={site.name} value={site.name}>{site.name}</option>)}
          </select></label>
          <div className="cc-map-live"><span /> LIVE MONITORING</div>
        </div>
      </div>

      <div className="cc-map-layout">
      <div className="cc-india-map" role="group" aria-label="India live risk map" onWheel={handleMapWheel} onPointerDown={handleMapPointerDown} onPointerMove={handleMapPointerMove} onPointerUp={stopMapDrag} onPointerCancel={stopMapDrag} onMouseDown={handleMapMouseDown} onMouseMove={handleMapMouseMove} onMouseUp={handleMapMouseUp} onMouseLeave={handleMapMouseUp}>
        <div className="cc-map-zoom-controls" aria-label="Map zoom controls">
          <button type="button" onClick={() => updateMapZoom(0.2)} aria-label="Zoom in"><Plus size={17} /></button>
          <span>{Math.round(mapZoom * 100)}%</span>
          <button type="button" onClick={() => updateMapZoom(-0.2)} aria-label="Zoom out"><Minus size={17} /></button>
          <button type="button" className="cc-map-reset" onClick={() => { setMapZoom(1); setMapPan({ x: 0, y: 0 }); }} aria-label="Reset map view"><MapPinned size={15} /></button>
        </div>
        <div className="cc-map-coordinate cc-map-coordinate-north">ASSAM · ARUNACHAL PRADESH</div>
        <div className="cc-map-coordinate cc-map-coordinate-west">RAJASTHAN</div>
        <svg className="cc-india-outline" viewBox={indiaMap.viewBox} preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ transform: `translate(${mapPan.x}px, ${mapPan.y}px) scale(${mapZoom})` }}>
          <defs>
            <linearGradient id="india-fill" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#24363a" />
              <stop offset="1" stopColor="#111a1e" />
            </linearGradient>
          </defs>
          {indiaMap.locations.map((state) => <path key={state.id} className="cc-india-state" d={state.path} />)}
          <g className="cc-india-network" aria-hidden="true">
            {networkLinks.map(([from, to]) => {
              const start = sites[from];
              const end = sites[to];
              return <path key={`${start.name}-${end.name}`} d={`M ${start.mapX} ${start.mapY} L ${end.mapX} ${end.mapY}`} />;
            })}
            {sites.map((site) => <circle key={site.name} cx={site.mapX} cy={site.mapY} r="2.2" />)}
          </g>
          <text className="cc-map-region-text" x="493" y="226">ASSAM</text>
          <text className="cc-map-region-text" x="48" y="193">RAJASTHAN</text>
          {sites.map((site) => {
            const level = siteRiskLevel(site.risk);
            return (
              <g key={`site-${site.name}`} className="cc-svg-site-pin" role="button" tabIndex="0" aria-label={`${site.name}, ${level} risk`} aria-pressed={selectedSite.name === site.name} onClick={() => setSelectedSite(site)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSite(site); } }}>
                <title>{site.name} · {level} risk · SIF/PSIF profile</title>
                <circle className="cc-svg-site-halo" cx={site.mapX} cy={site.mapY} r="10" style={{ "--site-color": riskMarkerColor(level) }} />
                <circle className="cc-svg-site-core" cx={site.mapX} cy={site.mapY} r="5.5" style={{ "--site-color": riskMarkerColor(level) }} />
              </g>
            );
          })}
          {sites.map((site) => (
            <g key={`worker-${site.name}`} className="cc-svg-worker-pin" role="button" tabIndex="0" aria-label={`Worker fatigue at ${site.name}: ${site.fatigue}`} onClick={() => setSelectedSite(site)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedSite(site); } }}>
              <title>{site.workers.veryHigh} very high fatigue · {site.workers.high} high fatigue workers at {site.name}</title>
              <rect x={site.mapX + 9} y={site.mapY - 19} width="15" height="15" rx="2" style={{ "--fatigue-color": fatigueColor(site.fatigue) }} />
              <text x={site.mapX + 16.5} y={site.mapY - 8} textAnchor="middle">W</text>
            </g>
          ))}
        </svg>

        <div className="cc-map-legend">
          <span><i style={{ background: C.redBright }} /> High site risk</span>
          <span><i style={{ background: C.yellow }} /> Medium site risk</span>
          <span><i style={{ background: C.greenGood }} /> Low site risk</span>
          <span><HardHat size={13} /> Worker fatigue</span>
        </div>
        <div className="cc-map-credit">Map geometry: SVG Maps / MapSVG · CC BY 4.0</div>
      </div>
      <aside className="cc-selected-site" aria-live="polite" aria-label={`${selectedSite.name} intelligence`}>
        <div className="cc-selected-site-heading">
          <div><p className="cc-panel-kicker">{selectedSite.category} · {siteRiskLevel(selectedSite.risk)} RISK</p><h3>{selectedSite.name}</h3></div>
          <span className={`cc-risk-stamp cc-risk-stamp--${siteRiskLevel(selectedSite.risk).toLowerCase()}`}>{selectedSite.risk}<small>/100</small></span>
        </div>
        <div className="cc-representative-label">Risk and report totals may reflect live data; SIF/PSIF counts, review dates, and worker fatigue profiles are representative.</div>
        <p className="cc-site-about">SIF signals identify exposure with potential for life-altering harm. PSIF tracks high-potential events and near misses before a serious outcome occurs.</p>
        <div className="cc-selected-site-stats">
          <div><span>SIF PRECURSORS</span><strong>{selectedSite.sif}</strong></div>
          <div><span>HIGH PSIF SIGNALS</span><strong>{selectedSite.psifHigh}</strong></div>
          <div><span>LINKED REPORTS</span><strong>{selectedSite.reports}</strong></div>
        </div>
        <div className="cc-site-risk-track"><span>COMPOSITE RISK</span><i><b className={`cc-ranking-fill--${siteRiskLevel(selectedSite.risk).toLowerCase()}`} style={{ width: `${selectedSite.risk}%` }} /></i></div>
        <div className="cc-selected-site-facts">
          <div><span>TOP HAZARD</span><strong>{selectedSite.hazard}</strong></div>
          <div><span>LAST REVIEWED</span><strong>{selectedSite.lastReviewed}</strong></div>
          <div><span>CRITICAL BARRIER</span><strong>{selectedSite.barrier}</strong></div>
          <div><span>PRIMARY ACTIVITY</span><strong>{selectedSite.activity}</strong></div>
        </div>
        <div className="cc-worker-breakdown">
          <div className="cc-worker-breakdown-head"><strong>Worker concentration</strong><span>FATIGUE SIGNALS</span></div>
          {[ ["Very high", "veryHigh", "very-high"], ["High", "high", "high"], ["Medium", "medium", "medium"], ["Low", "low", "low"] ].map(([label, key, tone]) => (
            <div className="cc-worker-breakdown-row" key={key}><span><i className={`cc-fatigue-dot cc-fatigue-dot--${tone}`} />{label}</span><b>{selectedSite.workers[key]}</b><small>workers</small></div>
          ))}
          <p>Representative workforce profile · confirm against the current roster.</p>
        </div>
        <button type="button" className="cc-site-analysis-button" onClick={() => onSiteAnalysis?.(selectedSite)}>View full site analysis <ArrowRight size={15} /></button>
      </aside>
      </div>
    </section>
  );
}

function LiveHighlights({ dashboard }) {
  // dashboard can be null while loading or if the API request fails
  const data = dashboard || {};
  const topHazards = data.top_hazards || [];
  const riskLocations = data.highest_risk_locations || [];

  const fallbackSiteRanks = [
    { site: "Startup Check", risk: 92, level: "HIGH", reports: 12 },
    { site: "Drilling Rig", risk: 88, level: "HIGH", reports: 10 },
    { site: "Oil Well", risk: 81, level: "HIGH", reports: 9 },
    { site: "Numaligarh Pipeline Sec 2", risk: 76, level: "MEDIUM", reports: 8 },
    { site: "Guwahati Refinery", risk: 72, level: "MEDIUM", reports: 7 },
  ];

  const trend = data.trends?.[0];
  const trendText = !trend
    ? null
    : trend.percentage_change === null
      ? `${trend.current_count} this month; no previous-month baseline`
      : `${trend.direction} ${Math.abs(trend.percentage_change)}% this month (${trend.current_count} vs ${trend.previous_count})`;

  const recentSites = (data.recent_high_sif_reports || []).slice(0, 5).map((report) => ({
    site: report.site,
    score: Number(report.score) || 80,
    incident: report.incident,
  }));

  const hotspotData = [...new Map(
    (recentSites.length ? recentSites : [
      { site: "Startup Check", score: 100 },
      { site: "Drilling Rig", score: 96 },
      { site: "Oil Well", score: 93 },
      { site: "Numaligarh Pipeline Sec 2", score: 88 },
      { site: "Guwahati Refinery", score: 84 },
    ]).map((item, index) => [
      item.site,
      {
        id: `${item.site}-${index}`,
        site: item.site,
        x: 18 + ((index * 20) % 58),
        y: 20 + ((index * 17) % 56),
        level: item.score >= 90 ? "HIGH" : item.score >= 70 ? "MEDIUM" : "LOW",
        count: Math.max(4, Math.round(item.score / 12)),
        hazard: "Critical safety precursor",
        barrier: index % 2 === 0 ? "Energy isolation verification" : "Leak detection and containment",
        summary: `Recent high-SIF review indicates repeated precursor risk and elevated HSE exposure at ${item.site}.`,
      },
    ]),
  )].map(([, item]) => item);

  const rankedSites = riskLocations.length ? riskLocations : fallbackSiteRanks;

  const topSifSites = [...rankedSites]
    .sort((a, b) => b.risk - a.risk)
    .slice(0, 5)
    .map((site, index) => ({
      rank: index + 1,
      site: site.site,
      score: Math.min(100, Math.round(site.risk * 0.94 + (index + 1) * 2)),
      level: site.level,
    }));

  const topPsifSites = [...rankedSites]
    .sort((a, b) => b.reports - a.reports || b.risk - a.risk)
    .slice(0, 5)
    .map((site, index) => ({
      rank: index + 1,
      site: site.site,
      score: Math.min(100, Math.round(site.risk * 0.78 + site.reports * 5 + (index + 1) * 3)),
      level: site.level,
    }));

  return (
    <>
      <section className="cc-highlight-grid">
        <div className="cc-highlight-card cc-highlight-card--hazard" style={highlightCardStyle}>
          <h2 style={highlightHeadingStyle}>Top hazards</h2>
          {topHazards.length ? topHazards.map((item, index) => (
            <div key={item.label} style={highlightRowStyle}>
              <strong>{["🥇", "🥈", "🥉"][index] || "•"}</strong>
              <span>{item.label}</span>
              <small>{item.count}</small>
            </div>
          )) : <p style={emptyTextStyle}>No hazard data for today.</p>}
        </div>

        <div className="cc-highlight-card cc-highlight-card--location" style={highlightCardStyle}>
          <h2 style={highlightHeadingStyle}>Highest-risk locations</h2>
          {riskLocations.length ? riskLocations.slice(0, 3).map((item) => (
            <div key={item.site} style={highlightRowStyle}>
              <span>📍 {item.site}</span>
              <strong style={{ color: riskColor(item.level) }}>{item.level}</strong>
            </div>
          )) : <p style={emptyTextStyle}>No location data for today.</p>}
        </div>

        <div className="cc-highlight-card cc-highlight-card--trends" style={highlightCardStyle}>
          <h2 style={highlightHeadingStyle}>Trends</h2>
          <p style={{ ...emptyTextStyle, color: C.ink, lineHeight: 1.6 }}>
            {trendText
              ? `⚠️ ${trend.label || "Safety precursors"} ${trendText}.`
              : "No trend data available."}
          </p>
        </div>
      </section>

      <IndiaLiveRiskMap dashboard={dashboard} />
    </>
  );
}

function AboutOilSentinel() {
  return (
    <section
      className="cc-about"
      style={{
        margin: "48px -28px -40px",
        padding: "42px 28px 46px",
        background: `linear-gradient(120deg, ${C.navyDeep}, ${C.navy})`,
        borderTop: `4px solid ${C.saffron}`,
        color: "#FFFFFF",
      }}
    >
      <div style={{ maxWidth: 1264, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "28px", alignItems: "start" }}>
          <div>
        <p style={{
          margin: "0 0 8px",
          color: "#F4C982",
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "1.4px",
          textTransform: "uppercase",
        }}>
            SIF Precursor Intelligence Engine
        </p>
        <h2 style={{
          margin: "0 0 10px",
          fontFamily: "'Merriweather', serif",
          fontSize: "24px",
        }}>
          From report analysis to proactive safety action.
        </h2>
        <p style={{
          margin: 0,
          color: "#C7D3DC",
          fontSize: "13px",
          lineHeight: 1.7,
        }}>
          SIF Precursor Intelligence Engine is an AI-powered safety intelligence
          platform designed for OIL Unsafe Act/Unsafe Condition, Near-Miss, and
          Incident reports. It goes beyond identifying SIF and PSIF potential by
          explaining risk, identifying failed barriers, and surfacing the signals
          that need attention first.
        </p>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.18)", paddingLeft: "24px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#FFFFFF", fontSize: "14px" }}>Key capabilities</h3>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#C7D3DC", fontSize: "12.5px", lineHeight: 1.8 }}>
              <li>AI/NLP-based report analysis</li>
              <li>SIF/PSIF precursor identification</li>
              <li>Explainable risk assessment</li>
              <li>Critical barrier failure detection</li>
              <li>Life-Saving Rule mapping</li>
              <li>Historical similar-report discovery</li>
            </ul>
          </div>
          <div style={{ borderLeft: "1px solid rgba(255,255,255,0.18)", paddingLeft: "24px" }}>
            <h3 style={{ margin: "0 0 10px", color: "#FFFFFF", fontSize: "14px" }}>Early warning by design</h3>
            <ul style={{ margin: 0, paddingLeft: "18px", color: "#C7D3DC", fontSize: "12.5px", lineHeight: 1.8 }}>
              <li>Recurring and emerging risk detection</li>
              <li>Site × Hazard risk heatmap</li>
              <li>High-risk site ranking</li>
              <li>Early-warning alerts</li>
              <li>HSE human validation and feedback</li>
            </ul>
            <p style={{ margin: "14px 0 0", color: "#F4C982", fontSize: "12.5px", lineHeight: 1.6 }}>
              <strong>Goal:</strong> Transform safety reports into proactive,
              actionable intelligence that helps HSE teams intervene before
              potential SIF events occur.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const highlightCardStyle = {
  background: "linear-gradient(180deg, rgba(19,22,25,0.98), rgba(10,12,15,0.96))",
  border: `1px solid ${C.line}`,
  borderRadius: "14px",
  padding: "18px",
  boxShadow: "0 24px 36px -30px rgba(242,75,69,0.52)",
};

const highlightHeadingStyle = {
  margin: "0 0 14px",
  color: "#FFFFFF",
  fontFamily: "'Merriweather', serif",
  fontSize: "17px",
};

const highlightRowStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  padding: "9px 0",
  borderBottom: `1px solid ${C.line}`,
  color: "#E7EEF7",
  fontSize: "13px",
};

const emptyTextStyle = {
  margin: 0,
  color: "#C1CCD8",
  fontSize: "12px",
};

function riskColor(level) {
  return level === "HIGH" ? C.redBright : level === "MEDIUM" ? C.yellow : C.greenGood;
}

export default function CommandCenter({ setView, onIngest }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [barriers, setBarriers] = useState([]);
  const [patterns, setPatterns] = useState([]);
  const [evaluationMetrics, setEvaluationMetrics] = useState(null);
  const [focusedSite, setFocusedSite] = useState(null);
  const [similarReports, setSimilarReports] = useState([]);
  const refreshDashboard = async () => {
    await onIngest?.();
    try {
      setDashboard(await getDashboardSummary());
    } catch (refreshError) {
      setError(refreshError.message || "Unable to refresh dashboard data.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const data = await getDashboardSummary();

        if (!cancelled) {
          setDashboard(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.allSettled([getBarrierIntelligence(), getEmergingPatterns(), getEvaluationMetrics()]).then(([barrierResult, patternResult, metricsResult]) => {
      if (!active) return;
      if (barrierResult.status === "fulfilled") setBarriers(barrierResult.value?.barrier_failures || []);
      if (patternResult.status === "fulfilled") setPatterns(patternResult.value?.patterns || []);
      if (metricsResult.status === "fulfilled") setEvaluationMetrics(metricsResult.value);
    });
    return () => { active = false; };
  }, []);

  const highSIFReports = dashboard?.recent_high_sif_reports || [];

  useEffect(() => {
    const report = highSIFReports[0];
    if (!report?.id) {
      setSimilarReports([]);
      return undefined;
    }
    let active = true;
    getSimilarReports(report.id).then((result) => {
      if (active) setSimilarReports(result?.similar_reports || []);
    }).catch(() => {
      if (active) setSimilarReports([]);
    });
    return () => { active = false; };
  }, [highSIFReports[0]?.id]);

  const workspaceTitle = {
    overview: "Safety Intelligence Command Center",
    "analyze-report": "Report Analysis & HSE Validation",
    sites: `Site Risk Intelligence${focusedSite ? ` — ${focusedSite.name}` : ""}`,
    historical: "Historical Intelligence",
    precursors: "Recurring Precursor Intelligence",
    workforce: "Workforce Intelligence",
    models: "Model Performance",
    "hse-review": "HSE Review Queue",
  }[activeTab] || "Safety Intelligence Command Center";

  const renderOverview = activeTab === "overview";
  const siteRiskData = useMemo(() => {
    return oilSites.map((site) => {
      const live = dashboard?.highest_risk_locations?.find((item) => {
        const liveName = item.site.toLowerCase();
        const siteName = site.name.toLowerCase();
        return siteName.includes(liveName) || liveName.includes(siteName);
      });
      const risk = live?.risk ?? site.risk;
      return {
        site: site.name,
        risk,
        level: live?.level || siteRiskLevel(risk),
        reports: live?.reports ?? site.reports,
      };
    }).sort((left, right) => right.risk - left.risk).slice(0, 5);
  }, [dashboard]);

  return (
    <div
      className="cc-root"
      style={{
        minHeight: "100vh",
        width: "100%",
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CommandHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main
        id="overview"
        className="cc-main"
        style={{
          width: "100%",
          maxWidth: "none",
          margin: 0,
          padding: "20px 24px 44px",
          flex: 1,
        }}
      >
        <div className="cc-command-intro">
          <div><p className="cc-panel-kicker">OIL SENTINEL · {activeTab.replaceAll("-", " ").toUpperCase()}</p><h1>{workspaceTitle}</h1><p>Where is the risk · Why is it happening · Who needs to act</p></div>
          <button type="button" className="cc-exit-button" onClick={() => setView({ page: "home" })}>Exit command center <ArrowRight size={14} /></button>
        </div>

        <div key={activeTab} className="cc-workspace-page" role="tabpanel" aria-label={workspaceTitle}>
          {renderOverview && <>
            <IndiaLiveRiskMap dashboard={dashboard} onSiteAnalysis={(site) => { setFocusedSite(site); setActiveTab("sites"); }} />
          </>}
          {activeTab === "analyze-report" && <CommandUpload setView={setView} onIngest={refreshDashboard} />}
          {activeTab === "sites" && <><SiteRiskComparison data={siteRiskData} /><SiteIntelligenceWorkspace dashboard={dashboard} selectedSite={focusedSite} patterns={patterns} /></>}
          {["historical", "precursors", "workforce", "hse-review"].includes(activeTab) && <IntelligenceLayers dashboard={dashboard} barriers={barriers} patterns={patterns} reports={highSIFReports} mode={activeTab} similarReports={similarReports} />}
          {activeTab === "models" && <ModelPerformance metrics={evaluationMetrics} />}
        </div>

        {!renderOverview && <div className="cc-primary-actions">
          <button type="button" onClick={() => setActiveTab("analyze-report")}>Analyze report <ArrowRight size={15} /></button>
          <button type="button" onClick={() => setActiveTab("sites")}>Site intelligence <ArrowRight size={15} /></button>
          <button type="button" onClick={() => setActiveTab("hse-review")}>HSE review <ArrowRight size={15} /></button>
        </div>}
      </main>

      {!renderOverview && <CommandFooter />}
    </div>
  );
}