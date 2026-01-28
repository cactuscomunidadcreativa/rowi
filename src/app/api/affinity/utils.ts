import { prisma } from "@/core/prisma";
import OpenAI from "openai";

/* =========================================================
   🌐 Contextos principales
========================================================= */
export type Project =
  | "innovation"
  | "execution"
  | "leadership"
  | "conversation"
  | "relationship"
  | "decision";

/* =========================================================
   🎚️ Pesos contextuales
========================================================= */
export const CTX: Record<Project, { growth: number; collab: number; understand: number }> = {
  innovation:   { growth: 0.40, collab: 0.35, understand: 0.25 },
  execution:    { growth: 0.25, collab: 0.55, understand: 0.20 },
  leadership:   { growth: 0.35, collab: 0.35, understand: 0.30 },
  conversation: { growth: 0.20, collab: 0.25, understand: 0.55 },
  relationship: { growth: 0.25, collab: 0.30, understand: 0.45 },
  decision:     { growth: 0.30, collab: 0.45, understand: 0.25 },
};

/* =========================================================
   🧠 Competencias SEI
========================================================= */
const COMP_KEYS = ["EL","RP","ACT","NE","IM","OP","EMP","NG"] as const;
type CompKey = typeof COMP_KEYS[number];

export const COMP_WEIGHTS: Record<Project, Record<CompKey, number>> = {
  innovation:   { EL:0.10, RP:0.10, ACT:0.10, NE:0.15, IM:0.15, OP:0.15, EMP:0.10, NG:0.15 },
  execution:    { EL:0.10, RP:0.15, ACT:0.20, NE:0.20, IM:0.10, OP:0.10, EMP:0.07, NG:0.08 },
  leadership:   { EL:0.12, RP:0.13, ACT:0.15, NE:0.15, IM:0.10, OP:0.10, EMP:0.12, NG:0.13 },
  conversation: { EL:0.15, RP:0.12, ACT:0.08, NE:0.15, IM:0.10, OP:0.10, EMP:0.15, NG:0.15 },
  relationship: { EL:0.12, RP:0.10, ACT:0.08, NE:0.12, IM:0.10, OP:0.10, EMP:0.18, NG:0.20 },
  decision:     { EL:0.10, RP:0.15, ACT:0.22, NE:0.15, IM:0.08, OP:0.10, EMP:0.10, NG:0.10 },
};

/* =========================================================
   🌟 Subfactores contextuales
========================================================= */
export const SUB_WEIGHTS: Record<Project, Record<string, number>> = {
  innovation:   { influence:0.13, decisionMaking:0.15, network:0.13, community:0.12, balance:0.10, health:0.10, achievement:0.14, satisfaction:0.13 },
  execution:    { influence:0.12, decisionMaking:0.20, network:0.12, community:0.12, balance:0.11, health:0.11, achievement:0.11, satisfaction:0.11 },
  leadership:   { influence:0.16, decisionMaking:0.15, network:0.14, community:0.14, balance:0.10, health:0.10, achievement:0.11, satisfaction:0.10 },
  conversation: { influence:0.14, decisionMaking:0.12, network:0.13, community:0.14, balance:0.11, health:0.11, achievement:0.12, satisfaction:0.13 },
  relationship: { influence:0.12, decisionMaking:0.10, network:0.15, community:0.18, balance:0.12, health:0.12, achievement:0.10, satisfaction:0.11 },
  decision:     { influence:0.12, decisionMaking:0.24, network:0.10, community:0.10, balance:0.10, health:0.10, achievement:0.12, satisfaction:0.12 },
};

/* =========================================================
   🎯 Talentos contextuales
========================================================= */
export const TALENT_WEIGHTS: Record<Project, Record<string, number>> = {
  execution: { prioritizing:0.20, problemSolving:0.20, commitment:0.15, dataMining:0.10, modeling:0.10, proactivity:0.10, collaboration:0.05, adaptability:0.05, criticalThinking:0.05 },
  innovation:{ imagination:0.22, vision:0.18, design:0.12, riskTolerance:0.12, connection:0.10, collaboration:0.12, proactivity:0.07, problemSolving:0.07 },
  leadership:{ emotionalInsight:0.18, collaboration:0.18, adaptability:0.12, criticalThinking:0.12, vision:0.12, commitment:0.12, proactivity:0.08, problemSolving:0.08 },
  conversation:{ connection:0.24, emotionalInsight:0.22, reflecting:0.18, collaboration:0.18, adaptability:0.18 },
  relationship:{ connection:0.26, emotionalInsight:0.22, collaboration:0.18, adaptability:0.18, reflecting:0.16 },
  decision:{ criticalThinking:0.28, modeling:0.20, dataMining:0.18, prioritizing:0.18, problemSolving:0.16 },
};

/* =========================================================
   🧮 Utilidades matemáticas
========================================================= */
export const N = (v: any): number | null => (v == null || v === "" ? null : Number.isFinite(+v) ? +v : null);
export const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
export const avg = (xs: (number | null)[]) => {
  const a = xs.filter((v): v is number => typeof v === "number");
  return a.length ? a.reduce((p, c) => p + c, 0) / a.length : null;
};
export const stddev = (xs: (number | null)[]) => {
  const a = xs.filter((v): v is number => typeof v === "number");
  if (!a.length) return null;
  const m = a.reduce((p, c) => p + c, 0) / a.length;
  const v = a.reduce((p, c) => p + Math.pow(c - m, 2), 0) / a.length;
  return Math.sqrt(v);
};
export const to100 = (x: number) => clamp(Math.round((x / 135) * 100), 0, 100);
export const seiLevel135 = (s: number) =>
  s < 82 ? "Desafío" : s < 92 ? "Emergente" : s < 108 ? "Funcional" : s < 118 ? "Diestro" : "Experto";

/* =========================================================
   ⚙️ Normalizadores y multiplicadores
========================================================= */
export function normalizeProject(p?: string | null): Project {
  const map: Record<string, Project> = {
    equipo: "leadership",
    liderazgo: "leadership",
    relaciones: "relationship",
    relacion: "relationship",
    conversacion: "conversation",
    decision: "decision",
    innovacion: "innovation",
    ejecucion: "execution",
    trabajo: "execution",
  };
  const k = (p || "execution").toLowerCase().trim();
  return (map[k] as Project) || "execution";
}

export function normCloseness(raw?: string | null): "close" | "neutral" | "far" {
  const s = (raw || "").toLowerCase().trim();
  if (["cercano", "close", "próximo", "proximo", "vicino"].includes(s)) return "close";
  if (["neutral", "neutro"].includes(s)) return "neutral";
  if (["lejano", "far", "distante", "lontano"].includes(s)) return "far";
  return "neutral";
}
export function closenessMultiplier(raw?: string | null): number {
  const k = normCloseness(raw);
  if (k === "close") return 1.0;
  if (k === "neutral") return 0.9;
  return 0.75;
}

/* =========================================================
   🧩 Matriz Brain Brief y afinidad relacional
========================================================= */
const COLL_BBP: Record<string, Record<string, number>> = {
  Strategist: { Strategist:60, Scientist:95, Guardian:80, Deliverer:85, Inventor:90, Energizer:85, Sage:80, Visionary:92 },
  Scientist:  { Strategist:95, Scientist:60, Guardian:75, Deliverer:80, Inventor:85, Energizer:80, Sage:75, Visionary:82 },
  Guardian:   { Strategist:80, Scientist:75, Guardian:60, Deliverer:70, Inventor:75, Energizer:70, Sage:80, Visionary:72 },
  Deliverer:  { Strategist:85, Scientist:80, Guardian:70, Deliverer:60, Inventor:80, Energizer:75, Sage:75, Visionary:88 },
  Inventor:   { Strategist:90, Scientist:85, Guardian:75, Deliverer:80, Inventor:60, Energizer:85, Sage:75, Visionary:78 },
  Energizer:  { Strategist:85, Scientist:80, Guardian:70, Deliverer:75, Inventor:85, Energizer:60, Sage:75, Visionary:86 },
  Sage:       { Strategist:80, Scientist:75, Guardian:80, Deliverer:75, Inventor:75, Energizer:75, Sage:60, Visionary:78 },
  Visionary:  { Strategist:92, Scientist:82, Guardian:72, Deliverer:88, Inventor:78, Energizer:86, Sage:78, Visionary:60 },
};
export const collScoreBBP = (a?: string|null, b?: string|null) => (a && b && COLL_BBP[a]?.[b]) ?? 60;

/* =========================================================
   📈 Funciones de cálculo central
========================================================= */
export function compAffinity135(a:Record<CompKey,number|null>, b:Record<CompKey,number|null>, project:Project) {
  const w = COMP_WEIGHTS[project];
  const diffs:number[] = [], aVals:number[] = [], bVals:number[] = [];
  (Object.keys(w) as CompKey[]).forEach(k=>{
    const ak=N(a[k]); const bk=N(b[k]);
    if(ak!=null)aVals.push(ak); if(bk!=null)bVals.push(bk);
    if(ak!=null&&bk!=null) diffs.push(Math.abs(ak-bk)*(w[k]??0.125));
  });
  const aTot=avg(aVals)??67.5,bTot=avg(bVals)??67.5;
  const mdWeighted=diffs.length?diffs.reduce((p,c)=>p+c,0)/diffs.length:0;
  const baseSim=clamp(135-mdWeighted,0,135);
  const growth=clamp((aTot+bTot)/2,0,135);
  const score=clamp((0.55*baseSim+0.45*growth),0,135);
  return {score,baseSim,growth};
}

export function understanding135(aOuts:any[],bOuts:any[],project:Project){
  const w=SUB_WEIGHTS[project]; let acc=0,wsum=0;
  const get=(arr:any[],k:string)=>N(arr.find((x)=>x.key===k)?.score);
  Object.keys(w).forEach(k=>{
    const wk=w[k]; const a=get(aOuts,k)??67.5; const b=get(bOuts,k)??67.5;
    acc+=Math.abs(a-b)*wk; wsum+=wk;
  });
  const dist=wsum?acc/wsum:67.5;
  return clamp(135-dist,0,135);
}

export function talentSynergyFactor(project:Project,aTal:Record<string,number|null>,bTal:Record<string,number|null>){
  const map=TALENT_WEIGHTS[project]; if(!map)return 1.0;
  let sum=0,wsum=0;
  Object.entries(map).forEach(([k,w])=>{
    const av=N(aTal[k]),bv=N(bTal[k]);
    if(av!=null&&bv!=null){ const mean=(av+bv)/2; const norm=clamp(mean/135,0,1);
      sum+=norm*w; wsum+=w;}
  });
  if(!wsum)return 1.0;
  const x=sum/wsum;
  return 0.9+0.2*x;
}

export function collaboration135(aBrain:string|null|undefined,bBrain:string|null|undefined,aComp:any,bComp:any,tFactor:number){
  const bbp=collScoreBBP(aBrain,bBrain); const bbp135=(bbp/100)*135;
  const relKeys=["EMP","NE","IM","NG","RP","ACT"];
  const relMean=avg(relKeys.map(k=>{
    const a=N(aComp[k]),b=N(bComp[k]); return a!=null&&b!=null?(a+b)/2:67.5;
  }))??67.5;
  return clamp((0.55*bbp135+0.45*relMean)*tFactor,0,135);
}

/* =========================================================
   🔎 Heurística social + preferencias de usuario
========================================================= */
export async function learnUserPrefs(userId:string){
  const chats=await prisma.rowiChat.findMany({ where:{userId}, orderBy:{createdAt:"desc"}, take:50 });
  const text=chats.map(c=>c.content).join(" ");
  const numbers=(text.match(/\d[\d\.\,]*/g)||[]).length;
  const whys=(text.match(/\b(por qué|porque|why|how)\b/gi)||[]).length;
  const numericBias=numbers>whys*1.5?1.08:1.0;
  const narrativeBias=whys>numbers*1.3?1.06:1.0;
  const directTone=/\b(haz|define|prioriza|lista|resume|pasos|plan)\b/i.test(text)?1.05:1.0;
  const detail=text.length>1500?1.05:text.length<300?0.98:1.0;
  return {
    commStyle:(numericBias>1.0?"numeric":narrativeBias>1.0?"narrative":"balanced") as "numeric"|"narrative"|"balanced",
    toneFactor:directTone, detailFactor:detail,
    biasFactor:Math.max(numericBias,narrativeBias)*directTone*detail
  };
}

export function inferMemberChannel(member:any){
  if(member?.linkedin) return {channel:"linkedin",style:"numeric"};
  if(member?.twitter) return {channel:"twitter",style:"direct"};
  if(member?.instagram) return {channel:"instagram",style:"narrative"};
  if(member?.website) return {channel:"email",style:"balanced"};
  return {channel:"unspecified",style:"balanced"};
}

/* =========================================================
   ⚙️ IA (uso controlado)
========================================================= */
const openai=new OpenAI({ apiKey:process.env.OPENAI_API_KEY });
export async function generateAiAdvice({locale,aName,bName,context}:{locale:string;aName:string;bName:string;context:string;}){
  try{
    const resp=await openai.chat.completions.create({
      model:"gpt-4o-mini",temperature:0.5,max_tokens:400,
      messages:[
        {role:"system",content:"Eres Rowi, analista de afinidad emocional."},
        {role:"user",content:`Analiza la relación entre ${aName} y ${bName} en ${context}.`},
      ],
    });
    return resp.choices?.[0]?.message?.content?.trim()||"";
  }catch(e){ console.error("AI error:",e); return ""; }
}