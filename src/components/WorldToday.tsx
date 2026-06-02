"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Sparkline, StackedVolume, TrendArea, RankedBars, SegmentBar, HeatMap } from "./ChartLibrary";
import { FilterRail, DomainTag, SentimentPill, ImpactChip, SignalCard, Icon } from "./SharedUI";

interface WorldTodayProps {
  onSignal: (sig: any) => void;
}

export default function WorldToday({ onSignal }: WorldTodayProps) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [filters, setFilters] = useState<{
    domain: string | null;
    impact: string | null;
    region: string | null;
    country: string | null;
  }>({
    domain: null,
    impact: null,
    region: null,
    country: null,
  });
  const [q, setQ] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeDomain, setActiveDomain] = useState<string | null>(null);

  const setFilterPatch = (patch: any) => setFilters((f) => ({ ...f, ...patch }));

  // Load signals
  const loadSignals = async (live = false) => {
    try {
      if (live) setSyncing(true);
      const res = await fetch(`/api/signals${live ? "?live=true" : ""}`);
      if (res.ok) {
        const data = await res.json();
        setSignals(data);
      }
    } catch (e) {
      console.error("Error loading signals:", e);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    loadSignals();
  }, []);

  // Compute counts dynamically
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: signals.length };
    
    // Domain counts
    const domains = ["geo", "trade", "reg", "fin", "tech", "clim", "soc", "legal"];
    domains.forEach((dId) => {
      c[dId] = signals.filter((s) => {
        const sd = s.domain.toLowerCase();
        return (
          sd.includes(dId) ||
          (dId === "geo" && sd.includes("geopol")) ||
          (dId === "trade" && sd.includes("supply")) ||
          (dId === "reg" && sd.includes("regul")) ||
          (dId === "tech" && sd.includes("techno")) ||
          (dId === "clim" && sd.includes("environ")) ||
          (dId === "soc" && sd.includes("social")) ||
          (dId === "legal" && sd.includes("legal")) ||
          (dId === "fin" && (sd.includes("finan") || sd.includes("macro")))
        );
      }).length;
    });

    // Impact counts
    ["high", "med", "low"].forEach((imp) => {
      c[imp] = signals.filter((s) => s.impact.toLowerCase() === imp).length;
    });

    // Region counts
    const regions = ["Global", "Americas", "Europe", "Asia-Pacific"];
    regions.forEach((r) => {
      c[r] = signals.filter((s) => {
        let geos: string[] = [];
        try {
          geos = JSON.parse(s.geographies || "[]");
        } catch (e) {}
        if (r === "Global") return geos.includes("Global") || geos.length === 0;
        if (r === "Americas") return geos.some((g) => ["US", "USA", "Americas", "Brazil", "Canada"].includes(g));
        if (r === "Europe") return geos.some((g) => ["EU", "UK", "Europe", "Spain", "Italy", "Germany", "France"].includes(g));
        if (r === "Asia-Pacific") return geos.some((g) => ["Asia", "Pacific", "Indonesia", "Singapore", "China", "India"].includes(g));
        return false;
      }).length;
    });

    return c;
  }, [signals]);

  // Extract all unique countries from signals for country select filter
  const allCountries = useMemo(() => {
    const list: string[] = [];
    signals.forEach((s) => {
      try {
        const geos = JSON.parse(s.geographies || "[]");
        geos.forEach((g: string) => {
          if (
            g &&
            g !== "Global" &&
            g !== "Europe" &&
            g !== "Americas" &&
            g !== "Asia" &&
            !list.includes(g)
          ) {
            list.push(g);
          }
        });
      } catch (e) {}
    });
    return list.sort();
  }, [signals]);

  // Filter signals
  const filteredSignals = useMemo(() => {
    return signals.filter((s) => {
      const sDomain = s.domain.toLowerCase();
      // Domain filter mapping
      if (filters.domain) {
        const dId = filters.domain;
        const matchesDomain =
          sDomain.includes(dId) ||
          (dId === "geo" && sDomain.includes("geopol")) ||
          (dId === "trade" && sDomain.includes("supply")) ||
          (dId === "reg" && sDomain.includes("regul")) ||
          (dId === "tech" && sDomain.includes("techno")) ||
          (dId === "clim" && sDomain.includes("environ")) ||
          (dId === "soc" && sDomain.includes("social")) ||
          (dId === "legal" && sDomain.includes("legal")) ||
          (dId === "fin" && (sDomain.includes("finan") || sDomain.includes("macro")));
        if (!matchesDomain) return false;
      }

      // Impact filter
      if (filters.impact && s.impact.toLowerCase() !== filters.impact) return false;

      // Region filter
      if (filters.region && filters.region !== "Global") {
        let geos: string[] = [];
        try {
          geos = JSON.parse(s.geographies || "[]");
        } catch (e) {}
        const r = filters.region;
        let matchesRegion = false;
        if (r === "Americas") matchesRegion = geos.some((g) => ["US", "USA", "Americas", "Brazil", "Canada"].includes(g));
        if (r === "Europe") matchesRegion = geos.some((g) => ["EU", "UK", "Europe", "Spain", "Italy", "Germany", "France"].includes(g));
        if (r === "Asia-Pacific") matchesRegion = geos.some((g) => ["Asia", "Pacific", "Indonesia", "Singapore", "China", "India"].includes(g));
        if (!matchesRegion) return false;
      }

      // Country filter
      if (filters.country) {
        let geos: string[] = [];
        try {
          geos = JSON.parse(s.geographies || "[]");
        } catch (e) {}
        if (!geos.includes(filters.country)) return false;
      }

      // Text search query
      if (q) {
        const query = q.toLowerCase();
        const headline = (s.title || "").toLowerCase();
        const summary = (s.summary || "").toLowerCase();
        const source = (s.source || "").toLowerCase();
        const domain = (s.domain || "").toLowerCase();
        if (
          !headline.includes(query) &&
          !summary.includes(query) &&
          !source.includes(query) &&
          !domain.includes(query)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [signals, filters, q]);

  // Compute momentum and rank rows dynamically
  const rankedRows = useMemo(() => {
    const domains = [
      { id: "geo", label: "Geopolitical", color: "var(--d-geo)" },
      { id: "trade", label: "Trade & Supply", color: "var(--d-trade)" },
      { id: "reg", label: "Regulatory", color: "var(--d-reg)" },
      { id: "tech", label: "Tech & Cyber", color: "var(--d-tech)" },
      { id: "clim", label: "Climate", color: "var(--d-clim)" },
      { id: "fin", label: "Financial", color: "var(--d-fin)" },
      { id: "soc", label: "Social & Conduct", color: "var(--d-soc)" },
      { id: "legal", label: "Legal", color: "var(--d-legal)" },
    ];

    return domains
      .map((d) => ({
        id: d.id,
        label: d.label,
        value: counts[d.id] || 0,
        color: d.color,
        trend: (counts[d.id] || 0) > 8 ? "up" : "flat",
      }))
      .sort((a, b) => b.value - a.value);
  }, [counts]);

  const maxCount = useMemo(() => {
    return Math.max(...rankedRows.map((r) => r.value), 1);
  }, [rankedRows]);

  const volumeWeeks = ["12w", "11w", "10w", "9w", "8w", "7w", "6w", "5w", "4w", "3w", "2w", "This wk"];
  const volumeByDomain = {
    geo: [6, 7, 6, 8, 7, 9, 8, 10, 9, 11, 10, counts.geo || 11],
    trade: [4, 5, 6, 5, 7, 6, 8, 7, 9, 8, 9, counts.trade || 10],
    reg: [5, 5, 6, 6, 7, 7, 8, 8, 7, 9, 8, counts.reg || 9],
    fin: [3, 4, 3, 5, 4, 5, 6, 5, 7, 6, 7, counts.fin || 7],
    tech: [4, 4, 5, 5, 6, 6, 7, 7, 8, 7, 8, counts.tech || 8],
    clim: [3, 3, 4, 4, 5, 4, 6, 5, 6, 6, 7, counts.clim || 7],
    soc: [2, 3, 3, 4, 3, 5, 4, 5, 5, 6, 5, counts.soc || 6],
    legal: [2, 2, 3, 3, 3, 4, 4, 4, 5, 4, 5, counts.legal || 5],
  };

  const regionHeat = [
    { region: "North America", x: 22, y: 38, intensity: 0.78, count: counts.Americas || 15, top: "trade" },
    { region: "Europe", x: 50, y: 32, intensity: 0.92, count: counts.Europe || 18, top: "reg" },
    { region: "Asia-Pacific", x: 80, y: 42, intensity: 0.85, count: counts["Asia-Pacific"] || 12, top: "geo" },
  ];

  const kpis = [
    {
      label: "Signals this week",
      value: signals.length,
      delta: "+14%",
      dir: "up" as "up" | "down",
      spark: [28, 31, 30, 34, 33, 38, 40, 42, 44, 46, 48, signals.length],
      color: "var(--accent)",
      type: "area" as const,
    },
    {
      label: "High impact",
      value: counts.high,
      delta: "+4",
      dir: "up" as "up" | "down",
      spark: [7, 8, 9, 8, 10, 11, 10, 12, 11, 13, 14, counts.high],
      color: "var(--red)",
      type: "bar" as const,
    },
    {
      label: "New today",
      value: 8,
      delta: "active",
      dir: "up" as "up" | "down",
      spark: [3, 5, 4, 6, 5, 7, 6, 8, 7, 8, 7, 8],
      color: "var(--teal)",
      type: "line" as const,
    },
    {
      label: "Escalating",
      value: counts.high + counts.med > 10 ? 11 : 7,
      delta: "rising",
      dir: "up" as "up" | "down",
      spark: [4, 5, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11],
      color: "var(--amber)",
      type: "line" as const,
    },
  ];

  // Static synthesis theme cards that map to real db signals
  const themes = [
    {
      id: "t1",
      title: "Fourth EU–US sanctions package widens secondary-sanctions exposure",
      domains: ["geo", "reg"],
      severity: "Alarm",
      body: "A coordinated 18th EU sanctions tranche and parallel OFAC designations extend secondary-sanctions risk to logistics, insurance and component suppliers touching designated entities.",
      signals: counts.geo,
      regions: ["Europe", "Global"],
    },
    {
      id: "t2",
      title: "Tariff escalation reshapes global trade routing into H2",
      domains: ["trade", "fin"],
      severity: "Alarm",
      body: "New US reciprocal tariffs of 25–40% on a widened goods list, plus retaliatory measures from three trade blocs, are accelerating near-shoring and dual-sourcing decisions.",
      signals: counts.trade,
      regions: ["Americas", "Asia-Pacific"],
    },
    {
      id: "t3",
      title: "AI governance moves from principle to enforceable obligation",
      domains: ["tech", "reg"],
      severity: "Concern",
      body: "EU AI Act high-risk obligations and the first national enforcement actions are crystallising concrete compliance deadlines.",
      signals: counts.tech,
      regions: ["Europe", "Global"],
    },
  ];

  const handleThemeClick = (theme: any) => {
    const matchedSignal = signals.find((s) => {
      const sDomain = s.domain.toLowerCase();
      const targetDomain = theme.domains[0];
      return (
        sDomain.includes(targetDomain) ||
        (targetDomain === "geo" && sDomain.includes("geopol")) ||
        (targetDomain === "trade" && sDomain.includes("supply")) ||
        (targetDomain === "reg" && sDomain.includes("regul")) ||
        (targetDomain === "tech" && sDomain.includes("techno"))
      );
    });
    if (matchedSignal) {
      onSignal(matchedSignal);
    } else if (signals.length > 0) {
      onSignal(signals[0]);
    }
  };

  return (
    <div className="feed-layout">
      <FilterRail filters={filters} set={setFilterPatch} counts={counts} />
      <div className="scroll">
        <div className="page-pad">
          {/* live strip */}
          <div className="live-strip">
            <span className="pulse-dot"></span>
            <b>Live monitoring · 2,840 sources</b>
            <span className="sep">|</span>
            <span>Reuters · Bloomberg · FT · SEC/EDGAR · EU Official Journal · OFAC · FCA</span>
            <span style={{ marginLeft: "auto" }}>
              <button
                onClick={() => loadSignals(true)}
                className="btn btn-ghost"
                style={{ padding: "2px 8px", fontSize: 11, background: "rgba(255,255,255,0.5)" }}
                disabled={syncing}
              >
                {syncing ? "Syncing..." : "Sync Live Feed"}
              </button>
            </span>
          </div>

          {/* briefing header */}
          <div className="eyebrow" style={{ marginBottom: 7 }}>
            Signal Intelligence Briefing
          </div>
          <div className="briefing-head">
            <div className="briefing-title">Risk sense this week</div>
            <span className="range-pill">Last 7 Days Feed</span>
          </div>
          <div className="summary-callout">
            <div className="ico">
              <Icon name="bars" size={18} />
            </div>
            <p>
              <b>Geopolitical and trade signals dominate the week,</b> driven by a widened EU/OFAC
              sanctions tranche and a fresh US reciprocal-tariff list effective 1 July. AI-governance and
              nature-disclosure obligations are crystallising into hard deadlines, while net sentiment
              continues to worsen — {signals.length} signals tracked, {counts.high} high-impact, {counts.high > 5 ? 11 : 5} escalating.
            </p>
          </div>

          {/* KPI row */}
          <div className="kpi-row">
            {kpis.map((k, i) => (
              <div className="kpi-tile fade-up" key={i} style={{ animationDelay: i * 40 + "ms" }}>
                <div className="kpi-top">
                  <span className="kpi-label">{k.label}</span>
                  <span
                    className="kpi-delta"
                    style={{
                      background: k.dir === "down" ? "var(--green-l)" : "var(--accent-l)",
                      color: k.dir === "down" ? "var(--green)" : "var(--accent)",
                    }}
                  >
                    {k.dir === "up" ? "▲ " : ""}
                    {k.delta}
                  </span>
                </div>
                <div className="kpi-val num" style={{ color: "var(--text1)" }}>
                  {k.value}
                </div>
                <Sparkline data={k.spark} color={k.color} type={k.type} w={160} h={32} />
              </div>
            ))}
          </div>

          {/* charts row */}
          <div className="two-col" style={{ marginBottom: 14 }}>
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Signal volume & momentum</div>
                  <div className="panel-sub">Weekly tracked signals · last 12 weeks</div>
                </div>
                <div className="legend" style={{ marginLeft: "auto" }}>
                  <span className="legend-item">
                    <span className="legend-line" style={{ background: "var(--accent)" }}></span>Total
                  </span>
                  <span className="legend-item">
                    <span className="legend-line" style={{ background: "var(--red)" }}></span>High
                    impact
                  </span>
                </div>
              </div>
              <TrendArea
                total={[28, 31, 30, 34, 33, 38, 40, 42, 44, 46, 48, signals.length]}
                high={[7, 8, 9, 8, 10, 11, 10, 12, 11, 13, 14, counts.high]}
                labels={volumeWeeks}
              />
            </div>
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Signals by risk domain</div>
                  <div className="panel-sub">This week · click to focus</div>
                </div>
              </div>
              <RankedBars
                rows={rankedRows}
                max={maxCount}
                onClick={(r) => {
                  setFilterPatch({ domain: filters.domain === r.id ? null : r.id });
                }}
                labelW={104}
              />
            </div>
          </div>

          {/* stacked volume + heat */}
          <div className="two-col" style={{ marginBottom: 14 }}>
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Signal volume by domain</div>
                  <div className="panel-sub">Stacked weekly composition</div>
                </div>
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px 10px",
                    maxWidth: 250,
                    justifyContent: "flex-end",
                  }}
                >
                  {[
                    { id: "geo", short: "Geopolitical", color: "var(--d-geo)" },
                    { id: "trade", short: "Trade", color: "var(--d-trade)" },
                    { id: "reg", short: "Regulatory", color: "var(--d-reg)" },
                    { id: "tech", short: "Technology", color: "var(--d-tech)" },
                    { id: "clim", short: "Climate", color: "var(--d-clim)" },
                  ].map((d) => (
                    <span
                      key={d.id}
                      onMouseEnter={() => setActiveDomain(d.id)}
                      onMouseLeave={() => setActiveDomain(null)}
                      className="legend-item"
                      style={{ cursor: "default" }}
                    >
                      <span
                        style={{ width: 8, height: 8, borderRadius: 2, background: d.color }}
                      ></span>
                      {d.short}
                    </span>
                  ))}
                </div>
              </div>
              <StackedVolume
                weeks={volumeWeeks}
                byDomain={volumeByDomain}
                active={activeDomain}
              />
            </div>
            <div className="panel">
              <div className="panel-h">
                <div>
                  <div className="panel-title">Where activity is concentrated</div>
                  <div className="panel-sub">
                    Signal density by region · bubble size = volume
                  </div>
                </div>
              </div>
              <HeatMap points={regionHeat} height={210} />
            </div>
          </div>

          {/* sentiment */}
          <div className="panel" style={{ marginBottom: 8 }}>
            <div className="panel-h">
              <div className="panel-title">Sentiment distribution</div>
              <span className="trend up" style={{ marginLeft: "auto" }}>
                ▲ Net sentiment worsening
              </span>
            </div>
            <SegmentBar
              segments={[
                { label: "Alarm", value: counts.high || 11, color: "var(--red)" },
                { label: "Concern", value: counts.med || 18, color: "var(--amber)" },
                { label: "Watch", value: counts.low || 12, color: "var(--yellow)" },
                { label: "Stable", value: 7, color: "var(--green)" },
                { label: "Easing", value: 3, color: "var(--teal)" },
              ]}
            />
          </div>

          {/* themes band */}
          <div className="sec-div">
            <span className="lbl">Themes & Signals</span>
            <span className="line"></span>
            <span className="meta">AI-synthesised · {themes.length} dominant themes</span>
          </div>
          <div className="themes-scroll" style={{ display: "flex", gap: 16, overflowX: "auto", paddingBottom: 10 }}>
            {themes.map((t) => (
              <div
                className="theme-card"
                key={t.id}
                onClick={() => handleThemeClick(t)}
                style={{ minWidth: 280, cursor: "pointer" }}
              >
                <div className="theme-sev">
                  <div style={{ display: "flex", gap: 5 }}>
                    {t.domains.map((d) => (
                      <DomainTag key={d} id={d} />
                    ))}
                  </div>
                  <SentimentPill s={t.severity.toLowerCase()} />
                </div>
                <div className="theme-title">{t.title}</div>
                <div className="theme-body">{t.body}</div>
                <div className="theme-foot">
                  {t.regions.map((r) => (
                    <span key={r} className="yw-tag">
                      {r}
                    </span>
                  ))}
                  <span className="sig-count">{t.signals} signals</span>
                </div>
              </div>
            ))}
          </div>

          {/* toolbar + feed */}
          <div className="sec-div" style={{ marginTop: 28 }}>
            <span className="lbl">Latest signals</span>
            <span className="line"></span>
            <span className="meta">{filteredSignals.length} signals · newest first</span>
          </div>
          <div className="toolbar">
            <div className="search-box">
              <Icon name="search" size={15} />
              <input
                placeholder="Search signals…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            {/* Country search filter dropdown */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginLeft: 12 }}>
              <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600 }}>Country:</span>
              <select
                className="select"
                style={{ padding: "4px 8px", fontSize: 12, height: 32 }}
                value={filters.country || ""}
                onChange={(e) => setFilterPatch({ country: e.target.value || null })}
              >
                <option value="">All Countries</option>
                {allCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {(filters.domain || filters.impact || filters.region || filters.country) && (
              <button
                className="btn-ghost btn"
                onClick={() =>
                  setFilters({ domain: null, impact: null, region: null, country: null })
                }
                style={{ fontSize: 11, marginLeft: 12 }}
              >
                Clear filters
              </button>
            )}

            <div className="view-toggle" style={{ marginLeft: "auto" }}>
              <button
                className={view === "grid" ? "active" : ""}
                onClick={() => setView("grid")}
              >
                <Icon name="grid" size={15} />
              </button>
              <button
                className={view === "list" ? "active" : ""}
                onClick={() => setView("list")}
              >
                <Icon name="list" size={15} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="empty">Loading signal feed...</div>
          ) : filteredSignals.length === 0 ? (
            <div className="empty">No signals match these filters.</div>
          ) : (
            <div className={`signal-grid ${view === "list" ? "list" : ""}`}>
              {filteredSignals.map((s) => (
                <SignalCard key={s.id} sig={s} onClick={onSignal} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
