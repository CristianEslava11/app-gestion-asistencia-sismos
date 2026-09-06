import { Router } from 'express';
import { idSchema, listSchema, solicitudSchema, estadoSchema } from '../validation/solicitud.js';

export function solicitudesRouter(service) {
  const router = Router();
  router.get('/', async (req, res) => res.json(await service.list(listSchema.parse(req.query))));
  router.post('/', async (req, res) => {
    const item = await service.create(solicitudSchema.parse(req.body));
    res.status(201).location(`/api/solicitudes/${item.solicitudId}`).json({ data: item });
  });
  router.get('/:id', async (req, res) => res.json({ data: await service.get(idSchema.parse(req.params.id)) }));
  router.put('/:id', async (req, res) => {
    res.json({ data: await service.update(idSchema.parse(req.params.id), solicitudSchema.parse(req.body)) });
  });
  router.patch('/:id/estado', async (req, res) => {
    res.json({ data: await service.update(idSchema.parse(req.params.id), estadoSchema.parse(req.body)) });
  });
  return router;
}
