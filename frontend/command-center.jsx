import React, { useEffect, useState } from "react";
import {
  FileText,
  ShieldAlert,
  TrendingUp,
  ShieldCheck,
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

const C = {
  navy: "#0A2A43",
  navyDeep: "#071D30",
  saffron: "#FF9933",
  green: "#0F7A3D",
  paper: "#F3F1EA",
  card: "#FFFFFF",
  ink: "#16232E",
  inkSoft: "#5B6B76",
  line: "#E1DCCE",
  red: "#8E1B14",
  redBright: "#C0281F",
  orange: "#B3540C",
  yellow: "#8A6A0E",
  greenGood: "#215E36",
};

function Emblem({ size = 44 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
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

function CommandHeader() {
  return (
    <div>
      {/* Tricolor strip */}
      <div style={{ height: 5, display: "flex" }}>
        <div style={{ flex: 1, background: C.saffron }} />
        <div style={{ flex: 1, background: "#FFFFFF" }} />
        <div style={{ flex: 1, background: C.green }} />
      </div>

      {/* Main header */}
      <div
  style={{
    background: `linear-gradient(
      100deg,
      rgba(7,29,48,0.94),
      rgba(10,42,67,0.90)
    ), url(${IMG.aerial})`,
    backgroundSize: "cover",
    backgroundPosition: "center 65%",
    borderBottom: `3px solid ${C.saffron}`,
  }}
>
        <div
          style={{
            maxWidth: 1320,
            margin: "0 auto",
            padding: "14px 28px",
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <Emblem />

          <div style={{ flex: 1 }}>
            <div
              style={{
                color: "#EFE6C8",
                fontSize: 11.5,
                letterSpacing: 1.4,
                fontFamily: "'Inter', sans-serif",
              }}
            >
              GOVERNMENT OF INDIA &nbsp;·&nbsp; MINISTRY OF PETROLEUM & NATURAL GAS
            </div>

            <div
              style={{
                color: "#fff",
                fontFamily: "'Merriweather', serif",
                fontSize: 22,
                fontWeight: 700,
                marginTop: 2,
              }}
            >
              Oil Safety Intelligence Portal
            </div>
          </div>

          <div
            style={{
              textAlign: "right",
              color: "#B9C6CF",
              fontSize: 12,
              fontFamily: "'Inter', sans-serif",
              lineHeight: 1.5,
            }}
          >
            Directorate General of
            <br />
            Mines &amp; Process Safety
          </div>
        </div>
      </div>
    </div>
  );
}

function CommandFooter() {
  return (
    <div
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
      Oil Safety Intelligence Portal — Prototype for demonstration purposes ·
      Data shown is illustrative
    </div>
  );
}

const siteRiskData = [
  {
    site: "Refinery A",
    risk: 82,
    level: "HIGH",
    reports: 342,
  },
  {
    site: "Offshore Platform B",
    risk: 68,
    level: "MEDIUM",
    reports: 287,
  },
  {
    site: "Terminal C",
    risk: 54,
    level: "MEDIUM",
    reports: 264,
  },
  {
    site: "Refinery D",
    risk: 39,
    level: "LOW",
    reports: 211,
  },
  {
    site: "Pipeline Hub E",
    risk: 27,
    level: "LOW",
    reports: 144,
  },
];

const barrierFailureData = [
  {
    barrier: "Energy Isolation",
    score: 82,
  },
  {
    barrier: "Permit to Work",
    score: 68,
  },
  {
    barrier: "Gas Detection",
    score: 54,
  },
  {  
    barrier: "PPE Compliance",
    score: 39,
  },
];

function BarrierFailureChart() {
  return (
    <section
      style={{
        marginTop: "28px",
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: "8px",
        padding: "22px",
        boxShadow: "0 2px 8px rgba(10,42,67,0.08)",
      }}
    >
      <div
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
            data={barrierFailureData}
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
              dataKey="barrier"
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
  const isHighSIF = label === "High SIF Precursors";
  const isPattern = label === "Emerging Pattern Flag";

  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: "8px",
        padding: "20px",
        boxShadow: "0 2px 8px rgba(10,42,67,0.08)",
        borderTop: `4px solid ${
          isHighSIF
            ? C.redBright
            : isPattern
            ? C.orange
            : C.navy
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
          style={{
            width: 38,
            height: 38,
            borderRadius: "8px",
            background: C.paper,
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
                : C.navy
            }
          />
        </div>
      </div>

      <h2
        style={{
          margin: 0,
          fontSize: label === "Most Failed Barrier" ? "21px" : "30px",
          fontWeight: 700,
          color: C.navy,
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

function SiteRiskComparison() {
  return (
    <section
  style={{
    marginTop: "28px",
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: "8px",
    padding: "22px",
    boxShadow: "0 2px 8px rgba(10,42,67,0.08)",
  }}
>
      <div
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
  Site Risk Comparison
</h2>

<p
  style={{
    margin: "6px 0 0",
    fontSize: "12px",
    color: "#C7D3DC",
    fontFamily: "'Inter', sans-serif",
  }}
>
  Relative SIF precursor risk across assigned sites
</p>
      </div>

      <div style={{ width: "100%", height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={siteRiskData}
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
  axisLine={{
    stroke: C.line,
  }}
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
  cursor={{
    fill: "rgba(10,42,67,0.04)",
  }}
  contentStyle={{
    background: C.card,
    border: `1px solid ${C.line}`,
    borderRadius: "6px",
    boxShadow: "0 2px 8px rgba(10,42,67,0.10)",
    fontFamily: "'Inter', sans-serif",
    fontSize: "12px",
    color: C.ink,
  }}
  labelStyle={{
    color: C.navy,
    fontWeight: 700,
    fontFamily: "'Inter', sans-serif",
  }}
  formatter={(value) => [`${value}`, "Risk Score"]}
/>

            <Bar
  dataKey="risk"
  radius={[0, 4, 4, 0]}
  barSize={26}
>
  {siteRiskData.map((entry, index) => {
    const barColor =
  entry.level === "HIGH"
    ? C.redBright
    : entry.level === "MEDIUM"
    ? "#F4C430"
    : C.greenGood;

    return (
      <Cell
        key={`cell-${index}`}
        fill={barColor}
      />
    );
  })}
</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
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
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#C62828",
            }}
          />
          High Risk
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#F4C430",
            }}
          />
          Medium Risk
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 2,
              background: "#2E8B57",
            }}
          />
          Low Risk
        </div>
      </div>
    </section>
  );
}

function HighSIFReports({ reports , setView}) {
  return (
    <section
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
        style={{
          padding: "20px 22px",
          background: `linear-gradient(90deg, ${C.navy}, #123B59)`,
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
      {reports.map((report, index) => (
        <div
          key={String(report.id).slice(0, 8)}
          style={{
            display: "grid",
            gridTemplateColumns: "90px 150px 1fr 110px 80px 85px",
            gap: "14px",
            alignItems: "center",
            padding: "15px 22px",
            background: index % 2 === 0 ? C.card : "#FAF9F5",
            borderBottom:
              index !== reports.length - 1
                ? `1px solid ${C.line}`
                : "none",
          }}
        >
          {/* ID */}
          <div
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: C.navy,
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
                color: C.ink,
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
              color: C.ink,
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
          onClick={() => {
  setView({
    page: "report-detail",
    reportId: report.id,
  });
}}
            style={{
              border: `1px solid ${C.navy}`,
              background: "transparent",
              color: C.navy,
              borderRadius: "4px",
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

function CommandUpload() {
  return (
    <section
      style={{
        marginBottom: "28px",
        background: `linear-gradient(
  120deg,
  rgba(10,42,67,0.92),
  rgba(10,42,67,0.75)
), url(${IMG.plant})`,
backgroundSize: "cover",
backgroundPosition: "center",
        border: `1px solid ${C.line}`,
        borderRadius: "6px",
        padding: "20px 22px",
        boxShadow: "0 2px 8px rgba(10,42,67,0.08)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div
          style={{
            width: "4px",
            height: "24px",
            background: C.saffron,
            borderRadius: "2px",
          }}
        />

        <div>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Merriweather', serif",
              fontSize: "18px",
              fontWeight: 700,
              color: "#FFFFFF",
            }}
          >
            Upload Incident Report
          </h2>

          <p
            style={{
              margin: "4px 0 0",
              fontFamily: "'Inter', sans-serif",
              fontSize: "12px",
              color: "#FFFFFF",
            }}
          >
            Submit a new incident report for SIF intelligence analysis
          </p>
        </div>
      </div>

     <UploadWidget
  compact
  accept=".csv,.pdf,image/*"
/>
    </section>
  );
}

export default function CommandCenter({ setView }) {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

 const kpiData = dashboard
  ? [
      {
        label: "Total Reports",
        value: dashboard.total_reports?.toLocaleString() || "1,248",
        subtext: "Across assigned sites",
        icon: FileText,
      },
      {
        label: "High SIF Precursors",
        value: dashboard.high_sif_precursors?.toLocaleString() || "37",
        subtext: "Require immediate attention",
        icon: ShieldAlert,
      },
      {
        label: "Emerging Pattern Flag",
        value: dashboard.emerging_pattern_count?.toLocaleString() || "4",
        subtext: "New patterns detected",
        icon: TrendingUp,
      },
      {
        label: "Most Failed Barrier",
        value: dashboard.most_failed_barrier || "Energy Isolation",
        subtext: "Repeated barrier failure",
        icon: ShieldCheck,
      },
    ]
  : [
      {
        label: "Total Reports",
        value: "1,248",
        subtext: "Across assigned sites",
        icon: FileText,
      },
      {
        label: "High SIF Precursors",
        value: "37",
        subtext: "Require immediate attention",
        icon: ShieldAlert,
      },
      {
        label: "Emerging Pattern Flag",
        value: "4",
        subtext: "New patterns detected",
        icon: TrendingUp,
      },
      {
        label: "Most Failed Barrier",
        value: "Energy Isolation",
        subtext: "Repeated barrier failure",
        icon: ShieldCheck,
      },
    ];

 const highSIFReports = dashboard?.recent_high_sif_reports || [
  {
    id: "SIF-1024",
    site: "Refinery A",
    incident: "Energy isolation barrier failure",
    date: "2026-09-10",
    score: 92,
  },
  {
    id: "SIF-1019",
    site: "Offshore Platform B",
    incident: "Permit to work deviation",
    date: "2026-09-09",
    score: 87,
  },
  {
    id: "SIF-1016",
    site: "Terminal C",
    incident: "Gas detection failure",
    date: "2026-09-08",
    score: 84,
  },
  {
    id: "SIF-1012",
    site: "Refinery D",
    incident: "PPE compliance failure",
    date: "2026-09-07",
    score: 81,
  },
  {
    id: "SIF-1008",
    site: "Pipeline Hub E",
    incident: "PPE and permit deviation",
    date: "2026-09-06",
    score: 79,
  },
];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: C.paper,
        fontFamily: "'Inter', sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CommandHeader />

      <main
        style={{
          width: "100%",
          maxWidth: 1320,
          margin: "0 auto",
          padding: "30px 28px 40px",
          flex: 1,
        }}
      >
        <div style={{ marginBottom: "28px" }}>
          <div style={{ marginBottom: "28px" }}>
  <h1
    style={{
      margin: 0,
      fontSize: "30px",
      color: C.navy,
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
    color: C.inkSoft,
    fontFamily: "'Inter', sans-serif",
  }}
>
  Monitor high-risk safety signals, emerging SIF precursors, and critical
  barrier failures across sites.
</p>
</div>

<CommandUpload />
          
        </div>

        <div
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
        <SiteRiskComparison />
<HighSIFReports
  reports={highSIFReports}
  setView={setView}
/>

<div style={{ marginTop: 24 }}>
  <BarrierFailureChart />
</div>
      </main>

      <CommandFooter />
    </div>
  );
}
 