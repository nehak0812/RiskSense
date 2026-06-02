"use client";

import React, { useState, useEffect } from "react";
import { Icon, SignalDrawer, DomainTag } from "./SharedUI";
import WorldToday from "./WorldToday";
import CorporatePulse from "./CorporatePulse";
import ThoughtLeaders from "./ThoughtLeaders";
import Gateway from "./Gateway";
import YourWorldView from "./YourWorldView";
import IntersectionView from "./IntersectionView";
import ChatPanel from "./ChatPanel";

interface DashboardShellProps {
  onBackToLanding?: () => void;
}

// Risk Drawer Component (inline for DashboardShell)
function RiskDrawer({
  risk,
  org,
  onClose,
  onSignal,
}: {
  risk: any | null;
  org: any | null;
  onClose: () => void;
  onSignal: (s: any) => void;
}) {
  if (!risk) return null;

  // Fallback linked signals
  const matchedSignals = risk.signals || [];

  return (
    <React.Fragment>
      <div className={`drawer-scrim ${risk ? "open" : ""}`} onClick={onClose}></div>
      <aside className={`drawer ${risk ? "open" : ""}`}>
        <div className="drawer-inner">
          <div className="drawer-head">
            <span
              className={`mini-badge ${
                risk.score >= 8.0 ? "level-critical" : risk.score >= 7.0 ? "level-high" : "level-medium"
              }`}
              style={{ fontSize: 10 }}
            >
              {risk.score >= 8.0 ? "Critical" : risk.score >= 7.0 ? "High" : "Medium"} · Score {risk.score}
            </span>
            <button
              className="nav-icon-btn"
              onClick={onClose}
              style={{ marginLeft: "auto", width: 28, height: 28 }}
            >
              <Icon name="close" size={15} />
            </button>
          </div>
          <h2 className="drawer-title serif" style={{ margin: "12px 0 8px" }}>{risk.title}</h2>
          
          <div className="drawer-chips" style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <DomainTag id={risk.category ? risk.category.toLowerCase().substring(0, 4) : "reg"} full />
            {risk.peerGap && <span className="mini-badge badge-gap">Peer gap</span>}
            {risk.isPrincipal && <span className="mini-badge badge-emerging">Emerging</span>}
            <span className={`trend ${risk.trendDirection.toLowerCase()}`}>
              {risk.trendDirection === "Up" ? "▲ Escalating" : risk.trendDirection === "Down" ? "▼ Easing" : "→ Stable"}
            </span>
          </div>

          <div className="dr-section" style={{ borderTop: "none", paddingTop: 0 }}>
            <div className="dr-label" style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>Governance</div>
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
              <div
                className="mono"
                style={{
                  background: "var(--bg4)",
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {risk.ownerName ? risk.ownerName.split(" ").map((n: string) => n[0]).join("") : "SR"}
              </div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600 }}>
                  {risk.ownerName || "S. Rahman"} · {risk.ownerRole || "Chief Risk Officer"}
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text3)" }}>
                  Oversight: Audit & Risk Committee
                </div>
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[
                ["Inherent", risk.inherentRating || "High", "rag-red"],
                ["Controls", risk.controlEffectiveness || "Partial", "rag-amber"],
                ["Residual", risk.residualRating || "High", "rag-red"],
                ["Appetite", risk.appetiteStatus || "Breach", risk.appetiteStatus?.toLowerCase() === "breach" ? "rag-red" : "rag-green"],
              ].map(([l, v, c]) => (
                <div
                  key={l}
                  style={{
                    textAlign: "center",
                    padding: "8px 4px",
                    background: "var(--bg3)",
                    borderRadius: 7,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8.5,
                      fontWeight: 700,
                      letterSpacing: ".4px",
                      textTransform: "uppercase",
                      color: "var(--text3)",
                      marginBottom: 4,
                    }}
                  >
                    {l}
                  </div>
                  <span className={`rag ${c}`} style={{ fontSize: 9 }}>
                    {v}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="dr-section dr-why" style={{ background: "var(--accent-l)", padding: 12, borderRadius: 8, margin: "16px 0" }}>
            <div className="dr-label" style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--accent)" }}>
              Why this is relevant to {org?.name || "your organisation"}
            </div>
            <p className="dr-text" style={{ fontSize: 12, lineHeight: 1.5, color: "var(--text1)", margin: "4px 0 0" }}>
              {risk.why || "External market dynamics that may affect operational efficiency or regulatory adherence."}
            </p>
          </div>

          <div className="dr-section">
            <div className="dr-label" style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>Suggested KRIs</div>
            <ul style={{ paddingLeft: 16, fontSize: 11.5, color: "var(--text2)", lineHeight: 1.7 }}>
              <li>% of tier-2/3 suppliers screened against latest designations</li>
              <li>Share of inputs sourced from single-origin / high-stress regions</li>
              <li>Mitigation actions on track vs. overdue</li>
            </ul>
          </div>

          <div className="dr-section" style={{ marginTop: 16 }}>
            <div className="dr-label" style={{ fontWeight: 700, fontSize: 11, textTransform: "uppercase", color: "var(--text3)", marginBottom: 8 }}>Key management questions</div>
            <ol style={{ paddingLeft: 16, fontSize: 11.5, color: "var(--text2)", lineHeight: 1.7 }}>
              <li>What is our residual exposure after current controls?</li>
              <li>How does our position compare to disclosed peer readiness?</li>
              <li>Which mitigations require Board decision this cycle?</li>
            </ol>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}

export default function DashboardShell({ onBackToLanding }: DashboardShellProps) {
  const [lens, setLens] = useState("world");
  const [worldView, setWorldView] = useState("today");
  const [org, setOrg] = useState<any>(null);
  const [sigDrawer, setSigDrawer] = useState<any>(null);
  const [riskDrawer, setRiskDrawer] = useState<any>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const orgUnlocked = !!org;

  const selectOrg = async (selected: any) => {
    try {
      const res = await fetch(`/api/orgs/${selected.id}`);
      if (res.ok) {
        const fullData = await res.json();
        const mergedOrg = {
          ...fullData.organisation,
          matches: fullData.matches || [],
        };
        setOrg(mergedOrg);
      } else {
        setOrg(selected);
      }
    } catch (e) {
      console.error("Error fetching full org data:", e);
      setOrg(selected);
    }
    setLens("yourworld");
  };

  const resetOrg = () => {
    setOrg(null);
    setLens("yourworld");
  };

  const analyseSignal = () => {
    setSigDrawer(null);
    if (!org) {
      setLens("yourworld");
    } else {
      setLens("intersection");
    }
  };

  const handleCite = async (citation: string) => {
    // Search matched signals from database based on citation text keyword
    try {
      const res = await fetch("/api/signals");
      if (res.ok) {
        const signals = await res.json();
        const found = signals.find(
          (s: any) =>
            s.source.toLowerCase().includes(citation.toLowerCase().slice(0, 6)) ||
            citation.toLowerCase().includes(s.domain.toLowerCase()) ||
            s.title.toLowerCase().includes(citation.toLowerCase().slice(0, 8))
        );
        if (found) {
          setChatOpen(false);
          setSigDrawer(found);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const LensTab = ({
    id,
    kicker,
    label,
    icon,
    locked,
  }: {
    id: string;
    kicker: string;
    label: string;
    icon: string;
    locked?: boolean;
  }) => (
    <div
      className={`lens-tab ${lens === id ? "active" : ""} ${locked ? "locked" : ""}`}
      onClick={() => setLens(id)}
    >
      <Icon name={icon} size={16} className="lens-ic" />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
        <span className="lens-kicker">{kicker}</span>
        <span>{label}</span>
      </div>
      {locked && <Icon name="lock" size={11} className="lock" style={{ marginLeft: 2 }} />}
    </div>
  );

  const SubTab = ({ id, label, icon }: { id: string; label: string; icon: string }) => (
    <div className={`subtab ${worldView === id ? "active" : ""}`} onClick={() => setWorldView(id)}>
      <Icon name={icon} size={14} />
      {label}
    </div>
  );

  return (
    <div className="shell">
      {/* top nav */}
      <div className="topnav">
        <div
          className="logo-area"
          style={{ cursor: "pointer" }}
          onClick={() => {
            if (onBackToLanding) {
              onBackToLanding();
            } else {
              setLens("world");
              setWorldView("today");
            }
          }}
        >
          <div className="logo-gem">
            <svg viewBox="0 0 24 24">
              <path d="M12 3 L21 8 L12 13 L3 8 Z" />
              <path d="M3 8 V16 L12 21 L21 16 V8" />
            </svg>
          </div>
          <div className="logo-name">
            Risk<b>Lens</b>
          </div>
        </div>
        <div className="lens-tabs">
          <LensTab id="world" kicker="The" label="World" icon="globe" />
          <div className="lens-divider"></div>
          <LensTab id="yourworld" kicker="Your" label="World" icon="building" locked={!orgUnlocked} />
        </div>
        <div className="nav-right">
          <span className="live-badge">
            <span className="pulse-dot"></span>Live
          </span>
          <span className="date-chip">
            {new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
          </span>
          <button className="nav-icon-btn chat-launch" onClick={() => setChatOpen(true)}>
            <Icon name="chat" size={15} />
            Ask RiskLens
          </button>
        </div>
      </div>

      {/* sub-nav for The World */}
      {lens === "world" && (
        <div className="subnav">
          <span className="subnav-label">The World</span>
          <SubTab id="today" label="The World Today" icon="zap" />
          <SubTab id="pulse" label="Corporate Risk Pulse" icon="building" />
          <SubTab id="leaders" label="Thought Leaders' Voice" icon="bulb" />
          <div className="subnav-right">
            <Icon name="filter" size={13} />
            Consistent risk-domain filtering across all views
          </div>
        </div>
      )}
      {(lens === "yourworld" || lens === "intersection") && orgUnlocked && (
        <div className="subnav">
          <span className="subnav-label">{org.name}</span>
          <div className={`subtab ${lens === "yourworld" ? "active" : ""}`} onClick={() => setLens("yourworld")}>
            <Icon name="building" size={14} />
            Your World
          </div>
          <div className={`subtab ${lens === "intersection" ? "active" : ""}`} onClick={() => setLens("intersection")}>
            <Icon name="link" size={14} />
            The Intersection
          </div>
          <div className="subnav-right">
            <span className="pulse-dot"></span>
            updated 4 min ago
          </div>
        </div>
      )}

      {/* stage */}
      <div className="stage">
        <div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
          {lens === "world" && worldView === "today" && <WorldToday onSignal={setSigDrawer} />}
          {lens === "world" && worldView === "pulse" && <CorporatePulse />}
          {lens === "world" && worldView === "leaders" && <ThoughtLeaders />}
          {lens === "yourworld" && !orgUnlocked && <Gateway onSelect={selectOrg} />}
          {lens === "yourworld" && orgUnlocked && (
            <YourWorldView
              orgData={{ organisation: org, matches: org.matches || [] }}
              onReset={resetOrg}
              onSignal={setSigDrawer}
              onRisk={setRiskDrawer}
              selRisk={riskDrawer?.id || null}
            />
          )}
          {lens === "intersection" && !orgUnlocked && <Gateway onSelect={selectOrg} />}
          {lens === "intersection" && orgUnlocked && (
            <IntersectionView
              orgData={{ organisation: org, matches: org.matches || [] }}
              onReset={resetOrg}
              onSignal={setSigDrawer}
            />
          )}
        </div>
      </div>

      {/* drawers + chat */}
      <SignalDrawer sig={sigDrawer} onClose={() => setSigDrawer(null)} onAnalyse={analyseSignal} />
      <RiskDrawer
        risk={riskDrawer}
        org={org}
        onClose={() => setRiskDrawer(null)}
        onSignal={(s) => {
          setRiskDrawer(null);
          setSigDrawer(s);
        }}
      />
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} org={org} onCiteClick={handleCite} />
    </div>
  );
}
