"use client";

import React, { useState, useEffect } from "react";
import { 
  Clipboard, 
  Printer, 
  ChevronDown, 
  X,
  FileText,
  AlertTriangle,
  Layers,
  Newspaper,
  Compass,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  CheckCircle,
  HelpCircle,
  RefreshCw,
  Search,
  User
} from "lucide-react";

interface OrgResultWorkspaceProps {
  orgId: string;
  onClose: () => void;
}

export default function OrgResultWorkspace({ orgId, onClose }: OrgResultWorkspaceProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reanalyzing, setReanalyzing] = useState(false);
  const [error, setError] = useState("");

  // Sidebar navigation selection
  const [activeView, setActiveView] = useState<"overview" | "register" | "news" | "board">("overview");

  // Selection states
  const [selectedRisk, setSelectedRisk] = useState<any>(null);
  const [newsFilter, setNewsFilter] = useState("all");
  const [newsQuery, setNewsQuery] = useState("");
  const [expandedNewsCard, setExpandedNewsCard] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/orgs/${orgId}`);
      if (!res.ok) throw new Error("Failed to fetch organisation details");
      const json = await res.json();
      setData(json);
      
      // Auto select first risk for drawer pre-population
      if (json.organisation?.risks?.length > 0) {
        setSelectedRisk(json.organisation.risks[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [orgId]);

  const handleReanalyze = async () => {
    setReanalyzing(true);
    try {
      const res = await fetch(`/api/orgs/${orgId}/analyse`, { method: "POST" });
      if (!res.ok) throw new Error("Analysis failed");
      await fetchData();
    } catch (err: any) {
      alert("Error running analysis: " + err.message);
    } finally {
      setReanalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
        <div className="spinner" />
        <div className="text-slate-500 font-medium">Loading analysis workspace...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 border border-red-200 bg-red-50 text-red-700 m-8 rounded-lg">
        <h3 className="font-semibold text-lg">Error Loading Workspace</h3>
        <p>{error || "Organisation not found"}</p>
      </div>
    );
  }

  const { organisation, matches } = data;
  const risks = organisation.risks || [];
  const peerDisclosures = organisation.peerDisclosures || [];
  
  // Parse newest board pack
  const boardPack = organisation.boardPacks?.[0];
  const boardPayload = boardPack ? JSON.parse(boardPack.payload) : null;
  
  const orgInitials = organisation.name ? organisation.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2).toUpperCase() : "CO";

  // RAG styling helpers
  const getRatingClass = (rating: string) => {
    if (rating === "High" || rating === "Breach") return "bg-red-100 text-red-800 border-red-200";
    if (rating === "Medium" || rating === "At tolerance" || rating === "Partial") return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  };

  const getSentimentPillClass = (sentiment: string) => {
    const s = sentiment.toLowerCase();
    if (s === "alarm") return "sent-alarm";
    if (s === "concern") return "sent-concern";
    if (s === "watch") return "sent-watch";
    if (s === "stable") return "sent-stable";
    return "sent-easing";
  };

  // Hexagon Radar computation
  const radarDimensions = 220;
  const center = radarDimensions / 2;
  const radarRadius = 80;
  const domains = [
    { name: "Regulatory", val: 88, peerVal: 70 },
    { name: "Tech / AI", val: 85, peerVal: 64 },
    { name: "Geopolitical", val: 79, peerVal: 76 },
    { name: "Supply Chain", val: 72, peerVal: 70 },
    { name: "Climate & Nature", val: 63, peerVal: 68 },
    { name: "Financial & Macro", val: 57, peerVal: 65 }
  ];

  // Helper to compute radar point coordinates
  const getRadarPoint = (index: number, value: number) => {
    const angle = (index * 60 - 90) * (Math.PI / 180);
    const radius = (value / 100) * radarRadius;
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    };
  };

  // Generate SVG paths
  const companyPoints = domains.map((d, i) => getRadarPoint(i, d.val));
  const companyPath = companyPoints.map(p => `${p.x},${p.y}`).join(" ");
  
  const peerPoints = domains.map((d, i) => getRadarPoint(i, d.peerVal));
  const peerPath = peerPoints.map(p => `${p.x},${p.y}`).join(" ");

  // In-memory news filtering
  const newsStories = matches.filter((m: any) => {
    const sig = m.signal;
    const matchesSearch = sig.title.toLowerCase().includes(newsQuery.toLowerCase()) || sig.summary.toLowerCase().includes(newsQuery.toLowerCase());
    const matchesFilter = newsFilter === "all" || sig.domain.toLowerCase().includes(newsFilter.toLowerCase());
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="analysis-shell">
      {/* LEFT VIEW-NAV SIDEBAR */}
      <div className="feed-filters w-[240px] min-w-[240px] border-right p-0 flex flex-col h-full bg-white">
        {/* Org monocle card */}
        <div className="p-4 border-bottom border-slate-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-indigo-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
              {orgInitials}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 leading-tight truncate max-w-[150px]">{organisation.name}</h3>
              <span className="text-[11px] text-slate-400 font-medium">{organisation.industry}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {JSON.parse(organisation.geographies || "[]").map((g: string) => (
              <span key={g} className="sc-tag text-[9px] px-1.5 py-0.5">{g}</span>
            ))}
            {JSON.parse(organisation.peers || "[]").slice(0, 2).map((p: string) => (
              <span key={p} className="sc-tag text-[9px] px-1.5 py-0.5">{p}</span>
            ))}
          </div>
        </div>

        {/* Navigation list */}
        <div className="flex-1 py-4 overflow-y-auto">
          <div className="filter-head px-4">Assessment</div>
          <div 
            className={`filter-item px-4 ${activeView === "overview" ? "active" : ""}`}
            onClick={() => setActiveView("overview")}
          >
            <div className="fi-left">
              <Layers size={14} />
              <span>Risk overview</span>
            </div>
          </div>
          <div 
            className={`filter-item px-4 ${activeView === "register" ? "active" : ""}`}
            onClick={() => setActiveView("register")}
          >
            <div className="fi-left">
              <FileText size={14} />
              <span>ERM risk register</span>
            </div>
          </div>

          <div className="filter-divider my-2" />
          <div className="filter-head px-4">Intelligence</div>
          <div 
            className={`filter-item px-4 ${activeView === "news" ? "active" : ""}`}
            onClick={() => setActiveView("news")}
          >
            <div className="fi-left">
              <Newspaper size={14} />
              <span>Industry news</span>
            </div>
            <span className="fi-count bg-slate-100 text-slate-500">{matches.length}</span>
          </div>

          <div className="filter-divider my-2" />
          <div className="filter-head px-4">For the Board</div>
          <div 
            className={`filter-item px-4 ${activeView === "board" ? "active" : ""}`}
            onClick={() => setActiveView("board")}
          >
            <div className="fi-left">
              <Clipboard size={14} />
              <span>Board &amp; Committee pack</span>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-top border-slate-100 flex flex-col gap-3">
          <button 
            onClick={handleReanalyze}
            disabled={reanalyzing}
            className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 text-xs font-semibold rounded-lg"
          >
            <RefreshCw size={12} className={reanalyzing ? "animate-spin" : ""} />
            {reanalyzing ? "Analyzing..." : "Re-run Analysis Pipeline"}
          </button>
          
          <div className="text-[10px] text-slate-400 text-center leading-tight">
            Generated {new Date(organisation.createdAt).toLocaleDateString()}<br />
            ID: {organisation.id.substring(0, 8)}
          </div>
        </div>
      </div>

      {/* MAIN VIEW AREA */}
      <div className="analysis-main" style={{ position: "relative", backgroundColor: "var(--bg3)" }}>
        
        {/* VIEW A: OVERVIEW */}
        {activeView === "overview" && (
          <div className="flex flex-col gap-6">
            {/* Movement strip */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Movement since last board meeting &bull; vs Q1 Board Pack
              </div>
              <div className="grid grid-cols-6 divide-x divide-slate-100">
                {[
                  { label: "New principal risks", val: "+2", color: "border-red-500 text-red-700" },
                  { label: "Escalating risks", val: "3 ▲", color: "border-red-500 text-red-700" },
                  { label: "De-escalated risks", val: "1 ▼", color: "border-emerald-500 text-emerald-700" },
                  { label: "Appetite breaches", val: "2", color: "border-red-500 text-red-700" },
                  { label: "Overdue mitigations", val: "4", color: "border-amber-500 text-amber-700" },
                  { label: "New peer disclosures", val: `${matches.length > 5 ? 5 : matches.length}`, color: "border-slate-400 text-slate-700" },
                ].map((item, idx) => (
                  <div key={idx} className={`px-4 border-l-3 ${item.color.split(" ")[0]}`}>
                    <div className="font-serif text-2xl font-bold tracking-tight mb-0.5">{item.val}</div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Stat Row */}
            <div className="grid grid-cols-4 gap-4">
              {[
                { label: "Emerging Risks", val: risks.length, sub: "↑6 this month", color: "border-indigo-600" },
                { label: "High Relevance", val: matches.filter((m: any) => m.relevanceScore > 7.0).length, sub: "Based on embeddings", color: "border-red-600" },
                { label: "Peer Disclosure Gaps", val: peerDisclosures.filter((pd: any) => !pd.disclosed).length, sub: "↑2 in review", color: "border-amber-600" },
                { label: "Signals Matched", val: matches.length, sub: "From 2,840 feeds", color: "border-emerald-600" },
              ].map((s, idx) => (
                <div key={idx} className="bg-white border-t-4 border border-slate-200 rounded-xl p-4 shadow-sm" style={{ borderTopColor: s.color.replace("border-", "") }}>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.label}</div>
                  <div className="font-serif text-3xl font-bold tracking-tight text-slate-900 mt-1">{s.val}</div>
                  <div className="text-xs text-slate-400 mt-1.5">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Two Column Grid */}
            <div className="grid grid-cols-12 gap-6">
              {/* Prioritised risks */}
              <div className="col-span-8 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-bottom border-slate-100 flex justify-between items-center">
                  <h3 className="font-serif text-base font-bold text-slate-900">Prioritised emerging risks</h3>
                  <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-semibold">Ranked by score</span>
                </div>
                <div className="divide-y divide-slate-100">
                  {risks.map((risk: any) => (
                    <div 
                      key={risk.id}
                      className={`p-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors ${selectedRisk?.id === risk.id ? "bg-slate-50 border-l-4 border-indigo-700" : ""}`}
                      onClick={() => setSelectedRisk(risk)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xs font-semibold text-slate-400 font-mono w-10">{risk.code}</div>
                        <div>
                          <div className="font-semibold text-slate-950 text-sm leading-snug">{risk.title}</div>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] text-slate-400 font-medium">{risk.category}</span>
                            <span className={`text-[9px] px-1.5 py-0.2 border rounded font-semibold ${getRatingClass(risk.appetiteStatus)}`}>
                              {risk.appetiteStatus}
                            </span>
                            {risk.isPrincipal && <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold uppercase tracking-wider">Principal</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-serif text-base font-bold text-slate-900">{risk.score.toFixed(1)}</div>
                          <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${risk.trendDirection === "Up" ? "text-red-600" : risk.trendDirection === "Down" ? "text-emerald-600" : "text-slate-400"}`}>
                            {risk.trendDirection === "Up" ? "▲" : risk.trendDirection === "Down" ? "▼" : "→"} 
                            {risk.trendValue !== 0 && Math.abs(risk.trendValue).toFixed(1)}
                          </span>
                        </div>
                        <ArrowRight size={14} className="text-slate-300" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radar and peer overlap */}
              <div className="col-span-4 flex flex-col gap-6">
                {/* Radar chart */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col items-center">
                  <h3 className="font-serif text-sm font-bold text-slate-900 self-start mb-2">Domain risk radar</h3>
                  
                  {/* Radar Hexagon SVG */}
                  <svg width={radarDimensions} height={radarDimensions} viewBox={`0 0 ${radarDimensions} ${radarDimensions}`}>
                    {/* Background rings */}
                    {[1, 0.75, 0.5, 0.25].map((scale, sIdx) => {
                      const r = scale * radarRadius;
                      const ringPoints = Array.from({ length: 6 }).map((_, i) => {
                        const angle = (i * 60 - 90) * (Math.PI / 180);
                        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                      }).join(" ");
                      return (
                        <polygon 
                          key={sIdx} 
                          points={ringPoints} 
                          fill="none" 
                          stroke="var(--border)" 
                          strokeWidth="0.5" 
                        />
                      );
                    })}
                    
                    {/* Axis lines */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      return (
                        <line 
                          key={i}
                          x1={center}
                          y1={center}
                          x2={center + radarRadius * Math.cos(angle)}
                          y2={center + radarRadius * Math.sin(angle)}
                          stroke="var(--border)"
                          strokeWidth="0.5"
                        />
                      );
                    })}

                    {/* Labels */}
                    {domains.map((dom, i) => {
                      const angle = (i * 60 - 90) * (Math.PI / 180);
                      const textRadius = radarRadius + 18;
                      const textX = center + textRadius * Math.cos(angle);
                      const textY = center + textRadius * Math.sin(angle);
                      let anchor: "middle" | "start" | "end" = "middle";
                      if (Math.cos(angle) > 0.1) anchor = "start";
                      else if (Math.cos(angle) < -0.1) anchor = "end";
                      
                      return (
                        <text
                          key={i}
                          x={textX}
                          y={textY + 3}
                          fontSize="8.5"
                          fontFamily="sans-serif"
                          fontWeight="600"
                          fill="var(--text2)"
                          textAnchor={anchor}
                        >
                          {dom.name}
                        </text>
                      );
                    })}

                    {/* Peer average polygon (dashed) */}
                    <polygon 
                      points={peerPath} 
                      fill="none" 
                      stroke="var(--text3)" 
                      strokeWidth="1.5" 
                      strokeDasharray="3,3" 
                    />
                    
                    {/* Company exposure polygon */}
                    <polygon 
                      points={companyPath} 
                      fill="rgba(29,78,130,0.12)" 
                      stroke="var(--accent)" 
                      strokeWidth="2" 
                    />
                  </svg>
                  
                  {/* Radar legend */}
                  <div className="flex gap-4 mt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 border border-indigo-700 bg-indigo-50 rounded" />
                      Company
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-0.5 border-t border-dashed border-slate-400" />
                      Peer average
                    </div>
                  </div>
                </div>

                {/* Peer overlap */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                  <h3 className="font-serif text-sm font-bold text-slate-900 mb-3">Peer risk overlap</h3>
                  <div className="flex flex-col gap-3">
                    {JSON.parse(organisation.peers || "[]").map((peer: string, idx: number) => {
                      // Calculate overlap ratio
                      const overlapPercent = [78, 64, 52, 45, 30][idx % 5] || 40;
                      return (
                        <div key={peer}>
                          <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                            <span>{peer}</span>
                            <span>{overlapPercent}% overlap</span>
                          </div>
                          <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-slate-500 h-full rounded-full transition-all duration-700" 
                              style={{ width: `${overlapPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Risk appetite vs current exposure */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4 border-bottom border-slate-100 pb-2">
                <h3 className="font-serif text-base font-bold text-slate-900">Risk appetite vs. current exposure</h3>
                <div className="flex gap-4 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-600" /> Breach</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-600" /> At Tolerance</div>
                  <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-600" /> Within</div>
                  <div className="flex items-center gap-1.5"><span className="text-[12px] font-bold text-indigo-700">|</span> Appetite Limit</div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {domains.map((dom) => {
                  const status = dom.val > dom.peerVal + 10 ? "Breach" : dom.val >= dom.peerVal ? "At tolerance" : "Within";
                  const statusColor = status === "Breach" ? "var(--red)" : status === "At tolerance" ? "var(--amber)" : "var(--green)";
                  const statusColorLight = status === "Breach" ? "var(--red-l)" : status === "At tolerance" ? "var(--amber-l)" : "var(--green-l)";
                  const markerOffset = dom.peerVal; // Appetite limit map

                  return (
                    <div key={dom.name} className="grid grid-cols-12 items-center gap-4">
                      <div className="col-span-3 text-xs font-bold text-slate-700">{dom.name}</div>
                      <div className="col-span-7 relative h-6 flex items-center">
                        {/* Under track */}
                        <div className="absolute inset-x-0 h-2 bg-slate-100 rounded-full" />
                        
                        {/* Exposure fill */}
                        <div 
                          className="absolute left-0 h-2 rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${dom.val}%`, 
                            backgroundColor: statusColor 
                          }}
                        />

                        {/* Appetite limit vertical line marker */}
                        <div 
                          className="absolute top-0 bottom-0 w-0.5 bg-indigo-900 flex flex-col items-center"
                          style={{ left: `${markerOffset}%` }}
                        >
                          <span className="w-1.5 h-1.5 rotate-45 bg-indigo-900 -mt-1" />
                        </div>
                      </div>
                      <div className="col-span-2 text-right">
                        <span className={`text-[10px] px-2 py-0.5 border rounded-full font-semibold`} style={{ backgroundColor: statusColorLight, color: statusColor, borderColor: statusColor + "30" }}>
                          {status} ({dom.val} vs {markerOffset})
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* VIEW B: RISK REGISTER */}
        {activeView === "register" && (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-5 border-bottom border-slate-100 flex justify-between items-center bg-white">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Enterprise risk register</h3>
                <p className="text-xs text-slate-400 mt-1">Full mapped matrix of internal risks &amp; scores</p>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 hover:bg-slate-50 font-semibold rounded-lg text-xs"
              >
                <Printer size={12} />
                Export Register
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-bottom border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3 pl-5">ID</th>
                    <th className="p-3">Principal Risk</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Owner</th>
                    <th className="p-3 text-center">Inherent</th>
                    <th className="p-3 text-center">Controls</th>
                    <th className="p-3 text-center">Residual</th>
                    <th className="p-3 text-center">Trend</th>
                    <th className="p-3 text-center">Appetite</th>
                    <th className="p-3 text-right pr-5">Reviewed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {risks.map((risk: any) => (
                    <tr 
                      key={risk.id}
                      className="hover:bg-slate-50/80 cursor-pointer text-xs"
                      onClick={() => {
                        setSelectedRisk(risk);
                        // Open drawer
                        const drawer = document.querySelector(".tpl-drawer");
                        if (drawer) drawer.classList.add("open");
                      }}
                    >
                      <td className="p-3 pl-5 font-mono font-semibold text-slate-400">{risk.code}</td>
                      <td className="p-3 font-semibold text-slate-900">{risk.title}</td>
                      <td className="p-3 text-slate-500">{risk.category}</td>
                      <td className="p-3 text-slate-600">{risk.ownerName}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-semibold ${getRatingClass(risk.inherentRating)}`}>
                          {risk.inherentRating}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-semibold ${getRatingClass(risk.controlEffectiveness)}`}>
                          {risk.controlEffectiveness}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border rounded-full text-[9px] font-semibold ${getRatingClass(risk.residualRating)}`}>
                          {risk.residualRating}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`font-semibold ${risk.trendDirection === "Up" ? "text-red-600" : risk.trendDirection === "Down" ? "text-emerald-600" : "text-slate-400"}`}>
                          {risk.trendDirection === "Up" ? "▲" : risk.trendDirection === "Down" ? "▼" : "→"}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border rounded text-[9px] font-semibold ${getRatingClass(risk.appetiteStatus)}`}>
                          {risk.appetiteStatus}
                        </span>
                      </td>
                      <td className="p-3 text-right pr-5 text-slate-400 font-medium">
                        {new Date(risk.lastReviewedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW C: INDUSTRY NEWS */}
        {activeView === "news" && (
          <div className="flex flex-col gap-4">
            {/* Toolbar search */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
              <div className="search-box max-w-sm flex-1">
                <Search size={14} className="text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Filter news items..." 
                  value={newsQuery}
                  onChange={(e) => setNewsQuery(e.target.value)}
                />
              </div>

              <div className="ind-cat-pills">
                {["all", "regulatory", "technology", "environmental", "geopolitical"].map((cat) => (
                  <span 
                    key={cat}
                    className={`ind-cat-pill capitalize ${newsFilter === cat ? "active" : ""}`}
                    onClick={() => setNewsFilter(cat)}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Stories stack */}
            <div className="flex flex-col gap-3">
              {newsStories.map((matchItem: any) => {
                const sig = matchItem.signal;
                const isExpanded = expandedNewsCard === sig.id;
                
                return (
                  <div 
                    key={sig.id}
                    className={`ind-news-card ${isExpanded ? "expanded" : ""}`}
                  >
                    <div className="ind-top-accent before-geo bg-slate-400" />
                    <div 
                      className="ind-card-main"
                      onClick={() => setExpandedNewsCard(isExpanded ? null : sig.id)}
                    >
                      <div className="ind-card-icon bg-slate-100 text-slate-700">
                        {sig.domain.includes("Reg") ? "⚖️" : sig.domain.includes("Tech") ? "🤖" : sig.domain.includes("Env") ? "🌱" : "🌍"}
                      </div>
                      
                      <div className="ind-card-body">
                        <div className="ind-card-top">
                          <span className="ind-card-cat-badge bg-indigo-50 border-indigo-200 text-indigo-800">
                            {sig.domain}
                          </span>
                          <span className="ind-card-source font-semibold">{sig.source}</span>
                          <span className="ind-card-time font-medium">
                            {new Date(sig.publishedAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h4 className="ind-card-headline text-slate-900 font-semibold">{sig.title}</h4>
                        <p className="ind-card-summary text-slate-500 line-clamp-2">{sig.summary}</p>
                      </div>
                      
                      <div className="ind-card-right">
                        <span className={`sentiment-pill ${getSentimentPillClass(sig.sentiment)}`}>
                          {sig.sentiment}
                        </span>
                        <span className="risk-rel-badge rel-high">
                          Match: {matchItem.relevanceScore.toFixed(1)}/10
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} 
                        />
                      </div>
                    </div>

                    {/* Expand panel */}
                    {isExpanded && (
                      <div className="ind-card-expand flex">
                        <div className="ind-expand-left">
                          <div>
                            <div className="ind-exp-label">Why this matters for your risk profile</div>
                            <p className="ind-exp-text text-justify">
                              This external development triggers a potential exposure increase for <strong>{organisation.name}</strong> due to dependencies on key commodities and regional suppliers. We recommend reviewing current inventory and tracking compliance audits to mitigate operational fallout.
                            </p>
                          </div>

                          <div>
                            <div className="ind-exp-label">Linked Risk Register Items</div>
                            <div className="ind-risk-link-row">
                              <span className="ind-rl-icon">⚠️</span>
                              <div className="ind-rl-text">
                                <strong>RR-01:</strong> Regulatory Deforestation Compliance (Score: 8.8)
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="ind-expand-right">
                          <div className="ind-exp-label">Suggested Actions</div>
                          <div className="ind-action-block">
                            <div className="ind-action-row">
                              <span className="ind-action-dot" />
                              <span>Trigger supply chain vendor audit</span>
                            </div>
                            <div className="ind-action-row">
                              <span className="ind-action-dot" />
                              <span>Update compliance reporting dashboard</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {newsStories.length === 0 && (
                <div className="p-8 text-center text-slate-400 font-medium bg-white border border-slate-200 rounded-xl shadow-sm">
                  No matching news items found.
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW D: BOARD PACK */}
        {activeView === "board" && (
          <div className="flex flex-col gap-4 items-center">
            {/* Toolbar hidden on print */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm w-full max-w-[920px] flex justify-between items-center print:hidden">
              <div className="flex items-center gap-2 text-slate-800">
                <FileText size={16} />
                <span className="font-semibold text-xs text-slate-500">Board Presentation Deck Draft (A4 Print Ready)</span>
              </div>
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-900 text-white hover:bg-indigo-950 font-semibold rounded-lg text-xs"
              >
                <Printer size={12} />
                Print / Export PDF
              </button>
            </div>

            {/* The paper */}
            <div className="board-pack-paper w-full max-w-[920px] bg-white border border-slate-300 p-12 shadow-md print:shadow-none print:border-none print:p-0">
              {/* Masthead */}
              <div className="flex justify-between items-start border-bottom-2 border-slate-900 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Emerging Risk Report</span>
                  <h1 className="font-serif text-3xl font-bold text-slate-950 mt-1">{organisation.name}</h1>
                  <span className="text-xs text-slate-500 font-medium">Prepared for the Board &amp; Audit Committee &bull; Q2 2026 review cycle</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded uppercase tracking-wider block mb-2">Private &amp; Confidential</span>
                  <span className="text-[11px] text-slate-400 font-medium">Generated {new Date().toLocaleDateString()}</span>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-12 gap-6 mb-6">
                <div className="col-span-8">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Executive Summary</h4>
                  <p className="text-sm font-medium text-slate-700 leading-relaxed text-justify">
                    {boardPayload?.summary || `Emerging risk activity for ${organisation.name} has heightened overall exposure to Elevated. Key drivers include regulatory implementation pressure (e.g. EU AI Act, CSDDD) and geopolitical impacts on supply chains. Benchmarking against peers reveals critical alignment gaps, particularly in technology governance and climate disclosures. Executive priority is directed towards establishing KRIs and stabilizing key material actions.`}
                  </p>
                </div>
                
                <div className="col-span-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Overall Posture</h4>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold bg-red-100 text-red-800 px-2 py-0.5 border border-red-200 rounded">Elevated</span>
                    <span className="text-xs font-semibold text-red-600">worsening ▲</span>
                  </div>
                  {/* Slider simulation */}
                  <div className="flex justify-between items-center gap-1.5 mt-4">
                    {["Low", "Mod", "Elevated", "Severe"].map((post, idx) => (
                      <div 
                        key={post} 
                        className={`flex-1 h-3.5 rounded text-[8px] font-bold flex items-center justify-center border ${idx === 2 ? "bg-red-500 text-white border-red-600 shadow-sm" : "bg-slate-100 text-slate-400 border-slate-200"}`}
                      >
                        {post}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Movement stats */}
              <div className="border border-slate-200 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-5 divide-x divide-slate-100">
                  {[
                    { label: "New Principal Risks", val: "+2", color: "text-red-700" },
                    { label: "Escalating", val: "3 ▲", color: "text-red-700" },
                    { label: "Appetite Breaches", val: "2", color: "text-red-700" },
                    { label: "Mitigations Overdue", val: "4", color: "text-amber-700" },
                    { label: "New Peer Disclosures", val: "5", color: "text-slate-700" },
                  ].map((item, idx) => (
                    <div key={idx} className="px-4 first:pl-0 last:pr-0">
                      <div className={`font-serif text-xl font-bold tracking-tight mb-0.5 ${item.color}`}>{item.val}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table principal risks */}
              <div className="mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Principal risks requiring Board attention</h4>
                <table className="w-full text-left border-collapse text-xs border border-slate-200">
                  <thead>
                    <tr className="bg-slate-50 border-bottom border-slate-200 font-bold text-slate-700 uppercase tracking-wider">
                      <th className="p-2 border-right border-slate-200">#</th>
                      <th className="p-2 border-right border-slate-200">Risk Item</th>
                      <th className="p-2 border-right border-slate-200">Owner</th>
                      <th className="p-2 border-right border-slate-200 text-center">Residual</th>
                      <th className="p-2 border-right border-slate-200 text-center">Trend</th>
                      <th className="p-2 border-right border-slate-200 text-center">Appetite</th>
                      <th className="p-2">Decision Sought</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {[
                      { code: "RR-01", title: "Regulatory Deforestation Compliance", owner: "Chief Risk Officer", residual: "High", trend: "▲", appetite: "Breach", decision: "Resource allocation approval" },
                      { code: "RR-02", title: "AI Systems Governance & Logging Gaps", owner: "Chief Tech Officer", residual: "High", trend: "▲", appetite: "Breach", decision: "Compliance audit funding" },
                      { code: "RR-03", title: "Suez Shipping Lane Congestion", owner: "Supply Chain Head", residual: "Medium", trend: "→", appetite: "At Tolerance", decision: "Monitor buffer stock limits" },
                      { code: "RR-05", title: "Southern European Water Scarcity halts", owner: "Sustainability Head", residual: "Low", trend: "→", appetite: "Within", decision: "Endorse water recycling CapEx" }
                    ].map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2 border-right border-slate-200 font-mono font-semibold text-slate-400">{row.code}</td>
                        <td className="p-2 border-right border-slate-200 font-semibold text-slate-900">{row.title}</td>
                        <td className="p-2 border-right border-slate-200 text-slate-500">{row.owner}</td>
                        <td className="p-2 border-right border-slate-200 text-center">
                          <span className={`px-1.5 py-0.2 border rounded text-[9px] font-semibold ${getRatingClass(row.residual)}`}>
                            {row.residual}
                          </span>
                        </td>
                        <td className={`p-2 border-right border-slate-200 text-center font-bold ${row.trend === "▲" ? "text-red-600" : "text-slate-400"}`}>{row.trend}</td>
                        <td className="p-2 border-right border-slate-200 text-center">
                          <span className={`px-1.5 py-0.2 border rounded text-[9px] font-semibold ${getRatingClass(row.appetite)}`}>
                            {row.appetite}
                          </span>
                        </td>
                        <td className="p-2 font-medium text-slate-700 italic">{row.decision}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Two Column details: Reg Horizon & Peer positioning */}
              <div className="grid grid-cols-2 gap-8 mb-8 border-top border-slate-200 pt-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Regulatory compliance horizon</h4>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: "EU AI Act", date: "Aug 2026", status: "Partial", color: "var(--amber)" },
                      { name: "CSDDD Enforcement", date: "Jan 2026", status: "Behind", color: "var(--red)" },
                      { name: "CSRD/ESRS Statements", date: "FY2026", status: "Partial", color: "var(--amber)" },
                      { name: "TNFD Framework Disclosure", date: "FY2027", status: "Behind", color: "var(--red)" },
                    ].map((reg, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700 border-bottom border-slate-50 pb-1">
                        <span>{reg.name} &bull; <span className="text-slate-400 font-medium">{reg.date}</span></span>
                        <span className="px-1.5 py-0.2 rounded text-[8px] font-bold uppercase text-white" style={{ backgroundColor: reg.color }}>
                          {reg.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Peer positioning audit</h4>
                  <ul className="list-disc pl-4 text-xs text-slate-600 flex flex-col gap-1.5 font-medium">
                    <li><strong>4 of 12 peers</strong> have fully disclosed AI governance protocols in recent reports.</li>
                    <li><strong>2 peers</strong> published deforestation readiness plans aligning with CSDDD rules.</li>
                    <li><strong>1 peer</strong> (Nestlé) has published first TNFD v2.0 disclosures.</li>
                    <li><strong>5 material gaps</strong> identified between your current disclosures and peer statements.</li>
                  </ul>
                </div>
              </div>

              {/* Decisions sought */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5 mb-6">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Decisions sought from the Committee</h4>
                <div className="flex flex-col gap-3 text-xs text-slate-700 font-medium">
                  {boardPayload?.decisionsSought?.map((d: string, idx: number) => (
                    <div key={idx} className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-snug pt-0.5">{d}</p>
                    </div>
                  )) || (
                    <>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">1</span>
                        <p className="leading-snug pt-0.5">Approve the increased risk score and mitigation resource reallocation for RR-01 (Regulatory Deforestation compliance).</p>
                      </div>
                      <div className="flex gap-3 items-start">
                        <span className="w-5 h-5 rounded-full bg-indigo-900 text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0">2</span>
                        <p className="leading-snug pt-0.5">Approve funding for third-party AI audit log integration to meet August EU AI Act deadlines (RR-02).</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold uppercase tracking-wider border-top border-slate-200 pt-3 mt-6">
                <span>Generated by RiskLens platform</span>
                <span>Private &amp; Confidential &bull; for Board use only</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT SIDE DRAWER (RISK DETAILS) */}
      <div className={`signal-detail tpl-drawer ${selectedRisk ? "open" : ""}`}>
        {selectedRisk && (
          <div className="flex flex-col h-full bg-white">
            <div className="sd-hd border-bottom border-slate-100 p-4 bg-slate-50">
              <div className="sd-top flex justify-between items-center mb-1">
                <span className="text-[10px] font-mono font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded uppercase">
                  {selectedRisk.code} &bull; Emerging Risk
                </span>
                <div 
                  className="close-x w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center cursor-pointer"
                  onClick={() => setSelectedRisk(null)}
                >
                  <X size={14} />
                </div>
              </div>
              <h3 className="font-serif text-base font-bold text-slate-950 mt-1 leading-snug">{selectedRisk.title}</h3>
            </div>

            <div className="sd-body p-4 flex-1 overflow-y-auto flex flex-col gap-4">
              {/* Accountability Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <div className="text-[9.5px] text-slate-400 font-bold uppercase tracking-wider mb-2">Governance &amp; Accountability</div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center text-slate-700 text-xs font-bold font-serif">
                    {selectedRisk.ownerName.split(" ").map((n: string) => n[0]).join("")}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 text-xs leading-none">{selectedRisk.ownerName}</div>
                    <span className="text-[10px] text-slate-400">{selectedRisk.ownerRole}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="bg-white p-2 border border-slate-200 rounded text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Residual</div>
                    <span className="font-bold text-xs" style={{ color: selectedRisk.residualRating === "High" ? "var(--red)" : "var(--amber)" }}>{selectedRisk.residualRating} Rating</span>
                  </div>
                  <div className="bg-white p-2 border border-slate-200 rounded text-center">
                    <div className="text-[9px] text-slate-400 font-bold uppercase">Appetite</div>
                    <span className="font-bold text-xs" style={{ color: selectedRisk.appetiteStatus === "Breach" ? "var(--red)" : "var(--amber)" }}>{selectedRisk.appetiteStatus}</span>
                  </div>
                </div>
              </div>

              {/* Context Why relevant */}
              <div>
                <div className="sd-sec-label mb-1">Risk relevance context</div>
                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                  Calculated exposure score is <strong>{selectedRisk.score.toFixed(1)}/10</strong>, trending {selectedRisk.trendDirection === "Up" ? "worsening" : "neutral"} (+{selectedRisk.trendValue.toFixed(1)} since last board review). This risk is driven by matched external signals indicating tightening compliance mandates in target regions and raw material traceability bottlenecks.
                </p>
              </div>

              {/* KRIs list */}
              <div>
                <div className="sd-sec-label mb-2">Suggested Key Risk Indicators (KRIs)</div>
                <div className="flex flex-col gap-2">
                  {selectedRisk.kris?.map((kri: any) => (
                    <div key={kri.id} className="p-2 border border-slate-200 rounded-lg text-xs">
                      <div className="font-semibold text-slate-900 leading-tight">{kri.label}</div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>Threshold: {kri.threshold}</span>
                        <span className={`font-bold ${kri.breached ? "text-red-600" : "text-emerald-600"}`}>
                          Current: {kri.currentValue} ({kri.breached ? "Breached" : "Within"})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions list */}
              <div>
                <div className="sd-sec-label mb-2">Key Management Actions</div>
                <div className="flex flex-col gap-2">
                  {selectedRisk.actions?.map((act: any) => (
                    <div key={act.id} className="p-2 border border-slate-200 rounded-lg text-xs flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-800 leading-tight">{act.description}</div>
                        <span className="text-[10px] text-slate-400">Due: {new Date(act.dueAt).toLocaleDateString()}</span>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 border rounded-full ${getRatingClass(act.status)}`}>
                        {act.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Peer Disclosures */}
              <div>
                <div className="sd-sec-label mb-2">What Peers are doing</div>
                <div className="flex flex-col gap-1.5">
                  {peerDisclosures.slice(0, 3).map((pd: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span>{pd.peerName} &bull; <span className="text-slate-400 font-medium">{pd.theme}</span></span>
                      <span className={`text-[10px] font-bold ${pd.disclosed ? "text-emerald-700" : "text-slate-400"}`}>
                        {pd.disclosed ? "Disclosed" : "No disclosure"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
