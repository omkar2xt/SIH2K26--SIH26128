import React from 'react';
import { PawPrint, CheckCircle2, Eye, AlertTriangle, ShieldAlert } from 'lucide-react';

const RISK = {
  GREEN:    { label: "Normal",              bg: "bg-emerald-600",  soft: "bg-emerald-50 text-emerald-800 border-emerald-200",  ring: "ring-emerald-200", text: "text-emerald-700", hex: "#059669" },
  YELLOW:   { label: "Monitor",             bg: "bg-amber-500",    soft: "bg-amber-50 text-amber-800 border-amber-200",        ring: "ring-amber-200",   text: "text-amber-700",   hex: "#d97706" },
  ORANGE:   { label: "Field Verification",  bg: "bg-orange-600",   soft: "bg-orange-50 text-orange-800 border-orange-200",     ring: "ring-orange-200",  text: "text-orange-700",  hex: "#ea580c" },
  RED:      { label: "Veterinary Alert",    bg: "bg-red-600",      soft: "bg-red-50 text-red-800 border-red-200",              ring: "ring-red-200",     text: "text-red-700",     hex: "#dc2626" },
  CRITICAL: { label: "Immediate Escalation",bg: "bg-red-900",      soft: "bg-red-100 text-red-950 border-red-300",             ring: "ring-red-300",     text: "text-red-900",     hex: "#7f1d1d" },
};

export function RiskBadge({ level, size = "sm" }) {
  const r = RISK[level] || RISK.GREEN;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${r.soft} ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.bg}`} />
      {r.label}
    </span>
  );
}

export function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="text-xs font-bold uppercase tracking-wider text-teal-700">{eyebrow}</div>}
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "slate", sub }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700 border-slate-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    orange: "bg-orange-50 text-orange-700 border-orange-200",
    red: "bg-red-50 text-red-700 border-red-200",
    darkred: "bg-red-100 text-red-900 border-red-300",
    teal: "bg-teal-50 text-teal-800 border-teal-200",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
          {sub && <div className="mt-0.5 text-xs font-semibold text-slate-400">{sub}</div>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}

export function AnimalsTable({ animals, setPage }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr>
            <th className="px-4 py-2">Animal ID</th>
            <th className="px-4 py-2">Species</th>
            <th className="px-4 py-2">Breed</th>
            <th className="px-4 py-2">Health Status</th>
            <th className="px-4 py-2">Risk Level</th>
          </tr>
        </thead>
        <tbody>
          {animals.map((a) => {
            const ev = a.riskEval || { abnormality: "NONE", riskLevel: "GREEN" };
            return (
              <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-2.5 font-bold text-teal-800">{a.id}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.speciesId}</td>
                <td className="px-4 py-2.5 text-slate-600">{a.breedId}</td>
                <td className="px-4 py-2.5 font-medium text-slate-700">{ev.healthAbnormality === "NONE" ? "Normal" : `${ev.healthAbnormality} abnormality`}</td>
                <td className="px-4 py-2.5"><RiskBadge level={ev.healthRiskLevel} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
