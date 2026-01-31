export default function ContactPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-3xl font-bold">Contacto</h1>
      <p className="mt-3 opacity-80">
        ¿Tienes dudas o quieres una demo? Escríbenos y coordinamos.
      </p>

      <form className="mt-6 grid gap-3">
        <input
          className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
          placeholder="Nombre"
        />
        <input
          className="rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
          placeholder="Email"
          type="email"
        />
        <textarea
          className="min-h-[120px] rounded-xl bg-white/5 px-3 py-2 ring-1 ring-white/10"
          placeholder="Cuéntanos brevemente tu necesidad"
        />
        <button className="mt-2 w-fit rounded-xl bg-white px-4 py-2 text-black hover:bg-white/90">
          Enviar
        </button>
      </form>
    </main>
  );
}