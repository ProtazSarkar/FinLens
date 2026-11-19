import React, { useState } from 'react';

// Palette for categories and data series
const CHART_COLORS = [
  '#2563eb', // Blue
  '#7c3aed', // Purple
  '#059669', // Emerald
  '#ea580c', // Orange
  '#e11d48', // Rose
  '#0284c7', // Sky
  '#d97706', // Amber
  '#475569', // Slate
  '#10b981', // Mint
  '#8b5cf6', // Indigo
];

export const getCategoryColor = (categoryName) => {
  const cat = (categoryName || '').toLowerCase().replace(/\s+/g, '_');
  if (cat.includes('health')) return '#e11d48';
  if (cat.includes('grocer')) return '#059669';
  if (cat.includes('util')) return '#475569';
  if (cat.includes('restaur') || cat.includes('cafe')) return '#ea580c';
  if (cat.includes('entertain') || cat.includes('gym')) return '#7c3aed';
  if (cat.includes('travel') || cat.includes('flight')) return '#0284c7';
  if (cat.includes('online')) return '#4f46e5';
  if (cat.includes('shop')) return '#2563eb';
  return '#64748b';
};

/**
 * Interactive SVG Donut / Pie Chart Component
 */
export function DonutPieChart({ data = [], title = 'Category Spend Share', size = 220 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
        No data available to render chart.
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (Number(item.value ?? item.total_amount) || 0), 0);
  if (total <= 0) return null;

  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let accumulatedOffset = 0;

  const slices = data.map((item, index) => {
    const val = Number(item.value ?? item.total_amount) || 0;
    const pct = val / total;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -accumulatedOffset;
    accumulatedOffset += pct * circumference;
    const color = item.color || getCategoryColor(item.label ?? item.category) || CHART_COLORS[index % CHART_COLORS.length];

    return {
      ...item,
      label: item.label ?? item.category ?? `Item ${index + 1}`,
      val,
      percentage: (pct * 100).toFixed(1),
      strokeDasharray,
      strokeDashoffset,
      color,
    };
  });

  const activeSlice = hoveredIdx !== null ? slices[hoveredIdx] : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 1rem' }}>
        <svg width={size} height={size} viewBox="0 0 200 200" style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="var(--bg-subtle)"
            strokeWidth={strokeWidth}
          />
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke={slice.color}
              strokeWidth={hoveredIdx === idx ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset={slice.strokeDashoffset}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                opacity: hoveredIdx === null || hoveredIdx === idx ? 1 : 0.45,
              }}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          ))}
        </svg>

        {/* Center Tooltip Info */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            textAlign: 'center',
            padding: '1.5rem',
          }}
        >
          {activeSlice ? (
            <>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                {activeSlice.label}
              </span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.1 }}>
                {activeSlice.percentage}%
              </span>
              <span style={{ fontSize: '0.75rem', color: activeSlice.color, fontWeight: 700 }}>
                ₹{activeSlice.val.toLocaleString('en-IN')}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
                TOTAL SPEND
              </span>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                ₹{total.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-light)' }}>
                {slices.length} Categories
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '0.5rem 0.75rem',
          width: '100%',
        }}
      >
        {slices.map((slice, idx) => (
          <div
            key={idx}
            onMouseEnter={() => setHoveredIdx(idx)}
            onMouseLeave={() => setHoveredIdx(null)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.35rem 0.5rem',
              borderRadius: 'var(--radius-sm)',
              background: hoveredIdx === idx ? 'var(--bg-subtle)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', overflow: 'hidden' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: slice.color,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--text-main)',
                  fontWeight: hoveredIdx === idx ? 700 : 500,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {slice.label}
              </span>
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, marginLeft: '0.35rem' }}>
              {slice.percentage}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Monthly Spend Trend / Bar Chart Component
 */
export function BarTrendChart({ data = [], height = 180 }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => Number(d.value ?? d.total_amount) || 0), 1);

  return (
    <div style={{ width: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          height: height,
          gap: '0.75rem',
          padding: '1rem 0.5rem 0',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {data.map((item, idx) => {
          const val = Number(item.value ?? item.total_amount) || 0;
          const pct = Math.max(8, (val / maxVal) * 100);
          const label = item.label || item.month || `M${idx + 1}`;
          const isHovered = activeIdx === idx;

          return (
            <div
              key={idx}
              onMouseEnter={() => setActiveIdx(idx)}
              onMouseLeave={() => setActiveIdx(null)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '100%',
                justifyContent: 'flex-end',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              {/* Tooltip on Hover */}
              {isHovered && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-32px',
                    background: '#0f172a',
                    color: '#ffffff',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    boxShadow: 'var(--shadow-md)',
                    zIndex: 10,
                  }}
                >
                  ₹{val.toLocaleString('en-IN')}
                </div>
              )}

              {/* Bar Column */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '38px',
                  height: `${pct}%`,
                  background: isHovered
                    ? 'linear-gradient(180deg, #1d4ed8 0%, #2563eb 100%)'
                    : 'linear-gradient(180deg, #3b82f6 0%, #60a5fa 100%)',
                  borderRadius: '6px 6px 0 0',
                  transition: 'all 0.2s ease',
                  transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                  boxShadow: isHovered ? '0 4px 12px rgba(37, 99, 235, 0.3)' : 'none',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* X-Axis Month Labels */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          paddingTop: '0.5rem',
          gap: '0.75rem',
        }}
      >
        {data.map((item, idx) => (
          <div
            key={idx}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: '0.75rem',
              color: activeIdx === idx ? 'var(--primary)' : 'var(--text-muted)',
              fontWeight: activeIdx === idx ? 700 : 500,
            }}
          >
            {item.label || item.month}
          </div>
        ))}
      </div>
    </div>
  );
}
