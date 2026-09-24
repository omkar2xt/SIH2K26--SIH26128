/**
 * labSeed.js — Seeds laboratory reference data
 *
 * Seeds:
 *   - SampleType   (blood, serum, nasal swab, etc.)
 *   - LabFacility  (Maharashtra/India veterinary labs)
 *   - DiagnosticMethod (RT-PCR, ELISA, etc.)
 *
 * Run: node prisma/labSeed.js
 * Safe to run multiple times (upsert, not insert).
 */
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const SAMPLE_TYPES = [
  { name: 'Blood / Serum',          preservationMethod: 'EDTA / Plain tube, refrigerated 2–8°C' },
  { name: 'Nasal Swab',             preservationMethod: 'VTM (Viral Transport Medium), frozen' },
  { name: 'Vesicular Fluid',        preservationMethod: 'Sterile container, frozen' },
  { name: 'Epithelial Tissue',      preservationMethod: '50% glycerol-PBS, frozen' },
  { name: 'Urine',                  preservationMethod: 'Sterile container, refrigerated' },
  { name: 'Milk',                   preservationMethod: 'Sterile container, refrigerated 2–8°C' },
  { name: 'Skin Biopsy',            preservationMethod: '10% formalin (histology) or frozen (PCR)' },
  { name: 'Lymph Node Biopsy',      preservationMethod: '10% formalin or frozen' },
  { name: 'Nasal / Ocular Swab',    preservationMethod: 'VTM, frozen' },
  { name: 'Muscle Tissue',          preservationMethod: 'Frozen or 10% formalin' },
  { name: 'Brain Tissue',           preservationMethod: '50% glycerol-PBS or frozen' },
  { name: 'Intestinal Content',     preservationMethod: 'Sterile container, frozen' },
  { name: 'Faeces',                 preservationMethod: 'Sterile container, refrigerated' },
  { name: 'Semen',                  preservationMethod: 'Frozen extended in cryo-protectant' },
];

const LAB_FACILITIES = [
  { name: 'Regional Disease Diagnostic Laboratory, Pune',              code: 'RDDL-PNE', district: 'Pune',      accredited: true  },
  { name: 'Regional Disease Diagnostic Laboratory, Nagpur',            code: 'RDDL-NGP', district: 'Nagpur',    accredited: true  },
  { name: 'State Veterinary Biological & Research Institute, Pune',    code: 'SVBRI-PNE', district: 'Pune',     accredited: true  },
  { name: 'ICAR-NRC on Equines, Hisar',                                code: 'ICAR-NRCE', district: 'Hisar',    accredited: true  },
  { name: 'ICAR-NRCE Glanders Reference Laboratory',                   code: 'ICAR-GLAN', district: 'Hisar',    accredited: true  },
  { name: 'District Veterinary Laboratory, Pune',                      code: 'DVL-PNE',   district: 'Pune',     accredited: false },
  { name: 'District Veterinary Laboratory, Nashik',                    code: 'DVL-NSK',   district: 'Nashik',   accredited: false },
  { name: 'District Veterinary Laboratory, Aurangabad',                code: 'DVL-AUR',   district: 'Aurangabad', accredited: false },
  { name: 'National Institute of High Security Animal Diseases, Bhopal', code: 'NIHSAD',  district: 'Bhopal',   accredited: true  },
];

const DIAGNOSTIC_METHODS = [
  { code: 'RT-PCR',    name: 'RT-PCR (Reverse Transcription PCR)',        type: 'MOLECULAR'       },
  { code: 'PCR',       name: 'PCR (Polymerase Chain Reaction)',            type: 'MOLECULAR'       },
  { code: 'ELISA',     name: 'ELISA (Enzyme-Linked Immunosorbent Assay)', type: 'SEROLOGICAL'     },
  { code: 'IGMELISA',  name: 'Serology – IgM ELISA',                      type: 'SEROLOGICAL'     },
  { code: 'CFT',       name: 'Complement Fixation Test',                   type: 'SEROLOGICAL'     },
  { code: 'MRT',       name: 'Milk Ring Test',                             type: 'SEROLOGICAL'     },
  { code: 'IFAT',      name: 'Indirect Fluorescent Antibody Test (IFAT)',  type: 'SEROLOGICAL'     },
  { code: 'CATT',      name: 'CATT / T. evansi Agglutination Test',        type: 'SEROLOGICAL'     },
  { code: 'MALLEIN',   name: 'Mallein Test (Glanders)',                    type: 'CLINICAL'        },
  { code: 'CULTURE',   name: 'Bacterial Culture & Sensitivity',            type: 'MICROBIOLOGICAL' },
  { code: 'SMEAR',     name: 'Blood Smear – Giemsa Staining',              type: 'MICROBIOLOGICAL' },
  { code: 'HISTOPATH', name: 'Histopathological Examination',              type: 'CLINICAL'        },
  { code: 'POSTMORTEM',name: 'Post-mortem Examination',                    type: 'CLINICAL'        },
  { code: 'TOXIN',     name: 'Toxin Detection',                            type: 'MOLECULAR'       },
  { code: 'CLINEXAM',  name: 'Clinical Examination',                       type: 'CLINICAL'        },
];

async function seed() {
  console.log('Seeding laboratory reference data…\n');

  // SampleType
  let stCount = 0;
  for (const st of SAMPLE_TYPES) {
    await prisma.sampleType.upsert({
      where:  { name: st.name },
      update: { preservationMethod: st.preservationMethod },
      create: { name: st.name, preservationMethod: st.preservationMethod },
    });
    stCount++;
  }
  console.log(`✓ SampleType: ${stCount} records seeded`);

  // LabFacility
  let lfCount = 0;
  for (const lf of LAB_FACILITIES) {
    await prisma.labFacility.upsert({
      where:  { code: lf.code },
      update: { name: lf.name, district: lf.district, accredited: lf.accredited },
      create: { name: lf.name, code: lf.code, district: lf.district, accredited: lf.accredited },
    });
    lfCount++;
  }
  console.log(`✓ LabFacility: ${lfCount} records seeded`);

  // DiagnosticMethod
  let dmCount = 0;
  for (const dm of DIAGNOSTIC_METHODS) {
    await prisma.diagnosticMethod.upsert({
      where:  { code: dm.code },
      update: { name: dm.name, type: dm.type },
      create: { code: dm.code, name: dm.name, type: dm.type },
    });
    dmCount++;
  }
  console.log(`✓ DiagnosticMethod: ${dmCount} records seeded`);

  console.log('\nLaboratory reference data seeding complete.');
}

seed()
  .catch(e => { console.error('Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
