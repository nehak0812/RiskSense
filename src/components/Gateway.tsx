"use client";

import React, { useState, useEffect, useRef } from "react";
import { Icon } from "./SharedUI";

const ANALYSIS_STEPS = [
  "Ingesting external signals from 2,840 sources",
  "Matching signals to organisation footprint",
  "Benchmarking against sector peers",
  "Scoring & prioritising emerging risks",
  "Building Corporate Lens profile",
];

const SCANNING_STEPS = [
  "Searching web for corporate footprint...",
  "Analyzing public disclosures & filings...",
  "Mapping operational geographies...",
  "Identifying peer benchmark group...",
];

const FORBES_2000 = [
  { name: "Brightwell plc", industry: "Consumer Health & FMCG", geographies: ["UK", "EU", "US"], peers: ["Reckitt", "Haleon", "Unilever"], meta: "FTSE 100 · LON: BWL", featured: true },
  { name: "JPMorgan Chase", industry: "Banking & Financial Services", geographies: ["US", "UK", "Global"], peers: ["Bank of America", "Citigroup", "Goldman Sachs", "Morgan Stanley"], meta: "NYSE: JPM" },
  { name: "Saudi Aramco", industry: "Integrated Energy", geographies: ["Saudi Arabia", "Global"], peers: ["Shell", "ExxonMobil", "Chevron", "BP"], meta: "TADAWUL: 2222" },
  { name: "Apple", industry: "Technology & Telecom", geographies: ["US", "China", "Global"], peers: ["Microsoft", "Google", "Samsung", "Sony"], meta: "NASDAQ: AAPL" },
  { name: "Microsoft", industry: "Technology & Telecom", geographies: ["US", "EU", "Global"], peers: ["Apple", "Google", "Amazon", "Oracle"], meta: "NASDAQ: MSFT" },
  { name: "Shell", industry: "Integrated Energy", geographies: ["UK", "Netherlands", "Global"], peers: ["Saudi Aramco", "ExxonMobil", "BP", "Chevron"], meta: "NYSE: SHEL" },
  { name: "Unilever", industry: "Consumer Health & FMCG", geographies: ["UK", "EU", "Global"], peers: ["Nestlé", "P&G", "Reckitt", "Danone"], meta: "NYSE: UL" },
  { name: "Nestlé", industry: "Consumer Health & FMCG", geographies: ["Switzerland", "Global"], peers: ["Unilever", "P&G", "Danone", "Mondelēz"], meta: "SIX: NESN" },
  { name: "Novartis", industry: "Pharmaceuticals", geographies: ["Switzerland", "Global"], peers: ["Roche", "Pfizer", "Merck", "AstraZeneca"], meta: "NYSE: NVS" },
  { name: "Sterling Atlantic Bank", industry: "Banking & Financial Services", geographies: ["UK", "US"], peers: ["Barclays", "HSBC", "Lloyds"], meta: "FTSE 100 · LON: STA" },
  { name: "Caldera Energy Group", industry: "Integrated Energy", geographies: ["UK", "North Sea"], peers: ["BP", "Shell", "TotalEnergies"], meta: "FTSE 100 · LON: CEG" },
  { name: "Northwind Logistics", industry: "Transport & Logistics", geographies: ["UK", "EU"], peers: ["DHL", "FedEx", "DSV"], meta: "FTSE 250 · LON: NWL" },
  { name: "Veridian Pharma", industry: "Pharmaceuticals", geographies: ["UK", "US"], peers: ["GSK", "AstraZeneca", "Pfizer"], meta: "FTSE 100 · LON: VRD" },
  { name: "Aboukir Industries", industry: "Diversified Industrials", geographies: ["UK", "Egypt"], peers: ["Siemens", "GE", "Honeywell"], meta: "FTSE 100 · LON: ABK" },
  { name: "Amazon", industry: "Technology & Telecom", geographies: ["US", "EU", "Global"], peers: ["Walmart", "Target", "eBay", "Alibaba"], meta: "NASDAQ: AMZN" },
  { name: "ExxonMobil", industry: "Integrated Energy", geographies: ["US", "Global"], peers: ["Chevron", "Shell", "BP", "Saudi Aramco"], meta: "NYSE: XOM" },
  { name: "Toyota Motor", industry: "Diversified Industrials", geographies: ["Japan", "US", "Global"], peers: ["Volkswagen", "Ford", "General Motors", "Honda"], meta: "TSE: 7203" },
  { name: "Samsung Electronics", industry: "Technology & Telecom", geographies: ["South Korea", "Global"], peers: ["Apple", "Sony", "TSMC", "Intel"], meta: "KRX: 005930" },
  { name: "Walmart", industry: "Consumer Health & FMCG", geographies: ["US", "Global"], peers: ["Amazon", "Target", "Costco", "Kroger"], meta: "NYSE: WMT" },
  { name: "Goldman Sachs", industry: "Banking & Financial Services", geographies: ["US", "Global"], peers: ["Morgan Stanley", "JPMorgan Chase", "Citigroup"], meta: "NYSE: GS" },
];

const INDUSTRIES = [
  "Consumer Health & FMCG",
  "Banking & Financial Services",
  "Integrated Energy",
  "Transport & Logistics",
  "Pharmaceuticals",
  "Diversified Industrials",
  "Technology & Telecom",
  "Retail & E-commerce",
  "Automotive & Manufacturing",
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

  // Scanning states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStep, setScanStep] = useState(0);
  const [showFormDetails, setShowFormDetails] = useState(false);

  // Form fields
  const [formName, setFormName] = useState("");
  const [formIndustry, setFormIndustry] = useState("Consumer Health & FMCG");
  const [formGeographies, setFormGeographies] = useState("UK, EU, US");
  const [formPeers, setFormPeers] = useState("Reckitt, Haleon, Unilever");

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    FORBES_2000.forEach((sug) => {
      if (!list.some((o) => o.name.toLowerCase() === sug.name.toLowerCase())) {
        list.push({
          id: sug.name.replace(/\s+/g, "-").toLowerCase(),
          name: sug.name,
          industry: sug.industry,
          geographies: JSON.stringify(sug.geographies),
          peers: JSON.stringify(sug.peers),
          meta: sug.meta,
          featured: sug.featured || false,
        });
      }
    });
    return list;
  }, [dbOrgs]);

  const matches = React.useMemo(() => {
    if (!q.trim()) return [];
    const lowercaseQ = q.toLowerCase();
    const filtered = combinedSuggestions.filter(
      (o) =>
        o.name.toLowerCase().includes(lowercaseQ) ||
        o.industry.toLowerCase().includes(lowercaseQ)
    );

    const exactMatch = combinedSuggestions.some(
      (o) => o.name.toLowerCase() === lowercaseQ
    );

    const list = [...filtered];

    // Append "+ Onboard custom company" option if there's no exact match
    if (!exactMatch && q.trim().length > 0) {
      list.push({
        id: "custom-onboard",
        name: q.trim(),
        industry: "Custom Organisation",
        geographies: JSON.stringify(["Global"]),
        peers: JSON.stringify(["Competitor A", "Competitor B"]),
        meta: "Onboard new custom company",
        isCustomSuggestion: true,
      } as any);
    }

    return list;
  }, [q, combinedSuggestions]);

  // Dynamically update industry list to support any custom industry classification returned by agent
  const currentIndustries = React.useMemo(() => {
    const list = [...INDUSTRIES];
    if (formIndustry && !list.includes(formIndustry)) {
      list.push(formIndustry);
    }
    return list;
  }, [formIndustry]);

  const handleSelectCompany = async (company: any) => {
    setIsScanning(true);
    setScanStep(0);
    setOpen(false);
    setQ(company.name);

    // Dynamic scanning step simulation
    let currentScanStep = 0;
    const scanInterval = setInterval(() => {
      currentScanStep++;
      if (currentScanStep < SCANNING_STEPS.length) {
        setScanStep(currentScanStep);
      } else {
        clearInterval(scanInterval);
      }
    }, 600);

    const startTime = Date.now();

    try {
      // Fire request to the company info search agent
      const res = await fetch("/api/company-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: company.name }),
      });

      let data;
      if (res.ok) {
        data = await res.json();
      } else {
        throw new Error("Failed to scan company info");
      }

      // Ensure scanning animation displays for at least 2.0s for UX flow
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      clearInterval(scanInterval);
      setScanStep(SCANNING_STEPS.length);

      setFormName(data.name || company.name);
      setFormIndustry(data.industry || company.industry || "Consumer Health & FMCG");
      setFormGeographies(
        Array.isArray(data.geographies)
          ? data.geographies.join(", ")
          : company.geographies
          ? (Array.isArray(JSON.parse(company.geographies)) ? JSON.parse(company.geographies).join(", ") : company.geographies)
          : "US, EU, UK"
      );
      setFormPeers(
        Array.isArray(data.peers)
          ? data.peers.join(", ")
          : company.peers
          ? (Array.isArray(JSON.parse(company.peers)) ? JSON.parse(company.peers).join(", ") : company.peers)
          : "Competitor A, Competitor B"
      );
      setIsScanning(false);
      setShowFormDetails(true);
    } catch (err) {
      console.warn("Fallback to static presets due to scan error:", err);
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 2000 - elapsed);
      await new Promise((resolve) => setTimeout(resolve, remaining));

      clearInterval(scanInterval);
      setScanStep(SCANNING_STEPS.length);

      // Parse geometries & peers from presets safely
      let parsedGeo = "US, EU, UK";
      let parsedPeers = "Competitor A, Competitor B";

      try {
        if (company.geographies) {
          const geoParsed = typeof company.geographies === "string" ? JSON.parse(company.geographies) : company.geographies;
          parsedGeo = Array.isArray(geoParsed) ? geoParsed.join(", ") : company.geographies;
        }
      } catch (_) {}

      try {
        if (company.peers) {
          const peersParsed = typeof company.peers === "string" ? JSON.parse(company.peers) : company.peers;
          parsedPeers = Array.isArray(peersParsed) ? peersParsed.join(", ") : company.peers;
        }
      } catch (_) {}

      setFormName(company.name);
      setFormIndustry(company.industry || "Consumer Health & FMCG");
      setFormGeographies(parsedGeo);
      setFormPeers(parsedPeers);
      setIsScanning(false);
      setShowFormDetails(true);
    }
  };

  const runAnalysis = async (org: any) => {
    setLoading(org);
    setStep(0);

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
      // Onboard organisation to trigger dynamic database ingestion & scoring
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

      // Maintain at least 6s display of steps progress loader
      setTimeout(() => {
        clearInterval(progressInterval);
        setStep(ANALYSIS_STEPS.length);
        setTimeout(() => {
          onSelect(finalOrg);
        }, 500);
      }, 6200);
    } catch (e) {
      console.error("Error executing analysis pipeline:", e);
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
      commodities: JSON.stringify(["None"]),
      meta: `Scanned Footprint · Headquartered Global`,
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
            <span className="eyebrow">Corporate Lens</span>
          </div>

          <h1 className="gateway-title" style={{ margin: 0 }}>
            Analyse Organisation Exposure
          </h1>

          <p className="gateway-sub" style={{ marginTop: 10, marginBottom: 24 }}>
            Search for an organisation or input parameters below. The scanning agent will search external feeds, analyze disclosures, and build your custom Corporate Lens and Exposure Map profile.
          </p>

          {/* Search Box with Suggestions */}
          <div className="gw-search" style={{ position: "relative" }}>
            <span className="s-ico">
              <Icon name="search" size={19} />
            </span>
            <input
              ref={inputRef}
              className="input"
              placeholder="Search for a company (e.g. Unilever, JPMorgan Chase, Apple)..."
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setOpen(true);
                setHl(0);
              }}
              onFocus={() => {
                setOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setHl((h) => Math.min(h + 1, matches.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setHl((h) => Math.max(h - 1, 0));
                } else if (e.key === "Enter" && matches[hl]) {
                  e.preventDefault();
                  handleSelectCompany(matches[hl]);
                } else if (e.key === "Escape") {
                  setOpen(false);
                }
              }}
            />

            {open && matches.length > 0 && (
              <div ref={dropdownRef} className="gw-suggest" style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, maxHeight: 300, overflowY: "auto" }}>
                {matches.map((o: any, i) => (
                  <div
                    key={o.id + "-" + i}
                    className={`gw-sug-item ${i === hl ? "hl" : ""}`}
                    onMouseEnter={() => setHl(i)}
                    onClick={() => handleSelectCompany(o)}
                  >
                    <div
                      className="mono"
                      style={{
                        background: o.featured ? "var(--accent)" : o.isCustomSuggestion ? "var(--emerald)" : "var(--slate)",
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
                      {o.isCustomSuggestion ? "+" : o.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div className="gw-sug-name" style={{ fontWeight: 600 }}>
                        {o.isCustomSuggestion ? `Onboard custom: "${o.name}"` : o.name}
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
                        {o.industry} · {o.meta || "Forbes 2000 Listed"}
                      </div>
                    </div>
                    <Icon name="arrowR" size={15} color="var(--text3)" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footprint Scanning Loader */}
          {isScanning && (
            <div
              className="fade-up"
              style={{
                margin: "24px 0",
                padding: "20px",
                background: "var(--bg3)",
                border: "1px dashed var(--border2)",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
              }}
            >
              <div className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }}></div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>Scanning Organisation Footprint</div>
                <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
                  Agent is retrieving SEC files, corporate reports, and news signals...
                </div>
              </div>
              <div style={{ width: "100%", maxWidth: 360, display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
                {SCANNING_STEPS.map((s, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 11.5,
                      color: idx < scanStep ? "var(--emerald)" : idx === scanStep ? "var(--text1)" : "var(--text3)",
                      fontWeight: idx === scanStep ? 600 : 400,
                    }}
                  >
                    <div style={{ width: 14, height: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {idx < scanStep ? (
                        <span style={{ color: "var(--emerald)", fontWeight: 700 }}>✓</span>
                      ) : idx === scanStep ? (
                        <div className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5 }}></div>
                      ) : (
                        <span style={{ fontSize: 10 }}>•</span>
                      )}
                    </div>
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Form revealed after footprint scan */}
          {showFormDetails && !isScanning && (
            <form onSubmit={handleFormSubmit} className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 24, padding: "20px", background: "var(--bg2)", borderRadius: "8px", border: "1px solid var(--border1)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text1)", borderBottom: "1px solid var(--border2)", paddingBottom: 8, textTransform: "uppercase", letterSpacing: ".3px" }}>
                Scanned Profile Settings
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                    Organisation Name
                  </label>
                  <input
                    type="text"
                    className="select"
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)", background: "var(--bg3)", color: "var(--text1)" }}
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
                    style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)", background: "var(--bg3)", color: "var(--text1)" }}
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value)}
                  >
                    {currentIndustries.map((ind) => (
                      <option key={ind} value={ind}>
                        {ind}
                      </option>
                    ))}
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
                  style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)", background: "var(--bg3)", color: "var(--text1)" }}
                  placeholder="e.g. US, EU, UK, Asia"
                  value={formGeographies}
                  onChange={(e) => setFormGeographies(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "var(--text2)" }}>
                  Peer Benchmark Group (comma separated)
                </label>
                <input
                  type="text"
                  className="select"
                  style={{ width: "100%", height: 38, padding: "0 10px", border: "1px solid var(--border2)", background: "var(--bg3)", color: "var(--text1)" }}
                  placeholder="e.g. Nestlé, P&G, Reckitt, Danone"
                  value={formPeers}
                  onChange={(e) => setFormPeers(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: "100%", height: 42, justifyContent: "center", marginTop: 8 }}
              >
                Run Risk Analysis <Icon name="arrowR" size={15} color="#fff" />
              </button>
            </form>
          )}

          {/* Popular Forbes 2000 suggestions (Chips shown when form and scanning are hidden) */}
          {!showFormDetails && !isScanning && (
            <div className="gw-examples" style={{ marginTop: 24 }}>
              <div className="gw-ex-label">Select a Forbes 2000 company to scan:</div>
              <div className="gw-chips" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {FORBES_2000.slice(0, 6).map((o) => (
                  <div key={o.name} className="gw-chip" onClick={() => handleSelectCompany(o)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", background: "var(--bg3)", border: "1px solid var(--border2)", borderRadius: "6px" }}>
                    <div
                      className="mono"
                      style={{
                        background: o.featured ? "var(--accent)" : "var(--slate)",
                        width: 20,
                        height: 20,
                        fontSize: 9,
                        color: "#fff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "3px",
                        fontWeight: 700,
                      }}
                    >
                      {o.name[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text1)" }}>{o.name}</div>
                      <div style={{ fontSize: 9.5, color: "var(--text3)" }}>{o.industry}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
