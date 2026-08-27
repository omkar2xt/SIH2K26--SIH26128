import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Card } from '../common/UIComponents';
import DemoTag from '../common/DemoTag';
import FingerprintChart from '../common/FingerprintChart';
import { DEMO_DB_INITIAL } from '../../data/demoDB';
import { BRAND } from '../../utils/branding';

export default function Landing({ onSelectRole }) {
  // Use the first animal as the demo animal for the chart preview
  const demoAnimal = DEMO_DB_INITIAL.animals[0];

  return (
    <div className="min-h-screen w-full bg-slate-50 font-sans">
      <header className="border-b border-teal-900 bg-teal-950 text-teal-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-white overflow-hidden flex items-center justify-center shrink-0 p-1">
              <img src={BRAND.logo} alt={`${BRAND.name} logo`} className="w-full h-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight font-serif text-white">{BRAND.name}</span>
          </div>
          <span className="hidden text-xs font-semibold text-teal-300 sm:block">
            SIH 2026 · PS ID 26128 · Govt. of Maharashtra
          </span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
              Livestock Health Early-Warning, Risk & Exposure Intelligence Platform
            </span>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-xl bg-white shadow-sm overflow-hidden flex items-center justify-center p-2 shrink-0">
                <img src={BRAND.logo} alt="Logo" className="w-full h-full object-contain" />
              </div>
              <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">{BRAND.name}</h1>
            </div>
            <p className="mt-4 text-lg font-semibold text-teal-800">{BRAND.tagline}</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              An explainable, rule-based decision-support platform that helps farmers, veterinarians and district officials
              spot abnormal animal behaviour early, understand disease risk with clear reasoning, and trace potential
              exposure across nearby herds — supporting veterinary judgement, not replacing it.
            </p>
            <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:flex-wrap">
              <button onClick={() => onSelectRole("farmer")} className="rounded-lg bg-teal-800 px-4 py-3.5 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">
                Farmer Login
              </button>
              <button onClick={() => onSelectRole("vet")} className="rounded-lg bg-teal-800 px-4 py-3.5 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">
                Veterinarian Login
              </button>
              <button onClick={() => onSelectRole("official")} className="rounded-lg bg-teal-800 px-4 py-3.5 text-sm font-semibold text-white hover:bg-teal-700 shadow-sm">
                Official Login
              </button>
              <button onClick={() => onSelectRole("vet")} className="flex justify-center items-center gap-2 rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3.5 text-sm font-bold text-amber-800 hover:bg-amber-100 shadow-sm">
                <span className="text-blue-500 text-lg">▶</span> Demo Mode
              </button>
            </div>
            <div className="mt-6 flex gap-4 text-xs font-semibold text-slate-400">
              <button onClick={() => onSelectRole("field")} className="underline decoration-dotted underline-offset-4 hover:text-slate-600 transition-colors">Field Worker login</button>
              <button onClick={() => onSelectRole("admin")} className="underline decoration-dotted underline-offset-4 hover:text-slate-600 transition-colors">Admin login</button>
            </div>
          </div>

          <Card className="p-5 shadow-lg border-slate-200">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-400">Health Fingerprint — live preview</span>
              <DemoTag />
            </div>
            <FingerprintChart animal={demoAnimal} compact />
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2.5 text-xs font-medium text-orange-800">
              Significant deviation from individual baseline detected for {demoAnimal.id}. Veterinary review recommended.
            </div>
          </Card>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">The problem</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Livestock diseases are frequently detected late — after visible clinical signs, or after spread to
              neighbouring animals — because subtle early behavioural change is hard for a farmer to notice and hard
              for a vet to reach in time across large, dispersed rural areas.
            </p>
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">The approach</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {BRAND.name} compares each animal against its own behavioural baseline, applies an explainable rule
              engine to flag deviations, checks disease-relevant evidence for the species, and maps potential exposure
              to nearby animals — surfacing a clear, reasoned alert to the treating veterinarian.
            </p>
          </div>
        </div>
      </section>
      
      <footer className="border-t border-slate-200 bg-slate-950 py-6 flex flex-col items-center justify-center gap-2 text-center text-xs font-medium text-slate-400">
        <div>{BRAND.name}</div>
        <div>Smart India Hackathon 2026 · Problem Statement ID: 26128 · Government of Maharashtra</div>
      </footer>
    </div>
  );
}
