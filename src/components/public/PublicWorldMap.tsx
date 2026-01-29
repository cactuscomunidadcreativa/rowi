"use client";

import { useEffect, useState } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { motion } from "framer-motion";
import { Globe2, Users, MessageCircle, TrendingUp, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

interface CountryData {
  code: string;
  benchmarks: number;
  users: number;
  newUsers: number;
  total: number;
  coordinates: [number, number];
}

interface Summary {
  totalRowiers: number;
  activeUsers: number;
  conversations: number;
  satisfaction: number;
  availability: string;
  countries: number;
  newUsers: number;
}

const COLORS = {
  benchmarks: "#8b5cf6",
  users: "#3b82f6",
  newUsers: "#10b981",
};

const t = {
  es: {
    title: "Comunidad Global Rowi",
    subtitle: "Personas desarrollando su inteligencia emocional en todo el mundo",
    activeUsers: "Usuarios Activos",
    conversations: "Conversaciones",
    satisfaction: "Satisfacción",
    availability: "Disponibilidad",
    countries: "Países",
    rowiers: "Rowiers",
    newRowiers: "Nuevos Rowiers",
    last3months: "últimos 3 meses",
    benchmarks: "Benchmarks SEI",
    users: "Usuarios Rowi",
  },
  en: {
    title: "Rowi Global Community",
    subtitle: "People developing their emotional intelligence worldwide",
    activeUsers: "Active Users",
    conversations: "Conversations",
    satisfaction: "Satisfaction",
    availability: "Availability",
    countries: "Countries",
    rowiers: "Rowiers",
    newRowiers: "New Rowiers",
    last3months: "last 3 months",
    benchmarks: "SEI Benchmarks",
    users: "Rowi Users",
  },
};

export default function PublicWorldMap() {
  const { lang } = useI18n();
  const text = t[lang as keyof typeof t] || t.es;

  const [data, setData] = useState<{
    summary: Summary;
    mapData: CountryData[];
    countryNames: Record<string, { es: string; en: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/public/rowiverse");
        const json = await res.json();
        if (json.ok) {
          setData(json);
        }
      } catch (err) {
        console.error("Error loading public RowiVerse data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getMarkerSize = (total: number): number => {
    if (total > 50000) return 12;
    if (total > 20000) return 10;
    if (total > 10000) return 8;
    if (total > 1000) return 6;
    return 4;
  };

  const getDominantColor = (country: CountryData): string => {
    if (country.benchmarks > country.users) return COLORS.benchmarks;
    if (country.newUsers > country.users / 2) return COLORS.newUsers;
    return COLORS.users;
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(0) + "K";
    return num.toLocaleString();
  };

  const getCountryName = (code: string): string => {
    if (!data?.countryNames[code]) return code;
    return lang === "en" ? data.countryNames[code].en : data.countryNames[code].es;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-[var(--rowi-background)] to-[var(--rowi-card)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-12 h-12 border-4 border-[var(--rowi-primary)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (!data) return null;

  const { summary, mapData } = data;

  return (
    <section className="py-20 bg-gradient-to-b from-[var(--rowi-background)] to-[var(--rowi-card)] overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rowi-primary)]/10 text-[var(--rowi-primary)] text-sm font-medium mb-4">
            <Globe2 className="w-4 h-4" />
            {formatNumber(summary.totalRowiers)} {text.rowiers}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--rowi-foreground)] mb-3">
            {text.title}
          </h2>
          <p className="text-[var(--rowi-muted)] text-lg max-w-2xl mx-auto">
            {text.subtitle}
          </p>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={<Users className="w-5 h-5" />}
            value={formatNumber(summary.activeUsers)}
            label={text.activeUsers}
            color="blue"
          />
          <StatCard
            icon={<MessageCircle className="w-5 h-5" />}
            value={formatNumber(summary.conversations)}
            label={text.conversations}
            color="purple"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            value={`${summary.satisfaction}%`}
            label={text.satisfaction}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            value={summary.availability}
            label={text.availability}
            color="orange"
          />
        </motion.div>

        {/* Map */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="relative w-full h-[400px] md:h-[500px] rounded-2xl bg-[var(--rowi-card)] border border-[var(--rowi-border)] shadow-lg overflow-hidden">
            <ComposableMap
              projectionConfig={{ scale: 140, center: [0, 20] }}
              style={{ width: "100%", height: "100%" }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={(p) => setPosition(p)}
                minZoom={1}
                maxZoom={4}
              >
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        style={{
                          default: {
                            fill: "var(--rowi-background)",
                            stroke: "var(--rowi-border)",
                            strokeWidth: 0.3,
                            outline: "none",
                          },
                          hover: {
                            fill: "var(--rowi-primary)",
                            fillOpacity: 0.1,
                            outline: "none",
                          },
                        }}
                      />
                    ))
                  }
                </Geographies>

                {mapData.map((country) => {
                  if (!country.coordinates || country.total === 0) return null;
                  const size = getMarkerSize(country.total);
                  const color = getDominantColor(country);

                  return (
                    <Marker key={country.code} coordinates={country.coordinates}>
                      <g
                        onMouseEnter={() => setHoveredCountry(country)}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{ cursor: "pointer" }}
                      >
                        <circle
                          r={size + 3}
                          fill={color}
                          fillOpacity={0.15}
                          className="animate-pulse"
                        />
                        <circle
                          r={size}
                          fill={color}
                          fillOpacity={0.8}
                          stroke="#fff"
                          strokeWidth={1}
                        />
                      </g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 p-3 rounded-lg bg-[var(--rowi-card)]/90 backdrop-blur-sm border border-[var(--rowi-border)] text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.benchmarks }} />
                <span className="text-[var(--rowi-muted)]">{text.benchmarks}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.users }} />
                <span className="text-[var(--rowi-muted)]">{text.users}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.newUsers }} />
                <span className="text-[var(--rowi-muted)]">{text.newRowiers}</span>
              </div>
            </div>

            {/* Hover Tooltip */}
            {hoveredCountry && (
              <div className="absolute top-4 right-4 p-3 rounded-lg bg-[var(--rowi-card)] border border-[var(--rowi-border)] shadow-lg text-sm min-w-[160px]">
                <h4 className="font-bold text-[var(--rowi-foreground)] mb-2">
                  {getCountryName(hoveredCountry.code)}
                </h4>
                <div className="space-y-1 text-xs">
                  {hoveredCountry.benchmarks > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--rowi-muted)]">{text.benchmarks}:</span>
                      <span className="font-medium">{formatNumber(hoveredCountry.benchmarks)}</span>
                    </div>
                  )}
                  {hoveredCountry.users > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--rowi-muted)]">{text.users}:</span>
                      <span className="font-medium">{formatNumber(hoveredCountry.users)}</span>
                    </div>
                  )}
                  {hoveredCountry.newUsers > 0 && (
                    <div className="flex justify-between">
                      <span className="text-[var(--rowi-muted)]">{text.newRowiers}:</span>
                      <span className="font-medium text-green-500">+{hoveredCountry.newUsers}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[var(--rowi-border)] mt-1">
                    <span className="text-[var(--rowi-muted)]">Total:</span>
                    <span className="font-bold text-[var(--rowi-primary)]">{formatNumber(hoveredCountry.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-1">
              <button
                onClick={() => setPosition((p) => ({ ...p, zoom: Math.min(p.zoom * 1.5, 4) }))}
                className="w-7 h-7 rounded-md bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] flex items-center justify-center text-sm font-bold"
              >
                +
              </button>
              <button
                onClick={() => setPosition((p) => ({ ...p, zoom: Math.max(p.zoom / 1.5, 1) }))}
                className="w-7 h-7 rounded-md bg-[var(--rowi-card)] border border-[var(--rowi-border)] hover:bg-[var(--rowi-border)] flex items-center justify-center text-sm font-bold"
              >
                -
              </button>
            </div>
          </div>

          {/* New Rowiers Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium shadow-lg"
          >
            +{formatNumber(summary.newUsers)} {text.newRowiers} <span className="opacity-75">({text.last3months})</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    blue: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    purple: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    green: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    orange: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  };

  return (
    <div className="flex items-center gap-3 p-4 rounded-xl bg-[var(--rowi-card)] border border-[var(--rowi-border)]">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-[var(--rowi-foreground)]">{value}</p>
        <p className="text-xs text-[var(--rowi-muted)]">{label}</p>
      </div>
    </div>
  );
}
