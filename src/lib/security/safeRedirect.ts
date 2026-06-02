/**
 * 🔐 safeInternalUrl — valida una URL de redirección contra una allowlist de
 * rutas internas para prevenir open-redirects.
 *
 * Acepta tanto URLs absolutas (de las que toma SOLO el pathname, descartando
 * cualquier host/origen externo) como paths relativos. Si la ruta no está en
 * la allowlist, devuelve el fallback. El resultado siempre cuelga de baseUrl,
 * nunca de un host arbitrario.
 *
 * Usado por el checkout de Stripe para honrar successUrl/cancelUrl del cliente
 * sin permitir que un atacante redirija el flujo post-pago a un sitio externo.
 */
export function safeInternalUrl(
  raw: unknown,
  allowlist: string[],
  baseUrl: string,
  fallbackPath: string
): string {
  const base = baseUrl.replace(/\/$/, "");
  if (typeof raw !== "string" || !raw) return `${base}${fallbackPath}`;

  let pathname: string;
  try {
    // path relativo → tomar tal cual (sin query/hash); URL absoluta → solo path
    pathname = raw.startsWith("/") ? raw.split(/[?#]/)[0] : new URL(raw).pathname;
  } catch {
    return `${base}${fallbackPath}`;
  }

  const allowed = allowlist.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  return allowed ? `${base}${pathname}` : `${base}${fallbackPath}`;
}
