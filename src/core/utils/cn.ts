// src/core/utils/cn.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 🧩 cn — Combina clases Tailwind + clsx y resuelve conflictos.
 * Ejemplo:
 *   cn("px-2", isActive && "bg-green-500", "text-sm")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}