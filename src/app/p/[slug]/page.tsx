import { prisma } from "@/core/prisma";

// Next.js 16: params is a Promise in app router page components.
export default async function PublicPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  // Page has a `published: Boolean` column, not a `status` string.
  const page = await prisma.page.findFirst({
    where: { slug, published: true },
  });

  if (!page)
    return <div className="p-8 text-gray-500">Página no encontrada</div>;

  const content = (page.content as any) || {};
  return (
    <main className="max-w-3xl mx-auto p-8 space-y-6">
      <h1 className="text-3xl font-bold">{page.title}</h1>
      {content.text ? (
        <p className="text-gray-700 whitespace-pre-wrap">{content.text}</p>
      ) : null}
    </main>
  );
}
