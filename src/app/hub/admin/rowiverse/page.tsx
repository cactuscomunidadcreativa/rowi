"use client";

import { useEffect, useState } from "react";
import WorldMap from "./components/WorldMap";
import { Globe2, Heart, Users, TrendingUp } from "lucide-react";

export default function RowiVersePage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/hub/rowiverse/insights")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  return (
    <div className="p-8 space-y-8">
      <header className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-rowi-blueDay flex items-center gap-2">
            <Globe2 className="w-7 h-7" /> RowiVerse Global
          </h1>
          <p className="text-gray-500 text-sm">
            Ecosistema emocional mundial — comunidades, usuarios y afinidades activas.
          </p>
        </div>
        <a
          href="/hub/admin/rowiverse/contributions"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rowi-blueDay/10 text-rowi-blueDay hover:bg-rowi-blueDay/20 transition-colors"
        >
          <TrendingUp className="w-4 h-4" />
          Ver Contribuciones
        </a>
      </header>

      {/* MAPA */}
      <WorldMap data={data?.countries || {}} />

      {/* RESUMEN */}
      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Stat icon={<Users />} label="Usuarios Activos" value={totalCount(data)} />
        <Stat icon={<Heart />} label="EQ Promedio Global" value={avgEQ(data)} />
        <Stat icon={<Globe2 />} label="Países Representados" value={Object.keys(data?.countries || {}).length} />
      </div>
    </div>
  );
}

function Stat({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="p-2 bg-rowi-blueDay/10 rounded-full text-rowi-blueDay">{icon}</div>
      <div>
        <p className="text-xs uppercase text-gray-400">{label}</p>
        <p className="text-xl font-semibold">{value}</p>
      </div>
    </div>
  );
}

function totalCount(data: any) {
  return Object.values(data?.countries || {}).reduce((sum: number, c: any) => sum + c.count, 0);
}

function avgEQ(data: any) {
  const arr = Object.values(data?.countries || {});
  const sum = arr.reduce((s: number, c: any) => s + c.avgEQ, 0);
  return arr.length ? (sum / arr.length).toFixed(1) : "—";
}