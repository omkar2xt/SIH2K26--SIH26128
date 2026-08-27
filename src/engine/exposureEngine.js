export function calculateExposureRisk(sourceAnimal, targetAnimal, exposureEvent, db) {
  let riskScore = 0;
  let reasons = [];

  // Duration
  if (exposureEvent.duration > 10) { riskScore += 2; reasons.push("Prolonged contact duration (>10 hours)"); }
  else if (exposureEvent.duration > 2) { riskScore += 1; reasons.push("Moderate contact duration"); }

  // Distance (physical proximity)
  if (exposureEvent.distance < 5) { riskScore += 2; reasons.push("High physical proximity (<5 meters)"); }
  
  // Frequency
  if (exposureEvent.contacts >= 3) { riskScore += 1; reasons.push("Multiple contact events"); }

  // Species compatibility
  if (sourceAnimal.speciesId === targetAnimal.speciesId) {
    riskScore += 2; reasons.push("Same-species transmission risk");
  }

  // Determine risk level based on score
  let risk = "LOW";
  if (riskScore >= 5) risk = "HIGH";
  else if (riskScore >= 3) risk = "MEDIUM";

  let recommendedAction = "Routine monitoring.";
  if (risk === "HIGH") recommendedAction = "Quarantine recommended and monitor for clinical signs.";

  return {
    risk,
    riskScore,
    reasons,
    evidence: "Based on recorded contact parameters and species compatibility.",
    recommendedAction
  };
}

export function runExposureEngine(db) {
  // Returns updated exposure events with calculated risks
  return (db.exposureEvents || []).map(event => {
    const source = db.animals.find(a => a.id === event.sourceId);
    const target = db.animals.find(a => a.id === event.targetId);
    if (!source || !target) return event;
    const calc = calculateExposureRisk(source, target, event, db);
    return { ...event, ...calc };
  });
}
