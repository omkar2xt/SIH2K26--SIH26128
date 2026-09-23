/**
 * PASHU-RAKSHA Exposure Engine — Adapter
 * Delegates exposure calculation to unified brain/exposure module.
 */
import { runExposureEngine as brainExposureEngine, getAnimalExposures as brainGetExposures } from '../../brain/exposure/proximity-engine.ts';

export function runExposureEngine(db) {
  return brainExposureEngine(db);
}

export function getAnimalExposures(animalId, db) {
  return brainGetExposures(animalId, db);
}
