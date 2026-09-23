/**
 * PASHU-RAKSHA Hardware Sensor Telemetry Simulator
 * Posts synthetic observation streams to backend API with dataSource: "SIMULATOR"
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:3000/api/observations';

async function sendSyntheticTelemetry(animalId = 'MH-CAT-027', dropSeverity = 'NONE') {
  let act = 80, feed = 80, move = 80, rum = 80, temp = 38.5;

  if (dropSeverity === 'MILD') {
    act = 60; feed = 65; temp = 39.1;
  } else if (dropSeverity === 'SEVERE') {
    act = 35; feed = 40; move = 30; rum = 25; temp = 40.2;
  }

  const payload = {
    animalId,
    dataSource: 'SIMULATOR',
    timestamp: new Date().toISOString(),
    activityLevel: act,
    feedingMinutes: feed,
    movementMeters: move,
    ruminationMinutes: rum,
    temperatureCelsius: temp,
    notes: `Simulated stream (${dropSeverity} deviation)`
  };

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    console.log('[IoT Simulator] Telemetry sent successfully:', result.id);
  } catch (err) {
    console.error('[IoT Simulator] Error sending telemetry:', err.message);
  }
}

if (require.main === module) {
  console.log('[PASHU-RAKSHA IoT Simulator] Running continuous simulation stream...');
  setInterval(() => sendSyntheticTelemetry('MH-CAT-027', 'MILD'), 15000);
}

module.exports = { sendSyntheticTelemetry };
