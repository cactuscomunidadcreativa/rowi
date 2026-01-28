export default function PricingPage() {
  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="text-3xl font-bold">Pricing</h1>
      <p className="mt-2 opacity-80">Elige el plan que mejor se adapte a tu equipo.</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {[
          { name: "Starter", price: "Gratis", desc: "Ideal para explorar" },
          { name: "Team", price: "$19/usuario", desc: "Equipos pequeños" },
          { name: "Enterprise", price: "Custom", desc: "Soporte y SSO" },
        ].map((p) => (
          <div key={p.name} className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="text-xl font-semibold">{p.name}</h3>
            <p className="mt-1 opacity-80">{p.desc}</p>
            <div className="mt-4 text-2xl">{p.price}</div>
            <a
              href="/contact"
              className="mt-4 inline-block rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10"
            >
              Empezar
            </a>
          </div>
        ))}
      </div>
    </main>
  );
}