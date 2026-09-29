import React, { useEffect, useMemo, useState } from "react";
import {
  FileText,
  ShieldAlert,
  TrendingUp,
  ShieldCheck,
  MapPinned,
  RadioTower,
  Gauge,
  ArrowRight,
  Check,
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
import { IMG, UploadWidget } from "./oil-safety-portal.jsx";
import { getDashboardSummary } from "../src/api.js";
import featureImage1 from "./img&vid/img1.png";
import featureImage2 from "./img&vid/img2.png";
import featureImage3 from "./img&vid/img3.png";
import featureImage4 from "./img&vid/img4.png";
import mapImage from "./img&vid/map.jpg";
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
    { key: "overview", label: "Overview" },
    { key: "live-risk", label: "Live Risk" },
    { key: "trends", label: "Trends" },
    { key: "reports", label: "Reports" },
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
              <h2 className="cc-brand-title">Oil Safety Intelligence Portal</h2>
            </div>
          </div>

          <div className="cc-header-meta">
            <div className="cc-header-stat">Directorate General of</div>
            <div className="cc-header-stat">Mines &amp; Process Safety</div>
          </div>
        </div>

        <div className="cc-nav-bar">
          {navItems.map((item) => (
            <button
              key={item.key}
              type="button"
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
      className="cc-kpi"
      style={{
        background: "linear-gradient(180deg, rgba(23,26,31,0.98), rgba(11,13,17,0.96))",
        border: `1px solid ${C.line}`,
        borderRadius: "12px",
        padding: "20px",
        boxShadow: "0 24px 34px -26px rgba(242,75,69,0.55)",
        borderTop: `4px solid ${isHighSIF
            ? C.redBright
            : isPattern
              ? C.orange
              : C.saffron
          }`,
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
          fontSize: label === "Most Failed Barrier" ? "21px" : "30px",
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
    <section
      id="trends"
      className="cc-panel cc-chart-panel"
      style={{
        marginTop: "28px",
        background: "linear-gradient(180deg, rgba(18,21,25,0.98), rgba(8,10,13,0.96))",
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
          Site-wise SIF / PSIF Risk Ranking
        </h2>

        <p
          style={{
            margin: "6px 0 0",
            fontSize: "12px",
            color: "#C7D3DC",
            fontFamily: "'Inter', sans-serif",
          }}
        >
          Composite ranking by site risk with LOW, MEDIUM and HIGH bands from both SIF and PSIF signal intensity
        </p>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
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
              dataKey="site"
              width={145}
              tick={{
                fontSize: 12,
                fill: C.ink,
                fontWeight: 600,
                fontFamily: "'Inter', sans-serif",
              }}
              axisLine={false}
              tickLine={false}
            />

            <Tooltip
              cursor={{ fill: "rgba(10,42,67,0.04)" }}
              contentStyle={{
                background: C.card,
                border: `1px solid ${C.line}`,
                borderRadius: "6px",
                boxShadow: "0 2px 8px rgba(10,42,67,0.10)",
                fontFamily: "'Inter', sans-serif",
                fontSize: "12px",
                color: C.ink,
              }}
              formatter={(value, name, props) => [`${value} / 100`, `${props.payload.site} composite risk`]}
            />

            <Bar
              dataKey="risk"
              radius={[0, 4, 4, 0]}
              barSize={26}
              animationDuration={1200}
              animationEasing="ease-out"
              isAnimationActive
            >
              {data.map((entry, index) => {
                const barColor =
                  entry.level === "HIGH"
                    ? C.redBright
                    : entry.level === "MEDIUM"
                      ? "#F4C430"
                      : C.greenGood;

                return <Cell key={`cell-${index}`} fill={barColor} />;
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "24px",
          marginTop: "8px",
          fontSize: "11px",
          color: C.inkSoft,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#C62828" }} />
          High Risk
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#F4C430" }} />
          Medium Risk
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: "#2E8B57" }} />
          Low Risk
        </div>
      </div>
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

function CommandUpload({ setView, onIngest }) {
  const handleUploadDone = async () => {
    await onIngest?.();
    setView({ page: "dashboard" });
  };

  return (
    <section className="cc-upload" style={{
      marginBottom: "28px",
      background: `linear-gradient(120deg, rgba(15,17,19,0.94), rgba(59,8,6,0.82)), url(${featureImage1})`,
      backgroundSize: "cover", backgroundPosition: "center",
      border: `1px solid rgba(255,255,255,0.08)`, borderRadius: "18px",
      padding: "20px 22px",
      boxShadow: "0 24px 36px -28px rgba(255,80,58,0.66)",
    }}>
      <div className="cc-upload-head">
        <div className="cc-upload-accent" />
        <div>
          <p className="cc-panel-kicker">REPORT INTAKE</p>
          <h2>Upload Incident Report</h2>
          <p>Submit a new incident report for SIF intelligence analysis</p>
        </div>
      </div>
      <div className="cc-upload-widget-wrap">
        <UploadWidget compact accept=".csv,.pdf,image/*" onIngest={handleUploadDone} />
      </div>
    </section>
  );
}

function FactoryHotspotMap({ hotspots = [], dashboard = null }) {
  const [selectedHotspot, setSelectedHotspot] = useState(null);
  const [resolvedIds, setResolvedIds] = useState([]);

  const visibleHotspots = useMemo(
    () => (hotspots || []).filter((item) => !resolvedIds.includes(item.id)),
    [hotspots, resolvedIds],
  );

  useEffect(() => {
    if (visibleHotspots.length && !selectedHotspot) {
      setSelectedHotspot(visibleHotspots[0]);
    }
    if (!visibleHotspots.length) {
      setSelectedHotspot(null);
    }
  }, [visibleHotspots, selectedHotspot]);

  const handleResolve = () => {
    if (!selectedHotspot) return;
    setResolvedIds((prev) => [...prev, selectedHotspot.id]);
    setSelectedHotspot(null);
  };

  return (
    <section id="live-risk" className="cc-panel cc-map-panel">
      <div className="cc-panel-head cc-panel-head-split">
        <div>
          <p className="cc-panel-kicker">LIVE SITE MAP</p>
          <h2>Interactive Factory Site Map with Live Hotspots</h2>
        </div>
        <div className="cc-panel-chip">{visibleHotspots.length} active hotspots</div>
      </div>

      <div className="cc-map-layout">
        <div
          className="cc-map-surface"
          style={{
            backgroundImage: `linear-gradient(180deg, rgba(8,12,18,0.22), rgba(8,12,18,0.82)), url(${mapImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "saturate(1.2) contrast(1.12)",
          }}
        >
          <div className="cc-map-grid" />
          {visibleHotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              type="button"
              className={`cc-hotspot ${selectedHotspot?.id === hotspot.id ? "selected" : ""}`}
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              onClick={() => setSelectedHotspot(hotspot)}
              aria-label={`${hotspot.site} hotspot`}
            >
              <span className="cc-hotspot-ring" />
              <span className="cc-hotspot-dot" />
              <span className="cc-hotspot-label">{hotspot.site}</span>
            </button>
          ))}
        </div>

        <div className="cc-map-sidecard">
          {selectedHotspot ? (
            <>
              <div className="cc-map-sideheader">
                <div className="cc-map-status">{selectedHotspot.level}</div>
                <span className="cc-map-site">{selectedHotspot.site}</span>
              </div>

              <p className="cc-map-summary">{selectedHotspot.summary}</p>

              <ul className="cc-map-list">
                <li><span>Hazard</span><strong>{selectedHotspot.hazard}</strong></li>
                <li><span>Barrier failure</span><strong>{selectedHotspot.barrier}</strong></li>
                <li><span>Historical reports</span><strong>{selectedHotspot.count} linked entries</strong></li>
              </ul>

              <button type="button" className="cc-solve-button" onClick={handleResolve}>
                <Check size={16} /> Resolve / Problem Solved
              </button>
            </>
          ) : (
            <div className="cc-map-empty">
              <MapPinned size={22} />
              <h3>No active hotspots</h3>
              <p>Resolved hazards have been cleared from the live command view.</p>
            </div>
          )}
        </div>
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

      <FactoryHotspotMap hotspots={hotspotData} dashboard={dashboard} />
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

  useEffect(() => {
    let cancelled = false;

    const handleHeaderJump = (tab) => {
      const targetMap = {
        overview: "overview",
        "live-risk": "live-risk",
        trends: "trends",
        reports: "reports",
      };

      const target = document.getElementById(targetMap[tab]);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    };

    handleHeaderJump(activeTab);

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
  }, [activeTab]);

  const severity = Object.fromEntries(
    (dashboard?.sif_breakdown || []).map((item) => [item.label, item.count]),
  );
  const todayLabel = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // KPI cards always render; they show 0 until dashboard data loads
  const kpiData = [
    { label: "Total Reports Today", value: (dashboard?.total_reports ?? 0).toLocaleString(), subtext: `${dashboard?.period_label || todayLabel} · uploaded files`, icon: FileText },
    { label: "High SIF", value: (severity.HIGH || 0).toLocaleString(), subtext: "Today's high-risk precursors", icon: ShieldAlert },
    { label: "Medium SIF", value: (severity.MEDIUM || 0).toLocaleString(), subtext: "Today's medium-risk precursors", icon: TrendingUp },
    { label: "Low SIF", value: (severity.LOW || 0).toLocaleString(), subtext: "Today's low-risk precursors", icon: ShieldCheck },
  ];

  const highSIFReports = dashboard?.recent_high_sif_reports || [];
  const siteRiskData = useMemo(() => {
    const fallback = [
      { site: "Startup Check", risk: 92, level: "HIGH", reports: 12 },
      { site: "Drilling Rig", risk: 88, level: "HIGH", reports: 10 },
      { site: "Oil Well", risk: 81, level: "HIGH", reports: 9 },
      { site: "Numaligarh Pipeline Sec 2", risk: 76, level: "MEDIUM", reports: 8 },
      { site: "Guwahati Refinery", risk: 72, level: "MEDIUM", reports: 7 },
    ];

    const source = dashboard?.highest_risk_locations && dashboard.highest_risk_locations.length ? dashboard.highest_risk_locations : fallback;

    return source.map((site, index) => {
      const recentForSite = dashboard?.recent_high_sif_reports?.filter((x) => x.site === site.site).length || 0;
      const psifProxy = Math.min(100, Math.round(site.risk * 0.72 + recentForSite * 9 + (index + 1) * 3));
      const combined = Math.min(100, Math.round((site.risk + psifProxy) / 2));

      return {
        ...site,
        risk: combined,
        level: combined >= 75 ? "HIGH" : combined >= 45 ? "MEDIUM" : "LOW",
      };
    });
  }, [dashboard]);

  return (
    <div
      className="cc-root"
      style={{
        minHeight: "100vh",
        width: "100%",
        background: "transparent",
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
          padding: "30px 18px 40px",
          flex: 1,
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, marginBottom: "20px" }}>
            <button
              type="button"
              className="cc-btn-outline"
              onClick={() => setView({ page: "home" })}
              style={{
                border: "1px solid rgba(255, 140, 104, 0.5)",
                background: "linear-gradient(180deg, rgba(255,93,77,0.16), rgba(15,18,22,0.94))",
                color: "#f8fafc",
                borderRadius: 10,
                padding: "10px 16px",
                fontWeight: 900,
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'Inter', sans-serif",
                boxShadow: "0 18px 28px -20px rgba(255,93,77,0.75)",
              }}
            >
              ← Home
            </button>
          </div>

          <div className="cc-page-title" style={{ marginBottom: "28px" }}>
            <h1
              style={{
                margin: 0,
                fontSize: "30px",
                color: "#F7F9FB",
                fontFamily: "'Merriweather', serif",
                fontWeight: 700,
              }}
            >
              Safety Intelligence Command Center
            </h1>

            <p
              style={{
                margin: "6px 0 0",
                fontSize: "13px",
                color: "#C7D3DC",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              Monitor high-risk safety signals, emerging SIF precursors, and critical
              barrier failures across sites.
            </p>
          </div>

          <CommandUpload setView={setView} onIngest={onIngest} />

        </div>

        <div
          className="cc-kpi-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
            gap: "18px",
          }}
        >
          {kpiData.map((item) => (
            <KPICard key={item.label} {...item} />
          ))}
        </div>
        {loading && <p style={emptyTextStyle}>Loading live dashboard data...</p>}
        <LiveHighlights dashboard={dashboard} />
        {siteRiskData.length > 0 && <SiteRiskComparison data={siteRiskData} />}
        <HighSIFReports
          reports={highSIFReports}
          setView={setView}
        />
        <AboutOilSentinel />
      </main>

      <CommandFooter />
    </div>
  );
}