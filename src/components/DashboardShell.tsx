"use client";

import React, { useState, useEffect } from "react";
import { 
  Compass, 
  Layers, 
  HelpCircle, 
  X, 
  Settings, 
  Clock, 
  Search,
  Paintbrush
} from "lucide-react";
import { useTweaks, ACCENTS } from "@/context/tweaksContext";
import GlobalSignalFeed from "./GlobalSignalFeed";
import OrgOnboarding from "./OrgOnboarding";
import OrgResultWorkspace from "./OrgResultWorkspace";
import WefReference from "./WefReference";

interface OpenOrg {
  id: string;
  name: string;
  industry: string;
}

interface DashboardShellProps {
  onBackToLanding?: () => void;
}

export default function DashboardShell({ onBackToLanding }: DashboardShellProps) {
  const { accent, density, displayType, setAccent, setDensity, setDisplayType } = useTweaks();
  
  // Tab control states
  const [activeTab, setActiveTab] = useState<string>("feed");
  const [openOrgs, setOpenOrgs] = useState<OpenOrg[]>([]);
  const [initialCompanyName, setInitialCompanyName] = useState("");
  const [tweaksOpen, setTweaksOpen] = useState(false);

  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    }));
  }, []);

  const handleAnalyzeOrg = (companyName: string) => {
    setInitialCompanyName(companyName);
    setActiveTab("onboard");
  };

  const handleAnalysisComplete = (org: any) => {
    // Add to open org tabs if not already present
    const exists = openOrgs.find(o => o.id === org.id);
    if (!exists) {
      setOpenOrgs([...openOrgs, { id: org.id, name: org.name, industry: org.industry }]);
    }
    setActiveTab(org.id);
  };

  const handleCloseOrgTab = (orgId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = openOrgs.filter(o => o.id !== orgId);
    setOpenOrgs(updated);
    
    if (activeTab === orgId) {
      // Switch back to feed
      setActiveTab("feed");
    }
  };

  return (
    <div className="shell flex flex-col h-screen overflow-hidden">
      {/* TOP NAVIGATION BAR */}
      <div className="topnav">
        <div 
          className="logo-area" 
          style={{ cursor: "pointer" }}
          onClick={onBackToLanding}
          title="Go back to landing page"
        >
          <div className="logo-gem">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-name font-semibold">RiskLens</span>
        </div>

        <div className="main-tabs">
          <div 
            className={`mtab ${activeTab === "feed" ? "active" : ""}`}
            onClick={() => setActiveTab("feed")}
          >
            <div className="tab-icon">
              <Compass size={14} />
            </div>
            <span>Global Signal Feed</span>
          </div>

          <div 
            className={`mtab ${activeTab === "onboard" ? "active" : ""}`}
            onClick={() => setActiveTab("onboard")}
          >
            <div className="tab-icon">
              <Layers size={14} />
            </div>
            <span>Organisation Risk Analysis</span>
          </div>

          <div 
            className={`mtab wef-tab ${activeTab === "wef" ? "active" : ""}`}
            onClick={() => setActiveTab("wef")}
          >
            <div className="tab-icon">
              <HelpCircle size={14} />
            </div>
            <span>WEF Global Risks <span className="wef-tab-year">2026</span></span>
          </div>

          {/* Render Dynamic Org Tabs */}
          {openOrgs.map(org => {
            const orgInitials = org.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
            const isActive = activeTab === org.id;
            return (
              <React.Fragment key={org.id}>
                <div className="tab-sep"></div>
                <div 
                  className={`org-result-tab ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(org.id)}
                >
                  <div className="tab-co-icon" style={{ backgroundColor: isActive ? "var(--accent)" : "var(--text3)" }}>
                    {orgInitials}
                  </div>
                  <span className="max-w-[120px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {org.name}
                  </span>
                  <div 
                    className="tab-x" 
                    onClick={(e) => handleCloseOrgTab(org.id, e)}
                    title="Close analysis tab"
                  >
                    ✕
                  </div>
                </div>
              </React.Fragment>
            );
          })}
        </div>

        <div className="nav-right">
          <div className="live-badge font-semibold">
            <span className="pulse-dot"></span>
            LIVE
          </div>
          <div className="date-chip font-medium">
            {currentDate}
          </div>
        </div>
      </div>

      {/* INNER VIEW PORT */}
      <div className="flex-1 overflow-hidden relative flex flex-col" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        {activeTab === "feed" && (
          <div className="page active">
            <GlobalSignalFeed onAnalyzeOrg={handleAnalyzeOrg} />
          </div>
        )}
        
        {activeTab === "onboard" && (
          <div className="page active">
            <OrgOnboarding 
              initialCompanyName={initialCompanyName} 
              onAnalysisComplete={handleAnalysisComplete} 
            />
          </div>
        )}

        {activeTab === "wef" && (
          <div className="page active">
            <WefReference />
          </div>
        )}

        {/* Dynamic Org Workspace */}
        {openOrgs.map(org => (
          <div 
            key={org.id}
            className={`page ${activeTab === org.id ? "active" : ""}`}
          >
            <OrgResultWorkspace 
              orgId={org.id} 
              onClose={() => {
                const updated = openOrgs.filter(o => o.id !== org.id);
                setOpenOrgs(updated);
                setActiveTab("feed");
              }}
            />
          </div>
        ))}
      </div>

      {/* FLOATING ACTION SETTINGS TRIGGER */}
      <div 
        className="fixed bottom-4 right-4 z-50 bg-indigo-900 text-white p-3 rounded-full shadow-lg cursor-pointer hover:bg-indigo-950 transition-colors flex items-center justify-center print:hidden"
        onClick={() => setTweaksOpen(!tweaksOpen)}
      >
        <Paintbrush size={18} />
      </div>

      {/* TWEAKS PANEL */}
      <div id="rl-tweaks" className={tweaksOpen ? "show" : ""}>
        <div className="rlt-hd">
          <div className="rlt-hd-t"><span className="gem"></span>Settings &amp; Theme</div>
          <div className="rlt-x cursor-pointer" onClick={() => setTweaksOpen(false)}>✕</div>
        </div>
        <div className="rlt-body">
          <div>
            <div className="rlt-sec-l font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">Accent Swatches</div>
            <div className="rlt-sw flex gap-2.5">
              {ACCENTS.map(acc => (
                <div 
                  key={acc.hex}
                  className={`rlt-swatch cursor-pointer w-7 h-7 rounded-full transition-transform ${accent === acc.hex ? "on ring-2 ring-indigo-900 scale-110" : ""}`}
                  style={{ backgroundColor: acc.hex }}
                  onClick={() => setAccent(acc.hex)}
                />
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="rlt-sec-l font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">Layout Density</div>
            <div className="rlt-seg flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <div 
                className={`rlt-seg-btn flex-1 text-center py-1.5 text-xs font-semibold cursor-pointer rounded-md ${density === "default" ? "on bg-white text-indigo-950 shadow-sm" : "text-slate-500"}`}
                onClick={() => setDensity("default")}
              >
                Default
              </div>
              <div 
                className={`rlt-seg-btn flex-1 text-center py-1.5 text-xs font-semibold cursor-pointer rounded-md ${density === "dense" ? "on bg-white text-indigo-950 shadow-sm" : "text-slate-500"}`}
                onClick={() => setDensity("dense")}
              >
                Compact
              </div>
            </div>
          </div>
          <div className="mt-4">
            <div className="rlt-sec-l font-semibold text-xs text-slate-500 uppercase tracking-wider mb-2">Typography display</div>
            <div className="rlt-seg flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <div 
                className={`rlt-seg-btn flex-1 text-center py-1.5 text-xs font-semibold cursor-pointer rounded-md ${displayType === "serif" ? "on bg-white text-indigo-950 shadow-sm" : "text-slate-500"}`}
                onClick={() => setDisplayType("serif")}
              >
                Serif
              </div>
              <div 
                className={`rlt-seg-btn flex-1 text-center py-1.5 text-xs font-semibold cursor-pointer rounded-md ${displayType === "sans" ? "on bg-white text-indigo-950 shadow-sm" : "text-slate-500"}`}
                onClick={() => setDisplayType("sans")}
              >
                Sans
              </div>
            </div>
          </div>
        </div>
        <div className="rlt-foot text-[10px] text-slate-400 mt-3 border-top border-slate-100 pt-2">
          Changes apply live and are persisted with settings.
        </div>
      </div>
    </div>
  );
}
