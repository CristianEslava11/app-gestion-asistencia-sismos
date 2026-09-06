import { randomUUID } from 'node:crypto';
import { HttpError } from '../errors.js';
import { decodeCursor, encodeCursor } from '../validation/solicitud.js';

export function createSolicitudesService(repository) {
  async function update(id, fields) {
    try {
      return await repository.update(id, { ...fields, fechaActualizacion: new Date().toISOString() });
    } catch (error) {
      if (error.name === 'ConditionalCheckFailedException') throw new HttpError(404, 'Solicitud no encontrada.');
      throw error;
    }
  }
  return {
    async list({ limit, cursor, estado }) {
      let key;
      try { key = decodeCursor(cursor); }
      catch { throw new HttpError(400, 'Cursor de paginación inválido.'); }
      const result = await repository.list({ limit, key, estado });
      return { data: result.items, nextCursor: encodeCursor(result.key) };
    },
    async get(id) {
      const item = await repository.get(id);
      if (!item) throw new HttpError(404, 'Solicitud no encontrada.');
      return item;
    },
    async create(fields) {
      const now = new Date().toISOString();
      return repository.create({ ...fields, solicitudId: randomUUID(), estado: 'PENDIENTE',
        fechaSolicitud: now, fechaActualizacion: now });
    },
    update,
  };
}
