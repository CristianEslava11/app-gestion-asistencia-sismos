import { z } from 'zod';

export function readConfig(env = process.env, demo = false) {
  const config = z.object({
    PORT: z.coerce.number().int().min(1).max(65535).default(3000),
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    STORAGE_MODE: z.enum(['dynamodb', 'memory']).default('dynamodb'),
    AWS_REGION: z.string().min(1).default('us-east-2'),
    DYNAMODB_TABLE: z.string().regex(/^[A-Za-z0-9_.-]{3,255}$/).default('SolicitudesAsistencia'),
    DEMO_USER: z.string().min(1).optional(),
    DEMO_PASSWORD: z.string().min(12).optional(),
  }).parse({ ...env, ...(demo ? { STORAGE_MODE: 'memory' } : {}) });
  if (Boolean(config.DEMO_USER) !== Boolean(config.DEMO_PASSWORD)) {
    throw new Error('Configura DEMO_USER y DEMO_PASSWORD juntos.');
  }
  if (config.DEMO_USER?.includes(':')) throw new Error('DEMO_USER no puede contener dos puntos.');
  if (config.NODE_ENV === 'production') {
    if (config.STORAGE_MODE !== 'dynamodb') throw new Error('Producción requiere DynamoDB real.');
    if (!config.DEMO_USER) throw new Error('Configura el acceso de evaluación DEMO_USER y DEMO_PASSWORD.');
  }
  return config;
}
