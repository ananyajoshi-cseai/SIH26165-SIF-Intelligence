import React, { useEffect, useState } from "react";
import { ArrowDownRight, ArrowRight, ChevronRight, Play } from "lucide-react";
import FlipCard from "./FlipCard.jsx";
import "./home.css";
import featureImage1 from "./img&vid/img1.png";
import featureImage2 from "./img&vid/img2.png";
import featureImage3 from "./img&vid/img3.png";
import featureImage4 from "./img&vid/img4.png";
import dekraImage from "./img&vid/dekraMartin.jpeg";
import eeiImage from "./img&vid/eei.jpg";
import velocityImage from "./img&vid/velocity.jpg";
import oilSentinelImage from "./img&vid/oilSentinel.jpeg";
import heroVideo from "./img&vid/video.mp4";

const FEATURE_IMAGES = [featureImage1, featureImage2, featureImage3, featureImage4];

const FEATURES = [
  { title: "SIF / PSIF Intelligence", description: "Identify observations with serious injury and fatality potential before outcomes occur.", image: "" },
  { title: "Critical Barrier Intelligence", description: "See which controls are missing, failed, bypassed, or degraded across the operation.", image: "" },
  { title: "Recurring & Emerging Risk", description: "Connect historical reports to expose recurring precursors and changing risk signals.", image: "" },
  { title: "Site-Level Intelligence", description: "Turn report-level evidence into a practical view for HSE focus and intervention.", image: "" },
];

const TIMELINE = [
  { year: "2015", title: "DEKRA / Martin & Black", text: "The early precursor conversation moved safety attention upstream, toward the conditions that precede serious events.", image: dekraImage },
  { year: "2017", title: "EEI SIF Precursor Model", text: "SIF precursor thinking became a structured lens for recognizing high-energy exposure and critical control gaps.", image: eeiImage },
  { year: "2020", title: "VelocityEHS / PSIF Insights", text: "Digital reporting and potential-severity intelligence connected frontline observations to organizational learning.", image: velocityImage },
  { year: "NOW", title: "OIL SENTINEL", text: "A human-led intelligence layer connects classification, barriers, deterministic risk, historical signals, and prevention.", image: oilSentinelImage },
];

export default function Home({ onStart }) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [activeTimeline, setActiveTimeline] = useState(0);
  const featureImages = FEATURE_IMAGES;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const timer = window.setInterval(() => {
      setActiveTimeline((current) => (current + 1) % TIMELINE.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="home-shell">
      <section className="home-hero">
        <video className="home-hero-media" autoPlay muted loop playsInline preload="metadata" aria-label="Oil Sentinel title animation">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="home-hero-grid" />
        <div className="home-content">
          <div className="home-kicker">OIL INDIA LIMITED · SAFETY INTELLIGENCE SYSTEM</div>
          <h1 className="home-title">OIL <span>SENTINEL</span></h1>
          <p className="home-lede">AI-powered SIF precursor and safety intelligence. From safety observations to proactive intelligence.</p>
          <div className="home-actions">
            <button className="primary-action" onClick={onStart}><Play size={15} fill="currentColor" /> Start Sentinel <ArrowRight size={15} /></button>
            <a className="ghost-action" href="#intelligence"><ArrowDownRight size={15} /> Explore intelligence</a>
          </div>
          <div className="home-scroll">Scroll to enter the system</div>
        </div>
      </section>

      <section className="home-section" id="intelligence">
        <div className="home-section-head">
          <div><div className="eyebrow">01 · Intelligence architecture</div><h2>From observation to intervention.</h2></div>
          <p className="home-section-intro">OIL SENTINEL keeps HSE personnel in control while connecting the signals that are usually separated across reports, sites, and time.</p>
        </div>
        <div className="feature-stage">
          {featureImages.map((image, index) => image && <img key={image} className="feature-stage-image" src={image} alt="" style={{ opacity: activeFeature === index ? 0.68 : 0, transform: activeFeature === index ? "scale(1)" : "scale(1.04)" }} />)}
          <div className="feature-stage-overlay" />
          <div className="feature-grid">
            {FEATURES.map((feature, index) => (
              <button key={feature.title} className={`feature-card ${activeFeature === index ? "active" : ""}`} onMouseEnter={() => setActiveFeature(index)} onFocus={() => setActiveFeature(index)} onClick={() => setActiveFeature(index)}>
                <span className="feature-index">0{index + 1}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <ChevronRight size={18} style={{ marginTop: 18, color: activeFeature === index ? "#e35a64" : "#737981" }} />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="home-section timeline-section">
        <div className="timeline-showcase">
          <div className="timeline-rail-left">
            <div className="eyebrow">02 · The evolution</div>
            <h2 className="timeline-headline">The <br />Journey<br /> so far</h2>
            <div className="timeline-brief">
              
              <p>Oil Safety Journey from 2015 to now</p>
            </div>
            <div className="timeline-controls" aria-label="Timeline controls">
              <button type="button" aria-label="Previous milestone">↑</button>
              <button type="button" aria-label="List view">II</button>
              <button type="button" aria-label="Next milestone">↓</button>
            </div>
          </div>

          <div className="timeline-center" aria-label="Milestone timeline">
            {TIMELINE.map((item, index) => (
              <button
                key={item.year}
                type="button"
                className={`timeline-marker ${activeTimeline === index ? "active" : ""}`}
                onClick={() => setActiveTimeline(index)}
                aria-label={`Select ${item.year} milestone`}
              >
                <span className="marker-dot" />
                <span className="marker-year">{item.year}</span>
              </button>
            ))}
          </div>

          <div className="timeline-story-panel" aria-live="polite">
            {TIMELINE.map((item, index) => {
              if (index !== activeTimeline) return null;
              return (
                <div key={item.year} className="timeline-story-content">
                  <div className="timeline-story-visual">
                    <img src={item.image} alt={`${item.title} milestone`} />
                  </div>
                  <div className="timeline-story-copy">
                    <span className="timeline-story-year">{item.year}</span>
                    <h3>{item.title}</h3>
                    <p>{item.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="home-footer">Team Solstice SIH2026 · OIL SENTINEL · HSE decision authority remains human</footer>
    </main>
  );
}
