import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import {
  AlertTriangle,
  FileText,
  ShieldAlert,
  TrendingUp,
  ShieldCheck,
  MapPinned,
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
} from "lucide-react";
import WorkforceIntelligence from "./workforce-intelligence.jsx";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
} from "recharts";
import {
  analyzeReport,
  getBarrierIntelligence,
  getDashboardSummary,
  getEmergingPatterns,
  getSimilarReports,
  ocrImage,
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
    { key: "intelligence", label: "Intelligence" },
    { key: "workforce", label: "Workforce" },
    { key: "analyze-report", label: "Analyze" },
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
            <button className="cc-alert-button" type="button" onClick={() => onTabChange("intelligence")} aria-label="Open HSE review alerts">
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

const ANALYSIS_STEPS = [
  "Extract",
  "Classify",
  "SIF / PSIF",
  "Hazard & exposure",
  "Barrier & LSR",
  "Risk score",
  "Similarity & patterns",
];

function CommandUpload({ onIngest, setView, reports = [] }) {
  const [fileName, setFileName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [activeStep, setActiveStep] = useState(-1);
  const [ocrLineCount, setOcrLineCount] = useState(0);
  const [audioUrl, setAudioUrl] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [isSynthetic, setIsSynthetic] = useState(false);
  const recognitionRef = React.useRef(null);
  const speechBaseRef = React.useRef("");
  const fileRef = React.useRef(null);
  const analyzedReports = reports.filter((report) => report.analysis && !report.isDemo
    && ["analyze_tab", "image_analysis", "csv_upload", "report_api"].includes(report.metadata?.ingestion_source));
  const riskRows = analyzedReports.map((report) => {
    const analysis = report.analysis;
    const extraction = analysis.extracted_data || {};
    const context = analysis.risk_context || extraction.risk_context || {};
    return {
      report,
      analysis,
      extraction,
      context,
      site: report.metadata?.site || report.site || "Unknown site",
    };
  });
  const sifRows = riskRows.filter(({ extraction, analysis }) => {
    const classification = String(extraction.sif_potential || analysis.sif_potential || "").toLowerCase();
    return classification.includes("sif potential") && !classification.includes("non-sif");
  });
  const highestSif = sifRows.sort((left, right) => right.analysis.risk_score - left.analysis.risk_score)[0];
  const precursorRows = riskRows.filter(({ extraction, analysis }) => {
    const classification = String(extraction.sif_potential || analysis.sif_potential || "").toLowerCase();
    const reportType = String(analysis.report_type || extraction.report_type || "").toLowerCase();
    return classification.includes("sif potential") && !classification.includes("non-sif")
      && /near miss|unsafe condition/.test(reportType);
  });
  const highestPsif = [...(precursorRows.length ? precursorRows : sifRows)]
    .sort((left, right) => right.analysis.risk_score - left.analysis.risk_score)[0];
  const highestFatigue = [...oilSites].sort((left, right) => {
    const leftCount = left.workers.veryHigh + left.workers.high;
    const rightCount = right.workers.veryHigh + right.workers.high;
    return rightCount - leftCount;
  })[0];

  React.useEffect(() => () => {
    recognitionRef.current?.stop();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const extractFile = async (file) => {
    if (!file) return;
    setFileName(file.name);
    setCsvFile(null);
    setError("");
    setOcrLineCount(0);
    setStatus("Extracting source text...");
    const extension = file.name.split(".").pop()?.toLowerCase();

    try {
      if (extension === "csv") {
        setCsvFile(file);
        setText(await file.text());
        setStatus("CSV loaded. Import its rows to analyze each report independently.");
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
        let extracted = pages.join("\n\n").trim();
        if (!extracted) {
          const scannedPages = [];
          for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
            const page = await document.getPage(pageNumber);
            const viewport = page.getViewport({ scale: 1.6 });
            const canvas = window.document.createElement("canvas");
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
            const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
            if (!blob) continue;
            const result = await ocrImage(new File([blob], `${file.name}-page-${pageNumber}.png`, { type: "image/png" }));
            scannedPages.push(result.text);
          }
          extracted = scannedPages.join("\n\n").trim();
        }
        if (!extracted) throw new Error("No readable text was found in the PDF.");
        setText(extracted);
      } else if (["xlsx", "xls"].includes(extension)) {
        const XLSX = await import("xlsx");
        const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
        setText(workbook.SheetNames.map((name) => `## ${name}\n${XLSX.utils.sheet_to_csv(workbook.Sheets[name])}`).join("\n\n"));
      } else if (file.type.startsWith("image/")) {
        const result = await ocrImage(file);
        setText(result.text);
        setOcrLineCount(result.text.split(/\r?\n/).filter((line) => line.trim()).length);
        setStatus("OCR text extracted. Review the recognized rows, then analyze the report.");
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
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition is unavailable in this browser. Use Chrome or Edge, allow microphone access, or enter the report text.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.continuous = true;
    recognition.interimResults = true;
    speechBaseRef.current = text.trim();
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((result) => result[0].transcript.trim()).filter(Boolean).join(" ");
      setText([speechBaseRef.current, transcript].filter(Boolean).join("\n"));
    };
    recognition.onerror = (event) => {
      setListening(false);
      setError(event.error === "not-allowed" || event.error === "service-not-allowed"
        ? "Microphone access was denied. Allow microphone access in browser settings and try again."
        : `Speech capture failed (${event.error}). Check microphone access and try again.`);
    };
    recognition.onend = () => {
      setListening(false);
      setStatus("Speech capture ended. Review the transcript before analysis.");
    };
    recognitionRef.current = recognition;
    setError("");
    setListening(true);
    setStatus("Listening. Review the transcript below before analysis.");
    try {
      recognition.start();
    } catch (speechError) {
      setListening(false);
      setError(speechError.message || "Unable to start speech capture.");
    }
  };

  const runAnalysis = async () => {
    if (csvFile) {
      setError("CSV files contain multiple reports. Use Import CSV rows to analyze each row separately.");
      return;
    }
    if (!text.trim()) {
      setError("Extract or enter report text before starting analysis.");
      return;
    }
    setBusy(true);
    setError("");
    setActiveStep(0);
    setStatus("Starting report analysis...");
    const progressTimer = window.setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, ANALYSIS_STEPS.length - 1));
    }, 700);
    try {
      const result = await analyzeReport({ text: text.trim(), is_synthetic: isSynthetic });
      setActiveStep(ANALYSIS_STEPS.length);
      void onIngest?.();
      setText("");
      setFileName("");
      setCsvFile(null);
      setOcrLineCount(0);
      setStatus("Analysis complete. Ready for the next report.");
      setView({ page: "report-detail", reportId: result.report_id });
    } catch (analysisError) {
      setError(analysisError.message || "Analysis failed.");
    } finally {
      window.clearInterval(progressTimer);
      setBusy(false);
    }
  };

  const importCsvBatch = async () => {
    if (!csvFile) return;
    setBusy(true);
    setError("");
    try {
      const result = await uploadReports(csvFile);
      void onIngest?.();
      setView({ page: "report-detail", reportId: result.reports?.[0]?.report_id });
    } catch (importError) {
      setError(importError.message || "CSV batch import failed.");
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
      <div className="cc-analyze-kpi-grid" aria-label="Report-derived analysis KPIs">
        <article><span>ANALYZED REPORTS</span><strong>{analyzedReports.length}</strong><small>Stored reports, including marked synthetic examples</small></article>
        <article><span>HIGHEST SIF SCORE</span><strong>{highestSif ? `${highestSif.analysis.risk_score}/100` : "--"}</strong><small>{highestSif ? `${highestSif.site} · existing base SIF risk` : "No SIF-potential report analyzed"}</small></article>
        <article><span>HIGHEST PSIF SCORE</span><strong>{highestPsif ? `${highestPsif.analysis.risk_score}/100` : "--"}</strong><small>{highestPsif ? `${highestPsif.site} · reuses SIF-potential base risk; no separate PSIF scorer` : "No SIF-potential report analyzed"}</small></article>
        <article><span>WORKFORCE FATIGUE PROFILE</span><strong>{highestFatigue.workers.veryHigh + highestFatigue.workers.high} workers</strong><small>{highestFatigue.name} · fixed representative profile, not live roster data</small></article>
      </div>
      <div className="cc-analysis-grid cc-analysis-grid--intake">
        <div className="cc-analysis-intake">
          <div className="cc-intake-actions">
            <button type="button" onClick={() => fileRef.current?.click()}><FileUp size={16} /> Choose report</button>
            <input ref={fileRef} type="file" accept=".pdf,.csv,.xlsx,.xls,.txt,image/*,audio/*,.wav,.mp3,.m4a,.webm" onChange={(event) => { extractFile(event.target.files?.[0]); event.target.value = ""; }} hidden />
            <button type="button" className={`cc-speech-button ${listening ? "is-listening" : ""}`} onClick={startSpeechCapture}><Mic size={16} /> {listening ? "Stop capture" : "Capture speech"}</button>
          </div>
          {fileName && <div className="cc-file-label">{fileName}</div>}
          {!!ocrLineCount && <div className="cc-file-label">OCR recognized {ocrLineCount} non-empty lines. All extracted text is available below.</div>}
          {audioUrl && <audio controls src={audioUrl} className="cc-audio-player" />}
          <label><input type="checkbox" checked={isSynthetic} onChange={(event) => setIsSynthetic(event.target.checked)} /> Synthetic / demonstration report (CSV uses its is_synthetic column)</label>
          <label className="cc-field-label">EDITABLE EXTRACTED TEXT<textarea rows={9} value={text} onChange={(event) => setText(event.target.value)} placeholder="Extracted PDF, spreadsheet, OCR, or speech text appears here. Edit it before analysis." /></label>
          <div className={`cc-pipeline ${busy ? "is-running" : ""}`} aria-label="Analysis pipeline">
            <div className="cc-pipeline-track"><i style={{ width: `${activeStep < 0 ? 0 : Math.min(100, ((activeStep + 1) / ANALYSIS_STEPS.length) * 100)}%` }} /></div>
            {ANALYSIS_STEPS.map((step, index) => <span key={step} className={index < activeStep ? "complete" : index === activeStep && busy ? "active" : ""}><i>{index < activeStep ? <Check size={12} /> : index + 1}</i><small>{step}</small></span>)}
          </div>
          {busy && <p className="cc-pipeline-current" aria-live="polite">Processing: {ANALYSIS_STEPS[Math.min(activeStep, ANALYSIS_STEPS.length - 1)]}…</p>}
          <button type="button" className="cc-analyze-button" disabled={busy || !text.trim() || Boolean(csvFile)} onClick={runAnalysis}>{busy ? "Analyzing..." : csvFile ? "Import CSV rows below" : "Analyze report"}<ArrowRight size={16} /></button>
          {csvFile && <button type="button" className="cc-csv-import-button" disabled={busy} onClick={importCsvBatch}>Import CSV rows as a batch</button>}
          {status && <p className="cc-status-message">{status}</p>}{error && <p className="cc-error-message">{error}</p>}
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

  const filteredReports = (reports || []).filter((report) => `${report.site} ${report.incident}`.toLowerCase().includes(searchText.toLowerCase()));
  const matchingPatterns = patternRows.length ? patternRows : hazardRows;

  return (
    <section className="cc-intelligence-workspace" aria-label={`${mode} intelligence`}>
      <div className="cc-workspace-heading"><div><p className="cc-panel-kicker">SITE SIGNALS</p><h2>{mode === "intelligence" ? "Site & Precursor Intelligence" : mode === "precursors" ? "Recurring Precursor Intelligence" : mode === "historical" ? "Historical Intelligence" : "HSE Review Queue"}</h2><p>{mode === "historical" ? "Have we seen something like this before?" : mode === "hse-review" ? "HSE personnel remain the final decision-maker." : "Repeated signals, failed controls, and emerging risk."}</p></div></div>
      <div className="cc-intelligence-grid">
        {(mode === "precursors" || mode === "intelligence") && <>
          <article id="precursors" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><Activity size={17} /><div><h3>Recurring Precursor Intelligence</h3><small>Patterns · barrier failure · affected operations</small></div></div>
          {matchingPatterns.length ? matchingPatterns.map((item, index) => <div className="cc-pattern-row" key={item.precursor || item.label || index}><div><strong>{item.precursor || item.label}</strong><small>{item.current_count ?? item.count ?? 0} reports · {item.affected_site_count ?? "unavailable"} sites</small></div><b>{item.percentage_increase == null ? "TRACKING" : `${item.percentage_increase > 0 ? "+" : ""}${item.percentage_increase}%`}</b></div>) : <p className="cc-empty-inline">No recurring precursor patterns returned by the service.</p>}
          <div className="cc-module-foot">Repeated hazards · activities · locations · failed barriers · Life-Saving Rules</div>
          </article>
          <article className="cc-intel-module"><div className="cc-module-title"><ShieldAlert size={17} /><div><h3>Failed Barriers</h3><small>Critical protection gaps</small></div></div>
            {barrierRows.slice(0, 4).map((item, index) => <div className="cc-barrier-row" key={item.barrier_failure || item.label || index}><span>{item.barrier_failure || item.label}</span><b>{item.incident_count ?? item.count ?? 0}</b></div>)}
            {!barrierRows.length && <p className="cc-empty-inline">No barrier failures available yet.</p>}
          </article>
        </>}
        {(mode === "historical" || mode === "intelligence") && <article id="historical" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><History size={17} /><div><h3>Historical Similarity</h3><small>Report similarity · minimum score 0.75</small></div></div>
          <div className="cc-similarity-stat"><strong>{similarReports.length || 0}</strong><span>similar reports found</span></div>
          <div className="cc-similarity-breakdown"><span>{similarReports.filter((item) => item.site === reports?.[0]?.site).length} same site</span><span>{new Set(similarReports.map((item) => item.hazard).filter(Boolean)).size} related hazards</span><span>{barrierRows.length} barrier signals</span></div>
          <input className="cc-search-input" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search recent incidents" aria-label="Search recent incidents" />
          <div className="cc-history-results">{similarReports.map((report) => <div key={report.report_id}><strong>{report.site} · {report.hazard || "Related report"}</strong></div>)}{!similarReports.length && filteredReports.slice(0, 3).map((report) => <div key={report.id}><strong>{report.site}</strong></div>)}{!filteredReports.length && !similarReports.length && <small>No matching reports in the current summary.</small>}</div>
          <div className="cc-module-foot">Previous HSE actions and outcomes are not returned by the current similarity endpoint.</div>
        </article>}
        {(mode === "hse-review" || mode === "intelligence") && <article id="hse-review" className="cc-intel-module cc-intel-module--wide"><div className="cc-module-title"><ClipboardCheck size={17} /><div><h3>Recent HSE Actions</h3><small>Validation queue</small></div></div>
          {(reports || []).slice(0, 4).map((report) => <div className="cc-action-row" key={report.id}><span className="cc-action-dot" /><div><strong>{report.site}</strong><small>{formatIncidentTitle(report.incident)}</small></div><b>REVIEW</b></div>)}
          {!reports?.length && <p className="cc-empty-inline">No recent HSE review actions.</p>}
          <div className="cc-module-foot">Open the Analyze tab to approve, reject, or correct an AI analysis.</div>
        </article>}
      </div>
    </section>
  );
}

function formatIncidentTitle(text) {
  if (!text) return "Safety incident report";

  let clean = String(text).trim();

  // If text starts with or contains raw CSV header line
  if (/^report_id,/i.test(clean) || clean.toLowerCase().includes("report_id,date")) {
    const lines = clean.split(/[\r\n]+/);
    const dataLine = lines.find((l) => l.trim() && !l.toLowerCase().startsWith("report_id")) || lines[1] || lines[0] || "";
    clean = dataLine.trim();
  }

  // If line contains CSV comma separation, extract the actual report_text
  if (clean.includes(",")) {
    const matchQuoted = clean.match(/"([^"]+)"/);
    if (matchQuoted && matchQuoted[1] && matchQuoted[1].length > 8) {
      clean = matchQuoted[1];
    } else {
      const parts = clean.split(",");
      const textPart = parts.find((p) => {
        const val = p.trim();
        return val.length > 12 && !val.includes("-") && !/^\d+$/.test(val) && val.toLowerCase() !== "false" && val.toLowerCase() !== "drilling";
      }) || parts[4] || parts[3] || parts[0];
      clean = textPart ? textPart.replace(/^"+|"+$/g, "").trim() : clean;
    }
  }

  clean = clean.split(/[\r\n]+/)[0].trim();

  if (!clean || clean.length < 3 || clean.toLowerCase() === "false") {
    return "Safety incident report";
  }

  if (clean.length > 65) {
    clean = clean.slice(0, 65).trim() + "…";
  }

  return clean;
}

function SiteIntelligenceWorkspace({ dashboard, selectedSite, onSiteChange, patterns = [], reports = [] }) {
  const liveSites = dashboard?.highest_risk_locations || [];
  const sites = buildMapSites(reports);
  const hazards = dashboard?.top_hazards || [];
  const barriers = dashboard?.barrier_failures || [];
  const preferredSiteName = selectedSite?.name || liveSites[0]?.site;
  const topSite = sites.find((site) => site.name === preferredSiteName)
    || sites.find((site) => site.reportSiteKey && preferredSiteName?.toLowerCase().includes(site.reportSiteKey))
    || sites[0];
  const siteName = topSite?.site || topSite?.name;
  const siteReports = (dashboard?.recent_high_sif_reports || []).filter((report) => report.site === siteName);
  const trend = dashboard?.trends?.[0];
  if (!topSite) return <section className="cc-site-workspace"><h2>Site Risk Intelligence</h2><p>No analyzed site reports are available.</p></section>;

  return (
    <section id="sites" className="cc-site-workspace">
      <div className="cc-workspace-heading">
        <div>
          <p className="cc-panel-kicker">DRILL DOWN · WHY IS IT HAPPENING?</p>
          <h2>Site Risk Intelligence{siteName ? ` — ${siteName}` : ""}</h2>
          <p>Risk context, recurring signals, barriers, and HSE status from analyzed reports.</p>
          {topSite?.isSample && <span className="cc-representative-label">REPRESENTATIVE SITE PROFILE · VERIFY AGAINST LIVE RECORDS</span>}
        </div>
        <label className="cc-site-selector"><MapPinned size={14} /><span>SITE</span><select value={topSite.name} onChange={(event) => {
          const site = sites.find((item) => item.name === event.target.value);
          if (site) onSiteChange?.(site);
        }} aria-label="Choose site for site and precursor intelligence">
          {sites.map((site) => <option key={site.name} value={site.name}>{site.name}</option>)}
        </select></label>
      </div>
      <div className="cc-site-overview-grid">
        <div className="cc-site-overview-score"><span>RISK SCORE</span><strong>{topSite?.risk ?? "--"}<small>/100</small></strong><b>{topSite?.level || (topSite ? siteRiskLevel(topSite.risk) : "AWAITING DATA")}</b></div>
        <div className="cc-site-metric"><span>SIF PRECURSORS</span><strong>{topSite?.sif ?? dashboard?.high_sif_precursors ?? 0}</strong><small>{topSite?.sif != null ? "analyzed site reports" : "network reports"}</small></div>
        <div className="cc-site-metric"><span>HIGH RISK REPORTS</span><strong>{topSite?.psifHigh ?? topSite?.reports ?? 0}</strong><small>{topSite?.psifHigh != null ? "analyzed site reports" : "linked site reports"}</small></div>
        <div className="cc-site-metric"><span>LATEST REPORT</span><strong>{topSite?.lastReviewed || "Pending"}</strong><small>{topSite?.lastReviewed ? "ingestion date, not validation date" : "no report date"}</small></div>
      </div>
      <div className="cc-site-insight-grid">
        <div className="cc-site-insight">
          <h3>Top hazards &amp; activities</h3>
          {hazards.slice(0, 4).map((item, index) => (
            <div className="cc-site-data-row" key={item.label}><span>{index + 1}. {item.label}</span><b>{item.count} reports</b></div>
          ))}
          <p className="cc-site-note">Activity details are available in each report investigation.</p>
        </div>
        <div className="cc-site-insight">
          <h3>Failed / missing barriers</h3>
          {barriers.slice(0, 4).map((item, index) => (
            <div className="cc-site-data-row" key={item.label}><span>{item.label}</span><b>{item.count}</b></div>
          ))}
          <p className="cc-site-note">Barrier intelligence is aggregated across analyzed reports.</p>
        </div>
        <div className="cc-site-insight">
          <h3>Report trend context</h3>
          {trend ? (
            <div className="cc-trend-comparison">
              <div><span>Previous period</span><b>{trend.previous_count}</b></div>
              <i />
              <div><span>Current period</span><b>{trend.current_count}</b></div>
              <strong>{trend.percentage_change == null ? "NO BASELINE" : `${trend.percentage_change > 0 ? "+" : ""}${trend.percentage_change}%`}</strong>
            </div>
          ) : <p className="cc-site-note">No trend data returned.</p>}
          <h4 className="cc-subsection-label" style={{ marginTop: 12 }}>Linked recent SIF reports</h4>
          {siteReports.slice(0, 3).map((report) => (
            <div className="cc-site-data-row" key={report.id}><span>{report.date ? new Date(report.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Recent"} · {formatIncidentTitle(report.incident)}</span><b>{report.score}/100</b></div>
          ))}
          {!siteReports.length && <p className="cc-site-note">No recent report linked to this site in the summary.</p>}
        </div>
        <div className="cc-site-insight">
          <h3>Recurring &amp; emerging risks</h3>
          {patterns.slice(0, 3).map((item, index) => (
            <div className="cc-site-data-row" key={item.precursor || index}><span>{item.precursor}</span><b>{item.current_count ?? 0} reports</b></div>
          ))}
          {!patterns.length && <p className="cc-site-note">No emerging-risk patterns returned.</p>}
        </div>
        <div className="cc-site-insight cc-prevention-card">
          <h3>Preventive recommendations</h3>
          <p>Prioritize verification of critical controls at the highest-risk site.</p>
          <p>Review repeat precursor activity and assign a named HSE owner.</p>
          <p>Validate fatigue indicators before scheduling safety-critical work.</p>
          <span>HSE validation status · Pending</span>
        </div>
      </div>
    </section>
  );
}

export function ModelPerformance({ metrics, status, reports, reportsStatus }) {
  const panels = [
    { key: "report_type_classification", label: "Report Type Classification" },
    { key: "sif_potential_classification", label: "SIF Potential Classification" },
  ];
  return (
    <section id="models" className="cc-model-workspace">
      <div className="cc-workspace-heading"><div><p className="cc-panel-kicker">MODEL PERFORMANCE · EVALUATOR VIEW</p><h2>Classification Performance</h2><p>{metrics ? `${metrics.dataset_info?.total_records || 0} evaluation records · ${metrics.dataset_info?.source || "Evaluation dataset"}` : status === "loading" ? "Loading fixed-dataset evaluation metrics" : "No evaluation metrics returned"}</p></div><BrainCircuit size={22} /></div>
      {status === "error" && <p className="cc-model-empty">Evaluation service is unavailable. Model scores will appear when the service responds.</p>}
      {metrics && <div className="cc-model-grid">{panels.map(({ key, label }) => {
        const result = metrics?.[key];
        const values = result ? [["Accuracy", result.accuracy], ["Precision", result.macro_precision], ["Recall", result.macro_recall], ["F1 Score", result.macro_f1]] : [];
        const classMetrics = result?.per_class_metrics || [];
        const labels = classMetrics.map((item) => item.label);
        return <article className="cc-model-panel" key={key}><div className="cc-model-panel-title"><div><h3>{label}</h3><small>{result ? `${result.total_samples} labeled samples · macro average` : "Loading evaluation data"}</small></div><span>{result?.correct_predictions ?? "--"}<small>correct</small></span></div>
          <div className="cc-model-metrics">{values.map(([name, value]) => <div key={name}><span>{name}</span><b>{typeof value === "number" ? `${(value * 100).toFixed(1)}%` : "--"}</b><i><em style={{ width: `${Math.max(0, Math.min(100, (value || 0) * 100))}%` }} /></i></div>)}<div><span>PR-AUC</span><b>N/A</b><small>Score probabilities are not returned by the evaluator.</small></div></div>
          {!!classMetrics.length && <div className="cc-class-metrics-wrap"><h4>Per-class performance</h4><table className="cc-class-metrics"><thead><tr><th>Class</th><th>Precision</th><th>Recall</th><th>F1</th><th>Samples</th></tr></thead><tbody>{classMetrics.map((item) => <tr key={item.label}><th>{item.label}</th><td>{(item.precision * 100).toFixed(1)}%</td><td>{(item.recall * 100).toFixed(1)}%</td><td>{(item.f1 * 100).toFixed(1)}%</td><td>{item.support}</td></tr>)}</tbody></table></div>}
          {result?.confusion_matrix && <div className="cc-confusion-wrap"><h4>Confusion matrix</h4><table className="cc-confusion-matrix"><thead><tr><th>Actual ↓ / Predicted →</th>{labels.map((label) => <th key={label}>{label}</th>)}</tr></thead><tbody>{labels.map((actual) => <tr key={actual}><th>{actual}</th>{labels.map((predicted) => <td key={predicted}>{result.confusion_matrix[actual]?.[predicted] ?? 0}</td>)}</tr>)}</tbody></table></div>}
        </article>;
      })}</div>}
      <div className="cc-model-reports">
        <div className="cc-model-reports-heading"><div><h3>Stored report analyses (separate from evaluation dataset)</h3><p>Live records returned by the backend report service.</p></div><strong>{reportsStatus === "ready" ? reports.length : "--"}<small>reports</small></strong></div>
        {reportsStatus === "loading" && <p className="cc-model-empty">Loading reports from the backend…</p>}
        {reportsStatus === "error" && <p className="cc-model-empty">Reports could not be loaded from the backend.</p>}
        {reportsStatus === "empty" && <p className="cc-model-empty">No reports have been returned by the backend.</p>}
        {reportsStatus === "ready" && <div className="cc-model-report-table-wrap"><table className="cc-model-report-table"><thead><tr><th>Report</th><th>Site</th><th>Report type</th><th>SIF potential</th><th>Risk</th><th>Status</th></tr></thead><tbody>{reports.map((report) => {
          const analysis = report.analysis;
          const extraction = analysis?.extracted_data || {};
          return <tr key={report.id}><th title={report.id}>{report.id.slice(0, 8)}</th><td>{report.metadata?.site || "Unknown"}</td><td>{analysis?.report_type || extraction.report_type || "Unknown"}</td><td>{analysis?.sif_potential || extraction.sif_potential || "Unknown"}</td><td><b>{analysis?.risk_score ?? "--"}</b>{analysis?.sif_level ? ` · ${analysis.sif_level}` : ""}</td><td>{analysis?.status || "UNANALYZED"}</td></tr>;
        })}</tbody></table></div>}
      </div>
      {status === "loading" && <p className="cc-model-empty">Loading evaluation metrics…</p>}
      {status === "empty" && <p className="cc-model-empty">The evaluator returned no classification results.</p>}
    </section>
  );
}

export const oilSites = [
  { name: "Numaligarh Refinery Limited (NRL)", coordinates: [93.72, 26.65], category: "Refinery & petrochemical", mapX: 520, mapY: 281, risk: 88, sif: 8, psifHigh: 5, fatigue: "HIGH", workers: { veryHigh: 12, high: 24, medium: 38, low: 61 }, lastReviewed: "18 Sep 2026", hazard: "Energy isolation", activity: "Maintenance and hot work", barrier: "Permit verification", reports: 12 },
  { name: "Brahmaputra Cracker and Polymer Limited (BCPL)", coordinates: [94.95, 27.40], category: "Refinery & petrochemical", mapX: 545, mapY: 251, risk: 77, sif: 6, psifHigh: 4, fatigue: "MEDIUM", workers: { veryHigh: 7, high: 19, medium: 42, low: 75 }, lastReviewed: "12 Sep 2026", hazard: "Gas release", activity: "Process operations", barrier: "Gas detection", reports: 8 },
  { name: "Duliajan Liquid Petroleum Gas (LPG) Plant", reportSiteKey: "duliajan", coordinates: [95.32, 27.35], category: "Refinery & petrochemical", mapX: 535, mapY: 256, risk: 72, sif: 5, psifHigh: 3, fatigue: "HIGH", workers: { veryHigh: 9, high: 21, medium: 31, low: 48 }, lastReviewed: "09 Sep 2026", hazard: "Fire and explosion", activity: "LPG transfer", barrier: "Ignition control", reports: 7 },
  { name: "Naharkatiya Oilfield", reportSiteKey: "naharkatiya", coordinates: [95.33, 27.28], category: "Onshore field & production hub", mapX: 530, mapY: 266, risk: 66, sif: 4, psifHigh: 2, fatigue: "MEDIUM", workers: { veryHigh: 5, high: 14, medium: 28, low: 63 }, lastReviewed: "21 Aug 2026", hazard: "Line of fire", activity: "Well servicing", barrier: "Exclusion zone", reports: 6 },
  { name: "Moran Field", reportSiteKey: "moran", coordinates: [94.93, 27.18], category: "Onshore field & production hub", mapX: 520, mapY: 276, risk: 61, sif: 3, psifHigh: 1, fatigue: "LOW", workers: { veryHigh: 3, high: 9, medium: 24, low: 72 }, lastReviewed: "04 Sep 2026", hazard: "Dropped objects", activity: "Drilling operations", barrier: "Lifting plan", reports: 5 },
  { name: "Jorajan Oilfield", coordinates: [95.02, 27.04], category: "Onshore field & production hub", mapX: 535, mapY: 261, risk: 55, sif: 2, psifHigh: 1, fatigue: "MEDIUM", workers: { veryHigh: 4, high: 11, medium: 26, low: 54 }, lastReviewed: "26 Aug 2026", hazard: "Vehicle movement", activity: "Field logistics", barrier: "Journey management", reports: 4 },
  { name: "Kumchai Field", reportSiteKey: "kumchai", coordinates: [95.35, 27.42], category: "Onshore field & production hub", mapX: 545, mapY: 246, risk: 48, sif: 2, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 2, high: 6, medium: 18, low: 49 }, lastReviewed: "30 Aug 2026", hazard: "Pressure release", activity: "Well intervention", barrier: "Isolation verification", reports: 3 },
  { name: "Bhaghewala Field", coordinates: [70.72, 27.00], category: "Onshore field & production hub", mapX: 91, mapY: 260, risk: 45, sif: 1, psifHigh: 0, fatigue: "MEDIUM", workers: { veryHigh: 3, high: 7, medium: 17, low: 38 }, lastReviewed: "15 Aug 2026", hazard: "Manual handling", activity: "Field operations", barrier: "Task risk assessment", reports: 3 },
  { name: "Dandewala Field", coordinates: [70.48, 27.20], category: "Onshore field & production hub", mapX: 116, mapY: 286, risk: 39, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 1, high: 4, medium: 12, low: 43 }, lastReviewed: "02 Sep 2026", hazard: "Vehicle movement", activity: "Site transport", barrier: "Journey management", reports: 2 },
  { name: "Madhuban Central Tank Farm (CTF)", coordinates: [95.30, 27.30], category: "Processing & collection station", mapX: 525, mapY: 271, risk: 71, sif: 4, psifHigh: 2, fatigue: "HIGH", workers: { veryHigh: 8, high: 17, medium: 29, low: 52 }, lastReviewed: "19 Sep 2026", hazard: "Tank overfill", activity: "Tank farm operations", barrier: "Level alarm response", reports: 6 },
  { name: "Tengakhat Oil Collecting Station (OCS)", coordinates: [95.28, 27.40], category: "Processing & collection station", mapX: 515, mapY: 286, risk: 51, sif: 2, psifHigh: 0, fatigue: "MEDIUM", workers: { veryHigh: 2, high: 8, medium: 20, low: 44 }, lastReviewed: "11 Aug 2026", hazard: "Electrical contact", activity: "Equipment maintenance", barrier: "LOTO", reports: 4 },
  { name: "Barekhuri Gas Compressor Station (GCS)", coordinates: [95.12, 27.35], category: "Processing & collection station", mapX: 510, mapY: 296, risk: 42, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 1, high: 5, medium: 16, low: 41 }, lastReviewed: "25 Aug 2026", hazard: "Fall from height", activity: "Inspection", barrier: "Work-at-height control", reports: 2 },
  { name: "Shalmari Early Production System (EPS)", coordinates: [95.30, 27.25], category: "Processing & collection station", mapX: 505, mapY: 306, risk: 33, sif: 1, psifHigh: 0, fatigue: "LOW", workers: { veryHigh: 0, high: 3, medium: 13, low: 37 }, lastReviewed: "05 Sep 2026", hazard: "Pressure release", activity: "Well operations", barrier: "Pressure testing", reports: 1 },
];

const siteRiskLevel = (score) => score >= 80 ? "HIGH" : score >= 40 ? "MEDIUM" : "LOW";

function normalizeSiteKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/\b(limited|oilfield|oil|field|refinery|terminal|plant|station|site)\b/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function buildMapSites(reports = []) {
  const groups = new Map();
  reports.filter((report) => report.analysis && !report.isDemo).forEach((report) => {
    const name = report.metadata?.site || report.site;
    if (!name || name === "Unknown") return;
    const siteKey = normalizeSiteKey(name);
    const knownSite = oilSites.find((site) => {
      const knownKey = normalizeSiteKey(site.name);
      return siteKey && knownKey && (knownKey.includes(siteKey) || siteKey.includes(knownKey));
    });
    const groupKey = knownSite?.name || name;
    if (!groups.has(groupKey)) groups.set(groupKey, { name: groupKey, knownSite, reports: [] });
    groups.get(groupKey).reports.push(report);
  });

  const makeProfile = ({ name, knownSite, reports: siteReports }) => {
    const latest = [...siteReports].sort((left, right) => new Date(right.created_at) - new Date(left.created_at))[0];
    const hazardCounts = new Map();
    siteReports.forEach((report) => {
      const hazard = report.analysis.extracted_data?.hazard;
      if (hazard) hazardCounts.set(hazard, (hazardCounts.get(hazard) || 0) + 1);
    });
    const topHazard = [...hazardCounts.entries()].sort((left, right) => right[1] - left[1])[0]?.[0];
    const reportRisk = siteReports.map((report) => report.analysis.risk_score).filter(Number.isFinite);
    const contextualRisk = reportRisk.length
      ? Math.round(reportRisk.reduce((sum, score) => sum + score, 0) / reportRisk.length)
      : 0;
    const psifHigh = siteReports.filter((report) => report.analysis.sif_level === "HIGH").length;
    return {
      ...(knownSite || {}),
      name,
      category: knownSite?.category || "Reported site · location not geocoded",
      coordinates: knownSite?.coordinates || [76 + (Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 1200) / 100, 17 + (name.length * 37 % 1200) / 100],
      risk: contextualRisk,
      sif: siteReports.filter((report) => {
        const value = String(report.analysis.extracted_data?.sif_potential || report.analysis.sif_potential || "").toLowerCase();
        return value.includes("sif potential") && !value.includes("non-sif");
      }).length,
      psifHigh,
      reports: siteReports.length,
      fatigue: knownSite?.fatigue || "MEDIUM",
      workers: knownSite?.workers || { veryHigh: 3, high: 8, medium: 21, low: 46 },
      hazard: topHazard || knownSite?.hazard || "No hazard reported",
      activity: latest?.analysis.extracted_data?.activity || knownSite?.activity || "No activity reported",
      barrier: latest?.analysis.extracted_data?.barrier_failure || knownSite?.barrier || "No barrier reported",
      lastReviewed: latest?.created_at ? new Date(latest.created_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : knownSite?.lastReviewed || "No analyzed reports",
      isSample: false,
      locationIsApproximate: !knownSite,
    };
  };

  return [...groups.values()].map(makeProfile).sort((left, right) => right.risk - left.risk);
}

const riskMarkerColor = (level) => level === "HIGH" ? "#F24B45" : level === "MEDIUM" ? "#F4C95D" : "#2FCF88";
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || "pk.eyJ1Ijoic2hyZXlhYTA4MDciLCJhIjoiY211bXhjcGR3MDFqeDJ5czh5cGpmYTE3YyJ9.8VS06ZvvreFKLnmONcX8lA";

function siteCoordinates(site) {
  return site.coordinates;
}

function MapboxOperationsMap({ sites, selectedSite, onSelectSite }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const workerMarkersRef = useRef([]);
  const is3dRef = useRef(false);
  const sitesRef = useRef(sites);
  const selectedSiteRef = useRef(selectedSite);
  const onSelectSiteRef = useRef(onSelectSite);
  const [is3d, setIs3d] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    sitesRef.current = sites;
    selectedSiteRef.current = selectedSite;
    onSelectSiteRef.current = onSelectSite;
  }, [onSelectSite, selectedSite, sites]);

  useEffect(() => {
    if (!mapContainerRef.current || !MAPBOX_TOKEN) return undefined;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/navigation-night-v1",
      center: [82, 24],
      zoom: 4.25,
      minZoom: 3.4,
      maxZoom: 16,
      attributionControl: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true }), "top-right");
    map.on("error", (event) => {
      const message = event.error?.message || "Mapbox could not load the map tiles.";
      if (!message.toLowerCase().includes("styleimagemissing")) setMapError(message);
    });

    map.on("load", () => {
      map.setLight({ anchor: "viewport", color: "#b9dcff", intensity: 0.38, position: [1.5, 180, 80] });
      const firstSymbolLayer = map.getStyle().layers.find((layer) => layer.type === "symbol")?.id;
      map.addLayer({ id: "night-3d-buildings", source: "composite", "source-layer": "building", filter: ["==", "extrude", "true"], type: "fill-extrusion", minzoom: 10.5, paint: { "fill-extrusion-color": "#173b4a", "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 10.5, 0, 16, ["get", "height"]], "fill-extrusion-base": ["get", "min_height"], "fill-extrusion-opacity": 0.84, "fill-extrusion-vertical-gradient": true } }, firstSymbolLayer);
      const update3dMode = () => {
        const nextIs3d = map.getZoom() >= 10.5;
        if (nextIs3d === is3dRef.current) return;
        is3dRef.current = nextIs3d;
        setIs3d(nextIs3d);
        map.easeTo({ pitch: nextIs3d ? 52 : 0, bearing: nextIs3d ? 18 : 0, duration: 800, essential: true });
      };
      map.on("zoom", update3dMode);
      const features = sitesRef.current.map((site) => ({
        type: "Feature",
        properties: { name: site.name, level: siteRiskLevel(site.risk), selected: site.name === selectedSiteRef.current.name, fatigue: site.fatigue },
        geometry: { type: "Point", coordinates: siteCoordinates(site) },
      }));
      map.addSource("oil-sites", { type: "geojson", data: { type: "FeatureCollection", features } });
      map.addLayer({ id: "site-glow", type: "circle", source: "oil-sites", paint: { "circle-radius": 15, "circle-color": ["match", ["get", "level"], "HIGH", "#F24B45", "MEDIUM", "#F4C95D", "#2FCF88"], "circle-opacity": 0.2, "circle-blur": 0.8 } });
      map.addLayer({ id: "site-points", type: "circle", source: "oil-sites", paint: { "circle-radius": 6, "circle-color": ["match", ["get", "level"], "HIGH", "#F24B45", "MEDIUM", "#F4C95D", "#2FCF88"], "circle-stroke-color": "#fff4da", "circle-stroke-width": 1.5 } });
      map.addLayer({ id: "selected-site-ring", type: "circle", source: "oil-sites", filter: ["==", ["get", "selected"], true], paint: { "circle-radius": 12, "circle-color": "rgba(0,0,0,0)", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5, "circle-opacity": 0.9 } });
      workerMarkersRef.current = sitesRef.current.map((site) => {
        const markerElement = document.createElement("button");
        markerElement.type = "button";
        markerElement.className = `cc-mapbox-worker-marker cc-mapbox-worker-marker--${site.fatigue.toLowerCase().replace(" ", "-")}`;
        markerElement.setAttribute("aria-label", `Worker fatigue at ${site.name}: ${site.fatigue}`);
        markerElement.title = `${site.name} · ${site.fatigue} fatigue signal`;
        markerElement.innerHTML = "<span aria-hidden=\"true\">⛑</span>";
        markerElement.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectSiteRef.current(site);
        });
        return new mapboxgl.Marker({ element: markerElement, anchor: "center", offset: [18, -18] }).setLngLat(siteCoordinates(site)).addTo(map);
      });
      map.on("click", "site-points", (event) => {
        const name = event.features?.[0]?.properties?.name;
        const site = sitesRef.current.find((item) => item.name === name);
        if (site) onSelectSiteRef.current(site);
      });
      map.on("mouseenter", "site-points", () => { map.getCanvas().style.cursor = "pointer"; });
      map.on("mouseleave", "site-points", () => { map.getCanvas().style.cursor = ""; });
    });

    return () => {
      workerMarkersRef.current.forEach((marker) => marker.remove());
      workerMarkersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.isStyleLoaded() || !map.getSource("oil-sites")) return;
    const features = sites.map((site) => ({ type: "Feature", properties: { name: site.name, level: siteRiskLevel(site.risk), selected: site.name === selectedSite.name, fatigue: site.fatigue }, geometry: { type: "Point", coordinates: siteCoordinates(site) } }));
    map.getSource("oil-sites").setData({ type: "FeatureCollection", features });
    map.flyTo({ center: siteCoordinates(selectedSite), zoom: Math.max(map.getZoom(), 5.4), duration: 700, essential: true });
  }, [selectedSite, sites]);

  return <div className="cc-mapbox-shell" role="group" aria-label="Mapbox India live risk map">
    <div ref={mapContainerRef} className="cc-mapbox-canvas" />
    {mapError && <div className="cc-mapbox-error" role="status">Mapbox map error: {mapError}</div>}
    <div className={`cc-mapbox-badge ${is3d ? "cc-mapbox-badge--3d" : ""}`} aria-live="polite"><span /> MAPBOX · NIGHT OPERATIONS{is3d ? " · 3D VIEW" : ""}</div>
    <div className="cc-map-legend cc-mapbox-legend"><span><i style={{ background: C.redBright }} /> High risk</span><span><i style={{ background: C.yellow }} /> Medium risk</span><span><i style={{ background: C.greenGood }} /> Low risk</span><span><HardHat size={13} /> Worker helmet</span></div>
  </div>;
}

export function IndiaLiveRiskMap({ dashboard = null, reports = [], onSiteAnalysis }) {
  const [selectedSiteName, setSelectedSiteName] = useState(oilSites[0].name);
  const sites = useMemo(() => buildMapSites(reports), [reports]);
  const selectedSite = sites.find((site) => site.name === selectedSiteName) || sites[0];
  if (!selectedSite) return <section className="cc-map-workspace"><h2>Site risk map</h2><p>No analyzed site reports are available. Loading failures are shown above; no sample risks are substituted.</p></section>;

  return (
    <section id="live-risk" className="cc-map-workspace">
      <div className="cc-map-titlebar">
        <div>
          <p className="cc-panel-kicker">OPERATIONS · LIVE SIGNALS</p>
          <h2>India Live Risk Map</h2>
          <p>Report-derived site risk · representative workforce profiles · new-site markers are approximate until geocoded</p>
        </div>
        <div className="cc-map-title-actions">
          <label className="cc-site-selector"><MapPinned size={14} /><span>SITE</span><select value={selectedSite.name} onChange={(event) => setSelectedSiteName(event.target.value)} aria-label="Select an operations site">
            {sites.map((site) => <option key={site.name} value={site.name}>{site.name}</option>)}
          </select></label>
          <div className="cc-map-live"><span /> SITE RISK OVERVIEW</div>
        </div>
      </div>

      <div className="cc-map-layout">
      <MapboxOperationsMap sites={sites} selectedSite={selectedSite} onSelectSite={(site) => setSelectedSiteName(site.name)} />
      <aside className="cc-selected-site" aria-live="polite" aria-label={`${selectedSite.name} intelligence`}>
        <div className="cc-selected-site-heading">
          <div><p className="cc-panel-kicker">{selectedSite.category} · {siteRiskLevel(selectedSite.risk)} RISK</p><h3>{selectedSite.name}</h3></div>
          <span className={`cc-risk-stamp cc-risk-stamp--${siteRiskLevel(selectedSite.risk).toLowerCase()}`}>{selectedSite.risk}<small>/100</small></span>
        </div>
        <div className="cc-selected-site-stats">
          <div><span>SIF PRECURSORS</span><strong>{selectedSite.sif}</strong></div>
          <div><span>HIGH RISK REPORTS</span><strong>{selectedSite.psifHigh}</strong></div>
          <div><span>LINKED REPORTS</span><strong>{selectedSite.reports}</strong></div>
        </div>
        <div className="cc-site-risk-track"><span>COMPOSITE RISK</span><i><b className={`cc-ranking-fill--${siteRiskLevel(selectedSite.risk).toLowerCase()}`} style={{ width: `${selectedSite.risk}%` }} /></i></div>
        <div className="cc-selected-site-facts">
          <div><span>TOP HAZARD</span><strong>{selectedSite.hazard}</strong></div>
          <div><span>LATEST REPORT</span><strong>{selectedSite.lastReviewed}</strong></div>
          <div><span>CRITICAL BARRIER</span><strong>{selectedSite.barrier}</strong></div>
          <div><span>PRIMARY ACTIVITY</span><strong>{selectedSite.activity}</strong></div>
        </div>
        <div className="cc-worker-breakdown">
          <div className="cc-worker-breakdown-head"><strong>Worker concentration</strong><span>FATIGUE SIGNALS</span></div>
          {[ ["Very high", "veryHigh", "very-high"], ["High", "high", "high"], ["Medium", "medium", "medium"], ["Low", "low", "low"] ].map(([label, key, tone]) => (
            <div className="cc-worker-breakdown-row" key={key}><span><i className={`cc-fatigue-dot cc-fatigue-dot--${tone}`} />{label}</span><b>{selectedSite.workers[key]}</b><small>workers</small></div>
          ))}
          <p>Fixed representative workforce profile · replace with validated roster data when available.</p>
        </div>
        <button type="button" className="cc-site-analysis-button" onClick={() => onSiteAnalysis?.(selectedSite)}>View full site analysis <ArrowRight size={15} /></button>
      </aside>
      </div>
    </section>
  );
}

function OperationalTrendChart({ reports = [] }) {
  const [days, setDays] = useState(15);
  const [selectedSite, setSelectedSite] = useState("All sites");
  const siteOptions = [...new Set(reports
    .filter((report) => report.analysis && !report.isDemo)
    .map((report) => report.metadata?.site || report.site)
    .filter((site) => site && site !== "Unknown"))].sort();
  const chartData = useMemo(() => {
    const today = new Date();
    const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const rows = Array.from({ length: days }, (_, index) => {
      const date = new Date(endDate);
      date.setDate(endDate.getDate() - days + index + 1);
      return {
        dateKey: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`,
        day: date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        analyzed: 0,
        highSif: 0,
      };
    });
    const rowsByDate = new Map(rows.map((row) => [row.dateKey, row]));

    reports.forEach((report) => {
      if (!report.analysis || report.isDemo) return;
      const reportSite = report.metadata?.site || report.site || "Unknown";
      if (selectedSite !== "All sites" && reportSite !== selectedSite) return;
      const date = new Date(report.created_at || report.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const row = rowsByDate.get(key);
      if (!row) return;
      row.analyzed += 1;
      if (report.analysis.sif_level === "HIGH") row.highSif += 1;
    });

    return rows;
  }, [days, reports, selectedSite]);
  const hasTrendData = chartData.some((row) => row.analyzed > 0);

  return (
    <section className="cc-panel" style={{ marginTop: 28, background: C.card, border: `1px solid ${C.line}`, borderRadius: 8, padding: 22 }}>
      <div className="cc-panel-head" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: 16 }}>
        <div><p className="cc-panel-kicker">REPORT ACTIVITY · {selectedSite.toUpperCase()}</p><h2 style={{ margin: 0, color: C.ink, fontSize: 20 }}>SIF trends · past {days} days</h2></div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <select value={selectedSite} onChange={(event) => setSelectedSite(event.target.value)} aria-label="Site for SIF trend" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 4, padding: "8px 10px", maxWidth: 240 }}>
            <option value="All sites">All sites</option>
            {siteOptions.map((site) => <option key={site} value={site}>{site}</option>)}
          </select>
          <select value={days} onChange={(event) => setDays(Number(event.target.value))} aria-label="Trend date range" style={{ background: C.paper, color: C.ink, border: `1px solid ${C.line}`, borderRadius: 4, padding: "8px 10px" }}>
            <option value={15}>Past 15 days</option>
            <option value={30}>Past 30 days</option>
          </select>
        </div>
      </div>
      {hasTrendData ? <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 18, left: -12, bottom: 0 }}>
            <CartesianGrid stroke={C.line} vertical={false} />
            <XAxis dataKey="day" interval="preserveStartEnd" tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={{ stroke: C.line }} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: C.inkSoft }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: C.card, border: `1px solid ${C.line}`, color: C.ink }} />
            <Legend />
            <Line type="monotone" dataKey="analyzed" name="Analyzed reports" stroke={C.saffron} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="highSif" name="High SIF" stroke={C.redBright} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div> : <p style={emptyTextStyle}>No analyzed reports in the past {days} days.</p>}
    </section>
  );
}

function LiveHighlights({ dashboard, reports = [], onSiteAnalysis }) {
  // dashboard can be null while loading or if the API request fails
  const data = dashboard || {};
  const topHazards = data.top_hazards || [];

  const trend = data.trends?.[0];
  const hasTrend = trend?.percentage_change != null && trend?.current_count != null && trend?.previous_count != null;
  const trendPct = hasTrend ? Math.abs(trend.percentage_change) : null;
  const trendDir = !hasTrend || trend.percentage_change === 0 ? "remained level" : trend.percentage_change < 0 ? "decreased" : "increased";
  const trendLabel = trend?.label || topHazards[0]?.label;
  const currentCount = trend?.current_count;
  const previousCount = trend?.previous_count;

  return (
    <>
      <section className="cc-highlight-grid">
        <div className="cc-highlight-card cc-highlight-card--hazard">
          <p className="cc-panel-kicker">SAFETY PRECURSORS</p>
          <h2>Top hazards</h2>
          {topHazards.length ? (
            topHazards.slice(0, 4).map((item, index) => (
              <div key={item.label} className="cc-highlight-item">
                <span className="cc-highlight-rank">0{index + 1}</span>
                <span className="cc-highlight-label">{item.label}</span>
                <span className="cc-highlight-count">{item.count} reports</span>
              </div>
            ))
          ) : (
            <p className="cc-empty-inline">No hazard data for today.</p>
          )}
          {!!data.barrier_failures?.length && (
            <div style={{ marginTop: 14, paddingTop: 10, borderTop: `1px solid ${C.line}` }}>
              <p className="cc-panel-kicker" style={{ fontSize: 9, marginBottom: 8 }}>MOST FAILED BARRIERS</p>
              {data.barrier_failures.slice(0, 2).map((item) => (
                <div key={item.label} className="cc-highlight-item">
                  <span className="cc-highlight-label" style={{ fontSize: 12 }}>{item.label}</span>
                  <span className="cc-highlight-count">{item.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cc-highlight-card cc-highlight-card--trends">
          <p className="cc-panel-kicker">15-DAY SIGNAL ANALYSIS</p>
          <h2>Escalating trend</h2>
          {hasTrend ? <>
            <div className="cc-trend-highlight-box">
              <div className="cc-trend-big-badge">
                <TrendingUp size={24} color={trend.percentage_change < 0 ? C.greenGood : C.redBright} />
                {trend.percentage_change > 0 ? "+" : trend.percentage_change < 0 ? "−" : ""}{trendPct}%
              </div>
              <div>
                <div style={{ color: "#FFF", fontWeight: 700, fontSize: 14 }}>{trendLabel || "Precursor reports"}</div>
                <div style={{ color: C.inkSoft, fontSize: 11 }}>15-day report comparison</div>
              </div>
            </div>
            <p className="cc-trend-subtext">
              In the past 15 days, <strong>{trendLabel || "Precursor"}</strong> precursor reports {trendDir} by <strong>{trendPct}%</strong> across active operations ({currentCount} reports vs {previousCount} in the previous period).
            </p>
          </> : <p className="cc-trend-subtext">Not enough recent analyzed reports to calculate a 15-day precursor trend.</p>}
        </div>
      </section>

      <IndiaLiveRiskMap dashboard={dashboard} reports={reports} onSiteAnalysis={onSiteAnalysis} />
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

export default function CommandCenter({ setView, onIngest, reports = [], resultsData, reportsStatus, reportsError }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [barriers, setBarriers] = useState([]);
  const [patterns, setPatterns] = useState([]);
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
    Promise.allSettled([getBarrierIntelligence(), getEmergingPatterns()]).then(([barrierResult, patternResult]) => {
      if (!active) return;
      if (barrierResult.status === "fulfilled") setBarriers(barrierResult.value?.barrier_failures || []);
      else setError("Barrier intelligence could not be loaded. Retry or reopen this page.");
      if (patternResult.status === "fulfilled") setPatterns(patternResult.value?.patterns || []);
      else setError("Emerging patterns could not be loaded. Retry or reopen this page.");
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
    intelligence: "Site & Precursor Intelligence",
    workforce: "Workforce Fatigue Intelligence",
  }[activeTab] || "Safety Intelligence Command Center";

  const renderOverview = activeTab === "overview";
  const siteRiskData = useMemo(() => buildMapSites(reports).slice(0, 5).map((site) => ({
    site: site.name, risk: site.risk, level: siteRiskLevel(site.risk), reports: site.reports,
  })), [reports]);

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
        <div className={`cc-command-intro ${renderOverview ? "cc-command-intro--operations" : ""}`}>
          {!renderOverview && activeTab !== "workforce" && <div><p className="cc-panel-kicker">OIL SENTINEL · {activeTab.replaceAll("-", " ").toUpperCase()}</p><h1>{workspaceTitle}</h1><p>Where is the risk · Why is it happening · Who needs to act</p></div>}
          <button type="button" className="cc-exit-button" onClick={() => setView({ page: "dashboard" })}>Oil Safety Results <ArrowRight size={14} /></button>
          <button type="button" className="cc-exit-button" onClick={() => setView({ page: "home" })}>Exit command center <ArrowRight size={14} /></button>
        </div>

        {reportsStatus === "loading" && <p role="status">Loading stored reports…</p>}
        {reportsError && <p role="alert">Report list unavailable: {reportsError} <button onClick={refreshDashboard}>Retry loading reports</button></p>}
        {error && <p role="alert">{error}</p>}
        <p className="cc-site-note">Risk and report counts use stored reports, including marked synthetic examples. Trends use ingestion dates. Workforce remains a labeled demonstration.</p>
        <div key={activeTab} className="cc-workspace-page" role="tabpanel" aria-label={workspaceTitle}>
          {renderOverview && <>
            <LiveHighlights dashboard={dashboard} reports={reports} onSiteAnalysis={(site) => { setFocusedSite(site); setActiveTab("intelligence"); }} />
            <OperationalTrendChart reports={reports} />
            <SiteRiskComparison data={siteRiskData} />
          </>}
          {activeTab === "analyze-report" && <CommandUpload setView={setView} onIngest={refreshDashboard} reports={reports} />}
          {activeTab === "intelligence" && <>
            <SiteIntelligenceWorkspace dashboard={dashboard} selectedSite={focusedSite} onSiteChange={setFocusedSite} patterns={patterns} reports={reports} />
            <IntelligenceLayers dashboard={dashboard} barriers={barriers} patterns={patterns} reports={highSIFReports} mode="intelligence" similarReports={similarReports} />
          </>}
          {activeTab === "workforce" && <WorkforceIntelligence onBack={() => setActiveTab("overview")} />}
        </div>

        {!renderOverview && activeTab !== "workforce" && <div className="cc-primary-actions">
          <button type="button" onClick={() => setActiveTab("analyze-report")}>Analyze report <ArrowRight size={15} /></button>
          <button type="button" onClick={() => setActiveTab("intelligence")}>Site intelligence <ArrowRight size={15} /></button>
          <button type="button" onClick={() => setActiveTab("intelligence")}>HSE review <ArrowRight size={15} /></button>
        </div>}
      </main>

      {!renderOverview && activeTab !== "workforce" && <CommandFooter />}
    </div>
  );
}