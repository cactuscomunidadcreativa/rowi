"use client";

import { getProviders, signIn } from "next-auth/react";
import { useEffect, useState } from "react";

export default function SignInPage() {
  const [providers, setProviders] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const prov = await getProviders();
      setProviders(prov);
    })();
  }, []);

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#31a2e3] to-[#7a59c9] text-white">
      <h1 className="text-3xl font-bold mb-6">Inicia sesión en Rowi 🌱</h1>
      {providers &&
        Object.values(providers).map((provider: any) => (
          <button
            key={provider.name}
            onClick={() => signIn(provider.id, { callbackUrl: "/" })}
            className="bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition mb-3"
          >
            Continuar con {provider.name}
          </button>
        ))}
    </main>
  );
}