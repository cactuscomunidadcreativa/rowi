"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface ConsentLite {
  key: string;
  needsRefresh: boolean;
}

export default function ConsentRefreshBanner() {
  const { t } = useI18n();
  const [pending, setPending] = useState(0);

  useEffect(() => {
    fetch("/api/account/consent")
      .then((r) => r.json())
      .then((d) => {
        if (d?.ok === false) return;
        const list = (d.consents ?? []) as ConsentLite[];
        setPending(list.filter((c) => c.needsRefresh).length);
      })
      .catch(() => {});
  }, []);

  if (pending === 0) return null;

  return (
    <Link
      href="/hub/account/privacy"
      className="block rowi-card border-amber-500/40 bg-amber-50/60 dark:bg-amber-500/10 hover:bg-amber-50 dark:hover:bg-amber-500/15 transition-colors"
    >
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-300 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--rowi-foreground)]">
            {pending === 1
              ? t("vitalSigns.refresh.one", "Tienes 1 permiso actualizado por revisar")
              : t("vitalSigns.refresh.many", "Tienes {{n}} permisos actualizados por revisar").replace(
                  "{{n}}",
                  String(pending),
                )}
          </p>
          <p className="text-xs text-[var(--rowi-muted)] mt-0.5">
            {t(
              "vitalSigns.refresh.desc",
              "Hemos cambiado el texto de algún consent. Necesitamos que lo revises antes de que tenga efecto.",
            )}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-[var(--rowi-muted)] flex-shrink-0" />
      </div>
    </Link>
  );
}
