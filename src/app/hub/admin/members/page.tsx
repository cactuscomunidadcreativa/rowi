"use client";
import { Suspense } from "react";
import HubMembersClient from "./members-client"; // 👈 referencia al archivo separado

export default function HubMembersPageWrapper() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Cargando miembros...</div>}>
      <HubMembersClient />
    </Suspense>
  );
}