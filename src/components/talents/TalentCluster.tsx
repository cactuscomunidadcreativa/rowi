"use client";

import { motion } from "framer-motion";
import { TalentBar } from "./TalentBar";

export function TalentCluster({
  title,
  talents,
  color,
}: {
  title: string;
  talents: { label: string; value: number | null | undefined; raw?: number | null; benefit?: string; risk?: string }[];
  color: string;
}) {
  // Si no hay título, no mostrar el header
  const hasTitle = title && title.length > 0;

  return (
    <div className="space-y-2">
      {hasTitle && (
        <h3 className="font-medium text-gray-900 dark:text-white mb-3">{title}</h3>
      )}
      {talents.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">—</p>
      ) : (
        talents.map((t, index) => (
          <motion.div
            key={t.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <TalentBar
              label={t.label}
              value={t.value}
              color={color}
              raw={t.raw}
              benefit={t.benefit}
              risk={t.risk}
            />
          </motion.div>
        ))
      )}
    </div>
  );
}
