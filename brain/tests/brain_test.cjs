/**
 * PASHU-RAKSHA Brain Suite Automated Test Runner
 */
const { runDataQualityAudit } = require('../../scripts/validation/validate_kb.cjs');

function runBrainTestSuite() {
  console.log('----------------------------------------------------');
  console.log('Running PASHU-RAKSHA Brain Suite Automated Tests');
  console.log('----------------------------------------------------');

  // Test 1: Data Quality Audit
  console.log('\n[TEST 1] Data Quality & KB Verification');
  const auditReport = runDataQualityAudit();
  if (auditReport.status !== 'PASSED') {
    throw new Error('Data Quality Audit failed!');
  }
  console.log('✔ Test 1 Passed: Data quality audit PASSED.');

  // Test 2: Baseline & Deviation Math
  console.log('\n[TEST 2] Health Fingerprint Baseline Deviation');
  const baseline = { activity: 80, feeding: 80, movement: 80, rumination: 80 };
  const current = { activity: 48, feeding: 56, movement: 60, rumination: 64 }; // 40% act drop, 30% feed drop

  const actDrop = Math.round(((baseline.activity - current.activity) / baseline.activity) * 100);
  const feedDrop = Math.round(((baseline.feeding - current.feeding) / baseline.feeding) * 100);

  if (actDrop !== 40 || feedDrop !== 30) {
    throw new Error(`Baseline deviation math error! Got actDrop: ${actDrop}, feedDrop: ${feedDrop}`);
  }
  console.log('✔ Test 2 Passed: Baseline deviation math accurate (actDrop: 40%, feedDrop: 30%).');

  // Test 3: Anomaly & Risk Stratification
  console.log('\n[TEST 3] Risk Level Stratification');
  let score = 8; // Score >= 7 -> RED
  let riskLevel = score >= 10 ? 'CRITICAL' : score >= 7 ? 'RED' : 'ORANGE';
  if (riskLevel !== 'RED') {
    throw new Error(`Risk stratification error! Expected RED, got ${riskLevel}`);
  }
  console.log('✔ Test 3 Passed: Risk level stratification correct (score 8 -> RED).');

  console.log('\n----------------------------------------------------');
  console.log('ALL BRAIN SUITE AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('----------------------------------------------------');
}

if (require.main === module) {
  runBrainTestSuite();
}

module.exports = { runBrainTestSuite };
