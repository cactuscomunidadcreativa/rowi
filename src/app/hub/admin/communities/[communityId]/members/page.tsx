"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { UserCircle2, Loader2, Eye } from "lucide-react";

export default function CommunityMembersPage() {
  const { communityId } = useParams();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMembers() {
      try {
        const res = await fetch(`/api/hub/communities/${communityId}/members`);
        const data = await res.json();
        setMembers(data);
      } catch (err) {
        console.error("❌ Error cargando miembros:", err);
      } finally {
        setLoading(false);
      }
    }
    loadMembers();
  }, [communityId]);

  return (
    <div className="p-6 space-y-6">
      <header className="flex justify-between items-center border-b pb-3">
        <h1 className="text-2xl font-bold text-rowi-blueDay">
          Miembros de la Comunidad
        </h1>
        <Link
          href="/hub/admin/communities"
          className="text-sm text-rowi-blueDay hover:underline"
        >
          ← Volver a Comunidades
        </Link>
      </header>

      {loading ? (
        <div className="flex justify-center py-10 text-gray-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Cargando miembros...
        </div>
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No hay miembros registrados.</p>
      ) : (
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full text-sm">
            <thead className="bg-rowi-blueDay/10 text-rowi-blueDay uppercase text-xs">
              <tr>
                <th className="px-4 py-2 text-left">Usuario</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Rol</th>
                <th className="px-4 py-2 text-left">Estado</th>
                <th className="px-4 py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-t hover:bg-rowi-blueDay/5">
                  <td className="px-4 py-2 flex items-center gap-2">
                    {m.user?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.user.image}
                        alt={m.user.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <UserCircle2 className="w-6 h-6 text-gray-400" />
                    )}
                    {m.user?.name || "—"}
                  </td>
                  <td className="px-4 py-2">{m.user?.email || "—"}</td>
                  <td className="px-4 py-2">{m.role}</td>
                  <td className="px-4 py-2">{m.status}</td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/hub/admin/communities/members/${m.id}`}
                      className="inline-flex items-center gap-1 text-rowi-blueDay hover:text-rowi-pinkDay"
                    >
                      <Eye className="w-4 h-4" /> Ver perfil
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}