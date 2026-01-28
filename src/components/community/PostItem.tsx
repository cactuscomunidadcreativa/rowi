"use client";

import { useState } from "react";
import type { Post } from "./types";

export default function PostItem({ post }: { post: Post }) {
  const [likes, setLikes] = useState(post.likes ?? 0);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2">
        <img src={post.avatar} alt="" className="h-6 w-6 rounded-full" />
        <div className="text-sm opacity-80">{post.author}</div>
        <div className="ml-auto text-xs opacity-50">
          {new Date(post.createdAt).toLocaleString()}
        </div>
      </div>
      <p className="mb-3 text-sm">{post.text}</p>
      <div className="flex items-center gap-3 text-sm">
        <span className="rounded-full bg-white/10 px-2 py-0.5">#{post.topic}</span>
        <button
          onClick={() => setLikes((n) => n + 1)}
          className="rounded-lg border border-white/10 px-2 py-1 hover:bg-white/10"
        >
          👍 {likes}
        </button>
      </div>
    </article>
  );
}