const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_PUBLIC_URL',
  'ONBOARD_PASSWORD',
  'JWT_SECRET',
] as const;

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
      `Set vars in wrangler.jsonc and secrets via .dev.vars / wrangler secret put.`,
    );
  }
  if (process.env.ONBOARD_PASSWORD && process.env.ONBOARD_PASSWORD.length < 8) {
    console.warn('Warning: ONBOARD_PASSWORD should be at least 8 characters long.');
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters for security.');
  }
}
