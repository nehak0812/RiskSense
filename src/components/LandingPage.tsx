"use client";

import React, { useState, useEffect, useRef } from "react";
import { Compass, ShieldAlert, Cpu, Landmark, Shield, AlertTriangle, ArrowRight } from "lucide-react";

interface LandingPageProps {
  onLaunchPlatform: () => void;
}

export default function LandingPage({ onLaunchPlatform }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [hoveredSection, setHoveredSection] = useState<"world" | "prism" | "intersection" | null>(null);
  const [activeTab, setActiveTab] = useState<"world" | "prism" | "intersection">("world");

  // Canvas particle flow animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let particles: Array<{
      x: number;
      y: number;
      tx: number;
      ty: number;
      speed: number;
      size: number;
      color: string;
      alpha: number;
      stage: "incoming" | "refracted";
      pathIndex: number;
      progress: number;
    }> = [];

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = width * (window.devicePixelRatio || 1);
      canvas.height = height * (window.devicePixelRatio || 1);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    };

    resize();
    window.addEventListener("resize", resize);

    const initParticle = (forceStart = false) => {
      const cy = height * 0.5;
      const prismX = width * 0.5;
      const pathIndex = Math.floor(Math.random() * 4);
      
      const colors = [
        "rgba(190, 58, 48, ", // Geopolitical (Red)
        "rgba(29, 78, 130, ", // Regulatory (Blue)
        "rgba(27, 122, 81, ", // Environmental (Green)
        "rgba(84, 74, 156, "  // Tech & AI (Purple)
      ];

      return {
        x: forceStart ? Math.random() * (prismX - 80) : 0,
        y: cy + (Math.random() - 0.5) * 15,
        tx: prismX - 40,
        ty: cy,
        speed: 0.003 + Math.random() * 0.004,
        size: 1 + Math.random() * 2,
        color: colors[pathIndex],
        alpha: 0.3 + Math.random() * 0.5,
        stage: "incoming" as const,
        pathIndex,
        progress: forceStart ? Math.random() * 0.8 : 0
      };
    };

    // Pre-populate particles
    for (let i = 0; i < 40; i++) {
      particles.push(initParticle(true));
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw background ambient glow
      const cx = width * 0.5;
      const cy = height * 0.5;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(width, height) * 0.4);
      glow.addColorStop(0, "rgba(29, 78, 130, 0.08)");
      glow.addColorStop(0.5, "rgba(29, 78, 130, 0.02)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      // Render & Update particles
      particles.forEach((p, idx) => {
        p.progress += p.speed;

        if (p.stage === "incoming") {
          // Flow from left to the center of the prism
          const prismX = width * 0.5;
          p.x = p.progress * (prismX - 40);
          p.y = cy + Math.sin(p.progress * Math.PI * 2) * 5;

          if (p.progress >= 1) {
            p.stage = "refracted";
            p.progress = 0;
            p.x = prismX + 40;
            p.y = cy;
            p.speed = 0.002 + Math.random() * 0.003;
          }
        } else {
          // Refracted flow curving towards the right edge
          const startX = width * 0.5 + 40;
          const endX = width;
          const currentX = startX + p.progress * (endX - startX);
          
          // Compute Y positions based on path index (refraction angles)
          let targetY = cy;
          if (p.pathIndex === 0) targetY = cy - height * 0.22; // Geopolitical path (Up)
          if (p.pathIndex === 1) targetY = cy - height * 0.08; // Regulatory path (Slight Up)
          if (p.pathIndex === 2) targetY = cy + height * 0.08; // Environmental path (Slight Down)
          if (p.pathIndex === 3) targetY = cy + height * 0.22; // Tech & AI path (Down)

          // Smooth interpolation with quadratic curve
          const easeOut = 1 - Math.pow(1 - p.progress, 2);
          p.x = currentX;
          p.y = cy + (targetY - cy) * easeOut + Math.sin(p.progress * 10) * 3;

          if (p.progress >= 1) {
            // Recycle particle
            particles[idx] = initParticle();
          }
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.alpha * (1 - p.progress * 0.5)})`;
        ctx.fill();
      });

      // Spawn new particles occasionally
      if (particles.length < 80 && Math.random() < 0.1) {
        particles.push(initParticle());
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="landing-container" ref={containerRef}>
      {/* Background canvas */}
      <canvas ref={canvasRef} className="landing-canvas" />

      {/* Top Navigation */}
      <header className="landing-header">
        <div className="logo-area">
          <div className="logo-gem">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="logo-name font-semibold text-white text-lg">RiskLens</span>
        </div>
        <button className="landing-nav-btn font-semibold" onClick={onLaunchPlatform}>
          Launch Platform &rarr;
        </button>
      </header>

      {/* Main Hero & Graphic */}
      <main className="landing-hero">
        <div className="landing-hero-content">
          <div className="landing-tag font-semibold">
            <span className="live-dot" />
            Active Risk Alignment Engine
          </div>
          <h1 className="landing-title font-serif">
            Refract the Noise. <br />
            <span className="gradient-text font-serif">Align the Risk.</span>
          </h1>
          <p className="landing-sub">
            RiskLens structures chaotic global signals, maps them through your organizational parameters, and delivers instant, board-ready risk intelligence.
          </p>
        </div>

        {/* Interactive Prism Visualization */}
        <div className="prism-visualization">
          <svg className="prism-svg" viewBox="0 0 800 400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="glow-red" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-blue" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-green" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-purple" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter id="glow-white" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Laser Line Groups */}

            {/* 1. Incoming World Data Beam (White) */}
            <path 
              d="M0 200 H360" 
              className={`laser-beam beam-world ${hoveredSection === "world" ? "active" : ""}`}
              stroke="url(#grad-white)"
              strokeWidth={hoveredSection === "world" ? "3" : "1.5"}
              filter="url(#glow-white)"
            />
            {/* Interactive Area for World Feed */}
            <line 
              x1="0" y1="180" x2="350" y2="180" 
              stroke="transparent" strokeWidth="40" 
              className="cursor-pointer"
              onMouseEnter={() => { setHoveredSection("world"); setActiveTab("world"); }}
              onMouseLeave={() => setHoveredSection(null)}
            />

            {/* 2. Refracted Domain Laser Beams */}
            {/* Geopolitical (Red) */}
            <path 
              d="M440 200 C500 200, 520 110, 800 110" 
              className={`laser-beam beam-geo ${hoveredSection === "intersection" ? "active" : ""}`}
              stroke="var(--red)"
              strokeWidth={hoveredSection === "intersection" ? "3.5" : "1.5"}
              filter="url(#glow-red)"
            />
            {/* Regulatory (Blue) */}
            <path 
              d="M440 200 C500 200, 520 170, 800 170" 
              className={`laser-beam beam-reg ${hoveredSection === "intersection" ? "active" : ""}`}
              stroke="var(--accent)"
              strokeWidth={hoveredSection === "intersection" ? "3.5" : "1.5"}
              filter="url(#glow-blue)"
            />
            {/* Environmental (Green) */}
            <path 
              d="M440 200 C500 200, 520 230, 800 230" 
              className={`laser-beam beam-env ${hoveredSection === "intersection" ? "active" : ""}`}
              stroke="var(--green)"
              strokeWidth={hoveredSection === "intersection" ? "3.5" : "1.5"}
              filter="url(#glow-green)"
            />
            {/* Tech & AI (Purple) */}
            <path 
              d="M440 200 C500 200, 520 290, 800 290" 
              className={`laser-beam beam-tech ${hoveredSection === "intersection" ? "active" : ""}`}
              stroke="var(--purple)"
              strokeWidth={hoveredSection === "intersection" ? "3.5" : "1.5"}
              filter="url(#glow-purple)"
            />
            {/* Interactive Area for Refractions */}
            <path 
              d="M450 200 C550 200, 550 200, 800 200" 
              stroke="transparent" strokeWidth="150" 
              className="cursor-pointer"
              onMouseEnter={() => { setHoveredSection("intersection"); setActiveTab("intersection"); }}
              onMouseLeave={() => setHoveredSection(null)}
            />

            {/* 3. Central Crystal Prism (Your World) */}
            <g 
              className={`prism-group ${hoveredSection === "prism" ? "active" : ""}`}
              onMouseEnter={() => { setHoveredSection("prism"); setActiveTab("prism"); }}
              onMouseLeave={() => setHoveredSection(null)}
            >
              {/* Glow Behind Prism */}
              <polygon 
                points="400,140 440,200 400,260 360,200" 
                fill="rgba(78, 205, 196, 0.05)"
                stroke="transparent"
              />
              {/* Outer Hex Crystal Shape */}
              <polygon 
                points="400,130 450,200 400,270 350,200" 
                className="prism-body"
                stroke={hoveredSection === "prism" ? "#4ecdc4" : "rgba(255,255,255,0.25)"}
                strokeWidth={hoveredSection === "prism" ? "2" : "1"}
                fill="rgba(10, 20, 35, 0.65)"
              />
              {/* Facet Lines */}
              <line x1="400" y1="130" x2="400" y2="270" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
              <line x1="350" y1="200" x2="450" y2="200" stroke="rgba(255,255,255,0.15)" strokeWidth="0.8" />
            </g>

            {/* Labels and Callouts */}
            <text x="180" y="170" fill="rgba(255,255,255,0.5)" fontSize="10.5" fontWeight="600" letterSpacing="1" textAnchor="middle">THE WORLD</text>
            <text x="180" y="150" fill={hoveredSection === "world" ? "#ffffff" : "rgba(255,255,255,0.3)"} fontSize="12" fontWeight="700" letterSpacing="1.5" textAnchor="middle">RAW DATA BEAM</text>
            
            <text x="400" y="110" fill={hoveredSection === "prism" ? "#4ecdc4" : "rgba(255,255,255,0.4)"} fontSize="12" fontWeight="700" letterSpacing="1.5" textAnchor="middle">YOUR ORGANISATION</text>
            <text x="400" y="295" fill="rgba(255,255,255,0.5)" fontSize="11" fontWeight="600" letterSpacing="1" textAnchor="middle">RISK PRISM</text>

            <text x="620" y="80" fill="rgba(255,255,255,0.5)" fontSize="10.5" fontWeight="600" letterSpacing="1">THE INTERSECTION</text>
            <text x="620" y="60" fill={hoveredSection === "intersection" ? "#ffffff" : "rgba(255,255,255,0.3)"} fontSize="12" fontWeight="700" letterSpacing="1.5">REFRACTED INSIGHTS</text>

            {/* Gradients */}
            <linearGradient id="grad-white" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.8)" />
            </linearGradient>
          </svg>

          {/* Interactive Info Cards */}
          <div className="prism-cards-container">
            <div className="landing-tabs-header">
              <button 
                className={`lt-btn ${activeTab === "world" ? "active" : ""}`}
                onClick={() => setActiveTab("world")}
              >
                1. The World (Input)
              </button>
              <button 
                className={`lt-btn ${activeTab === "prism" ? "active" : ""}`}
                onClick={() => setActiveTab("prism")}
              >
                2. Your World (Filter)
              </button>
              <button 
                className={`lt-btn ${activeTab === "intersection" ? "active" : ""}`}
                onClick={() => setActiveTab("intersection")}
              >
                3. Refracted Output
              </button>
            </div>

            <div className="landing-tab-body">
              {activeTab === "world" && (
                <div className="landing-card-info">
                  <div className="lc-header text-white font-serif text-lg mb-2">
                    The World: Unstructured Signal Stream
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    RiskLens listens to a constant influx of global developments across regulator networks, primary news outlets, and trade databases. We process thousands of inputs concurrently.
                  </p>
                  <div className="lc-sources flex flex-wrap gap-2.5">
                    <span className="source-pill">SEC EDGAR</span>
                    <span className="source-pill">FCA Filings</span>
                    <span className="source-pill">Reuters</span>
                    <span className="source-pill">Bloomberg</span>
                    <span className="source-pill">FMCG Trade Journals</span>
                  </div>
                </div>
              )}

              {activeTab === "prism" && (
                <div className="landing-card-info">
                  <div className="lc-header text-white font-serif text-lg mb-2">
                    Your World: Organizational Prism
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    The central prism is built on your exact corporate metadata. By modeling your company parameters, the platform filters out global noise and focuses strictly on matches that trigger your vulnerabilities.
                  </p>
                  <div className="lc-sources flex flex-wrap gap-2.5">
                    <span className="source-pill border border-emerald-500/20 text-emerald-400">Sector &amp; Peers</span>
                    <span className="source-pill border border-emerald-500/20 text-emerald-400">Appetite Limits</span>
                    <span className="source-pill border border-emerald-500/20 text-emerald-400">Geographic Exposures</span>
                    <span className="source-pill border border-emerald-500/20 text-emerald-400">Critical Commodities</span>
                  </div>
                </div>
              )}

              {activeTab === "intersection" && (
                <div className="landing-card-info">
                  <div className="lc-header text-white font-serif text-lg mb-2">
                    The Refracted Intersection: Aligned Exposure
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-4">
                    Chaotic data is refracted into clean, actionable channels. Our 4-stage pipeline maps signal relevance to your risk register, benchmarks peer disclosure transparency, and autogenerates board-ready print briefs.
                  </p>
                  <div className="lc-sources flex flex-wrap gap-2.5">
                    <span className="source-pill border border-indigo-400/20 text-indigo-300">Semantic Embedding Match</span>
                    <span className="source-pill border border-indigo-400/20 text-indigo-300">ERM Register Mapping</span>
                    <span className="source-pill border border-indigo-400/20 text-indigo-300">A4 Print Board Packs</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Dynamic CTA Footer Section */}
        <div className="landing-action-row">
          <button className="landing-btn-enter font-semibold" onClick={onLaunchPlatform}>
            Launch RiskLens Dashboard
            <ArrowRight size={16} className="ml-1.5" />
          </button>
        </div>
      </main>
    </div>
  );
}
