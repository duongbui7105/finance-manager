// Charts.jsx — SVG chart primitives for FinManager

import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────
// AreaChart — smooth line + area fill, with hover crosshair
// data: [{ x: label, y: number }, ...]
// ─────────────────────────────────────────────────────────────────
export function AreaChart({ data, height = 220, color = '#10b981', formatY, formatX, gridY = 4, animKey = 0 }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [hover, setHover] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    setProgress(0);
    let raf, start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 700);
      const e = 1 - Math.pow(1 - p, 3);
      setProgress(e);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animKey, data.length]);

  const pad = { t: 16, r: 12, b: 24, l: 48 };
  const innerW = Math.max(10, w - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const ys = data.map(d => d.y);
  const yMin = Math.min(...ys);
  const yMax = Math.max(...ys);
  const yPad = (yMax - yMin) * 0.15 || Math.max(1, Math.abs(yMax) * 0.1);
  const lo = yMin - yPad, hi = yMax + yPad;

  const xAt = (i) => pad.l + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const yAt = (v) => pad.t + (1 - (v - lo) / (hi - lo)) * innerH;

  const pts = data.map((d, i) => [xAt(i), yAt(d.y)]);
  let path = '';
  if (pts.length) {
    path = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1];
      const [x1, y1] = pts[i];
      const cx = (x0 + x1) / 2;
      path += ` C ${cx},${y0} ${cx},${y1} ${x1},${y1}`;
    }
  }
  const areaPath = path + ` L ${pts[pts.length - 1]?.[0]},${pad.t + innerH} L ${pts[0]?.[0]},${pad.t + innerH} Z`;

  const gridYs = [];
  for (let i = 0; i <= gridY; i++) {
    const v = lo + (i / gridY) * (hi - lo);
    gridYs.push({ y: yAt(v), v });
  }

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < pts.length; i++) {
      const d = Math.abs(pts[i][0] - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    setHover(best);
  };

  const f = formatY || (v => v);
  const fx = formatX || (i => data[i]?.x);

  const tickEvery = Math.max(1, Math.ceil(data.length / 8));
  const totalLen = 2000;

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} onMouseMove={onMove} onMouseLeave={() => setHover(null)} style={{ display: 'block' }}>
        <defs>
          <linearGradient id={`ag-${color.replace(/[^a-z0-9]/gi,'')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={color} stopOpacity="0.32"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        {gridYs.map((g, i) => (
          <g key={i}>
            <line x1={pad.l} x2={w - pad.r} y1={g.y} y2={g.y} stroke="var(--fm-border-subtle)" strokeWidth="1" strokeDasharray="2 4"/>
            <text x={pad.l - 8} y={g.y + 3} textAnchor="end" fontSize="10" fill="var(--fm-text-muted)" fontFamily="var(--fm-font-mono)">{f(g.v, { compact: true })}</text>
          </g>
        ))}
        <path d={areaPath} fill={`url(#ag-${color.replace(/[^a-z0-9]/gi,'')})`} opacity={progress}/>
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"
              strokeDasharray={totalLen} strokeDashoffset={(1 - progress) * totalLen}/>
        {data.map((d, i) => (
          i % tickEvery === 0 && (
            <text key={i} x={xAt(i)} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--fm-text-muted)">{fx(i)}</text>
          )
        ))}
        {hover != null && (
          <g>
            <line x1={pts[hover][0]} x2={pts[hover][0]} y1={pad.t} y2={pad.t + innerH} stroke="var(--fm-border)" strokeDasharray="2 3"/>
            <circle cx={pts[hover][0]} cy={pts[hover][1]} r="5" fill={color} stroke="var(--fm-bg)" strokeWidth="2"/>
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute',
          left: Math.min(pts[hover][0] + 8, w - 140),
          top: pts[hover][1] - 36,
          background: 'var(--fm-tooltip-bg)',
          color: 'var(--fm-text)',
          border: '1px solid var(--fm-border)',
          padding: '6px 10px',
          borderRadius: 8,
          fontSize: 11,
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          boxShadow: 'var(--fm-shadow-md)',
        }}>
          <div style={{ color: 'var(--fm-text-muted)', fontSize: 10 }}>{fx(hover)}</div>
          <div style={{ fontFamily: 'var(--fm-font-mono)', fontWeight: 600 }}>{f(data[hover].y)}</div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// BarPairChart — grouped income vs expense
// ─────────────────────────────────────────────────────────────────
export function BarPairChart({ data, height = 240, formatY }) {
  const ref = useRef(null);
  const [w, setW] = useState(600);
  const [progress, setProgress] = useState(0);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let raf, start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 800);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  const pad = { t: 16, r: 12, b: 24, l: 48 };
  const innerW = Math.max(10, w - pad.l - pad.r);
  const innerH = height - pad.t - pad.b;
  const max = Math.max(1, ...data.flatMap(d => [Number(d.income) || 0, Number(d.expense) || 0]));
  const f = formatY || (v => v);
  const groupW = innerW / data.length;
  const barW = Math.min(14, (groupW - 8) / 2);

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} style={{ display: 'block' }}>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
          const y = pad.t + (1 - p) * innerH;
          const v = p * max;
          return (
            <g key={i}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--fm-border-subtle)" strokeDasharray="2 4"/>
              <text x={pad.l - 8} y={y + 3} textAnchor="end" fontSize="10" fill="var(--fm-text-muted)" fontFamily="var(--fm-font-mono)">{f(v, { compact: true })}</text>
            </g>
          );
        })}
        {data.map((d, i) => {
          const cx = pad.l + i * groupW + groupW / 2;
          const incH = ((Number(d.income) || 0) / max) * innerH * progress;
          const expH = ((Number(d.expense) || 0) / max) * innerH * progress;
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: 'pointer' }}>
              <rect x={cx - barW - 2} y={pad.t + innerH - incH} width={barW} height={incH} rx="2"
                    fill="var(--fm-accent)" opacity={hover == null || hover === i ? 1 : 0.4}/>
              <rect x={cx + 2} y={pad.t + innerH - expH} width={barW} height={expH} rx="2"
                    fill="var(--fm-accent-2)" opacity={hover == null || hover === i ? 1 : 0.4}/>
              <text x={cx} y={height - 6} textAnchor="middle" fontSize="10" fill="var(--fm-text-muted)">{d.month}</text>
            </g>
          );
        })}
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute', right: 12, top: 0, background: 'var(--fm-tooltip-bg)',
          color: 'var(--fm-text)', border: '1px solid var(--fm-border)', padding: '8px 12px',
          borderRadius: 8, fontSize: 11, pointerEvents: 'none', boxShadow: 'var(--fm-shadow-md)',
          minWidth: 140,
        }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{data[hover].month} 2026</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: 'var(--fm-font-mono)' }}>
            <span style={{ color: 'var(--fm-accent)' }}>↘ In</span>
            <span>{f(data[hover].income)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: 'var(--fm-font-mono)' }}>
            <span style={{ color: 'var(--fm-accent-2)' }}>↗ Out</span>
            <span>{f(data[hover].expense)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontFamily: 'var(--fm-font-mono)', borderTop: '1px solid var(--fm-border)', marginTop: 6, paddingTop: 6 }}>
            <span style={{ color: 'var(--fm-text-muted)' }}>Net</span>
            <span style={{ fontWeight: 600 }}>{f(data[hover].income - data[hover].expense)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// DonutChart — segments + center label
// data: [{ name, value, color }, ...]
// ─────────────────────────────────────────────────────────────────
export function DonutChart({ data, size = 200, thickness = 22, formatTotal, label = 'Total' }) {
  const [hover, setHover] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf, start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [data.length]);

  const total = data.reduce((s, d) => s + (Number(d.value) || 0), 0);
  const r = size / 2 - thickness / 2 - 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const f = formatTotal || (v => v);

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fm-border-subtle)" strokeWidth={thickness}/>
        {total > 0 && data.map((d, i) => {
          const frac = (Number(d.value) || 0) / total;
          const dash = c * frac * progress;
          const gap = c - dash;
          const offset = -acc * c * progress;
          acc += frac;
          return (
            <circle key={i} cx={size/2} cy={size/2} r={r} fill="none"
              stroke={d.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              opacity={hover == null || hover === i ? 1 : 0.3}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
            />
          );
        })}
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', textAlign: 'center', pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 10, color: 'var(--fm-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          {hover != null ? data[hover].name : label}
        </div>
        <div style={{ fontFamily: 'var(--fm-font-mono)', fontSize: 20, fontWeight: 600, color: 'var(--fm-text)' }}>
          {f(hover != null ? data[hover].value : total)}
        </div>
        {hover != null && (
          <div style={{ fontSize: 10, color: 'var(--fm-text-muted)', fontFamily: 'var(--fm-font-mono)' }}>
            {((data[hover].value / total) * 100).toFixed(1)}%
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sparkline — tiny inline trend
// ─────────────────────────────────────────────────────────────────
export function Sparkline({ values, width = 80, height = 24, color = '#10b981' }) {
  if (!values || !values.length) return null;
  const min = Math.min(...values), max = Math.max(...values);
  const pad = 2;
  const xs = (i) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const ys = (v) => pad + (1 - (v - min) / (max - min || 1)) * (height - pad * 2);
  let path = `M ${xs(0)},${ys(values[0])}`;
  for (let i = 1; i < values.length; i++) {
    const px = (xs(i - 1) + xs(i)) / 2;
    path += ` C ${px},${ys(values[i - 1])} ${px},${ys(values[i])} ${xs(i)},${ys(values[i])}`;
  }
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// HBar — horizontal bar (for budgets, breakdown lists)
// ─────────────────────────────────────────────────────────────────
export function HBar({ value, max, color = 'var(--fm-accent)', height = 6, danger = false }) {
  const pct = (max > 0 && isFinite(max)) ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  const over = value > max;
  return (
    <div style={{
      height, background: 'var(--fm-border-subtle)', borderRadius: 999, overflow: 'hidden', position: 'relative',
    }}>
      <div style={{
        width: `${Math.min(100, pct)}%`,
        height: '100%',
        background: over || danger ? 'var(--fm-accent-2)' : color,
        borderRadius: 999,
        transition: 'width 0.8s cubic-bezier(.2,.8,.2,1)',
      }}/>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// RingProgress — for goals
// ─────────────────────────────────────────────────────────────────
export function RingProgress({ value, max, size = 56, thickness = 5, color = 'var(--fm-accent)' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf, start = performance.now();
    const tick = (t) => {
      const p = Math.min(1, (t - start) / 900);
      setProgress(1 - Math.pow(1 - p, 3));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, max]);

  const r = size / 2 - thickness / 2 - 1;
  const c = 2 * Math.PI * r;
  const pct = (max > 0 && isFinite(max)) ? Math.min(1, (Number(value) || 0) / max) : 0;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--fm-border-subtle)" strokeWidth={thickness}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={thickness}
        strokeLinecap="round"
        strokeDasharray={`${c * pct * progress} ${c}`}
      />
    </svg>
  );
}
