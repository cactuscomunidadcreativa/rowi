"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmotionWheel } from "@/components/eq";
import {
  Loader2,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Trash2,
  BarChart3,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED" | "POSTPONED" | "BLOCKED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate?: string;
  createdAt: string;
  completedAt?: string;
  emotionAtCreation?: string;
  emotionAtCompletion?: string;
  needsReflection?: boolean;
  daysSinceCreation?: number;
}

const PRIORITY_COLORS = {
  LOW: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  MEDIUM: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  HIGH: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  URGENT: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
};

const STATUS_ICONS = {
  TODO: Circle,
  IN_PROGRESS: Clock,
  DONE: CheckCircle2,
  CANCELLED: Trash2,
  POSTPONED: Clock,
  BLOCKED: AlertCircle,
};

export default function RowiTasksPage() {
  const { t } = useI18n();
  const { data: session, status } = useSession();
  const authLoading = status === "loading";
  const user = session?.user as { plan?: { weekflowAccess?: boolean; weekflowInsights?: boolean } } | undefined;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState<string>("MEDIUM");

  // Reflection modal state
  const [reflectionTask, setReflectionTask] = useState<Task | null>(null);
  const [reflectionReason, setReflectionReason] = useState<string>("");
  const [reflectionNote, setReflectionNote] = useState("");
  const [reflectionEmotion, setReflectionEmotion] = useState<string | null>(null);
  const [isSubmittingReflection, setIsSubmittingReflection] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      fetchTasks();
    }
  }, [authLoading, session]);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/weekflow/tasks");
      const data = await res.json();
      if (data.ok) {
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/weekflow/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setNewTaskTitle("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (task.status === "DONE") {
      // Reopen task
      await updateTaskStatus(task.id, "TODO");
    } else {
      // Complete task
      await updateTaskStatus(task.id, "DONE");
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, extra?: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/weekflow/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: taskId,
          status,
          ...extra,
        }),
      });

      if (res.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleReflectionSubmit = async () => {
    if (!reflectionTask || !reflectionReason) return;

    setIsSubmittingReflection(true);
    try {
      // Update task with reflection
      await fetch("/api/weekflow/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reflectionTask.id,
          status: "POSTPONED",
          incompletionReason: reflectionReason,
          incompletionNote: reflectionNote,
          emotionAtCompletion: reflectionEmotion,
        }),
      });

      setReflectionTask(null);
      setReflectionReason("");
      setReflectionNote("");
      setReflectionEmotion(null);
      fetchTasks();
    } catch (error) {
      console.error("Error submitting reflection:", error);
    } finally {
      setIsSubmittingReflection(false);
    }
  };

  const pendingTasks = tasks.filter((t) => t.status === "TODO" || t.status === "IN_PROGRESS");
  const completedTasks = tasks.filter((t) => t.status === "DONE");
  const tasksNeedingReflection = tasks.filter((t) => t.needsReflection);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">
            {t("weekflow.tasks.title") || "Rowi Tasks"}
          </h1>
          <p className="text-muted-foreground">
            {t("weekflow.tasks.subtitle") || "Tus tareas con insights emocionales"}
          </p>
        </div>
        {user?.plan?.weekflowInsights && (
          <Button variant="outline" asChild>
            <Link href="/weekflow/tasks/insights">
              <BarChart3 className="w-4 h-4 mr-2" />
              {t("weekflow.tasks.insights") || "Insights"}
            </Link>
          </Button>
        )}
      </div>

      {/* Alert for tasks needing reflection */}
      {tasksNeedingReflection.length > 0 && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {t("weekflow.tasks.needsReflection") ||
                    `${tasksNeedingReflection.length} tarea(s) llevan mucho tiempo pendiente(s)`}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {t("weekflow.tasks.needsReflectionDesc") ||
                    "¿Qué está pasando? Tu reflexión te ayudará a entender patrones"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create task form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleCreateTask} className="flex gap-2">
            <Input
              placeholder={t("weekflow.tasks.addPlaceholder") || "Nueva tarea..."}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-1"
            />
            <Select value={newTaskPriority} onValueChange={setNewTaskPriority}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOW">{t("weekflow.tasks.priority.low") || "Baja"}</SelectItem>
                <SelectItem value="MEDIUM">{t("weekflow.tasks.priority.medium") || "Media"}</SelectItem>
                <SelectItem value="HIGH">{t("weekflow.tasks.priority.high") || "Alta"}</SelectItem>
                <SelectItem value="URGENT">{t("weekflow.tasks.priority.urgent") || "Urgente"}</SelectItem>
              </SelectContent>
            </Select>
            <Button type="submit" disabled={!newTaskTitle.trim() || isCreating}>
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tasks list */}
      <Tabs defaultValue="pending">
        <TabsList className="mb-4">
          <TabsTrigger value="pending" className="gap-2">
            <Circle className="w-4 h-4" />
            {t("weekflow.tasks.pending") || "Pendientes"} ({pendingTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {t("weekflow.tasks.completed") || "Completadas"} ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-2">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{t("weekflow.tasks.empty") || "No tienes tareas pendientes"}</p>
            </div>
          ) : (
            pendingTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleComplete(task)}
                onReflect={() => setReflectionTask(task)}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-2">
          {completedTasks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>{t("weekflow.tasks.noCompleted") || "Aún no has completado tareas"}</p>
            </div>
          ) : (
            completedTasks.slice(0, 20).map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleComplete(task)}
              />
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Reflection Modal */}
      <Dialog open={!!reflectionTask} onOpenChange={() => setReflectionTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {t("weekflow.tasks.reflection.title") || "¿Qué está pasando con esta tarea?"}
            </DialogTitle>
            <DialogDescription>
              {t("weekflow.tasks.reflection.subtitle") ||
                "Tu reflexión te ayuda a entender patrones y mejorar"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Task info */}
            <div className="p-3 rounded-lg bg-muted">
              <p className="font-medium">{reflectionTask?.title}</p>
              <p className="text-sm text-muted-foreground">
                {t("weekflow.tasks.reflection.daysOld")?.replace(
                  "{days}",
                  String(reflectionTask?.daysSinceCreation || 0)
                ) || `Creada hace ${reflectionTask?.daysSinceCreation} días`}
              </p>
            </div>

            {/* Reason select */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("weekflow.tasks.reflection.reasonLabel") || "¿Por qué no la has completado?"}
              </label>
              <Select value={reflectionReason} onValueChange={setReflectionReason}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("weekflow.tasks.reflection.selectReason") || "Selecciona una razón"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERWHELMED">
                    {t("weekflow.incompletionReasons.overwhelmed") || "Me sentí abrumado/a"}
                  </SelectItem>
                  <SelectItem value="ANXIOUS">
                    {t("weekflow.incompletionReasons.anxious") || "Me generó ansiedad"}
                  </SelectItem>
                  <SelectItem value="UNMOTIVATED">
                    {t("weekflow.incompletionReasons.unmotivated") || "No tenía motivación"}
                  </SelectItem>
                  <SelectItem value="PERFECTIONISM">
                    {t("weekflow.incompletionReasons.perfectionism") || "Quería que fuera perfecto"}
                  </SelectItem>
                  <SelectItem value="TIME_CONSTRAINT">
                    {t("weekflow.incompletionReasons.timeConstraint") || "No tuve tiempo"}
                  </SelectItem>
                  <SelectItem value="DEPENDENCY_BLOCKED">
                    {t("weekflow.incompletionReasons.dependencyBlocked") || "Esperando a alguien/algo"}
                  </SelectItem>
                  <SelectItem value="UNCLEAR_TASK">
                    {t("weekflow.incompletionReasons.unclearTask") || "No tenía claro qué hacer"}
                  </SelectItem>
                  <SelectItem value="NO_LONGER_NEEDED">
                    {t("weekflow.incompletionReasons.noLongerNeeded") || "Ya no era necesario"}
                  </SelectItem>
                  <SelectItem value="OTHER">
                    {t("weekflow.incompletionReasons.other") || "Otro motivo"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Emotion (optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("weekflow.tasks.reflection.emotionLabel") || "¿Cómo te sientes al respecto?"}{" "}
                <span className="text-muted-foreground">({t("common.optional")})</span>
              </label>
              <EmotionWheel
                userLevel="DESAFIO"
                selectedEmotion={reflectionEmotion}
                onSelect={(emotion) => setReflectionEmotion(emotion)}
                showIntensity={false}
                size="sm"
              />
            </div>

            {/* Note (optional) */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                {t("weekflow.tasks.reflection.noteLabel") || "Notas adicionales"}{" "}
                <span className="text-muted-foreground">({t("common.optional")})</span>
              </label>
              <Textarea
                value={reflectionNote}
                onChange={(e) => setReflectionNote(e.target.value)}
                placeholder={
                  t("weekflow.tasks.reflection.notePlaceholder") || "Algo más que quieras anotar..."
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReflectionTask(null)}>
              {t("common.cancel") || "Cancelar"}
            </Button>
            <Button
              onClick={handleReflectionSubmit}
              disabled={!reflectionReason || isSubmittingReflection}
            >
              {isSubmittingReflection ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              {t("common.save") || "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Item Component
function TaskItem({
  task,
  onToggle,
  onReflect,
}: {
  task: Task;
  onToggle: () => void;
  onReflect?: () => void;
}) {
  const { t } = useI18n();
  const StatusIcon = STATUS_ICONS[task.status];
  const isCompleted = task.status === "DONE";

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border bg-card",
        task.needsReflection && "border-amber-300 dark:border-amber-800"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
          isCompleted
            ? "bg-green-500 border-green-500 text-white"
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {isCompleted && <CheckCircle2 className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className={cn("text-xs", PRIORITY_COLORS[task.priority])}>
            {t(`weekflow.tasks.priority.${task.priority.toLowerCase()}`) || task.priority}
          </Badge>
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {task.needsReflection && onReflect && (
        <Button
          variant="outline"
          size="sm"
          onClick={onReflect}
          className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-50"
        >
          {t("weekflow.tasks.reflect") || "Reflexionar"}
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      )}
    </div>
  );
}
