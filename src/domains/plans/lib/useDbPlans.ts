"use client";

/**
 * Fuente de verdad de PRECIOS y entitlements de plan = la DB (la misma que
 * Stripe cobra vía sync-products y que el runtime usa para entitlements).
 *
 * plans.ts queda como catálogo de COPY (nombres, features, descripciones);
 * los números que el usuario ve en /pricing y /register se sobreescriben por
 * slug con lo que la DB dice. Esto cierra el P0 de la auditoría jun-2026:
 * "precio anunciado ≠ precio cobrado" (Business $10/usuario en la web vs
 * $99 flat en Stripe; ROWI+ mostrando SEI excluido cuando el runtime lo da).
 *
 * Si el fetch falla (offline, dev sin seed), se mantienen los valores
 * estáticos — mejor mostrar algo que nada — y `dbLoaded` queda en false por
 * si la página quiere señalarlo.
 */
import { useCallback, useEffect, useState } from "react";
import type { RowiPlan } from "./plans";

export interface DbPlanOverride {
  slug: string | null;
  priceUsd: number;
  priceYearlyUsd: number;
  minUsers: number;
  pricePerUserMonthly: number;
  pricePerUserYearly: number;
  tokensMonthly: number;
  trialDays: number;
  seiIncluded: boolean;
}

export function useDbPlanOverrides(): {
  withDbPrices: (plan: RowiPlan) => RowiPlan;
  dbLoaded: boolean;
} {
  const [bySlug, setBySlug] = useState<Record<string, DbPlanOverride>>({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/plans")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled || !data?.ok || !Array.isArray(data.plans)) return;
        const map: Record<string, DbPlanOverride> = {};
        for (const p of data.plans as DbPlanOverride[]) {
          if (p.slug) map[p.slug] = p;
        }
        setBySlug(map);
      })
      .catch(() => {
        /* fallback estático */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const dbLoaded = Object.keys(bySlug).length > 0;

  // Estable entre renders (solo cambia cuando llega la DB): apto como dep de
  // useEffect sin re-disparar efectos en cada render.
  const withDbPrices = useCallback(
    (plan: RowiPlan): RowiPlan => {
      const db = bySlug[plan.slug];
      if (!db) return plan;
      return {
        ...plan,
        priceMonthly: db.priceUsd,
        // Si la DB no define precio anual (>0), mantenemos el estático.
        priceYearly: db.priceYearlyUsd > 0 ? db.priceYearlyUsd : plan.priceYearly,
        pricePerUser:
          db.pricePerUserMonthly > 0 ? db.pricePerUserMonthly : plan.pricePerUser,
        pricePerUserYearly:
          db.pricePerUserYearly > 0 ? db.pricePerUserYearly : plan.pricePerUserYearly,
        minUsers: db.minUsers > 0 ? db.minUsers : plan.minUsers,
        tokensMonthly: db.tokensMonthly,
        seiIncluded: db.seiIncluded,
      };
    },
    [bySlug],
  );

  return { withDbPrices, dbLoaded };
}
