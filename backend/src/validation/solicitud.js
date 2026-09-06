import { z } from 'zod';

export const ESTADOS = ['PENDIENTE', 'EN_ATENCION', 'ATENDIDA'];
export const TIPOS_AYUDA = ['ALIMENTACION', 'ALOJAMIENTO', 'ATENCION_MEDICA', 'RESCATE', 'OTRA'];
export const idSchema = z.uuid();

const fechaSismo = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Usa YYYY-MM-DD.').refine((value) => {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, 'La fecha no existe.').refine((value) => {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
  return value <= today;
}, 'La fecha del sismo no puede ser futura.');

// Estricto: cliente no puede fijar id, estado inicial ni fechas de seguimiento.
export const solicitudSchema = z.object({
  nombre: z.string().trim().min(2).max(120),
  documento: z.string().trim().min(3).max(30),
  telefono: z.string().trim().regex(/^[+\d()\s-]{7,25}$/, 'Ingresa un teléfono de 7 a 25 caracteres.'),
  municipio: z.string().trim().min(2).max(100),
  direccion: z.string().trim().min(3).max(200),
  fechaSismo,
  magnitud: z.number().min(0).max(10).nullable().default(null),
  tipoAyuda: z.enum(TIPOS_AYUDA),
  observaciones: z.string().trim().max(1500).default(''),
}).strict();

export const estadoSchema = z.object({ estado: z.enum(ESTADOS) }).strict();
export const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().max(512).optional(),
  estado: z.enum(ESTADOS).optional(),
}).strict();

export function encodeCursor(key) {
  return key ? Buffer.from(JSON.stringify(key)).toString('base64url') : null;
}

export function decodeCursor(cursor) {
  if (!cursor) return undefined;
  if (!/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error('Cursor inválido.');
  return z.object({ solicitudId: idSchema }).strict().parse(
    JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')),
  );
}
