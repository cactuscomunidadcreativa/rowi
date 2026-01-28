"use client";

import { Suspense } from "react";
import HubRolesClient from "./roles-client"; // 👈 referencia al archivo separado

export default function HubRolesPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Cargando roles...</div>}>
      <HubRolesClient />
    </Suspense>
  );
}