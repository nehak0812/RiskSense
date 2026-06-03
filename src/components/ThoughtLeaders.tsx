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
    date: "Jan 14, 2026",
    horizon: "2-year",
    url: "https://www.weforum.org/publications/global-risks-report-2026/",
    topRisks: ["Geopolitical confrontation", "Misinformation & AI", "Extreme weather", "Economic downturn"],
    summary:
      'Frames a "polycrisis" in which geopolitical, technological and environmental risks compound. Short-term concern centres on state-based conflict and AI-driven misinformation; the 10-year outlook is dominated by environmental risks.',
    domains: ["geo", "tech", "clim", "fin"],
  },
  {
    id: "r2",
    publisher: "World Economic Forum",
    mark: "WEF",
    markColor: "var(--teal)",
    title: "Chief Economists Outlook (May 2026)",
    date: "May 28, 2026",
    horizon: "12-month",
    url: "https://www.weforum.org/publications/chief-economists-outlook-may-2026/",
    topRisks: ["Trade policy uncertainty", "Geopolitical tension", "Fiscal policy pressure", "Economic volatility"],
    summary:
      "Analyzes the challenges facing global policy coordination, highlighting the threat of geopolitical fragmentation to cross-border supply lines and macroeconomic growth stability.",
    domains: ["fin", "trade", "geo"],
  },
  {
    id: "r3",
    publisher: "International Monetary Fund",
    mark: "IMF",
    markColor: "var(--accent)",
    title: "World Economic Outlook, April 2026",
    date: "Apr 14, 2026",
    horizon: "12-month",
    url: "https://www.imf.org/en/Publications/WEO/Issues/2026/04/14/world-economic-outlook-april-2026",
    topRisks: ["Trade fragmentation", "Sticky inflation", "Sovereign debt stress", "Financial-sector strain"],
    summary:
      "Warns that trade fragmentation and tariff escalation could shave global output and re-anchor inflation higher. Highlights debt-service pressure in emerging markets and pockets of non-bank financial vulnerability.",
    domains: ["fin", "trade", "geo"],
  },
  {
    id: "r4",
    publisher: "International Monetary Fund",
    mark: "IMF",
    markColor: "var(--accent)",
    title: "World Economic Outlook, October 2025",
    date: "Oct 14, 2025",
    horizon: "12-month",
    url: "https://www.imf.org/en/Publications/WEO/Issues/2025/10/14/world-economic-outlook-october-2025",
    topRisks: ["Global growth deceleration", "Interest rate volatility", "Commodity supply shocks", "Financial decoupling"],
    summary:
      "Outlines prospects for low medium-term growth. Identifies geopolitical division and protectionist trade tariffs as major factors inhibiting investment and supply chains.",
    domains: ["fin", "trade", "geo"],
  },
  {
    id: "r5",
    publisher: "World Bank",
    mark: "WB",
    markColor: "var(--green)",
    title: "Global Economic Prospects",
    date: "Jan 13, 2026",
    horizon: "24-month",
    url: "https://hdl.handle.net/10986/44034",
    topRisks: ["Trade-policy uncertainty", "Climate shocks", "Debt distress", "Weak investment"],
    summary:
      "Emphasises that trade-policy uncertainty and climate-related shocks are the dominant drags on emerging-market growth, with under-investment compounding long-run vulnerability.",
    domains: ["trade", "clim", "fin"],
  },
  {
    id: "r6",
    publisher: "World Bank",
    mark: "WB",
    markColor: "var(--green)",
    title: "World Development Report 2025: Standards for Development",
    date: "Dec 11, 2025",
    horizon: "3-year",
    url: "https://www.worldbank.org/en/publication/wdr2025",
    topRisks: ["Regulatory compliance gap", "Infrastructure deficit", "Technological fragmentation", "Economic exclusion"],
    summary:
      "Explores how standardized regulations, technological frameworks, and quality infrastructure can unlock economic integration for developing nations while managing transition risks.",
    domains: ["tech", "reg", "fin"],
  },
  {
    id: "r7",
    publisher: "Deloitte",
    mark: "D",
    markColor: "var(--d-fin)",
    title: "2026 Internal Audit Hot Topics",
    date: "Jan 29, 2026",
    horizon: "18-month",
    url: "https://www.deloitte.com/us/en/insights.html",
    topRisks: ["Cyber & AI risk", "Regulatory complexity", "Supply-chain concentration", "Talent"],
    summary:
      "Identifies cyber and AI-governance risk as the fastest-rising board concern, alongside mounting regulatory complexity across jurisdictions and concentration risk in critical suppliers.",
    domains: ["tech", "reg", "trade"],
  },
  {
    id: "r8",
    publisher: "Deloitte",
    mark: "D",
    markColor: "var(--d-fin)",
    title: "Deloitte 2025 C-suite Sustainability Report",
    date: "Feb 2026",
    horizon: "2-year",
    url: "https://delo.tt/6057h5q5X",
    topRisks: ["Physical climate damage", "Transition regulation", "Water scarcity", "Resource security"],
    summary:
      "Gathers survey responses from over 2,100 C-suite executives globally. Evaluates how companies align sustainability investments with business strategy, technology adoption, and climate adaptation.",
    domains: ["clim", "tech", "reg"],
  },
  {
    id: "r9",
    publisher: "PwC",
    mark: "PwC",
    markColor: "var(--d-trade)",
    title: "PwC 2026 Global CEO Survey",
    date: "Jan 19, 2026",
    horizon: "12-month",
    url: "https://www.pwc.com/gx/en/issues/c-suite-insights/ceo-survey-2026.html",
    topRisks: ["Inflation & macro", "Cyber", "Digital & technology", "Regulatory change"],
    summary:
      "Survey of risk leaders places macro-economic volatility and cyber threats at the top of the near-term agenda, with a growing share treating AI as both an opportunity and an emerging risk.",
    domains: ["fin", "tech", "reg"],
  },
  {
    id: "r10",
    publisher: "PwC",
    mark: "PwC",
    markColor: "var(--d-trade)",
    title: "2026 Global Digital Trust Insights Survey",
    date: "Oct 1, 2025",
    horizon: "2-year",
    url: "https://www.pwc.com/gx/en/issues/cybersecurity/digital-trust-insights.html",
    topRisks: ["GenAI data threats", "Infrastructure cyber attacks", "Third-party compliance", "Cloud security leaks"],
    summary:
      "Details how cybersecurity compliance is evolving in the age of generative AI, advising boards to mandate third-party infrastructure defense and standardise log trails.",
    domains: ["tech", "reg", "soc"],
  },
  {
    id: "r11",
    publisher: "EY",
    mark: "EY",
    markColor: "var(--d-reg)",
    title: "Geopolitical Outlook for 2026: Rewired for Risk & Resilience",
    date: "Jan 8, 2026",
    horizon: "12-month",
    url: "https://www.ey.com/en_gl/insights/geostrategy/geostrategic-outlook",
    topRisks: ["Multipolar alliance shifts", "Supply chain decoupling", "Resource nationalism", "Bilateral tariff hikes"],
    summary:
      "Examines geostrategic forces reshaping global supply chains and regulatory frameworks. Advises executive boards to prepare for regionalized trade blocs and critical commodity blocks.",
    domains: ["geo", "trade", "clim"],
  },
  {
    id: "r12",
    publisher: "EY",
    mark: "EY",
    markColor: "var(--d-reg)",
    title: "EY Global Risk Transformation Study 2025",
    date: "Sep 10, 2025",
    horizon: "2-year",
    url: "https://www.ey.com/en_gl/risk/consulting",
    topRisks: ["Compliance complexity", "Cyber threat escalation", "AI alignment failure", "Macro volatility"],
    summary:
      "Surveys risk leaders on corporate transformation. Recommends automating compliance workflows, standardizing tech risk frameworks, and integrating ERM systems with real-time thought data.",
    domains: ["reg", "tech", "fin"],
  },
  {
    id: "r13",
    publisher: "KPMG",
    mark: "KPMG",
    markColor: "var(--d-soc)",
    title: "Global Third-Party Risk Management Survey 2026",
    date: "Mar 2, 2026",
    horizon: "18-month",
    url: "https://home.kpmg/xx/en/home/insights/2026/03/global-third-party-risk-management-survey-2026.html",
    topRisks: ["Regulatory & compliance", "Cyber", "ESG & climate", "Reputational"],
    summary:
      "Finds boards elevating regulatory and ESG-disclosure readiness as a top oversight priority, with cyber and reputational risk close behind amid faster information propagation.",
    domains: ["reg", "tech", "clim", "soc"],
  },
  {
    id: "r14",
    publisher: "KPMG",
    mark: "KPMG",
    markColor: "var(--d-soc)",
    title: "KPMG 2025 Global CEO Outlook",
    date: "Sep 15, 2025",
    horizon: "3-year",
    url: "https://home.kpmg/xx/en/home/insights/2025/09/kpmg-2025-ceo-outlook.html",
    topRisks: ["AI investment governance", "Geopolitical fragmentation", "Macro economic volatility", "Talent shortages"],
    summary:
      "Surveys over 1,300 CEOs on growth confidence. Outlines top investment focuses, listing generative AI, transparent corporate governance, and talent resilience as core drivers.",
    domains: ["fin", "tech", "reg"],
  },
  {
    id: "r15",
    publisher: "McKinsey & Company",
    mark: "McK",
    markColor: "var(--d-tech)",
    title: "McKinsey on Risk & Resilience (Number 20)",
    date: "Nov 15, 2025",
    horizon: "12-month",
    url: "https://www.mckinsey.com/capabilities/risk-and-resilience/our-insights",
    topRisks: ["Geopolitical risk", "AI disruption", "Energy transition", "Supply resilience"],
    summary:
      "Argues geopolitical risk has become a permanent strategic variable and that AI adoption is reshaping both opportunity and operational-risk profiles, requiring scenario-based resilience planning.",
    domains: ["geo", "tech", "clim"],
  },
  {
    id: "r16",
    publisher: "McKinsey & Company",
    mark: "McK",
    markColor: "var(--d-tech)",
    title: "State of AI Trust in 2026: Shifting to the Agentic Era",
    date: "Mar 25, 2026",
    horizon: "2-year",
    url: "https://www.mckinsey.com/capabilities/quantumblack/our-insights/state-of-ai-trust-in-2026-shifting-to-the-agentic-era",
    topRisks: ["Autonomous agent bias", "Hallucination liabilities", "System integration vulnerabilities", "Model compliance"],
    summary:
      "Outlines trust challenges in deploying agentic AI systems. Recommends implementing strict transparency checks, autonomous audits, and strict compliance boundaries.",
    domains: ["tech", "reg", "soc"],
  },
  {
    id: "r17",
    publisher: "BCG",
    mark: "BCG",
    markColor: "var(--d-clim)",
    title: "Trade in Transition: Preparing for Patchwork World Order",
    date: "Jan 8, 2026",
    horizon: "24-month",
    url: "https://www.bcg.com/publications/2026/trade-in-transition-patchwork-world-order",
    topRisks: ["Supply-chain resilience", "Geopolitics", "Climate transition", "Tech disruption"],
    summary:
      "Stresses building structural supply-chain resilience against a backdrop of geopolitical fragmentation and accelerating climate-transition requirements.",
    domains: ["trade", "geo", "clim"],
  },
  {
    id: "r18",
    publisher: "BCG",
    mark: "BCG",
    markColor: "var(--d-clim)",
    title: "Risk and Compliance 2026: Refining Oversight",
    date: "Mar 12, 2026",
    horizon: "2-year",
    url: "https://www.bcg.com/capabilities/risk-management-compliance/insights",
    topRisks: ["Regulatory divergence", "Geopolitical compliance", "GenAI security gaps", "Resilience auditing"],
    summary:
      "Discusses refining compliance frameworks for a volatile, AI-driven world. Recommends aligning risk oversight with emerging AI models and auditing geopolitical vulnerabilities.",
    domains: ["reg", "tech", "geo"],
  },
  {
    id: "r19",
    publisher: "Bain & Company",
    mark: "Bain",
    markColor: "#cc0000",
    title: "Bain Technology Report 2025",
    date: "Sep 24, 2025",
    horizon: "12-month",
    url: "https://www.bain.com/insights/topics/technology-report/",
    topRisks: ["AI agent security", "Hardware supply bottlenecks", "Cloud dependency risk", "Talent constraints"],
    summary:
      "Examines structural shifts in the tech sector, detailing generative AI infrastructure dependencies, sovereignty restrictions on semiconductors, and model verification risks.",
    domains: ["tech", "fin", "trade"],
  },
  {
    id: "r20",
    publisher: "Bain & Company",
    mark: "Bain",
    markColor: "#cc0000",
    title: "Bain Global M&A Report 2026",
    date: "Jan 27, 2026",
    horizon: "2-year",
    url: "https://www.bain.com/insights/topics/global-ma-report/",
    topRisks: ["Geopolitical deal friction", "AI capability acquisition", "Valuation volatility", "Regulatory review delays"],
    summary:
      "Highlights key M&A trends for corporate growth. Advises leaders to navigate protectionist foreign investment reviews and capture AI synergies with resilience.",
    domains: ["fin", "geo", "tech"],
  },
];

const SYNTHESIS = [
  {
    domain: "geo",
    consensus: "high",
    note: "Near-universal: geopolitical confrontation now treated as a structural, persistent risk rather than a tail event.",
  },
  {
    domain: "trade",
    consensus: "high",
    note: "Strong agreement that trade fragmentation and tariffs are a top near-term drag on growth and cost.",
  },
  {
    domain: "tech",
    consensus: "high",
    note: "Consensus that cyber and AI-governance risk is rising fastest; framed as both threat and opportunity.",
  },
  {
    domain: "fin",
    consensus: "med",
    note: "Partial divergence on whether inflation re-anchors higher or eases; debt-stress emphasis varies by source.",
  },
  {
    domain: "clim",
    consensus: "med",
    note: "Agreement on long-run severity, but divergence on near-term prioritisation vs geopolitical and macro risks.",
  },
  {
    domain: "reg",
    consensus: "med",
    note: "Advisory firms stress regulatory complexity; multilaterals emphasise it less directly.",
  },
  {
    domain: "soc",
    consensus: "low",
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
              Expert Voices
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
              gridTemplateColumns: "150px 92px 1fr 132px",
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
            const sourcesCiting = REPORTS.filter((r) => r.domains.includes(s.domain)).length;
            return (
              <div
                key={s.domain}
                className="synth-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "150px 92px 1fr 132px",
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
                    {Array.from({ length: REPORTS.length }).map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 2.5,
                          height: 14,
                          borderRadius: 1,
                          background: i < sourcesCiting ? `var(--d-${s.domain})` : "var(--bg4)",
                        }}
                      ></span>
                    ))}
                  </div>
                  <span
                    className="serif num"
                    style={{ fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: "right" }}
                  >
                    {sourcesCiting}/{REPORTS.length}
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
            <div
              className="report-card fade-up"
              key={r.id}
              onClick={() => window.open(r.url, "_blank", "noopener,noreferrer")}
            >
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
