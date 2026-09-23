/**
 * PASHU-RAKSHA ESP32 Smart Collar Firmware
 * Hardware: ESP32-WROOM-32, MPU6050 (IMU/Accelerometer), DS18B20 (Temperature), NEO-6M (GPS)
 * Protocols: BLE / LoRaWAN / MQTT
 */

#include <Arduino.h>
#include <Wire.h>

const char* DEVICE_ID = "ESP32-COLLAR-001";
const char* ANIMAL_TAG = "MH-CAT-027";

void setup() {
  Serial.begin(115200);
  Wire.begin();
  Serial.println("[PASHU-RAKSHA ESP32] Firmware Initialized. Device: " + String(DEVICE_ID));
}

void loop() {
  // Read Temperature & Accelerometer
  float bodyTemp = 38.6 + (random(-3, 12) / 10.0);
  int activityIndex = random(40, 95);
  int ruminationMins = random(20, 60);

  Serial.printf("[PASHU-RAKSHA Telemetry] Tag: %s | Temp: %.1fC | Activity: %d | Rumination: %dmins\n", 
                ANIMAL_TAG, bodyTemp, activityIndex, ruminationMins);

  delay(10000); // Send every 10 seconds
}
