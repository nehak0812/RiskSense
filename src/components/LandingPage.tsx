"use client";

import React from "react";
import { Icon } from "./SharedUI";

interface LandingPageProps {
  onLaunchPlatform: () => void;
}

export default function LandingPage({ onLaunchPlatform }: LandingPageProps) {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", color: "var(--text1)" }}>
      {/* NAV */}
      <header className="nav">
        <div className="wrap nav-in">
          <div className="brand" style={{ cursor: "pointer" }}>
            <div className="gem">
              <svg viewBox="0 0 24 24">
                <path d="M12 3 L21 8 L12 13 L3 8 Z" />
                <path d="M3 8 V16 L12 21 L21 16 V8" />
              </svg>
            </div>
            <span className="brand-name">
              Risk<b>Lens</b>
            </span>
          </div>
          <nav className="nav-links">
            <a href="#lenses">Lenses</a>
            <a href="#taxonomy">Taxonomy</a>
            <a href="#how-it-works">Methodology</a>
          </nav>
          <div className="nav-cta">
            <span className="nav-ghost" style={{ cursor: "pointer" }} onClick={onLaunchPlatform}>Sign in</span>
            <button className="btn btn-primary" onClick={onLaunchPlatform}>
              Launch Platform <Icon name="arrowR" size={14} color="#fff" />
            </button>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="hero">
        <div className="wrap hero-grid">
          <div>
            <div className="hero-badge">
              <span className="pulse"></span>
              Live emerging risk monitoring
            </div>
            <h1>
              Emerging risk intelligence, <em>unpacked.</em>
            </h1>
            <p className="hero-sub">
              RiskLens monitors <b>2,840+ global sources</b> to capture sanctions, tariffs, AI governance,
              and climate signals. It maps them semantically to your corporate footprint to score
              relevance and generate board-ready briefings.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={onLaunchPlatform}>
                Analyze your organisation <Icon name="arrowR" size={16} color="#fff" />
              </button>
            </div>
            <div className="hero-note">
              <Icon name="shield" size={14} />
              No configuration required to start with Brightwell plc demo.
            </div>
          </div>

          <div className="preview">
            <div className="browser">
              <div className="browser-bar">
                <span className="dot" style={{ background: "#ff5f56" }}></span>
                <span className="dot" style={{ background: "#ffbd2e" }}></span>
                <span className="dot" style={{ background: "#27c93f" }}></span>
                <div className="browser-url">
                  <Icon name="lock" size={10} />
                  risklens.ey.com/platform
                </div>
              </div>
              <div className="pv-body">
                <div className="pv-tabs">
                  <span className="pv-tab on">The World</span>
                  <span className="pv-tab">Your World</span>
                  <span className="pv-tab">The Intersection</span>
                </div>
                <div className="pv-kpis">
                  <div className="pv-kpi">
                    <span className="l">Signals this week</span>
                    <div className="v">51</div>
                    <span className="d">▲ 14%</span>
                  </div>
                  <div className="pv-kpi">
                    <span className="l">High impact</span>
                    <div className="v" style={{ color: "var(--red)" }}>
                      15
                    </div>
                    <span className="d red">▲ +4</span>
                  </div>
                  <div className="pv-kpi">
                    <span className="l">New today</span>
                    <div className="v">8</div>
                    <span className="d">active</span>
                  </div>
                </div>
                <div className="pv-chart">
                  <div className="pv-chart-t" style={{ fontSize: 9, fontWeight: 600, color: "var(--text3)", marginBottom: 4 }}>
                    SIGNAL VOLUME TREND
                  </div>
                  <div style={{ height: 32, background: "var(--bg3)", borderRadius: 4, display: "flex", alignItems: "flex-end", padding: "2px 6px", gap: 3 }}>
                    {[12, 15, 14, 18, 16, 20, 22, 25, 24, 28, 26, 30].map((h, i) => (
                      <div key={i} style={{ flex: 1, height: `${(h / 30) * 100}%`, background: "var(--accent)", opacity: 0.8, borderRadius: 1 }}></div>
                    ))}
                  </div>
                </div>
                <div className="pv-sig">
                  <span className="bar" style={{ background: "var(--d-trade)" }}></span>
                  <div>
                    <div className="h">US reciprocal tariff on packaged consumer goods effective 1 July</div>
                    <div className="m">Reuters · 1 hr ago · Trade & Supply</div>
                  </div>
                </div>
              </div>
            </div>

            {/* floating cards */}
            <div className="float-card">
              <div className="fl">EMERGING RISK EXPOSURE</div>
              <div className="ft">Tariff & trade-policy escalation</div>
              <div className="fr">
                Brightwell plc's raw material supply lines intersect with the widened US tariff list.
              </div>
            </div>

            <div className="float-score">
              <span className="s">84</span>
              <span className="sl">Relevance</span>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="trust">
        <div className="wrap">
          <div className="trust-label">Continuous ingestion across global regulatory & intelligence feeds</div>
          <div className="trust-row">
            <span className="source-pill">Reuters</span>
            <span className="source-pill">Bloomberg</span>
            <span className="source-pill">Financial Times</span>
            <span className="source-pill">SEC / EDGAR</span>
            <span className="source-pill">EU Official Journal</span>
            <span className="source-pill">OFAC</span>
            <span className="source-pill">Federal Reserve</span>
          </div>
        </div>
      </section>

      {/* TAXONOMY */}
      <section className="wrap" id="taxonomy" style={{ padding: "60px 28px" }}>
        <div className="eyebrow" style={{ textAlign: "center", marginBottom: 12 }}>
          Analytical framework
        </div>
        <h2 className="serif" style={{ fontSize: 32, textAlign: "center", fontWeight: 600, marginBottom: 14 }}>
          The Eight Risk Lenses
        </h2>
        <p style={{ textAlign: "center", color: "var(--text2)", maxWidth: 540, margin: "0 auto 36px", fontSize: 14 }}>
          Our intelligence pipeline classifies unstructured signals into a consistent corporate taxonomy
          to run matching models.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {[
            { id: "geo", title: "Geopolitical & Sanctions", desc: "Conflict escalation, diplomatic friction, asset designations, and export controls." },
            { id: "trade", title: "Trade & Supply Chain", desc: "Tariffs, reciprocal duties, transit choke points, and critical raw material restrictions." },
            { id: "reg", title: "Regulatory & Compliance", desc: "Corporate governance acts, disclosure compliance mandates, and reporting duties." },
            { id: "fin", title: "Financial & Market", desc: "Macro inflation, interest rate shifts, refinancing stress, and margin compressions." },
            { id: "tech", title: "Technology & Cyber", desc: "Generative AI policy limits, cloud outages, third-party breaches, and ransomware." },
            { id: "clim", title: "Climate & Environmental", desc: "Physical water scarcity, supply region droughts, biodiversity stress, and carbon taxes." },
            { id: "soc", title: "Social & Conduct", desc: "Labour practices, supply chain human rights reviews, and brand reputational shifts." },
            { id: "legal", title: "Legal & Litigation", desc: "Contract disputes, class action liabilities, regulatory fines, and court rulings." },
          ].map((tax) => (
            <div
              key={tax.id}
              className="panel"
              style={{
                borderTop: `3px solid var(--d-${tax.id})`,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600 }}>{tax.title}</div>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.5 }}>{tax.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ background: "var(--bg2)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "60px 0" }} id="how-it-works">
        <div className="wrap">
          <div className="eyebrow" style={{ textAlign: "center", marginBottom: 12 }}>
            Methodology
          </div>
          <h2 className="serif" style={{ fontSize: 32, textAlign: "center", fontWeight: 600, marginBottom: 36 }}>
            How RiskLens Works
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 32 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: "var(--accent-l)", color: "var(--accent)", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                1
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Ingest & Enrich</h3>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                Scrapes thousands of articles daily. Classifies each signal for domain, impact level,
                and sentiment using LLM parsing.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: "var(--accent-l)", color: "var(--accent)", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                2
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Semantic Matching</h3>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                Computes vector embeddings to match incoming signals against your disclosed risks,
                peer filings, and supply chain footprint.
              </p>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ display: "inline-flex", width: 44, height: 44, borderRadius: "50%", background: "var(--accent-l)", color: "var(--accent)", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, marginBottom: 16 }}>
                3
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>Board Synthesis</h3>
              <p style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                Synthesizes exposure against board appetites, calculates peer disclosure gaps, and
                compiles printable board packs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACTION BAND */}
      <section style={{ padding: "60px 0", textAlign: "center" }}>
        <div className="wrap">
          <h2 className="serif" style={{ fontSize: 26, fontWeight: 600, marginBottom: 12 }}>
            Ready to review your risk posture?
          </h2>
          <p style={{ color: "var(--text2)", marginBottom: 24, fontSize: 13.5 }}>
            Unlock emerging risk matching and peer disclosure benchmarking in under 10 seconds.
          </p>
          <button className="btn btn-primary btn-lg" onClick={onLaunchPlatform}>
            Launch platform workspace <Icon name="arrowR" size={16} color="#fff" />
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop: "1px solid var(--border)", padding: "26px 0", fontSize: 11, color: "var(--text3)", background: "var(--bg2)" }}>
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            &copy; {new Date().getFullYear()} EY RiskLens. All rights reserved. Editorial prototype.
          </div>
          <div style={{ display: "flex", gap: 16 }}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">EY Global Risk Consulting</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
