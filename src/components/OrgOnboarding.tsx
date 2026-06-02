"use client";

import React, { useState, useEffect } from "react";
import { Plus, X, Play } from "lucide-react";

interface OrgOnboardingProps {
  initialCompanyName?: string;
  onAnalysisComplete: (org: any) => void;
}

export default function OrgOnboarding({
  initialCompanyName = "",
  onAnalysisComplete,
}: OrgOnboardingProps) {
  const [orgName, setOrgName] = useState(initialCompanyName);
  const [industry, setIndustry] = useState("FMCG & Consumer Goods");
  const [geographies, setGeographies] = useState("US, EU, UK");
  const [commodities, setCommodities] = useState("Palm Oil, Cocoa, Packaging");
  
  // Peer list chips
  const [peerInput, setPeerInput] = useState("");
  const [peers, setPeers] = useState<string[]>(["Nestlé", "P&G", "Reckitt", "Danone"]);

  // Pipeline loading states
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  useEffect(() => {
    if (initialCompanyName) {
      setOrgName(initialCompanyName);
    }
  }, [initialCompanyName]);

  const handleAddPeer = () => {
    const trimmed = peerInput.trim();
    if (trimmed && !peers.includes(trimmed)) {
      setPeers([...peers, trimmed]);
      setPeerInput("");
    }
  };

  const handleRemovePeer = (idx: number) => {
    setPeers(peers.filter((_, i) => i !== idx));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddPeer();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setLoadingStep(1);

    // Dynamic loading step simulation
    const stepsIntervals = [1500, 2000, 1800, 2200, 1500, 1500];
    
    // Perform actual network request to onboard the company
    try {
      const geoArray = geographies.split(",").map(g => g.trim()).filter(Boolean);
      const commArray = commodities.split(",").map(c => c.trim()).filter(Boolean);

      // Async step progression alongside backend call
      const advanceStep = (step: number) => {
        if (step <= 6) {
          setLoadingStep(step);
          setTimeout(() => advanceStep(step + 1), stepsIntervals[step - 1]);
        }
      };
      
      // Start step simulation
      advanceStep(1);

      const res = await fetch("/api/onboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: orgName,
          industry,
          geographies: geoArray,
          commodities: commArray,
          peers: peers,
        }),
      });

      if (!res.ok) throw new Error("Onboarding request failed");
      const orgData = await res.json();

      // Wait a bit to let the user see the board compilation step finish
      setTimeout(() => {
        setLoading(false);
        setLoadingStep(0);
        onAnalysisComplete(orgData);
      }, 9500); // Tightly syncs with step progressions (~10.5 seconds total)
    } catch (error) {
      console.error("Error onboarding organisation:", error);
      setLoading(false);
      setLoadingStep(0);
      alert("Failed to complete organisation onboarding. Please try again.");
    }
  };

  // Onboarding presets
  const handleSelectExample = (exName: string, exPeers: string[], exCommodities: string[]) => {
    setOrgName(exName);
    setPeers(exPeers);
    setCommodities(exCommodities.join(", "));
  };

  if (loading) {
    return (
      <div className="loading-wrap flex flex-col items-center justify-center py-20 gap-8" style={{ display: "flex" }}>
        <div className="spinner" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Analyzing Organisation Risks</h3>
          <p className="text-sm text-slate-500 max-w-sm">
            RiskLens is fetching live news feeds, computing vector embeddings, and compiling peer benchmarks.
          </p>
        </div>
        <div className="loading-steps flex flex-col gap-3 font-medium text-slate-600 align-left max-w-md w-full px-6">
          <div className={`loading-step ${loadingStep > 1 ? "done" : loadingStep === 1 ? "active" : ""}`}>
            Ingesting relevant industry &amp; company signals
          </div>
          <div className={`loading-step ${loadingStep > 2 ? "done" : loadingStep === 2 ? "active" : ""}`}>
            Mapping signal vector embeddings to organisation risk profile
          </div>
          <div className={`loading-step ${loadingStep > 3 ? "done" : loadingStep === 3 ? "active" : ""}`}>
            Fetching latest peer public risk disclosures (Tavily Search)
          </div>
          <div className={`loading-step ${loadingStep > 4 ? "done" : loadingStep === 4 ? "active" : ""}`}>
            Assessing peer benchmarking disclosures gap
          </div>
          <div className={`loading-step ${loadingStep > 5 ? "done" : loadingStep === 5 ? "active" : ""}`}>
            Calculating dynamic emerging risk scores (0–10 scale)
          </div>
          <div className={`loading-step ${loadingStep > 6 ? "done" : loadingStep === 6 ? "active" : ""}`}>
            Compiling final Board review pack
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard-wrap">
      <div className="onboard-card">
        <h2 className="ob-title font-semibold">Analyse Organisation Exposure</h2>
        <p className="ob-sub">
          Enter your company parameters below. RiskLens will run a semantic vector search across global risk feeds, fetch peer filings, and map risk gaps to produce a board-ready deck.
        </p>

        <form className="ob-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Organisation Name</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Unilever PLC"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-field">
              <label className="form-label">Industry Classification</label>
              <select 
                className="form-select"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              >
                <option>FMCG &amp; Consumer Goods</option>
                <option>Financial Services &amp; Banking</option>
                <option>Technology &amp; Telecom</option>
                <option>Retail &amp; Logistics</option>
                <option>Energy &amp; Utilities</option>
                <option>Manufacturing &amp; Industrial</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-field">
              <label className="form-label">Primary Geographies (comma separated)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="US, EU, UK, Asia"
                value={geographies}
                onChange={(e) => setGeographies(e.target.value)}
              />
            </div>
            <div className="form-field">
              <label className="form-label">Key Commodities / Inputs (comma separated)</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Cocoa, Palm Oil, Paper"
                value={commodities}
                onChange={(e) => setCommodities(e.target.value)}
              />
            </div>
          </div>

          <div className="form-field">
            <label className="form-label">Peer Benchmark Group</label>
            <div className="peer-input-wrap flex gap-2">
              <input 
                type="text" 
                className="form-input flex-1" 
                placeholder="Type peer company name and click Add or press Enter"
                value={peerInput}
                onChange={(e) => setPeerInput(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button 
                type="button"
                className="px-4 py-2 bg-slate-200 border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm"
                onClick={handleAddPeer}
              >
                Add
              </button>
            </div>

            {peers.length > 0 && (
              <div className="peer-tags">
                {peers.map((peer, idx) => (
                  <span key={idx} className="peer-tag">
                    {peer}
                    <X size={12} className="peer-tag-x" onClick={() => handleRemovePeer(idx)} />
                  </span>
                ))}
              </div>
            )}
          </div>

          <button type="submit" className="ob-run-btn font-semibold flex gap-2 items-center justify-center">
            <Play size={14} className="fill-current" />
            Run Risk Analysis
          </button>
        </form>

        <div className="ob-examples">
          <div className="ob-ex-label">Or select a pre-configured template:</div>
          <div className="ob-ex-chips">
            <span 
              className="ob-ex-chip font-medium"
              onClick={() => handleSelectExample("Unilever PLC", ["Nestlé", "P&G", "Reckitt", "Danone", "Mondelēz"], ["Cocoa", "Palm Oil", "Packaging"])}
            >
              Unilever PLC (FMCG)
            </span>
            <span 
              className="ob-ex-chip font-medium"
              onClick={() => handleSelectExample("Monzo Bank", ["Revolut", "Starling", "Barclays", "Lloyds"], ["Cloud hosting", "KYC vendors"])}
            >
              Monzo Bank (Fintech)
            </span>
            <span 
              className="ob-ex-chip font-medium"
              onClick={() => handleSelectExample("ASML", ["Intel", "TSMC", "Samsung", "Nikon"], ["Neon Gas", "Silicon", "Optics"])}
            >
              ASML (Hardware &amp; Tech)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
