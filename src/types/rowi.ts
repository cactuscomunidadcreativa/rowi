// src/types/rowi.ts
export type MemoryEvent = {
  id: string;
  ts: number;                // timestamp
  kind: "ask" | "reply" | "action";
  text: string;
  meta?: Record<string, any>;
};

export type RowiMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};