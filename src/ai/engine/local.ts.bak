// src/ai/memory/local.ts
import type { MemoryEvent } from "@/types/rowi";

const LS_KEY = "rowi.memory.v1";
const USER_KEY = "rowi.user.authenticated"; // flag de sesión local

function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(USER_KEY) === "true";
  } catch {
    return false;
  }
}

export function setAuthenticated(flag: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USER_KEY, flag ? "true" : "false");
}

export function loadMemory(max = 50): MemoryEvent[] {
  if (!isAuthenticated()) return []; // solo usuarios logueados
  try {
    const raw = localStorage.getItem(LS_KEY);
    const arr: MemoryEvent[] = raw ? JSON.parse(raw) : [];
    return arr.slice(-max);
  } catch {
    return [];
  }
}

export function saveEvent(e: MemoryEvent) {
  if (!isAuthenticated()) return;
  const arr = loadMemory(1000);
  arr.push(e);
  localStorage.setItem(LS_KEY, JSON.stringify(arr));
}

export function clearMemory() {
  if (!isAuthenticated()) return;
  localStorage.removeItem(LS_KEY);
}