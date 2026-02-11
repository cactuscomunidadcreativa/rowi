"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Users, MessageCircle, TrendingUp, Clock } from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

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

/**
 * Convierte coordenadas geográficas (lon, lat) a porcentaje x,y en un contenedor
 * Proyección Equirectangular simplificada
 */
function geoToPercent(lon: number, lat: number): { x: number; y: number } {
  const x = ((lon + 180) / 360) * 100;
  const y = ((85 - lat) / 145) * 100;
  return { x: Math.max(2, Math.min(98, x)), y: Math.max(2, Math.min(98, y)) };
}

export default function PublicWorldMap() {
  const { lang } = useI18n();
  const text = t[lang as keyof typeof t] || t.es;

  const [data, setData] = useState<{
    summary: Summary;
    mapData: CountryData[];
    countryNames: Record<string, { es: string; en: string }>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [hoveredCountry, setHoveredCountry] = useState<CountryData | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/public/rowiverse");
        const json = await res.json();
        if (json.ok) {
          setData(json);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading public RowiVerse data:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getMarkerSize = (total: number): number => {
    if (total > 50000) return 24;
    if (total > 20000) return 20;
    if (total > 10000) return 16;
    if (total > 1000) return 12;
    if (total > 100) return 9;
    return 7;
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

  if (error || !data) {
    return (
      <section className="py-20 bg-gradient-to-b from-[var(--rowi-background)] to-[var(--rowi-card)]">
        <div className="container mx-auto px-4 text-center">
          <Globe2 className="w-16 h-16 mx-auto text-[var(--rowi-primary)] opacity-50 mb-4" />
          <h2 className="text-2xl font-bold text-[var(--rowi-foreground)] mb-2">{text.title}</h2>
          <p className="text-[var(--rowi-muted)]">{text.subtitle}</p>
        </div>
      </section>
    );
  }

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
          <StatCard icon={<Users className="w-5 h-5" />} value={formatNumber(summary.activeUsers)} label={text.activeUsers} color="blue" />
          <StatCard icon={<MessageCircle className="w-5 h-5" />} value={formatNumber(summary.conversations)} label={text.conversations} color="purple" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} value={`${summary.satisfaction}%`} label={text.satisfaction} color="green" />
          <StatCard icon={<Clock className="w-5 h-5" />} value={summary.availability} label={text.availability} color="orange" />
        </motion.div>

        {/* Map — Simple dot-based world map (sin react-simple-maps) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 border border-[var(--rowi-border)] shadow-lg overflow-hidden">
            {/* World map background — simplified continent shapes */}
            <div className="absolute inset-0 opacity-[0.15] dark:opacity-[0.08]">
              <svg viewBox="0 0 1000 500" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <g fill="currentColor" className="text-gray-500">
                  {/* North America */}
                  <ellipse cx="220" cy="155" rx="95" ry="75" />
                  {/* Central America */}
                  <ellipse cx="240" cy="240" rx="30" ry="25" />
                  {/* South America */}
                  <ellipse cx="300" cy="330" rx="55" ry="90" />
                  {/* Europe */}
                  <ellipse cx="505" cy="125" rx="55" ry="45" />
                  {/* Africa */}
                  <ellipse cx="520" cy="280" rx="60" ry="85" />
                  {/* Middle East */}
                  <ellipse cx="590" cy="195" rx="30" ry="30" />
                  {/* Asia */}
                  <ellipse cx="690" cy="150" rx="110" ry="75" />
                  {/* Southeast Asia */}
                  <ellipse cx="740" cy="260" rx="40" ry="35" />
                  {/* Oceania */}
                  <ellipse cx="810" cy="350" rx="55" ry="35" />
                </g>
              </svg>
            </div>

            {/* Data Points */}
            {mapData.map((country, idx) => {
              if (!country.coordinates || country.total === 0) return null;
              const pos = geoToPercent(country.coordinates[0], country.coordinates[1]);
              const size = getMarkerSize(country.total);
              const color = getDominantColor(country);
              const isHovered = hoveredCountry?.code === country.code;

              return (
                <motion.div
                  key={country.code}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3 + idx * 0.02, type: "spring" }}
                  className="absolute cursor-pointer group"
                  style={{
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    zIndex: isHovered ? 50 : 10,
                  }}
                  onMouseEnter={() => setHoveredCountry(country)}
                  onMouseLeave={() => setHoveredCountry(null)}
                >
                  {/* Pulse ring */}
                  <div
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: size + 8,
                      height: size + 8,
                      backgroundColor: color,
                      opacity: 0.15,
                      left: "50%",
                      top: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                  {/* Dot */}
                  <div
                    className="rounded-full border-2 border-white dark:border-zinc-700 shadow-md transition-transform group-hover:scale-150"
                    style={{
                      width: size,
                      height: size,
                      backgroundColor: color,
                    }}
                  />

                  {/* Tooltip on hover */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl text-sm min-w-[160px] whitespace-nowrap z-50">
                      <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                        {getCountryName(country.code)}
                      </h4>
                      <div className="space-y-1 text-xs">
                        {country.benchmarks > 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">{text.benchmarks}:</span>
                            <span className="font-medium text-purple-600">{formatNumber(country.benchmarks)}</span>
                          </div>
                        )}
                        {country.users > 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">{text.users}:</span>
                            <span className="font-medium text-blue-600">{formatNumber(country.users)}</span>
                          </div>
                        )}
                        {country.newUsers > 0 && (
                          <div className="flex justify-between gap-4">
                            <span className="text-gray-500">{text.newRowiers}:</span>
                            <span className="font-medium text-green-500">+{country.newUsers}</span>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-zinc-700 mt-1">
                          <span className="text-gray-500">Total:</span>
                          <span className="font-bold">{formatNumber(country.total)}</span>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-white dark:bg-zinc-800 border-b border-r border-gray-200 dark:border-zinc-700 transform rotate-45 -mt-1" />
                    </div>
                  )}
                </motion.div>
              );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 p-3 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.benchmarks }} />
                <span className="text-gray-500">{text.benchmarks}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.users }} />
                <span className="text-gray-500">{text.users}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.newUsers }} />
                <span className="text-gray-500">{text.newRowiers}</span>
              </div>
            </div>

            {/* Countries count */}
            <div className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm border border-gray-200 dark:border-zinc-700 text-xs font-medium text-gray-700 dark:text-gray-300">
              {summary.countries} {text.countries}
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
