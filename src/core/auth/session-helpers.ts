// src/lib/session-helpers.ts
import { getServerSession } from "next-auth";

export async function getSessionEmail() {
  const session = await getServerSession();
  const email = session?.user?.email ?? null;
  return { session, email };
}

export function isAuthed(email: string | null): email is string {
  return !!email;
}