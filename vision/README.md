# PASHU-RAKSHA Computer Vision Pipeline Architecture

## Overview
The Computer Vision subsystem processes farm RTSP/IP camera feeds to extract non-invasive physical behavioral signals (gait abnormalities/lameness, posture changes/recumbency, social isolation, and visible skin lesions).

## Implementation Status
> [!IMPORTANT]
> - **Gait & Posture Pipeline:** PLANNED / REQUIRES_FIELD_VALIDATION
> - **Lesion Detection:** PLANNED / REQUIRES_FIELD_VALIDATION
> - **Camera Signal Integration:** Operational in Evidence Fusion Engine via `CameraObservation` telemetry flags.

## Core Disclaimer
Camera signals contribute evidence scores to the risk stratification engine; they DO NOT autonomously diagnose disease.

## Files
- `camera/rtsp_ingest.py`: Video stream ingestion handler.
- `detection/animal_detector.py`: YoloV8 posture & gait signal extraction blueprint.
