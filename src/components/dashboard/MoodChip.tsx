"use client";
export function MoodChip({ text, emoji }: { text: string; emoji: string }) {
  return (
    <div className="rounded-xl border p-4 shadow-sm min-h-[120px] flex flex-col justify-center">
      <div className="text-sm text-gray-500">Mood reciente</div>
      <div className="mt-1 text-xl flex items-center gap-2">
        <span>{emoji || "🙂"}</span>
        <span className="font-medium">{text || "—"}</span>
      </div>
    </div>
  );
}
