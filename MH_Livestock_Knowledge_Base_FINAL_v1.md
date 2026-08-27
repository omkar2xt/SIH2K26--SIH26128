# Maharashtra Livestock Disease Knowledge Base — FINAL v1.0

## Purpose

Maharashtra-specific livestock-health knowledge layer for an AI-assisted early-warning system.

The system uses this knowledge base together with live animal observations. AI performs anomaly/risk stratification and escalation; it does not provide autonomous veterinary diagnosis or treatment.

---

# 1. Final Scope

| Item | Final |
|---|---:|
| Species/groups | 16 |
| Priority breed/type subset | 20 |
| Priority diseases | 16 |
| Disease-species associations | 33 |
| Original flattened records | REC_01–REC_26 |
| Added flattened records | REC_27–REC_33 |
| Total flattened records represented | 33 |
| Diseases with species mapping | 16/16 |

The 20 breeds/types are a **Maharashtra priority breed/type subset**, not an exhaustive statewide breed inventory.

---

# 2. Species Master

| species_id | species | species_group | Maharashtra relevance |
|---|---|---|---|
| SP_01 | Cattle | Bovine | High |
| SP_02 | Buffalo | Bovine | High |
| SP_03 | Goat | Caprine | High |
| SP_04 | Sheep | Ovine | High |
| SP_05 | Pig | Porcine | Medium |
| SP_06 | Horse | Equine | Medium |
| SP_07 | Donkey | Equine | Medium |
| SP_08 | Pony | Equine | Low |
| SP_09 | Mule | Equine | Low |
| SP_10 | Camel | Camelid | Low |
| SP_11 | Rabbit | Lagomorph | Low |
| SP_12 | Chicken | Poultry | High |
| SP_13 | Duck | Poultry | Medium |
| SP_14 | Turkey | Poultry | Low |
| SP_15 | Quail | Poultry | Low |
| SP_16 | Other poultry | Poultry | Low |

---

# 3. Maharashtra Priority Breed/Type Subset

| breed_id | species_id | breed/type | breed_type | registration/source status |
|---|---|---|---|---|
| BR_01 | SP_01 | Khillar | Indigenous | Registered |
| BR_02 | SP_01 | Deoni | Indigenous | Registered |
| BR_03 | SP_01 | Dangi | Indigenous | Registered |
| BR_04 | SP_01 | Red Kandhari | Indigenous | Registered |
| BR_05 | SP_01 | Gaolao | Indigenous | Registered |
| BR_06 | SP_01 | Kathani | Indigenous | Registered |
| BR_07 | SP_01 | Konkan Kapila | Indigenous | Registered |
| BR_08 | SP_01 | Umarda | Indigenous | ICAR-NBAGR accession verified |
| BR_09 | SP_02 | Pandharpuri | Indigenous | Registered |
| BR_10 | SP_02 | Nagpuri | Indigenous | Registered |
| BR_11 | SP_02 | Marathwadi | Indigenous | Registered |
| BR_12 | SP_02 | Purnathadi | Indigenous | Registered |
| BR_13 | SP_02 | Melghati | Indigenous | Registered |
| BR_14 | SP_03 | Osmanabadi | Indigenous | Registered |
| BR_15 | SP_03 | Sangamneri | Indigenous | Registered |
| BR_16 | SP_03 | Berari | Indigenous | Registered |
| BR_17 | SP_03 | Konkan Kanyal | Indigenous | Registered |
| BR_18 | SP_04 | Madgyal | Indigenous | ICAR-NBAGR accession verified |
| BR_19 | SP_04 | Deccani | Indigenous | ICAR-NBAGR register verified |
| BR_20 | SP_06 | Bhimthadi | Indigenous | Registered |

### Current accession updates

- BR_08 Umarda: `INDIA_CATTLE_1100_UMARDA_03059`
- BR_18 Madgyal: `INDIA_SHEEP_1108_MADGYAL_14049`
- BR_19 Deccani: `INDIA_SHEEP_0111_DECCANI_14021`

The accession updates reflect the source set supplied for the current revision.

---

# 4. Disease Master

| disease_id | disease | pathogen | type/category | zoonotic | notifiable/status in source |
|---|---|---|---|---|---|
| DIS_01 | Foot and Mouth Disease | Aphthovirus | Viral / Infectious | No | Yes |
| DIS_02 | Haemorrhagic Septicaemia | Pasteurella multocida | Bacterial / Infectious | No | Yes |
| DIS_03 | Lumpy Skin Disease | Capripoxvirus | Viral / Infectious | No | Yes |
| DIS_04 | Brucellosis | Brucella abortus | Bacterial / Infectious | Yes | Yes |
| DIS_05 | Leptospirosis | Leptospira spp. | Bacterial / Infectious | Yes | No |
| DIS_06 | Peste des petits ruminants | Morbillivirus | Viral / Infectious | No | Yes |
| DIS_07 | Glanders | Burkholderia mallei | Bacterial / Infectious | Yes | Yes |
| DIS_08 | African Swine Fever | Asfivirus | Viral / Infectious | No | Yes |
| DIS_09 | Rabies | Lyssavirus | Viral / Infectious | Yes | Yes |
| DIS_10 | Black Quarter | Clostridium chauvoei | Bacterial / Infectious | No | Yes |
| DIS_11 | Anthrax | Bacillus anthracis | Bacterial / Infectious | Yes | Yes |
| DIS_12 | Japanese Encephalitis | Flavivirus | Viral / Vector-borne | Yes | Yes |
| DIS_13 | Babesiosis | Babesia spp. | Parasitic / Vector-borne | No | No |
| DIS_14 | Theileriosis | Theileria spp. | Parasitic / Vector-borne | No | No |
| DIS_15 | Trypanosomiasis (Surra) | Trypanosoma evansi | Parasitic / Vector-borne | No | No |
| DIS_16 | Enterotoxaemia | Clostridium perfringens | Bacterial / Infectious | No | No |

---

# 5. Final Disease–Species Mapping

Existing 26 associations are retained, plus 7 new evidence-supported associations.

| disease_id | species | breed/type | Maharashtra evidence |
|---|---|---|---|
| DIS_01 | Cattle | All | Confirmed |
| DIS_01 | Buffalo | All | Confirmed |
| DIS_01 | Goat | All | Confirmed |
| DIS_01 | Sheep | All | Confirmed |
| DIS_01 | Pig | All | Confirmed |
| DIS_02 | Cattle | All | Confirmed |
| DIS_02 | Buffalo | All | Confirmed |
| DIS_03 | Cattle | All | Confirmed |
| DIS_03 | Buffalo | All | Confirmed |
| DIS_04 | Cattle | All | Confirmed |
| DIS_04 | Buffalo | All | Confirmed |
| DIS_05 | Cattle | All | Confirmed |
| DIS_05 | Buffalo | All | Confirmed |
| DIS_06 | Goat | All | Confirmed |
| DIS_06 | Sheep | All | Confirmed |
| DIS_07 | Horse | Bhimthadi / All | Confirmed |
| DIS_07 | Donkey | All | Confirmed |
| DIS_07 | Pony | All | Confirmed |
| DIS_07 | Mule | All | Confirmed |
| DIS_08 | Pig | All | Confirmed |
| DIS_09 | Cattle | All | Confirmed |
| DIS_09 | Buffalo | All | Confirmed |
| DIS_10 | Cattle | All | Confirmed |
| DIS_11 | Cattle | All | Confirmed |
| DIS_11 | Sheep | All | Confirmed |
| DIS_12 | Pig | All | Confirmed |
| DIS_13 | Cattle | Indigenous / crossbred | Confirmed in supplied evidence set |
| DIS_13 | Buffalo | All | Confirmed in supplied evidence set |
| DIS_14 | Cattle | Indigenous / crossbred | Confirmed in supplied evidence set |
| DIS_14 | Buffalo | All | Confirmed in supplied evidence set |
| DIS_15 | Cattle | All | India-relevant; Maharashtra-specific animal-level evidence not established |
| DIS_15 | Buffalo | All | India-relevant; Maharashtra-specific evidence not established |
| DIS_15 | Horse / Equine | All | India-relevant; Maharashtra-specific evidence not established |

**Total: 33 disease-species associations.**

---

# 6. New Disease-Species Records Added in Final Revision

## DIS_13 — Babesiosis

### Cattle
- Exposure: tick-borne
- Diagnosis in supplied evidence: Giemsa-stained blood smear; PCR; IFAT/ELISA
- Control: tick control / integrated acaricide management
- Vaccine: no commercial vaccine in India in the consulted source set
- Maharashtra status: confirmed in supplied evidence set

### Buffalo
- Exposure: tick-borne
- Diagnosis: Giemsa-stained blood smear; PCR
- Control: tick control
- Vaccine: no commercial vaccine in India in the consulted source set
- Maharashtra status: confirmed in supplied evidence set

## DIS_14 — Theileriosis

### Cattle
- Exposure: tick-borne, including Hyalomma anatolicum in the supplied evidence
- Diagnosis: Giemsa-stained blood smear; PCR; Plate/Dot-ELISA
- Control: tick control
- Vaccine/control reference: Raksha Vac-T in supplied evidence
- Treatment reference in supplied evidence: buparvaquone
- Maharashtra status: confirmed in supplied evidence set

### Buffalo
- Exposure: tick-borne
- Diagnosis: Giemsa-stained blood smear; PCR
- Control: tick control
- Vaccine efficacy in buffalo: not established in the supplied evidence set
- Maharashtra status: confirmed in supplied evidence set

## DIS_15 — Trypanosomiasis (Surra)

### Cattle
- Exposure: mechanically transmitted by biting flies, including Tabanidae
- Diagnosis in supplied evidence: Giemsa-stained thin blood smear; CATT/T. evansi; PCR
- Control/treatment information in supplied evidence: trypanocidal drug classes; no vaccine because of antigenic variation
- Maharashtra status: India-relevant; Maharashtra-specific animal-level evidence not established

### Buffalo
- Exposure: mechanically transmitted by biting flies
- Diagnosis: Giemsa-stained thin blood smear; CATT/T. evansi; PCR
- Maharashtra status: India-relevant; Maharashtra-specific evidence not established

### Horse/equine
- Exposure: mechanically transmitted by biting flies
- Diagnosis: Giemsa-stained thin blood smear; CATT/T. evansi; PCR
- Clinical concern: disease can be fatal in horses
- Maharashtra status: India-relevant; Maharashtra-specific evidence not established

---

# 7. Final Transmission / Exposure Matrix

| Disease | Primary exposure |
|---|---|
| DIS_01 FMD | Direct contact / fomites / livestock movement |
| DIS_02 HS | Indirect environmental / shared water |
| DIS_03 LSD | Vector-borne insects |
| DIS_04 Brucellosis | Direct contact; exact additional risk factors not established |
| DIS_05 Leptospirosis | Environmental/water |
| DIS_06 PPR | Direct contact / grazing / movement |
| DIS_07 Glanders | Shared feed/water / equine congregation |
| DIS_08 ASF | Fomites / direct contact / wild-boar interface |
| DIS_09 Rabies | Bites / wildlife-dog exposure |
| DIS_10 Black Quarter | Soil/environmental spores |
| DIS_11 Anthrax | Soil/environmental spores |
| DIS_12 JE | Mosquito-borne; pigs as amplifying host |
| DIS_13 Babesiosis | Tick-borne |
| DIS_14 Theileriosis | Tick-borne |
| DIS_15 Trypanosomiasis | Mechanical transmission by biting flies |
| DIS_16 Enterotoxaemia | Abrupt diet/feed change |

---

# 8. Final Diagnostics Status

All 16 diseases have a diagnostic row.

Where a specific test/sample was not established in the consulted source set, the field remains:

**Not established in consulted source.**

Documented examples include:
- Brucellosis → Milk Ring Test / ELISA
- PPR → c-ELISA / s-ELISA
- Glanders → Complement Fixation Test
- ASF → Real-time PCR
- Babesiosis → blood smear / PCR / IFAT/ELISA
- Theileriosis → blood smear / PCR / Plate/Dot-ELISA
- Trypanosomiasis → blood smear / CATT/T. evansi / PCR

AI output remains risk/triage only.

---

# 9. Final Prevention / Control Status

All 16 diseases have a prevention/control row.

The supplied evidence explicitly documents:
- PPR → mass vaccination, isolation, herd/ring vaccination
- Glanders → disinfection, surveillance/infected zones, statutory containment
- ASF → strict biosecurity, regional restrictions, containment/culling
- Babesiosis → tick control
- Theileriosis → tick control and supplied Raksha Vac-T reference
- Trypanosomiasis → trypanocidal control classes; no vaccine in supplied evidence set

For the remaining diseases, fields remain **Not established in consulted source** where the current evidence set does not support a specific recommendation.

---

# 10. Final Maharashtra Evidence Classification

| Status | Count |
|---|---:|
| Confirmed in supplied Maharashtra evidence | 9 |
| India-relevant; Maharashtra-specific evidence not established | 5 |
| Insufficient Maharashtra-specific evidence | 2 |
| Total diseases | 16 |

**Do not treat “India-relevant” as “confirmed Maharashtra occurrence.”**

---

# 11. Camera / IoT Interpretation

Camera and IoT signals are **supporting early-warning features**, not disease diagnoses.

Examples already established in the knowledge layer:

- FMD → gait/lameness
- HS → recumbency/activity
- LSD → visible nodules
- PPR → discharge/isolation
- Glanders → nasal/respiratory signs
- ASF → huddling/activity/temperature
- Babesiosis / Theileriosis → activity/temperature-related abnormality may contribute to risk
- Trypanosomiasis → activity/body-condition signals may be supportive, but disease-specific automated detection is not established

Do not convert these features directly into confirmed disease labels.

---

# 12. Final Machine-Readable Record Convention

One row = one disease × species association.

Key fields:

```text
record_id
state
species
breed
breed_type
disease
pathogen
pathogen_type
category
zoonotic
notifiable_status
incubation
transmission
exposure_types
seasonality
environmental_risk
early_symptoms
behavioral_signs
physical_signs
physiological_signs
mortality
productivity_impact
camera_signals
camera_detectability_class
iot_signals
iot_detectability_class
farmer_signals
diagnostics
sample
vaccination
prevention
control
containment
ai_features
surveillance_priority
Maharashtra_evidence
sources
```

The original records REC_01–REC_26 remain unchanged from the supplied Phase-1 base. The new records are REC_27–REC_33.

---

# 13. Final Counts

| Metric | Final |
|---|---:|
| Species/groups | 16 |
| Priority breeds/types | 20 |
| Diseases | 16 |
| Disease-species associations | 33 |
| Original flattened records | 26 |
| New flattened records | 7 |
| Final flattened records | 33 |
| Diseases with species mapping | 16/16 |
| Transmission rows | 16/16 |
| Diagnostic rows | 16/16 |
| Prevention/control rows | 16/16 |
| Geography/evidence rows | 16/16 |

---

# 14. Phase Status

## PHASE 1 — COMPLETE WITH DOCUMENTED GAPS

The knowledge layer is structurally complete for the selected 16-disease priority scope and now includes species mappings for all 16 diseases.

Documented limitations:
- some disease-specific diagnostic details remain unavailable in the consulted source set
- some prevention/control fields remain unavailable in the consulted source set
- the breed master is a priority subset, not an exhaustive Maharashtra breed inventory
- some diseases lack Maharashtra-specific animal-level evidence

## PHASE 2 — AUDIT PASS WITH DOCUMENTED GAPS

The structural blocker from DIS_13/DIS_14/DIS_15 has been addressed by the supplied correction set.

## PHASE 3 — READY

The database can now be used as the **knowledge/reference layer** for designing:
- individual animal baselines
- anomaly detection
- camera/IoT feature fusion
- disease-risk scoring
- exposure-risk analysis
- GIS/outbreak analytics
- veterinary alerting

It is NOT itself the ML training dataset.
