/**
 * Mini-SEI item set — hybrid (12 short-form items + 8 competency reads).
 *
 * Block A — the 12 real SEI 5.0 short-form items (r=.904 with full Total EQ).
 *   Their stems, reverse-keys, pondering weights and norm parameters are
 *   licensed Six Seconds material, so they live in env ROWI_MINISEI_ITEMS
 *   (JSON or base64), NEVER in git. When the env is absent we fall back to
 *   Block B alone and flag the result as indicative-only.
 *
 * Block B — the 8 competency questions (one per SEI competency). These already
 *   ship in the repo (reused from the daily-pulse / pre-SEI set). They produce
 *   an INDICATIVE competency profile (not normed) and a rough Total EQ proxy
 *   when Block A is unavailable.
 *
 * Env JSON shape (ROWI_MINISEI_ITEMS):
 * {
 *   "version": "hybrid-v1",
 *   "items": [
 *     { "id": "q7", "competency": "ACT", "reverse": false, "weight": 1.0 },
 *     ...12 items...
 *   ],
 *   "norm": { "mean": 100, "sd": 15 }   // total-EQ norm for the short form
 * }
 */

import { SEI_ORDER } from "@/lib/daily-pulse/questions";
import type { SeiKey } from "@/lib/vital-signs/catalog";

export interface MiniSeiItem {
  id: string;
  competency: SeiKey;
  reverse: boolean;
  weight: number;
}

export interface MiniSeiItemSet {
  version: string;
  items: MiniSeiItem[];
  norm: { mean: number; sd: number };
  /** true when Block A (the 12 licensed items) is provisioned. */
  hasShortForm: boolean;
}

let _cache: MiniSeiItemSet | undefined;

/** The 8-competency fallback set (Block B only). Indicative, not normed. */
function fallbackSet(): MiniSeiItemSet {
  return {
    version: "competency-fallback-v1",
    items: SEI_ORDER.map((c) => ({
      id: `c_${c}`,
      competency: c,
      reverse: false,
      weight: 1,
    })),
    norm: { mean: 100, sd: 15 },
    hasShortForm: false,
  };
}

/**
 * Active mini-SEI item set. Reads ROWI_MINISEI_ITEMS (JSON/base64); falls back
 * to the 8-competency set when absent or invalid. Cached per process.
 */
export function loadMiniSeiItems(): MiniSeiItemSet {
  if (_cache !== undefined) return _cache;

  const raw = process.env.ROWI_MINISEI_ITEMS;
  if (raw && raw.trim() !== "") {
    try {
      let json = raw.trim();
      if (!json.startsWith("{")) json = Buffer.from(json, "base64").toString("utf-8");
      const parsed = JSON.parse(json) as Partial<MiniSeiItemSet>;
      if (
        parsed &&
        Array.isArray(parsed.items) &&
        parsed.items.length >= 8 &&
        parsed.items.every((i) => typeof i.id === "string" && typeof i.competency === "string")
      ) {
        _cache = {
          version: parsed.version ?? "hybrid-v1",
          items: parsed.items as MiniSeiItem[],
          norm: parsed.norm ?? { mean: 100, sd: 15 },
          hasShortForm: true,
        };
        return _cache;
      }
    } catch {
      // fall through to the fallback set
    }
  }

  _cache = fallbackSet();
  return _cache;
}

/** Test seam. */
export function __resetMiniSeiItemsCache(): void {
  _cache = undefined;
}
