"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Award,
  RefreshCcw,
  Plus,
  Search,
  Loader2,
  Download,
  Eye,
  Calendar,
  Users,
  FileText,
  CheckCircle,
  MoreVertical,
  Palette,
  Star,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/useI18n";

interface Certificate {
  id: string;
  name: string;
  description: string;
  courseId: string;
  courseName: string;
  templateStyle: "classic" | "modern" | "minimal" | "premium";
  issuedCount: number;
  validityPeriod?: number; // in months, null = lifetime
  isActive: boolean;
  createdAt: string;
}

interface IssuedCertificate {
  id: string;
  certificateId: string;
  certificateName: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseName: string;
  issuedAt: string;
  expiresAt?: string;
  score: number;
}

const DEFAULT_CERTIFICATES: Certificate[] = [
  { id: "1", name: "Certificado de Inteligencia Emocional", description: "Otorgado por completar exitosamente el curso", courseId: "c1", courseName: "Inteligencia Emocional en el Trabajo", templateStyle: "premium", issuedCount: 98, validityPeriod: 24, isActive: true, createdAt: new Date(Date.now() - 86400000 * 180).toISOString() },
  { id: "2", name: "Certificado de Liderazgo", description: "Reconocimiento de competencias de liderazgo", courseId: "c2", courseName: "Liderazgo Transformacional", templateStyle: "modern", issuedCount: 45, validityPeriod: undefined, isActive: true, createdAt: new Date(Date.now() - 86400000 * 120).toISOString() },
  { id: "3", name: "Certificado de Comunicación", description: "Dominio de técnicas de comunicación asertiva", courseId: "c3", courseName: "Comunicación Asertiva", templateStyle: "classic", issuedCount: 156, validityPeriod: 12, isActive: true, createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
];

const DEFAULT_ISSUED: IssuedCertificate[] = [
  { id: "i1", certificateId: "1", certificateName: "Certificado de Inteligencia Emocional", userId: "u1", userName: "María López", userEmail: "maria@example.com", courseName: "Inteligencia Emocional en el Trabajo", issuedAt: new Date(Date.now() - 86400000 * 15).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 715).toISOString(), score: 92 },
  { id: "i2", certificateId: "1", certificateName: "Certificado de Inteligencia Emocional", userId: "u2", userName: "Laura Torres", userEmail: "laura@example.com", courseName: "Inteligencia Emocional en el Trabajo", issuedAt: new Date(Date.now() - 86400000 * 45).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 685).toISOString(), score: 88 },
  { id: "i3", certificateId: "3", certificateName: "Certificado de Comunicación", userId: "u3", userName: "Carlos Ruiz", userEmail: "carlos@example.com", courseName: "Comunicación Asertiva", issuedAt: new Date(Date.now() - 86400000 * 30).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 335).toISOString(), score: 85 },
];

const STYLE_CONFIG: Record<string, { label: string; color: string }> = {
  classic: { label: "Clásico", color: "bg-amber-500/20 text-amber-500" },
  modern: { label: "Moderno", color: "bg-blue-500/20 text-blue-500" },
  minimal: { label: "Minimalista", color: "bg-gray-500/20 text-gray-500" },
  premium: { label: "Premium", color: "bg-purple-500/20 text-purple-500" },
};

export default function CertificatesPage() {
  const { t } = useI18n();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [issuedCertificates, setIssuedCertificates] = useState<IssuedCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"templates" | "issued">("templates");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [certRes, issuedRes] = await Promise.all([
        fetch("/api/admin/education/certificates"),
        fetch("/api/admin/education/certificates/issued"),
      ]);
      if (certRes.ok) {
        const data = await certRes.json();
        setCertificates(data.certificates || DEFAULT_CERTIFICATES);
      } else {
        setCertificates(DEFAULT_CERTIFICATES);
      }
      if (issuedRes.ok) {
        const data = await issuedRes.json();
        setIssuedCertificates(data.issued || DEFAULT_ISSUED);
      } else {
        setIssuedCertificates(DEFAULT_ISSUED);
      }
    } catch {
      setCertificates(DEFAULT_CERTIFICATES);
      setIssuedCertificates(DEFAULT_ISSUED);
    } finally {
      setLoading(false);
    }
  }

  const filteredCertificates = certificates.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.courseName.toLowerCase().includes(search.toLowerCase())
  );

  const filteredIssued = issuedCertificates.filter((i) =>
    i.userName.toLowerCase().includes(search.toLowerCase()) || i.certificateName.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    templates: certificates.length,
    totalIssued: certificates.reduce((sum, c) => sum + c.issuedCount, 0),
    activeTemplates: certificates.filter((c) => c.isActive).length,
    recentIssued: issuedCertificates.filter((i) => new Date(i.issuedAt) > new Date(Date.now() - 86400000 * 30)).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--rowi-foreground)] flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" />
            {t("admin.education.certificates.title")}
          </h1>
          <p className="text-[var(--rowi-muted)] mt-1">{t("admin.education.certificates.description")}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => loadData()} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-card)] hover:bg-[var(--rowi-muted)]/10 transition-colors disabled:opacity-50">
            <RefreshCcw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--rowi-primary)] text-white hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" />
            {t("admin.education.certificates.new")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-[var(--rowi-muted)] mb-2"><FileText className="w-4 h-4" /><span className="text-xs">{t("admin.education.certificates.stats.templates")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.templates}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-green-500 mb-2"><CheckCircle className="w-4 h-4" /><span className="text-xs">{t("admin.education.certificates.stats.active")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.activeTemplates}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-blue-500 mb-2"><Award className="w-4 h-4" /><span className="text-xs">{t("admin.education.certificates.stats.issued")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.totalIssued}</p>
        </div>
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] p-4">
          <div className="flex items-center gap-2 text-purple-500 mb-2"><Calendar className="w-4 h-4" /><span className="text-xs">{t("admin.education.certificates.stats.recent")}</span></div>
          <p className="text-2xl font-bold text-[var(--rowi-foreground)]">{stats.recentIssued}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-[var(--rowi-border)]">
        <button onClick={() => setActiveTab("templates")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "templates" ? "text-[var(--rowi-primary)] border-b-2 border-[var(--rowi-primary)]" : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"}`}>
          {t("admin.education.certificates.tabs.templates")}
        </button>
        <button onClick={() => setActiveTab("issued")} className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "issued" ? "text-[var(--rowi-primary)] border-b-2 border-[var(--rowi-primary)]" : "text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"}`}>
          {t("admin.education.certificates.tabs.issued")}
        </button>
      </div>

      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--rowi-muted)]" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t("admin.education.certificates.search")} className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[var(--rowi-border)] bg-[var(--rowi-background)] text-[var(--rowi-foreground)] focus:border-[var(--rowi-primary)] focus:outline-none" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[var(--rowi-muted)]" /></div>
      ) : activeTab === "templates" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCertificates.map((cert) => {
            const styleInfo = STYLE_CONFIG[cert.templateStyle];
            return (
              <div key={cert.id} className={`bg-[var(--rowi-card)] rounded-xl border transition-all ${cert.isActive ? "border-[var(--rowi-border)]" : "border-[var(--rowi-border)] opacity-60"}`}>
                <div className="h-24 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-t-xl flex items-center justify-center relative">
                  <Award className="w-12 h-12 text-amber-500/50" />
                  <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-medium ${styleInfo.color}`}>
                    {styleInfo.label}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-[var(--rowi-foreground)] mb-1">{cert.name}</h3>
                  <p className="text-xs text-[var(--rowi-muted)] mb-2">{cert.description}</p>
                  <p className="text-xs text-[var(--rowi-muted)] mb-3">{cert.courseName}</p>

                  <div className="flex items-center gap-4 text-xs text-[var(--rowi-muted)] mb-3">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{cert.issuedCount} {t("admin.education.certificates.issued")}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{cert.validityPeriod ? `${cert.validityPeriod} ${t("admin.education.certificates.months")}` : t("admin.education.certificates.lifetime")}</span>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--rowi-border)]">
                    <button className="text-xs text-[var(--rowi-primary)] hover:underline flex items-center gap-1">
                      <Eye className="w-3 h-3" />{t("admin.education.certificates.preview")}
                    </button>
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10">
                      <MoreVertical className="w-4 h-4 text-[var(--rowi-muted)]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[var(--rowi-card)] rounded-xl border border-[var(--rowi-border)] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[var(--rowi-muted)]/5 border-b border-[var(--rowi-border)]">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.certificates.recipient")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.certificates.certificate")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.certificates.course")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.certificates.score")}</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-[var(--rowi-muted)]">{t("admin.education.certificates.issuedAt")}</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredIssued.map((issued) => (
                <tr key={issued.id} className="border-b border-[var(--rowi-border)] last:border-b-0 hover:bg-[var(--rowi-muted)]/5">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--rowi-foreground)]">{issued.userName}</p>
                    <p className="text-xs text-[var(--rowi-muted)]">{issued.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-[var(--rowi-foreground)]">{issued.certificateName}</td>
                  <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">{issued.courseName}</td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-[var(--rowi-foreground)]">
                      <Star className="w-3 h-3 text-amber-500" />{issued.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--rowi-muted)]">{new Date(issued.issuedAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-[var(--rowi-muted)]/10">
                      <Download className="w-4 h-4 text-[var(--rowi-muted)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
