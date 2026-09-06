import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { createApp } from '../src/app.js';
import { createMemoryRepository } from '../src/repositories/memory.js';
import { ejemplos } from '../src/data/ejemplos.js';
import { readConfig } from '../src/config/env.js';

const payload = { nombre: 'Persona ficticia', documento: '000123', telefono: '+57 0000000000',
  municipio: 'Tunja', direccion: 'Dirección ficticia 123', fechaSismo: '2026-01-01',
  magnitud: 0, tipoAyuda: 'ALOJAMIENTO', observaciones: 'Prueba automatizada' };

async function fixture(t, repository = createMemoryRepository(), config = { STORAGE_MODE: 'memory' }) {
  const server = createApp({ repository, config }).listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const url = `http://127.0.0.1:${server.address().port}`;
  return async (path, method = 'GET', body, headers = {}) => {
    const response = await fetch(`${url}${path}`, {
      method, headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    return { status: response.status, headers: response.headers, body: await response.json() };
  };
}

test('crear, consultar, editar y cambiar estado conserva identificador, documento y fecha de solicitud', async (t) => {
  const request = await fixture(t);
  const created = await request('/api/solicitudes', 'POST', payload);
  assert.equal(created.status, 201);
  const item = created.body.data;
  assert.equal(item.documento, '000123');
  assert.equal(item.magnitud, 0);
  assert.equal(item.estado, 'PENDIENTE');
  assert.match(item.solicitudId, /^[a-f\d-]{36}$/);
  assert.equal((await request(`/api/solicitudes/${item.solicitudId}`)).body.data.nombre, payload.nombre);
  await request(`/api/solicitudes/${item.solicitudId}/estado`, 'PATCH', { estado: 'ATENDIDA' });
  const edited = await request(`/api/solicitudes/${item.solicitudId}`, 'PUT', { ...payload, nombre: 'Nombre corregido' });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.data.estado, 'ATENDIDA');
  assert.equal(edited.body.data.fechaSolicitud, item.fechaSolicitud);
  assert.equal(edited.body.data.solicitudId, item.solicitudId);
  assert.equal(edited.body.data.nombre, 'Nombre corregido');
});

test('valida campos, fechas reales, tipos y metadatos reservados', async (t) => {
  const request = await fixture(t);
  for (const changes of [{ fechaSismo: '2026-02-30' }, { fechaSismo: '2999-01-01' },
    { magnitud: '5.2' }, { magnitud: 11 }, { documento: 123 }, { estado: 'ATENDIDA' },
    { solicitudId: ejemplos[0].solicitudId }, { fechaSolicitud: '2020-01-01' }, { nombre: '  ' }]) {
    assert.equal((await request('/api/solicitudes', 'POST', { ...payload, ...changes })).status, 400);
  }
  const unknown = await request('/api/solicitudes', 'POST', { ...payload, magnitud: null });
  assert.equal(unknown.status, 201);
  assert.equal(unknown.body.data.magnitud, null);
});

test('página filtrada vacía mantiene cursor y permite encontrar resultados posteriores', async (t) => {
  const request = await fixture(t, createMemoryRepository(ejemplos));
  const first = await request('/api/solicitudes?limit=1&estado=EN_ATENCION');
  assert.deepEqual(first.body.data, []);
  assert.ok(first.body.nextCursor);
  const second = await request(`/api/solicitudes?limit=1&estado=EN_ATENCION&cursor=${first.body.nextCursor}`);
  assert.equal(second.body.data[0].solicitudId, ejemplos[1].solicitudId);
  assert.equal(second.body.nextCursor, null);
  for (const query of ['limit=0', 'limit=101', 'cursor=%%%','cursor=eyJmb28iOjF9','estado=INEXISTENTE']) {
    assert.equal((await request(`/api/solicitudes?${query}`)).status, 400);
  }
});

test('editar una solicitud inexistente no la crea y rutas inválidas responden JSON', async (t) => {
  const request = await fixture(t);
  const path = `/api/solicitudes/${ejemplos[0].solicitudId}`;
  assert.equal((await request(path)).status, 404);
  assert.equal((await request(path, 'PUT', payload)).status, 404);
  assert.equal((await request(`${path}/estado`, 'PATCH', { estado: 'ATENDIDA' })).status, 404);
  assert.equal((await request('/api/solicitudes/no-es-uuid')).status, 400);
  assert.equal((await request('/api/desconocida')).status, 404);
});

test('fallo de almacenamiento no devuelve datos ficticios ni detalles sensibles', async (t) => {
  const request = await fixture(t, { list() { throw new Error('detalle-privado'); } });
  const result = await request('/api/solicitudes');
  assert.equal(result.status, 503);
  assert.ok(!JSON.stringify(result.body).includes('detalle-privado'));
  assert.equal(result.body.data, undefined);
});

test('acceso de evaluación protege API; health solo comprueba el proceso', async (t) => {
  const request = await fixture(t, createMemoryRepository(), {
    STORAGE_MODE: 'memory', DEMO_USER: 'evaluador', DEMO_PASSWORD: 'clave-ficticia-de-prueba',
  });
  assert.equal((await request('/health')).status, 200);
  assert.equal((await request('/api/solicitudes')).status, 401);
  assert.equal((await request('/api/solicitudes', 'GET', undefined, { Authorization: 'Basic incorrecto' })).status, 401);
  const authorization = `Basic ${Buffer.from('evaluador:clave-ficticia-de-prueba').toString('base64')}`;
  assert.equal((await request('/api/solicitudes', 'GET', undefined, { Authorization: authorization })).status, 200);
});

test('producción no permite memoria ni publicar sin acceso configurado', () => {
  assert.throws(() => readConfig({ NODE_ENV: 'production', STORAGE_MODE: 'memory' }));
  assert.throws(() => readConfig({ NODE_ENV: 'production' }));
  assert.throws(() => readConfig({ DEMO_USER: 'solo-usuario' }));
  assert.equal(readConfig({}).STORAGE_MODE, 'dynamodb');
});
