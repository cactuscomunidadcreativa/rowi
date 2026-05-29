"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Globe2, Users, MessageCircle, TrendingUp } from "lucide-react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
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
  totalReach: number;
  activeUsers: number;
  conversations: number;
  countries: number;
  newUsers: number;
}

const COLORS = {
  benchmarks: "#8b5cf6",
  users: "#3b82f6",
  newUsers: "#10b981",
};

// TopoJSON de mundo (CDN público, dominio público)
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

const t = {
  es: {
    title: "La red Six Seconds en el mundo",
    subtitle: "Rowi se construye sobre la red de inteligencia emocional más grande del mundo",
    activeUsers: "Usuarios Rowi",
    conversations: "Conversaciones",
    countries: "Países y territorios",
    reach: "Alcance Six Seconds",
    newRowiers: "Nuevos usuarios",
    last3months: "últimos 3 meses",
    benchmarks: "Evaluaciones Six Seconds",
    users: "Usuarios Rowi",
  },
  en: {
    title: "The Six Seconds network worldwide",
    subtitle: "Rowi is built on the world's largest emotional intelligence network",
    activeUsers: "Rowi Users",
    conversations: "Conversations",
    countries: "Countries & territories",
    reach: "Six Seconds reach",
    newRowiers: "New users",
    last3months: "last 3 months",
    benchmarks: "Six Seconds assessments",
    users: "Rowi Users",
  },
  pt: {
    title: "A rede Six Seconds no mundo",
    subtitle: "Rowi se constrói sobre a maior rede de inteligência emocional do mundo",
    activeUsers: "Usuários Rowi",
    conversations: "Conversas",
    countries: "Países e territórios",
    reach: "Alcance Six Seconds",
    newRowiers: "Novos usuários",
    last3months: "últimos 3 meses",
    benchmarks: "Avaliações Six Seconds",
    users: "Usuários Rowi",
  },
  it: {
    title: "La rete Six Seconds nel mondo",
    subtitle: "Rowi è costruito sulla più grande rete di intelligenza emotiva al mondo",
    activeUsers: "Utenti Rowi",
    conversations: "Conversazioni",
    countries: "Paesi e territori",
    reach: "Copertura Six Seconds",
    newRowiers: "Nuovi utenti",
    last3months: "ultimi 3 mesi",
    benchmarks: "Valutazioni Six Seconds",
    users: "Utenti Rowi",
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
    if (total > 50000) return 12;
    if (total > 20000) return 10;
    if (total > 10000) return 8;
    if (total > 1000) return 6;
    if (total > 100) return 5;
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
    return lang !== "es" ? data.countryNames[code].en : data.countryNames[code].es;
  };

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-[var(--rowi-bg,#f7f9fb)] to-[var(--rowi-card,#ffffff)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center h-[400px]">
            <div className="w-12 h-12 border-4 border-[var(--rowi-g2,#31a2e3)] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="py-20 bg-gradient-to-b from-[var(--rowi-bg,#f7f9fb)] to-[var(--rowi-card,#ffffff)]">
        <div className="container mx-auto px-4 text-center">
          <Globe2 className="w-16 h-16 mx-auto text-[var(--rowi-g2,#31a2e3)] opacity-50 mb-4" />
          <h2 className="text-2xl font-bold text-[var(--rowi-fg,#1a1c1e)] mb-2">{text.title}</h2>
          <p className="text-[var(--rowi-muted,#5f6368)]">{text.subtitle}</p>
        </div>
      </section>
    );
  }

  const { summary, mapData } = data;

  return (
    <section className="py-20 bg-gradient-to-b from-[var(--rowi-bg,#f7f9fb)] to-[var(--rowi-card,#ffffff)] overflow-hidden">
      <div className="container mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--rowi-g2,#31a2e3)]/10 text-[var(--rowi-g2,#31a2e3)] text-sm font-medium mb-4">
            <Globe2 className="w-4 h-4" />
            {formatNumber(summary.totalReach)} · {text.reach}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--rowi-fg,#1a1c1e)] mb-3">
            {text.title}
          </h2>
          <p className="text-[var(--rowi-muted,#5f6368)] text-lg max-w-2xl mx-auto">
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
          <StatCard icon={<Globe2 className="w-5 h-5" />} value={formatNumber(summary.countries)} label={text.countries} color="green" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} value={`+${formatNumber(summary.newUsers)}`} label={text.newRowiers} color="orange" />
        </motion.div>

        {/* Map — Real world map with react-simple-maps */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="relative"
        >
          <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg overflow-hidden">
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 165 }}
              className="w-full h-full"
              style={{ width: "100%", height: "100%" }}
            >
              <Geographies geography={GEO_URL}>
                {((({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#cbd5e1"
                      stroke="#ffffff"
                      strokeWidth={0.5}
                      className="dark:fill-zinc-700"
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", fill: "#94a3b8" },
                        pressed: { outline: "none" },
                      }}
                    />
                  ))) as any)}
              </Geographies>

              {/* Data Markers */}
              {mapData.map((country) => {
                if (!country.coordinates || country.total === 0) return null;
                const size = getMarkerSize(country.total);
                const color = getDominantColor(country);
                const isHovered = hoveredCountry?.code === country.code;

                return (
                  <Marker
                    key={country.code}
                    coordinates={country.coordinates}
                    onMouseEnter={() => setHoveredCountry(country)}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      default: { cursor: "pointer" },
                      hover: { cursor: "pointer" },
                      pressed: { cursor: "pointer" },
                    }}
                  >
                    {/* Pulse */}
                    <circle
                      r={size + 4}
                      fill={color}
                      opacity={0.2}
                      className="animate-ping"
                      style={{ transformOrigin: "center" }}
                    />
                    {/* Dot */}
                    <circle
                      r={isHovered ? size * 1.3 : size}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={1.5}
                      style={{ transition: "r 150ms ease-out" }}
                    />
                  </Marker>
                );
              })}
            </ComposableMap>

            {/* Tooltip on hover */}
            {hoveredCountry && (
              <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-xl text-sm min-w-[180px] whitespace-nowrap z-50">
                <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                  {getCountryName(hoveredCountry.code)}
                </h4>
                <div className="space-y-1 text-xs">
                  {hoveredCountry.benchmarks > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{text.benchmarks}:</span>
                      <span className="font-medium text-purple-600">{formatNumber(hoveredCountry.benchmarks)}</span>
                    </div>
                  )}
                  {hoveredCountry.users > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{text.users}:</span>
                      <span className="font-medium text-blue-600">{formatNumber(hoveredCountry.users)}</span>
                    </div>
                  )}
                  {hoveredCountry.newUsers > 0 && (
                    <div className="flex justify-between gap-4">
                      <span className="text-gray-500">{text.newRowiers}:</span>
                      <span className="font-medium text-green-500">+{hoveredCountry.newUsers}</span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 pt-1 border-t border-gray-200 dark:border-zinc-700 mt-1">
                    <span className="text-gray-500">Total:</span>
                    <span className="font-bold">{formatNumber(hoveredCountry.total)}</span>
                  </div>
                </div>
              </div>
            )}

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
    <div className="flex items-center gap-3 p-4 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 shadow-sm">
      <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      <div>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      </div>
    </div>
  );
}
