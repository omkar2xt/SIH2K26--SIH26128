/**
 * VetCaseWorkflow — Backend-Authoritative (Step 2H)
 *
 * All case data is fetched from the authenticated backend.
 * NO fallback to localStorage, liveData, or demoDB.
 * If backend is unavailable, an error is shown (not fake data).
 *
 * Backend status → UI label mapping:
 *   SUSPECTED    → "Potential Risk"
 *   INVESTIGATING → "Under Review"
 *   LAB_PENDING  → "Sample Required"
 *   CONFIRMED    → "Confirmed"
 *   REJECTED     → "Not Confirmed"
 *   RESOLVED     → "Closed"
 *
 * Medical authority: vetAssessment is a veterinary assessment, NOT a diagnosis.
 * clinicalNotes are system risk context, NOT a confirmed disease.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  CheckCircle2, XCircle, ClipboardList, Info, AlertTriangle,
  RefreshCw, Loader2, FlaskConical, Stethoscope, ChevronRight
} from 'lucide-react';
import { Card, SectionTitle, RiskBadge } from '../common/UIComponents';
import { api } from '../../services/api/api.js';

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100';

// Backend statuses in display order
const BACKEND_STATUSES = ['SUSPECTED', 'INVESTIGATING', 'LAB_PENDING', 'CONFIRMED', 'REJECTED', 'RESOLVED'];

const STATUS_LABELS = {
  SUSPECTED:     'Potential Risk',
  INVESTIGATING: 'Under Review',
  LAB_PENDING:   'Sample Required',
  CONFIRMED:     'Confirmed',
  REJECTED:      'Not Confirmed',
  RESOLVED:      'Closed',
};

const STATUS_COLORS = {
  SUSPECTED:     'bg-red-100 text-red-800 border-red-200',
  INVESTIGATING: 'bg-amber-100 text-amber-800 border-amber-200',
  LAB_PENDING:   'bg-blue-100 text-blue-800 border-blue-200',
  CONFIRMED:     'bg-rose-100 text-rose-800 border-rose-200',
  REJECTED:      'bg-slate-100 text-slate-600 border-slate-200',
  RESOLVED:      'bg-emerald-100 text-emerald-700 border-emerald-200',
};

// Valid next transitions from each status (mirrors server-side state machine)
const NEXT_TRANSITIONS = {
  SUSPECTED:     ['INVESTIGATING'],
  INVESTIGATING: ['LAB_PENDING', 'CONFIRMED', 'REJECTED'],
  LAB_PENDING:   ['CONFIRMED', 'REJECTED'],
  CONFIRMED:     ['RESOLVED'],
  REJECTED:      ['RESOLVED'],
  RESOLVED:      [],
};

export default function VetCaseWorkflow() {
  const [cases,        setCases]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [selected,     setSelected]     = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [actionMsg,    setActionMsg]    = useState('');
  const [actionErr,    setActionErr]    = useState('');
  const [submitting,   setSubmitting]   = useState(false);

  // Assessment form state
  const [assessmentText,      setAssessmentText]      = useState('');
  // Status update form state
  const [statusNote,          setStatusNote]          = useState('');
  const [selectedNextStatus,  setSelectedNextStatus]  = useState('');

  // ── Fetch cases from backend ────────────────────────────────────────────────
  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.cases.getAll();
      if (!res.success) {
        // Backend rejected (auth, permission, etc.)
        setError(res.error || 'Failed to load cases');
        setCases([]);
      } else {
        setCases(Array.isArray(res.data) ? res.data : []);
      }
    } catch {
      // Hard network failure — do NOT fall back to localStorage
      setError('Backend unavailable. Case data cannot be displayed offline. Please check your connection and try again.');
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCases(); }, [fetchCases]);

  // ── Derived state ───────────────────────────────────────────────────────────
  const filtered = useMemo(() =>
    filterStatus ? cases.filter(c => c.status === filterStatus) : cases,
  [cases, filterStatus]);

  const selCase = useMemo(() =>
    selected ? cases.find(c => c.id === selected) || null : null,
  [cases, selected]);

  // ── Flash helpers ───────────────────────────────────────────────────────────
  function flash(msg)    { setActionMsg(msg);  setTimeout(() => setActionMsg(''),  3000); }
  function flashErr(msg) { setActionErr(msg);  setTimeout(() => setActionErr(''),  5000); }

  // ── Actions ─────────────────────────────────────────────────────────────────

  async function handleStatusUpdate() {
    if (!selCase || !selectedNextStatus) return;
    setSubmitting(true);
    const res = await api.cases.updateStatus(selCase.id, selectedNextStatus, statusNote || undefined);
    setSubmitting(false);
    if (res.success) {
      flash(`Status updated → ${STATUS_LABELS[selectedNextStatus]}`);
      setStatusNote('');
      setSelectedNextStatus('');
      await fetchCases();
    } else {
      flashErr(res.error || 'Failed to update status');
    }
  }

  async function handleAssessment() {
    if (!selCase || !assessmentText.trim()) return;
    setSubmitting(true);
    const res = await api.cases.addAssessment(selCase.id, assessmentText.trim());
    setSubmitting(false);
    if (res.success) {
      flash('Veterinary assessment recorded');
      setAssessmentText('');
      await fetchCases();
    } else {
      flashErr(res.error || 'Failed to record assessment');
    }
  }

  // ── Render helpers ──────────────────────────────────────────────────────────

  function CaseListItem({ c }) {
    const isSel = selected === c.id;
    const label = STATUS_LABELS[c.status] || c.status;
    const colorCls = STATUS_COLORS[c.status] || 'bg-slate-100 text-slate-600';
    return (
      <button
        onClick={() => setSelected(c.id)}
        className={`w-full text-left rounded-xl border p-3 transition-all ${
          isSel ? 'ring-2 ring-teal-500 border-teal-300 bg-teal-50' : 'bg-white border-slate-200 hover:border-teal-200 hover:bg-slate-50'
        }`}
      >
        <div className="flex justify-between items-start gap-1 mb-1">
          <div className="text-xs font-bold text-teal-800 truncate">{c.caseNumber}</div>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${colorCls}`}>{label}</span>
        </div>
        <div className="text-sm font-semibold text-slate-800 truncate">
          {c.animal?.tagId || c.animalId}
        </div>
        <div className="text-xs text-slate-500 truncate">
          {c.suspectedDisease?.shortName || c.suspectedDisease?.name || '—'} · {c.farm?.district?.name || c.farm?.name || '—'}
        </div>
        <div className="text-[10px] text-slate-400 mt-1">
          {new Date(c.createdAt).toLocaleDateString('en-IN')}
        </div>
      </button>
    );
  }

  function StatusPipeline({ status }) {
    const idx = BACKEND_STATUSES.indexOf(status);
    return (
      <div className="mt-4 overflow-x-auto">
        <div className="flex items-center gap-0 min-w-max">
          {BACKEND_STATUSES.map((s, i) => {
            const done    = i < idx;
            const current = i === idx;
            return (
              <React.Fragment key={s}>
                <div className={`flex flex-col items-center ${current ? 'opacity-100' : done ? 'opacity-70' : 'opacity-25'}`}>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    current ? 'bg-teal-600 text-white' : done ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {done ? '✓' : i + 1}
                  </div>
                  <div className="text-[9px] text-center mt-0.5 w-16 leading-tight text-slate-600">{STATUS_LABELS[s]}</div>
                </div>
                {i < BACKEND_STATUSES.length - 1 && (
                  <div className={`h-0.5 w-4 shrink-0 mt-[-12px] ${done ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 text-slate-500">
        <Loader2 size={24} className="animate-spin mr-2" />
        <span className="text-sm font-medium">Loading cases from backend…</span>
      </div>
    );
  }

  // ── Backend unavailable — hard error, no fake data ──────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <AlertTriangle size={40} className="text-orange-400 mb-3" />
        <h3 className="font-bold text-slate-800 mb-1">Case Data Unavailable</h3>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <button
          onClick={fetchCases}
          className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Main UI ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex gap-4 h-full min-h-[600px]">
      {/* Case list panel */}
      <div className="w-72 shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-800 text-sm">
            Cases ({filtered.length})
          </h2>
          <div className="flex items-center gap-1">
            <select
              className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {BACKEND_STATUSES.map(s => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
            <button onClick={fetchCases} title="Refresh" className="p-1 rounded hover:bg-slate-100">
              <RefreshCw size={13} className="text-slate-500" />
            </button>
          </div>
        </div>

        {filtered.map(c => <CaseListItem key={c.id} c={c} />)}

        {filtered.length === 0 && (
          <div className="py-8 text-center text-slate-400">
            <ClipboardList size={28} className="mx-auto mb-2" />
            <p className="text-sm">No cases found</p>
            <p className="text-xs mt-1 text-slate-300">Cases are created by authorized veterinarians and officials</p>
          </div>
        )}
      </div>

      {/* Case detail panel */}
      <div className="flex-1 min-w-0">
        {!selCase ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <ClipboardList size={48} className="mb-3 text-slate-300" />
            <p className="font-semibold">Select a case to view details</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Flash messages */}
            {actionMsg && (
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-800">
                ✓ {actionMsg}
              </div>
            )}
            {actionErr && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-800">
                ✗ {actionErr}
              </div>
            )}

            {/* Header card */}
            <Card className="p-4">
              <div className="flex flex-wrap justify-between gap-3 items-start">
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-0.5">{selCase.caseNumber}</div>
                  <h3 className="text-lg font-black text-slate-900">
                    {selCase.animal?.tagId || selCase.animalId}
                  </h3>
                  <div className="text-sm text-slate-500">
                    {selCase.animal?.species?.name || '—'} · {selCase.farm?.name || '—'} · {selCase.farm?.district?.name || '—'}
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLORS[selCase.status] || ''}`}>
                    {STATUS_LABELS[selCase.status] || selCase.status}
                  </span>
                  <div className="text-xs text-slate-400 mt-1">
                    Opened: {new Date(selCase.createdAt).toLocaleString('en-IN')}
                  </div>
                  <div className="text-xs text-slate-400">
                    Assigned Vet: {selCase.assignedVet?.fullName || '—'}
                  </div>
                  {selCase.createdBy && (
                    <div className="text-xs text-slate-400">
                      Created by: {selCase.createdBy.fullName}
                    </div>
                  )}
                </div>
              </div>

              {/* Status pipeline */}
              <StatusPipeline status={selCase.status} />
            </Card>

            {/* Medical authority notice */}
            <Card className="p-3 bg-amber-50 border-amber-200">
              <div className="flex items-start gap-2">
                <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  <strong>Medical Authority Notice:</strong> System risk assessments indicate
                  <em> potential disease risk</em> based on behavioural and physiological data.
                  This is <strong>not a clinical or laboratory-confirmed diagnosis</strong>.
                  Veterinary examination and, where indicated, laboratory confirmation are required.
                </div>
              </div>
            </Card>

            {/* Suspected disease (risk context) */}
            {selCase.suspectedDisease && (
              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="flex items-start gap-2">
                  <Info size={16} className="text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-orange-900 text-sm">
                      Potential Risk Assessment: {selCase.suspectedDisease.name}
                    </div>
                    <div className="text-xs text-orange-700 mt-0.5">
                      This is a system risk assessment based on observed signals — not a confirmed diagnosis.
                      Veterinary examination required.
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* System clinical notes (Brain output) */}
            {selCase.clinicalNotes && (
              <Card className="p-4 bg-slate-50 border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-1">
                  System Risk Context (not a diagnosis)
                </h4>
                <p className="text-sm text-slate-700">{selCase.clinicalNotes}</p>
              </Card>
            )}

            {/* Veterinary assessment (distinct from Brain output) */}
            {selCase.vetAssessment && (
              <Card className="p-4 bg-teal-50 border-teal-200">
                <h4 className="text-xs font-semibold text-teal-700 uppercase mb-1 flex items-center gap-1">
                  <Stethoscope size={12} /> Veterinary Assessment
                </h4>
                <p className="text-sm text-teal-900">{selCase.vetAssessment}</p>
                {selCase.vetAssessmentAt && (
                  <p className="text-xs text-teal-600 mt-1">
                    Recorded: {new Date(selCase.vetAssessmentAt).toLocaleString('en-IN')}
                  </p>
                )}
              </Card>
            )}

            {/* Record veterinary assessment panel (for assigned vets) */}
            {selCase.status !== 'RESOLVED' && selCase.status !== 'REJECTED' && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-1 flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-teal-600" />
                  Record Veterinary Assessment
                </h4>
                <p className="text-xs text-slate-500 mb-2">
                  Record your clinical findings. This is a <strong>veterinary assessment</strong>, not a confirmed diagnosis.
                </p>
                <textarea
                  className={inputCls}
                  rows={3}
                  placeholder="Describe clinical findings: temperature, physical signs, behavioural observations, differential considerations…"
                  value={assessmentText}
                  onChange={e => setAssessmentText(e.target.value)}
                />
                <button
                  onClick={handleAssessment}
                  disabled={submitting || !assessmentText.trim()}
                  className="mt-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null}
                  Save Assessment
                </button>
              </Card>
            )}

            {/* Status advance panel */}
            {NEXT_TRANSITIONS[selCase.status]?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Advance Case Status</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 block mb-1">Next Status</span>
                    <select
                      className={inputCls}
                      value={selectedNextStatus}
                      onChange={e => setSelectedNextStatus(e.target.value)}
                    >
                      <option value="">— Select —</option>
                      {NEXT_TRANSITIONS[selCase.status].map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-slate-600 block mb-1">Notes (optional)</span>
                    <input
                      className={inputCls}
                      value={statusNote}
                      onChange={e => setStatusNote(e.target.value)}
                      placeholder="Reason for status change…"
                    />
                  </label>
                </div>
                <button
                  onClick={handleStatusUpdate}
                  disabled={submitting || !selectedNextStatus}
                  className="mt-3 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null}
                  Update Status
                </button>
              </Card>
            )}

            {/* Lab scope notice */}
            {(selCase.status === 'LAB_PENDING' || selCase.status === 'INVESTIGATING') && (
              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-2">
                  <FlaskConical size={15} className="text-purple-600" />
                  <p className="text-sm text-purple-800">
                    Laboratory sample collection and results are managed in the <strong>Laboratory module</strong>.
                    Link lab orders to this case using Case Number <strong>{selCase.caseNumber}</strong>.
                  </p>
                </div>
              </Card>
            )}

            {/* Status history */}
            {selCase.history?.length > 0 && (
              <Card className="p-4">
                <h4 className="font-bold text-slate-800 text-sm mb-3">Status History</h4>
                <div className="space-y-2">
                  {selCase.history.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                      <ChevronRight size={12} className="text-slate-400 shrink-0" />
                      <span className="font-semibold">{h.oldStatus}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-semibold">{h.newStatus}</span>
                      {h.notes && <span className="text-slate-400 italic truncate">— {h.notes}</span>}
                      <span className="ml-auto text-slate-300 shrink-0">
                        {new Date(h.changedAt).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Alert traceability */}
            {selCase.alert && (
              <Card className="p-4 bg-slate-50 border-slate-200">
                <h4 className="text-xs font-semibold text-slate-500 uppercase mb-2">Originating Alert</h4>
                <div className="flex items-center gap-2 text-sm">
                  <AlertTriangle size={14} className="text-orange-500" />
                  <span className="font-semibold text-slate-800">{selCase.alert.title}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ml-auto ${
                    selCase.alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800 border-red-200' :
                    selCase.alert.severity === 'RED' ? 'bg-red-100 text-red-700 border-red-200' :
                    'bg-amber-100 text-amber-800 border-amber-200'
                  }`}>
                    {selCase.alert.severity}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-1">Animal Tag: {selCase.alert.animalTag}</div>
              </Card>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
