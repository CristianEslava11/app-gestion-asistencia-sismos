import express from 'express';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { ZodError } from 'zod';
import { solicitudesRouter } from './routes/solicitudes.js';
import { createSolicitudesService } from './services/solicitudes.js';
import { basicAuth } from './middleware/basic-auth.js';

const defaultFrontend = fileURLToPath(new URL('../../frontend/dist/', import.meta.url));

export function createApp({ repository, config, frontendDirectory = defaultFrontend }) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('Referrer-Policy', 'same-origin');
    next();
  });
  // Sonda pública de proceso; deliberadamente no prueba la conexión con DynamoDB.
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));
  if (config.DEMO_USER) app.use(basicAuth(config.DEMO_USER, config.DEMO_PASSWORD));
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use(express.json({ limit: '32kb' }));
  app.get('/api/config', (_req, res) => res.json({ data: { storageMode: config.STORAGE_MODE } }));
  app.use('/api/solicitudes', solicitudesRouter(createSolicitudesService(repository)));
  app.use('/api', (_req, res) => res.status(404).json({ error: { message: 'Ruta de API no encontrada.' } }));
  if (existsSync(frontendDirectory)) {
    app.use(express.static(frontendDirectory));
    app.get('/', (_req, res) => res.sendFile(`${frontendDirectory}/index.html`));
  }
  app.use((_req, res) => res.status(404).json({ error: { message: 'Ruta no encontrada.' } }));
  app.use((error, _req, res, _next) => {
    if (error instanceof ZodError) {
      return res.status(400).json({ error: { message: 'Revisa los datos enviados.',
        details: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message })) } });
    }
    if (error.type === 'entity.parse.failed') return res.status(400).json({ error: { message: 'JSON inválido.' } });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: { message: 'La solicitud es demasiado grande.' } });
    if (error.status) return res.status(error.status).json({ error: { message: error.message } });
    // No se imprimen cuerpos, datos personales, credenciales ni mensajes completos de AWS.
    console.error('Fallo del servidor:', error.name);
    return res.status(503).json({ error: { message: 'No se pudo acceder al almacenamiento. Revisa la configuración del backend.' } });
  });
  return app;
}
