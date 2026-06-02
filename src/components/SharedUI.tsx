"use client";

import React from "react";
import { getDomain, DOMAINS } from "./ChartLibrary";

/* ---- Icon set (inline stroke SVG) ------------------------ */
export const ICONS: Record<string, string> = {
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20M2 12h20M12 2c2.5 2.7 3.8 6.2 3.8 10S14.5 19.3 12 22M12 2C9.5 4.7 8.2 8.2 8.2 12S9.5 19.3 12 22',
  building: 'M3 21h18M5 21V5a2 2 0 012-2h6a2 2 0 012 2v16M15 21V11h4v10M8 7h2M8 11h2M8 15h2',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 00-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0012 2z',
  target: 'M12 12m-9 0a9 9 0 1018 0 9 9 0 10-18 0M12 12m-4 0a4 4 0 108 0 4 4 0 10-8 0M12 12h.01',
  layers: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  search: 'M11 11m-7 0a7 7 0 1014 0 7 7 0 10-14 0M21 21l-4-4',
  filter: 'M4 5h16M7 12h10M10 19h4',
  chart: 'M3 3v18h18M7 14l3-4 3 3 4-6',
  bars: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  zap: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  alert: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L14.4 3.9a2 2 0 00-3.4 0z',
  cpu: 'M4 4h16v16H4zM9 9h6v6H9M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3',
  leaf: 'M11 20A7 7 0 019 6c4-2 8-2 11-3-1 3-1 7-3 11a7 7 0 01-6 6M9 14c.5-2 2-4 5-5',
  scale: 'M12 3v18M3 7h18M7 7l-3 7a3 3 0 006 0L7 7zM17 7l-3 7a3 3 0 006 0L17 7zM8 21h8',
  link: 'M10 13a5 5 0 007 0l3-3a5 5 0 00-7-7l-1.5 1.5M14 11a5 5 0 00-7 0l-3 3a5 5 0 007 7l1.5-1.5',
  ship: 'M3 16l1.5-5h15L21 16M5 11V6h14v5M12 3v3M4 16c2 2 4 2 4 0M12 16c2 2 4 2 4 0M2 20c2 0 2 1.5 4 1.5S8 20 10 20s2 1.5 4 1.5 2-1.5 4-1.5 2 1.5 4 1.5',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  chat: 'M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z',
  close: 'M18 6L6 18M6 6l12 12',
  arrowR: 'M5 12h14M13 6l6 6-6 6',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 018 0v4',
  doc: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M9 13h6M9 17h6',
  clipboard: 'M9 4h6a1 1 0 011 1v1H8V5a1 1 0 011-1zM8 6H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-2',
  grid: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  sliders: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6',
  flame: 'M12 2c1 5 5 6 5 11a5 5 0 01-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5-1-7 0-1 0-2 0-3z',
  trend: 'M23 6l-9.5 9.5-5-5L1 18M17 6h6v6',
};

export function Icon({ name, size = 16, color, sw = 1.7, style, className }: { name: string; size?: number; color?: string; sw?: number; style?: React.CSSProperties; className?: string }) {
  const d = ICONS[name] || ICONS.globe;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color || 'currentColor'} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" className={className} style={{ flexShrink: 0, ...style }}>
      {d.split('M').filter(Boolean).map((seg, i) => <path key={i} d={'M' + seg} />)}
    </svg>
  );
}

export const DOMAIN_ICON: Record<string, string> = { geo: 'globe', trade: 'ship', reg: 'scale', fin: 'dollar', tech: 'cpu', clim: 'leaf', soc: 'shield', legal: 'scale' };

/* ---- Domain tag ------------------------------------------ */
export function DomainTag({ id, full }: { id: string; full?: boolean }) {
  const d = getDomain(id);
  return <span className="dtag" style={{ background: d.bg, color: d.color }}><span className="dot" style={{ background: d.color }}></span>{full ? d.name : d.short}</span>;
}

/* ---- Sentiment pill -------------------------------------- */
export function SentimentPill({ s }: { s: string }) {
  const map: Record<string, [string, string]> = { 
    alarm: ['sent-alarm', 'Alarm'], 
    concern: ['sent-concern', 'Concern'], 
    watch: ['sent-watch', 'Watch'], 
    stable: ['sent-stable', 'Stable'], 
    easing: ['sent-easing', 'Easing'] 
  };
  const [cls, lbl] = map[s.toLowerCase()] || map.watch;
  return <span className={`spill ${cls}`}><span className="dot"></span>{lbl}</span>;
}

export function ImpactChip({ impact }: { impact: 'high' | 'med' | 'low' }) {
  const map = { 
    high: ['impact-high', '\u2191 High'], 
    med: ['impact-med', '\u2192 Medium'], 
    low: ['impact-low', 'Low'] 
  };
  const [cls, lbl] = map[impact] || map.med;
  return <span className={`impact ${cls}`}>{lbl}</span>;
}

export interface Signal {
  id: string;
  source: string;
  url: string;
  publishedAt: string | Date;
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

/* ---- Signal card ----------------------------------------- */
export function SignalCard({ sig, onClick }: { sig: Signal; onClick: (sig: Signal) => void }) {
  const d = getDomain(sig.domain);
  const timeLabel = new Date(sig.publishedAt).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  let geos: string[] = [];
  try {
    geos = JSON.parse(sig.geographies || "[]");
  } catch {
    geos = ["Global"];
  }

  return (
    <div className="signal-card fade-up" onClick={() => onClick(sig)}>
      <div className="sc-bar" style={{ background: d.color }}></div>
      <div className="sc-body">
        <div className="sc-meta">
          <span className="sc-type" style={{ color: d.color }}>{sig.domain}</span>
          <span className="sc-dot">·</span><span>{sig.source}</span>
          <span className="sc-dot">·</span><span className="sc-time">{timeLabel}</span>
        </div>
        <div className="sc-headline">{sig.title}</div>
        <div className="sc-summary">{sig.summary}</div>
        <div className="sc-foot">
          <div className="sc-tags">
            <DomainTag id={sig.domain} />
            {geos.slice(0, 1).map(g => (
              <span key={g} className="yw-tag">{g}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto' }}>
            <SentimentPill s={sig.sentiment.toLowerCase()} />
            <ImpactChip impact={sig.impact.toLowerCase() as any} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---- Signal detail drawer -------------------------------- */
export function SignalDrawer({ sig, onClose, onAnalyse }: { sig: Signal | null; onClose: () => void; onAnalyse: () => void }) {
  if (!sig) return null;
  const d = getDomain(sig.domain);
  const timeLabel = new Date(sig.publishedAt).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  let geos: string[] = [];
  try {
    geos = JSON.parse(sig.geographies || "[]");
  } catch {
    geos = ["Global"];
  }

  let citations: string[] = [];
  try {
    citations = JSON.parse(sig.sourcesCited || "[]");
  } catch {
    citations = [sig.url];
  }

  return (
    <React.Fragment>
      <div className={`drawer-scrim ${sig ? 'open' : ''}`} onClick={onClose}></div>
      <aside className={`drawer ${sig ? 'open' : ''}`}>
        <div className="drawer-inner">
          <div className="drawer-head">
            <span className="dtag" style={{ background: d.bg, color: d.color }}><span className="dot" style={{ background: d.color }}></span>{sig.domain}</span>
            <button className="nav-icon-btn" onClick={onClose} style={{ marginLeft: 'auto', width: 28, height: 28 }}><Icon name="close" size={15} /></button>
          </div>
          <h2 className="drawer-title serif">{sig.title}</h2>
          <div className="drawer-chips">
            <span className="dr-chip">{sig.source}</span>
            <span className="dr-chip">{timeLabel}</span>
            {geos.slice(0, 1).map(g => (
              <span key={g} className="dr-chip">{g}</span>
            ))}
            <SentimentPill s={sig.sentiment.toLowerCase()} />
            <ImpactChip impact={sig.impact.toLowerCase() as any} />
          </div>
          <div className="dr-section">
            <div className="dr-label">Summary</div>
            <p className="dr-text">{sig.summary}</p>
          </div>
          <div className="dr-section dr-why">
            <div className="dr-label">Why it matters</div>
            <p className="dr-text">{sig.body || "External market dynamics that may affect operational efficiency or regulatory adherence."}</p>
          </div>
          <div className="dr-section">
            <div className="dr-label">Geographies</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {geos.map(g => (
                <span key={g} className="dr-chip">{g}</span>
              ))}
            </div>
          </div>
          <div className="dr-section">
            <div className="dr-label">Sources & confidence</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {citations.map((c, i) => (
                <a key={i} href={c} target="_blank" rel="noopener noreferrer" className="dr-chip truncate max-w-[200px]" style={{ color: 'var(--accent)' }}>{c}</a>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text2)' }}>
              Confidence <b style={{ color: sig.confidence >= 0.85 ? 'var(--green)' : 'var(--amber)' }}>{sig.confidence >= 0.85 ? 'High' : 'Medium'} ({Math.round(sig.confidence * 100)}%)</b>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 6 }} onClick={onAnalyse}>
            Analyse impact on my organisation <Icon name="arrowR" size={15} color="#fff" />
          </button>
        </div>
      </aside>
    </React.Fragment>
  );
}

/* ---- Filter sidebar -------------------------------------- */
export function FilterRail({ filters, set, counts }: { filters: { domain: string | null; impact: string | null; region: string | null }; set: (patch: any) => void; counts: Record<string, number> }) {
  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="frail-group">
      <div className="frail-title">{title}</div>
      {children}
    </div>
  );
  const Item = ({ active, onClick, color, label, count, tooltip }: { active: boolean; onClick: () => void; color?: string; label: string; count?: number; tooltip?: string }) => (
    <div className={`frail-item ${active ? 'active' : ''}`} onClick={onClick} title={tooltip}>
      {color && <span className="frail-dot" style={{ background: color }}></span>}
      <span className="frail-label">{label}</span>
      {count != null && <span className="frail-count">{count}</span>}
    </div>
  );

  const REGIONS_LIST = ["Global", "Americas", "Europe", "Asia-Pacific"];

  return (
    <aside className="frail">
      <Group title="Category">
        <Item active={!filters.domain} onClick={() => set({ domain: null })} label="All signals" count={counts.all} />
      </Group>
      <Group title="Risk Domains">
        {DOMAINS.map(d => (
          <Item 
            key={d.id} 
            active={filters.domain === d.id} 
            onClick={() => set({ domain: filters.domain === d.id ? null : d.id })} 
            color={d.color} 
            label={d.short} 
            count={counts[d.id] || 0} 
          />
        ))}
      </Group>
      <Group title="Impact">
        {([
          ['high', 'High', 'High Impact: Immediate material risk requiring Board-level oversight and action.'],
          ['med', 'Medium', 'Medium Impact: Significant risk to operations or compliance, monitored by risk owners.'],
          ['low', 'Low', 'Low Impact: Minor risk with limited exposure, managed through routine controls.']
        ] as const).map(([k, l, desc]) => (
          <Item 
            key={k} 
            active={filters.impact === k} 
            onClick={() => set({ impact: filters.impact === k ? null : k })} 
            label={l} 
            count={counts[k] || 0}
            tooltip={desc}
          />
        ))}
      </Group>
      <Group title="Region">
        {REGIONS_LIST.map(r => (
          <Item 
            key={r} 
            active={filters.region === r} 
            onClick={() => set({ region: filters.region === r ? null : r })} 
            label={r} 
            count={counts[r] || 0}
          />
        ))}
      </Group>
    </aside>
  );
}

/* ---- Stat tile ------------------------------------------- */
export function StatTile({ label, value, delta, dir, sub, accent }: { label: string; value: string | number; delta?: string; dir?: 'up' | 'down' | 'flat'; sub?: string; accent?: string }) {
  return (
    <div className="stat-tile card">
      <div className="stat-bar" style={{ background: accent || 'var(--accent)' }}></div>
      <div className="stat-label">{label}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="stat-val serif num">{value}</span>
        {delta && <span className={`trend ${dir || 'flat'}`}>{dir === 'up' ? '\u25b2' : dir === 'down' ? '\u25bc' : ''} {delta}</span>}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
