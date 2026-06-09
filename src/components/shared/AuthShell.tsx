"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

/**
 * AuthShell — el sistema visual unificado de las pantallas de auth de Rowi.
 *
 * Extraído del diseño de referencia de /signin para que signin, public/login y
 * hub/login compartan la MISMA cara de marca: blobs violeta/rosa, tarjeta
 * redondeada con tokens, búho + wordmark "Rowi", tono cálido. Sin duplicar.
 */

/** Blobs flotantes de fondo (violeta/rosa, marca nueva). */
export function FloatingBlobs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#7c3aed]/30 to-[#7a59c9]/20 blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-[#d797cf]/30 to-[#f378a5]/20 blur-3xl animate-pulse [animation-delay:2s]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-gradient-to-br from-[#7a59c9]/15 to-[#7c3aed]/10 blur-3xl animate-pulse [animation-delay:4s]" />
    </div>
  );
}

export interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Pie opcional bajo la tarjeta (links de ayuda, etc.). */
  footer?: React.ReactNode;
  /** Ancho máx. de la tarjeta. Default 420px (como signin). */
  maxWidthClass?: string;
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  maxWidthClass = "max-w-[420px]",
}: AuthShellProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-[var(--rowi-bg)] overflow-hidden px-4 py-12">
      <FloatingBlobs />

      <div
        className={`relative z-10 w-full ${maxWidthClass} transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div className="bg-[var(--rowi-card)] rounded-3xl shadow-2xl border border-[var(--rowi-card-border)] p-8 space-y-6">
          {/* Logo + búho + título */}
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-3 mb-5 group">
              <Image
                src="/rowi-logo.png"
                alt="Rowi"
                width={52}
                height={52}
                className="rounded-2xl shadow-lg group-hover:scale-105 transition-transform"
              />
              <span className="font-heading font-bold text-3xl rowi-gradient-text">Rowi</span>
            </Link>
            <h1 className="text-2xl font-heading font-bold text-[var(--rowi-fg)] mb-1">{title}</h1>
            {subtitle && <p className="text-sm text-[var(--rowi-muted)]">{subtitle}</p>}
          </div>

          {children}
        </div>

        {footer && <div className="mt-5 text-center">{footer}</div>}
      </div>
    </main>
  );
}

export default AuthShell;
