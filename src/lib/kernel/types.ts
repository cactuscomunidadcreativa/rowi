// apps/rowi/src/lib/kernel/types.ts
export type EmitAlertInput = {
  tenantId?: string;
  hubId?: string;
  userId?: string;
  type: string;
  title: string;
  message: string;
  severity?: number;
  emotionTag?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
};