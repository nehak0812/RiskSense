"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  ArrowUpDown, 
  LayoutGrid, 
  List, 
  AlertTriangle, 
  TrendingUp, 
  BarChart2, 
  X,
  Zap,
  Globe,
  Compass
} from "lucide-react";

interface Signal {
  id: string;
  source: string;
  url: string;
  publishedAt: string;
  title: string;
  summary: string;
  body: string;
  domain: string;
  sentiment: string;
  impact: string;
  entities: string; // JSON string
  regulations: string; // JSON string
  geographies: string; // JSON string
  confidence: number;
  sourcesCited: string; // JSON string
}

interface GlobalSignalFeedProps {
  onAnalyzeOrg: (companyName: string) => void;
}

export default function GlobalSignalFeed({ onAnalyzeOrg }: GlobalSignalFeedProps) {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter states
  const [activeDomain, setActiveDomain] = useState("all");
  const [activeImpact, setActiveImpact] = useState("all");
  const [activeRegion, setActiveRegion] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Selected signal detail drawer
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);

  useEffect(() => {
    async function fetchSignals() {
      try {
        const res = await fetch("/api/signals");
        if (!res.ok) throw new Error("Failed to fetch signals");
        const data = await res.json();
        setSignals(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSignals();
  }, []);

  // Filter calculations
  const filteredSignals = signals.filter(sig => {
    // Search filter
    const matchesSearch = 
      sig.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sig.summary.toLowerCase().includes(searchQuery.toLowerCase()) || 
      sig.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sig.source.toLowerCase().includes(searchQuery.toLowerCase());

    // Domain filter
    const matchesDomain = activeDomain === "all" || sig.domain.toLowerCase() === activeDomain.toLowerCase();

    // Impact filter
    const matchesImpact = activeImpact === "all" || sig.impact.toLowerCase() === activeImpact.toLowerCase();

    // Region filter
    const geos = JSON.parse(sig.geographies || "[]") as string[];
    const matchesRegion = 
      activeRegion === "all" || 
      geos.some(g => g.toLowerCase() === activeRegion.toLowerCase()) ||
      (activeRegion === "global" && geos.includes("Global"));

    return matchesSearch && matchesDomain && matchesImpact && matchesRegion;
  });

  // Sort calculations
  const sortedSignals = [...filteredSignals].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    } else if (sortBy === "impact") {
      const impactWeight = { High: 3, Medium: 2, Low: 1 };
      return (impactWeight[b.impact as keyof typeof impactWeight] || 0) - (impactWeight[a.impact as keyof typeof impactWeight] || 0);
    } else if (sortBy === "confidence") {
      return b.confidence - a.confidence;
    }
    return 0;
  });

  // Domain styling maps
  const getDomainColorClass = (domain: string) => {
    const d = domain.toLowerCase();
    if (d.includes("geo")) return "cat-geo before-geo";
    if (d.includes("reg")) return "cat-reg before-reg";
    if (d.includes("tech")) return "cat-tech before-tech";
    if (d.includes("env")) return "cat-env before-env";
    if (d.includes("macro") || d.includes("econ")) return "cat-macro before-macro";
    if (d.includes("ind")) return "cat-ind before-ind";
    return "cat-sec before-sec";
  };

  const getSentimentPillClass = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === "alarm") return "sent-alarm";
    if (s === "concern") return "sent-concern";
    if (s === "watch") return "sent-watch";
    if (s === "stable") return "sent-stable";
    return "sent-easing";
  };

  const getImpactClass = (impact: string) => {
    if (impact === "High") return "imp-high";
    if (impact === "Medium") return "imp-med";
    return "imp-low";
  };

  // Sparkline data calculation (counts of domains)
  const domainCounts = signals.reduce((acc, sig) => {
    acc[sig.domain] = (acc[sig.domain] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const domainsSorted = [
    { name: "Geopolitical", count: domainCounts["Geopolitical"] || 1, color: "var(--red)", trend: "▲" },
    { name: "Regulatory", count: domainCounts["Regulatory"] || 1, color: "var(--accent)", trend: "▲" },
    { name: "Technology & AI", count: domainCounts["Technology & AI"] || 1, color: "var(--purple)", trend: "▲" },
    { name: "Environmental", count: domainCounts["Environmental"] || 1, color: "var(--green)", trend: "→" },
    { name: "Macro & Economic", count: domainCounts["Macro & Economic"] || domainCounts["Macro"] || 1, color: "var(--amber)", trend: "▲" },
    { name: "Industry-specific", count: domainCounts["Industry-specific"] || domainCounts["Industry"] || 1, color: "var(--teal)", trend: "→" },
  ].sort((a, b) => b.count - a.count);

  const totalCount = signals.length;
  const highImpactCount = signals.filter(s => s.impact === "High").length;

  return (
    <div className="feed-layout">
      {/* LEFT FILTER SIDEBAR */}
      <div className="feed-filters">
        <div className="filter-head">Category</div>
        <div 
          className={`filter-item ${activeDomain === "all" ? "active" : ""}`}
          onClick={() => setActiveDomain("all")}
        >
          <div className="fi-left">
            <Compass size={14} className="text-current" />
            <span>All signals</span>
          </div>
          <span className="fi-count">{totalCount}</span>
        </div>

        <div className="filter-divider" />
        <div className="filter-sub-head">Risk Domains</div>
        {[
          { name: "Geopolitical", key: "geopolitical", color: "var(--red)" },
          { name: "Regulatory", key: "regulatory", color: "var(--accent)" },
          { name: "Technology & AI", key: "technology & ai", color: "var(--purple)" },
          { name: "Environmental", key: "environmental", color: "var(--green)" },
          { name: "Macro & Economic", key: "macro & economic", color: "var(--amber)" },
          { name: "Industry-specific", key: "industry-specific", color: "var(--teal)" },
        ].map(dom => (
          <div 
            key={dom.key}
            className={`filter-item ${activeDomain === dom.key ? "active" : ""}`}
            onClick={() => setActiveDomain(dom.key)}
          >
            <div className="fi-left">
              <span className="fi-dot" style={{ backgroundColor: dom.color }} />
              <span>{dom.name}</span>
            </div>
            <span className="fi-count">
              {signals.filter(s => s.domain.toLowerCase() === dom.key).length}
            </span>
          </div>
        ))}

        <div className="filter-divider" />
        <div className="filter-sub-head">Impact Level</div>
        <div 
          className={`filter-item ${activeImpact === "all" ? "active" : ""}`}
          onClick={() => setActiveImpact("all")}
        >
          <span>All impacts</span>
        </div>
        <div 
          className={`filter-item ${activeImpact === "high" ? "active" : ""}`}
          onClick={() => setActiveImpact("high")}
        >
          <div className="fi-left">
            <span className="fi-dot bg-red-600" style={{ backgroundColor: "var(--red)" }} />
            <span>High impact</span>
          </div>
          <span className="fi-count">{highImpactCount}</span>
        </div>
        <div 
          className={`filter-item ${activeImpact === "medium" ? "active" : ""}`}
          onClick={() => setActiveImpact("medium")}
        >
          <div className="fi-left">
            <span className="fi-dot bg-amber-600" style={{ backgroundColor: "var(--amber)" }} />
            <span>Medium impact</span>
          </div>
          <span className="fi-count">
            {signals.filter(s => s.impact === "Medium").length}
          </span>
        </div>

        <div className="filter-divider" />
        <div className="filter-sub-head">Region</div>
        {[
          { name: "Global", key: "global" },
          { name: "Americas", key: "us" },
          { name: "Europe", key: "eu" },
          { name: "Asia-Pacific", key: "asia" },
        ].map(reg => (
          <div 
            key={reg.key}
            className={`filter-item ${activeRegion === reg.key ? "active" : ""}`}
            onClick={() => setActiveRegion(reg.key)}
          >
            <div className="fi-left">
              <Globe size={12} className="opacity-70" />
              <span>{reg.name}</span>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN COLUMN */}
      <div className="feed-main">
        {/* TOOLBAR */}
        <div className="feed-toolbar">
          <div className="search-box">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search signal stream..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="sort-sel" 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="impact">Sort: Highest Impact</option>
            <option value="confidence">Sort: Confidence Score</option>
          </select>

          <div className="view-toggle">
            <div 
              className={`vt-btn ${viewMode === "grid" ? "active" : ""}`}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid size={14} />
            </div>
            <div 
              className={`vt-btn ${viewMode === "list" ? "active" : ""}`}
              onClick={() => setViewMode("list")}
            >
              <List size={14} />
            </div>
          </div>
        </div>

        {/* FEED METRICS / sync strip */}
        <div className="feed-stats">
          <div className="fs-item">
            Live monitoring &bull; <strong>2,840</strong> sources
          </div>
          <div className="fs-sep" />
          <div className="fs-item">
            SEC EDGAR &bull; FCA &bull; Reuters &bull; Bloomberg &bull; FT &bull; Trade Press
          </div>
          <div className="fs-sep" />
          <div className="fs-item" style={{ marginLeft: "auto" }}>
            Last sync 4 min ago
          </div>
        </div>

        {/* SCROLL STREAM CONTENT */}
        <div className="signals-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="spinner" />
              <div className="text-slate-500 font-medium">Loading emerging signals...</div>
            </div>
          ) : error ? (
            <div className="text-red-600 p-4 border border-red-200 bg-red-50 rounded-lg m-4">
              Error fetching signals: {error}
            </div>
          ) : (
            <div className="sig-briefing">
              {/* Signal Intelligence Briefing */}
              <div className="sb-head">
                <div>
                  <div className="sb-eyebrow">Signal Intelligence Briefing</div>
                  <h2 className="sb-title">Risk sense this week</h2>
                </div>
                <div className="sb-range">26 May – 1 Jun 2026</div>
              </div>

              {/* Summary synthesis */}
              <div className="sb-summary">
                <BarChart2 size={18} className="sb-sum-ic" />
                <div>
                  <strong>Regulatory compliance and AI governance readiness are the key drivers of enterprise exposure this week.</strong> Global supply chain shifts driven by CSDDD guidelines have triggered material cost warning tags for packaging and logistics providers, while boards race to patch generative model audits ahead of August EU AI Act enforcement milestones.
                </div>
              </div>

              {/* KPI Cards Row */}
              <div className="sb-kpis">
                <div className="sb-kpi">
                  <div className="sb-kpi-top">
                    <span className="sb-kpi-l">Signals this week</span>
                    <span className="sb-kpi-d bg-blue-100 text-blue-800">+12% ▲</span>
                  </div>
                  <div className="sb-kpi-v">{totalCount + 10}</div>
                  <div className="sb-kpi-spark">
                    <svg viewBox="0 0 100 24">
                      <path d="M0,20 Q15,10 30,15 T60,5 T90,12 L100,10 L100,24 L0,24 Z" fill="rgba(29,78,130,0.08)" />
                      <path d="M0,20 Q15,10 30,15 T60,5 T90,12 L100,10" fill="none" stroke="var(--accent)" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                <div className="sb-kpi">
                  <div className="sb-kpi-top">
                    <span className="sb-kpi-l">High impact</span>
                    <span className="sb-kpi-d bg-red-100 text-red-800">+3 ▲</span>
                  </div>
                  <div className="sb-kpi-v">{highImpactCount + 2}</div>
                  <div className="sb-kpi-spark">
                    <svg viewBox="0 0 100 24">
                      <rect x="5" y="14" width="8" height="10" fill="var(--red)" opacity="0.3" />
                      <rect x="20" y="8" width="8" height="16" fill="var(--red)" opacity="0.4" />
                      <rect x="35" y="16" width="8" height="8" fill="var(--red)" opacity="0.5" />
                      <rect x="50" y="10" width="8" height="14" fill="var(--red)" opacity="0.6" />
                      <rect x="65" y="6" width="8" height="18" fill="var(--red)" opacity="0.8" />
                      <rect x="80" y="2" width="8" height="22" fill="var(--red)" />
                    </svg>
                  </div>
                </div>

                <div className="sb-kpi">
                  <div className="sb-kpi-top">
                    <span className="sb-kpi-l">New today</span>
                    <span className="sb-kpi-d bg-teal-100 text-teal-800">▲ active</span>
                  </div>
                  <div className="sb-kpi-v">7</div>
                  <div className="sb-kpi-spark">
                    <svg viewBox="0 0 100 24">
                      <path d="M0,15 L20,12 L40,18 L60,8 L80,14 L100,5" fill="none" stroke="var(--teal)" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>

                <div className="sb-kpi">
                  <div className="sb-kpi-top">
                    <span className="sb-kpi-l">Escalating</span>
                    <span className="sb-kpi-d bg-amber-100 text-amber-800">▲ rising</span>
                  </div>
                  <div className="sb-kpi-v">9</div>
                  <div className="sb-kpi-spark">
                    <svg viewBox="0 0 100 24">
                      <path d="M0,22 Q25,22 50,15 T100,2" fill="none" stroke="var(--amber)" strokeWidth="1.5" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Two Column details (Charts) */}
              <div className="sb-two mt-4">
                {/* Momentum Area Chart */}
                <div className="sb-card">
                  <div className="sb-card-hd">
                    <span className="sb-card-t">Signal volume &amp; momentum</span>
                    <div className="sb-card-legend">
                      <div className="sb-leg"><i style={{ backgroundColor: "var(--accent)" }} /> Total signals</div>
                      <div className="sb-leg"><i style={{ backgroundColor: "var(--red)" }} /> High impact</div>
                    </div>
                  </div>
                  <div className="sb-chart">
                    {/* SVG inline simulation of area chart */}
                    <svg viewBox="0 0 540 130">
                      {/* Grid lines */}
                      <line x1="0" y1="30" x2="540" y2="30" stroke="var(--border)" strokeWidth="0.5" />
                      <line x1="0" y1="70" x2="540" y2="70" stroke="var(--border)" strokeWidth="0.5" />
                      <line x1="0" y1="110" x2="540" y2="110" stroke="var(--border)" strokeWidth="0.5" />
                      
                      {/* Total area gradient */}
                      <path d="M0,110 L45,95 L90,85 L135,100 L180,90 L225,75 L270,80 L315,65 L360,55 L405,65 L450,45 L495,50 L540,35 L540,110 Z" fill="rgba(29,78,130,0.06)" />
                      {/* Total line */}
                      <path d="M0,110 L45,95 L90,85 L135,100 L180,90 L225,75 L270,80 L315,65 L360,55 L405,65 L450,45 L495,50 L540,35" fill="none" stroke="var(--accent)" strokeWidth="2" />
                      
                      {/* High impact line */}
                      <path d="M0,110 L45,105 L90,100 L135,108 L180,102 L225,95 L270,98 L315,90 L360,88 L405,92 L450,82 L495,85 L540,78" fill="none" stroke="var(--red)" strokeWidth="1.5" />
                      
                      {/* Interactive dots at end */}
                      <circle cx="540" cy="35" r="3.5" fill="var(--accent)" />
                      <circle cx="540" cy="78" r="3.5" fill="var(--red)" />
                    </svg>
                    <div className="sb-xaxis mt-2">
                      <span>12 wks ago</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>This week</span>
                    </div>
                  </div>
                </div>

                {/* Ranked domain bars */}
                <div className="sb-card">
                  <div className="sb-card-hd">
                    <span className="sb-card-t">Signals by risk domain</span>
                  </div>
                  <div className="sb-cat">
                    {domainsSorted.map((dom, i) => {
                      const maxCount = domainsSorted[0]?.count || 1;
                      const widthPercent = (dom.count / maxCount) * 100;
                      return (
                        <div key={dom.name} className="sb-cat-row">
                          <span className="sb-cat-n">{dom.name}</span>
                          <div className="sb-cat-bar">
                            <div 
                              className="sb-cat-fill" 
                              style={{ 
                                width: `${widthPercent}%`,
                                backgroundColor: dom.color
                              }} 
                            />
                          </div>
                          <span className="sb-cat-c">{dom.count}</span>
                          <span className="sb-cat-t text-red-600 font-semibold">{dom.trend}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sentiment distribution full width */}
              <div className="sb-sent-card mt-4">
                <div className="sb-sent-top">
                  <span className="sb-sent-t">Sentiment distribution</span>
                  <span className="sb-sent-meta font-medium text-red-700">Net sentiment worsening ▲</span>
                </div>
                <div className="sb-sent-bar">
                  <span style={{ width: "19%", backgroundColor: "var(--red)" }} title="Alarm: 9 signals" />
                  <span style={{ width: "38%", backgroundColor: "var(--amber)" }} title="Concern: 18 signals" />
                  <span style={{ width: "25%", backgroundColor: "#caa61c" }} title="Watch: 12 signals" />
                  <span style={{ width: "12%", backgroundColor: "var(--green)" }} title="Stable: 6 signals" />
                  <span style={{ width: "6%", backgroundColor: "var(--teal)" }} title="Easing: 3 signals" />
                </div>
                <div className="sb-sent-leg">
                  <div className="l"><i style={{ backgroundColor: "var(--red)" }} /> Alarm <b>9</b></div>
                  <div className="l"><i style={{ backgroundColor: "var(--amber)" }} /> Concern <b>18</b></div>
                  <div className="l"><i style={{ backgroundColor: "#caa61c" }} /> Watch <b>12</b></div>
                  <div className="l"><i style={{ backgroundColor: "var(--green)" }} /> Stable <b>6</b></div>
                  <div className="l"><i style={{ backgroundColor: "var(--teal)" }} /> Easing <b>3</b></div>
                </div>
              </div>

              {/* Latest signals divider */}
              <div className="sb-section-hd mt-6">
                <span className="t">Latest signals</span>
                <div className="ln" />
                <span className="c">{filteredSignals.length} signals matching filters &bull; newest first</span>
              </div>

              {/* Signal Card Grid */}
              <div className={viewMode === "grid" ? "signals-grid" : "flex flex-col gap-3"}>
                {sortedSignals.map(sig => (
                  <div 
                    key={sig.id} 
                    className={`signal-card ${getDomainColorClass(sig.domain)}`}
                    onClick={() => setSelectedSignal(sig)}
                  >
                    <div className="sc-top">
                      <div className="sc-cat-row">
                        <span className={`sc-cat-badge ${getDomainColorClass(sig.domain).split(" ")[0]}`}>
                          {sig.domain}
                        </span>
                        <span className="sc-source font-semibold">{sig.source}</span>
                      </div>
                      <span className="sc-time font-medium">
                        {new Date(sig.publishedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>

                    <h3 className="sc-headline font-semibold text-slate-900">{sig.title}</h3>
                    <p className="sc-summary text-slate-600 line-clamp-3">{sig.summary}</p>

                    <div className="sc-footer">
                      {(JSON.parse(sig.regulations || "[]") as string[]).slice(0, 2).map(reg => (
                        <span key={reg} className="sc-tag">{reg}</span>
                      ))}
                      {(JSON.parse(sig.geographies || "[]") as string[]).slice(0, 1).map(geo => (
                        <span key={geo} className="sc-tag">{geo}</span>
                      ))}
                      
                      <div className="sc-impact ml-auto">
                        <span className={`sentiment-pill ${getSentimentPillClass(sig.sentiment)}`}>
                          <span className="sent-icon">&bull;</span>
                          {sig.sentiment}
                        </span>
                        <span className={`risk-rel-badge ${getImpactClass(sig.impact)}`}>
                          {sig.impact}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT DRAWER: SIGNAL DETAILS */}
      <div className={`signal-detail ${selectedSignal ? "open" : ""}`}>
        {selectedSignal && (
          <div className="flex flex-col h-full">
            <div className="sd-hd">
              <div className="sd-top">
                <span className={`sc-cat-badge ${getDomainColorClass(selectedSignal.domain).split(" ")[0]}`}>
                  {selectedSignal.domain}
                </span>
                <div className="close-x" onClick={() => setSelectedSignal(null)}>
                  <X size={14} />
                </div>
              </div>
              <h3 className="sd-headline">{selectedSignal.title}</h3>
              <div className="sd-meta">
                <span className="sd-chip font-semibold text-slate-800">{selectedSignal.source}</span>
                <span className="sd-chip">
                  {new Date(selectedSignal.publishedAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
                <span className={`sentiment-pill ${getSentimentPillClass(selectedSignal.sentiment)}`}>
                  {selectedSignal.sentiment}
                </span>
                <span className={`risk-rel-badge ${getImpactClass(selectedSignal.impact)}`}>
                  {selectedSignal.impact} Impact
                </span>
              </div>
            </div>

            <div className="sd-body">
              <div className="sd-sec">
                <span className="sd-sec-label">Summary</span>
                <p className="sd-body-text">{selectedSignal.summary}</p>
              </div>

              <div className="sd-sec">
                <span className="sd-sec-label">Why it matters for business</span>
                <div className="why-block">
                  <div className="why-row">
                    <Zap size={14} className="why-icon" />
                    <div className="why-text">
                      <strong>Material Impact:</strong> Establishes compliance gaps regarding scope rules, exposing businesses to audits.
                    </div>
                  </div>
                  <div className="why-row">
                    <AlertTriangle size={14} className="why-icon" />
                    <div className="why-text">
                      <strong>Operational Constraint:</strong> Demands immediate restructuring of supplier certification models.
                    </div>
                  </div>
                </div>
              </div>

              <div className="sd-sec">
                <span className="sd-sec-label">Signal Details</span>
                <p className="sd-body-text text-justify">{selectedSignal.body}</p>
              </div>

              <div className="sd-sec">
                <span className="sd-sec-label">Confidence and Source Verification</span>
                <div className="flex items-center gap-4">
                  <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-700 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${selectedSignal.confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-semibold text-indigo-900">{Math.round(selectedSignal.confidence * 100)}% Confidence</span>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  <span className="text-xs text-slate-500 uppercase font-semibold tracking-wider">Citations</span>
                  {JSON.parse(selectedSignal.sourcesCited || "[]").map((c: string, idx: number) => (
                    <a 
                      key={idx} 
                      href={c} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-indigo-700 hover:underline truncate"
                    >
                      {c}
                    </a>
                  ))}
                </div>
              </div>

              <button 
                className="sd-action-btn mt-4 font-semibold"
                onClick={() => {
                  // Determine name suggestion from entities or default
                  const entities = JSON.parse(selectedSignal.entities || "[]") as string[];
                  const companyName = entities.find(e => e !== "Global" && e !== "EU Commission") || "Unilever";
                  onAnalyzeOrg(companyName);
                  setSelectedSignal(null);
                }}
              >
                Analyse impact on my organisation &rarr;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
