import { redirect } from "next/navigation";

/**
 * /feed era un feed LEGACY que leía de /api/posts (almacenado en un archivo
 * JSON, que no persiste en el filesystem efímero de Vercel) y enlazaba a
 * /post/new ("próximamente"). El feed real, con persistencia en DB y composer
 * funcional, vive en /social/feed. Redirigimos para no mantener dos feeds
 * (uno roto).
 */
export default function FeedRedirect() {
  redirect("/social/feed");
}
