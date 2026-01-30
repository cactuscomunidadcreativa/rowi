"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmotionWheel } from "@/components/eq";
import { Loader2, ArrowLeft, Send } from "lucide-react";
import Link from "next/link";

interface Session {
  id: string;
  weekNumber: number;
  year: number;
}

interface UserVocabulary {
  level: "DESAFIO" | "EMERGENTE" | "FUNCIONAL" | "DIESTRO" | "EXPERTO";
  totalCheckins: number;
  uniqueEmotionsUsed: number;
}

export default function WeekFlowCheckinPage() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useParams();
  const hubId = params.hubId as string;
  const { data: authSession, status } = useSession();
  const authLoading = status === "loading";

  const [session, setSession] = useState<Session | null>(null);
  const [vocabulary, setVocabulary] = useState<UserVocabulary | null>(null);
  const [selectedEmotion, setSelectedEmotion] = useState<string | null>(null);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && authSession) {
      fetchData();
    }
  }, [authLoading, authSession, hubId]);

  const fetchData = async () => {
    try {
      // Fetch session
      const sessionRes = await fetch(`/api/weekflow/sessions?hubId=${hubId}&current=true`);
      const sessionData = await sessionRes.json();
      if (sessionData.ok) {
        setSession(sessionData.session);
        // Si ya hizo check-in, redirigir
        if (sessionData.userCheckin) {
          router.push(`/weekflow/${hubId}`);
          return;
        }
      }

      // Fetch vocabulary level (para saber qué emociones mostrar)
      // Por ahora usamos nivel default, luego se puede obtener del API
      setVocabulary({
        level: "DESAFIO",
        totalCheckins: 0,
        uniqueEmotionsUsed: 0,
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error al cargar datos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmotionSelect = (emotion: string, newIntensity: number) => {
    setSelectedEmotion(emotion);
    setIntensity(newIntensity);
  };

  const handleSubmit = async () => {
    if (!selectedEmotion || !session) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/weekflow/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          emotion: selectedEmotion,
          intensity: Math.ceil(intensity / 3.33), // Convertir de 1-10 a 1-3
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(`/weekflow/${hubId}`);
      } else {
        setError(data.error || "Error al guardar check-in");
      }
    } catch (error) {
      console.error("Error submitting checkin:", error);
      setError("Error al enviar check-in");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      {/* Back button */}
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/weekflow/${hubId}`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("common.back") || "Volver"}
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t("weekflow.checkin.title") || "¿Cómo te sientes esta semana?"}
          </CardTitle>
          <CardDescription>
            {t("weekflow.checkin.subtitle") ||
              "Tu check-in ayuda al equipo a entenderse mejor"}
          </CardDescription>
          {session && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("weekflow.week") || "Semana"} {session.weekNumber}, {session.year}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Emotion Wheel */}
          <EmotionWheel
            userLevel={vocabulary?.level || "DESAFIO"}
            selectedEmotion={selectedEmotion}
            onSelect={handleEmotionSelect}
            showIntensity={true}
            size="lg"
          />

          {/* Note (optional) */}
          {selectedEmotion && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("weekflow.checkin.noteLabel") || "¿Algo más que quieras compartir?"}{" "}
                <span className="text-muted-foreground">
                  ({t("common.optional") || "opcional"})
                </span>
              </label>
              <Textarea
                placeholder={
                  t("weekflow.checkin.notePlaceholder") ||
                  "Comparte contexto con tu equipo..."
                }
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedEmotion || isSubmitting}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("common.saving") || "Guardando..."}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("weekflow.checkin.submit") || "Enviar Check-in"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
