export type Competencias = {
  EL: number | null; RP: number | null; ACT: number | null; NE: number | null;
  IM: number | null; OP: number | null; EMP: number | null; NG: number | null;
};

export type EqPayload = {
  user: { name: string; email: string };
  eq: { K: number | null; C: number | null; G: number | null; competencias: Competencias };
  info?: "db" | "model";
};
