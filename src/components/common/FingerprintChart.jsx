import React from 'react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

export default function FingerprintChart({ animal, compact }) {
  const data = [
    { metric: "Activity", Baseline: animal.baseline.activity, Current: animal.current.activity },
    { metric: "Feeding", Baseline: animal.baseline.feeding, Current: animal.current.feeding },
    { metric: "Movement", Baseline: animal.baseline.movement, Current: animal.current.movement },
    { metric: "Rumination", Baseline: animal.baseline.rumination, Current: animal.current.rumination },
  ];

  return (
    <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
      <RadarChart data={data} outerRadius={compact ? 70 : 90}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar name="Baseline" dataKey="Baseline" stroke="#0d9488" fill="#0d9488" fillOpacity={0.15} strokeWidth={2} />
        <Radar name="Current" dataKey="Current" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}
