"use client";

import { useEffect, useState } from "react";
import { getProviders, signIn } from "next-auth/react";

export default function HubLoginPage() {
  const [providers, setProviders] = useState<any>({});

  useEffect(() => {
    getProviders().then((prov) => setProviders(prov || {}));
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#31a2e3] via-[#7a59c9] to-[#d797cf] text-white p-6">
      <div className="max-w-sm w-full bg-black/40 backdrop-blur-xl rounded-2xl shadow-xl p-8 space-y-6 text-center">
        <h1 className="text-2xl font-bold mb-2">🔐 Iniciar sesión en Rowi</h1>
        <p className="text-sm opacity-80 mb-6">
          Accede con tu cuenta para continuar.
        </p>

        {Object.values(providers).map((provider: any) => (
          <button
            key={provider.id}
            onClick={() => signIn(provider.id, { callbackUrl: "/dashboard" })}
            className="w-full py-3 px-4 bg-white/90 hover:bg-white text-gray-900 rounded-lg font-medium transition-all flex items-center justify-center gap-2"
          >
            {provider.name === "Google" && <span>🔵</span>}
            Ingresar con {provider.name}
          </button>
        ))}
      </div>
    </main>
  );
}