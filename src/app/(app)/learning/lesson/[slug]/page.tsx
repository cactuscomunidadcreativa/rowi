/**
 * Página de detalle de una micro-lesson. Server Component que hace
 * SELECT directo y delega al client component LessonClient para el
 * botón "Marcar completado".
 */
import { notFound } from "next/navigation";
import { prisma } from "@/core/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/core/auth";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import LessonClient from "./LessonClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function LessonPage({ params }: Props) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const email = session?.user?.email?.toLowerCase();

  const lesson = await prisma.microLearning.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      parentKey: true,
      title: true,
      titleEN: true,
      description: true,
      descriptionEN: true,
      duration: true,
      difficulty: true,
      points: true,
      content: true,
      isActive: true,
    },
  });

  if (!lesson || !lesson.isActive) {
    notFound();
  }

  let alreadyCompleted = false;
  if (email) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      const ump = await prisma.userMicroLearning.findUnique({
        where: { userId_microLearningId: { userId: user.id, microLearningId: lesson.id } },
        select: { status: true },
      });
      if (ump?.status === "COMPLETED") alreadyCompleted = true;
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--rowi-bg)] to-[var(--rowi-card-elev)]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Link
          href="/learning"
          className="inline-flex items-center gap-2 text-sm text-[var(--rowi-muted)] hover:text-[var(--rowi-foreground)]"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Aprendizaje
        </Link>

        <LessonClient
          slug={lesson.slug}
          sei={lesson.parentKey}
          title={lesson.title}
          titleEN={lesson.titleEN ?? lesson.title}
          description={lesson.description ?? ""}
          descriptionEN={lesson.descriptionEN ?? lesson.description ?? ""}
          durationMin={lesson.duration}
          difficulty={lesson.difficulty}
          points={lesson.points}
          track={(lesson.content as { track?: string } | null)?.track ?? null}
          alreadyCompleted={alreadyCompleted}
        />
      </div>
    </div>
  );
}
