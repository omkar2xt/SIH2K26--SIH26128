# Maharashtra Livestock Disease KB — Phase 1 Fix + Phase 2 Audit

---

## A. CORRECTED TABLE 6 — Transmission / Exposure (16/16)

| disease_id | exposure_type | relevance | risk_factor | source |
|---|---|---|---|---|
| DIS_01 FMD | Direct contact / Fomites | High | Livestock movement, congregation at markets/fairs, contaminated fomites | 13 |
| DIS_02 HS | Indirect environmental | High | Monsoon season, shared water troughs | 13 |
| DIS_03 LSD | Vector-borne | High | Insect vectors, post-monsoon humidity | 13 |
| DIS_04 Brucellosis | Direct contact | High | Not established in consulted source | 9 |
| DIS_05 Leptospirosis | Environmental/Water | High | Contaminated stagnant water, coastal marshy land | 8 |
| DIS_06 PPR | Direct contact | High | Shared grazing, livestock movement, markets | 15 |
| DIS_07 Glanders | Shared feed/water | High | Fairs, yatras, working-equine migration routes | 11 |
| DIS_08 ASF | Fomites/Direct | High | Contaminated feed, direct contact, wild-boar interface | 17 |
| DIS_09 Rabies | Bites | High | Exposure to stray dogs/wildlife | 10 |
| DIS_10 Black Quarter | Environmental | High | Soil-borne spores, monsoon season | 13 |
| DIS_11 Anthrax | Environmental | High | Soil-borne spores, monsoon soil moisture | 13 |
| DIS_12 JE | Vector-borne | High | Mosquitoes; pigs act as amplifying host | 8 |
| DIS_13 Babesiosis | Vector-borne (tick) | High | Post-monsoon tick population growth | 13 |
| DIS_14 Theileriosis | Vector-borne (tick) | High | Post-monsoon tick population growth | 13 |
| DIS_15 Trypanosomiasis | Vector-borne | Medium | Not established in consulted source (specific vector) | 13 |
| DIS_16 Enterotoxaemia | Nutritional | High | Abrupt feed/diet change, summer season | 13 |

---

## A. CORRECTED TABLE 7 — Diagnostics (16/16)

Only DIS_04, 06, 07, 08 had documented tests in the consulted sources. All other diseases are marked per the general rule stated in source 9 ("all sixteen diseases mandate definitive laboratory confirmation") — specific sample/test data was **not invented**.

| disease_id | sample_type | diagnostic_test | confirmation_required | source |
|---|---|---|---|---|
| DIS_01 FMD | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_02 HS | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_03 LSD | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_04 Brucellosis | Milk/Serum | Milk Ring Test, ELISA | Yes | 9 |
| DIS_05 Leptospirosis | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_06 PPR | Serum | c-ELISA, s-ELISA | Yes | 15 |
| DIS_07 Glanders | Serum | Complement Fixation Test (CFT) | Yes | 11 |
| DIS_08 ASF | Tissue/Blood | Real-time PCR | Yes | 17 |
| DIS_09 Rabies | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_10 Black Quarter | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_11 Anthrax | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_12 JE | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_13 Babesiosis | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_14 Theileriosis | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_15 Trypanosomiasis | Not established in consulted source | Not established in consulted source | Yes | 9 |
| DIS_16 Enterotoxaemia | Not established in consulted source | Not established in consulted source | Yes | 9 |

---

## A. CORRECTED TABLE 8 — Prevention / Control (16/16)

| disease_id | vaccination | biosecurity | movement_control | treatment_control | containment | source |
|---|---|---|---|---|---|---|
| DIS_01 FMD | Not established | Not established | Not established | Not established | Not established | — |
| DIS_02 HS | Not established | Not established | Not established | Not established | Not established | — |
| DIS_03 LSD | Not established | Not established | Not established | Not established | Not established | — |
| DIS_04 Brucellosis | Not established | Not established | Not established | Not established | Not established | — |
| DIS_05 Leptospirosis | Not established | Not established | Not established | Not established | Not established | — |
| DIS_06 PPR | Mass vaccination | Isolation of sick | Herd isolation | Not established | Ring vaccination | 15 |
| DIS_07 Glanders | None available | Disinfection of gear | 2–10 km surveillance zone | None (euthanasia) | 2 km infected zone | 24 |
| DIS_08 ASF | Live attenuated (ICAR) | Strict biosecurity | Strict regional block | None | Complete culling | 17 |
| DIS_09 Rabies | Not established | Not established | Not established | Not established | Not established | — |
| DIS_10 Black Quarter | Not established | Not established | Not established | Not established | Not established | — |
| DIS_11 Anthrax | Not established | Not established | Not established | Not established | Not established | — |
| DIS_12 JE | Not established | Not established | Not established | Not established | Not established | — |
| DIS_13 Babesiosis | Not established | Not established | Not established | Not established | Not established | — |
| DIS_14 Theileriosis | Not established | Not established | Not established | Not established | Not established | — |
| DIS_15 Trypanosomiasis | Not established | Not established | Not established | Not established | Not established | — |
| DIS_16 Enterotoxaemia | Not established | Not established | Not established | Not established | Not established | — |

---

## A. CORRECTED TABLE 9 — Maharashtra Geography / Evidence (16/16)

Evidence status now uses the three-tier scale required by the master prompt. **This corrects the earlier report's claim of "16/16 confirmed," which was over-stated.**

| disease_id | state | district | region | season | environmental_factor | evidence_status | source |
|---|---|---|---|---|---|---|---|
| DIS_01 FMD | MH | Not established | Not established | Not established | Not established | India-relevant; MH-specific evidence not established | 13 |
| DIS_02 HS | MH | All | All | Monsoon, Post-monsoon | High vapour pressure | Confirmed | 13 |
| DIS_03 LSD | MH | All | All | Post-monsoon | Humidity (vector growth) | Confirmed | 13 |
| DIS_04 Brucellosis | MH | Not established | Not established | Not established | Not established | Insufficient evidence | 9 |
| DIS_05 Leptospirosis | MH | Coastal | Konkan | Monsoon | Marshy waterlogged land | Confirmed | 8 |
| DIS_06 PPR | MH | All | All | All | Not established | Confirmed | 15 |
| DIS_07 Glanders | MH | Not established | Not established | Not established | Not established | India-relevant; MH-specific evidence not established | 11 |
| DIS_08 ASF | MH | Not established | Statewide | Not established | Not established | Confirmed (statewide incursion) | 17,18 |
| DIS_09 Rabies | MH | Not established | Not established | Not established | Not established | India-relevant; MH-specific evidence not established | 10 |
| DIS_10 Black Quarter | MH | All | All | Monsoon | Soil moisture | Confirmed | 14 |
| DIS_11 Anthrax | MH | All | All | Monsoon | Soil moisture | Confirmed | 13 |
| DIS_12 JE | MH | Not established | Not established | Not established | Not established | India-relevant; MH-specific evidence not established | 8 |
| DIS_13 Babesiosis | MH | All | All | Post-monsoon | Tick population growth | Confirmed | 13 |
| DIS_14 Theileriosis | MH | All | All | Post-monsoon | Tick population growth | Confirmed | 13 |
| DIS_15 Trypanosomiasis | MH | Not established | Not established | Not established | Not established | Insufficient evidence | — |
| DIS_16 Enterotoxaemia | MH | Not established | Not established | Summer | Diet shift | Insufficient evidence | 13 |

**Evidence tally:** Confirmed = 9 · India-relevant/MH-not-established = 5 · Insufficient = 2

---

## B. CORRECTED BREED MASTER (scope change only — no new breeds added)

Scope label changed from implied "Maharashtra breeds" to:
**"Maharashtra priority breed/type subset (20 records, verified entries only)"**

Flagged for weak sourcing (no ICAR-NBAGR accession confirmed in consulted sources):
- BR_08 Umarda — source is a current-affairs digest (Dhyeya IAS), not a primary ICAR-NBAGR record
- BR_18 Madgyal — no accession number available
- BR_19 Deccani — no accession number available

No breed was added or removed; all three remain listed but downgraded from "verified accession" to "verified breed name, accession not established in consulted source."

---

## C. FLATTENED RECORDS — changes

No REC_01–REC_26 values contradict the corrected Tables 6–9; no field-level edits were required.

**Structural gap (not a value error):** DIS_13, DIS_14, DIS_15 have **no corresponding REC entries at all** in Part 17, and no rows in Table 4. They exist only as disease-level entries (Tables 3, 5, and now 6–9). This means 3 of the 16 diseases are currently unreachable by the species-linked risk engine.

---

## D. FINAL COUNTS (calculated from corrected tables)

- Species/groups: 16
- Breeds/types: 20 (rescoped, not renumbered)
- Diseases: 16
- Disease-species associations (Table 4 / Part 17): 26 — covering only 13 of 16 diseases (DIS_13, 14, 15 excluded)
- Table 6 (Transmission) complete: 16/16 (6 marked "Not established")
- Table 7 (Diagnostics) complete: 16/16 (12 marked "Not established"; 4 documented)
- Table 8 (Prevention/Control) complete: 16/16 (13 marked "Not established"; 3 documented)
- Table 9 (Geography/Evidence) complete: 16/16 — Confirmed: 9 / India-relevant only: 5 / Insufficient: 2

---

## E. REMAINING GAPS (max 10 lines)

1. DIS_13, DIS_14, DIS_15 have zero disease-species associations — not resolvable without new source material; risk engine will silently skip them until fixed.
2. 12/16 diseases have no documented diagnostic sample/test in the consulted source set.
3. 13/16 diseases have no documented prevention/control protocol in the consulted source set.
4. BR_08, BR_18, BR_19 lack verifiable ICAR-NBAGR accession numbers.
5. Bibliography citation #26 (devdiscourse.com, Omar Abdullah/Vaishno Devi) is unrelated to any claim in the report and should be deleted.
6. Table 9 evidence tally was corrected from the prior report's "16/16 confirmed" to 9 confirmed / 5 India-relevant-only / 2 insufficient.

---

# PASS 2 — COMPACT PHASE-2 AUDIT

| Check | PASS/FAIL | Critical issue | Fix |
|---|---|---|---|
| Internal consistency | FAIL | DIS_13–15 have disease records but no species associations | Source and add valid species links, or explicitly exclude from AI scoring until resolved |
| Source quality | PASS WITH GAPS | 3 breed accessions and 1 citation (#26) unverified/irrelevant | Replace with ICAR-NBAGR primary records; delete citation #26 |
| Disease/species validity | PASS | All 26 existing associations map to valid disease_id and species_id | None needed |
| Maharashtra-specific evidence | PASS | Corrected from inflated "16/16 confirmed" to 9/5/2 tiered breakdown | None needed (corrected this pass) |
| Camera/IoT scientific validity | PASS | Framed strictly as early-warning triggers, not diagnosis | None needed |
| Diagnostic safety | PASS WITH GAPS | 12/16 diseases have no documented test — correctly left blank rather than invented | Source WOAH Terrestrial Manual entries per disease in a future pass |
| Breed logic | PASS | No unsupported breed-specific immunity claims present | None needed |
| AI-readiness | PASS WITH GAPS | DIS_13–15 create blind spots; risk-stratification coverage is 13/16, not 16/16 | Resolve association gap before production deployment |

**PHASE-1 STATUS:** COMPLETE WITH DOCUMENTED GAPS

**PHASE-2 AUDIT:** PASS WITH MINOR ISSUES

**NEXT PHASE:** NOT READY

Remaining issues before next phase:
- DIS_13/14/15 need verified species-disease associations before the risk engine can score them.
- 12/16 diseases have no documented diagnostic pathway.
- 13/16 diseases have no documented prevention/control data.
- 3 breed records lack verifiable ICAR-NBAGR accession sourcing.
- Citation #26 is orphaned and should be removed from the bibliography.
