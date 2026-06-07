const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ACCOUNT_ID',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET_NAME',
  'R2_PUBLIC_URL',
  'ONBOARD_PASSWORD',
] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    console.error('Set them in .env or environment before starting the server.');
    process.exit(1);
  }

  if (process.env.ONBOARD_PASSWORD && process.env.ONBOARD_PASSWORD.length < 8) {
    console.warn('Warning: ONBOARD_PASSWORD should be at least 8 characters long.');
  }
}

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
} as const;
