export function createMemoryRepository(seed = []) {
  const items = new Map(seed.map((item) => [item.solicitudId, structuredClone(item)]));
  return {
    async list({ limit, key, estado }) {
      const all = [...items.values()].sort((a, b) => a.solicitudId.localeCompare(b.solicitudId));
      const start = key ? all.findIndex((item) => item.solicitudId > key.solicitudId) : 0;
      const page = start < 0 ? [] : all.slice(start, start + limit);
      return {
        items: structuredClone(page.filter((item) => !estado || item.estado === estado)),
        key: start >= 0 && start + limit < all.length
          ? { solicitudId: page.at(-1).solicitudId } : undefined,
      };
    },
    async get(id) { return structuredClone(items.get(id)); },
    async create(item) {
      if (items.has(item.solicitudId)) {
        throw Object.assign(new Error('Ya existe.'), { name: 'ConditionalCheckFailedException' });
      }
      items.set(item.solicitudId, structuredClone(item));
      return structuredClone(item);
    },
    async update(id, fields) {
      if (!items.has(id)) {
        throw Object.assign(new Error('No existe.'), { name: 'ConditionalCheckFailedException' });
      }
      const updated = { ...items.get(id), ...fields };
      items.set(id, structuredClone(updated));
      return structuredClone(updated);
    },
  };
}
