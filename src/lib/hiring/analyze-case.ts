/**
 * 🧩 Orquestador del PROCESO DE HIRING (caso archivado + Rowiverse + puente).
 *
 * Recibe un CSV SEI ya parseado en grid + el nombre del manager, y:
 *   1. Parsea las personas (parse-sei-csv).
 *   2. Calcula el HiringReportData (motor real, puro).
 *   3. Contribuye la data SEI anónima al Rowiverse (sin PII).
 *   4. Crea un EqSnapshot "puente" por persona (email, sin userId) para el
 *      linking futuro cuando se registre/contrate.
 *   5. Persiste un HiringCase con el reportData COMPLETO.
 *
 * NO crea CommunityMember, RowiCommunity ni relaciones — es análisis archivado.
 * Ver docs/entregables/HIRING_PROCESO_Y_ROWIVERSE.md.
 */
import { prisma } from "@/core/prisma";
import { parseSeiGrid, type ParsedSeiPerson } from "./parse-sei-csv";
import { buildOptionsFromPeople } from "./load-people";
import { buildHiringReportData, type HiringPerson } from "./build-report-data";
import { contributeToRowiverse } from "@/lib/rowiverse/contribution-service";
import type { HiringReportData } from "@/lib/deliverables/reporte-full-hiring";

// Etiqueta de rol del manager por idioma (informativa, en el reporte).
const MANAGER_ROLE: Record<string, string> = {
  es: "Líder del proceso", pt: "Líder do processo", en: "Process lead",
};
const CANDIDATE_ROLE: Record<string, string> = {
  es: "Candidato(a)", pt: "Candidato(a)", en: "Candidate",
};

export interface AnalyzeCaseInput {
  grid: string[][]; // CSV ya parseado (sin header colapsado — ver parse-sei-csv)
  managerName: string; // exacto, como aparece en el CSV
  ownerUserId: string; // quién corre el análisis
  tenantId?: string | null;
  process?: string;
  lang?: "es" | "en" | "pt";
  contributeToRowiverse?: boolean; // default true
}

export interface AnalyzeCaseResult {
  caseId: string;
  reportData: HiringReportData;
  contributedToRowiverse: number;
  snapshotsCreated: number;
  createdCommunities: 0; // SIEMPRE 0 — invariante: no crea comunidad
}

export async function analyzeHiringCase(input: AnalyzeCaseInput): Promise<AnalyzeCaseResult> {
  const lang = input.lang ?? "es";
  const process = input.process || "Proceso de hiring";

  // 1) Parsear personas del CSV.
  const parsed = parseSeiGrid(input.grid);
  if (parsed.length < 2) {
    throw new Error("csv_needs_at_least_2_people");
  }

  // Separar manager vs candidatos por nombre exacto.
  const managerEntry = parsed.find((p) => p.person.name === input.managerName);
  if (!managerEntry) {
    throw new Error("manager_not_found_in_csv");
  }
  const candidateEntries = parsed.filter((p) => p.person.name !== input.managerName);
  if (candidateEntries.length === 0) {
    throw new Error("no_candidates");
  }

  const leader: HiringPerson = { ...managerEntry.person, role: MANAGER_ROLE[lang] };
  const candidates: HiringPerson[] = candidateEntries.map((e) => ({
    ...e.person,
    role: CANDIDATE_ROLE[lang],
  }));

  // 2) Calcular benchmark + opciones (reusa BenchmarkDataPoint = pool Rowiverse).
  const options = await buildOptionsFromPeople(leader, candidates, process);
  const reportData = buildHiringReportData(leader, candidates, options);

  // 3 + 4) Efectos colaterales SIN comunidad: Rowiverse + EqSnapshot puente.
  const doContribute = input.contributeToRowiverse !== false;
  let contributed = 0;
  let snapshots = 0;

  for (const e of parsed) {
    // 4) EqSnapshot puente: email + userId:null. Se vinculará cuando la persona
    //    se registre/contrate (linking por email, ya soportado por el repo).
    if (e.email) {
      try {
        await prisma.eqSnapshot.create({
          data: {
            dataset: "hiring_case", // marca el origen (puente latente de un proceso de hiring)
            email: e.email,
            // userId / memberId quedan null a propósito (puente latente).
            EL: r(e.person.comp.EL), RP: r(e.person.comp.RP), ACT: r(e.person.comp.ACT),
            NE: r(e.person.comp.NE), IM: r(e.person.comp.IM), OP: r(e.person.comp.OP),
            EMP: r(e.person.comp.EMP), NG: r(e.person.comp.NG),
            K: r(e.kcg.K), C: r(e.kcg.C), G: r(e.kcg.G),
            overall4: e.eqTotal, // Float? — el EQ total va aquí
            brainStyle: e.person.brain,
          },
        });
        snapshots++;
      } catch {
        // un fallo de snapshot no debe tumbar el análisis.
      }
    }

    // 3) Contribución anónima al Rowiverse (sin PII).
    if (doContribute) {
      try {
        const res = await contributeToRowiverse({
          sourceType: "csv_upload",
          eqData: {
            eqTotal: e.eqTotal,
            K: e.kcg.K, C: e.kcg.C, G: e.kcg.G,
            EL: e.person.comp.EL, RP: e.person.comp.RP, ACT: e.person.comp.ACT,
            NE: e.person.comp.NE, IM: e.person.comp.IM, OP: e.person.comp.OP,
            EMP: e.person.comp.EMP, NG: e.person.comp.NG,
          },
          demographics: {
            country: e.demographics.country, sector: e.demographics.sector,
            jobFunction: e.demographics.jobFunction, jobRole: e.demographics.jobRole,
            ageRange: e.demographics.ageRange, gender: e.demographics.gender,
            education: e.demographics.education,
          },
          outcomes: {
            influence: e.outcomesForVerse.influence, decisionMaking: e.outcomesForVerse.decisionMaking,
            community: e.outcomesForVerse.community, health: e.outcomesForVerse.health,
          },
          brainTalents: toBrainTalents(e.talentsForVerse),
        });
        if (res.success) contributed++;
      } catch {
        // contribución best-effort; no rompe el flujo.
      }
    }
  }

  // 5) Persistir el caso COMPLETO (reabrible, re-renderizable en cualquier idioma).
  const created = await prisma.hiringCase.create({
    data: {
      ownerUserId: input.ownerUserId,
      tenantId: input.tenantId ?? null,
      process,
      managerName: input.managerName,
      lang,
      reportData: reportData as unknown as object,
      candidateCount: candidates.length,
      contributedToRowiverse: contributed,
      snapshotsCreated: snapshots,
    },
    select: { id: true },
  });

  return {
    caseId: created.id,
    reportData,
    contributedToRowiverse: contributed,
    snapshotsCreated: snapshots,
    createdCommunities: 0,
  };
}

/** EqSnapshot guarda comps como Int?: redondea preservando null. */
function r(v: number | null): number | null {
  return v == null ? null : Math.round(v);
}

/** Mapea talentos (camelCase del parser) a las claves del Rowiverse. */
function toBrainTalents(t: Record<string, number | null>): Record<string, number | null> {
  return {
    dataMining: t.dataMining, modeling: t.modeling, prioritizing: t.prioritizing,
    connection: t.connection, emotionalInsight: t.emotionalInsight, collaboration: t.collaboration,
    reflecting: t.reflecting, adaptability: t.adaptability, criticalThinking: t.criticalThinking,
    resilience: t.resilience, riskTolerance: t.riskTolerance, imagination: t.imagination,
    proactivity: t.proactivity, commitment: t.commitment, problemSolving: t.problemSolving,
    vision: t.vision, designing: t.design, entrepreneurship: t.entrepreneurship,
  };
}
