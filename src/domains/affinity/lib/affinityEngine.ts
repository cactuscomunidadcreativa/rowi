// src/lib/affinity/engine.ts
/* Reutilizable: cálculos de afinidad (135-like) + breakdown */

export type Project =
  | "innovation"
  | "execution"
  | "leadership"
  | "conversation"
  | "relationship"
  | "decision";

export type CompKey = "EL"|"RP"|"ACT"|"NE"|"IM"|"OP"|"EMP"|"NG";
export type SubKey =
  | "influence"|"decisionMaking"|"network"|"community"
  | "balance"|"health"|"achievement"|"satisfaction";

type NumMap<T extends string> = Partial<Record<T, number>>;

export type EngineInput = {
  project: Project;
  brainA?: string|null;
  brainB?: string|null;
  compsA: NumMap<CompKey>;
  compsB: NumMap<CompKey>;
  subsOrOutsA: NumMap<SubKey>; // admite subfactores o outcomes mapeados a estas claves
  subsOrOutsB: NumMap<SubKey>;
  talentsA: Record<string, number|null>;
  talentsB: Record<string, number|null>;
  biasFactor?: number;           // 0.9..1.1 aprox (preferencias usuario)
  closenessMultiplier?: number;  // 1.00(cercano) / 0.90(neutral) / 0.75(lejano)
};

export type EngineResult = {
  composite135: number;
  parts: {
    growth: number;
    collaboration: number;
    understanding: number;
    penalties?: {
      dispersion?: number;
      blindspots?: number;
    }
  }
};

const N = (v:any)=> (v===null||v===undefined||v==="") ? null : (Number.isFinite(Number(v)) ? Number(v) : null);
const clamp = (x:number,a:number,b:number)=> Math.max(a, Math.min(b,x));
const avg = (xs:(number|null)[]) => {
  const a = xs.filter((v):v is number => typeof v==="number");
  return a.length? a.reduce((p,c)=>p+c,0)/a.length : null;
};

/* Pesos por contexto */
const CTX: Record<Project, { growth:number; collab:number; understand:number }> = {
  innovation:   { growth:0.40, collab:0.35, understand:0.25 },
  execution:    { growth:0.25, collab:0.55, understand:0.20 },
  leadership:   { growth:0.35, collab:0.35, understand:0.30 },
  conversation: { growth:0.20, collab:0.25, understand:0.55 },
  relationship: { growth:0.25, collab:0.30, understand:0.45 },
  decision:     { growth:0.30, collab:0.45, understand:0.25 },
};
const pickW = (p:Project)=> CTX[p];

/* Matriz BBP 0..100 (se convierte a 0..135) */
const COLL_BBP: Record<string, Record<string, number>> = {
  Strategist:{ Strategist:60, Scientist:95, Guardian:80, Deliverer:85, Inventor:90, Energizer:85, Sage:80, Visionary:92 },
  Scientist: {  Strategist:95, Scientist:60, Guardian:75, Deliverer:80, Inventor:85, Energizer:80, Sage:75, Visionary:82 },
  Guardian:  {   Strategist:80, Scientist:75, Guardian:60, Deliverer:70, Inventor:75, Energizer:70, Sage:80, Visionary:72 },
  Deliverer: {  Strategist:85, Scientist:80, Guardian:70, Deliverer:60, Inventor:80, Energizer:75, Sage:75, Visionary:88 },
  Inventor:  {   Strategist:90, Scientist:85, Guardian:75, Deliverer:80, Inventor:60, Energizer:85, Sage:75, Visionary:78 },
  Energizer: {  Strategist:85, Scientist:80, Guardian:70, Deliverer:75, Inventor:85, Energizer:60, Sage:75, Visionary:86 },
  Sage:      {   Strategist:80, Scientist:75, Guardian:80, Deliverer:75, Inventor:75, Energizer:75, Sage:60, Visionary:78 },
  Visionary: {  Strategist:92, Scientist:82, Guardian:72, Deliverer:88, Inventor:78, Energizer:86, Sage:78, Visionary:60 },
};
const collScore100 = (a?:string|null,b?:string|null)=> (a && b && COLL_BBP[a]?.[b]) ?? 60;

/* Pesos competencias por contexto */
const COMP_WEIGHTS: Record<Project, Record<CompKey, number>> = {
  innovation:   { EL:0.10, RP:0.10, ACT:0.10, NE:0.15, IM:0.15, OP:0.15, EMP:0.10, NG:0.15 },
  execution:    { EL:0.10, RP:0.15, ACT:0.20, NE:0.20, IM:0.10, OP:0.10, EMP:0.07, NG:0.08 },
  leadership:   { EL:0.12, RP:0.13, ACT:0.15, NE:0.15, IM:0.10, OP:0.10, EMP:0.12, NG:0.13 },
  conversation: { EL:0.15, RP:0.12, ACT:0.08, NE:0.15, IM:0.10, OP:0.10, EMP:0.15, NG:0.15 },
  relationship: { EL:0.12, RP:0.10, ACT:0.08, NE:0.12, IM:0.10, OP:0.10, EMP:0.18, NG:0.20 },
  decision:     { EL:0.10, RP:0.15, ACT:0.22, NE:0.15, IM:0.08, OP:0.10, EMP:0.10, NG:0.10 },
};

export function computeAffinity(input: EngineInput): EngineResult {
  const {
    project, brainA, brainB, compsA, compsB, subsOrOutsA, subsOrOutsB,
    talentsA, talentsB, biasFactor=1.0, closenessMultiplier=1.0,
  } = input;

  const W = pickW(project);
  const wComp = COMP_WEIGHTS[project];

  // 1) Growth (competencias) con penalizaciones
  const compKeys = Object.keys(wComp) as CompKey[];
  const diffs:number[] = [];
  const aVals:number[] = [];
  const bVals:number[] = [];
  compKeys.forEach(k=>{
    const a=N(compsA[k]); const b=N(compsB[k]);
    if (a!=null) aVals.push(a);
    if (b!=null) bVals.push(b);
    if (a!=null && b!=null) diffs.push(Math.abs(a-b)*(wComp[k]??0.125));
  });
  const aTot = avg(aVals) ?? 67.5;
  const bTot = avg(bVals) ?? 67.5;
  const mdW = diffs.length? diffs.reduce((p,c)=>p+c,0)/diffs.length : 0;
  const baseSim = clamp(135 - mdW, 0, 135);
  const growth = clamp((aTot + bTot)/2, 0, 135);

  const std = (vals:number[])=>{
    if (!vals.length) return 0;
    const m = vals.reduce((p,c)=>p+c,0)/vals.length;
    const v = vals.reduce((p,c)=>p+Math.pow(c-m,2),0)/vals.length;
    return Math.sqrt(v);
  };
  const dispersion = (std(aVals)+std(bVals))/2;
  const dispPenalty = clamp(dispersion/160, 0, 0.35);

  const blindWeight = compKeys.reduce((acc,k)=>{
    const a=N(compsA[k]) ?? 135; const b=N(compsB[k]) ?? 135;
    return acc + ((a<92 && b<92) ? (wComp[k]??0.125) : 0);
  },0);
  const blindPenalty = clamp(blindWeight*0.20, 0, 0.40);

  const growthScore = clamp((0.55*baseSim + 0.45*growth)*(1-dispPenalty)*(1-blindPenalty), 0, 135);

  // 2) Collaboration (BBP + relacionales + talentos)
  const relKeys: CompKey[] = ["EMP","NE","IM","NG","RP","ACT"];
  const relMean = avg(relKeys.map(k=>{
    const a=N(compsA[k]); const b=N(compsB[k]);
    return (a!=null && b!=null) ? (a+b)/2 : 67.5;
  })) ?? 67.5;

  let tSum=0, tW=0;
  Object.entries(talentsA||{}).forEach(([k,a])=>{
    const b = N(talentsB?.[k]);
    const av=N(a); const bv=b;
    if (av!=null && bv!=null){ tSum += ((av+bv)/2)/135; tW += 1; }
  });
  const tFactor = tW? (0.9 + 0.2*(tSum/tW)) : 1.0;

  const bbp = collScore100(brainA, brainB);
  const collabScore = clamp((0.55*(bbp/100*135) + 0.45*relMean) * tFactor, 0, 135);

  // 3) Understanding (subfactores/outcomes)
  const subKeys = [
    "influence","decisionMaking","network","community",
    "balance","health","achievement","satisfaction"
  ] as SubKey[];
  const dists:number[] = [];
  subKeys.forEach(k=>{
    const a=N(subsOrOutsA[k]); const b=N(subsOrOutsB[k]);
    if (a!=null && b!=null) dists.push(Math.abs(a-b));
  });
  const d = avg(dists) ?? 67.5;
  const understand = clamp(135 - d, 0, 135);

  // Mix + bias + closeness
  let composite135 = (W.growth*growthScore + W.collab*collabScore + W.understand*understand) * closenessMultiplier;
  composite135 = clamp(composite135 * biasFactor, 0, 135);

  return {
    composite135: Math.round(composite135),
    parts:{
      growth: Math.round(growthScore),
      collaboration: Math.round(collabScore),
      understanding: Math.round(understand),
      penalties: { dispersion: Number(dispPenalty.toFixed(3)), blindspots: Number(blindPenalty.toFixed(3)) }
    }
  };
}