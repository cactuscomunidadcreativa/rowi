"use client";
import { TalentBar } from "./TalentBar";

export function TalentCluster({
  title,
  talents,
  color,
}: {
  title: string;
  talents: { label: string; value: number | null | undefined; benefit?: string; risk?: string }[];
  color: string;
}) {
  return (
    <div className="rounded-xl border p-4 shadow-sm">
      <h3 className="font-medium mb-3">{title}</h3>
      {talents.map((t) => (
        <TalentBar
          key={t.label}
          label={t.label}
          value={t.value}
          color={color}
          benefit={t.benefit}
          risk={t.risk}
        />
      ))}
    </div>
  );
}
