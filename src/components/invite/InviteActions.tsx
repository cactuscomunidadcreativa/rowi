// src/components/invite/InviteActions.tsx
"use client";

type Props = { inviteUrl: string };

export default function InviteActions({ inviteUrl }: Props) {
  const shareText =
    "Te invito a Rowi (EQ + comunidad). Únete con mi enlace:";
  const wa = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${inviteUrl}`
  )}`;
  const mail = `mailto:?subject=${encodeURIComponent(
    "Únete a Rowi"
  )}&body=${encodeURIComponent(`${shareText}\n${inviteUrl}`)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    inviteUrl
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert("Copiado al portapapeles");
    } catch {
      // fallback silencioso
    }
  }

  return (
    <>
      <div className="rounded-xl border p-4 bg-white/5">
        <div className="text-xs opacity-60 mb-1">Tu enlace</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs">
            {inviteUrl}
          </code>
          <button
            onClick={copy}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-white/10"
          >
            Copiar
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <a
          className="rounded-lg border px-3 py-2 text-sm hover:bg-white/10"
          href={wa}
          target="_blank"
          rel="noreferrer"
        >
          WhatsApp
        </a>
        <a
          className="rounded-lg border px-3 py-2 text-sm hover:bg-white/10"
          href={mail}
        >
          Email
        </a>
        <a
          className="rounded-lg border px-3 py-2 text-sm hover:bg-white/10"
          href={li}
          target="_blank"
          rel="noreferrer"
        >
          LinkedIn
        </a>
      </div>
    </>
  );
}