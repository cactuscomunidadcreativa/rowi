"use client";

/**
 * PushManager (F3 · T3-a Rowi Launch 1.0) — el eslabón cliente que faltaba.
 *
 * El servidor de push estaba completo (provider Web Push + endpoint
 * /api/notifications/push/subscribe + modelo PushSubscription) pero el
 * cliente no existía: cero service worker, cero suscripciones posibles
 * (auditoría jun-2026, retención P2). Este componente:
 *
 *  1. Registra /sw.js para usuarios autenticados.
 *  2. Pide permiso de notificaciones SOLO tras una señal de hábito (el
 *     usuario ya cerró al menos un día — pedirlo en el primer pageview es
 *     la forma más rápida de un "Bloquear" permanente).
 *  3. Envía la suscripción VAPID al backend.
 *
 * Código-listo detrás de env: sin NEXT_PUBLIC_VAPID_PUBLIC_KEY no hace nada
 * (mismo patrón que las integraciones de sesión 6).
 */
import { useEffect } from "react";
import { useSession } from "next-auth/react";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

const ASKED_KEY = "rowi_push_asked";

export default function PushManager() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== "authenticated") return;
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    let cancelled = false;

    (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");

        // Ya suscrito: nada que hacer.
        const existing = await registration.pushManager.getSubscription();
        if (existing || cancelled) return;

        // Permiso denegado antes o ya preguntamos esta sesión: no insistir.
        if (Notification.permission === "denied") return;
        if (sessionStorage.getItem(ASKED_KEY)) return;

        // Señal de hábito: pedir permiso solo si el usuario ya cerró al
        // menos un día (tiene racha). Evita el prompt en el primer pageview.
        const pulse = await fetch("/api/daily-pulse/today")
          .then((r) => r.json())
          .catch(() => null);
        const streak = pulse?.streak?.current ?? pulse?.currentStreak ?? 0;
        if (!streak || streak < 1 || cancelled) return;

        sessionStorage.setItem(ASKED_KEY, "1");
        const permission = await Notification.requestPermission();
        if (permission !== "granted" || cancelled) return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        await fetch("/api/notifications/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscription: subscription.toJSON(),
            deviceName: navigator.userAgent.slice(0, 120),
          }),
        });
      } catch {
        /* push es mejora progresiva: nunca rompe la app */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return null;
}
