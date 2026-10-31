'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  tagIcon?: React.ReactNode;
  theme?: 'default' | 'blue' | 'amber' | 'violet';
  pills?: { label: string; value: string | number }[];
}

export default function StatCard({
  label,
  value,
  unit,
  sub,
  tagIcon,
  theme = 'default',
  pills,
}: StatCardProps) {
  const themeClass = theme === 'default' ? '' : theme;

  return (
    <div className={`card stat ${themeClass}`}>
      <div className="k">{label}</div>
      <div className="v">
        {value}
        {unit && <small>{unit}</small>}
      </div>
      {sub && <div className="n">{sub}</div>}

      {tagIcon && <div className="tag">{tagIcon}</div>}

      {pills && pills.length > 0 && (
        <div className="split">
          {pills.map((p, idx) => (
            <span key={idx} className="pill">
              {p.label}: <b>{p.value}</b>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
