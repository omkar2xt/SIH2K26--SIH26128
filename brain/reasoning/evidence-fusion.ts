import { EvidenceReason } from '../contracts/evidence.types';

export function fuseEvidence(current: any = {}, baseline: any = {}, drops: any = {}, isMonsoon: boolean = false, isExposed: boolean = false): { score: number; reasons: EvidenceReason[] } {
  let score = 0;
  const reasons: EvidenceReason[] = [];
  const { actDrop, feedDrop, moveDrop, rumDrop } = drops;

  if (actDrop >= 40) { score += 3; reasons.push({ type: 'iot', text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 25) { score += 2; reasons.push({ type: 'iot', text: `Activity ${actDrop}% below individual baseline` }); }
  else if (actDrop >= 10) { score += 1; reasons.push({ type: 'iot', text: `Activity mildly reduced (${actDrop}%) vs baseline` }); }

  if (feedDrop >= 30) { score += 2; reasons.push({ type: 'iot', text: `Feeding ${feedDrop}% below baseline` }); }
  else if (feedDrop >= 15) { score += 1; reasons.push({ type: 'iot', text: `Feeding mildly reduced (${feedDrop}%) vs baseline` }); }

  if (moveDrop >= 25) { score += 1; reasons.push({ type: 'camera', text: `Movement ${moveDrop}% below baseline` }); }
  if (rumDrop >= 20) { score += 2; reasons.push({ type: 'iot', text: `Rumination ${rumDrop}% below baseline` }); }

  if (current.tempTrend === 'elevated' || (current.temperatureCelsius && current.temperatureCelsius > 39.5)) {
    score += 2;
    reasons.push({ type: 'clinical', text: 'Temperature trend elevated over recent readings' });
  }

  if (current.social === 'recumbent') {
    score += 4;
    reasons.push({ type: 'behavior', text: 'Recumbency detected — urgent' });
  } else if (current.social === 'isolating') {
    score += 1;
    reasons.push({ type: 'behavior', text: 'Isolation / reduced social behaviour observed' });
  }

  if (current.lameness) { score += 2; reasons.push({ type: 'camera', text: 'Gait abnormality / lameness detected' }); }
  if (current.nasal_discharge) { score += 1; reasons.push({ type: 'camera', text: 'Nasal/ocular discharge visible' }); }
  if (current.skin_lesions) { score += 2; reasons.push({ type: 'camera', text: 'Skin lesions / nodules visible' }); }
  if (current.abortion_event) { score += 3; reasons.push({ type: 'farmer', text: 'Abortion/reproductive event reported' }); }

  if (isMonsoon) {
    score = Math.round(score * 1.3);
    if (score > 0) reasons.push({ type: 'epidemiological', text: 'Monsoon season — elevated environmental risk for vector/water-borne diseases' });
  }

  if (isExposed) {
    score += 2;
    reasons.push({ type: 'epidemiological', text: 'Potential exposure contact detected in proximity network' });
  }

  return { score, reasons };
}
