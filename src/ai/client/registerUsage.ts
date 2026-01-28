// src/ai/registerUsage.ts
export async function registerUsage({
  tenantId,
  feature,
  model,
  tokensInput,
  tokensOutput,
  costUsd,
}: {
  tenantId: string;
  feature: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd?: number;
}) {
  try {
    // ✅ Construir URL absoluta (funciona en Node y en Browser)
    let base: string;

    if (process.env.NEXT_PUBLIC_SITE_URL) {
      base = process.env.NEXT_PUBLIC_SITE_URL;
    } else if (process.env.VERCEL_URL) {
      base = process.env.VERCEL_URL.startsWith("http")
        ? process.env.VERCEL_URL
        : `https://${process.env.VERCEL_URL}`;
    } else {
      base = "http://localhost:3000";
    }

    const url = `${base}/api/hub/usage/check`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenantId,
        feature: feature.toUpperCase(), // 👈 normaliza el enum
        model,
        tokensInput,
        tokensOutput,
        costUsd: costUsd ?? 0,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.warn("⚠️ Límite de uso o error de registro:", data);
      return null;
    }

    return data;
  } catch (e) {
    console.error("❌ Error registrando uso IA:", e);
    return null;
  }
}