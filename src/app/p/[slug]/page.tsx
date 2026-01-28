import { prisma } from "@/core/prisma";

export default async function PublicPage({ params }: { params: { slug: string } }) {
  const page = await prisma.page.findFirst({
    where: { slug: params.slug, status: "published" }
  });

  if (!page)
    return <div className="p-8 text-gray-500">Página no encontrada</div>;

  const blocks = (page as any).blocks || {};
  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {blocks.content ? (
        <p className="text-gray-700 whitespace-pre-wrap">{blocks.content}</p>
      ) : null}
    </main>
  );
}
