import { prisma } from "@/core/prisma";

/**
 * Carga el contexto del usuario desde la base de datos (sin duplicar).
 * Si ya se mostró localmente, solo agrega lo nuevo.
 */
export async function loadContext(userId: string, limit = 10, lastSeenId?: string) {
  try {
    const logs = await prisma.rowiChat.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    const filtered = lastSeenId
      ? logs.filter((log) => log.id !== lastSeenId)
      : logs;

    return filtered.reverse().map((log) => ({
      id: log.id,
      role: log.role === "rowi" ? "assistant" : "user",
      content: log.content,
      locale: log.locale,
      createdAt: log.createdAt,
    }));
  } catch (e) {
    console.error("⚠️ Error cargando contexto:", e);
    return [];
  }
}