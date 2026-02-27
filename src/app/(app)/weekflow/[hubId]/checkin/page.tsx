"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { EmotionWheel } from "@/components/eq";
import { FeelingsWheel } from "@/components/eq/FeelingsWheel";
import { Loader2, ArrowLeft, Send, Lightbulb, Flower2, CircleDot } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

type WheelMode = "plutchik" | "feelings";

const PROMPT_COUNT = 10;

// Emotion category mapping for guidance lookups
function getEmotionCategory(emotion: string): string {
  const slug = emotion.toUpperCase();
  if (["JOY", "ALEGRIA", "CONTENT", "CONTENTO", "PROUD", "PLAYFUL", "OPTIMISTIC", "DELEITE", "DICHA", "AMOR", "FELICIDAD", "ESTREMECIMIENTO"].includes(slug)) return "positive";
  if (["TRUST", "CONFIANZA", "PEACEFUL", "HOPEFUL", "INTIMATE", "VINCULO", "UNION", "DEVOCION", "SALVAGUARDA", "CALMA"].includes(slug)) return "trust";
  if (["FEAR", "TEMOR", "ANXIOUS", "ANSIEDAD", "WORRIED", "OVERWHELMED", "INSECURE", "NERVIOS", "SUSTO", "CONMOCION", "INTRANQUILIDAD", "DUDA", "TENSION"].includes(slug)) return "fear";
  if (["SURPRISE", "SORPRESA", "AMAZED", "EXCITED", "CONFUSED", "ALARMA", "ASOMBRO", "ADMIRACION", "INCREDULIDAD", "CURIOSIDAD"].includes(slug)) return "surprise";
  if (["SADNESS", "TRISTEZA", "LONELY", "VULNERABLE", "GUILTY", "HURT", "NOSTALGIA", "DEPRESION", "REMORDIMIENTO", "REBELDIA", "CULPA"].includes(slug)) return "sadness";
  if (["ANGER", "FURIA", "FRUSTRATED", "BITTER", "CRITICAL", "RABIA", "ODIO", "MOLESTIA", "HOSTILIDAD", "FRUSTRACION", "IRRITABILIDAD"].includes(slug)) return "anger";
  if (["DISGUST", "DESAGRADO", "DISAPPOINTED", "DISAPPROVING", "INDIGNACION", "REPULSION", "ABORRECIMIENTO", "RECHAZO", "DETESTAR"].includes(slug)) return "disgust";
  if (["ANTICIPATION", "ANTICIPACION", "TIRED", "STRESSED", "BORED", "BUSY", "BUSQUEDA", "EXPECTACION", "ANHELO", "IMPACIENCIA", "ENTUSIASMO"].includes(slug)) return "anticipation";
  return "default";
}

export default function WeekFlowCheckinPage() {
  const { t, lang } = useI18n();
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
  const [wheelMode, setWheelMode] = useState<WheelMode>("feelings");
  const [promptIndex, setPromptIndex] = useState<number>(0);

  // Random prompt index on mount
  useEffect(() => {
    setPromptIndex(Math.floor(Math.random() * PROMPT_COUNT));
  }, []);

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
        // Si ya hizo check-in, pre-cargar la emoción seleccionada (permitir re-hacer)
        if (sessionData.userCheckin) {
          setSelectedEmotion(sessionData.userCheckin.emotion || null);
          setIntensity(sessionData.userCheckin.intensity || 5);
          setNote(sessionData.userCheckin.note || "");
        }
      }

      // Fetch real vocabulary level from API
      if (sessionData.ok && sessionData.session) {
        const vocabRes = await fetch(`/api/weekflow/checkin?sessionId=${sessionData.session.id}`);
        const vocabData = await vocabRes.json();
        if (vocabData.ok && vocabData.vocabulary) {
          setVocabulary({
            level: vocabData.vocabulary.level || "DESAFIO",
            totalCheckins: vocabData.vocabulary.totalCheckins || 0,
            uniqueEmotionsUsed: vocabData.vocabulary.uniqueEmotionsUsed || 0,
          });
        } else {
          setVocabulary({
            level: "DESAFIO",
            totalCheckins: 0,
            uniqueEmotionsUsed: 0,
          });
        }
      } else {
        setVocabulary({
          level: "DESAFIO",
          totalCheckins: 0,
          uniqueEmotionsUsed: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(t("weekflow.checkin.errorLoading"));
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
          intensity, // Enviar directamente 1-10
          note: note.trim() || null,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        router.push(`/weekflow/${hubId}`);
      } else {
        setError(data.error || t("weekflow.checkin.errorSaving"));
      }
    } catch (error) {
      console.error("Error submitting checkin:", error);
      setError(t("weekflow.checkin.errorSubmitting"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const refreshPrompt = () => {
    setPromptIndex((prev) => (prev + 1) % PROMPT_COUNT);
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
          {t("common.back")}
        </Link>
      </Button>

      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            {t("weekflow.checkin.title")}
          </CardTitle>
          <CardDescription>
            {t("weekflow.checkin.subtitle")}
          </CardDescription>
          {session && (
            <p className="text-sm text-muted-foreground mt-2">
              {t("weekflow.week")} {session.weekNumber}, {session.year}
            </p>
          )}
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Guided prompt */}
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-3">
              <Lightbulb className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                  {t("weekflow.checkin.guidedPromptLabel")}
                </p>
                <p className="text-sm text-amber-800 dark:text-amber-300 italic">
                  {t(`weekflow.checkin.guidedPrompts.${promptIndex}`)}
                </p>
              </div>
              <button
                onClick={refreshPrompt}
                className="text-xs text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 whitespace-nowrap"
              >
                {t("weekflow.checkin.anotherPrompt")}
              </button>
            </div>
          </div>

          {/* Wheel mode selector */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                setWheelMode("plutchik");
                setSelectedEmotion(null);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                wheelMode === "plutchik"
                  ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-2 border-purple-300 dark:border-purple-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <Flower2 className="w-4 h-4" />
              {t("weekflow.checkin.wheelPlutchik")}
            </button>
            <button
              onClick={() => {
                setWheelMode("feelings");
                setSelectedEmotion(null);
              }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                wheelMode === "feelings"
                  ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-2 border-blue-300 dark:border-blue-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-200 dark:hover:bg-gray-700"
              )}
            >
              <CircleDot className="w-4 h-4" />
              {t("weekflow.checkin.wheelFeelings")}
            </button>
          </div>

          {/* Emotion Wheel */}
          {wheelMode === "plutchik" ? (
            <EmotionWheel
              userLevel={vocabulary?.level || "DESAFIO"}
              selectedEmotion={selectedEmotion}
              onSelect={handleEmotionSelect}
              showIntensity={true}
              size="lg"
            />
          ) : (
            <FeelingsWheel
              selectedEmotion={selectedEmotion}
              onSelect={handleEmotionSelect}
              showIntensity={true}
              size="lg"
            />
          )}

          {/* Adaptive guidance */}
          {selectedEmotion && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <span className="text-xl">🧠</span>
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-1">
                    {t("weekflow.checkin.guidedReflection")}
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {t(`weekflow.checkin.guidance.${getEmotionCategory(selectedEmotion)}`)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Note (optional) */}
          {selectedEmotion && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("weekflow.checkin.noteLabel")}{" "}
                <span className="text-muted-foreground">
                  ({t("common.optional")})
                </span>
              </label>
              <Textarea
                placeholder={t("weekflow.checkin.notePlaceholder")}
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
                {t("weekflow.checkin.saving")}
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                {t("weekflow.checkin.submit")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
