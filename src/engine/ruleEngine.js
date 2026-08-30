/**
 * PASHU-RAKSHA Rule Engine — v2
 * Scores animal health abnormalities based on individual baselines.
 * Produces disease risk profile from KB species-disease mappings.
 * DISCLAIMER: Outputs are risk-triage only, not veterinary diagnosis.
 */

const ZOONOTIC_DIS = new Set(['DIS_04','DIS_05','DIS_07','DIS_09','DIS_11','DIS_12']);
const NOTIFIABLE   = new Set(['DIS_01','DIS_02','DIS_03','DIS_04','DIS_06','DIS_07','DIS_08','DIS_09','DIS_10','DIS_11','DIS_12']);

// Month-based monsoon risk multiplier (June–September in Maharashtra)
function monsonRiskMultiplier() {
  const month = new Date().getMonth() + 1; // 1-12
  return month >= 6 && month <= 9 ? 1.3 : 1.0;
}

export function calculateBaselineDeviation(current, baseline) {
  let actDrop = 0, feedDrop = 0, moveDrop = 0, rumDrop = 0;
  if (baseline) {
    if (baseline.activity   > 0) actDrop  = Math.max(0, ((baseline.activity  - current.activity)  / baseline.activity)  * 100);
    if (baseline.feeding    > 0) feedDrop = Math.max(0, ((baseline.feeding   - current.feeding)   / baseline.feeding)   * 100);
    if (baseline.movement   > 0) moveDrop = Math.max(0, ((baseline.movement  - current.movement)  / baseline.movement)  * 100);
    if (baseline.rumination > 0 && current.rumination != null)
      rumDrop = Math.max(0, ((baseline.rumination - current.rumination) / baseline.rumination) * 100);
  }
  return {
    actDrop:  Math.round(actDrop),
    feedDrop: Math.round(feedDrop),
    moveDrop: Math.round(moveDrop),
    rumDrop:  Math.round(rumDrop),
  };
}

export function runRuleEngine(animal, db) {
  let score = 0;
  const reasons = [];
  const { actDrop, feedDrop, moveDrop, rumDrop } = calculateBaselineDeviation(animal.current, animal.baseline);
  const c = animal.current || {};
  const monsoon = monsonRiskMultiplier();

  // ── Behavioural / IoT signals ──────────────────────────────────────────────
  if (actDrop >= 40)      { score += 3; reasons.push({ type: 'iot',      text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 25) { score += 2; reasons.push({ type: 'iot',      text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 10) { score += 1; reasons.push({ type: 'iot',      text: `Activity mildly reduced (${actDrop}%) vs baseline` }); }

  if (feedDrop >= 30)      { score += 2; reasons.push({ type: 'iot',      text: `Feeding ${feedDrop}% below baseline` }); }
  else if (feedDrop >= 15) { score += 1; reasons.push({ type: 'iot',      text: `Feeding mildly reduced (${feedDrop}%) vs baseline` }); }

  if (moveDrop >= 25)      { score += 1; reasons.push({ type: 'camera',   text: `Movement ${moveDrop}% below baseline` }); }
  if (rumDrop >= 20)       { score += 2; reasons.push({ type: 'iot',      text: `Rumination ${rumDrop}% below baseline` }); }

  // ── Clinical signs ─────────────────────────────────────────────────────────
  if (c.tempTrend === 'elevated')  { score += 2; reasons.push({ type: 'clinical',  text: 'Temperature trend elevated over recent readings' }); }
  if (c.social === 'isolating')    { score += 1; reasons.push({ type: 'behavior',  text: 'Isolation / reduced social behaviour observed' }); }
  if (c.social === 'recumbent')    { score += 4; reasons.push({ type: 'behavior',  text: 'Recumbency detected — urgent' }); }
  if (c.lameness)                  { score += 2; reasons.push({ type: 'camera',    text: 'Gait abnormality / lameness detected' }); }
  if (c.nasal_discharge)           { score += 1; reasons.push({ type: 'camera',    text: 'Nasal/ocular discharge visible' }); }
  if (c.skin_lesions)              { score += 2; reasons.push({ type: 'camera',    text: 'Skin lesions / nodules visible' }); }
  if (c.abortion_event)            { score += 3; reasons.push({ type: 'farmer',    text: 'Abortion/reproductive event reported' }); }

  // ── Monsoon season risk bonus (for HS, Leptospirosis) ─────────────────────
  if (monsoon > 1.0) {
    score = Math.round(score * monsoon);
    if (score > 0) reasons.push({ type: 'epidemiological', text: 'Monsoon season — elevated environmental risk for vector/water-borne diseases' });
  }

  // ── Exposure context ───────────────────────────────────────────────────────
  const exposed = (db.exposureEvents || []).some(e => e.targetId === animal.id || e.sourceId === animal.id);
  if (exposed) { score += 2; reasons.push({ type: 'epidemiological', text: 'Potential exposure contact detected in proximity network' }); }

  // ── Risk level ─────────────────────────────────────────────────────────────
  let healthRiskLevel = 'GREEN';
  if      (score >= 10) healthRiskLevel = 'CRITICAL';
  else if (score >= 7)  healthRiskLevel = 'RED';
  else if (score >= 4)  healthRiskLevel = 'ORANGE';
  else if (score >= 2)  healthRiskLevel = 'YELLOW';

  // Force CRITICAL for recumbency + fever
  if (c.social === 'recumbent' && c.tempTrend === 'elevated') healthRiskLevel = 'CRITICAL';

  const healthAbnormality = score === 0 ? 'NONE' : score >= 7 ? 'SEVERE' : score >= 4 ? 'MODERATE' : 'MILD';

  // ── Disease risk profile (KB-driven) ──────────────────────────────────────
  const speciesAssocs = (db.diseaseSpecies || []).filter(m => m.speciesId === animal.speciesId);
  const diseaseRisks  = speciesAssocs.map(assoc => {
    const disease = (db.diseases || []).find(d => d.id === assoc.diseaseId);
    if (!disease) return null;
    const why = [`Species (${animal.speciesId}) associated in KB`];
    let dScore = 0;

    // Score based on symptom overlap
    if (c.tempTrend === 'elevated' && disease.earlySymptoms?.toLowerCase().includes('fever'))
      { dScore += 2; why.push('Temperature trend matches described fever'); }
    if ((actDrop >= 15 || feedDrop >= 15) && disease.behavioralSigns && !disease.behavioralSigns.includes('Not established'))
      { dScore += 1; why.push('Behavioural deviation consistent with known signs'); }
    if (c.social === 'isolating' && disease.behavioralSigns?.toLowerCase().includes('isol'))
      { dScore += 1; why.push('Isolation behaviour matches known signs'); }
    if (c.social === 'recumbent')
      { dScore += 2; why.push('Recumbency aligns with severe presentation'); }
    if (c.lameness && disease.earlySymptoms?.toLowerCase().includes('lame'))
      { dScore += 2; why.push('Lameness consistent with described symptoms'); }
    if (c.nasal_discharge && disease.physicalSigns?.toLowerCase().includes('discharge'))
      { dScore += 1; why.push('Nasal discharge consistent'); }
    if (c.skin_lesions && disease.physicalSigns?.toLowerCase().includes('nodule'))
      { dScore += 2; why.push('Skin lesions consistent with described physical signs'); }
    if (c.abortion_event && disease.earlySymptoms?.toLowerCase().includes('abort'))
      { dScore += 3; why.push('Abortion event matches reproductive impact'); }
    if (exposed && disease.exposureTypes?.some(t => t.toLowerCase().includes('contact')))
      { dScore += 1; why.push('Exposure contact present; direct-contact transmission applicable'); }

    if (assoc.evidence.includes('not established')) dScore = Math.floor(dScore * 0.5);

    const risk = dScore >= 4 ? 'HIGH' : dScore >= 2 ? 'MEDIUM' : 'LOW';
    why.push('Evidence status: ' + assoc.evidence);
    return { disease, assoc, risk, why, dScore, isZoonotic: ZOONOTIC_DIS.has(disease.id), isNotifiable: NOTIFIABLE.has(disease.id) };
  })
  .filter(Boolean)
  .sort((a,b) => b.dScore - a.dScore)
  .slice(0, 5);

  // ── Escalation flag for zoonotic / notifiable ──────────────────────────────
  const zonoticRisk = diseaseRisks.some(d => d.isZoonotic && d.risk === 'HIGH');
  if (zonoticRisk && healthRiskLevel !== 'CRITICAL') healthRiskLevel = 'RED';

  // ── Recommended action ─────────────────────────────────────────────────────
  let recommendedAction = 'Continue routine monitoring.';
  if (healthRiskLevel === 'CRITICAL') {
    recommendedAction = 'IMMEDIATE veterinary intervention required. Isolate animal. Notify authority.';
  } else if (healthRiskLevel === 'RED') {
    recommendedAction = 'Veterinary review urgently recommended. Laboratory confirmation required for diagnosis.';
  } else if (healthRiskLevel === 'ORANGE') {
    recommendedAction = 'Field veterinary verification recommended within 24 hours.';
  } else if (healthRiskLevel === 'YELLOW') {
    recommendedAction = 'Monitor closely. Report if condition worsens.';
  }

  return {
    healthAbnormality,
    healthRiskLevel,
    diseaseRisks,
    score,
    reasons,
    actDrop, feedDrop, moveDrop, rumDrop,
    recommendedAction,
    zonoticRisk,
    confidence: score > 0 ? (score >= 7 ? 'High' : 'Moderate') : 'N/A',
    urgency: healthRiskLevel,
    evaluatedAt: new Date().toISOString(),
  };
}
