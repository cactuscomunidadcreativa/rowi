"use client";

import { useState, useEffect, Component, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { Globe2 } from "lucide-react";

// Error boundary to catch react-simple-maps rendering errors
class MapErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.warn("WorldMap render error:", error.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

// Dynamic import to avoid SSR issues with react-simple-maps
const ComposableMap = dynamic(
  () => import("react-simple-maps").then((m) => m.ComposableMap),
  { ssr: false }
);
const Geographies = dynamic(
  () => import("react-simple-maps").then((m) => m.Geographies),
  { ssr: false }
);
const Geography = dynamic(
  () => import("react-simple-maps").then((m) => m.Geography),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-simple-maps").then((m) => m.Marker),
  { ssr: false }
);
const ZoomableGroup = dynamic(
  () => import("react-simple-maps").then((m) => m.ZoomableGroup),
  { ssr: false }
);

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  code: string;
  name: string;
  benchmarks: number;
  users: number;
  newUsers: number;
  communities: number;
  eqSnapshots: number;
  avgEQ: number | null;
  total: number;
  coordinates: [number, number];
}

interface Props {
  data: Record<string, any>;
  mapData: CountryData[];
}

// Color palette for data types
const COLORS = {
  benchmarks: "#8b5cf6", // purple
  users: "#3b82f6", // blue
  newUsers: "#10b981", // green
  communities: "#f59e0b", // orange
};

function MapFallback({ mapData, message }: { mapData: CountryData[]; message: string }) {
  return (
    <div className="relative w-full h-[40vh] border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center text-gray-500 dark:text-gray-400">
        <Globe2 className="w-12 h-12 mx-auto mb-2" />
        <p>{message}</p>
        <p className="text-xs mt-1">{mapData.length} paises con datos</p>
      </div>
    </div>
  );
}

export default function WorldMap({ data, mapData }: Props) {
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    content: CountryData | null;
  }>({ show: false, x: 0, y: 0, content: null });

  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleMoveEnd(position: { coordinates: [number, number]; zoom: number }) {
    setPosition(position);
  }

  // Calculate marker size based on total (scaled for visibility)
  const getMarkerSize = (total: number): number => {
    if (total > 100000) return 16;
    if (total > 50000) return 14;
    if (total > 10000) return 12;
    if (total > 1000) return 10;
    if (total > 100) return 8;
    return 6;
  };

  // Get dominant color based on highest category
  const getDominantColor = (country: CountryData): string => {
    const { benchmarks, users, newUsers, communities } = country;
    const max = Math.max(benchmarks, users, newUsers, communities);
    if (max === 0) return COLORS.users;
    if (benchmarks === max) return COLORS.benchmarks;
    if (users === max) return COLORS.users;
    if (newUsers === max) return COLORS.newUsers;
    return COLORS.communities;
  };

  const handleMouseEnter = (e: React.MouseEvent, country: CountryData) => {
    const rect = (e.target as SVGElement).getBoundingClientRect();
    setTooltip({
      show: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
      content: country,
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, content: null });
  };

  if (!mounted) {
    return (
      <div className="relative w-full h-[60vh] border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center text-gray-500 dark:text-gray-400">
          <Globe2 className="w-12 h-12 mx-auto mb-2 animate-pulse" />
          <p>Cargando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <MapErrorBoundary
      fallback={<MapFallback mapData={mapData} message="No se pudo cargar el mapa" />}
    >
      <div className="relative w-full h-[60vh] border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900 shadow-inner overflow-hidden">
        <ComposableMap
          projectionConfig={{ scale: 150, center: [0, 20] }}
          style={{ width: "100%", height: "100%" }}
        >
          <ZoomableGroup
            zoom={position.zoom}
            center={position.coordinates}
            onMoveEnd={handleMoveEnd}
            minZoom={1}
            maxZoom={8}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }: any) =>
                geographies.map((geo: any) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    style={{
                      default: {
                        fill: "#e2e8f0",
                        stroke: "#cbd5e1",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      hover: {
                        fill: "#cbd5e1",
                        stroke: "#94a3b8",
                        strokeWidth: 0.5,
                        outline: "none",
                      },
                      pressed: {
                        fill: "#94a3b8",
                        outline: "none",
                      },
                    }}
                  />
                ))
              }
            </Geographies>

            {/* Render markers for each country */}
            {mapData.map((country) => {
              if (!country.coordinates || country.total === 0) return null;

              const size = getMarkerSize(country.total);
              const color = getDominantColor(country);

              // Calculate pie chart segments if multiple data types
              const segments = [
                { value: country.benchmarks, color: COLORS.benchmarks },
                { value: country.users, color: COLORS.users },
                { value: country.newUsers, color: COLORS.newUsers },
                { value: country.communities, color: COLORS.communities },
              ].filter((s) => s.value > 0);

              const total = segments.reduce((sum, s) => sum + s.value, 0);

              return (
                <Marker key={country.code} coordinates={country.coordinates}>
                  <g
                    onMouseEnter={(e: any) => handleMouseEnter(e, country)}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: "pointer" }}
                  >
                    {/* Background glow */}
                    <circle
                      r={size + 2}
                      fill={color}
                      fillOpacity={0.2}
                    />

                    {/* Main marker - pie chart if multiple types, solid if single */}
                    {segments.length === 1 ? (
                      <circle
                        r={size / 2}
                        fill={segments[0].color}
                        fillOpacity={0.9}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ) : (
                      <>
                        {/* Multi-segment pie chart */}
                        {(() => {
                          let currentAngle = -90;
                          const radius = size / 2;
                          return segments.map((segment, i) => {
                            const angle = (segment.value / total) * 360;
                            const startAngle = currentAngle;
                            const endAngle = currentAngle + angle;
                            currentAngle = endAngle;

                            const startRad = (startAngle * Math.PI) / 180;
                            const endRad = (endAngle * Math.PI) / 180;

                            const x1 = Math.cos(startRad) * radius;
                            const y1 = Math.sin(startRad) * radius;
                            const x2 = Math.cos(endRad) * radius;
                            const y2 = Math.sin(endRad) * radius;

                            const largeArc = angle > 180 ? 1 : 0;

                            const d = `M 0 0 L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

                            return (
                              <path
                                key={i}
                                d={d}
                                fill={segment.color}
                                fillOpacity={0.9}
                                stroke="#fff"
                                strokeWidth={0.5}
                              />
                            );
                          });
                        })()}
                      </>
                    )}
                  </g>
                </Marker>
              );
            })}
          </ZoomableGroup>
        </ComposableMap>

        {/* Tooltip */}
        {tooltip.show && tooltip.content && (
          <div
            className="fixed z-50 pointer-events-none"
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: "translate(-50%, -100%)",
            }}
          >
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
              <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                {tooltip.content.name}
              </h4>
              <div className="space-y-1 text-xs">
                {tooltip.content.benchmarks > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.benchmarks }}
                    />
                    <span className="text-gray-500">Benchmarks:</span>
                    <span className="font-medium ml-auto">
                      {formatNumber(tooltip.content.benchmarks)}
                    </span>
                  </div>
                )}
                {tooltip.content.users > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.users }}
                    />
                    <span className="text-gray-500">Users:</span>
                    <span className="font-medium ml-auto">
                      {formatNumber(tooltip.content.users)}
                    </span>
                  </div>
                )}
                {tooltip.content.newUsers > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.newUsers }}
                    />
                    <span className="text-gray-500">New (3mo):</span>
                    <span className="font-medium ml-auto text-green-500">
                      +{formatNumber(tooltip.content.newUsers)}
                    </span>
                  </div>
                )}
                {tooltip.content.communities > 0 && (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: COLORS.communities }}
                    />
                    <span className="text-gray-500">Communities:</span>
                    <span className="font-medium ml-auto">
                      {formatNumber(tooltip.content.communities)}
                    </span>
                  </div>
                )}
                {tooltip.content.avgEQ !== null && (
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200 dark:border-gray-600 mt-1">
                    <span className="text-gray-500">Avg EQ:</span>
                    <span className="font-medium ml-auto">
                      {tooltip.content.avgEQ.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                <div className="text-xs font-bold text-purple-600">
                  Total Rowiers: {formatNumber(tooltip.content.total)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Zoom controls */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-1">
          <button
            onClick={() => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 8) }))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-bold"
          >
            +
          </button>
          <button
            onClick={() => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
            className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-lg font-bold"
          >
            -
          </button>
          <button
            onClick={() => setPosition({ coordinates: [0, 20], zoom: 1 })}
            className="w-8 h-8 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center text-xs"
          >
            R
          </button>
        </div>
      </div>
    </MapErrorBoundary>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}
