import os

components = {
    'layout/Sidebar.jsx': 'export default function Sidebar() { return <div className="w-64 bg-slate-900 text-white min-h-screen">Sidebar</div>; }',
    'layout/Topbar.jsx': 'export default function Topbar() { return <div className="h-16 bg-white border-b flex items-center px-6">Topbar</div>; }',
    'layout/MobileNav.jsx': 'export default function MobileNav() { return <div className="md:hidden fixed bottom-0 w-full bg-white border-t">MobileNav</div>; }',
    'layout/PageContainer.jsx': 'export default function PageContainer({children}) { return <div className="p-6 flex-1 bg-slate-50">{children}</div>; }',
    'common/Card.jsx': 'export default function Card({children, className=""}) { return <div className={`rounded-xl border bg-white shadow-sm ${className}`}>{children}</div>; }',
    'common/StatCard.jsx': 'export default function StatCard({label, value}) { return <div className="p-4 bg-white border rounded-xl"><div>{label}</div><div className="text-2xl font-bold">{value}</div></div>; }',
    'common/RiskBadge.jsx': 'export default function RiskBadge({level}) { return <span className="px-2 py-1 text-xs rounded-full bg-slate-100">{level}</span>; }',
    'common/Modal.jsx': 'export default function Modal({children, open}) { return open ? <div className="fixed inset-0 bg-black/50">{children}</div> : null; }',
    'common/DemoTag.jsx': 'export default function DemoTag() { return <span className="text-[10px] bg-slate-100 px-1">DEMO DATA</span>; }',
    'common/EmptyState.jsx': 'export default function EmptyState() { return <div>No data available.</div>; }',
    'animal/AnimalTable.jsx': 'export default function AnimalTable() { return <div>AnimalTable</div>; }',
    'animal/AnimalProfile.jsx': 'export default function AnimalProfile() { return <div>AnimalProfile</div>; }',
    'animal/HealthFingerprint.jsx': 'export default function HealthFingerprint() { return <div>HealthFingerprint</div>; }',
    'animal/ObservationTimeline.jsx': 'export default function ObservationTimeline() { return <div>ObservationTimeline</div>; }',
    'dashboard/FarmerDashboard.jsx': 'export default function FarmerDashboard() { return <div>FarmerDashboard</div>; }',
    'dashboard/VetDashboard.jsx': 'export default function VetDashboard() { return <div>VetDashboard</div>; }',
    'dashboard/OfficialDashboard.jsx': 'export default function OfficialDashboard() { return <div>OfficialDashboard</div>; }',
    'dashboard/AdminDashboard.jsx': 'export default function AdminDashboard() { return <div>AdminDashboard</div>; }',
    'disease/DiseaseKnowledge.jsx': 'export default function DiseaseKnowledge() { return <div>DiseaseKnowledge</div>; }',
    'disease/DiseaseDetail.jsx': 'export default function DiseaseDetail() { return <div>DiseaseDetail</div>; }',
    'risk/RiskMonitor.jsx': 'export default function RiskMonitor() { return <div>RiskMonitor</div>; }',
    'risk/RiskExplanation.jsx': 'export default function RiskExplanation() { return <div>RiskExplanation</div>; }',
    'risk/AlertQueue.jsx': 'export default function AlertQueue() { return <div>AlertQueue</div>; }',
    'exposure/ExposureIntelligence.jsx': 'export default function ExposureIntelligence() { return <div>ExposureIntelligence</div>; }',
    'exposure/ExposureGraph.jsx': 'export default function ExposureGraph() { return <div>ExposureGraph</div>; }',
    'gis/GISDashboard.jsx': 'import MaharashtraMap from "./MaharashtraMap";\nexport default function GISDashboard() { return <div className="h-[calc(100vh-100px)] w-full"><MaharashtraMap /></div>; }',
    'gis/MaharashtraMap.jsx': 'export default function MaharashtraMap() { return <div>Maharashtra Map</div>; }',
    'veterinary/VetCaseWorkflow.jsx': 'export default function VetCaseWorkflow() { return <div>VetCaseWorkflow</div>; }',
    'veterinary/CaseTimeline.jsx': 'export default function CaseTimeline() { return <div>CaseTimeline</div>; }',
    'veterinary/ClinicalReview.jsx': 'export default function ClinicalReview() { return <div>ClinicalReview</div>; }',
    'laboratory/LaboratoryModule.jsx': 'export default function LaboratoryModule() { return <div>LaboratoryModule</div>; }',
    'vaccination/VaccinationPage.jsx': 'export default function VaccinationPage() { return <div>VaccinationPage</div>; }',
    'offline/SyncCenter.jsx': 'export default function SyncCenter() { return <div>SyncCenter</div>; }',
    'demo/DemoRunner.jsx': 'export default function DemoRunner() { return <div>DemoRunner</div>; }'
}

for path, code in components.items():
    full_path = os.path.join('src/components', path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, 'w', encoding='utf-8') as f:
        f.write('import React from "react";\n' + code)

print('Done')
