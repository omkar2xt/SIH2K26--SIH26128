export function calculateBaselineDeviation(current, baseline) {
  let actDrop = 0, feedDrop = 0, moveDrop = 0, rumDrop = 0;
  if (baseline) {
    if (baseline.activity > 0) actDrop = Math.max(0, ((baseline.activity - current.activity) / baseline.activity) * 100);
    if (baseline.feeding > 0) feedDrop = Math.max(0, ((baseline.feeding - current.feeding) / baseline.feeding) * 100);
    if (baseline.movement > 0) moveDrop = Math.max(0, ((baseline.movement - current.movement) / baseline.movement) * 100);
    if (baseline.rumination && current.rumination && baseline.rumination > 0) {
      rumDrop = Math.max(0, ((baseline.rumination - current.rumination) / baseline.rumination) * 100);
    }
  }
  return { actDrop, feedDrop, moveDrop, rumDrop };
}

export function runRuleEngine(animal, db) {
  let score = 0;
  let reasons = [];
  
  const { actDrop, feedDrop, moveDrop, rumDrop } = calculateBaselineDeviation(animal.current, animal.baseline);
  
  if (actDrop >= 40) { score += 3; reasons.push({ type: 'clinical', text: `Activity ${Math.round(actDrop)}% below personal baseline` }); }
  else if (actDrop >= 20) { score += 1; reasons.push({ type: 'clinical', text: `Activity ${Math.round(actDrop)}% below personal baseline` }); }
  
  if (feedDrop >= 30) { score += 2; reasons.push({ type: 'clinical', text: `Feeding ${Math.round(feedDrop)}% below baseline` }); }
  if (rumDrop >= 30) { score += 2; reasons.push({ type: 'clinical', text: `Rumination ${Math.round(rumDrop)}% below baseline` }); }
  
  if (animal.current.tempTrend === "elevated") { score += 2; reasons.push({ type: 'clinical', text: "Temperature trend elevated" }); }
  if (animal.current.social === "isolating") { score += 1; reasons.push({ type: 'behavior', text: "Isolation behavior observed" }); }
  if (animal.current.social === "recumbent") { score += 3; reasons.push({ type: 'behavior', text: "Recumbency detected" }); }

  // Check exposure
  const exposed = db.exposureEvents?.some(e => e.targetId === animal.id || e.sourceId === animal.id);
  if (exposed) { score += 2; reasons.push({ type: 'epidemiological', text: "Exposure context detected in network" }); }

  // Determine health risk level
  let healthRiskLevel = "GREEN";
  if (score >= 6) healthRiskLevel = "CRITICAL";
  else if (score >= 4) healthRiskLevel = "RED";
  else if (score >= 2) healthRiskLevel = "ORANGE";
  else if (score >= 1) healthRiskLevel = "YELLOW";

  const healthAbnormality = score === 0 ? "NONE" : score >= 4 ? "SEVERE" : "MILD";

  // Check species-linked disease evidence
  let diseaseRisks = db.diseaseSpecies
    .filter(mapping => mapping.speciesId === animal.speciesId)
    .map(mapping => {
      const disease = db.diseases.find(d => d.id === mapping.diseaseId);
      return {
        disease,
        evidence: mapping.evidence,
        risk: (healthAbnormality !== "NONE") ? "Elevated" : "Baseline"
      };
    })
    .slice(0, 3);

  if (diseaseRisks.length > 0 && healthAbnormality !== "NONE") {
    reasons.push({ type: 'epidemiological', text: "Species-linked disease evidence exists for observed abnormalities" });
  }

  let recommendedAction = "Continue routine monitoring.";
  if (healthRiskLevel === "CRITICAL" || healthRiskLevel === "RED") {
    recommendedAction = "Immediate veterinary review recommended. Laboratory confirmation required for diagnosis.";
  } else if (healthRiskLevel === "ORANGE" || healthRiskLevel === "YELLOW") {
    recommendedAction = "Field verification recommended.";
  }

  return {
    healthAbnormality,
    healthRiskLevel,
    diseaseRisks,
    confidence: score > 0 ? "High" : "N/A",
    urgency: healthRiskLevel,
    score,
    reasons,
    recommendedAction
  };
}
