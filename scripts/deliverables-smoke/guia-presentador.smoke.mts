import presMod from "@/lib/deliverables/guia-presentador.ts";
import fs from "fs";
const buildGuiaPresentador = (presMod as any).buildGuiaPresentador;
const owl = fs.readFileSync(process.cwd() + "/public/owl.png");
const A = JSON.parse(fs.readFileSync("/tmp/affinity-results.json", "utf8"));
const B = JSON.parse(fs.readFileSync("/tmp/benchmark-results.json", "utf8"));
const Lv = JSON.parse(fs.readFileSync("/tmp/lvs-results.json", "utf8"));
const D = JSON.parse(fs.readFileSync("/tmp/context-deltas.json", "utf8"));
const lvsByName = Object.fromEntries(Lv.people.map((p: any) => [p.name, p]));
const order = ["Amanda Regina Pinatti Menezes", "Érika Araújo Nascimento", "Paloma Silva de Aguiar", "Kaue Ferreira Lisboa"];
const candidates = order.map((name) => {
  const af = A.candidates.find((x: any) => x.name === name);
  const bn = B.candidates[name];
  const lv = lvsByName[name];
  const ctxByKey: any = {}; const bandByKey: any = {};
  for (const k of ["leadership", "execution", "innovation", "decision", "conversation", "relationship"]) { ctxByKey[k] = af.contexts[k].heat135; bandByKey[k] = af.contexts[k].band; }
  return {
    name, role: "Candidata", eq: af.eq, brain: af.brain, changeStyle: af.style, influence: af.leadProfile,
    affinityAvg: af.avg135, affinityByContext: ctxByKey, affinityBands: bandByKey,
    eqPercentile: Math.round(bn.eq_percentile), compsAtTopLevel: bn.n_comps_at_top_level, pctOfTopsBelow: Math.round(bn.pct_of_top_below),
    competencies: ["EL", "RP", "ACT", "NE", "IM", "OP", "EMP", "NG"].map((k) => ({ key: k, score: bn.comps[k].score, pctl: Math.round(bn.comps[k].pctl), vsTop: bn.comps[k].vs_top })),
    relationalDelta: D[name],
    lvs: { score: Math.round(lv.views.LVS.score), band: lv.views.LVS.band },
    lvsDrivers: lv.drivers.map((d: any) => ({ code: d.code, score: d.score, band: d.band })),
  };
});
const pop: any = {}, top: any = {};
for (const [k, v] of Object.entries(B.population)) pop[k] = (v as any).mean;
for (const [k, v] of Object.entries(B.top_performers)) top[k] = (v as any).mean;
const report = {
  process: "Recrutamento BDP", meta: "SEI Adult v4 · 12-jun-2026",
  leaderName: "Giselly Zanetti",
  leaderMeta: "EQ 104.75 · percentil mundial 73 · LVS inferido 104 (media) · Visionary · Generator · Balanced",
  candidates,
  benchmark: { nTotal: B.n_benchmark, nTop: B.n_top, threshold: B.threshold_p90_overall4, nHealthcare: B.n_healthcare, population: pop, topPerformers: top, distinctive: Object.entries(B.distinctive) },
};
const data = { report, leaderPercentile: 73, leaderLvsLabel: "104 (media)" };
for (const lang of ["es", "en", "pt"]) {
  const buf = await buildGuiaPresentador(data, lang, owl);
  fs.writeFileSync(`/tmp/guia-presentador-${lang}.pdf`, buf);
  console.log("OK", lang, buf.length);
}
