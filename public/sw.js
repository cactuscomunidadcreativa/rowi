/* Rowi Service Worker (F3 · T3-a Rowi Launch 1.0)
 *
 * Dos trabajos:
 *  1. Web Push: recibe las notificaciones del loop diario (recordatorio de
 *     reflexión, hitos de racha, evolución del avatar) y abre la app al tocar.
 *  2. Base PWA instalable (requisito de instalación + shell Capacitor futuro).
 *
 * Sin estrategia de cache agresiva a propósito: la app es dinámica y un SW
 * con cache stale rompería más de lo que acelera. Solo push + ciclo de vida.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Rowi", body: event.data.text() };
  }
  const title = payload.title || "Rowi";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/web-app-manifest-192x192.png",
    badge: payload.badge || "/web-app-manifest-192x192.png",
    tag: payload.tag || "rowi",
    data: payload.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || "/today";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ("focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(url);
          return;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
