"use client";

import React, { useState } from "react";
import { Search, Compass, Shield, CloudLightning, ShieldAlert, Cpu, Landmark, ChevronDown } from "lucide-react";

interface WefRisk {
  rank: number;
  title: string;
  category: "env" | "geo" | "soc" | "tech" | "econ";
  categoryLabel: string;
  severity: number;
  sentiment: string;
  horizon: "short" | "long" | "both";
  description: string;
  interconnections: string[];
}

export default function WefReference() {
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const wefRisks: WefRisk[] = [
    {
      rank: 1,
      title: "Misinformation and Disinformation",
      category: "tech",
      categoryLabel: "Technological",
      severity: 9.4,
      sentiment: "Alarm",
      horizon: "short",
      description: "Generative AI advancements lower the barrier to creating manipulated media and synthetic content. This risks destabilizing upcoming global elections, triggering social unrest, and weakening trust in public systems.",
      interconnections: ["Social Polarization", "Geopolitical Confrontation", "Cyber Insecurity"]
    },
    {
      rank: 2,
      title: "Extreme Weather Events",
      category: "env",
      categoryLabel: "Environmental",
      severity: 9.1,
      sentiment: "Alarm",
      horizon: "both",
      description: "Accelerating climate changes lead to systemic risks of crop failure, infrastructure collapse, and severe inland/coastal flooding. Supply chains for critical foods and commodities face recurring disruptions.",
      interconnections: ["Natural Resource Shortages", "Biodiversity Loss", "Involuntary Migration"]
    },
    {
      rank: 3,
      title: "Societal Polarization",
      category: "soc",
      categoryLabel: "Societal",
      severity: 8.7,
      sentiment: "Concern",
      horizon: "short",
      description: "Ideological divides within nation-states hinder policy consensus on critical issues like energy transitions and economic reforms. Public-private collaborations stall under ideological friction.",
      interconnections: ["Misinformation", "Economic Downturns", "Involuntary Migration"]
    },
    {
      rank: 4,
      title: "Cyber Insecurity",
      category: "tech",
      categoryLabel: "Technological",
      severity: 8.5,
      sentiment: "Concern",
      horizon: "short",
      description: "Proliferation of connected devices combined with LLM-assisted spearphishing tools increases cyberattacks targeting operational infrastructure, utility systems, and logistics centers.",
      interconnections: ["Infrastructure Failure", "Misinformation", "State Aggression"]
    },
    {
      rank: 5,
      title: "Non-State Armed Conflict",
      category: "geo",
      categoryLabel: "Geopolitical",
      severity: 8.2,
      sentiment: "Concern",
      horizon: "long",
      description: "Localized conflicts escalate into regional friction hubs. Disruption of primary shipping channels and pipeline routes causes supply shocks and margin pressures on basic goods.",
      interconnections: ["Supply Chain Volatility", "Inflationary commodity hikes", "Societal Polarization"]
    },
    {
      rank: 6,
      title: "Lack of Economic Opportunity",
      category: "econ",
      categoryLabel: "Economic",
      severity: 7.9,
      sentiment: "Watch",
      horizon: "short",
      description: "High interest rates coupled with regional inflation squeezes consumer disposable income. Private label growth outpaces brand affinity, forcing margin adjustments in consumer goods.",
      interconnections: ["Societal Polarization", "Involuntary Migration", "Fiscal Strain"]
    }
  ];

  const getCatColor = (cat: string) => {
    if (cat === "env") return "var(--green)";
    if (cat === "geo") return "var(--red)";
    if (cat === "soc") return "var(--purple)";
    if (cat === "tech") return "var(--accent)";
    return "var(--amber)";
  };

  const getSentimentPillClass = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === "alarm") return "sent-alarm";
    if (s === "concern") return "sent-concern";
    return "sent-watch";
  };

  const filteredRisks = wefRisks.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = activeFilter === "all" || r.category === activeFilter || r.horizon === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="wef-layout">
      {/* SIDEBAR */}
      <div className="wef-sidebar">
        <div className="wef-sidebar-logo">
          <div className="wef-logo-badge">WEF</div>
          <div className="wef-logo-sub font-semibold">Global Risks Report 2026<br />19th Edition Reference</div>
        </div>

        <div className="wef-filter-head font-semibold">Risk Horizon</div>
        <div 
          className={`wef-filter-item ${activeFilter === "all" ? "active" : ""}`}
          onClick={() => setActiveFilter("all")}
        >
          <div className="wef-fi-left">
            <Compass size={13} />
            <span>All Horizons</span>
          </div>
          <span className="wef-fi-count">{wefRisks.length}</span>
        </div>
        <div 
          className={`wef-filter-item ${activeFilter === "short" ? "active" : ""}`}
          onClick={() => setActiveFilter("short")}
        >
          <span>Short Term (2 yrs)</span>
        </div>
        <div 
          className={`wef-filter-item ${activeFilter === "long" ? "active" : ""}`}
          onClick={() => setActiveFilter("long")}
        >
          <span>Long Term (10 yrs)</span>
        </div>

        <div className="wef-divider" />
        <div className="wef-filter-sub font-semibold">Categories</div>
        {[
          { name: "Environmental", key: "env", color: "var(--green)" },
          { name: "Geopolitical", key: "geo", color: "var(--red)" },
          { name: "Societal", key: "soc", color: "var(--purple)" },
          { name: "Technological", key: "tech", color: "var(--accent)" },
          { name: "Economic", key: "econ", color: "var(--amber)" },
        ].map(cat => (
          <div 
            key={cat.key}
            className={`wef-filter-item ${activeFilter === cat.key ? "active" : ""}`}
            onClick={() => setActiveFilter(cat.key)}
          >
            <div className="wef-fi-left">
              <span className="wef-fi-dot" style={{ backgroundColor: cat.color }} />
              <span>{cat.name}</span>
            </div>
            <span className="wef-fi-count">
              {wefRisks.filter(r => r.category === cat.key).length}
            </span>
          </div>
        ))}
      </div>

      {/* MAIN VIEW */}
      <div className="wef-main bg-slate-50">
        {/* Banner */}
        <div className="wef-banner">
          <div className="wef-banner-top">
            <div>
              <h2 className="wef-banner-title">World Economic Forum Global Risks</h2>
              <div className="wef-banner-sub">Global Consensus Outlook &bull; 1000+ Expert survey respondents</div>
            </div>
            <div className="wef-report-chip font-bold">19th Annual Edition</div>
          </div>
          <div className="wef-banner-stats mt-4">
            <div className="wef-bstat">
              <div className="wef-bstat-val">34</div>
              <div className="wef-bstat-lbl">Risks Tracked</div>
            </div>
            <div className="wef-bstat flex-1" style={{ marginLeft: "20px" }}>
              <div className="wef-bstat-val">Tech &amp; Climate</div>
              <div className="wef-bstat-lbl">Primary Risk Drivers</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="wef-toolbar">
          <div className="search-box max-w-xs flex-1">
            <Search size={14} className="text-slate-400" />
            <input 
              type="text" 
              placeholder="Search reference report..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Scroll risks */}
        <div className="wef-scroll">
          {filteredRisks.map(risk => {
            const isExpanded = expandedCard === risk.rank;
            return (
              <div 
                key={risk.rank}
                className={`wef-card ${isExpanded ? "expanded" : ""}`}
                onClick={() => setExpandedCard(isExpanded ? null : risk.rank)}
              >
                <div className="wef-card-top-bar" style={{ backgroundColor: getCatColor(risk.category) }} />
                
                <div className="wef-card-head">
                  <div 
                    className="wef-rank-badge font-bold" 
                    style={{ 
                      backgroundColor: getCatColor(risk.category) + "18",
                      color: getCatColor(risk.category)
                    }}
                  >
                    #{risk.rank}
                  </div>
                  
                  <div className="wef-card-titles">
                    <h4 className="wef-card-title text-slate-900 font-semibold">{risk.title}</h4>
                    <span className="wef-card-cat font-medium">{risk.categoryLabel} Risk</span>
                  </div>

                  <div className="wef-card-right">
                    <span className={`sentiment-pill ${getSentimentPillClass(risk.sentiment)}`}>
                      {risk.sentiment}
                    </span>
                    <div className="wef-sev-wrap text-right">
                      <span className="wef-sev-score">{risk.severity.toFixed(1)}</span>
                      <div className="wef-sev-bar-bg">
                        <div 
                          className="wef-sev-bar-fill h-full"
                          style={{ 
                            width: `${risk.severity * 10}%`,
                            backgroundColor: getCatColor(risk.category)
                          }}
                        />
                      </div>
                    </div>
                    <ChevronDown size={14} className="text-slate-400 transition-transform" />
                  </div>
                </div>

                {isExpanded && (
                  <div className="wef-card-body flex">
                    <div className="wef-body-left">
                      <div className="wef-section-lbl">Global Outlook Analysis</div>
                      <p className="wef-body-text text-justify">{risk.description}</p>
                    </div>

                    <div className="wef-body-right">
                      <div className="wef-section-lbl">Systemic Interconnections</div>
                      <div className="wef-inter-tags">
                        {risk.interconnections.map(tag => (
                          <span key={tag} className="wef-inter-tag font-semibold">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
