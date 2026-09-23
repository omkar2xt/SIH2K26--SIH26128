export function calculateConfidence(observationCount: number): 'High' | 'Moderate' | 'Low' | 'N/A' {
  if (observationCount >= 7) return 'High';
  if (observationCount >= 3) return 'Moderate';
  if (observationCount >= 1) return 'Low';
  return 'N/A';
}
