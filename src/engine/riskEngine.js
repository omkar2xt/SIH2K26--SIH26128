import { evaluateAnimal } from "./ruleEngine.js";

export function aggregateFarmRisk(animals) {
  let highCount = 0;
  let mediumCount = 0;

  animals.forEach(a => {
    const evalResult = evaluateAnimal(a);
    if (evalResult.riskLevel === "RED" || evalResult.riskLevel === "CRITICAL") highCount++;
    else if (evalResult.riskLevel === "ORANGE") mediumCount++;
  });

  if (highCount > 2) return "RED";
  if (highCount > 0 || mediumCount > 3) return "ORANGE";
  if (mediumCount > 0) return "YELLOW";
  return "GREEN";
}

export function aggregateDistrictRisk(farmsRiskLevels) {
  if (farmsRiskLevels.includes("RED")) return "RED";
  if (farmsRiskLevels.includes("ORANGE")) return "ORANGE";
  if (farmsRiskLevels.includes("YELLOW")) return "YELLOW";
  return "GREEN";
}
