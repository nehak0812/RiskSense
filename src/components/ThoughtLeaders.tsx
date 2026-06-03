"use client";

import React, { useState } from "react";
import { Icon, DomainTag } from "./SharedUI";

const REPORTS = [
  {
    id: "r1",
    publisher: "World Economic Forum",
    mark: "WEF",
    markColor: "var(--teal)",
    title: "Global Risks Report 2026",
    date: "Jan 2026",
    horizon: "2-year",
    topRisks: ["Geopolitical confrontation", "Misinformation & AI", "Extreme weather", "Economic downturn"],
    summary:
      'Frames a "polycrisis" in which geopolitical, technological and environmental risks compound. Short-term concern centres on state-based conflict and AI-driven misinformation; the 10-year outlook is dominated by environmental risks.',
    domains: ["geo", "tech", "clim", "fin"],
  },
  {
    id: "r2",
    publisher: "International Monetary Fund",
    mark: "IMF",
    markColor: "var(--accent)",
    title: "World Economic Outlook Update",
    date: "Apr 2026",
    horizon: "12-month",
    topRisks: ["Trade fragmentation", "Sticky inflation", "Sovereign debt stress", "Financial-sector strain"],
    summary:
      "Warns that trade fragmentation and tariff escalation could shave global output and re-anchor inflation higher. Highlights debt-service pressure in emerging markets and pockets of non-bank financial vulnerability.",
    domains: ["fin", "trade", "geo"],
  },
  {
    id: "r3",
    publisher: "World Bank",
    mark: "WB",
    markColor: "var(--green)",
    title: "Global Economic Prospects",
    date: "Jan 2026",
    horizon: "24-month",
    topRisks: ["Trade-policy uncertainty", "Climate shocks", "Debt distress", "Weak investment"],
    summary:
      "Emphasises that trade-policy uncertainty and climate-related shocks are the dominant drags on emerging-market growth, with under-investment compounding long-run vulnerability.",
    domains: ["trade", "clim", "fin"],
  },
  {
    id: "r4",
    publisher: "Deloitte",
    mark: "D",
    markColor: "var(--d-fin)",
    title: "Global Risk & Resilience Outlook",
    date: "Mar 2026",
    horizon: "18-month",
    topRisks: ["Cyber & AI risk", "Regulatory complexity", "Supply-chain concentration", "Talent"],
    summary:
      "Identifies cyber and AI-governance risk as the fastest-rising board concern, alongside mounting regulatory complexity across jurisdictions and concentration risk in critical suppliers.",
    domains: ["tech", "reg", "trade"],
  },
  {
    id: "r5",
    publisher: "PwC",
    mark: "PwC",
    markColor: "var(--d-trade)",
    title: "Global Risk Survey 2026",
    date: "Feb 2026",
    horizon: "12-month",
    topRisks: ["Inflation & macro", "Cyber", "Digital & technology", "Regulatory change"],
    summary:
      "Survey of risk leaders places macro-economic volatility and cyber threats at the top of the near-term agenda, with a growing share treating AI as both an opportunity and an emerging risk.",
    domains: ["fin", "tech", "reg"],
  },
  {
    id: "r6",
    publisher: "McKinsey & Company",
    mark: "McK",
    markColor: "var(--d-tech)",
    title: "Global Risk Pulse",
    date: "Apr 2026",
    horizon: "12-month",
    topRisks: ["Geopolitical risk", "AI disruption", "Energy transition", "Supply resilience"],
    summary:
      "Argues geopolitical risk has become a permanent strategic variable and that AI adoption is reshaping both opportunity and operational-risk profiles, requiring scenario-based resilience planning.",
    domains: ["geo", "tech", "clim"],
  },
  {
    id: "r7",
    publisher: "KPMG",
    mark: "KPMG",
    markColor: "var(--d-soc)",
    title: "Global Board Risk Survey",
    date: "Mar 2026",
    horizon: "18-month",
    topRisks: ["Regulatory & compliance", "Cyber", "ESG & climate", "Reputational"],
    summary:
      "Finds boards elevating regulatory and ESG-disclosure readiness as a top oversight priority, with cyber and reputational risk close behind amid faster information propagation.",
    domains: ["reg", "tech", "clim", "soc"],
  },
  {
    id: "r8",
    publisher: "BCG",
    mark: "BCG",
    markColor: "var(--d-clim)",
    title: "Resilience & Risk Index",
    date: "Feb 2026",
    horizon: "24-month",
    topRisks: ["Supply-chain resilience", "Geopolitics", "Climate transition", "Tech disruption"],
    summary:
      "Stresses building structural supply-chain resilience against a backdrop of geopolitical fragmentation and accelerating climate-transition requirements.",
    domains: ["trade", "geo", "clim"],
  },
];

const SYNTHESIS = [
  {
    domain: "geo",
    consensus: "high",
    sources: 7,
    note: "Near-universal: geopolitical confrontation now treated as a structural, persistent risk rather than a tail event.",
  },
  {
    domain: "trade",
    consensus: "high",
    sources: 6,
    note: "Strong agreement that trade fragmentation and tariffs are a top near-term drag on growth and cost.",
  },
  {
    domain: "tech",
    consensus: "high",
    sources: 7,
    note: "Consensus that cyber and AI-governance risk is rising fastest; framed as both threat and opportunity.",
  },
  {
    domain: "fin",
    consensus: "med",
    sources: 5,
    note: "Partial divergence on whether inflation re-anchors higher or eases; debt-stress emphasis varies by source.",
  },
  {
    domain: "clim",
    consensus: "med",
    sources: 6,
    note: "Agreement on long-run severity, but divergence on near-term prioritisation vs geopolitical and macro risks.",
  },
  {
    domain: "reg",
    consensus: "med",
    sources: 4,
    note: "Advisory firms stress regulatory complexity; multilaterals emphasise it less directly.",
  },
  {
    domain: "soc",
    consensus: "low",
    sources: 3,
    note: "Divergent: misinformation and reputational risk feature prominently for some, peripherally for others.",
  },
];

const DOMAINS_MAP = [
  { id: "geo", short: "Geopolitical" },
  { id: "trade", short: "Trade & Supply" },
  { id: "reg", short: "Regulatory" },
  { id: "tech", short: "Tech & Cyber" },
  { id: "clim", short: "Climate" },
  { id: "fin", short: "Financial" },
  { id: "soc", short: "Social" },
  { id: "legal", short: "Legal" },
];

export default function ThoughtLeaders() {
  const [domainFilter, setDomainFilter] = useState<string | null>(null);

  const reports = domainFilter
    ? REPORTS.filter((r) => r.domains.includes(domainFilter))
    : REPORTS;

  const consClass = (c: string) =>
    c === "high" ? "cons-high" : c === "med" ? "cons-med" : "cons-low";

  const consLabel = (c: string) =>
    c === "high" ? "Strong consensus" : c === "med" ? "Partial consensus" : "Divergent";

  return (
    <div className="scroll">
      <div className="page-pad">
        <div className="briefing-head" style={{ marginBottom: 10 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Thought Leaders' Voice
            </div>
            <div className="briefing-title">What the risk authorities are elevating</div>
          </div>
          <span className="range-pill" style={{ marginLeft: "auto" }}>
            {REPORTS.length} reports · WEF · IMF · World Bank · Big 4 · MBB
          </span>
        </div>
        <div className="summary-callout">
          <div className="ico">
            <Icon name="bulb" size={18} />
          </div>
          <p>
            <b>
              Across eight major risk-thought-leadership reports, geopolitical confrontation, cyber/AI
              governance and trade fragmentation command the broadest consensus.
            </b>{" "}
            Sources diverge most on the near-term prioritisation of climate versus macro risk, and on
            the weight given to misinformation and reputational contagion.
          </p>
        </div>

        {/* cross-source synthesis */}
        <div className="panel" style={{ marginBottom: 20 }}>
          <div className="panel-h">
            <div>
              <div className="panel-title">Cross-source synthesis</div>
              <div className="panel-sub">Where thought leaders agree and diverge · mapped to the risk taxonomy</div>
            </div>
          </div>
          
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "150px 92px 1fr 110px",
              gap: 14,
              padding: "0 0 8px",
              borderBottom: "1px solid var(--border)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: ".5px",
              textTransform: "uppercase",
              color: "var(--text3)",
            }}
          >
            <div>Domain</div>
            <div>Consensus</div>
            <div>Synthesis</div>
            <div style={{ textAlign: "right" }}>Sources citing</div>
          </div>
          
          {SYNTHESIS.map((s) => {
            return (
              <div
                key={s.domain}
                className="synth-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 92px 1fr 110px",
                  alignItems: "center",
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <DomainTag id={s.domain} full />
                </div>
                <div>
                  <span className={`consensus-badge ${consClass(s.consensus)}`}>
                    {consLabel(s.consensus)}
                  </span>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text2)", lineHeight: 1.5 }}>
                  {s.note}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 6,
                          height: 14,
                          borderRadius: 2,
                          background: i < s.sources ? `var(--d-${s.domain})` : "var(--bg4)",
                        }}
                      ></span>
                    ))}
                  </div>
                  <span
                    className="serif num"
                    style={{ fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: "right" }}
                  >
                    {s.sources}/8
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* filter */}
        <div className="sec-div">
          <span className="lbl">Reports</span>
          <span className="line"></span>
        </div>
        
        <div className="toolbar" style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span
            style={{
              fontSize: 11,
              color: "var(--text3)",
              fontWeight: 600,
              letterSpacing: ".5px",
              textTransform: "uppercase",
            }}
          >
            Filter by domain
          </span>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <span
              className={`pill ${!domainFilter ? "active" : ""}`}
              onClick={() => setDomainFilter(null)}
              style={{ cursor: "pointer" }}
            >
              All
            </span>
            {DOMAINS_MAP.map((d) => (
              <span
                key={d.id}
                className={`pill ${domainFilter === d.id ? "active" : ""}`}
                onClick={() => setDomainFilter(domainFilter === d.id ? null : d.id)}
                style={{ cursor: "pointer" }}
              >
                {d.short}
              </span>
            ))}
          </div>
        </div>

        {/* report cards */}
        <div className="report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {reports.map((r) => (
            <div className="report-card fade-up" key={r.id}>
              <div className="report-head" style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div
                  className="report-mark"
                  style={{
                    background: r.markColor,
                    width: 36,
                    height: 36,
                    color: "#fff",
                    borderRadius: 6,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 10,
                  }}
                >
                  {r.mark}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="report-pub" style={{ fontWeight: 600, fontSize: 13 }}>{r.publisher}</div>
                  <div className="report-date" style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {r.date} · {r.horizon} horizon
                  </div>
                </div>
              </div>
              <div className="report-title" style={{ fontFamily: "var(--serif)", fontSize: 15, fontWeight: 600, marginBottom: 8 }}>{r.title}</div>
              <div className="report-summary" style={{ fontSize: 12, color: "var(--text2)", marginBottom: 12, lineHeight: 1.5 }}>{r.summary}</div>
              <div
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".8px",
                  textTransform: "uppercase",
                  color: "var(--text3)",
                  marginBottom: 8,
                }}
              >
                Top risks elevated
              </div>
              <div className="report-risks" style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {r.topRisks.map((rk, i) => (
                  <div className="report-risk" key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                    <span className="rr-rank num" style={{ fontWeight: 700, color: "var(--text3)" }}>{i + 1}</span>
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 2,
                        background: `var(--d-${r.domains[Math.min(i, r.domains.length - 1)]})`,
                        flexShrink: 0,
                      }}
                    ></span>
                    {rk}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 5,
                  flexWrap: "wrap",
                  marginTop: 13,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border)",
                }}
              >
                {r.domains.map((d) => (
                  <DomainTag key={d} id={d} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
