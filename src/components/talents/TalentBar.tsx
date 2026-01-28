"use client";
import { useState } from "react";

export function TalentBar({
  label,
  value,
  color,
  benefit,
  risk,
}: {
  label: string;
  value: number | null | undefined;
  color: string;
  benefit?: string;
  risk?: string;
}) {
  const v = typeof value === "number" ? Math.max(0, Math.min(100, value)) : (value == null ? null : Number(value));
  const [show, setShow] = useState(false);

  return (
    <div
      className="mb-3 rounded-lg border p-2 shadow-sm cursor-pointer"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <span className="text-gray-400">{v ?? "—"}</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-gray-800/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: v != null ? `${v}%` : "0%", backgroundColor: color }}
        />
      </div>
      {show && (benefit || risk) && (
        <div className="mt-1 text-xs text-gray-500">
          {benefit && <div className="text-green-500">+ {benefit}</div>}
          {risk && <div className="text-red-500">– {risk}</div>}
        </div>
      )}
    </div>
  );
}
