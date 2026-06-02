"use client";

import React, { useState, useRef, useEffect } from "react";

// Local Domain definitions matching SharedUI
export const DOMAINS = [
  { id: "geo", short: "Geopolitical", name: "Geopolitical & Sanctions", color: "var(--d-geo)", bg: "var(--d-geo-l)" },
  { id: "trade", short: "Trade", name: "Trade, Tariffs & Supply Chain", color: "var(--d-trade)", bg: "var(--d-trade-l)" },
  { id: "reg", short: "Regulatory", name: "Regulatory & Compliance", color: "var(--d-reg)", bg: "var(--d-reg-l)" },
  { id: "fin", short: "Financial", name: "Financial & Market", color: "var(--d-fin)", bg: "var(--d-fin-l)" },
  { id: "tech", short: "Technology", name: "Technology & Cyber", color: "var(--d-tech)", bg: "var(--d-tech-l)" },
  { id: "clim", short: "Climate", name: "Climate & Environmental", color: "var(--d-clim)", bg: "var(--d-clim-l)" },
  { id: "soc", short: "Social", name: "Social, Reputational & Conduct", color: "var(--d-soc)", bg: "var(--d-soc-l)" },
  { id: "legal", short: "Legal", name: "Legal & Litigation", color: "var(--d-legal)", bg: "var(--d-legal-l)" },
];

export function getDomain(id: string) {
  const cleanId = (id || "").toLowerCase();
  const d = DOMAINS.find(
    x => x.id === cleanId || 
         x.short.toLowerCase() === cleanId || 
         x.name.toLowerCase() === cleanId ||
         x.name.toLowerCase().includes(cleanId) ||
         cleanId.includes(x.short.toLowerCase())
  );
  return d || DOMAINS[2]; // fallback to regulatory
}

/* tiny tooltip hook ---------------------------------------- */
export function useTip() {
  const [tip, setTip] = useState<{ x: number; y: number; title: string; value?: string } | null>(null);
  const node = tip ? (
    <div className={'tip show'} style={{ left: tip.x + 12, top: tip.y - 8 }}>
      <div className="tt">{tip.title}</div>
      {tip.value && <div className="tv">{tip.value}</div>}
    </div>
  ) : null;
  const bind = (title: string, value?: string) => ({
    onMouseMove: (e: React.MouseEvent) => setTip({ x: e.clientX, y: e.clientY, title, value }),
    onMouseLeave: () => setTip(null),
  });
  return { node, bind };
}

/* Sparkline ------------------------------------------------- */
export function Sparkline({ data, color, type = 'line', w = 130, h = 34 }: { data: number[]; color: string; type?: 'line' | 'bar' | 'area'; w?: number; h?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const px = (i: number) => (i / (data.length - 1)) * w;
  const py = (v: number) => h - 3 - ((v - min) / rng) * (h - 6);
  if (type === 'bar') {
    const bw = (w / data.length) * 0.62;
    return (
      <svg width={w} height={h} style={{ display: 'block' }}>
        {data.map((v, i) => (
          <rect key={i} x={px(i) - bw / 2} y={py(v)} width={bw} height={h - 3 - py(v)} rx="1" fill={color} opacity={0.35 + 0.55 * (v - min) / rng} />
        ))}
      </svg>
    );
  }
  const pts = data.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  const gid = 'sg' + Math.random().toString(36).slice(2, 7);
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {type === 'area' && <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity="0.22" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>}
      {type === 'area' && <polygon points={area} fill={`url(#${gid})`} />}
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={px(data.length - 1)} cy={py(data[data.length - 1])} r="2.2" fill={color} />
    </svg>
  );
}

/* Stacked bar over time (signal volume by domain) ---------- */
export function StackedVolume({ weeks, byDomain, active }: { weeks: string[]; byDomain: Record<string, number[]>; active: string | null }) {
  const { node, bind } = useTip();
  const W = 540, H = 168, pad = { l: 4, r: 8, t: 8, b: 22 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const totals = weeks.map((_, i) => DOMAINS.reduce((s, d) => s + (byDomain[d.id]?.[i] || 0), 0));
  const max = Math.max(...totals) || 1;
  const bw = (iw / weeks.length) * 0.7;
  const gap = iw / weeks.length;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
          const y = pad.t + ih - t * ih;
          return <g key={i}><line x1={pad.l} y1={y} x2={W - pad.r} y2={y} stroke="var(--border)" strokeWidth="1" /><text x={W - pad.r} y={y - 3} textAnchor="end" fontSize="8.5" fill="var(--text3)">{Math.round(t * max)}</text></g>;
        })}
        {weeks.map((wk, i) => {
          let yAcc = pad.t + ih;
          const x = pad.l + gap * i + (gap - bw) / 2;
          return (
            <g key={i}>
              {DOMAINS.map(d => {
                const v = byDomain[d.id]?.[i] || 0;
                const hh = (v / max) * ih;
                yAcc -= hh;
                const dim = active && active !== d.id;
                return <rect key={d.id} x={x} y={yAcc} width={bw} height={Math.max(hh - 0.5, 0)} fill={d.color} opacity={dim ? 0.18 : 0.92} {...bind(d.name, `${wk} · ${v} signals`)} style={{ transition: 'opacity .2s' }} />;
              })}
              <text x={x + bw / 2} y={H - 7} textAnchor="middle" fontSize="8" fill="var(--text3)">{i % 2 === 0 || i === weeks.length - 1 ? wk : ''}</text>
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/* Trend area + line (volume & momentum) -------------------- */
export function TrendArea({ total, high, labels }: { total: number[]; high: number[]; labels: string[] }) {
  const { node, bind } = useTip();
  const W = 540, H = 160, pad = { l: 6, r: 10, t: 10, b: 22 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const max = (Math.max(...total) * 1.1) || 1;
  const px = (i: number) => pad.l + (i / (total.length - 1)) * iw;
  const py = (v: number) => pad.t + ih - (v / max) * ih;
  const line = (arr: number[]) => arr.map((v, i) => `${px(i)},${py(v)}`).join(' ');
  const area = `${px(0)},${pad.t + ih} ${line(total)} ${px(total.length - 1)},${pad.t + ih}`;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs><linearGradient id="taG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.18" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></linearGradient></defs>
        {[0.25, 0.5, 0.75].map((t, i) => <line key={i} x1={pad.l} y1={pad.t + ih - t * ih} x2={W - pad.r} y2={pad.t + ih - t * ih} stroke="var(--border)" strokeWidth="1" />)}
        <polygon points={area} fill="url(#taG)" />
        <polyline points={line(total)} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={line(high)} fill="none" stroke="var(--red)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        {total.map((v, i) => <circle key={'t' + i} cx={px(i)} cy={py(v)} r="6" fill="transparent" {...bind(`${labels[i] || ''}`, `${v} total · ${high[i]} high impact`)} />)}
        <circle cx={px(total.length - 1)} cy={py(total[total.length - 1])} r="3" fill="var(--accent)" />
        <circle cx={px(high.length - 1)} cy={py(high[high.length - 1])} r="3" fill="var(--red)" />
        {['12 wks ago', 'Apr', 'May', 'This week'].map((l, i) => <text key={i} x={pad.l + (i / 3) * iw} y={H - 6} textAnchor={i === 0 ? 'start' : i === 3 ? 'end' : 'middle'} fontSize="8.5" fill="var(--text3)">{l}</text>)}
      </svg>
      {node}
    </div>
  );
}

/* Ranked horizontal bars ----------------------------------- */
export function RankedBars({ rows, max, onClick, labelW = 116 }: { rows: Array<{ id: string; label: string; value: number; color: string; trend?: string }>; max: number; onClick?: (row: any) => void; labelW?: number }) {
  const maxVal = max || 1;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {rows.map((r, i) => (
        <div key={r.id || i} className="ranked-row" onClick={() => onClick && onClick(r)} style={{ display: 'grid', gridTemplateColumns: `${labelW}px 1fr auto`, alignItems: 'center', gap: 10, cursor: onClick ? 'pointer' : 'default' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: r.color, flexShrink: 0 }}></span>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.label}</span>
          </div>
          <div style={{ height: 9, background: 'var(--bg4)', borderRadius: 5, overflow: 'hidden' }}>
            <div className="bar-fill" style={{ width: `${(r.value / maxVal) * 100}%`, height: '100%', background: r.color, borderRadius: 5, transition: 'width 1.1s cubic-bezier(.16,1,.3,1)' }}></div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 52, justifyContent: 'flex-end' }}>
            <span className="num serif" style={{ fontSize: 13, fontWeight: 600 }}>{r.value}</span>
            {r.trend && <span className={`trend ${r.trend}`}>{r.trend === 'up' ? '\u25b2' : r.trend === 'down' ? '\u25bc' : '\u2192'}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/* Segmented sentiment bar ---------------------------------- */
export function SegmentBar({ segments }: { segments: Array<{ label: string; value: number; color: string }> }) {
  const { node, bind } = useTip();
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div style={{ display: 'flex', height: 30, borderRadius: 7, overflow: 'hidden', border: '1px solid var(--border)' }}>
        {segments.map((s, i) => (
          <div key={i} {...bind(s.label, `${s.value} signals · ${Math.round(s.value / total * 100)}%`)} style={{ width: `${s.value / total * 100}%`, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'default', transition: 'width 1s cubic-bezier(.16,1,.3,1)' }}>
            {s.value / total > 0.1 && <span style={{ fontSize: 10, fontWeight: 700, color: '#fff' }}>{Math.round(s.value / total * 100)}%</span>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 11 }}>
        {segments.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: 'var(--text2)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }}></span>{s.label}<b className="num" style={{ color: 'var(--text1)' }}>{s.value}</b>
          </div>
        ))}
      </div>
      {node}
    </div>
  );
}

/* Radar / spider (org vs peer avg) ------------------------- */
export function Radar({ axes, size = 300 }: { axes: Array<{ label: string; short: string; own: number; peerAvg: number }>; size?: number }) {
  const { node, bind } = useTip();
  const cx = size / 2, cy = size / 2, R = size / 2 - 50;
  const n = axes.length;
  const pt = (i: number, r: number) => { const a = (Math.PI * 2 * i) / n - Math.PI / 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const poly = (key: 'own' | 'peerAvg') => axes.map((ax, i) => pt(i, R * ax[key] / 100).join(',')).join(' ');
  return (
    <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size}>
        {[0.25, 0.5, 0.75, 1].map((t, i) => <polygon key={i} points={axes.map((_, j) => pt(j, R * t).join(',')).join(' ')} fill="none" stroke="var(--border)" strokeWidth="1" />)}
        {axes.map((_, i) => { const [x, y] = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />; })}
        <polygon points={poly('peerAvg')} fill="none" stroke="var(--text3)" strokeWidth="1.5" strokeDasharray="4 3" />
        <polygon points={poly('own')} fill="rgba(29,78,130,.14)" stroke="var(--accent)" strokeWidth="2" />
        {axes.map((ax, i) => { const [x, y] = pt(i, R * ax.own / 100); return <circle key={i} cx={x} cy={y} r="3.2" fill="var(--accent)" {...bind(ax.label, `This org ${ax.own} · peer avg ${ax.peerAvg}`)} />; })}
        {axes.map((ax, i) => {
          const [x, y] = pt(i, R + 18);
          const a = (Math.PI * 2 * i) / n - Math.PI / 2; const anchor = Math.abs(Math.cos(a)) < 0.3 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end';
          return <text key={i} x={x} y={y} textAnchor={anchor} fontSize="8.5" fontWeight="600" fill="var(--text2)" dominantBaseline="middle">{ax.short}</text>;
        })}
      </svg>
      {node}
    </div>
  );
}

/* Bump chart (rank movement QoQ) --------------------------- */
export function BumpChart({ rows, onClick }: { rows: Array<{ id: string; domain: string; risk: string; rank: number; prevRank: number }>; onClick?: (row: any) => void }) {
  const { node, bind } = useTip();
  const W = 520, rowH = 30, H = rows.length * rowH + 30;
  const xPrev = 72, xNow = 286;
  const yOf = (rank: number) => 18 + (rank - 1) * rowH;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <text x={xPrev} y="10" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text3)" letterSpacing="0.5">PREV QUARTER</text>
        <text x={xNow} y="10" textAnchor="middle" fontSize="9" fontWeight="700" fill="var(--text3)" letterSpacing="0.5">THIS QUARTER</text>
        {rows.map(r => {
          const d = getDomain(r.domain);
          const move = r.prevRank - r.rank;
          const col = move > 0 ? 'var(--red)' : move < 0 ? 'var(--green)' : 'var(--text3)';
          return (
            <g key={r.id} onClick={() => onClick && onClick(r)} style={{ cursor: onClick ? 'pointer' : 'default' }} {...bind(r.risk, `Rank ${r.prevRank} \u2192 ${r.rank}${move !== 0 ? ` (${move > 0 ? '+' : ''}${move})` : ' (no change)'}`)}>
              <line x1={xPrev} y1={yOf(r.prevRank)} x2={xNow} y2={yOf(r.rank)} stroke={col} strokeWidth={move !== 0 ? 2 : 1.3} opacity={move !== 0 ? 0.7 : 0.35} />
              <circle cx={xPrev} cy={yOf(r.prevRank)} r="4" fill={d.color} />
              <circle cx={xNow} cy={yOf(r.rank)} r="4.5" fill={d.color} />
              <text x={xPrev - 10} y={yOf(r.prevRank)} textAnchor="end" fontSize="9.5" fill="var(--text3)" dominantBaseline="middle" className="num">{r.prevRank}</text>
              <text x={xNow + 12} y={yOf(r.rank)} textAnchor="start" fontSize="10" fill="var(--text1)" fontWeight="500" dominantBaseline="middle">{r.risk}</text>
              {move !== 0 && <text x={(xPrev + xNow) / 2} y={(yOf(r.prevRank) + yOf(r.rank)) / 2 - 4} textAnchor="middle" fontSize="9" fontWeight="700" fill={col}>{move > 0 ? `\u25b2${move}` : `\u25bc${Math.abs(move)}`}</text>}
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/* World heat dots (stylised graticule) --------------------- */
export function HeatMap({ points, accessor = 'intensity', countKey = 'count', height = 230 }: { points: Array<{ x: number; y: number; region: string; top?: string; [key: string]: any }>; accessor?: string; countKey?: string; height?: number }) {
  const { node, bind } = useTip();
  const W = 100, H = 78;
  return (
    <div style={{ position: 'relative' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', height }} preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width={W} height={H} fill="var(--bg3)" rx="2" />
        {[16, 32, 48, 64].map(y => <line key={y} x1="0" y1={y} x2={W} y2={y} stroke="var(--border)" strokeWidth="0.4" />)}
        {[20, 40, 60, 80].map(x => <line key={x} x1={x} y1="0" x2={x} y2={H} stroke="var(--border)" strokeWidth="0.4" />)}
        {points.map((p, i) => {
          const d = p.top ? getDomain(p.top) : null;
          const r = 3 + (p[accessor] || 0) * 7;
          return (
            <g key={i} {...bind(p.region, `${p[countKey]} signals · ${d ? d.short : ''}`)}>
              <circle cx={p.x} cy={p.y} r={r + 2.5} fill={d ? d.color : 'var(--accent)'} opacity={0.14} />
              <circle cx={p.x} cy={p.y} r={r} fill={d ? d.color : 'var(--accent)'} opacity={0.5 + 0.4 * (p[accessor] || 0)} style={{ cursor: 'default' }} />
              <circle cx={p.x} cy={p.y} r="1.3" fill="#fff" />
            </g>
          );
        })}
      </svg>
      {node}
    </div>
  );
}

/* Appetite vs exposure rows -------------------------------- */
export function AppetiteRow({ row }: { row: { label: string; exposure: number; appetite: number; status: 'breach' | 'tolerance' | 'within' } }) {
  const statusMap = {
    breach: { c: 'var(--red)', l: 'Breach', cls: 'rag-red' },
    tolerance: { c: 'var(--amber)', l: 'At tolerance', cls: 'rag-amber' },
    within: { c: 'var(--green)', l: 'Within', cls: 'rag-green' }
  };
  const st = statusMap[row.status] || statusMap.within;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 92px', alignItems: 'center', gap: 12, padding: '7px 0' }}>
      <div style={{ fontSize: 11.5, fontWeight: 500 }}>{row.label}</div>
      <div style={{ position: 'relative', height: 16 }}>
        <div style={{ position: 'absolute', inset: '4px 0', background: 'var(--bg4)', borderRadius: 5 }}></div>
        <div className="bar-fill" style={{ position: 'absolute', top: 4, left: 0, height: 8, width: `${row.exposure}%`, background: st.c, borderRadius: 5, transition: 'width 1.1s cubic-bezier(.16,1,.3,1)' }}></div>
        <div style={{ position: 'absolute', top: 0, height: 16, left: `${row.appetite}%`, width: 2, background: 'var(--text1)' }}>
          <div style={{ position: 'absolute', top: -4, left: -3, width: 0, height: 0, borderLeft: '4px solid transparent', borderRight: '4px solid transparent', borderTop: '5px solid var(--text1)' }}></div>
        </div>
      </div>
      <div style={{ justifySelf: 'end' }}><span className={`rag ${st.cls}`}>{st.l}</span></div>
    </div>
  );
}
