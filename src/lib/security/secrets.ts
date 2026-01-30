/**
 * Secure secret management utilities
 * Validates that required environment variables are set
 */

export interface SecretConfig {
  name: string;
  envVar: string;
  required: boolean;
  minLength?: number;
}

const REQUIRED_SECRETS: SecretConfig[] = [
  { name: "NextAuth Secret", envVar: "NEXTAUTH_SECRET", required: true, minLength: 32 },
  { name: "Database URL", envVar: "DATABASE_URL", required: true },
  { name: "Google Client ID", envVar: "GOOGLE_CLIENT_ID", required: false },
  { name: "Google Client Secret", envVar: "GOOGLE_CLIENT_SECRET", required: false },
  { name: "OpenAI API Key", envVar: "OPENAI_API_KEY", required: false },
  { name: "Stripe Secret Key", envVar: "STRIPE_SECRET_KEY", required: false },
];

export interface SecretValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that all required secrets are properly configured
 * Call this at application startup
 */
export function validateSecrets(): SecretValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const secret of REQUIRED_SECRETS) {
    const value = process.env[secret.envVar];

    if (!value) {
      if (secret.required) {
        errors.push(`Missing required secret: ${secret.name} (${secret.envVar})`);
      } else {
        warnings.push(`Optional secret not set: ${secret.name} (${secret.envVar})`);
      }
      continue;
    }

    // Check minimum length for security-critical secrets
    if (secret.minLength && value.length < secret.minLength) {
      errors.push(
        `Secret ${secret.name} is too short (min ${secret.minLength} chars)`
      );
    }

    // Check for obvious placeholder values
    const placeholders = ["changeme", "secret", "password", "xxx", "test"];
    if (placeholders.some((p) => value.toLowerCase().includes(p))) {
      warnings.push(
        `Secret ${secret.name} appears to be a placeholder value`
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Get a secret value, throwing if not set (for required secrets)
 */
export function getRequiredSecret(envVar: string): string {
  const value = process.env[envVar];
  if (!value) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
  return value;
}

/**
 * Get a secret value with a default fallback (for optional secrets)
 */
export function getOptionalSecret(envVar: string, defaultValue: string = ""): string {
  return process.env[envVar] || defaultValue;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}

/**
 * Log secret validation results (only in development)
 */
export function logSecretValidation(): void {
  if (!isDevelopment()) return;

  const result = validateSecrets();

  if (result.errors.length > 0) {
    console.error("🔴 Secret validation errors:");
    result.errors.forEach((e) => console.error(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    console.warn("🟡 Secret validation warnings:");
    result.warnings.forEach((w) => console.warn(`  - ${w}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log("🟢 All secrets validated successfully");
  }
}
