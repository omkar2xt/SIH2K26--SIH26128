import { MatchedDiseaseRisk } from '../contracts/risk.types';

const ZOONOTIC_DIS = new Set(['DIS_04', 'DIS_05', 'DIS_07', 'DIS_09', 'DIS_11', 'DIS_12']);
const NOTIFIABLE_DIS = new Set(['DIS_01', 'DIS_02', 'DIS_03', 'DIS_04', 'DIS_06', 'DIS_07', 'DIS_08', 'DIS_09', 'DIS_10', 'DIS_11', 'DIS_12']);

export function rankDiseases(animal: any, db: any, drops: any): MatchedDiseaseRisk[] {
  const c = animal.current || {};
  const speciesAssocs = (db.diseaseSpecies || []).filter((m: any) => m.speciesId === animal.speciesId);

  return speciesAssocs.map((assoc: any) => {
    const disease = (db.diseases || []).find((d: any) => d.id === assoc.diseaseId);
    if (!disease) return null;
    const why = [`Species (${animal.speciesId}) associated in KB`];
    let dScore = 0;

    if (c.tempTrend === 'elevated' && disease.earlySymptoms?.toLowerCase().includes('fever')) {
      dScore += 2;
      why.push('Temperature trend matches described fever');
    }
    if ((drops.actDrop >= 15 || drops.feedDrop >= 15) && disease.behavioralSigns && !disease.behavioralSigns.includes('Not established')) {
      dScore += 1;
      why.push('Behavioural deviation consistent with known signs');
    }
    if (c.social === 'isolating' && disease.behavioralSigns?.toLowerCase().includes('isol')) {
      dScore += 1;
      why.push('Isolation behaviour matches known signs');
    }
    if (c.social === 'recumbent') {
      dScore += 2;
      why.push('Recumbency aligns with severe presentation');
    }
    if (c.lameness && disease.earlySymptoms?.toLowerCase().includes('lame')) {
      dScore += 2;
      why.push('Lameness consistent with described symptoms');
    }
    if (c.skin_lesions && disease.physicalSigns?.toLowerCase().includes('nodule')) {
      dScore += 2;
      why.push('Skin lesions consistent with described physical signs');
    }
    if (c.abortion_event && disease.earlySymptoms?.toLowerCase().includes('abort')) {
      dScore += 3;
      why.push('Abortion event matches reproductive impact');
    }

    if (assoc.evidence && assoc.evidence.includes('not established')) dScore = Math.floor(dScore * 0.5);

    const risk = dScore >= 4 ? 'HIGH' : dScore >= 2 ? 'MEDIUM' : 'LOW';
    why.push('Evidence status: ' + assoc.evidence);
    return {
      disease,
      assoc,
      risk,
      why,
      dScore,
      isZoonotic: ZOONOTIC_DIS.has(disease.id),
      isNotifiable: NOTIFIABLE_DIS.has(disease.id),
    };
  })
  .filter(Boolean)
  .sort((a: any, b: any) => b.dScore - a.dScore)
  .slice(0, 5);
}
