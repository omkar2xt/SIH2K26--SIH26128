import React, { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import {
  Activity, AlertTriangle, ShieldAlert, Stethoscope, Home, Users, MapPin, FileText, Bell,
  Settings as SettingsIcon, LogOut, Plus, Search, Wifi, WifiOff, RefreshCw, Camera, Cpu, Syringe,
  FlaskConical, Network, TrendingDown, TrendingUp, CheckCircle2, XCircle, ChevronRight, ChevronLeft,
  Info, Radio, Layers, ClipboardList, Filter, Play, X, PawPrint, Building2, Sprout, ClipboardCheck,
  Thermometer, Eye, Footprints, UserCheck, Database, ArrowRight,
} from "lucide-react";

/* ============================================================================
   PASHU-RAKSHA — Livestock Health Early-Warning, Risk & Exposure Intelligence
   SIH 2026 · PS ID 26128 · Govt. of Maharashtra
   Explainable rule-based prototype. Not a diagnostic or prescribing system.
   ============================================================================ */

/* ---------------------------- DESIGN TOKENS ------------------------------- */
const RISK = {
  GREEN:    { label: "Normal",              bg: "bg-emerald-600",  soft: "bg-emerald-50 text-emerald-800 border-emerald-200",  ring: "ring-emerald-200", text: "text-emerald-700", hex: "#059669" },
  YELLOW:   { label: "Monitor",             bg: "bg-amber-500",    soft: "bg-amber-50 text-amber-800 border-amber-200",        ring: "ring-amber-200",   text: "text-amber-700",   hex: "#d97706" },
  ORANGE:   { label: "Field Verification",  bg: "bg-orange-600",   soft: "bg-orange-50 text-orange-800 border-orange-200",     ring: "ring-orange-200",  text: "text-orange-700",  hex: "#ea580c" },
  RED:      { label: "Veterinary Alert",    bg: "bg-red-600",      soft: "bg-red-50 text-red-800 border-red-200",              ring: "ring-red-200",     text: "text-red-700",     hex: "#dc2626" },
  CRITICAL: { label: "Immediate Escalation",bg: "bg-red-900",      soft: "bg-red-100 text-red-950 border-red-300",             ring: "ring-red-300",     text: "text-red-900",     hex: "#7f1d1d" },
};

function RiskBadge({ level, size = "sm" }) {
  const r = RISK[level] || RISK.GREEN;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border font-semibold ${r.soft} ${size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${r.bg}`} />
      {r.label}
    </span>
  );
}

function Card({ children, className = "" }) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
}
function SectionTitle({ eyebrow, title, children }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && <div className="text-xs font-semibold uppercase tracking-wider text-teal-700">{eyebrow}</div>}
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function StatCard({ label, value, icon: Icon, tone = "slate", sub }) {
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
          <div className="text-xs font-medium text-slate-500">{label}</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{value}</div>
          {sub && <div className="mt-0.5 text-xs text-slate-400">{sub}</div>}
        </div>
        <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg border ${tones[tone]}`}>
          <Icon size={18} />
        </div>
      </div>
    </Card>
  );
}
function Modal({ open, onClose, title, children, wide }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4" onClick={onClose}>
      <div className={`max-h-[90vh] w-full ${wide ? "max-w-3xl" : "max-w-lg"} overflow-y-auto rounded-xl bg-white shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
function DemoTag() {
  return <span className="rounded border border-dashed border-slate-300 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Demo data</span>;
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-600">{label}</span>
      {children}
    </label>
  );
}
const inputCls = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100";

/* ------------------------------- MOCK DATA -------------------------------- */
const DISTRICTS = [
  { id: "nashik", name: "Nashik", x: 250, y: 150, risk: "ORANGE", farms: 14, animals: 412 },
  { id: "pune", name: "Pune", x: 280, y: 320, risk: "YELLOW", farms: 22, animals: 680 },
  { id: "nagpur", name: "Nagpur", x: 560, y: 190, risk: "RED", farms: 9, animals: 265 },
  { id: "kolhapur", name: "Kolhapur", x: 210, y: 430, risk: "GREEN", farms: 11, animals: 301 },
  { id: "sambhajinagar", name: "Chh. Sambhajinagar", x: 370, y: 250, risk: "YELLOW", farms: 16, animals: 398 },
  { id: "amravati", name: "Amravati", x: 460, y: 140, risk: "GREEN", farms: 8, animals: 210 },
  { id: "ratnagiri", name: "Ratnagiri", x: 170, y: 370, risk: "GREEN", farms: 7, animals: 154 },
];

const FARMS = [
  { id: "FARM-A", name: "Deshmukh Dairy", district: "nashik", village: "Niphad", owner: "R. Deshmukh", animals: 12 },
  { id: "FARM-B", name: "Kadam Gaushala", district: "nashik", village: "Sinnar", owner: "S. Kadam", animals: 8 },
  { id: "FARM-C", name: "Patil Livestock Farm", district: "pune", village: "Baramati", owner: "V. Patil", animals: 15 },
  { id: "FARM-D", name: "Jadhav Sheep & Goat Unit", district: "kolhapur", village: "Karvir", owner: "A. Jadhav", animals: 20 },
  { id: "FARM-E", name: "Rathi Buffalo Farm", district: "nagpur", village: "Kamptee", owner: "M. Rathi", animals: 10 },
];

const baseFingerprint = (a, f, m, r, t, s) => ({ activity: a, feeding: f, movement: m, rumination: r, tempTrend: t, social: s });

const ANIMALS = [
  { id: "MH-CAT-027", species: "Cattle", breed: "Gir", age: "4 yrs", sex: "Female", farmId: "FARM-A", district: "nashik",
    baseline: baseFingerprint(92, 88, 90, 85, "stable", "normal"),
    current: baseFingerprint(52, 57, 55, 60, "elevated", "isolating"),
    lastObservation: "2 hrs ago",
    vaccinations: [{ name: "FMD Vaccination", date: "2026-02-14", status: "Completed" }, { name: "HS + BQ", date: "2025-11-02", status: "Completed" }],
    treatments: [{ date: "2025-06-10", note: "Deworming administered" }] },
  { id: "MH-CAT-031", species: "Cattle", breed: "Gir", age: "3 yrs", sex: "Female", farmId: "FARM-A", district: "nashik",
    baseline: baseFingerprint(90, 86, 88, 84, "stable", "normal"),
    current: baseFingerprint(80, 79, 81, 80, "stable", "normal"),
    lastObservation: "3 hrs ago",
    vaccinations: [{ name: "FMD Vaccination", date: "2026-02-14", status: "Completed" }],
    treatments: [] },
  { id: "MH-CAT-014", species: "Cattle", breed: "Sahiwal", age: "5 yrs", sex: "Female", farmId: "FARM-B", district: "nashik",
    baseline: baseFingerprint(88, 85, 87, 82, "stable", "normal"),
    current: baseFingerprint(84, 83, 85, 80, "stable", "normal"),
    lastObservation: "5 hrs ago",
    vaccinations: [{ name: "FMD Vaccination", date: "2026-01-30", status: "Completed" }],
    treatments: [] },
  { id: "MH-BUF-009", species: "Buffalo", breed: "Murrah", age: "6 yrs", sex: "Female", farmId: "FARM-E", district: "nagpur",
    baseline: baseFingerprint(90, 89, 88, 86, "stable", "normal"),
    current: baseFingerprint(58, 61, 60, 65, "elevated", "isolating"),
    lastObservation: "1 hr ago",
    vaccinations: [{ name: "LSD Vaccination", date: "2025-12-05", status: "Completed" }],
    treatments: [] },
  { id: "MH-GOT-102", species: "Goat", breed: "Osmanabadi", age: "2 yrs", sex: "Female", farmId: "FARM-D", district: "kolhapur",
    baseline: baseFingerprint(91, 90, 89, 88, "stable", "normal"),
    current: baseFingerprint(70, 68, 72, 74, "stable", "normal"),
    lastObservation: "6 hrs ago",
    vaccinations: [{ name: "PPR Vaccination", date: "2025-09-19", status: "Completed" }],
    treatments: [] },
  { id: "MH-SHP-055", species: "Sheep", breed: "Deccani", age: "3 yrs", sex: "Male", farmId: "FARM-D", district: "kolhapur",
    baseline: baseFingerprint(89, 87, 90, 85, "stable", "normal"),
    current: baseFingerprint(88, 86, 89, 84, "stable", "normal"),
    lastObservation: "8 hrs ago",
    vaccinations: [{ name: "PPR Vaccination", date: "2025-09-19", status: "Completed" }],
    treatments: [] },
  { id: "MH-CAT-063", species: "Cattle", breed: "Holstein Cross", age: "4 yrs", sex: "Female", farmId: "FARM-C", district: "pune",
    baseline: baseFingerprint(93, 91, 90, 87, "stable", "normal"),
    current: baseFingerprint(91, 89, 88, 85, "stable", "normal"),
    lastObservation: "1 hr ago",
    vaccinations: [{ name: "FMD Vaccination", date: "2026-02-01", status: "Completed" }],
    treatments: [] },
  { id: "MH-CAT-078", species: "Cattle", breed: "Khillari", age: "5 yrs", sex: "Female", farmId: "FARM-C", district: "pune",
    baseline: baseFingerprint(90, 88, 89, 84, "stable", "normal"),
    current: baseFingerprint(66, 70, 68, 71, "stable", "normal"),
    lastObservation: "4 hrs ago",
    vaccinations: [{ name: "FMD Vaccination", date: "2026-02-01", status: "Completed" }],
    treatments: [] },
];

for (const a of ANIMALS) {
  const farm = FARMS.find((f) => f.id === a.farmId);
  a.farmName = farm ? farm.name : "—";
}

const DISEASE_KB = [
  { id: "fmd", name: "Foot and Mouth Disease (FMD)", species: ["Cattle", "Buffalo", "Goat", "Sheep", "Pig"],
    breedRelevance: "Not established in consulted source.",
    symptoms: "Fever, vesicular lesions on mouth/feet, excess salivation, lameness.",
    behavioralSigns: "Reduced feeding, reluctance to move, isolation from herd.",
    physicalSigns: "Blisters on tongue/gums/hooves, drooling, limping.",
    transmission: "Highly contagious; direct contact, contaminated equipment, air over short distances.",
    riskFactors: "Unvaccinated stock, animal movement, mixed grazing, fairs/markets.",
    cameraSignals: "Reduced movement, lameness/gait change, isolation.",
    iotSignals: "Activity drop, feeding drop, elevated temperature trend.",
    diagnostics: "Clinical exam and laboratory confirmation (e.g., RT-PCR/ELISA) by an accredited veterinary lab.",
    vaccination: "Biannual FMD vaccination as per state schedule.",
    prevention: "Vaccination, movement control, disinfection at farm entry points.",
    containment: "Isolate suspected animals, restrict movement, notify veterinary authority.",
    maharashtraRelevance: "Endemic risk reported in multiple districts; state runs periodic vaccination drives.",
    evidence: "Established" },
  { id: "lsd", name: "Lumpy Skin Disease (LSD)", species: ["Cattle", "Buffalo"],
    breedRelevance: "Not established in consulted source.",
    symptoms: "Fever, nodular skin lesions, reduced milk yield, lymph node swelling.",
    behavioralSigns: "Lethargy, reduced feeding, isolation.",
    physicalSigns: "Firm circumscribed skin nodules, ocular/nasal discharge.",
    transmission: "Vector-borne (biting flies, ticks, mosquitoes); indirect contact possible.",
    riskFactors: "Vector density, unvaccinated herds, proximity to affected animals.",
    cameraSignals: "Visible skin lesions, reduced movement, isolation.",
    iotSignals: "Temperature rise, activity and feeding drop.",
    diagnostics: "Clinical exam plus laboratory confirmation (e.g., PCR) by an accredited veterinary lab.",
    vaccination: "LSD vaccination as per state animal husbandry guidance.",
    prevention: "Vector control, vaccination, quarantine of new/sick animals.",
    containment: "Isolate affected animals, vector control around farm, notify authority.",
    maharashtraRelevance: "Periodic outbreaks reported in Maharashtra districts in recent years.",
    evidence: "Established" },
  { id: "ppr", name: "Peste des Petits Ruminants (PPR)", species: ["Goat", "Sheep"],
    breedRelevance: "Not established in consulted source.",
    symptoms: "Fever, oculonasal discharge, mouth erosions, diarrhoea.",
    behavioralSigns: "Depression, reduced feeding, huddling/isolation.",
    physicalSigns: "Discharge from eyes/nose, mouth lesions, laboured breathing.",
    transmission: "Highly contagious via direct contact and respiratory droplets.",
    riskFactors: "Unvaccinated flocks, mixed flock movement, close housing.",
    cameraSignals: "Isolation, reduced movement, visible discharge (limited camera reliability).",
    iotSignals: "Feeding drop, activity drop, temperature rise.",
    diagnostics: "Clinical exam and laboratory confirmation by an accredited veterinary lab.",
    vaccination: "PPR vaccination as per national control programme schedule.",
    prevention: "Vaccination, quarantine of new animals, flock biosecurity.",
    containment: "Isolate suspected animals, restrict flock movement, notify authority.",
    maharashtraRelevance: "Covered under national PPR control programme in the state.",
    evidence: "Established" },
  { id: "brucellosis", name: "Brucellosis", species: ["Cattle", "Buffalo", "Goat", "Sheep"],
    breedRelevance: "Not established in consulted source.",
    symptoms: "Abortion in late pregnancy, retained placenta, reduced fertility.",
    behavioralSigns: "Not established in consulted source.",
    physicalSigns: "Reproductive discharge, occasional joint swelling.",
    transmission: "Contact with birth fluids/aborted material; contaminated feed/water.",
    riskFactors: "Unvaccinated breeding stock, contact with aborted material.",
    cameraSignals: "Not established in consulted source.",
    iotSignals: "Not established in consulted source.",
    diagnostics: "Serological testing by an accredited veterinary/public-health laboratory.",
    vaccination: "Brucellosis vaccination for female calves as per state programme.",
    prevention: "Vaccination, hygienic handling of birth material, testing of breeding stock.",
    containment: "Isolate affected animal, safe disposal of aborted material, notify authority (zoonotic risk).",
    maharashtraRelevance: "Included under national brucellosis control programme.",
    evidence: "Established" },
  { id: "anthrax", name: "Anthrax", species: ["Cattle", "Buffalo", "Goat", "Sheep"],
    breedRelevance: "Not established in consulted source.",
    symptoms: "Sudden death, high fever, bleeding from body openings in acute cases.",
    behavioralSigns: "Severe depression, collapse.",
    physicalSigns: "Unclotted blood discharge, rapid deterioration.",
    transmission: "Spore exposure via soil, contaminated feed; carcasses highly infectious.",
    riskFactors: "Grazing on known endemic soil/pasture, unvaccinated stock.",
    cameraSignals: "Not established in consulted source.",
    iotSignals: "Sudden severe activity drop preceding collapse (limited data).",
    diagnostics: "Laboratory confirmation required; carcass must not be opened in field — notify authority immediately.",
    vaccination: "Anthrax vaccination in known endemic zones per state schedule.",
    prevention: "Vaccination in endemic zones, safe carcass disposal, restricted grazing on risk sites.",
    containment: "Immediate notification to veterinary/public-health authority; movement and carcass control (zoonotic risk).",
    maharashtraRelevance: "Sporadic cases reported in specific endemic pockets historically.",
    evidence: "Established" },
];

/* ------------------------------ RULE ENGINE -------------------------------- */
function pctDrop(baseline, current) {
  if (!baseline) return 0;
  return Math.round(((baseline - current) / baseline) * 100);
}

function evaluateAnimal(animal) {
  const b = animal.baseline, c = animal.current;
  const reasons = [];
  let score = 0;

  const actDrop = pctDrop(b.activity, c.activity);
  const feedDrop = pctDrop(b.feeding, c.feeding);
  const moveDrop = pctDrop(b.movement, c.movement);
  const rumDrop = pctDrop(b.rumination, c.rumination);

  if (actDrop >= 25) { reasons.push({ text: `Activity dropped ${actDrop}% from individual baseline`, icon: TrendingDown }); score += 2; }
  else if (actDrop >= 10) { reasons.push({ text: `Activity mildly reduced (${actDrop}%) vs baseline`, icon: TrendingDown }); score += 1; }

  if (feedDrop >= 25) { reasons.push({ text: `Feeding intake reduced ${feedDrop}% from baseline`, icon: TrendingDown }); score += 2; }
  else if (feedDrop >= 10) { reasons.push({ text: `Feeding mildly reduced (${feedDrop}%) vs baseline`, icon: TrendingDown }); score += 1; }

  if (moveDrop >= 25) { reasons.push({ text: `Movement reduced ${moveDrop}% from baseline`, icon: Footprints }); score += 1; }
  if (rumDrop >= 20) { reasons.push({ text: `Rumination reduced ${rumDrop}% from baseline`, icon: Activity }); score += 1; }

  if (c.tempTrend === "elevated") { reasons.push({ text: "Temperature trend increased over recent readings", icon: Thermometer }); score += 2; }
  if (c.social === "isolating") { reasons.push({ text: "Animal showing isolation / reduced social behaviour", icon: Users }); score += 1; }

  let abnormality = "NONE";
  let riskLevel = "GREEN";
  if (score >= 6) { abnormality = "HIGH"; riskLevel = "RED"; }
  else if (score >= 4) { abnormality = "MEDIUM"; riskLevel = "ORANGE"; }
  else if (score >= 2) { abnormality = "LOW"; riskLevel = "YELLOW"; }
  else { abnormality = "NONE"; riskLevel = "GREEN"; }
  if (score >= 6 && c.tempTrend === "elevated" && c.social === "isolating") riskLevel = "CRITICAL";

  const diseaseRisks = DISEASE_KB
    .filter((d) => d.species.includes(animal.species))
    .map((d) => {
      let dScore = 0;
      const why = [`Relevant species (${animal.species})`];
      if (c.tempTrend === "elevated" && /fever/i.test(d.symptoms)) { dScore += 2; why.push("Temperature trend consistent with described symptoms"); }
      if (actDrop >= 20 || feedDrop >= 20) { dScore += 2; why.push("Behavioural evidence (activity/feeding deviation) present"); }
      if (c.social === "isolating") { dScore += 1; why.push("Isolation behaviour observed"); }
      why.push("Local exposure/environmental context under review");
      let risk = "LOW";
      if (dScore >= 4) risk = "HIGH"; else if (dScore >= 2) risk = "MEDIUM";
      return { ...d, risk, why, dScore };
    })
    .sort((a, b2) => b2.dScore - a.dScore)
    .slice(0, 3);

  return { abnormality, riskLevel, reasons, score, diseaseRisks, actDrop, feedDrop, moveDrop, rumDrop };
}

const EXPOSURE = {
  "MH-CAT-027": [
    { id: "MH-CAT-031", distance: 4.2, contacts: 6, duration: 18, lastContact: "40 min ago", compatibility: "HIGH", risk: "HIGH" },
    { id: "MH-CAT-014", distance: 9.1, contacts: 2, duration: 5, lastContact: "3 hrs ago", compatibility: "MEDIUM", risk: "MEDIUM" },
    { id: "MH-CAT-078", distance: 22.5, contacts: 1, duration: 2, lastContact: "1 day ago", compatibility: "LOW", risk: "LOW" },
  ],
  "MH-BUF-009": [
    { id: "MH-CAT-014", distance: 15.0, contacts: 1, duration: 4, lastContact: "6 hrs ago", compatibility: "LOW", risk: "LOW" },
  ],
};

const ALERT_SEED = [
  { id: "AL-1042", animalId: "MH-CAT-027", severity: "CRITICAL", createdAt: "10 min ago", status: "OPEN" },
  { id: "AL-1041", animalId: "MH-BUF-009", severity: "RED", createdAt: "55 min ago", status: "OPEN" },
  { id: "AL-1038", animalId: "MH-CAT-078", severity: "YELLOW", createdAt: "3 hrs ago", status: "ACAKNOWLEDGED".replace("AKNOWLEDGED","KNOWLEDGED") },
  { id: "AL-1035", animalId: "MH-GOT-102", severity: "YELLOW", createdAt: "6 hrs ago", status: "OPEN" },
];

const CASE_STAGES = ["New Alert", "Accepted", "Field Review", "Sample Collected", "Lab Submitted", "Lab Result", "Confirmed / Rejected", "Action", "Follow-up", "Closed"];

const CASE_SEED = {
  "MH-CAT-027": { animalId: "MH-CAT-027", stageIndex: 1, suspectedDisease: "FMD", clinicalObservations: "", sampleId: "", sampleType: "",
    collectionDate: "", laboratory: "", labResult: "", notes: "", action: "", followUpDate: "", outcome: "" },
};

const LAB_SAMPLES = [
  { caseId: "CASE-2201", animalId: "MH-CAT-063", sampleId: "SMP-8841", sampleType: "Serum", dateCollected: "2026-08-18", laboratory: "Regional Disease Diagnostic Lab, Pune", test: "ELISA", status: "Negative" },
  { caseId: "CASE-2198", animalId: "MH-GOT-102", sampleId: "SMP-8830", sampleType: "Nasal Swab", dateCollected: "2026-08-15", laboratory: "State Vet Biological & Research Institute, Pune", test: "RT-PCR", status: "Inconclusive" },
];

const NAV = {
  farmer: [ { id: "dashboard", label: "Dashboard", icon: Home }, { id: "animals", label: "Animals", icon: PawPrint }, { id: "report", label: "Report Issue", icon: FileText }, { id: "vaccination", label: "Vaccination", icon: Syringe }, { id: "alerts", label: "Alerts", icon: Bell } ],
  vet: [ { id: "dashboard", label: "Dashboard", icon: Home }, { id: "cases", label: "Veterinary Cases", icon: ClipboardList }, { id: "animals", label: "Animals", icon: PawPrint }, { id: "risk", label: "Risk Monitor", icon: ShieldAlert }, { id: "exposure", label: "Exposure Intelligence", icon: Network }, { id: "gis", label: "GIS Map", icon: MapPin }, { id: "lab", label: "Laboratory", icon: FlaskConical }, { id: "diseases", label: "Disease Knowledge", icon: Database }, { id: "alerts", label: "Alerts", icon: Bell } ],
  official: [ { id: "dashboard", label: "State Dashboard", icon: Home }, { id: "gis", label: "GIS Map", icon: MapPin }, { id: "clusters", label: "Disease Trends & Clusters", icon: Layers }, { id: "vaccination", label: "Vaccination Coverage", icon: Syringe }, { id: "prevention", label: "Containment", icon: ShieldAlert }, { id: "alerts", label: "Reports & Alerts", icon: Bell } ],
  field: [ { id: "dashboard", label: "Dashboard", icon: Home }, { id: "animals", label: "Animals", icon: PawPrint }, { id: "report", label: "Report Issue", icon: FileText }, { id: "alerts", label: "Alerts", icon: Bell } ],
  admin: [ { id: "dashboard", label: "Dashboard", icon: Home }, { id: "animals", label: "Animals", icon: PawPrint }, { id: "farms", label: "Farms", icon: Building2 }, { id: "diseases", label: "Disease Knowledge", icon: Database }, { id: "sync", label: "Sync Center", icon: RefreshCw }, { id: "settings", label: "Settings", icon: SettingsIcon } ],
  lab: [ { id: "dashboard", label: "Laboratory", icon: FlaskConical } ],
};
const ROLE_LABEL = { farmer: "Farmer", vet: "Veterinarian", official: "District/Government Official", field: "Field Worker", admin: "Administrator", lab: "Diagnostic Laboratory" };

/* ================================ APP ===================================== */
export default function PashuRakshaApp() {
  const [role, setRole] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [selectedAnimalId, setSelectedAnimalId] = useState("MH-CAT-027");
  const [connectivity, setConnectivity] = useState("ONLINE"); // ONLINE | OFFLINE | SYNCING
  const [pendingSync, setPendingSync] = useState(3);
  const [syncedCount, setSyncedCount] = useState(24);
  const [reportOpen, setReportOpen] = useState(false);
  const [addAnimalOpen, setAddAnimalOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cases, setCases] = useState(CASE_SEED);
  const [alerts, setAlerts] = useState(ALERT_SEED);

  const selectedAnimal = ANIMALS.find((a) => a.id === selectedAnimalId) || ANIMALS[0];

  function goto(p, animalId) {
    setPage(p);
    if (animalId) setSelectedAnimalId(animalId);
  }

  function submitOfflineReport() {
    if (connectivity === "OFFLINE") {
      setPendingSync((n) => n + 1);
    } else {
      setSyncedCount((n) => n + 1);
    }
    setReportOpen(false);
  }

  function syncNow() {
    setConnectivity("SYNCING");
    setTimeout(() => {
      setSyncedCount((n) => n + pendingSync);
      setPendingSync(0);
      setConnectivity("ONLINE");
    }, 1200);
  }

  if (!role) {
    return <Landing onSelectRole={(r) => { setRole(r); setPage("dashboard"); }} />;
  }

  const nav = NAV[role];

  return (
    <div className="flex h-full min-h-[720px] w-full bg-slate-100 text-slate-800">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col bg-teal-950 text-teal-50 md:flex">
        <div className="flex items-center gap-2 border-b border-teal-800/60 px-5 py-5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700"><ShieldAlert size={18} /></div>
          <div>
            <div className="text-sm font-bold tracking-tight">PASHU-RAKSHA</div>
            <div className="text-[10px] uppercase tracking-wider text-teal-300">{ROLE_LABEL[role]}</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {nav.map((item) => (
            <button key={item.id} onClick={() => goto(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${page === item.id ? "bg-teal-800 text-white" : "text-teal-100/80 hover:bg-teal-900"}`}>
              <item.icon size={17} />{item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-teal-800/60 p-3">
          <button onClick={() => { setDemoOpen(true); }} className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-3 py-2.5 text-sm font-bold text-teal-950 hover:bg-amber-400">
            <Play size={15} /> Run Early-Warning Demo
          </button>
          <button onClick={() => setRole(null)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-teal-200/70 hover:bg-teal-900">
            <LogOut size={16} /> Switch role
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <ShieldAlert size={18} className="text-teal-800" /><span className="text-sm font-bold">PASHU-RAKSHA</span>
          </div>
          <div className="hidden text-sm text-slate-500 md:block">
            {nav.find((n) => n.id === page)?.label || "Dashboard"}
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <ConnectivityBadge connectivity={connectivity} onToggle={() => setConnectivity(connectivity === "ONLINE" ? "OFFLINE" : "ONLINE")} onSync={syncNow} pendingSync={pendingSync} />
            <button onClick={() => setNotifOpen(true)} className="relative rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50">
              <Bell size={17} />
              <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-red-600 text-[9px] font-bold text-white">3</span>
            </button>
            <div className="hidden items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 sm:flex">
              <div className="grid h-7 w-7 place-items-center rounded-full bg-teal-700 text-xs font-bold text-white">{ROLE_LABEL[role][0]}</div>
              <div className="text-xs">
                <div className="font-semibold text-slate-700">{role === "farmer" ? "R. Deshmukh" : role === "vet" ? "Dr. A. Kulkarni" : ROLE_LABEL[role]}</div>
                <div className="text-slate-400">{ROLE_LABEL[role]}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile nav */}
        <div className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">
          {nav.map((item) => (
            <button key={item.id} onClick={() => goto(item.id)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${page === item.id ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-600"}`}>
              <item.icon size={13} />{item.label}
            </button>
          ))}
          <button onClick={() => setDemoOpen(true)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-amber-500 px-3 py-1.5 text-xs font-bold text-teal-950"><Play size={13} />Demo</button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {page === "dashboard" && role === "farmer" && <FarmerDashboard goto={goto} onReport={() => setReportOpen(true)} onAddAnimal={() => setAddAnimalOpen(true)} />}
          {page === "dashboard" && role === "vet" && <VetDashboard goto={goto} alerts={alerts} />}
          {page === "dashboard" && role === "official" && <OfficialDashboard goto={goto} />}
          {page === "dashboard" && role === "field" && <FarmerDashboard goto={goto} onReport={() => setReportOpen(true)} onAddAnimal={() => setAddAnimalOpen(true)} fieldMode />}
          {page === "dashboard" && role === "admin" && <AdminDashboard goto={goto} />}
          {page === "dashboard" && role === "lab" && <LaboratoryModule />}

          {page === "animals" && <AnimalsList goto={goto} onAddAnimal={() => setAddAnimalOpen(true)} role={role} />}
          {page === "animal-profile" && <AnimalProfile animal={selectedAnimal} goto={goto} role={role} />}
          {page === "report" && <ReportHealthIssue connectivity={connectivity} onSubmit={submitOfflineReport} embedded />}
          {page === "risk" && <RiskMonitor goto={goto} />}
          {page === "exposure" && <ExposureIntelligence animal={selectedAnimal} goto={goto} />}
          {page === "diseases" && <DiseaseKnowledgeBase />}
          {page === "gis" && <GISDashboard />}
          {page === "clusters" && <ClusterView />}
          {page === "cases" && <VetCaseWorkflow cases={cases} setCases={setCases} goto={goto} />}
          {page === "lab" && <LaboratoryModule />}
          {page === "vaccination" && <VaccinationPage role={role} />}
          {page === "alerts" && <AlertsCenter alerts={alerts} setAlerts={setAlerts} goto={goto} />}
          {page === "prevention" && <PreventionControl />}
          {page === "farms" && <FarmsPage />}
          {page === "sync" && <SyncCenter connectivity={connectivity} pendingSync={pendingSync} syncedCount={syncedCount} onSync={syncNow} />}
          {page === "settings" && <SettingsPage role={role} />}
        </main>
      </div>

      <Modal open={reportOpen} onClose={() => setReportOpen(false)} title="Report Health Issue" wide>
        <ReportHealthIssue connectivity={connectivity} onSubmit={submitOfflineReport} />
      </Modal>
      <Modal open={addAnimalOpen} onClose={() => setAddAnimalOpen(false)} title="Add Animal">
        <AddAnimalForm onDone={() => setAddAnimalOpen(false)} />
      </Modal>
      <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications">
        <NotificationsPreview />
      </Modal>
      {demoOpen && <DemoRunner onClose={() => setDemoOpen(false)} goto={goto} setRole={setRole} role={role} />}
    </div>
  );
}

/* ------------------------------- LANDING ----------------------------------- */
function Landing({ onSelectRole }) {
  return (
    <div className="min-h-[720px] w-full bg-slate-50">
      <header className="border-b border-slate-200 bg-teal-950 text-teal-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700"><ShieldAlert size={18} /></div>
            <span className="text-lg font-bold tracking-tight font-serif">PASHU-RAKSHA</span>
          </div>
          <span className="hidden text-xs text-teal-300 sm:block">SIH 2026 · PS ID 26128 · Govt. of Maharashtra</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-14 md:py-20">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <span className="mb-4 inline-block rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">Livestock Health Early-Warning, Risk & Exposure Intelligence</span>
            <h1 className="font-serif text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">PASHU-RAKSHA</h1>
            <p className="mt-4 text-lg font-medium text-teal-800">Detect earlier. Assess risk. Protect the herd.</p>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-600">
              An explainable, rule-based decision-support platform that helps farmers, veterinarians and district officials
              spot abnormal animal behaviour early, understand disease risk with clear reasoning, and trace potential
              exposure across nearby herds — supporting veterinary judgement, not replacing it.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
              <button onClick={() => onSelectRole("farmer")} className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">Farmer Login</button>
              <button onClick={() => onSelectRole("vet")} className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">Veterinarian Login</button>
              <button onClick={() => onSelectRole("official")} className="rounded-lg bg-teal-800 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700">Official Login</button>
              <button onClick={() => onSelectRole("vet")} className="rounded-lg border-2 border-amber-500 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 hover:bg-amber-100">▶ Demo Mode</button>
            </div>
            <div className="mt-4 flex gap-4 text-xs text-slate-400">
              <button onClick={() => onSelectRole("field")} className="underline decoration-dotted underline-offset-2 hover:text-slate-600">Field Worker login</button>
              <button onClick={() => onSelectRole("admin")} className="underline decoration-dotted underline-offset-2 hover:text-slate-600">Admin login</button>
              <button onClick={() => onSelectRole("lab")} className="underline decoration-dotted underline-offset-2 hover:text-slate-600">Laboratory login</button>
            </div>
          </div>

          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Health Fingerprint — live preview</span>
              <DemoTag />
            </div>
            <FingerprintChart animal={ANIMALS[0]} compact />
            <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-xs text-orange-800">
              Significant deviation from individual baseline detected for MH-CAT-027. Veterinary review recommended.
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
              PASHU-RAKSHA compares each animal against its own behavioural baseline, applies an explainable rule
              engine to flag deviations, checks disease-relevant evidence for the species, and maps potential exposure
              to nearby animals — surfacing a clear, reasoned alert to the treating veterinarian.
            </p>
          </div>
        </div>
      </section>
      <footer className="border-t border-slate-200 bg-slate-950 py-6 text-center text-xs text-slate-400">
        PASHU-RAKSHA prototype for Smart India Hackathon 2026 · Decision-support only — not a diagnostic or prescribing system.
      </footer>
    </div>
  );
}

/* ---------------------------- CONNECTIVITY --------------------------------- */
function ConnectivityBadge({ connectivity, onToggle, onSync, pendingSync }) {
  const cfg = {
    ONLINE: { icon: Wifi, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Online" },
    OFFLINE: { icon: WifiOff, cls: "bg-red-50 text-red-700 border-red-200", label: "Offline" },
    SYNCING: { icon: RefreshCw, cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Syncing…" },
  }[connectivity];
  return (
    <div className="flex items-center gap-2">
      {pendingSync > 0 && connectivity !== "SYNCING" && (
        <button onClick={onSync} className="hidden rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 sm:block">{pendingSync} queued</button>
      )}
      <button onClick={onToggle} className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold ${cfg.cls}`}>
        <cfg.icon size={13} className={connectivity === "SYNCING" ? "animate-spin" : ""} />{cfg.label}
      </button>
    </div>
  );
}

/* ------------------------------ DASHBOARDS ---------------------------------- */
function FarmerDashboard({ goto, onReport, onAddAnimal, fieldMode }) {
  const total = ANIMALS.length;
  return (
    <div>
      <SectionTitle eyebrow={fieldMode ? "Field Worker" : "Farmer"} title={fieldMode ? "Field overview" : "Herd overview"}>
        <div className="flex gap-2">
          <button onClick={onAddAnimal} className="flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"><Plus size={14} />Add Animal</button>
          <button onClick={onReport} className="flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-800 hover:bg-orange-100"><AlertTriangle size={14} />Report Health Issue</button>
        </div>
      </SectionTitle>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Total Animals" value={total} icon={PawPrint} tone="teal" sub={<DemoTag />} />
        <StatCard label="Healthy" value={4} icon={CheckCircle2} tone="emerald" />
        <StatCard label="Observation" value={2} icon={Eye} tone="amber" />
        <StatCard label="High Risk" value={1} icon={AlertTriangle} tone="orange" />
        <StatCard label="Critical" value={1} icon={ShieldAlert} tone="darkred" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Recent alerts</h3>
            <button onClick={() => goto("alerts")} className="text-xs font-semibold text-teal-700 hover:underline">View all</button>
          </div>
          <div className="space-y-2">
            {ALERT_SEED.slice(0, 3).map((al) => {
              const an = ANIMALS.find((a) => a.id === al.animalId);
              return (
                <button key={al.id} onClick={() => goto("animal-profile", al.animalId)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-left hover:bg-slate-50">
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{al.animalId} <span className="font-normal text-slate-400">· {an?.farmName}</span></div>
                    <div className="text-xs text-slate-400">{al.createdAt}</div>
                  </div>
                  <RiskBadge level={al.severity} />
                </button>
              );
            })}
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Vaccination reminders</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2"><span className="text-amber-800">FMD booster — MH-CAT-014</span><span className="text-xs font-semibold text-amber-700">5 days</span></div>
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2"><span className="text-slate-600">PPR — MH-SHP-055</span><span className="text-xs font-semibold text-slate-500">18 days</span></div>
          </div>
          <h3 className="mb-2 mt-4 text-sm font-bold text-slate-900">Pending reports</h3>
          <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500">1 offline report queued for sync</div>
        </Card>
      </div>

      <div className="mt-6">
        <SectionTitle title="My animals" />
        <AnimalsTable animals={ANIMALS.slice(0, 5)} goto={goto} />
      </div>
    </div>
  );
}

function VetDashboard({ goto, alerts }) {
  const critical = alerts.filter((a) => a.severity === "CRITICAL").length;
  const high = alerts.filter((a) => a.severity === "RED").length + 2;
  const medium = alerts.filter((a) => a.severity === "ORANGE").length + 5;
  return (
    <div>
      <SectionTitle eyebrow="Veterinarian" title="Case triage overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Critical" value={critical || 1} icon={ShieldAlert} tone="darkred" />
        <StatCard label="High Risk" value={high} icon={AlertTriangle} tone="red" />
        <StatCard label="Medium Risk" value={medium} icon={Eye} tone="orange" />
        <StatCard label="Lab Pending" value={3} icon={FlaskConical} tone="amber" />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-3">
        <Card className="overflow-x-auto p-0 xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-bold text-slate-900">Priority alert queue</h3>
            <DemoTag />
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr><th className="px-4 py-2">Animal</th><th className="px-4 py-2">Farm</th><th className="px-4 py-2">Species</th><th className="px-4 py-2">Abnormality</th><th className="px-4 py-2">Risk</th><th className="px-4 py-2">Exposure</th><th className="px-4 py-2">Action</th></tr>
            </thead>
            <tbody>
              {ANIMALS.map((a) => {
                const ev = evaluateAnimal(a);
                if (ev.riskLevel === "GREEN") return null;
                const exp = EXPOSURE[a.id];
                const expRisk = exp ? exp[0].risk : "—";
                return (
                  <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2.5 font-semibold text-slate-800">{a.id}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.farmName}</td>
                    <td className="px-4 py-2.5 text-slate-500">{a.species}</td>
                    <td className="px-4 py-2.5 text-slate-500">{ev.reasons.slice(0, 2).map((r) => r.text.split(" from")[0].split(" over")[0]).join(" + ") || "—"}</td>
                    <td className="px-4 py-2.5"><RiskBadge level={ev.riskLevel} /></td>
                    <td className="px-4 py-2.5">{expRisk !== "—" ? <RiskBadge level={expRisk === "HIGH" ? "RED" : expRisk === "MEDIUM" ? "ORANGE" : "GREEN"} /> : "—"}</td>
                    <td className="px-4 py-2.5"><button onClick={() => goto("animal-profile", a.id)} className="text-xs font-semibold text-teal-700 hover:underline">Review</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Shortcuts</h3>
          <div className="space-y-2">
            <button onClick={() => goto("risk")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"><span className="flex items-center gap-2"><ShieldAlert size={15} className="text-teal-700" />Risk Monitor</span><ChevronRight size={15} className="text-slate-300" /></button>
            <button onClick={() => goto("exposure")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"><span className="flex items-center gap-2"><Network size={15} className="text-teal-700" />Exposure Intelligence</span><ChevronRight size={15} className="text-slate-300" /></button>
            <button onClick={() => goto("cases")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"><span className="flex items-center gap-2"><ClipboardList size={15} className="text-teal-700" />Case Workflow</span><ChevronRight size={15} className="text-slate-300" /></button>
            <button onClick={() => goto("lab")} className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50"><span className="flex items-center gap-2"><FlaskConical size={15} className="text-teal-700" />Laboratory</span><ChevronRight size={15} className="text-slate-300" /></button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function OfficialDashboard({ goto }) {
  const chartData = [
    { day: "Mon", alerts: 4 }, { day: "Tue", alerts: 6 }, { day: "Wed", alerts: 5 }, { day: "Thu", alerts: 9 }, { day: "Fri", alerts: 7 }, { day: "Sat", alerts: 11 }, { day: "Sun", alerts: 8 },
  ];
  const bySpecies = [
    { species: "Cattle", alerts: 14 }, { species: "Buffalo", alerts: 6 }, { species: "Goat", alerts: 4 }, { species: "Sheep", alerts: 2 },
  ];
  return (
    <div>
      <SectionTitle eyebrow="District / Government Official" title="Maharashtra — state risk overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Total Animals Tracked" value="2,420" icon={PawPrint} tone="teal" sub={<DemoTag />} />
        <StatCard label="Open Veterinary Cases" value={17} icon={ClipboardList} tone="orange" />
        <StatCard label="Potential Clusters" value={2} icon={Layers} tone="red" />
        <StatCard label="Vaccination Coverage" value="78%" icon={Syringe} tone="emerald" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Alerts over time <span className="ml-1 text-xs font-normal text-slate-400">(demo data)</span></h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="day" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Line type="monotone" dataKey="alerts" stroke="#0f766e" strokeWidth={2.5} dot={{ r: 3 }} /></LineChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Alerts by species <span className="ml-1 text-xs font-normal text-slate-400">(demo data)</span></h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={bySpecies}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="species" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="alerts" fill="#0d9488" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">District risk distribution</h3><button onClick={() => goto("gis")} className="text-xs font-semibold text-teal-700 hover:underline">Open GIS map</button></div>
          <div className="space-y-2">
            {DISTRICTS.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                <span className="text-sm text-slate-700">{d.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400">{d.farms} farms · {d.animals} animals</span>
                  <RiskBadge level={d.risk} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">Potential clusters</h3><button onClick={() => goto("clusters")} className="text-xs font-semibold text-teal-700 hover:underline">Open cluster view</button></div>
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"><b>Nashik — Niphad block:</b> 3 animals with correlated abnormality signatures within a 72-hour window. Status: potential cluster, awaiting field verification.</div>
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800"><b>Nagpur — Kamptee block:</b> 2 animals under monitoring, isolated case profile so far.</div>
        </Card>
      </div>
    </div>
  );
}

function AdminDashboard({ goto }) {
  return (
    <div>
      <SectionTitle eyebrow="Admin" title="System overview" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Registered Users" value={186} icon={Users} tone="teal" sub={<DemoTag />} />
        <StatCard label="Farms" value={FARMS.length} icon={Building2} tone="emerald" />
        <StatCard label="Animals" value={ANIMALS.length} icon={PawPrint} tone="amber" />
        <StatCard label="Diseases in KB" value={DISEASE_KB.length} icon={Database} tone="orange" />
      </div>
      <Card className="mt-6 p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Module status</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {["Rule Engine (v1, explainable)", "Exposure Intelligence Graph", "GIS / District Risk Layer", "Offline Sync Queue", "IoT Simulator", "Camera Simulator"].map((m) => (
            <div key={m} className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"><span className="text-slate-600">{m}</span><span className="flex items-center gap-1 text-xs font-semibold text-emerald-700"><CheckCircle2 size={13} />Active</span></div>
          ))}
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------ ANIMALS ------------------------------------ */
function AnimalsTable({ animals, goto }) {
  return (
    <Card className="overflow-x-auto p-0">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
          <tr><th className="px-4 py-2">Animal ID</th><th className="px-4 py-2">Species</th><th className="px-4 py-2">Breed</th><th className="px-4 py-2">Age</th><th className="px-4 py-2">Sex</th><th className="px-4 py-2">Health Status</th><th className="px-4 py-2">Risk Level</th><th className="px-4 py-2">Last Observation</th></tr>
        </thead>
        <tbody>
          {animals.map((a) => {
            const ev = evaluateAnimal(a);
            return (
              <tr key={a.id} className="cursor-pointer border-t border-slate-100 hover:bg-slate-50" onClick={() => goto("animal-profile", a.id)}>
                <td className="px-4 py-2.5 font-semibold text-teal-800">{a.id}</td>
                <td className="px-4 py-2.5">{a.species}</td>
                <td className="px-4 py-2.5">{a.breed}</td>
                <td className="px-4 py-2.5">{a.age}</td>
                <td className="px-4 py-2.5">{a.sex}</td>
                <td className="px-4 py-2.5">{ev.abnormality === "NONE" ? "Normal" : `${ev.abnormality[0]}${ev.abnormality.slice(1).toLowerCase()} abnormality`}</td>
                <td className="px-4 py-2.5"><RiskBadge level={ev.riskLevel} /></td>
                <td className="px-4 py-2.5 text-slate-400">{a.lastObservation}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}

function AnimalsList({ goto, onAddAnimal, role }) {
  const [q, setQ] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("All");
  const filtered = ANIMALS.filter((a) => (speciesFilter === "All" || a.species === speciesFilter) && (a.id.toLowerCase().includes(q.toLowerCase()) || a.breed.toLowerCase().includes(q.toLowerCase())));
  return (
    <div>
      <SectionTitle title="Animals">
        <button onClick={onAddAnimal} className="flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"><Plus size={14} />Add Animal</button>
      </SectionTitle>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID or breed…" className={`${inputCls} pl-9`} />
        </div>
        <select value={speciesFilter} onChange={(e) => setSpeciesFilter(e.target.value)} className={`${inputCls} w-auto`}>
          {["All", "Cattle", "Buffalo", "Goat", "Sheep"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <AnimalsTable animals={filtered} goto={goto} />
    </div>
  );
}

function FingerprintChart({ animal, compact }) {
  const data = [
    { metric: "Activity", Baseline: animal.baseline.activity, Current: animal.current.activity },
    { metric: "Feeding", Baseline: animal.baseline.feeding, Current: animal.current.feeding },
    { metric: "Movement", Baseline: animal.baseline.movement, Current: animal.current.movement },
    { metric: "Rumination", Baseline: animal.baseline.rumination, Current: animal.current.rumination },
  ];
  return (
    <ResponsiveContainer width="100%" height={compact ? 200 : 260}>
      <RadarChart data={data} outerRadius={compact ? 70 : 90}>
        <PolarGrid stroke="#e2e8f0" /><PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} /><PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
        <Radar name="Baseline" dataKey="Baseline" stroke="#0d9488" fill="#0d9488" fillOpacity={0.15} strokeWidth={2} />
        <Radar name="Current" dataKey="Current" stroke="#dc2626" fill="#dc2626" fillOpacity={0.2} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
}

function AnimalProfile({ animal, goto, role }) {
  const [tab, setTab] = useState("overview");
  const ev = evaluateAnimal(animal);
  const exposure = EXPOSURE[animal.id];
  return (
    <div>
      <button onClick={() => goto("animals")} className="mb-3 flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-teal-700"><ChevronLeft size={14} />Back to animals</button>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><h1 className="text-2xl font-bold text-slate-900">{animal.id}</h1><RiskBadge level={ev.riskLevel} size="md" /></div>
          <div className="text-sm text-slate-500">{animal.species} · {animal.breed} · {animal.age} · {animal.sex} · {animal.farmName}</div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => goto("exposure", animal.id)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50">View Exposure</button>
          {(role === "vet") && <button onClick={() => goto("cases")} className="rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700">Open Case</button>}
        </div>
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200">
        {["overview", "fingerprint", "why", "vaccination", "treatment"].map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 border-b-2 px-3 py-2 text-sm font-semibold capitalize ${tab === t ? "border-teal-700 text-teal-800" : "border-transparent text-slate-400 hover:text-slate-600"}`}>{t === "why" ? "Why this alert?" : t}</button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="p-4 lg:col-span-2">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Health fingerprint — baseline vs current</h3>
            <FingerprintChart animal={animal} />
            <div className="mt-3 text-xs text-slate-500">Individual baseline learned from this animal's own recent history. Comparison is behavioural, not a diagnosis.</div>
          </Card>
          <Card className="p-4">
            <h3 className="mb-2 text-sm font-bold text-slate-900">Current status</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Abnormality</dt><dd className="font-semibold text-slate-800">{ev.abnormality}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Risk level</dt><dd><RiskBadge level={ev.riskLevel} /></dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Temperature trend</dt><dd className="font-semibold capitalize text-slate-800">{animal.current.tempTrend}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Social behaviour</dt><dd className="font-semibold capitalize text-slate-800">{animal.current.social}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Last observation</dt><dd className="text-slate-800">{animal.lastObservation}</dd></div>
              {exposure && <div className="flex justify-between"><dt className="text-slate-500">Exposure risk</dt><dd><RiskBadge level={exposure[0].risk === "HIGH" ? "RED" : exposure[0].risk === "MEDIUM" ? "ORANGE" : "GREEN"} /></dd></div>}
            </dl>
          </Card>
        </div>
      )}

      {tab === "fingerprint" && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Baseline vs current — detailed comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[
              { metric: "Activity", Baseline: animal.baseline.activity, Current: animal.current.activity },
              { metric: "Feeding", Baseline: animal.baseline.feeding, Current: animal.current.feeding },
              { metric: "Movement", Baseline: animal.baseline.movement, Current: animal.current.movement },
              { metric: "Rumination", Baseline: animal.baseline.rumination, Current: animal.current.rumination },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" /><XAxis dataKey="metric" tick={{ fontSize: 12 }} /><YAxis domain={[0, 100]} tick={{ fontSize: 12 }} /><Tooltip /><Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Baseline" fill="#0d9488" radius={[4, 4, 0, 0]} /><Bar dataKey="Current" fill="#dc2626" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {ev.riskLevel !== "GREEN" && (
            <div className="mt-4 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-800">
              Significant deviation from individual baseline. This indicates a behavioural change requiring review — it is not a confirmed disease.
            </div>
          )}
        </Card>
      )}

      {tab === "why" && <WhyThisAlertPanel ev={ev} animal={animal} />}

      {tab === "vaccination" && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Vaccination history</h3>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400"><tr><th className="py-1.5">Vaccine</th><th className="py-1.5">Date</th><th className="py-1.5">Status</th></tr></thead>
            <tbody>{animal.vaccinations.map((v, i) => <tr key={i} className="border-t border-slate-100"><td className="py-2">{v.name}</td><td className="py-2">{v.date}</td><td className="py-2"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{v.status}</span></td></tr>)}</tbody>
          </table>
        </Card>
      )}
      {tab === "treatment" && (
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Treatment history</h3>
          {animal.treatments.length ? (
            <ul className="space-y-2 text-sm">{animal.treatments.map((t, i) => <li key={i} className="rounded-lg border border-slate-100 px-3 py-2"><span className="text-slate-400">{t.date}</span> — {t.note}</li>)}</ul>
          ) : <div className="text-sm text-slate-400">No treatment records on file.</div>}
        </Card>
      )}
    </div>
  );
}

function WhyThisAlertPanel({ ev, animal }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="p-4">
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Info size={16} className="text-teal-700" />Why this alert?</h3>
        {ev.reasons.length === 0 ? (
          <div className="text-sm text-slate-400">No rule conditions triggered — behaviour is within individual baseline range.</div>
        ) : (
          <ul className="space-y-2">
            {ev.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />{r.text}</li>
            ))}
            <li className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />Local exposure risk context checked (see Exposure Intelligence)</li>
          </ul>
        )}
        <div className="mt-4 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500">
          This panel reflects rule-engine reasoning based on individual-baseline deviation. It expresses a <b>risk level</b>, not a confirmed disease.
        </div>
      </Card>
      <Card className="p-4">
        <h3 className="mb-3 text-sm font-bold text-slate-900">Possible health risks</h3>
        <div className="space-y-3">
          {ev.diseaseRisks.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-200 p-3">
              <div className="mb-1 flex items-center justify-between"><span className="text-sm font-semibold text-slate-800">{d.name}</span><RiskBadge level={d.risk === "HIGH" ? "RED" : d.risk === "MEDIUM" ? "ORANGE" : "YELLOW"} /></div>
              <ul className="mt-1 space-y-1 text-xs text-slate-500">{d.why.map((w, i) => <li key={i}>• {w}</li>)}</ul>
            </div>
          ))}
          {ev.diseaseRisks.length === 0 && <div className="text-sm text-slate-400">No elevated species-relevant disease signals at this time.</div>}
        </div>
        <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800">Veterinary confirmation required.</div>
      </Card>
    </div>
  );
}

/* ------------------------------ REPORT ISSUE -------------------------------- */
function ReportHealthIssue({ connectivity, onSubmit, embedded }) {
  const [symptom, setSymptom] = useState("");
  const content = (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }} className="space-y-4">
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${connectivity === "OFFLINE" ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
        {connectivity === "OFFLINE" ? <WifiOff size={14} /> : <Wifi size={14} />} {connectivity === "OFFLINE" ? "Offline — report will be saved locally and synced when connectivity returns." : "Online"}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Animal ID"><select className={inputCls}>{ANIMALS.map((a) => <option key={a.id}>{a.id}</option>)}</select></Field>
        <Field label="Symptom / behaviour change"><input value={symptom} onChange={(e) => setSymptom(e.target.value)} placeholder="e.g. reduced feeding, limping" className={inputCls} /></Field>
        <Field label="Feeding change"><select className={inputCls}><option>No change</option><option>Reduced</option><option>Stopped eating</option></select></Field>
        <Field label="Mortality"><select className={inputCls}><option>No</option><option>Yes</option></select></Field>
        <Field label="Photo"><input type="file" className={`${inputCls} py-1.5`} /></Field>
        <Field label="Video"><input type="file" className={`${inputCls} py-1.5`} /></Field>
        <Field label="Timestamp"><input type="datetime-local" className={inputCls} /></Field>
        <Field label="Location"><input defaultValue="Auto-captured (GPS)" className={inputCls} disabled /></Field>
      </div>
      <Field label="Observation notes"><textarea rows={3} className={inputCls} placeholder="Describe what you observed…" /></Field>
      <button type="submit" className="w-full rounded-lg bg-teal-800 py-2.5 text-sm font-bold text-white hover:bg-teal-700">{connectivity === "OFFLINE" ? "Save Report (Offline)" : "Submit Report"}</button>
    </form>
  );
  if (embedded) return <div className="mx-auto max-w-2xl"><SectionTitle title="Report Health Issue" /><Card className="p-5">{content}</Card></div>;
  return content;
}

function AddAnimalForm({ onDone }) {
  return (
    <form onSubmit={(e) => { e.preventDefault(); onDone(); }} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Animal ID"><input placeholder="e.g. MH-CAT-091" className={inputCls} /></Field>
        <Field label="Species"><select className={inputCls}>{["Cattle", "Buffalo", "Goat", "Sheep", "Pig"].map((s) => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Breed"><input placeholder="e.g. Gir" className={inputCls} /></Field>
        <Field label="Age"><input placeholder="e.g. 3 yrs" className={inputCls} /></Field>
        <Field label="Sex"><select className={inputCls}><option>Female</option><option>Male</option></select></Field>
        <Field label="Farm"><select className={inputCls}>{FARMS.map((f) => <option key={f.id}>{f.name}</option>)}</select></Field>
      </div>
      <button type="submit" className="w-full rounded-lg bg-teal-800 py-2.5 text-sm font-bold text-white hover:bg-teal-700">Save Animal</button>
    </form>
  );
}

/* ------------------------------ RISK MONITOR -------------------------------- */
function RiskMonitor({ goto }) {
  const rows = ANIMALS.map((a) => ({ a, ev: evaluateAnimal(a) })).sort((x, y) => y.ev.score - x.ev.score);
  return (
    <div>
      <SectionTitle eyebrow="Explainable Rule Engine" title="Risk Monitor" />
      <Card className="mb-4 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-900"><Cpu size={16} className="text-teal-700" />How the rule engine works</h3>
        <p className="text-sm text-slate-600">Each animal's live readings are compared against its own individual baseline. Rule conditions on activity, feeding, movement, rumination, temperature trend and social behaviour combine into an abnormality score, which maps to a risk level. Every alert shows its exact reasoning — no hidden scoring.</p>
        <div className="mt-3 rounded-lg bg-slate-50 p-3 font-mono text-xs text-slate-500">
          IF activity_drop ≥ 25% AND feeding_drop ≥ 25% AND temperature_trend = elevated<br />THEN health_abnormality = HIGH<br /><br />
          IF health_abnormality = HIGH AND disease_evidence ≥ threshold<br />THEN disease_risk = HIGH
        </div>
      </Card>
      <div className="space-y-3">
        {rows.map(({ a, ev }) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><span className="font-semibold text-slate-800">{a.id}</span><span className="text-xs text-slate-400">{a.species} · {a.farmName}</span></div>
              <div className="flex items-center gap-2"><RiskBadge level={ev.riskLevel} /><button onClick={() => goto("animal-profile", a.id)} className="text-xs font-semibold text-teal-700 hover:underline">Details</button></div>
            </div>
            {ev.reasons.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {ev.reasons.map((r, i) => (<span key={i} className="flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-600"><r.icon size={12} />{r.text}</span>))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- EXPOSURE INTELLIGENCE --------------------------- */
function ExposureIntelligence({ animal, goto }) {
  const [selected, setSelected] = useState(animal.id in EXPOSURE ? animal.id : "MH-CAT-027");
  const contacts = EXPOSURE[selected] || [];
  const cx = ANIMALS.find((a) => a.id === selected);
  return (
    <div>
      <SectionTitle eyebrow="Exposure Intelligence" title="Potential exposure graph" />
      <div className="mb-4 flex items-center gap-2">
        <span className="text-xs text-slate-500">Source animal:</span>
        <select value={selected} onChange={(e) => setSelected(e.target.value)} className={`${inputCls} w-auto`}>
          {Object.keys(EXPOSURE).map((id) => <option key={id}>{id}</option>)}
        </select>
      </div>

      <Card className="mb-4 p-5">
        <div className="flex flex-col items-center gap-4">
          <div className={`rounded-xl border-2 px-5 py-3 text-center ${RISK[evaluateAnimal(cx).riskLevel].soft}`}>
            <div className="text-xs font-semibold uppercase tracking-wide">{cx.id}</div>
            <div className="text-xs">{evaluateAnimal(cx).riskLevel === "GREEN" ? "Normal" : "High risk source"}</div>
          </div>
          <div className="flex flex-col items-center text-slate-300"><div className="h-6 w-px bg-slate-300" /><ArrowRight size={16} className="rotate-90" /><span className="text-[10px] font-semibold uppercase text-slate-400">contact</span></div>
          <div className="grid w-full gap-3 sm:grid-cols-3">
            {contacts.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 p-3 text-center">
                <div className="text-sm font-bold text-slate-800">{c.id}</div>
                <RiskBadge level={c.risk === "HIGH" ? "RED" : c.risk === "MEDIUM" ? "ORANGE" : "GREEN"} />
                <dl className="mt-2 space-y-1 text-left text-xs text-slate-500">
                  <div className="flex justify-between"><dt>Distance</dt><dd className="font-medium text-slate-700">{c.distance} m</dd></div>
                  <div className="flex justify-between"><dt>Contacts</dt><dd className="font-medium text-slate-700">{c.contacts}</dd></div>
                  <div className="flex justify-between"><dt>Duration</dt><dd className="font-medium text-slate-700">{c.duration} min</dd></div>
                  <div className="flex justify-between"><dt>Last contact</dt><dd className="font-medium text-slate-700">{c.lastContact}</dd></div>
                  <div className="flex justify-between"><dt>Compatibility</dt><dd className="font-medium text-slate-700">{c.compatibility}</dd></div>
                </dl>
                <button onClick={() => goto("animal-profile", c.id)} className="mt-2 text-xs font-semibold text-teal-700 hover:underline">View animal</button>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
        <b>Potential exposure risk — not a confirmed transmission.</b> Contact-graph proximity, frequency and duration are combined with disease-species compatibility to prioritise which nearby animals warrant veterinary inspection.
      </div>
      {contacts.some((c) => c.risk === "HIGH") && (
        <div className="mt-3 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800">Recommend veterinary inspection of high-compatibility contacts.</div>
      )}
    </div>
  );
}

/* --------------------------- DISEASE KNOWLEDGE BASE --------------------------- */
function DiseaseKnowledgeBase() {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(DISEASE_KB[0].id);
  const filtered = DISEASE_KB.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()) || d.species.join(" ").toLowerCase().includes(q.toLowerCase()));
  const FIELDS = [
    ["Species", "species"], ["Breed relevance", "breedRelevance"], ["Symptoms", "symptoms"], ["Behavioural signs", "behavioralSigns"],
    ["Physical signs", "physicalSigns"], ["Transmission", "transmission"], ["Risk factors", "riskFactors"], ["Camera signals", "cameraSignals"],
    ["IoT signals", "iotSignals"], ["Diagnostics", "diagnostics"], ["Vaccination", "vaccination"], ["Prevention", "prevention"],
    ["Containment", "containment"], ["Maharashtra relevance", "maharashtraRelevance"],
  ];
  return (
    <div>
      <SectionTitle eyebrow="Reference" title="Disease Knowledge Base" />
      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search disease or species…" className={`${inputCls} pl-9`} />
      </div>
      <div className="space-y-3">
        {filtered.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <button onClick={() => setOpen(open === d.id ? null : d.id)} className="flex w-full items-center justify-between px-4 py-3 text-left">
              <div><div className="text-sm font-bold text-slate-900">{d.name}</div><div className="text-xs text-slate-400">{Array.isArray(d.species) ? d.species.join(", ") : d.species}</div></div>
              <div className="flex items-center gap-2"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">{d.evidence}</span><ChevronDown size={16} className={`text-slate-400 transition ${open === d.id ? "rotate-180" : ""}`} /></div>
            </button>
            {open === d.id && (
              <div className="grid gap-3 border-t border-slate-100 px-4 py-4 sm:grid-cols-2">
                {FIELDS.map(([label, key]) => (
                  <div key={key}><div className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</div><div className="mt-0.5 text-sm text-slate-700">{Array.isArray(d[key]) ? d[key].join(", ") : d[key]}</div></div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------------- GIS -------------------------------------- */
function GISDashboard() {
  const [layer, setLayer] = useState("risk");
  const [districtFilter, setDistrictFilter] = useState("All");
  const layers = [{ id: "risk", label: "Risk zones" }, { id: "farms", label: "Farms" }, { id: "vacc", label: "Vaccination coverage" }, { id: "containment", label: "Containment zones" }];
  return (
    <div>
      <SectionTitle eyebrow="GIS Dashboard" title="Maharashtra district risk map (schematic)" />
      <div className="mb-4 flex flex-wrap gap-2">
        {layers.map((l) => (<button key={l.id} onClick={() => setLayer(l.id)} className={`rounded-full px-3 py-1.5 text-xs font-semibold ${layer === l.id ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-600"}`}>{l.label}</button>))}
        <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className={`${inputCls} ml-auto w-auto`}>
          <option>All</option>{DISTRICTS.map((d) => <option key={d.id}>{d.name}</option>)}
        </select>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-3 lg:col-span-2">
          <svg viewBox="0 0 640 480" className="h-[420px] w-full rounded-lg bg-slate-50">
            <rect x="60" y="60" width="520" height="400" rx="18" fill="#f1f5f9" stroke="#cbd5e1" />
            {DISTRICTS.filter((d) => districtFilter === "All" || d.name === districtFilter).map((d) => (
              <g key={d.id}>
                <circle cx={d.x} cy={d.y} r={layer === "farms" ? 10 + d.farms / 3 : 22} fill={RISK[layer === "risk" ? d.risk : "GREEN"].hex} opacity={layer === "risk" ? 0.85 : 0.35} stroke="#fff" strokeWidth="2" />
                <circle cx={d.x} cy={d.y} r="4" fill="#0f172a" />
                <text x={d.x} y={d.y + 38} textAnchor="middle" fontSize="12" fontWeight="600" fill="#334155">{d.name}</text>
              </g>
            ))}
          </svg>
          <div className="mt-2 text-xs text-slate-400">Schematic placement for demonstration purposes — not to geographic scale. <DemoTag /></div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">District drill-down</h3>
          <div className="space-y-2">
            {DISTRICTS.filter((d) => districtFilter === "All" || d.name === districtFilter).map((d) => (
              <div key={d.id} className="rounded-lg border border-slate-100 p-2.5">
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-700">{d.name}</span><RiskBadge level={d.risk} /></div>
                <div className="mt-1 text-xs text-slate-400">{d.farms} farms · {d.animals} animals tracked</div>
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">Drill path</div>
          <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-slate-500">State <ChevronRight size={12} /> District <ChevronRight size={12} /> Block <ChevronRight size={12} /> Village <ChevronRight size={12} /> Farm <ChevronRight size={12} /> Animal</div>
        </Card>
      </div>
    </div>
  );
}

/* ------------------------------ CLUSTER VIEW --------------------------------- */
function ClusterView() {
  const clusters = [
    { id: "CLU-08", location: "Nashik → Niphad block → Farm A / Farm B", species: "Cattle", size: 3, window: "72 hrs", status: "Potential cluster", risk: "RED", animals: ["MH-CAT-027", "MH-CAT-031", "MH-CAT-014"] },
    { id: "CLU-09", location: "Nagpur → Kamptee block → Farm E", species: "Buffalo", size: 2, window: "48 hrs", status: "Under monitoring", risk: "ORANGE", animals: ["MH-BUF-009"] },
  ];
  return (
    <div>
      <SectionTitle eyebrow="Outbreak / Cluster View" title="Potential clusters" />
      <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">Clusters are flagged from correlated abnormality signatures across animals in proximity and time. A cluster is labelled <b>potential</b> until laboratory or official confirmation.</div>
      <div className="space-y-4">
        {clusters.map((c) => (
          <Card key={c.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div><div className="flex items-center gap-2 text-sm font-bold text-slate-900">{c.id} <RiskBadge level={c.risk} /></div><div className="text-xs text-slate-500">{c.location}</div></div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{c.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><div className="text-xs text-slate-400">Cluster size</div><div className="font-semibold text-slate-700">{c.size} animals</div></div>
              <div><div className="text-xs text-slate-400">Time window</div><div className="font-semibold text-slate-700">{c.window}</div></div>
              <div><div className="text-xs text-slate-400">Species</div><div className="font-semibold text-slate-700">{c.species}</div></div>
              <div><div className="text-xs text-slate-400">Animals</div><div className="font-semibold text-slate-700">{c.animals.join(", ")}</div></div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-400">Animal <ChevronRight size={12} /> Herd <ChevronRight size={12} /> Farm <ChevronRight size={12} /> Village <ChevronRight size={12} /> Block <ChevronRight size={12} /> District</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

/* --------------------------- VET CASE WORKFLOW -------------------------------- */
function VetCaseWorkflow({ cases, setCases, goto }) {
  const [activeId, setActiveId] = useState(Object.keys(cases)[0]);
  const kase = cases[activeId];
  const animal = ANIMALS.find((a) => a.id === activeId);

  function update(field, value) { setCases((prev) => ({ ...prev, [activeId]: { ...prev[activeId], [field]: value } })); }
  function advance() { setCases((prev) => ({ ...prev, [activeId]: { ...prev[activeId], stageIndex: Math.min(prev[activeId].stageIndex + 1, CASE_STAGES.length - 1) } })); }

  return (
    <div>
      <SectionTitle eyebrow="Veterinary Case Workflow" title={`Case — ${activeId}`}>
        <select value={activeId} onChange={(e) => setActiveId(e.target.value)} className={`${inputCls} w-auto`}>{Object.keys(cases).map((id) => <option key={id}>{id}</option>)}</select>
      </SectionTitle>

      <Card className="mb-4 overflow-x-auto p-4">
        <div className="flex min-w-[720px] items-center">
          {CASE_STAGES.map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex flex-col items-center gap-1">
                <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${i <= kase.stageIndex ? "bg-teal-800 text-white" : "bg-slate-100 text-slate-400"}`}>{i + 1}</div>
                <span className={`w-20 text-center text-[10px] font-medium ${i <= kase.stageIndex ? "text-teal-800" : "text-slate-400"}`}>{s}</span>
              </div>
              {i < CASE_STAGES.length - 1 && <div className={`h-0.5 flex-1 ${i < kase.stageIndex ? "bg-teal-700" : "bg-slate-200"}`} />}
            </React.Fragment>
          ))}
        </div>
        <button onClick={advance} disabled={kase.stageIndex >= CASE_STAGES.length - 1} className="mt-4 rounded-lg bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-40">Advance to next stage →</button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Clinical record</h3>
          <div className="space-y-3">
            <Field label="Clinical observations"><textarea rows={3} value={kase.clinicalObservations} onChange={(e) => update("clinicalObservations", e.target.value)} className={inputCls} placeholder="Vet field examination notes…" /></Field>
            <Field label="Suspected disease"><select value={kase.suspectedDisease} onChange={(e) => update("suspectedDisease", e.target.value)} className={inputCls}>{DISEASE_KB.map((d) => <option key={d.id}>{d.name.split(" (")[0]}</option>)}</select></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sample ID"><input value={kase.sampleId} onChange={(e) => update("sampleId", e.target.value)} placeholder="SMP-XXXX" className={inputCls} /></Field>
              <Field label="Sample type"><select value={kase.sampleType} onChange={(e) => update("sampleType", e.target.value)} className={inputCls}><option value="">Select</option><option>Serum</option><option>Nasal Swab</option><option>Vesicular Fluid</option><option>Skin Biopsy</option></select></Field>
              <Field label="Collection date"><input type="date" value={kase.collectionDate} onChange={(e) => update("collectionDate", e.target.value)} className={inputCls} /></Field>
              <Field label="Laboratory"><input value={kase.laboratory} onChange={(e) => update("laboratory", e.target.value)} placeholder="Regional lab" className={inputCls} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} value={kase.notes} onChange={(e) => update("notes", e.target.value)} className={inputCls} /></Field>
          </div>
        </Card>
        <Card className="p-4">
          <h3 className="mb-3 text-sm font-bold text-slate-900">Reference — {animal?.id}</h3>
          {animal && <WhyThisAlertPanelCompact animal={animal} />}
          <div className="mt-4">
            <Field label="Action"><select value={kase.action} onChange={(e) => update("action", e.target.value)} className={inputCls}><option value="">Select</option><option>Isolate animal</option><option>Monitor exposed animals</option><option>Vaccination review</option><option>Movement restriction</option><option>No action required</option></select></Field>
            <div className="mt-3"><Field label="Follow-up date"><input type="date" value={kase.followUpDate} onChange={(e) => update("followUpDate", e.target.value)} className={inputCls} /></Field></div>
          </div>
          <button onClick={() => goto("lab")} className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline"><FlaskConical size={13} />Go to Laboratory Module</button>
        </Card>
      </div>
    </div>
  );
}
function WhyThisAlertPanelCompact({ animal }) {
  const ev = evaluateAnimal(animal);
  return (
    <div>
      <RiskBadge level={ev.riskLevel} />
      <ul className="mt-2 space-y-1.5 text-xs text-slate-600">{ev.reasons.map((r, i) => <li key={i} className="flex items-center gap-1.5"><CheckCircle2 size={12} className="text-emerald-600" />{r.text}</li>)}</ul>
    </div>
  );
}

/* -------------------------------- LAB MODULE ---------------------------------- */
function LaboratoryModule() {
  const statusStyle = { Pending: "bg-slate-100 text-slate-600", Received: "bg-blue-50 text-blue-700", Testing: "bg-amber-50 text-amber-700", Positive: "bg-red-50 text-red-700", Negative: "bg-emerald-50 text-emerald-700", Inconclusive: "bg-orange-50 text-orange-700" };
  const [rows, setRows] = useState(LAB_SAMPLES);
  return (
    <div>
      <SectionTitle eyebrow="Laboratory" title="Sample & result tracking" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
            <tr><th className="px-4 py-2">Case ID</th><th className="px-4 py-2">Animal ID</th><th className="px-4 py-2">Sample ID</th><th className="px-4 py-2">Sample Type</th><th className="px-4 py-2">Date Collected</th><th className="px-4 py-2">Laboratory</th><th className="px-4 py-2">Test</th><th className="px-4 py-2">Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-2.5 font-semibold text-slate-700">{r.caseId}</td><td className="px-4 py-2.5">{r.animalId}</td><td className="px-4 py-2.5">{r.sampleId}</td><td className="px-4 py-2.5">{r.sampleType}</td><td className="px-4 py-2.5">{r.dateCollected}</td><td className="px-4 py-2.5 text-slate-500">{r.laboratory}</td><td className="px-4 py-2.5">{r.test}</td>
                <td className="px-4 py-2.5"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyle[r.status]}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="mt-3 text-xs text-slate-400">Diagnostic status is recorded independently of rule-engine risk level. Confirmation always rests with the accredited laboratory.</div>
    </div>
  );
}

/* ---------------------------- VACCINATION / PREVENTION ------------------------ */
function VaccinationPage({ role }) {
  const rows = ANIMALS.flatMap((a) => a.vaccinations.map((v) => ({ ...v, animal: a.id, species: a.species })));
  return (
    <div>
      <SectionTitle eyebrow="Vaccination" title={role === "official" ? "Vaccination coverage" : "Vaccination records"} />
      {role === "official" && (
        <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <StatCard label="State coverage" value="78%" icon={Syringe} tone="emerald" />
          <StatCard label="FMD rounds completed" value={2} icon={CheckCircle2} tone="teal" />
          <StatCard label="LSD coverage" value="64%" icon={Syringe} tone="amber" />
          <StatCard label="PPR coverage" value="71%" icon={Syringe} tone="amber" />
        </div>
      )}
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-2">Animal</th><th className="px-4 py-2">Species</th><th className="px-4 py-2">Vaccine</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Status</th></tr></thead>
          <tbody>{rows.map((r, i) => (<tr key={i} className="border-t border-slate-100"><td className="px-4 py-2.5 font-semibold text-teal-800">{r.animal}</td><td className="px-4 py-2.5">{r.species}</td><td className="px-4 py-2.5">{r.name}</td><td className="px-4 py-2.5">{r.date}</td><td className="px-4 py-2.5"><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{r.status}</span></td></tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

function PreventionControl() {
  const steps = [
    { icon: ShieldAlert, title: "Isolate suspected animal", desc: "Separate the flagged animal from the herd to limit potential contact spread." },
    { icon: Stethoscope, title: "Veterinary inspection", desc: "Field or clinical examination by a registered veterinarian." },
    { icon: Eye, title: "Monitor exposed animals", desc: "Track animals identified via the exposure graph for emerging signs." },
    { icon: Syringe, title: "Vaccination review", desc: "Check vaccination status of herd and neighbouring farms." },
    { icon: MapPin, title: "Movement-control workflow", desc: "Restrict animal movement in/out of the affected farm as advised by authorities." },
    { icon: FlaskConical, title: "Sample referral", desc: "Send samples to an accredited laboratory for confirmation." },
    { icon: ClipboardCheck, title: "Follow-up", desc: "Scheduled re-check and case closure once resolved." },
  ];
  return (
    <div>
      <SectionTitle eyebrow="Prevention & Control" title="Containment workflow" />
      <div className="mb-4 rounded-lg border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">Actions below support veterinary and official decision-making for verified/confirmed cases. The system does not generate autonomous treatment prescriptions.</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {steps.map((s) => (
          <Card key={s.title} className="flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-teal-50 text-teal-700"><s.icon size={17} /></div>
            <div><div className="text-sm font-bold text-slate-800">{s.title}</div><div className="text-xs text-slate-500">{s.desc}</div></div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function FarmsPage() {
  return (
    <div>
      <SectionTitle eyebrow="Admin" title="Farms" />
      <Card className="overflow-x-auto p-0">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-400"><tr><th className="px-4 py-2">Farm ID</th><th className="px-4 py-2">Name</th><th className="px-4 py-2">Owner</th><th className="px-4 py-2">District</th><th className="px-4 py-2">Village</th><th className="px-4 py-2">Animals</th></tr></thead>
          <tbody>{FARMS.map((f) => (<tr key={f.id} className="border-t border-slate-100"><td className="px-4 py-2.5 font-semibold text-teal-800">{f.id}</td><td className="px-4 py-2.5">{f.name}</td><td className="px-4 py-2.5">{f.owner}</td><td className="px-4 py-2.5 capitalize">{DISTRICTS.find((d) => d.id === f.district)?.name}</td><td className="px-4 py-2.5">{f.village}</td><td className="px-4 py-2.5">{f.animals}</td></tr>))}</tbody>
        </table>
      </Card>
    </div>
  );
}

/* -------------------------------- ALERTS CENTER -------------------------------- */
function AlertsCenter({ alerts, setAlerts, goto }) {
  function ack(id) { setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, status: "ACKNOWLEDGED" } : a))); }
  return (
    <div>
      <SectionTitle eyebrow="Alert System" title="Alert center" />
      <div className="space-y-3">
        {alerts.map((al) => {
          const animal = ANIMALS.find((a) => a.id === al.animalId);
          const ev = evaluateAnimal(animal);
          return (
            <Card key={al.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2"><span className="text-sm font-bold text-slate-900">{al.id}</span><RiskBadge level={al.severity} /><span className="text-xs text-slate-400">{al.createdAt}</span></div>
                  <div className="mt-1 text-sm text-slate-600"><b>What happened?</b> Behavioural deviation detected for <b>{al.animalId}</b> at {animal.farmName} ({DISTRICTS.find((d) => d.id === animal.district)?.name}).</div>
                </div>
                <div className="flex gap-2">
                  {al.status === "OPEN" && <button onClick={() => ack(al.id)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">Acknowledge</button>}
                  <button onClick={() => goto("animal-profile", al.animalId)} className="rounded-lg bg-teal-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700">Review</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                <div><b className="text-slate-600">Why:</b> {ev.reasons.slice(0, 2).map((r) => r.text).join("; ") || "Baseline deviation"}</div>
                <div><b className="text-slate-600">Evidence:</b> Individual-baseline comparison + rule-engine scoring</div>
                <div><b className="text-slate-600">Recommended action:</b> {al.severity === "CRITICAL" || al.severity === "RED" ? "Immediate veterinary review" : "Continue monitoring / field verification"}</div>
                <div><b className="text-slate-600">Who should respond:</b> {al.severity === "CRITICAL" || al.severity === "RED" ? "Veterinarian" : "Field worker / Farmer"}</div>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-400">Status: {al.status}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function NotificationsPreview() {
  const msg = "High-risk health abnormality detected in Animal MH-CAT-027 at Farm A. Veterinary review recommended.";
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Web notification</div>
        <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><Bell size={16} className="mt-0.5 text-red-600" /><div className="text-sm text-slate-700">{msg}</div></div>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">SMS preview</div>
        <div className="rounded-lg bg-slate-900 p-3 font-mono text-xs text-emerald-300">PASHU-RAKSHA: {msg}</div>
      </div>
      <div>
        <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">Mobile alert preview</div>
        <div className="mx-auto w-64 rounded-2xl border border-slate-200 bg-white p-3 shadow">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><ShieldAlert size={13} className="text-red-600" />PASHU-RAKSHA</div>
          <div className="mt-1 text-xs text-slate-700">{msg}</div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------------- SYNC CENTER ---------------------------------- */
function SyncCenter({ connectivity, pendingSync, syncedCount, onSync }) {
  return (
    <div>
      <SectionTitle eyebrow="Offline-First" title="Sync center" />
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Pending reports" value={pendingSync} icon={RefreshCw} tone="amber" sub="Queued locally, awaiting connectivity" />
        <StatCard label="Synced reports" value={syncedCount} icon={CheckCircle2} tone="emerald" sub="Successfully synced to server" />
      </div>
      <Card className="mt-4 p-4">
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-semibold text-slate-800">Connection status</div><div className="text-xs text-slate-400">Toggle from the top bar to simulate field connectivity loss.</div></div>
          <ConnectivityBadge connectivity={connectivity} onToggle={() => {}} onSync={onSync} pendingSync={pendingSync} />
        </div>
        {pendingSync > 0 && <button onClick={onSync} className="mt-3 flex items-center gap-1.5 rounded-lg bg-teal-800 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700"><RefreshCw size={13} />Sync now</button>}
      </Card>
    </div>
  );
}

function SettingsPage({ role }) {
  return (
    <div>
      <SectionTitle eyebrow="Admin" title="Settings" />
      <Card className="p-4 text-sm text-slate-600">
        <div className="space-y-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span>Role</span><span className="font-semibold text-slate-800">{ROLE_LABEL[role]}</span></div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span>Authentication</span><span className="font-semibold text-slate-800">JWT + Role-Based Access Control</span></div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2"><span>Rule engine version</span><span className="font-semibold text-slate-800">v1.0 (explainable, non-ML)</span></div>
          <div className="flex items-center justify-between"><span>ML-readiness</span><span className="font-semibold text-slate-800">Architecture supports future model integration</span></div>
        </div>
      </Card>
    </div>
  );
}

/* ------------------------------- IOT / CAMERA SIM -------------------------------- */
function IoTSimulator({ animal, onChange, current }) {
  const presets = [
    { id: "normal", label: "Normal", vals: { activity: animal.baseline.activity - 2, feeding: animal.baseline.feeding - 2, movement: animal.baseline.movement - 2, tempTrend: "stable" } },
    { id: "activity", label: "Activity Drop", vals: { ...current, activity: Math.round(animal.baseline.activity * 0.5) } },
    { id: "temp", label: "Temperature Rise", vals: { ...current, tempTrend: "elevated" } },
    { id: "feeding", label: "Feeding Drop", vals: { ...current, feeding: Math.round(animal.baseline.feeding * 0.55) } },
    { id: "multi", label: "Multiple Abnormalities", vals: { activity: Math.round(animal.baseline.activity * 0.55), feeding: Math.round(animal.baseline.feeding * 0.6), movement: Math.round(animal.baseline.movement * 0.6), tempTrend: "elevated" } },
  ];
  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Cpu size={16} className="text-teal-700" />IoT sensor simulator — {animal.id}</h3>
      <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
        <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Activity</div><div className="font-bold text-slate-800">{current.activity}</div></div>
        <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Feeding</div><div className="font-bold text-slate-800">{current.feeding}</div></div>
        <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Rumination</div><div className="font-bold text-slate-800">{current.rumination}</div></div>
        <div className="rounded-lg bg-slate-50 p-2"><div className="text-xs text-slate-400">Temp trend</div><div className="font-bold capitalize text-slate-800">{current.tempTrend}</div></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {presets.map((p) => (<button key={p.id} onClick={() => onChange({ ...current, ...p.vals })} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50">{p.label}</button>))}
      </div>
    </Card>
  );
}
function CameraSimulator({ onToggle, active }) {
  const toggles = ["Normal Movement", "Reduced Movement", "Isolation", "Lameness", "Visible Lesion"];
  return (
    <Card className="p-4">
      <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900"><Camera size={16} className="text-teal-700" />Camera observation simulator</h3>
      <div className="mb-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
        {["Animal detected", "Movement", "Gait", "Isolation", "Posture"].map((s) => <div key={s} className="rounded-lg bg-slate-50 px-2 py-1.5 text-center text-slate-500">{s}</div>)}
      </div>
      <div className="flex flex-wrap gap-2">
        {toggles.map((t) => (<button key={t} onClick={() => onToggle(t)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${active === t ? "border-teal-700 bg-teal-50 text-teal-800" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}>{t}</button>))}
      </div>
      <div className="mt-3 text-xs text-slate-400">Converts to an observation event — camera signals inform the rule engine and do not diagnose disease directly.</div>
    </Card>
  );
}

/* ------------------------------- DEMO RUNNER -------------------------------------- */
function DemoRunner({ onClose, goto, setRole, role }) {
  const [step, setStep] = useState(0);
  const demoAnimal = ANIMALS[0];
  const [current, setCurrent] = useState({ ...demoAnimal.baseline });
  const [camera, setCamera] = useState("Normal Movement");

  const steps = [
    { title: "1. Baseline established", body: "MH-CAT-027 (Gir cattle, Farm A, Nashik) has been normal for the past 30 days. Individual baseline recorded from IoT + camera history.", action: () => setCurrent({ ...demoAnimal.baseline }) },
    { title: "2. Activity drops", body: "IoT sensor reports a sharp drop in activity readings.", action: () => setCurrent((c) => ({ ...c, activity: Math.round(demoAnimal.baseline.activity * 0.56) })) },
    { title: "3. Feeding drops", body: "Feeding sensor confirms reduced intake, reinforcing the activity signal.", action: () => setCurrent((c) => ({ ...c, feeding: Math.round(demoAnimal.baseline.feeding * 0.62) })) },
    { title: "4. Temperature trend rises", body: "Temperature trend shifts from stable to elevated across recent readings.", action: () => setCurrent((c) => ({ ...c, tempTrend: "elevated", social: "isolating", movement: Math.round(demoAnimal.baseline.movement * 0.6) })) },
    { title: "5. Rule engine detects abnormality", body: "Combined deviation crosses threshold — health_abnormality = HIGH.", action: () => {} },
    { title: "6. Rule engine explains why", body: "Every triggered condition is shown with plain-language reasoning — no black-box scoring.", action: () => {} },
    { title: "7. Disease risks update", body: "Species-relevant diseases (FMD, LSD) are re-ranked using the new behavioural evidence.", action: () => {} },
    { title: "8. Nearby animals identified", body: "Exposure graph surfaces MH-CAT-031 (4.2m, 6 contacts, 18 min) as a high-compatibility contact.", action: () => {} },
    { title: "9. Exposure risk increases", body: "Potential exposure risk for MH-CAT-031 is elevated to HIGH — veterinary inspection recommended.", action: () => {} },
    { title: "10. Veterinary alert appears", body: "A CRITICAL alert is raised for Dr. A. Kulkarni with full reasoning attached.", action: () => {} },
    { title: "11. Sample collection", body: "Veterinarian opens the case, records clinical observations, and logs a sample for lab submission.", action: () => {} },
    { title: "12. Lab result recorded", body: "Laboratory logs the test result against the case — independent of the rule-engine risk score.", action: () => {} },
    { title: "13. Case confirmed / rejected", body: "Case status updates based on the lab result, closing the loop between field signal and diagnosis.", action: () => {} },
    { title: "14. Containment & follow-up", body: "Isolation, exposure monitoring and a follow-up date are logged to close the workflow.", action: () => {} },
  ];

  function next() {
    const n = Math.min(step + 1, steps.length - 1);
    steps[n].action();
    setStep(n);
  }
  function prev() { setStep((s) => Math.max(0, s - 1)); }

  const liveAnimal = { ...demoAnimal, current };
  const ev = evaluateAnimal(liveAnimal);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/70 p-3 md:p-6">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 bg-teal-950 px-5 py-3 text-white">
          <div className="flex items-center gap-2 text-sm font-bold"><Play size={15} className="text-amber-400" />Early-Warning Demo — Step {step + 1} of {steps.length}</div>
          <button onClick={onClose} className="rounded-md p-1 hover:bg-teal-900"><X size={18} /></button>
        </div>
        <div className="grid flex-1 gap-4 overflow-y-auto p-5 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="text-xs font-bold uppercase tracking-wide text-amber-700">{steps[step].title}</div>
              <p className="mt-2 text-sm text-amber-900">{steps[step].body}</p>
            </div>
            <div className="mt-4"><IoTSimulator animal={demoAnimal} current={current} onChange={setCurrent} /></div>
            <div className="mt-4"><CameraSimulator active={camera} onToggle={setCamera} /></div>
          </div>
          <div className="space-y-4 lg:col-span-3">
            <Card className="p-4">
              <div className="mb-2 flex items-center justify-between"><h3 className="text-sm font-bold text-slate-900">{demoAnimal.id} — live risk</h3><RiskBadge level={ev.riskLevel} /></div>
              <FingerprintChart animal={liveAnimal} compact />
            </Card>
            {step >= 4 && <Card className="p-4"><WhyThisAlertPanelCompact animal={liveAnimal} /></Card>}
            {step >= 6 && (
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-900">Possible health risks</h3>
                <div className="space-y-2">{ev.diseaseRisks.slice(0, 2).map((d) => (<div key={d.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{d.name}</span><RiskBadge level={d.risk === "HIGH" ? "RED" : "ORANGE"} /></div>))}</div>
              </Card>
            )}
            {step >= 7 && (
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-900">Exposure — nearby animals</h3>
                {EXPOSURE["MH-CAT-027"].slice(0, 1).map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"><span>{c.id} · {c.distance}m · {c.contacts} contacts</span><RiskBadge level={step >= 8 ? "RED" : "ORANGE"} /></div>
                ))}
              </Card>
            )}
            {step >= 9 && (
              <Card className="border-red-200 p-4"><div className="flex items-center gap-2 text-sm font-bold text-red-700"><ShieldAlert size={16} />Veterinary alert dispatched to Dr. A. Kulkarni</div></Card>
            )}
            {step >= 10 && (
              <Card className="p-4">
                <h3 className="mb-2 text-sm font-bold text-slate-900">Case workflow</h3>
                <div className="flex flex-wrap gap-1">{CASE_STAGES.slice(0, Math.min(CASE_STAGES.length, step - 4)).map((s, i) => (<span key={s} className="rounded-full bg-teal-50 px-2 py-1 text-[10px] font-semibold text-teal-800">{i + 1}. {s}</span>))}</div>
              </Card>
            )}
            {step >= 12 && (
              <Card className="border-emerald-200 bg-emerald-50 p-4"><div className="text-sm font-semibold text-emerald-800">Lab result: Positive (FMD) — case CONFIRMED. Containment workflow initiated.</div></Card>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3">
          <button onClick={prev} disabled={step === 0} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-500 disabled:opacity-30"><ChevronLeft size={14} />Back</button>
          <div className="text-xs text-slate-400">This walkthrough uses simulated demo data to illustrate the end-to-end workflow.</div>
          {step < steps.length - 1 ? (
            <button onClick={next} className="flex items-center gap-1 rounded-lg bg-teal-800 px-4 py-2 text-xs font-bold text-white hover:bg-teal-700">Next<ChevronRight size={14} /></button>
          ) : (
            <button onClick={() => { onClose(); if (role !== "vet") setRole("vet"); goto("cases"); }} className="flex items-center gap-1 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-teal-950 hover:bg-amber-400">Open case in Vet Dashboard<ChevronRight size={14} /></button>
          )}
        </div>
      </div>
    </div>
  );
}
