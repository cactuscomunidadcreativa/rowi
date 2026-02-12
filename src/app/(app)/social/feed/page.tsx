"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Heart,
  ThumbsUp,
  Award,
  TrendingUp,
  Zap,
  Target,
  Users,
  Send,
  Smile,
  Image as ImageIcon,
  MoreHorizontal,
  Loader2,
  ChevronDown,
  Trash2,
  Edit3,
  Sparkles,
  Flame,
  Star,
  HandHeart,
  Lightbulb,
} from "lucide-react";

/* =========================================================
   📰 Página del Social Feed

   - Composer para crear posts
   - Feed infinito con cursor pagination
   - Reacciones y comentarios inline
========================================================= */

const REACTION_TYPES = [
  { type: "like", icon: ThumbsUp, label: "Me gusta", color: "text-blue-500" },
  { type: "love", icon: Heart, label: "Me encanta", color: "text-red-500" },
  { type: "celebrate", icon: Sparkles, label: "Celebro", color: "text-yellow-500" },
  { type: "support", icon: HandHeart, label: "Apoyo", color: "text-green-500" },
  { type: "insightful", icon: Lightbulb, label: "Interesante", color: "text-purple-500" },
];

const MOOD_OPTIONS = [
  { value: "happy", label: "😊 Feliz" },
  { value: "grateful", label: "🙏 Agradecido" },
  { value: "motivated", label: "🔥 Motivado" },
  { value: "reflective", label: "🤔 Reflexivo" },
  { value: "proud", label: "🏆 Orgulloso" },
  { value: "excited", label: "🎉 Emocionado" },
  { value: "calm", label: "🧘 Tranquilo" },
  { value: "curious", label: "💡 Curioso" },
];

const POST_TYPE_CONFIG: Record<string, { icon: any; badge: string; bgClass: string }> = {
  achievement: { icon: Award, badge: "Logro", bgClass: "from-amber-400 to-orange-500" },
  level_up: { icon: TrendingUp, badge: "Nuevo Nivel", bgClass: "from-blue-400 to-purple-500" },
  streak: { icon: Flame, badge: "Racha", bgClass: "from-red-400 to-orange-500" },
  noble_goal: { icon: Target, badge: "Causa Noble", bgClass: "from-green-400 to-teal-500" },
  connection: { icon: Users, badge: "Nueva Conexión", bgClass: "from-cyan-400 to-blue-500" },
};

interface FeedItem {
  id: string;
  authorId: string;
  content: string;
  type: string;
  mood: string | null;
  visibility: string;
  tags: string[];
  mediaUrls: string[];
  metadata: any;
  createdAt: string;
  author: { id: string; name: string; image: string | null; headline: string | null };
  feedComments: any[];
  reactionsByType: Record<string, number>;
  userReaction: string | null;
  commentCount: number;
  reactionCount: number;
}

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postMood, setPostMood] = useState("");
  const [showMoods, setShowMoods] = useState(false);
  const [posting, setPosting] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Fetch feed
  const fetchFeed = useCallback(async (cursor?: string) => {
    try {
      if (cursor) setLoadingMore(true);
      else setLoading(true);

      const params = new URLSearchParams();
      if (cursor) params.set("cursor", cursor);
      params.set("limit", "20");

      const res = await fetch(`/api/social/feed?${params}`);
      const data = await res.json();

      if (data.ok) {
        if (cursor) {
          setItems((prev) => [...prev, ...data.items]);
        } else {
          setItems(data.items);
        }
        setNextCursor(data.nextCursor);
      }
    } catch (err) {
      console.error("Error fetching feed:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) {
          fetchFeed(nextCursor);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [nextCursor, loadingMore, fetchFeed]);

  // Crear post
  const createPost = async () => {
    if (!postContent.trim()) return;
    setPosting(true);
    try {
      const res = await fetch("/api/social/feed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: postContent.trim(),
          mood: postMood || undefined,
          visibility: "public",
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) => [
          { ...data.post, feedComments: [], reactionsByType: {}, userReaction: null, commentCount: 0, reactionCount: 0 },
          ...prev,
        ]);
        setPostContent("");
        setPostMood("");
        setShowMoods(false);
      }
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setPosting(false);
    }
  };

  // Toggle reacción
  const toggleReaction = async (postId: string, type: string) => {
    try {
      const res = await fetch(`/api/social/feed/${postId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (data.ok) {
        setItems((prev) =>
          prev.map((item) =>
            item.id === postId
              ? {
                  ...item,
                  reactionsByType: data.reactionsByType,
                  reactionCount: data.totalReactions,
                  userReaction: data.action === "removed" ? null : type,
                }
              : item
          )
        );
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Zap className="w-8 h-8 text-[var(--rowi-g2)]" />
          Actividad
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Comparte con tu red y descubre lo que está pasando
        </p>
      </div>

      {/* Composer */}
      <div className="mb-6 p-4 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="¿Qué quieres compartir?"
          rows={3}
          className="w-full resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none text-sm"
          maxLength={5000}
        />

        {/* Mood selector */}
        <AnimatePresence>
          {showMoods && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap gap-1.5 py-2 border-t border-gray-100 dark:border-zinc-800 mt-2">
                {MOOD_OPTIONS.map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setPostMood(postMood === mood.value ? "" : mood.value)}
                    className={`text-xs px-2.5 py-1 rounded-full transition-colors ${
                      postMood === mood.value
                        ? "bg-[var(--rowi-g2)]/10 text-[var(--rowi-g2)] ring-1 ring-[var(--rowi-g2)]/30"
                        : "bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {mood.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMoods(!showMoods)}
              className={`p-2 rounded-lg transition-colors ${
                postMood
                  ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                  : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
              title="Estado de ánimo"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {postContent.length > 0 && (
              <span className="text-xs text-gray-400">
                {postContent.length}/5000
              </span>
            )}
            <button
              onClick={createPost}
              disabled={!postContent.trim() || posting}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[var(--rowi-g1)] to-[var(--rowi-g2)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
            >
              {posting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--rowi-g2)]" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Tu feed está vacío</p>
          <p className="text-sm mt-1">Conecta con personas y comparte tus logros</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <FeedCard
              key={item.id}
              item={item}
              onReact={(type) => toggleReaction(item.id, type)}
            />
          ))}

          {/* Infinite scroll trigger */}
          {nextCursor && (
            <div ref={observerRef} className="flex justify-center py-4">
              {loadingMore && (
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   🃏 Feed Card Component
========================================================= */
function FeedCard({
  item,
  onReact,
}: {
  item: FeedItem;
  onReact: (type: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(item.feedComments || []);
  const [commentText, setCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const typeConfig = POST_TYPE_CONFIG[item.type];
  const isAutoPost = item.type !== "post";

  // Fetch full comments
  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/social/feed/${item.id}/comments`);
      const data = await res.json();
      if (data.ok) setComments(data.comments);
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const toggleComments = () => {
    if (!showComments) fetchComments();
    setShowComments(!showComments);
  };

  // Submit comment
  const submitComment = async () => {
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    try {
      const res = await fetch(`/api/social/feed/${item.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: commentText.trim() }),
      });
      const data = await res.json();
      if (data.ok) {
        setComments((prev) => [...prev, data.comment]);
        setCommentText("");
      }
    } catch (err) {
      console.error("Error posting comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const moodEmoji = MOOD_OPTIONS.find((m) => m.value === item.mood);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
    >
      {/* Auto-post badge */}
      {isAutoPost && typeConfig && (
        <div
          className={`px-4 py-2 bg-gradient-to-r ${typeConfig.bgClass} text-white text-xs font-medium flex items-center gap-2`}
        >
          <typeConfig.icon className="w-4 h-4" />
          {typeConfig.badge}
        </div>
      )}

      <div className="p-4">
        {/* Author */}
        <div className="flex items-center gap-3 mb-3">
          {item.author.image ? (
            <img
              src={item.author.image}
              alt={item.author.name || ""}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex items-center justify-center text-white font-bold">
              {item.author.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                {item.author.name || "Usuario"}
              </span>
              {moodEmoji && (
                <span className="text-xs text-gray-500">{moodEmoji.label}</span>
              )}
            </div>
            <span className="text-xs text-gray-400">
              {formatTimeAgo(item.createdAt)}
              {item.author.headline && ` · ${item.author.headline}`}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap mb-3">
          {item.content}
        </p>

        {/* Tags */}
        {item.tags && item.tags.length > 0 && item.type === "post" && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Reaction counts */}
        {item.reactionCount > 0 && (
          <div className="flex items-center gap-1 text-xs text-gray-400 mb-2">
            {Object.entries(item.reactionsByType).map(([type, count]) => {
              const config = REACTION_TYPES.find((r) => r.type === type);
              if (!config) return null;
              return (
                <span key={type} className="flex items-center gap-0.5">
                  <config.icon className={`w-3 h-3 ${config.color}`} />
                  {count as number}
                </span>
              );
            })}
            <span className="ml-1">
              {item.reactionCount} reacción{item.reactionCount > 1 ? "es" : ""}
            </span>
          </div>
        )}

        {/* Actions bar */}
        <div className="flex items-center gap-1 pt-2 border-t border-gray-100 dark:border-zinc-800">
          {/* Reaction button with hover menu */}
          <div
            className="relative"
            onMouseEnter={() => setShowReactions(true)}
            onMouseLeave={() => setShowReactions(false)}
          >
            <button
              onClick={() => onReact(item.userReaction || "like")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                item.userReaction
                  ? "text-[var(--rowi-g2)] bg-[var(--rowi-g2)]/10"
                  : "text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800"
              }`}
            >
              {(() => {
                const config = REACTION_TYPES.find((r) => r.type === item.userReaction);
                const Icon = config?.icon || ThumbsUp;
                return <Icon className="w-4 h-4" />;
              })()}
              {item.userReaction
                ? REACTION_TYPES.find((r) => r.type === item.userReaction)?.label || "Me gusta"
                : "Me gusta"}
            </button>

            {/* Reaction picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1.5 rounded-full bg-white dark:bg-zinc-800 shadow-lg border border-gray-200 dark:border-zinc-700 z-10"
                >
                  {REACTION_TYPES.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => {
                        onReact(r.type);
                        setShowReactions(false);
                      }}
                      className={`p-1.5 rounded-full transition-transform hover:scale-125 ${r.color}`}
                      title={r.label}
                    >
                      <r.icon className="w-5 h-5" />
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            Comentar
            {item.commentCount > 0 && (
              <span className="text-xs">({item.commentCount})</span>
            )}
          </button>
        </div>

        {/* Comments section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3">
                {/* Comment list */}
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    {comment.author?.image ? (
                      <img
                        src={comment.author.image}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-zinc-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {comment.author?.name?.charAt(0) || "?"}
                      </div>
                    )}
                    <div className="flex-1 bg-gray-50 dark:bg-zinc-800 rounded-lg px-3 py-2">
                      <span className="text-xs font-semibold text-gray-900 dark:text-white">
                        {comment.author?.name || "Usuario"}
                      </span>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">
                        {comment.content}
                      </p>
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}

                {/* New comment input */}
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--rowi-g1)] to-[var(--rowi-g2)] flex-shrink-0" />
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitComment()}
                      placeholder="Escribe un comentario..."
                      className="flex-1 text-xs px-3 py-1.5 rounded-full border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:outline-none focus:ring-1 focus:ring-[var(--rowi-g2)]/30"
                    />
                    <button
                      onClick={submitComment}
                      disabled={!commentText.trim() || submittingComment}
                      className="p-1.5 rounded-full text-[var(--rowi-g2)] hover:bg-[var(--rowi-g2)]/10 disabled:opacity-50 transition-colors"
                    >
                      {submittingComment ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* =========================================================
   ⏰ Helper — Formato relativo de tiempo
========================================================= */
function formatTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "ahora";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `hace ${Math.floor(diff / 86400)}d`;
  return date.toLocaleDateString("es");
}
