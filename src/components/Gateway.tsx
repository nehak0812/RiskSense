"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./SharedUI";

const ANALYSIS_STEPS = [
  "Ingesting external signals from 2,840 sources",
  "Matching signals to organisation footprint",
  "Benchmarking against sector peers",
  "Scoring & prioritising emerging risks",
  "Compiling Your World workspace",
];

const DEFAULT_SUGGESTIONS = [
  { name: "Brightwell plc", industry: "Consumer Health & FMCG", meta: "FTSE 100 · LON: BWL", featured: true },
  { name: "Sterling Atlantic Bank", industry: "Banking & Financial Services", meta: "FTSE 100 · LON: STA", featured: false },
  { name: "Caldera Energy Group", industry: "Integrated Energy", meta: "FTSE 100 · LON: CEG", featured: false },
  { name: "Northwind Logistics", industry: "Transport & Logistics", meta: "FTSE 250 · LON: NWL", featured: false },
  { name: "Veridian Pharma", industry: "Pharmaceuticals", meta: "FTSE 100 · LON: VRD", featured: false },
  { name: "Aboukir Industries", industry: "Diversified Industrials", meta: "FTSE 100 · LON: ABK", featured: false },
];

interface GatewayProps {
  onSelect: (org: any) => void;
}

export default function Gateway({ onSelect }: GatewayProps) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hl, setHl] = useState(0);
  const [loading, setLoading] = useState<any>(null);
  const [step, setStep] = useState(0);
  const [dbOrgs, setDbOrgs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);

  // New onboarding fields
  const [formName, setFormName] = useState("");
  const [formIndustry, setFormIndustry] = useState("Consumer Health & FMCG");
  const [formGeographies, setFormGeographies] = useState("UK, EU, US");
  const [formPeers, setFormPeers] = useState("Reckitt, Haleon, Unilever");
  const [formCommodities, setFormCommodities] = useState("Cocoa, Palm Oil, Packaging");

  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch already onboarded companies
  useEffect(() => {
    fetch("/api/orgs")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setDbOrgs(data);
        }
      })
      .catch((err) => console.error("Error fetching db orgs:", err));
  }, []);

  const combinedSuggestions = React.useMemo(() => {
    const list = [...dbOrgs];
    DEFAULT_SUGGESTIONS.forEach((sug) => {
      if (!list.some((o) => o.name.toLowerCase() === sug.name.toLowerCase())) {
        list.push({
          id: sug.name.replace(/\s+/g, "-").toLowerCase(),
          name: sug.name,
          industry: sug.industry,
          geographies: JSON.stringify(["UK", "EU", "North America"]),
          peers: JSON.stringify(["Competitor A", "Competitor B"]),
          commodities: JSON.stringify(["Packaging"]),
          meta: sug.meta,
          featured: sug.featured,
        });
      }
    });
    return list;
  }, [dbOrgs]);

  const matches = q
    ? combinedSuggestions.filter(
        (o) =>
          o.name.toLowerCase().includes(q.toLowerCase()) ||
          o.industry.toLowerCase().includes(q.toLowerCase())
      )
    : combinedSuggestions;

  const runAnalysis = async (org: any) => {
    setLoading(org);
    setStep(0);
    setOpen(false);

    // Progress animation
    let currentStep = 0;
    const progressInterval = setInterval(() => {
      currentStep++;
      if (currentStep < ANALYSIS_STEPS.length) {
        setStep(currentStep);
      } else {
        clearInterval(progressInterval);
      }
    }, 1200);

    try {
      let finalOrg = org;
      // If it doesn't have a real UUID (meaning it's a default static mock) or if it's fresh,
      // let's onboard it to the database so it generates actual signals/risks matching.
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(org.id || "");
      if (!isUUID) {
        const onboardRes = await fetch("/api/onboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: org.name,
            industry: org.industry,
            geographies: JSON.parse(org.geographies || "[]"),
            peers: JSON.parse(org.peers || "[]"),
            commodities: JSON.parse(org.commodities || "[]"),
          }),
        });
        if (onboardRes.ok) {
          finalOrg = await onboardRes.json();
        }
      }

      // Ensure at least 6 seconds of animation
      setTimeout(() => {
        clearInterval(progressInterval);
        setStep(ANALYSIS_STEPS.length);
        setTimeout(() => {
          onSelect(finalOrg);
        }, 500);
      }, 6200);
    } catch (e) {
      console.error("Error running onboarding analysis:", e);
      // fallback to proceeding
      setTimeout(() => {
        clearInterval(progressInterval);
        onSelect(org);
      }, 6200);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newOrgPlaceholder = {
      id: "temp-onboarding-id",
      name: formName,
      industry: formIndustry,
      geographies: JSON.stringify(formGeographies.split(",").map((x) => x.trim()).filter(Boolean)),
      peers: JSON.stringify(formPeers.split(",").map((x) => x.trim()).filter(Boolean)),
      commodities: JSON.stringify(formCommodities.split(",").map((x) => x.trim()).filter(Boolean)),
      meta: `Custom Industry · Headquartered Global`,
      featured: false,
    };

    runAnalysis(newOrgPlaceholder);
  };

  if (loading) {
    return (
      <div className="scroll">
        <div className="gateway">
          <div className="gw-loading fade-up">
            <div className="spinner"></div>
            <div
              style={{
                fontFamily: "var(--serif)",
                fontSize: 20,
                fontWeight: 600,
                marginTop: 20,
                letterSpacing: "-.3px",
              }}
            >
              Analysing {loading.name}
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text2)", marginTop: 6 }}>
              {loading.industry}
            </div>
            <div className="gw-steps">
              {ANALYSIS_STEPS.map((s, i) => (
                <div key={i} className={`gw-step ${i < step ? "done" : i === step ? "active" : ""}`}>
                  <div className="gw-step-ic">
                    {i < step ? (
                      <Icon
                        name="arrowR"
                        size={12}
                        color="#fff"
                        sw={2.5}
                        style={{ transform: "rotate(0deg)" }}
                      />
                    ) : i === step ? (
                      <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }}></div>
                    ) : (
                      <span style={{ fontSize: 9, fontWeight: 700, color: "var(--text3)" }}>
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {s}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="scroll">
      <div className="gateway">
        <div className="gateway-inner fade-up" style={{ maxWidth: 640 }}>
          <div className="gateway-eyebrow">
            <span className="eyebrow">Your World</span>
          </div>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h1 className="gateway-title" style={{ margin: 0 }}>
              {showForm ? "Analyse Organisation Exposure" : "Select your organisation"}
            </h1>
            <button
              onClick={() => setShowForm(!showForm)}
              className="btn btn-ghost"
              style={{ padding: "4px 10px", fontSize: 12 }}
            >
              {showForm ? "← Back to search" : "+ Onboard new company"}
            </button>
          </div>

          <p className="gateway-sub" style={{ marginTop: 10, marginBottom: 24 }}>
            {showForm
              ? "Provide your organisation's details to run a semantic vector search across global risk feeds, fetch peer disclosures, and map custom risk exposure."
              : "Choose an organisation to unlock Your World and The Intersection — its own disclosed risk profile, peer benchmarking, and the external signals scored for relevance."}
          </p>

          {showForm ? (
            <form onSubmit={handleFormSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                    Organisation Name
                  </label>
                  <input
                    type="text"
                    className="select"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)" }}
                    placeholder="e.g. Unilever plc"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                    Industry Classification
                  </label>
                  <select
                    className="select"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)" }}
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                  >
                    <option>Consumer Health & FMCG</option>
                    <option>Banking & Financial Services</option>
                    <option>Integrated Energy</option>
                    <option>Transport & Logistics</option>
                    <option>Pharmaceuticals</option>
                    <option>Diversified Industrials</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                  Primary Geographies (comma separated)
                </label>
                <input
                  type="text"
                  className="select"
                  style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)" }}
                  placeholder="UK & Ireland, EU, North America"
                  value={formGeographies}
                  onChange={(e) => setFormGeographies(e.target.value)}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                    Peer Benchmark Group (comma separated)
                  </label>
                  <input
                    type="text"
                    className="select"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)" }}
                    placeholder="Reckitt, Haleon, Unilever"
                    value={formPeers}
                    onChange={(e) => setFormPeers(e.target.value)}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                    Key Commodities / Inputs
                  </label>
                  <input
                    type="text"
                    className="select"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)" }}
                    placeholder="Cocoa, Palm Oil, Packaging"
                    value={formCommodities}
                    onChange={(e) => setFormCommodities(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", height: 42, justifyContent: "center", marginTop: 8 }}
              >
                Run Risk Analysis <Icon name="arrowR" size={15} color="#fff" />
              </button>
            </form>
          ) : (
            <>
              <div className="gw-search">
                <span className="s-ico">
                  <Icon name="search" size={19} />
                </span>
                <input
                  ref={inputRef}
                  className="input"
                  placeholder="Search for a company, e.g. Brightwell plc…"
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setOpen(true);
                    setHl(0);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      setHl((h) => Math.min(h + 1, matches.length - 1));
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      setHl((h) => Math.max(h - 1, 0));
                    } else if (e.key === "Enter" && matches[hl]) {
                      runAnalysis(matches[hl]);
                    } else if (e.key === "Escape") {
                      setOpen(false);
                    }
                  }}
                />
                {open && matches.length > 0 && (
                  <div className="gw-suggest">
                    {matches.map((o, i) => (
                      <div
                        key={o.name}
                        className={`gw-sug-item ${i === hl ? "hl" : ""}`}
                        onMouseEnter={() => setHl(i)}
                        onClick={() => runAnalysis(o)}
                      >
                        <div
                          className="mono"
                          style={{
                            background: o.featured ? "var(--accent)" : "var(--slate)",
                            width: 30,
                            height: 30,
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: "5px",
                            fontWeight: 700,
                          }}
                        >
                          {o.name[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div className="gw-sug-name" style={{ fontWeight: 600 }}>
                            {o.name}
                            {o.featured && (
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  color: "var(--accent)",
                                  background: "var(--accent-l)",
                                  padding: "2px 6px",
                                  borderRadius: 4,
                                  marginLeft: 8,
                                  letterSpacing: ".4px",
                                }}
                              >
                                DEMO
                              </span>
                            )}
                          </div>
                          <div className="gw-sug-meta">
                            {o.industry} · {o.meta || "Registered Organisation"}
                          </div>
                        </div>
                        <Icon name="arrowR" size={15} color="var(--text3)" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="gw-examples">
                <div className="gw-ex-label">Recent & example organisations</div>
                <div className="gw-chips">
                  {combinedSuggestions.slice(0, 5).map((o) => (
                    <div key={o.name} className="gw-chip" onClick={() => runAnalysis(o)}>
                      <div
                        className="mono"
                        style={{
                          background: o.featured ? "var(--accent)" : "var(--slate)",
                          width: 24,
                          height: 24,
                          fontSize: 10,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "4px",
                          fontWeight: 700,
                        }}
                      >
                        {o.name[0]}
                      </div>
                      <div>
                        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{o.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{o.industry}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
