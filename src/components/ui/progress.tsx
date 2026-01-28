"use client";

import * as React from "react";
import { cn } from "@/core/utils/cn";

/**
 * =========================================================
 * 🔹 Rowi Progress Bar
 * ---------------------------------------------------------
 * Simple, fluido y accesible.
 * Muestra un progreso visual con transición suave.
 * =========================================================
 */
export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  color?: string;
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, color, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700",
          className
        )}
        {...props}
      >
        <div
          className="h-full transition-all duration-700 ease-out rounded-full"
          style={{
            width: `${Math.min(value, 100)}%`,
            backgroundColor: color || "var(--rowi-blueDay, #2563eb)",
          }}
        />
      </div>
    );
  }
);

Progress.displayName = "Progress";