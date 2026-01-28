"use client";
import { useState, useRef, useEffect } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import Link from "next/link";

export default function UserActions() {
  const { data } = useSession();
  const user = data?.user;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) {
    return (
      <button
        className="rounded-md border px-3 py-1 text-xs"
        onClick={() => signIn(undefined, { callbackUrl: "/dashboard" })}
      >
        Sign in
      </button>
    );
  }

  const display = user.name || user.email || "Yo";

  return (
    <div className="relative" ref={ref}>
      <button
        className="rounded-full border w-8 h-8 text-xs flex items-center justify-center"
        onClick={() => setOpen((v) => !v)}
        aria-label="Abrir menú de usuario"
        title={display}
      >
        {(user as any)?.image ? (
          // si el provider trae imagen
          // eslint-disable-next-line @next/next/no-img-element
          <img src={(user as any).image} alt="avatar" className="w-8 h-8 rounded-full" />
        ) : (
          <span>🙂</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 min-w-[200px] rounded-md border bg-black/90 backdrop-blur p-2 text-sm shadow-lg z-50">
          <div className="px-2 py-2 text-gray-400 truncate">{display}</div>
          <div className="my-1 border-t border-white/10" />
          <ul className="space-y-1">
            <li>
              <Link
                href="/me"
                className="block rounded-md px-2 py-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Mi perfil
              </Link>
            </li>
            <li>
              <Link
                href="/me/profile"
                className="block rounded-md px-2 py-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Configurar perfil
              </Link>
            </li>
            <li>
              <Link
                href="/me/data"
                className="block rounded-md px-2 py-2 hover:bg-white/10"
                onClick={() => setOpen(false)}
              >
                Mis datos (CSV)
              </Link>
            </li>
          </ul>
          <div className="my-1 border-t border-white/10" />
          <button
            className="w-full text-left rounded-md px-2 py-2 hover:bg-white/10"
            onClick={() => signOut({ callbackUrl: "/" })}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}