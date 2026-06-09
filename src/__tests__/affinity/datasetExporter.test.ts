/**
 * Tests de las funciones puras del exportador de dataset (Fase 7).
 * Las funciones que tocan Prisma se prueban en integración aparte.
 */
import { toJSONL, summarizeDataset, type DatasetRecord } from "@/ai/learning/datasetExporter";

const SAMPLE: DatasetRecord[] = [
  { task: "pulse_point_inference", input: { a: 1 }, label: 80 },
  { task: "pulse_point_inference", input: { a: 2 }, label: 75 },
  { task: "affinity_outcome", input: { context: "execution" }, label: 0.7 },
];

describe("datasetExporter — serialización", () => {
  it("toJSONL emite una línea JSON por registro", () => {
    const out = toJSONL(SAMPLE);
    const lines = out.split("\n");
    expect(lines).toHaveLength(3);
    expect(JSON.parse(lines[0]).task).toBe("pulse_point_inference");
    expect(JSON.parse(lines[2]).label).toBe(0.7);
  });

  it("toJSONL de un dataset vacío es string vacío", () => {
    expect(toJSONL([])).toBe("");
  });

  it("cada línea es JSON válido independiente", () => {
    const lines = toJSONL(SAMPLE).split("\n");
    for (const l of lines) {
      expect(() => JSON.parse(l)).not.toThrow();
    }
  });
});

describe("datasetExporter — resumen", () => {
  it("summarizeDataset cuenta total y por tarea", () => {
    const s = summarizeDataset(SAMPLE);
    expect(s.total).toBe(3);
    expect(s.byTask.pulse_point_inference).toBe(2);
    expect(s.byTask.affinity_outcome).toBe(1);
  });

  it("dataset vacío resume a total 0", () => {
    expect(summarizeDataset([])).toEqual({ total: 0, byTask: {} });
  });
});
