import { EQVector } from '@/types/eq';

function cosine(a:number[], b:number[]) {
  const dot = a.reduce((s,v,i)=> s + v*b[i], 0);
  const na = Math.hypot(...a); 
  const nb = Math.hypot(...b);
  return na && nb ? dot/(na*nb) : 0;
}

export function affinityScore(a: EQVector, b: EQVector) {
  const va = [a.K,a.C,a.G,a.EL,a.RP,a.ACT,a.NE,a.IM,a.OP,a.EMP,a.NG];
  const vb = [b.K,b.C,b.G,b.EL,b.RP,b.ACT,b.NE,b.IM,b.OP,b.EMP,b.NG];
  const sim = cosine(va, vb);
  return Math.round((sim + 1) * 50); // -1..1 -> 0..100
}
