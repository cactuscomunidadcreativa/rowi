"use client";

import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export default function WorldMap({ data }: { data: Record<string, any> }) {
  const countries = Object.entries(data || {});

  // Escala de color según EQ promedio
  const colorByEQ = (val: number) => {
    if (val > 120) return "#38bdf8";
    if (val > 110) return "#60a5fa";
    if (val > 100) return "#93c5fd";
    return "#dbeafe";
  };

  return (
    <div className="relative w-full h-[70vh] border border-gray-200 rounded-xl bg-white shadow-inner">
      <ComposableMap projectionConfig={{ scale: 150 }}>
        <Geographies geography={geoUrl}>
          {({ geographies }) =>
            geographies.map((geo) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                style={{
                  default: { fill: "#f5f5f5", outline: "none" },
                  hover: { fill: "#e0e7ff", outline: "none" },
                }}
              />
            ))
          }
        </Geographies>

        {countries.map(([name, info]) => {
          const color = colorByEQ(info.avgEQ);
          const size = Math.min(12 + info.count * 0.5, 20);
          const coords = getCountryCoords(name);
          if (!coords) return null;
          return (
            <Marker key={name} coordinates={coords}>
              <circle r={size / 2} fill={color} fillOpacity={0.7} stroke="#fff" strokeWidth={0.5} />
              <title>
                {name}
                {"\n"}
                Usuarios: {info.count}
                {"\n"}
                EQ Promedio: {info.avgEQ.toFixed(1)}
                {"\n"}
                Afinidad: {info.avgAffinity.toFixed(1)}
                {"\n"}
                Emoción: {info.topEmotion}
              </title>
            </Marker>
          );
        })}
      </ComposableMap>
    </div>
  );
}

// 🌍 Coordenadas aproximadas por país (ejemplo simple)
function getCountryCoords(country: string): [number, number] | null {
  const coords: Record<string, [number, number]> = {
    "Peru": [-75, -10],
    "Brazil": [-50, -10],
    "Argentina": [-64, -34],
    "Mexico": [-102, 23],
    "Colombia": [-74, 4],
    "United States": [-95, 37],
    "Spain": [-3, 40],
    "Italy": [12, 42],
    "Portugal": [-8, 39],
    "United Kingdom": [-1, 52],
    "Costa Rica": [-84, 10],
  };
  return coords[country] || null;
}