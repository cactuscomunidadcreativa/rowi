// src/app/api/community/connections/route.ts
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isDemo = url.searchParams.get("demo") === "1";

  if (isDemo) {
    const connections = [
      // Trabajo
      "Jefe","Par/Colega","Subordinado","Cliente","Proveedor","Socio","Mentor","Mentee","Colaborador externo","Excompañero","Recruiter/HR",
      // Familia
      "Padre","Madre","Hijo/a","Hermano/a","Abuelo/a","Tío/a","Primo/a","Pareja","Expareja","Mamá/Papá de mi hijo",
      // Amigos
      "Escuela/Colegio","Universidad","Amistad trabajo","Comunidad/Club","Amigos cercanos","Online/Redes",
      // Por conocer
      "Networking","Futuro cliente","Interés amoroso","Referencia","Contacto de evento","Prospecto"
    ];
    return NextResponse.json({ connections });
  }
  return NextResponse.json({ connections: [] });
}