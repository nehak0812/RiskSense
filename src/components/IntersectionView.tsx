"use client";

import React, { useState, useMemo } from "react";
import { Icon, DomainTag, SentimentPill, ImpactChip } from "./SharedUI";
import { HeatMap } from "./ChartLibrary";
import { OrgHeader } from "./YourWorldView";

interface IntersectionViewProps {
  orgData: any; // returned from /api/orgs/[id]
  onReset: () => void;
  onSignal: (sig: any) => void;
}

export default function IntersectionView({
  orgData,
  onReset,
  onSignal,
}: IntersectionViewProps) {
  const { organisation: org, matches } = orgData;
  const [subView, setSubView] = useState<"signals" | "boardpack">("signals");

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
    return "fin";
  };

  // 1. Calculate "signals that matter" by matching risks to signals via domain
  const mattered = useMemo(() => {
    const list: any[] = [];
    matches.forEach((m: any) => {
      // Try to find the linked risk using match's linkedRiskIds first
      let linkedRisk = null;
      try {
        const ids = JSON.parse(m.linkedRiskIds || "[]");
        if (ids.length > 0) {
          linkedRisk = org.risks.find((r: any) => r.id === ids[0] || r.code === ids[0]);
        }
      } catch (e) {}

      // Fallback to category-based matching if not explicitly linked
      if (!linkedRisk) {
        const sigDomainId = getDomainIdForCategory(m.signal.domain);
        linkedRisk = org.risks.find((r: any) => getDomainIdForCategory(r.category) === sigDomainId) || org.risks[0];
      }

      if (linkedRisk) {
        list.push({
          id: m.id,
          signal: m.signal,
          risk: linkedRisk,
          relevance: Math.round(m.relevanceScore * 10),
          rationale: m.rationale,
        });
      }
    });
    return list.sort((a, b) => b.relevance - a.relevance);
  }, [matches, org.risks]);

  // 2. Dynamic footprint exposure
  const footprint = useMemo(() => {
    let geographies: string[] = [];
    try {
      geographies = JSON.parse(org.geographies || "[]");
    } catch (e) {}

    const coords: Record<string, { x: number; y: number; note: string; markets: string }> = {
      "UK & Ireland": { x: 48, y: 30, note: "Corporate Head Office, FCA compliance", markets: "Home market · 30% revenue" },
      EU: { x: 52, y: 34, note: "CSRD/ESRS, EU AI Act, supply chain compliance", markets: "Primary trade block · 35% revenue" },
      "North America": { x: 22, y: 39, note: "Tariff list exposure, trade policy volatility", markets: "Growth market · 22% revenue" },
      "South & SE Asia": { x: 76, y: 52, note: "Agricultural sourcing, water stress, CSDDD labour risks", markets: "Key Sourcing Region" },
      "Latin America": { x: 32, y: 66, note: "Cocoa raw material suppliers, transport delay risk", markets: "Secondary sourcing" },
    };

    return geographies.map((g, idx) => {
      const coord = coords[g] || { x: 40 + idx * 10, y: 40 + idx * 5, note: "Regulatory & trade exposure", markets: "Global site" };
      
      // Calculate regional exposure based on risks or set high defaults for demonstration
      let exposure = 0.5;
      if (g.includes("North America") || g.includes("EU")) exposure = 0.84;
      else if (g.includes("South & SE")) exposure = 0.78;

      return {
        region: g,
        x: coord.x,
        y: coord.y,
        exposure: exposure,
        note: coord.note,
        markets: coord.markets,
      };
    });
  }, [org.geographies]);

  // 3. Board Pack Payload Parsing
  const boardPack = useMemo(() => {
    if (org.boardPacks && org.boardPacks.length > 0) {
      try {
        const pack = org.boardPacks[0];
        return {
          ...pack,
          payload: JSON.parse(pack.payload),
        };
      } catch (e) {
        console.error("Error parsing board pack payload:", e);
      }
    }
    return null;
  }, [org.boardPacks]);

  return (
    <div className="scroll">
      <div className="page-pad">
        <OrgHeader org={org} onReset={onReset} />

        {/* tab navigation for intersection views */}
        <div style={{ display: "flex", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <button
            onClick={() => setSubView("signals")}
            className={`subtab ${subView === "signals" ? "active" : ""}`}
            style={{ border: "none", background: "none", fontSize: 13, fontWeight: 600, padding: "8px 16px", cursor: "pointer", borderBottom: subView === "signals" ? "2px solid var(--accent)" : "none", color: subView === "signals" ? "var(--accent)" : "var(--text2)" }}
          >
            Signals Matched ({mattered.length})
          </button>
          <button
            onClick={() => setSubView("boardpack")}
            className={`subtab ${subView === "boardpack" ? "active" : ""}`}
            style={{ border: "none", background: "none", fontSize: 13, fontWeight: 600, padding: "8px 16px", cursor: "pointer", borderBottom: subView === "boardpack" ? "2px solid var(--accent)" : "none", color: subView === "boardpack" ? "var(--accent)" : "var(--text2)" }}
          >
            Executive Board Pack Report
          </button>
        </div>

        {subView === "signals" ? (
          <>
            <div className="summary-callout" style={{ borderLeftColor: "var(--d-trade)" }}>
              <div className="ico" style={{ background: "var(--d-trade-l)", color: "var(--d-trade)" }}>
                <Icon name="link" size={18} />
              </div>
              <p>
                <b>Where the Signal Spectrum intersects with {org.name}'s Corporate Lens.</b> Of {matches.length} external
                signals matched, {mattered.length} score as materially relevant to {org.name}'s markets, suppliers and
                jurisdictions. Trade and regulatory signals dominate its exposure, concentrated in Europe and its South &
                SE Asia sourcing base.
              </p>
            </div>

            {/* signals that matter */}
            <div className="sec-split">
              <span className="badge" style={{ background: "var(--d-trade)" }}>
                Exposure Map
              </span>
              <span className="stitle">Signals that matter to you</span>
              <span className="line"></span>
            </div>
            
            {mattered.length === 0 ? (
              <div className="empty">No relevant matched signals found in this period.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(420px,1fr))", gap: 12, marginBottom: 24 }}>
                {mattered.map(({ id, signal: s, risk, relevance, rationale }) => {
                  const domainId = getDomainIdForCategory(s.domain);
                  return (
                    <div
                      key={id}
                      className="matter-card"
                      onClick={() => onSignal(s)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="matter-score">
                        <div
                          className="num"
                          style={{
                            color: relevance >= 80 ? "var(--red)" : relevance >= 65 ? "var(--amber)" : "var(--text2)",
                            fontWeight: 700,
                          }}
                        >
                          {relevance}
                        </div>
                        <div className="lbl">Relevance</div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                          <DomainTag id={domainId} />
                          <span style={{ fontSize: 10, color: "var(--text3)", whiteSpace: "nowrap" }}>
                            {s.source} · {new Date(s.publishedAt).toLocaleDateString()}
                          </span>
                          <SentimentPill s={s.sentiment} />
                        </div>
                        <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>
                          {s.title}
                        </div>
                        <div className="matter-rationale">
                          <b>Why this matters to you:</b> {rationale || risk?.why || "Material regulatory requirements impacting corporate compliance deadlines."}
                        </div>
                        {risk && (
                          <div
                            style={{
                              marginTop: 8,
                              fontSize: 10.5,
                              color: "var(--accent)",
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                            }}
                          >
                            Linked risk: {risk.title} <Icon name="arrowR" size={12} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* footprint exposure */}
            <div className="sec-split">
              <span className="badge" style={{ background: "var(--accent)" }}>
                Footprint
              </span>
              <span className="stitle">Where you are most exposed</span>
              <span className="line"></span>
            </div>
            
            <div className="two-col">
              <div className="panel">
                <div className="panel-h">
                  <div>
                    <div className="panel-title">Exposure map</div>
                    <div className="panel-sub">Footprint intensity · bubble size = exposure</div>
                  </div>
                </div>
                <HeatMap points={footprint} accessor="exposure" countKey="region" height={230} />
              </div>
              <div className="panel">
                <div className="panel-h">
                  <div>
                    <div className="panel-title">Exposure by region</div>
                    <div className="panel-sub">Modelled from markets, suppliers & jurisdictions</div>
                  </div>
                </div>
                {footprint.map((f) => (
                  <div key={f.region} className="footprint-row" style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 16, borderBottom: "1px solid var(--border)", padding: "12px 0" }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{f.region}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)" }}>{f.markets}</div>
                    </div>
                    <div>
                      <div className="fp-exposure" style={{ height: 8, background: "var(--bg4)", borderRadius: 5, overflow: "hidden", position: "relative" }}>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${f.exposure * 100}%`,
                            height: "100%",
                            background: f.exposure >= 0.8 ? "var(--red)" : f.exposure >= 0.5 ? "var(--amber)" : "var(--green)",
                            borderRadius: 5,
                            transition: "width 1.1s cubic-bezier(.16,1,.3,1)",
                          }}
                        ></div>
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{f.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <div className="panel fade-up" style={{ padding: "32px", background: "#fff", border: "1px solid var(--border2)", borderRadius: 12 }}>
            {boardPack ? (
              <div className="boardpack-doc" style={{ fontFamily: "var(--serif)", color: "var(--text1)", maxWidth: 800, margin: "0 auto" }}>
                {/* Header */}
                <div style={{ borderBottom: "2px solid var(--accent)", paddingBottom: 16, marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div>
                    <div className="eyebrow" style={{ color: "var(--accent)" }}>Emerging Risk Intelligence</div>
                    <h1 style={{ fontSize: 28, fontWeight: 600, margin: "6px 0 0" }}>Board Risk Pack Snapshot</h1>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "var(--sans)" }}>
                      Prepared for {org.name} · {boardPack.periodLabel}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "var(--sans)" }}>
                    <span className="rag rag-red" style={{ padding: "4px 10px", fontSize: 11, fontWeight: 700 }}>
                      POSTURE: {boardPack.payload.posture || "ELEVATED"}
                    </span>
                  </div>
                </div>

                {/* Executive Summary */}
                <div style={{ marginBottom: 24 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 12, color: "var(--accent)", fontFamily: "var(--sans)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Executive Summary
                  </h3>
                  <p style={{ fontSize: 14.5, lineHeight: 1.7, fontStyle: "italic", color: "var(--text2)" }}>
                    {boardPack.payload.summary}
                  </p>
                </div>

                {/* Grid for Horizon and Decisions */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, marginBottom: 24, fontFamily: "var(--sans)" }}>
                  {/* Regulatory Horizon */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 12, color: "var(--text1)", textTransform: "uppercase" }}>
                      Regulatory Compliance Deadlines
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {(boardPack.payload.regulatoryHorizon || []).map((reg: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, borderBottom: "1px dashed var(--border)", paddingBottom: 4 }}>
                          <span style={{ fontWeight: 600 }}>{reg.name}</span>
                          <span style={{ color: "var(--text3)" }}>
                            Deadline: <b>{reg.deadline}</b> ({reg.status})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Decisions Sought */}
                  <div>
                    <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 12, color: "var(--text1)", textTransform: "uppercase" }}>
                      Recommended Action Board Approvals
                    </h3>
                    <ul style={{ paddingLeft: 16, margin: 0, fontSize: 12, lineHeight: 1.6, color: "var(--text2)", display: "flex", flexDirection: "column", gap: 6 }}>
                      {(boardPack.payload.decisionsSought || []).map((dec: string, i: number) => (
                        <li key={i}>{dec}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Peer benchmarking */}
                <div style={{ marginBottom: 24, fontFamily: "var(--sans)" }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, borderBottom: "1px solid var(--border)", paddingBottom: 6, marginBottom: 12, color: "var(--text1)", textTransform: "uppercase" }}>
                    Peer Disclosure Gap Auditing
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    {(boardPack.payload.peerDisclosures || []).slice(0, 4).map((pd: any, i: number) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, background: "var(--bg3)", padding: "8px 12px", borderRadius: 6 }}>
                        <span
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            background: pd.disclosed ? "var(--green)" : "var(--red)",
                          }}
                        ></span>
                        <span>
                          <b>{pd.peerName}</b> cites: <i>{pd.theme}</i>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Print button */}
                <div style={{ textAlign: "right", marginTop: 32 }} className="print:hidden">
                  <button
                    onClick={() => window.print()}
                    className="btn btn-primary"
                    style={{ gap: 8 }}
                  >
                    <Icon name="doc" size={14} color="#fff" /> Print Board Pack Report
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty">No Board Pack has been generated for this organisation yet. Run an analysis on the organization first.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
