// src/components/invite/InviteActions.tsx
"use client";

import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = { inviteUrl: string };

const INV_T = {
  es: { share: "Te invito a Rowi (EQ + comunidad). Únete con mi enlace:", join: "Únete a Rowi", copied: "Copiado al portapapeles", link: "Tu enlace", copy: "Copiar" },
  en: { share: "I invite you to Rowi (EQ + community). Join with my link:", join: "Join Rowi", copied: "Copied to clipboard", link: "Your link", copy: "Copy" },
  pt: { share: "Convido você ao Rowi (EQ + comunidade). Junte-se com meu link:", join: "Junte-se ao Rowi", copied: "Copiado para a área de transferência", link: "Seu link", copy: "Copiar" },
  it: { share: "Ti invito a Rowi (EQ + comunità). Unisciti con il mio link:", join: "Unisciti a Rowi", copied: "Copiato negli appunti", link: "Il tuo link", copy: "Copia" },
};

export default function InviteActions({ inviteUrl }: Props) {
  const { lang } = useI18n();
  const it = INV_T[lang as keyof typeof INV_T] || INV_T.en;
  const shareText = it.share;
  const wa = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${inviteUrl}`
  )}`;
  const mail = `mailto:?subject=${encodeURIComponent(
    it.join
  )}&body=${encodeURIComponent(`${shareText}\n${inviteUrl}`)}`;
  const li = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    inviteUrl
  )}`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      alert(it.copied);
    } catch {
      // fallback silencioso
    }
  }

  return (
    <>
      <div className="rounded-xl border p-4 bg-white/5">
        <div className="text-xs opacity-60 mb-1">{it.link}</div>
        <div className="flex items-center gap-2">
          <code className="flex-1 overflow-x-auto rounded bg-black/30 px-3 py-2 text-xs">
            {inviteUrl}
          </code>
          <button
            onClick={copy}
            className="rounded-lg border px-3 py-2 text-sm hover:bg-white/10"
          >
            {it.copy}
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