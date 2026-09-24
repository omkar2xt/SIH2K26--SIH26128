/**
 * LaboratoryModule — Backend-Authoritative (Step 2I)
 *
 * All lab data fetched from the authenticated backend.
 * NO fallback to liveData, localStorage, or demo arrays.
 * Backend unavailable → hard error state (no fake data shown).
 *
 * MEDICAL AUTHORITY SEPARATION:
 *   Brain risk output  → "Potential Risk Assessment" (case clinicalNotes)
 *   Vet assessment     → vetAssessment field (veterinary clinical findings)
 *   Lab result         → resultOutcome on LabResult (_authority: 'LABORATORY_RESULT')
 *
 * These three are DISTINCT. This module shows only LABORATORY RESULTS.
 *
 * Reference data (SampleTypes, LabFacilities, DiagnosticMethods) comes from
 * GET /lab/reference — seeded from real Indian veterinary lab infrastructure.
 *
 * LAB_TESTS / SAMPLE_TYPES / LABS arrays from src/services/labService.js are
 * no longer used for authoritative data — they are kept in labService.js only
 * for reference/documentation.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FlaskConical, Plus, CheckCircle2, XCircle, Clock, Search,
  RefreshCw, Loader2, AlertTriangle, Info, ChevronRight, ChevronDown
} from 'lucide-react';
import { Card, SectionTitle } from '../common/UIComponents';
import { api } from '../../services/api/api.js';

const inputCls = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-100';

const RESULT_STYLE = {
  POSITIVE:     'bg-red-100 text-red-800 border-red-200',
  NEGATIVE:     'bg-emerald-100 text-emerald-800 border-emerald-200',
  INCONCLUSIVE: 'bg-amber-100 text-amber-800 border-amber-200',
  PENDING:      'bg-slate-100 text-slate-600 border-slate-200',
};

const ORDER_STATUS_STYLE = {
  ORDERED:          'bg-blue-50 text-blue-700',
  SAMPLE_COLLECTED: 'bg-indigo-50 text-indigo-700',
  IN_TRANSIT:       'bg-purple-50 text-purple-700',
  RECEIVED:         'bg-amber-50 text-amber-700',
  TESTING:          'bg-orange-50 text-orange-700',
  COMPLETED:        'bg-emerald-50 text-emerald-700',
};

const RESULT_OUTCOMES = ['POSITIVE', 'NEGATIVE', 'INCONCLUSIVE'];

// Valid next status for order state machine (mirrors server)
const NEXT_ORDER_STATUS = {
  ORDERED:          ['SAMPLE_COLLECTED'],
  SAMPLE_COLLECTED: ['IN_TRANSIT'],
  IN_TRANSIT:       ['RECEIVED'],
  RECEIVED:         ['TESTING'],
  TESTING:          ['COMPLETED'],
  COMPLETED:        [],
};

// Default form state
const emptyForm = () => ({
  caseId:             '',
  labFacilityId:      '',
  sampleTypeId:       '',
  diagnosticMethodId: '',
  testName:           '',
  suspectedDiseaseId: '',
  priority:           'ROUTINE',
  collectedBy:        '',
  notes:              '',
});

export default function LaboratoryModule() {
  // ── Data state ──────────────────────────────────────────────────────────────
  const [orders,     setOrders]     = useState([]);
  const [reference,  setReference]  = useState({ sampleTypes: [], labFacilities: [], diagnosticMethods: [] });
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [showAdd,       setShowAdd]       = useState(false);
  const [filterResult,  setFilterResult]  = useState('');
  const [search,        setSearch]        = useState('');
  const [expanded,      setExpanded]      = useState(null);       // expanded order ID
  const [form,          setForm]          = useState(emptyForm());
  const [resultEntry,   setResultEntry]   = useState({});         // { testId: { resultOutcome, remarks } }
  const [flash,         setFlash]         = useState('');
  const [flashErr,      setFlashErr]      = useState('');
  const [submitting,    setSubmitting]    = useState(false);

  // ── Fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, refRes] = await Promise.all([
        api.lab.getOrders(),
        api.lab.getReference(),
      ]);
      if (!ordersRes.success) throw new Error(ordersRes.error || 'Failed to load lab orders');
      if (!refRes.success)   throw new Error(refRes.error   || 'Failed to load reference data');
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      setReference(refRes.data || { sampleTypes: [], labFacilities: [], diagnosticMethods: [] });
    } catch (e) {
      // Backend unavailable — DO NOT show fake data
      setError(e.message || 'Backend unavailable. Laboratory data cannot be displayed offline.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Derived stats ────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const allTests = orders.flatMap(o => o.samples?.flatMap(s => s.tests) || []);
    const allResults = allTests.flatMap(t => t.results || []);
    return {
      total:        orders.length,
      pending:      allTests.filter(t => t.status === 'PENDING').length,
      positive:     allResults.filter(r => r.resultOutcome === 'POSITIVE').length,
      negative:     allResults.filter(r => r.resultOutcome === 'NEGATIVE').length,
      inconclusive: allResults.filter(r => r.resultOutcome === 'INCONCLUSIVE').length,
    };
  }, [orders]);

  // ── Filtered view ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => orders.filter(o => {
    if (search) {
      const q = search.toLowerCase();
      const orderMatch = o.orderNumber?.toLowerCase().includes(q);
      const animalMatch = o.case?.animal?.tagId?.toLowerCase().includes(q);
      const testMatch = o.samples?.some(s => s.tests?.some(t => t.testName?.toLowerCase().includes(q)));
      if (!orderMatch && !animalMatch && !testMatch) return false;
    }
    if (filterResult) {
      const hasResult = o.samples?.some(s =>
        s.tests?.some(t => t.results?.some(r => r.resultOutcome === filterResult))
      );
      if (!hasResult) return false;
    }
    return true;
  }), [orders, search, filterResult]);

  // ── Flash helpers ─────────────────────────────────────────────────────────────
  function showFlash(msg)    { setFlash(msg);    setTimeout(() => setFlash(''),    3500); }
  function showFlashErr(msg) { setFlashErr(msg); setTimeout(() => setFlashErr(''), 5000); }

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function submitOrder() {
    if (!form.testName.trim()) {
      showFlashErr('Test name is required');
      return;
    }
    setSubmitting(true);
    const payload = {
      testName: form.testName,
      ...(form.caseId             ? { caseId:             form.caseId }             : {}),
      ...(form.labFacilityId      ? { labFacilityId:      form.labFacilityId }      : {}),
      ...(form.sampleTypeId       ? { sampleTypeId:       form.sampleTypeId }       : {}),
      ...(form.diagnosticMethodId ? { diagnosticMethodId: form.diagnosticMethodId } : {}),
      ...(form.suspectedDiseaseId ? { suspectedDiseaseId: form.suspectedDiseaseId } : {}),
      ...(form.priority           ? { priority:           form.priority }           : {}),
      ...(form.collectedBy        ? { collectedBy:        form.collectedBy }        : {}),
      ...(form.notes              ? { notes:              form.notes }              : {}),
    };
    const res = await api.lab.createOrder(payload);
    setSubmitting(false);
    if (res.success) {
      showFlash(`Lab order ${res.data.orderNumber} created`);
      setShowAdd(false);
      setForm(emptyForm());
      await fetchAll();
    } else {
      showFlashErr(res.error || 'Failed to create lab order');
    }
  }

  async function submitResult(testId) {
    const entry = resultEntry[testId] || {};
    if (!entry.resultOutcome) {
      showFlashErr('Select a result outcome first');
      return;
    }
    setSubmitting(true);
    const res = await api.lab.recordResult(
      testId,
      entry.resultOutcome,
      entry.remarks || undefined,
      entry.quantitativeValue || undefined,
      entry.verifiedBy || undefined
    );
    setSubmitting(false);
    if (res.success) {
      const transition = res.data.caseTransition;
      let msg = `Result recorded: ${entry.resultOutcome}`;
      if (transition?.transitioned) msg += ` — Case advanced to ${transition.newStatus}`;
      else if (transition?.reason)  msg += ` (${transition.reason})`;
      showFlash(msg);
      setResultEntry(r => { const n = { ...r }; delete n[testId]; return n; });
      await fetchAll();
    } else {
      showFlashErr(res.error || 'Failed to record result');
    }
  }

  async function advanceOrderStatus(orderId, currentStatus) {
    const nextStatuses = NEXT_ORDER_STATUS[currentStatus] || [];
    if (!nextStatuses.length) return;
    const nextStatus = nextStatuses[0]; // auto-advance to next
    const res = await api.lab.updateOrderStatus(orderId, nextStatus);
    if (res.success) {
      showFlash(`Order status → ${nextStatus}`);
      await fetchAll();
    } else {
      showFlashErr(res.error || 'Failed to update status');
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <Loader2 size={22} className="animate-spin mr-2" />
        <span className="text-sm font-medium">Loading laboratory data from backend…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center max-w-md mx-auto">
        <AlertTriangle size={40} className="text-orange-400 mb-3" />
        <h3 className="font-bold text-slate-800 mb-1">Laboratory Data Unavailable</h3>
        <p className="text-sm text-slate-600 mb-4">{error}</p>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  // ── Main UI ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <SectionTitle eyebrow="Diagnostics" title="Laboratory Workflow">
        <div className="flex items-center gap-2">
          {flash    && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">✓ {flash}</span>}
          {flashErr && <span className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-3 py-1 rounded-full">✗ {flashErr}</span>}
          <button onClick={fetchAll} title="Refresh" className="p-1.5 rounded hover:bg-slate-100">
            <RefreshCw size={14} className="text-slate-500" />
          </button>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            <Plus size={14} /> Log Sample
          </button>
        </div>
      </SectionTitle>

      {/* Medical authority notice */}
      <Card className="p-3 bg-amber-50 border-amber-200">
        <div className="flex items-start gap-2">
          <Info size={14} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            <strong>Medical Authority Notice:</strong> Results shown here are{' '}
            <strong>laboratory test results</strong> — distinct from system risk assessments
            (Brain output) and veterinary clinical assessments. A POSITIVE laboratory result
            for a LAB_PENDING case automatically advances the case to CONFIRMED via the server.
            INCONCLUSIVE results require veterinary review before case status changes.
          </p>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Total Orders',  value: stats.total,        color: 'text-slate-800',   bg: 'bg-slate-50 border-slate-200' },
          { label: 'Tests Pending', value: stats.pending,      color: 'text-amber-800',   bg: 'bg-amber-50 border-amber-200' },
          { label: 'Positive',      value: stats.positive,     color: 'text-red-800',     bg: 'bg-red-50 border-red-200' },
          { label: 'Negative',      value: stats.negative,     color: 'text-emerald-800', bg: 'bg-emerald-50 border-emerald-200' },
          { label: 'Inconclusive',  value: stats.inconclusive, color: 'text-orange-800',  bg: 'bg-orange-50 border-orange-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
            <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
            <div className="text-xs font-semibold text-slate-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Order Form */}
      {showAdd && (
        <Card className="p-4 border-teal-200">
          <h3 className="font-bold text-slate-800 mb-1 text-sm">Log New Laboratory Sample</h3>
          <p className="text-xs text-slate-500 mb-3">
            Creates a Lab Order + Sample + Test in one operation. Reference data is loaded from the backend.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Test Name <span className="text-red-500">*</span></span>
              <input
                className={inputCls}
                placeholder="e.g. RT-PCR for FMD"
                value={form.testName}
                onChange={e => setForm(f => ({ ...f, testName: e.target.value }))}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Diagnostic Method</span>
              <select className={inputCls} value={form.diagnosticMethodId} onChange={e => setForm(f => ({ ...f, diagnosticMethodId: e.target.value }))}>
                <option value="">— Select Method —</option>
                {reference.diagnosticMethods.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Sample Type</span>
              <select className={inputCls} value={form.sampleTypeId} onChange={e => setForm(f => ({ ...f, sampleTypeId: e.target.value }))}>
                <option value="">— Select Type —</option>
                {reference.sampleTypes.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Laboratory</span>
              <select className={inputCls} value={form.labFacilityId} onChange={e => setForm(f => ({ ...f, labFacilityId: e.target.value }))}>
                <option value="">— Select Lab —</option>
                {reference.labFacilities.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Priority</span>
              <select className={inputCls} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-slate-600 block mb-1">Collected By</span>
              <input
                className={inputCls}
                placeholder="Field worker / vet name"
                value={form.collectedBy}
                onChange={e => setForm(f => ({ ...f, collectedBy: e.target.value }))}
              />
            </label>
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={submitOrder}
              disabled={submitting || !form.testName.trim()}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600 disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="inline animate-spin mr-1" /> : null}
              Log Sample
            </button>
            <button onClick={() => { setShowAdd(false); setForm(emptyForm()); }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="pl-9 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:border-teal-600 focus:outline-none"
            placeholder="Search by order number, animal tag, test name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          value={filterResult}
          onChange={e => setFilterResult(e.target.value)}
        >
          <option value="">All Results</option>
          <option value="POSITIVE">Positive</option>
          <option value="NEGATIVE">Negative</option>
          <option value="INCONCLUSIVE">Inconclusive</option>
        </select>
      </div>

      {/* Orders list */}
      {filtered.length === 0 && (
        <div className="py-12 text-center text-slate-400">
          <FlaskConical size={32} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-medium">No lab orders found</p>
          <p className="text-xs mt-1 text-slate-300">Orders are created by authorized veterinarians and officials</p>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map(order => {
          const isOpen = expanded === order.id;
          const allTests = order.samples?.flatMap(s => s.tests) || [];
          const pendingTests = allTests.filter(t => t.status === 'PENDING');
          const completedTests = allTests.filter(t => t.status === 'COMPLETED');
          const hasPositive = allTests.some(t => t.results?.some(r => r.resultOutcome === 'POSITIVE'));
          const hasNegative = !hasPositive && allTests.some(t => t.results?.some(r => r.resultOutcome === 'NEGATIVE'));

          return (
            <Card key={order.id} className="overflow-hidden">
              {/* Order header */}
              <button
                className="w-full text-left px-4 py-3 hover:bg-slate-50 transition"
                onClick={() => setExpanded(isOpen ? null : order.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-teal-800">{order.orderNumber}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ORDER_STATUS_STYLE[order.status] || 'bg-slate-100 text-slate-600'}`}>
                          {order.status?.replace(/_/g, ' ')}
                        </span>
                        {order.priority === 'URGENT' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-700">URGENT</span>
                        )}
                      </div>
                      <div className="text-sm font-semibold text-slate-800 mt-0.5">
                        {order.case?.animal?.tagId || '—'}
                        {order.case?.caseNumber && (
                          <span className="text-xs text-slate-400 font-normal ml-2">Case: {order.case.caseNumber}</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        {allTests.map(t => t.testName).join(', ') || '—'} · {order.labFacility?.name || 'No facility'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {hasPositive     && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RESULT_STYLE.POSITIVE}`}>POSITIVE</span>}
                    {hasNegative     && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RESULT_STYLE.NEGATIVE}`}>NEGATIVE</span>}
                    {pendingTests.length > 0 && !hasPositive && !hasNegative && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${RESULT_STYLE.PENDING}`}>
                        {pendingTests.length} PENDING
                      </span>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>
              </button>

              {/* Expanded detail */}
              {isOpen && (
                <div className="border-t border-slate-100 px-4 py-3 space-y-3 bg-slate-50">

                  {/* Order metadata */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div><span className="font-semibold text-slate-500">Requested by</span><div>{order.requestor?.fullName || '—'}</div></div>
                    <div><span className="font-semibold text-slate-500">Lab</span><div>{order.labFacility?.name || '—'}</div></div>
                    <div><span className="font-semibold text-slate-500">Case status</span><div>{order.case?.status || '—'}</div></div>
                    <div><span className="font-semibold text-slate-500">Created</span><div>{new Date(order.createdAt).toLocaleDateString('en-IN')}</div></div>
                  </div>

                  {/* Status advance */}
                  {NEXT_ORDER_STATUS[order.status]?.length > 0 && (
                    <button
                      onClick={() => advanceOrderStatus(order.id, order.status)}
                      className="text-xs font-semibold bg-blue-700 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600"
                    >
                      Advance → {NEXT_ORDER_STATUS[order.status][0]?.replace(/_/g, ' ')}
                    </button>
                  )}

                  {/* Samples & Tests */}
                  {order.samples?.map(sample => (
                    <div key={sample.id} className="space-y-2">
                      <div className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <FlaskConical size={11} />
                        Sample: {sample.sampleCode}
                        {sample.sampleType && <span className="font-normal text-slate-500">— {sample.sampleType.name}</span>}
                      </div>

                      {sample.tests?.map(test => {
                        const existingResult = test.results?.[0];
                        const entry = resultEntry[test.id] || {};

                        return (
                          <div key={test.id} className="rounded-lg border border-slate-200 bg-white p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <span className="text-xs font-bold text-slate-800">{test.testName}</span>
                                {test.diagnosticMethod && (
                                  <span className="text-xs text-slate-400 ml-2">[{test.diagnosticMethod.code}]</span>
                                )}
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                test.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                              }`}>
                                {test.status}
                              </span>
                            </div>

                            {/* Existing result */}
                            {existingResult && (
                              <div className={`rounded-lg p-2 border text-xs ${RESULT_STYLE[existingResult.resultOutcome] || RESULT_STYLE.PENDING}`}>
                                <div className="font-bold mb-0.5">
                                  Laboratory Result: {existingResult.resultOutcome}
                                </div>
                                {existingResult.quantitativeValue && (
                                  <div>Quantitative: {existingResult.quantitativeValue}</div>
                                )}
                                {existingResult.remarks && (
                                  <div className="italic mt-0.5">{existingResult.remarks}</div>
                                )}
                                {existingResult.verifiedBy && (
                                  <div className="text-slate-600 mt-0.5">Verified by: {existingResult.verifiedBy}</div>
                                )}
                                <div className="text-slate-500 mt-0.5">
                                  {new Date(existingResult.createdAt).toLocaleString('en-IN')}
                                </div>
                                <div className="text-slate-400 mt-0.5 text-[10px]">
                                  Authority: LABORATORY RESULT (not Brain risk output or vet assessment)
                                </div>
                              </div>
                            )}

                            {/* Record result form */}
                            {!existingResult && test.status !== 'COMPLETED' && (
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-2 items-end">
                                  <div>
                                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Result Outcome</span>
                                    <select
                                      className="text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                                      value={entry.resultOutcome || ''}
                                      onChange={e => setResultEntry(r => ({ ...r, [test.id]: { ...r[test.id], resultOutcome: e.target.value } }))}
                                    >
                                      <option value="">— Select —</option>
                                      {RESULT_OUTCOMES.map(o => <option key={o}>{o}</option>)}
                                    </select>
                                  </div>
                                  <div className="flex-1 min-w-[120px]">
                                    <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">Remarks (optional)</span>
                                    <input
                                      className="text-xs border border-slate-200 rounded px-2 py-1 w-full"
                                      placeholder="Lab notes…"
                                      value={entry.remarks || ''}
                                      onChange={e => setResultEntry(r => ({ ...r, [test.id]: { ...r[test.id], remarks: e.target.value } }))}
                                    />
                                  </div>
                                  <button
                                    onClick={() => submitResult(test.id)}
                                    disabled={submitting || !entry.resultOutcome}
                                    className="text-xs font-bold bg-teal-700 text-white px-3 py-1 rounded hover:bg-teal-600 disabled:opacity-50"
                                  >
                                    {submitting ? <Loader2 size={10} className="inline animate-spin" /> : 'Save'}
                                  </button>
                                </div>
                                {entry.resultOutcome === 'INCONCLUSIVE' && (
                                  <p className="text-[10px] text-amber-700 bg-amber-50 rounded px-2 py-1">
                                    INCONCLUSIVE result will NOT automatically change the case status. Veterinary review required.
                                  </p>
                                )}
                              </div>
                            )}

                            {existingResult && (
                              <p className="text-[10px] text-slate-400 mt-1 italic">
                                Result is immutable. Contact admin if a correction is required.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
