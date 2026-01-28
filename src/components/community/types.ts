export type Post = {
  id: string;
  author: string;
  avatar?: string;
  createdAt: string; // ISO
  text: string;
  topic: string;
  likes: number;
  comments: number;
};

export const TOPICS = [
  "Colaboración",
  "Gestión del estrés",
  "Comunicación",
  "Liderazgo",
  "Empatía",
  "Productividad",
] as const;