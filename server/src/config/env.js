'use strict';

const { z } = require('zod');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  INTERNAL_PORT: z.coerce.number().int().positive().default(5001),
  DATABASE_URL_MWQ: z.string().min(1),
  DATABASE_URL_AQMS: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_COST: z.coerce.number().int().positive().default(12),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  // R2 storage (optional in dev)
  R2_ENDPOINT: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_ACCESS_KEY: z.string().optional(),
  R2_SECRET_KEY: z.string().optional(),
  R2_PRESIGN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  // SMTP (optional in dev)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('"FEA Unified <no-reply@fea.local>"'),
  // OTP
  OTP_TTL_SECONDS: z.coerce.number().int().positive().default(300),
  OTP_LENGTH: z.coerce.number().int().positive().default(4),
  OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  // Exports
  MAX_CONCURRENT_EXPORTS: z.coerce.number().int().positive().default(2),
  // Seed
  SEED_SENSOR_ROWS: z.coerce.number().int().positive().default(50000),
  SEED_DAYS: z.coerce.number().int().positive().default(30),
  SEED_BUOYS: z.coerce.number().int().positive().default(4),
  SEED_STATIONS: z.coerce.number().int().positive().default(3),
  // Logging
  LOG_LEVEL: z.string().default('info'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

const env = result.data;

if (env.JWT_REFRESH_SECRET === env.JWT_SECRET) {
  throw new Error('JWT_REFRESH_SECRET must differ from JWT_SECRET');
}

module.exports = env;
