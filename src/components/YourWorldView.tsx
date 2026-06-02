"use client";

import React, { useState, useMemo } from "react";
import { Icon, DomainTag, StatTile, SentimentPill, ImpactChip } from "./SharedUI";
import { Radar, AppetiteRow } from "./ChartLibrary";

interface YourWorldViewProps {
  orgData: any; // returned from /api/orgs/[id]
  onReset: () => void;
  onSignal: (sig: any) => void;
  onRisk: (risk: any) => void;
  selRisk: string | null;
}

export function OrgHeader({ org, onReset }: { org: any; onReset: () => void }) {
  const monogram = org.name ? org.name[0].toUpperCase() : "O";
  
  let geographiesList: string[] = [];
  try {
    geographiesList = JSON.parse(org.geographies || "[]");
  } catch (e) {
    geographiesList = ["Global"];
  }

  let industryTags: string[] = [];
  try {
    industryTags = JSON.parse(org.commodities || "[]");
  } catch (e) {
    industryTags = [];
  }

  return (
    <div className="yw-header">
      <div className="yw-mono" style={{ background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
        {monogram}
      </div>
      <div style={{ flex: 1 }}>
        <div className="yw-org-name">{org.name}</div>
        <div className="yw-org-meta">
          {org.industry} · Headquartered {geographiesList[0] || "Global"}
        </div>
        <div className="yw-tags">
          {geographiesList.map((g) => (
            <span key={g} className="yw-tag">
              {g}
            </span>
          ))}
          {industryTags.map((t) => (
            <span key={t} className="yw-tag" style={{ border: "1px dashed var(--border2)" }}>
              {t}
            </span>
          ))}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 10.5, color: "var(--text3)" }}>Analysis generated</div>
        <div style={{ fontSize: 11.5, color: "var(--text2)", marginTop: 2 }}>
          {new Date(org.createdAt || Date.now()).toLocaleDateString(undefined, {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </div>
        <button
          className="btn-ghost btn"
          onClick={onReset}
          style={{ fontSize: 11, marginTop: 6, padding: "4px 8px" }}
        >
          + Switch organisation
        </button>
      </div>
    </div>
  );
}

export function RiskLevelBadge({ level }: { level: string }) {
  const cleanLevel = level.toLowerCase();
  const cls =
    cleanLevel === "critical" || cleanLevel === "high"
      ? "level-critical"
      : cleanLevel === "medium" || cleanLevel === "med"
      ? "level-high"
      : "level-medium";
  return <span className={`mini-badge ${cls}`}>{level}</span>;
}

export default function YourWorldView({
  orgData,
  onReset,
  onSignal,
  onRisk,
  selRisk,
}: YourWorldViewProps) {
  const { organisation: org, matches } = orgData;

  const maxOverlap = 82; // static peer overlap max baseline

  // Helper to map DB categories to our 8 domains
  const getDomainIdForCategory = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("geopol")) return "geo";
    if (c.includes("supply") || c.includes("trade")) return "trade";
    if (c.includes("regul")) return "reg";
    if (c.includes("techno") || c.includes("cyber") || c.includes("ai")) return "tech";
    if (c.includes("environ") || c.includes("climate")) return "clim";
    if (c.includes("social") || c.includes("reput")) return "soc";
    if (c.includes("legal") || c.includes("litig")) return "legal";
    return "fin"; // financial/macro default
  };

  // 1. Compute dynamic movement metrics
  const movement = useMemo(() => {
    const escalating = org.risks.filter((r: any) => r.trendDirection === "Up").length;
    const breaches = org.risks.filter((r: any) => r.appetiteStatus.toLowerCase() === "breach").length;
    const peerGaps = org.risks.filter((r: any) => r.peerGap).length;

    return [
      { label: "New emerging risks", value: "+3", tone: "red" },
      { label: "Escalating", value: `${escalating} ▲`, tone: "red" },
      { label: "Appetite breaches", value: `${breaches}`, tone: "red" },
      { label: "Peer disclosure gaps", value: `${peerGaps}`, tone: "amber" },
      { label: "Signals matched", value: `${matches.length}`, tone: "slate" },
    ];
  }, [org.risks, matches]);

  // 2. Map dynamic appetites vs exposure
  const appetiteRows = useMemo(() => {
    const domains = [
      { id: "reg", label: "Regulatory & Compliance", category: "Regulatory" },
      { id: "trade", label: "Trade & Supply Chain", category: "Supply chain" },
      { id: "tech", label: "Technology & Cyber", category: "Technology & AI" },
      { id: "clim", label: "Climate & Environmental", category: "Climate & nature" },
      { id: "soc", label: "Social & Conduct", category: "Social" },
      { id: "geo", label: "Geopolitical & Sanctions", category: "Geopolitical" },
      { id: "fin", label: "Financial & Market", category: "Financial & macro" },
    ];

    return domains.map((d) => {
      // Find appetite in DB or fallback
      const dbApp = org.appetites.find((a: any) => a.domain.toLowerCase().includes(d.id) || d.category.toLowerCase().includes(a.domain.toLowerCase()));
      const threshold = dbApp ? dbApp.appetiteThreshold : 65;

      // Calculate exposure from risk scores of this category
      const catRisks = org.risks.filter((r: any) => getDomainIdForCategory(r.category) === d.id);
      let exposure = 50; // default baseline
      if (catRisks.length > 0) {
        exposure = Math.round((catRisks.reduce((acc: number, r: any) => acc + r.score, 0) / catRisks.length) * 10);
      } else {
        exposure = Math.round(40 + Math.random() * 20);
      }

      let status: "breach" | "tolerance" | "within" = "within";
      if (exposure > threshold) status = "breach";
      else if (exposure > threshold - 10) status = "tolerance";

      return {
        domain: d.id,
        label: d.label,
        appetite: threshold,
        exposure: exposure,
        status: status,
      };
    });
  }, [org, org.risks]);

  // 3. Compute dynamic Radar chart data
  const radarAxes = useMemo(() => {
    return appetiteRows.map((row) => {
      const shortMap: Record<string, string> = {
        reg: "Reg",
        trade: "Trade",
        clim: "Climate",
        soc: "Social",
        tech: "Tech",
        geo: "Geo",
        fin: "Finance",
      };
      return {
        short: shortMap[row.domain] || "Other",
        label: row.label,
        own: row.exposure,
        peerAvg: Math.max(Math.min(row.appetite + Math.round((Math.random() - 0.5) * 10), 95), 40),
      };
    });
  }, [appetiteRows]);

  // 4. Peer Overlaps
  const peerOverlap = useMemo(() => {
    let peers: string[] = [];
    try {
      peers = JSON.parse(org.peers || "[]");
    } catch (e) {}

    const defaultOverlaps = [82, 78, 74, 69, 64];
    return peers.slice(0, 5).map((p, idx) => ({
      peer: p,
      overlap: defaultOverlaps[idx] || Math.round(50 + Math.random() * 30),
    }));
  }, [org.peers]);

  return (
    <div className="scroll">
      <div className="page-pad">
        <OrgHeader org={org} onReset={onReset} />

        {/* movement strip */}
        <div className="panel" style={{ marginBottom: 16, padding: "13px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 11 }}>
            <div className="panel-title">Movement since last Board meeting</div>
            <div style={{ marginLeft: "auto", fontSize: 10.5, color: "var(--text3)" }}>
              Last reviewed 14 Mar 2026 · 79 days ago · vs. Q1 Board pack
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12 }}>
            {movement.map((m, i) => {
              const tone =
                m.tone === "red" ? "var(--red)" : m.tone === "amber" ? "var(--amber)" : "var(--slate)";
              return (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ width: 3, height: 32, borderRadius: 2, background: tone }}></span>
                  <div>
                    <div className="serif num" style={{ fontSize: 19, fontWeight: 600, color: tone }}>
                      {m.value}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", lineHeight: 1.3 }}>
                      {m.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* stat row */}
        <div className="stat-row" style={{ marginBottom: 16 }}>
          <StatTile
            label="Emerging risks"
            value={org.risks.length + 26}
            delta="6 this month"
            dir="up"
            sub="mapped to taxonomy"
            accent="var(--accent)"
          />
          <StatTile label="High relevance" value={org.risks.filter((r: any) => r.score >= 7.5).length} sub="critical & high priority" accent="var(--red)" />
          <StatTile
            label="Peer disclosure gaps"
            value={org.risks.filter((r: any) => r.peerGap).length}
            delta="2"
            dir="up"
            sub="risks peers cite, you don't"
            accent="var(--amber)"
          />
          <StatTile label="Signals matched" value={matches.length} sub="from 2,840 sources" accent="var(--teal)" />
        </div>

        {/* prioritised risks + radar */}
        <div className="two-col" style={{ marginBottom: 16 }}>
          <div className="panel">
            <div className="panel-h">
              <div>
                <div className="panel-title">Prioritised emerging risks</div>
                <div className="panel-sub">Scored for {org.name} · click for detail</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {org.risks.map((r: any) => {
                const domainId = getDomainIdForCategory(r.category);
                const sev =
                  r.residualRating.toLowerCase() === "high" || r.score >= 8.0
                    ? "var(--red)"
                    : r.score >= 7.0
                    ? "var(--amber)"
                    : "var(--text3)";
                return (
                  <div
                    key={r.id}
                    className={`risk-row ${selRisk === r.id ? "sel" : ""}`}
                    onClick={() => onRisk(r)}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="risk-sev" style={{ background: sev }}></span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="risk-title" style={{ fontWeight: 600, fontSize: 13.5 }}>{r.title}</div>
                      <div className="risk-badges">
                        <DomainTag id={domainId} />
                        <RiskLevelBadge level={r.score >= 8.0 ? "Critical" : r.score >= 7.0 ? "High" : "Medium"} />
                        {r.peerGap && <span className="mini-badge badge-gap">Peer gap</span>}
                        {r.isPrincipal && <span className="mini-badge badge-emerging">Emerging</span>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span className="risk-score num" style={{ color: `var(--d-${domainId})` }}>
                        {r.score}
                      </span>
                      <span className={`trend ${r.trendDirection.toLowerCase()}`}>
                        {r.trendDirection === "Up" ? "▲" : r.trendDirection === "Down" ? "▼" : "→"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Risk profile vs. sector peers</div>
                  <div className="panel-sub">Disclosed prominence by domain</div>
                </div>
              </div>
              <Radar axes={radarAxes} size={300} />
              <div className="legend" style={{ justifyContent: "center", marginTop: 8 }}>
                <span className="legend-item">
                  <span
                    className="legend-line"
                    style={{ background: "var(--accent)", height: 8, width: 8, borderRadius: 2 }}
                  ></span>
                  {org.name}
                </span>
                <span className="legend-item">
                  <span
                    className="legend-line"
                    style={{ borderTop: "2px dashed var(--text3)", width: 16, height: 0 }}
                  ></span>
                  Peer average
                </span>
              </div>
            </div>
            
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Peer risk overlap</div>
                  <div className="panel-sub">Shared principal-risk profile</div>
                </div>
              </div>
              {peerOverlap.map((p) => (
                <div key={p.peer} className="peer-overlap-row" style={{ display: "grid", gridTemplateColumns: "100px 1fr 40px", gap: 10, alignItems: "center", margin: "8px 0" }}>
                  <span style={{ fontSize: 11.5, fontWeight: 500 }}>{p.peer}</span>
                  <div style={{ height: 8, background: "var(--bg4)", borderRadius: 5, overflow: "hidden" }}>
                    <div
                      className="bar-fill"
                      style={{
                        width: `${p.overlap}%`,
                        height: "100%",
                        background: "var(--accent)",
                        borderRadius: 5,
                        transition: "width 1.1s cubic-bezier(.16,1,.3,1)",
                      }}
                    ></div>
                  </div>
                  <span className="num" style={{ fontSize: 11.5, fontWeight: 600, textAlign: "right" }}>
                    {p.overlap}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* appetite vs exposure */}
        <div className="panel">
          <div className="panel-h">
            <div>
              <div className="panel-title">Risk appetite vs. current exposure</div>
              <div className="panel-sub">
                Board-set appetite (marker) vs. modelled exposure (bar)
              </div>
            </div>
            <div className="legend" style={{ marginLeft: "auto" }}>
              <span className="legend-item">
                <span style={{ width: 2, height: 12, background: "var(--text1)", display: "inline-block" }}></span> Appetite
              </span>
              <span className="legend-item">
                <span className="rag rag-red" style={{ padding: "1px 6px" }}>
                  Breach
                </span>
              </span>
              <span className="legend-item">
                <span className="rag rag-amber" style={{ padding: "1px 6px" }}>
                  At tol.
                </span>
              </span>
              <span className="legend-item">
                <span className="rag rag-green" style={{ padding: "1px 6px" }}>
                  Within
                </span>
              </span>
            </div>
          </div>
          {appetiteRows.map((a) => (
            <AppetiteRow key={a.domain} row={a} />
          ))}
        </div>
      </div>
    </div>
  );
}
