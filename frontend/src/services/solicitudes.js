// Un solo punto de acceso HTTP. No hay credenciales AWS ni fallback a datos falsos.
async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...options.headers },
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = payload?.error?.details?.map((item) => `${item.field}: ${item.message}`).join(' · ');
    throw new Error(detail || payload?.error?.message || `Error del servidor (${response.status}).`);
  }
  if (!payload) throw new Error('El servidor no devolvió una respuesta JSON.');
  return payload;
}

export const api = {
  config: (signal) => request('/config', { signal }),
  list: ({ estado, cursor, signal }) => {
    const params = new URLSearchParams({ limit: '20' });
    if (estado) params.set('estado', estado);
    if (cursor) params.set('cursor', cursor);
    return request(`/solicitudes?${params}`, { signal });
  },
  get: (id) => request(`/solicitudes/${encodeURIComponent(id)}`),
  create: (data) => request('/solicitudes', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/solicitudes/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  changeState: (id, estado) => request(`/solicitudes/${encodeURIComponent(id)}/estado`, {
    method: 'PATCH', body: JSON.stringify({ estado }),
  }),
};
