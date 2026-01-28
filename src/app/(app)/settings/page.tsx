export default function SettingsIndex() {
  return (
    <main className="space-y-4">
      <header className="rowi-card">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="rowi-muted text-sm">Elige una sección.</p>
      </header>
      <section className="grid gap-3 sm:grid-cols-2">
        <a href="/settings/profile" className="rowi-card">
          <div className="font-medium">Perfil</div>
          <div className="rowi-muted text-sm">Editar tu perfil</div>
        </a>
        <a href="/settings/invites" className="rowi-card">
          <div className="font-medium">Invitaciones</div>
          <div className="rowi-muted text-sm">Gestiona invitaciones</div>
        </a>
      </section>
    </main>
  );
}
