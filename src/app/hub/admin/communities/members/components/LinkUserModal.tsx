"use client";

import { useState, useEffect } from "react";
import { X, Search, Loader2, CheckCircle } from "lucide-react";

interface LinkUserModalProps {
  memberId: string;
  open: boolean;
  onClose: () => void;
  onLinked: (data: any) => void;
}

export default function LinkUserModal({
  memberId,
  open,
  onClose,
  onLinked,
}: LinkUserModalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (query.length < 2) return;
    setLoading(true);
    const load = async () => {
      try {
        const res = await fetch(`/api/hub/users?search=${query}`);
        const data = await res.json();
        setUsers(data);
      } catch (err) {
        console.error("Error cargando usuarios:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [query]);

  const handleLink = async () => {
    if (!selected) return;
    setLinking(true);
    try {
      const res = await fetch(`/api/hub/communities/members/${memberId}/link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selected.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setDone(true);
        onLinked(data.member);
        setTimeout(() => {
          setDone(false);
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error("Error al vincular:", err);
    } finally {
      setLinking(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-2xl shadow-xl p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-lg font-semibold mb-4 text-rowi-blueDay">
          Vincular Usuario RowiVerse
        </h2>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rowi-blueDay"
          />
        </div>

        {loading ? (
          <div className="text-center py-6 text-gray-500">
            <Loader2 className="w-5 h-5 mx-auto animate-spin mb-2" />
            Cargando usuarios...
          </div>
        ) : (
          <ul className="max-h-48 overflow-y-auto divide-y divide-gray-100 border rounded-md mb-4">
            {users.length === 0 && query.length >= 2 && (
              <li className="text-center text-sm text-gray-400 py-3">
                No se encontraron coincidencias
              </li>
            )}
            {users.map((u) => (
              <li
                key={u.id}
                onClick={() => setSelected(u)}
                className={`px-4 py-2 cursor-pointer hover:bg-rowi-blueDay/10 transition ${
                  selected?.id === u.id
                    ? "bg-rowi-blueDay/20 font-semibold"
                    : ""
                }`}
              >
                <p className="text-sm">{u.name || "Sin nombre"}</p>
                <p className="text-xs text-gray-500">{u.email}</p>
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={handleLink}
          disabled={!selected || linking || done}
          className={`w-full py-2 rounded-md text-sm font-semibold transition ${
            done
              ? "bg-green-500 text-white"
              : "bg-rowi-blueDay text-white hover:bg-rowi-pinkDay"
          }`}
        >
          {linking ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : done ? (
            <div className="flex items-center justify-center gap-2">
              <CheckCircle className="w-4 h-4" /> Vinculado
            </div>
          ) : (
            "Vincular"
          )}
        </button>
      </div>
    </div>
  );
}