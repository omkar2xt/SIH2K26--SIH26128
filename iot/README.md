# PASHU-RAKSHA IoT Hardware Architecture

## Overview
The IoT subsystem provides real-time, high-frequency physical telemetry for livestock monitoring (activity, feeding, movement, rumination, skin/ear temperature, and GPS coordinates).

## Architecture
```
[Animal Sensors] -> [ESP32 Smart Collar] -> (BLE / LoRa) -> [Raspberry Pi Gateway] -> (MQTT / HTTPS) -> [PASHU-RAKSHA Backend API]
```

## Data Flags
All incoming sensor data is stamped with `dataSource`:
- `REAL_SENSOR` — Direct hardware reading from validated ESP32/LoRa collar.
- `SIMULATOR` — Synthetic observation generated for demonstration or stress testing.

## Files
- `firmware/esp32/main.cpp`: ESP32 C++ firmware sketch.
- `gateway/raspberry-pi/gateway.py`: Edge gateway telemetry collector.
- `sensor-simulator/simulator.js`: Synthetic hardware data stream generator.
