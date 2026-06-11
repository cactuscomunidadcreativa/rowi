/**
 * /settings/privacy → redirect a /hub/account/privacy (F5 · Rowi Launch 1.0).
 *
 * Antes había DOS páginas de privacidad divergentes (auditoría jun-2026, P1):
 * esta mostraba defaults opt-out, toggles de visibilidad FANTASMA (confirmaban
 * "Guardado" sin persistir nada) y borrado por mailto a un buzón inexistente,
 * mientras /hub/account/privacy tiene el catálogo real de consentimientos
 * (UserConsent) y el borrado self-service GDPR Art. 17. Una sola verdad.
 */
import { redirect } from "next/navigation";

export default function SettingsPrivacyRedirect() {
  redirect("/hub/account/privacy");
}
