"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  alt,
  className,
}: {
  src?: string | null;
  alt?: string | null;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-muted overflow-hidden",
        className
      )}
      style={{ width: "40px", height: "40px" }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt || "avatar"} className="object-cover w-full h-full" />
      ) : (
        <span className="text-xs text-muted-foreground">👤</span>
      )}
    </div>
  );
}