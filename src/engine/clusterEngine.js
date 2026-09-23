/**
 * PASHU-RAKSHA Cluster Engine — Adapter
 * Delegates spatial-temporal cluster detection to unified brain/exposure module.
 */
import { runClusterEngine as brainClusterEngine } from '../../brain/exposure/cluster-engine.ts';

export function runClusterEngine(db) {
  return brainClusterEngine(db);
}
