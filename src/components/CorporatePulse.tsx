"use client";

import React, { useState } from "react";
import { Icon, DomainTag, StatTile } from "./SharedUI";
import { BumpChart } from "./ChartLibrary";

const INDICES = [
  { id: "ftse100", label: "FTSE 100", companies: 100, filed: 94 },
  { id: "sp500", label: "S&P 500", companies: 500, filed: 471 },
  { id: "stoxx", label: "EURO STOXX 50", companies: 50, filed: 48 },
];

const CITED_RISKS = [
  { id: "cr1", risk: "Cyber-attack & data security", domain: "tech", cite: 91, prevQ: 88, rank: 1, prevRank: 1 },
  { id: "cr2", risk: "Geopolitical instability", domain: "geo", cite: 86, prevQ: 74, rank: 2, prevRank: 4 },
  { id: "cr3", risk: "Regulatory & compliance change", domain: "reg", cite: 84, prevQ: 80, rank: 3, prevRank: 3 },
  { id: "cr4", risk: "Macroeconomic & inflation", domain: "fin", cite: 81, prevQ: 85, rank: 4, prevRank: 2 },
  { id: "cr5", risk: "Climate transition & physical", domain: "clim", cite: 78, prevQ: 69, rank: 5, prevRank: 6 },
  { id: "cr6", risk: "Supply-chain disruption", domain: "trade", cite: 76, prevQ: 71, rank: 6, prevRank: 5 },
  { id: "cr7", risk: "Talent & workforce", domain: "soc", cite: 64, prevQ: 66, rank: 7, prevRank: 7 },
  { id: "cr8", risk: "AI governance & adoption", domain: "tech", cite: 61, prevQ: 38, rank: 8, prevRank: 14 },
  { id: "cr9", risk: "Tariffs & trade policy", domain: "trade", cite: 58, prevQ: 33, rank: 9, prevRank: 16 },
  { id: "cr10", risk: "Sanctions & export controls", domain: "geo", cite: 54, prevQ: 41, rank: 10, prevRank: 12 },
  { id: "cr11", risk: "Litigation & legal liability", domain: "legal", cite: 49, prevQ: 47, rank: 11, prevRank: 10 },
  { id: "cr12", risk: "Reputational & brand", domain: "soc", cite: 46, prevQ: 44, rank: 12, prevRank: 11 },
];

const SECTOR_BREAKDOWN = [
  { sector: "Financials", geo: 72, trade: 41, reg: 88, fin: 79, tech: 84, clim: 61, soc: 52, legal: 58 },
  { sector: "Consumer", geo: 64, trade: 81, reg: 70, fin: 66, tech: 58, clim: 74, soc: 69, legal: 44 },
  { sector: "Industrials", geo: 70, trade: 86, reg: 62, fin: 60, tech: 55, clim: 64, soc: 41, legal: 39 },
  { sector: "Technology", geo: 58, trade: 49, reg: 76, fin: 54, tech: 92, clim: 38, soc: 47, legal: 63 },
  { sector: "Energy", geo: 81, trade: 52, reg: 79, fin: 57, tech: 44, clim: 89, soc: 48, legal: 55 },
  { sector: "Healthcare", geo: 47, trade: 44, reg: 84, fin: 51, tech: 66, clim: 36, soc: 58, legal: 71 },
];

const DISCLOSURE_SNIPPETS: Record<string, Array<{ co: string; text: string }>> = {
  cr2: [
    {
      co: "Global bank (Financials)",
      text: '"Heightened geopolitical tensions and the risk of further conflict or sanctions escalation could adversely affect markets in which we operate, our counterparties and our supply of services."',
    },
    {
      co: "Industrial group",
      text: '"We are exposed to geopolitical instability through our manufacturing footprint and the routing of critical inputs through affected trade corridors."',
    },
    {
      co: "Consumer goods company",
      text: '"Geopolitical events, including sanctions and trade restrictions, may disrupt sourcing, distribution and demand across our principal markets."',
    },
  ],
  cr9: [
    {
      co: "Consumer goods company",
      text: '"Changes in tariff and trade policy could increase input costs and require us to re-evaluate our sourcing and pricing strategies."',
    },
    {
      co: "Automotive manufacturer",
      text: '"The imposition of new or increased tariffs could materially affect our cost base and the competitiveness of our exported products."',
    },
  ],
  cr8: [
    {
      co: "Technology company",
      text: '"The evolving regulatory landscape for artificial intelligence, including the EU AI Act, may impose new governance, documentation and assurance obligations."',
    },
    {
      co: "Financial services group",
      text: '"Adoption of AI introduces model-governance, conduct and operational-resilience risks that require enhanced oversight and controls."',
    },
  ],
};

const DOMAINS_LIST = [
  { id: "geo", short: "Geopolitical" },
  { id: "trade", short: "Trade & Supply" },
  { id: "reg", short: "Regulatory" },
  { id: "fin", short: "Financial" },
  { id: "tech", short: "Tech & Cyber" },
  { id: "clim", short: "Climate" },
  { id: "soc", short: "Social & Conduct" },
  { id: "legal", short: "Legal" },
];

export default function CorporatePulse() {
  const [indexId, setIndexId] = useState("ftse100");
  const [selRisk, setSelRisk] = useState<string | null>(null);

  const idx = INDICES.find((i) => i.id === indexId) || INDICES[0];
  const maxCite = Math.max(...CITED_RISKS.map((r) => r.cite));

  const heatColor = (v: number) => {
    if (v >= 75) return { background: "var(--red-l)", color: "var(--red)" };
    if (v >= 55) return { background: "var(--amber-l)", color: "var(--amber)" };
    return { background: "var(--green-l)", color: "var(--green)" };
  };

  return (
    <div className="scroll">
      <div className="page-pad">
        <div className="briefing-head" style={{ marginBottom: 10 }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 6 }}>
              Corporate Risk Pulse
            </div>
            <div className="briefing-title">What companies are disclosing</div>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>Index</span>
            <select
              className="select"
              value={indexId}
              onChange={(e) => setIndexId(e.target.value)}
            >
              {INDICES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="summary-callout">
          <div className="ico">
            <Icon name="building" size={18} />
          </div>
          <p>
            <b>Across {idx.filed} of {idx.companies} {idx.label} annual reports and filings swept this quarter,</b>{" "}
            geopolitical instability, AI governance and tariff/trade policy are the fastest-rising
            principal risks — AI governance has climbed six places and tariffs eight quarter-on-quarter.
            Cyber security remains the single most-cited risk for a fourth consecutive quarter.
          </p>
        </div>

        {/* stat row */}
        <div className="stat-row" style={{ marginBottom: 20 }}>
          <StatTile
            label="Filings swept"
            value={idx.filed}
            sub={`of ${idx.companies} ${idx.label} constituents`}
            accent="var(--accent)"
          />
          <StatTile label="Distinct risks tracked" value="38" sub="mapped to 8 domains" accent="var(--d-reg)" />
          <StatTile
            label="Fastest riser"
            value="▲ 6"
            dir="up"
            sub="AI governance · climbed to 8th"
            accent="var(--d-tech)"
          />
          <StatTile
            label="Biggest faller"
            value="▼ 2"
            dir="down"
            sub="Macro & inflation · fell to 4th"
            accent="var(--d-fin)"
          />
        </div>

        <div className="two-col" style={{ marginBottom: 14 }}>
          {/* QoQ movement bump chart */}
          <div className="panel">
            <div className="panel-h">
              <div>
                <div className="panel-title">Quarter-on-quarter risk movement</div>
                <div className="panel-sub">
                  How risk prominence is shifting across the index · rank Q1 → Q2 2026
                </div>
              </div>
            </div>
            <BumpChart
              rows={CITED_RISKS.map((r) => ({
                id: r.id,
                domain: r.domain,
                risk: r.risk,
                rank: r.rank,
                prevRank: r.prevRank,
              }))}
              onClick={(r: any) => setSelRisk(r.id === selRisk ? null : r.id)}
            />
          </div>
          
          {/* most-cited leaderboard */}
          <div className="panel">
            <div className="panel-h">
              <div>
                <div className="panel-title">Most-cited risks</div>
                <div className="panel-sub">% of filings citing · click to drill down</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {CITED_RISKS.slice(0, 10).map((r) => {
                const mv = r.prevRank - r.rank;
                return (
                  <div
                    key={r.id}
                    className={`leaderboard-row ${selRisk === r.id ? "sel" : ""}`}
                    onClick={() => setSelRisk(r.id === selRisk ? null : r.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="lb-rank num">{r.rank}</div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="lb-risk" style={{ fontWeight: 600, fontSize: 13 }}>{r.risk}</div>
                      <div style={{ marginTop: 3 }}>
                        <DomainTag id={r.domain} />
                      </div>
                    </div>
                    <div className="lb-cite">
                      <div className="lb-cite-bar">
                        <div
                          className="bar-fill"
                          style={{
                            width: `${(r.cite / maxCite) * 100}%`,
                            height: "100%",
                            background: `var(--d-${r.domain})`,
                            borderRadius: 4,
                            transition: "width 1s",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end", minWidth: 60 }}>
                      <span className="serif num" style={{ fontSize: 13, fontWeight: 600 }}>
                        {r.cite}%
                      </span>
                      <span
                        className={`trend ${mv > 0 ? "up" : mv < 0 ? "down" : "flat"}`}
                        style={{ fontSize: 9, minWidth: 22 }}
                      >
                        {mv > 0 ? `▲${mv}` : mv < 0 ? `▼${Math.abs(mv)}` : "—"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* drill-down */}
        {selRisk && (() => {
          const r = CITED_RISKS.find((x) => x.id === selRisk);
          if (!r) return null;
          const snippets = DISCLOSURE_SNIPPETS[selRisk];
          return (
            <div className="panel fade-up" style={{ marginBottom: 14, borderColor: "var(--border2)" }}>
              <div className="panel-h">
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <DomainTag id={r.domain} full />
                  <div className="panel-title">
                    {r.risk} — representative disclosures
                  </div>
                </div>
                <div style={{ marginLeft: "auto", fontSize: 11, color: "var(--text3)" }}>
                  Cited by {r.cite}% of filings · rank {r.prevRank} → {r.rank}
                </div>
                <button
                  className="nav-icon-btn"
                  onClick={() => setSelRisk(null)}
                  style={{ width: 28, height: 28 }}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
              {snippets ? (
                <div className="grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 16 }}>
                  {snippets.map((s, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "13px 15px",
                        background: "var(--bg3)",
                        borderRadius: 9,
                        borderLeft: `3px solid var(--d-${r.domain})`,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 12.5,
                          lineHeight: 1.6,
                          color: "var(--text1)",
                          fontFamily: "var(--serif)",
                          fontStyle: "italic",
                        }}
                      >
                        {s.text}
                      </div>
                      <div style={{ fontSize: 10.5, color: "var(--text3)", marginTop: 9, fontWeight: 600 }}>
                        — {s.co}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12, color: "var(--text2)", lineHeight: 1.6 }}>
                  This risk is cited by {r.cite}% of {idx.label} filings and has moved from rank{" "}
                  {r.prevRank} to {r.rank} quarter-on-quarter. Representative disclosure snippets and
                  the full list of citing companies would surface here in the live product.
                </div>
              )}
            </div>
          );
        })()}

        {/* sector breakdown */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <div className="panel-title">Risk emphasis by sector</div>
              <div className="panel-sub">
                % of sector filings citing each domain · heat-shaded
              </div>
            </div>
            <div className="legend" style={{ marginLeft: "auto" }}>
              <span className="legend-item">
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: "var(--red-l)",
                    border: "1px solid var(--border)",
                  }}
                ></span>
                High (75+)
              </span>
              <span className="legend-item">
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: "var(--amber-l)",
                    border: "1px solid var(--border)",
                  }}
                ></span>
                Med (55–74)
              </span>
              <span className="legend-item">
                <span
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 3,
                    background: "var(--green-l)",
                    border: "1px solid var(--border)",
                  }}
                ></span>
                Lower
              </span>
            </div>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table className="sector-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: 10 }}>Sector</th>
                  {DOMAINS_LIST.map((d) => (
                    <th key={d.id} style={{ padding: 10 }}>{d.short}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SECTOR_BREAKDOWN.map((row) => (
                  <tr key={row.sector} style={{ borderTop: "1px solid var(--border)" }}>
                    <td style={{ padding: 10, fontWeight: 500 }}>{row.sector}</td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.geo)}>{row.geo}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.trade)}>{row.trade}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.reg)}>{row.reg}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.fin)}>{row.fin}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.tech)}>{row.tech}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.clim)}>{row.clim}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.soc)}>{row.soc}</span>
                    </td>
                    <td style={{ padding: 6, textAlign: "center" }}>
                      <span className="heat-cell num" style={heatColor(row.legal)}>{row.legal}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
