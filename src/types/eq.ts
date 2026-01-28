// src/types/eq.ts
export type KCG = 'K' | 'C' | 'G';

export type EQCompetencies = {
  EL: number;  // Emotional Literacy
  RP: number;  // Recognize Patterns
  ACT: number; // Apply Consequential Thinking
  NE: number;  // Navigate Emotions
  IM: number;  // Intrinsic Motivation
  OP: number;  // Optimism
  EMP: number; // Empathy
  NG: number;  // Noble Goals
};

export type EQVector = {
  K: number;
  C: number;
  G: number;
} & EQCompetencies;

export type UserProfile = {
  id: string;
  name: string;
  email?: string;
  locale?: 'es' | 'en' | 'pt';
  eq: EQVector;
};

export type AffinityInput = { a: UserProfile; b: UserProfile };