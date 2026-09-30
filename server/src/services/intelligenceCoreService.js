/**
 * PASHU-RAKSHA Backend Intelligence Core Adapter
 */
const { calculateDeviation } = require('./healthFingerprintService');

const ZOONOTIC_SET = new Set(['DIS_04', 'DIS_05', 'DIS_07', 'DIS_09', 'DIS_11', 'DIS_12']);
const NOTIFIABLE_SET = new Set(['DIS_01', 'DIS_02', 'DIS_03', 'DIS_04', 'DIS_06', 'DIS_07', 'DIS_08', 'DIS_09', 'DIS_10', 'DIS_11', 'DIS_12']);

function evaluateRisk(animal, currentReadings = {}, baselineReadings = { activity: 80, feeding: 80, movement: 80, rumination: 80 }, diseases = [], exposureEvents = [], diseaseSpecies = []) {
  const cur = currentReadings || {};
  const base = baselineReadings || { activity: 80, feeding: 80, movement: 80, rumination: 80 };
  let score = 0;
  const reasons = [];
  const drops = calculateDeviation(cur, base);
  const { actDrop, feedDrop, moveDrop, rumDrop } = drops;

  // 1. Evidence Fusion (matched to frontend brain/reasoning/evidence-fusion.ts)
  if (actDrop >= 40) { score += 3; reasons.push({ type: 'iot', text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 25) { score += 2; reasons.push({ type: 'iot', text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 10) { score += 1; reasons.push({ type: 'iot', text: `Activity mildly reduced (${actDrop}%) vs baseline` }); }

  if (feedDrop >= 30) { score += 2; reasons.push({ type: 'iot', text: `Feeding ${feedDrop}% below baseline` }); }
  else if (feedDrop >= 15) { score += 1; reasons.push({ type: 'iot', text: `Feeding mildly reduced (${feedDrop}%) vs baseline` }); }

  if (moveDrop >= 25) { score += 1; reasons.push({ type: 'camera', text: `Movement ${moveDrop}% below baseline` }); }
  if (rumDrop >= 20) { score += 2; reasons.push({ type: 'iot', text: `Rumination ${rumDrop}% below baseline` }); }

  if (currentReadings.tempTrend === 'elevated' || (currentReadings.temperatureCelsius && currentReadings.temperatureCelsius > 39.5)) {
    score += 2;
    reasons.push({ type: 'clinical', text: 'Temperature trend elevated over recent readings' });
  }

  if (currentReadings.social === 'recumbent') {
    score += 4;
    reasons.push({ type: 'behavior', text: 'Recumbency detected — urgent' });
  } else if (currentReadings.social === 'isolating') {
    score += 1;
    reasons.push({ type: 'behavior', text: 'Isolation / reduced social behaviour observed' });
  }

  if (currentReadings.lameness) { score += 2; reasons.push({ type: 'camera', text: 'Gait abnormality / lameness detected' }); }
  if (currentReadings.nasal_discharge) { score += 1; reasons.push({ type: 'camera', text: 'Nasal/ocular discharge visible' }); }
  if (currentReadings.skin_lesions) { score += 2; reasons.push({ type: 'camera', text: 'Skin lesions / nodules visible' }); }
  if (currentReadings.abortion_event) { score += 3; reasons.push({ type: 'farmer', text: 'Abortion/reproductive event reported' }); }

  const month = new Date().getMonth() + 1;
  const isMonsoon = month >= 6 && month <= 9;
  if (isMonsoon) {
    score = Math.round(score * 1.3);
    if (score > 0) reasons.push({ type: 'epidemiological', text: 'Monsoon season — elevated environmental risk for vector/water-borne diseases' });
  }

  const hasExposure = exposureEvents.some(e => e.sourceId === animal.id || e.targetId === animal.id);
  if (hasExposure) {
    score += 2;
    reasons.push({ type: 'epidemiological', text: 'Potential exposure contact detected in proximity network' });
  }

  // 2. Disease Ranking (matched to frontend brain/risk-engine/disease-ranking.ts)
  const speciesAssocs = diseaseSpecies.filter(m => m.speciesId === animal.speciesId);
  const matchedDiseases = speciesAssocs.map(assoc => {
    const disease = diseases.find(d => d.id === assoc.diseaseId);
    if (!disease) return null;
    const why = [`Species (${animal.speciesId}) associated in KB`];
    let dScore = 0;

    if (currentReadings.tempTrend === 'elevated' && (disease.earlySymptoms || '').toLowerCase().includes('fever')) {
      dScore += 2;
      why.push('Temperature trend matches described fever');
    }
    if ((actDrop >= 15 || feedDrop >= 15) && disease.behavioralSigns && !disease.behavioralSigns.includes('Not established')) {
      dScore += 1;
      why.push('Behavioural deviation consistent with known signs');
    }
    if (currentReadings.social === 'isolating' && (disease.behavioralSigns || '').toLowerCase().includes('isol')) {
      dScore += 1;
      why.push('Isolation behaviour matches known signs');
    }
    if (currentReadings.social === 'recumbent') {
      dScore += 2;
      why.push('Recumbency aligns with severe presentation');
    }
    if (currentReadings.lameness && (disease.earlySymptoms || '').toLowerCase().includes('lame')) {
      dScore += 2;
      why.push('Lameness consistent with described symptoms');
    }
    if (currentReadings.skin_lesions && (disease.physicalSigns || '').toLowerCase().includes('nodule')) {
      dScore += 2;
      why.push('Skin lesions consistent with described physical signs');
    }
    if (currentReadings.abortion_event && (disease.earlySymptoms || '').toLowerCase().includes('abort')) {
      dScore += 3;
      why.push('Abortion event matches reproductive impact');
    }

    if (assoc.evidence && assoc.evidence.includes('not established')) dScore = Math.floor(dScore * 0.5);

    const risk = dScore >= 4 ? 'HIGH' : dScore >= 2 ? 'MEDIUM' : 'LOW';
    why.push('Evidence status: ' + assoc.evidence);
    
    return {
      diseaseId: disease.id,
      code: disease.code,
      name: disease.name,
      dScore,
      risk,
      why,
      isZoonotic: ZOONOTIC_SET.has(disease.code) || disease.isZoonotic,
      isNotifiable: NOTIFIABLE_SET.has(disease.code) || disease.isNotifiable,
    };
  }).filter(Boolean).filter(d => d.dScore > 0).sort((a, b) => b.dScore - a.dScore).slice(0, 5);

  // 3. Risk Level (matched to frontend brain/risk-engine/anomaly-score.ts)
  let healthRiskLevel = 'GREEN';
  const isRecumbentAndFever = currentReadings.social === 'recumbent' && currentReadings.tempTrend === 'elevated';
  
  if (score >= 10 || isRecumbentAndFever) healthRiskLevel = 'CRITICAL';
  else if (score >= 7) healthRiskLevel = 'RED';
  else if (score >= 4) healthRiskLevel = 'ORANGE';
  else if (score >= 2) healthRiskLevel = 'YELLOW';

  const healthAbnormality = score === 0 ? 'NONE' : score >= 7 ? 'SEVERE' : score >= 4 ? 'MODERATE' : 'MILD';

  const zonoticRisk = matchedDiseases.some(d => d.isZoonotic && d.risk === 'HIGH');
  if (zonoticRisk && healthRiskLevel !== 'CRITICAL') healthRiskLevel = 'RED';

  // 4. Recommended Action
  let recommendedNextStep = 'Continue routine health monitoring.';
  if (healthRiskLevel === 'CRITICAL') {
    recommendedNextStep = 'IMMEDIATE veterinary intervention required. Isolate animal and notify district authority.';
  } else if (healthRiskLevel === 'RED') {
    recommendedNextStep = 'Urgent field veterinary examination recommended. Prepare lab sample collection.';
  } else if (healthRiskLevel === 'ORANGE') {
    recommendedNextStep = 'Veterinary inspection recommended within 24 hours.';
  } else if (healthRiskLevel === 'YELLOW') {
    recommendedNextStep = 'Monitor closely and re-evaluate baseline deviation in 12 hours.';
  }

  return {
    healthAbnormality,
    riskScore: score,
    riskLevel: healthRiskLevel,
    confidence: score > 0 ? (score >= 7 ? 'High' : 'Moderate') : 'N/A',
    urgency: healthRiskLevel,
    zonoticRisk,
    actDrop, feedDrop, moveDrop, rumDrop,
    reasons,
    matchedDiseases: matchedDiseases.slice(0, 3), // Return top 3 to match old API if needed, or keep 5. Let's return 3 to be safe, wait frontend matchedDiseases takes all.
    diseaseRisks: matchedDiseases, // Add diseaseRisks to match frontend RiskAnalysisResult format
    explanation: {
      whatChanged: `Activity drop: ${actDrop}%, Feeding drop: ${feedDrop}%, Temperature: ${currentReadings.tempTrend || 'normal'}.`,
      whyItMatters: reasons.map(r => r.text).join('; '),
      whatIsUncertain: 'Field veterinary exam & laboratory test required to confirm definitive etiology.',
      whatNext: recommendedNextStep,
    },
    recommendedAction: recommendedNextStep,
    evaluatedAt: new Date().toISOString(),
  };
}

module.exports = { evaluateRisk };
