import { existsSync } from 'node:fs';
import { readConfig } from './config/env.js';
import { createDynamoClients } from './config/dynamodb.js';
import { createDynamoRepository } from './repositories/dynamodb.js';
import { createMemoryRepository } from './repositories/memory.js';
import { ejemplos } from './data/ejemplos.js';
import { createApp } from './app.js';

const config = readConfig(process.env, process.argv.includes('--demo'));
if (config.NODE_ENV === 'production' && !existsSync(new URL('../../frontend/dist/index.html', import.meta.url))) {
  throw new Error('Falta compilar el frontend. Ejecuta npm run build.');
}
const repository = config.STORAGE_MODE === 'memory'
  ? createMemoryRepository(ejemplos)
  : createDynamoRepository(createDynamoClients(config).documentClient, config.DYNAMODB_TABLE);
createApp({ repository, config }).listen(config.PORT, '0.0.0.0', () => {
  console.log(`API en http://localhost:${config.PORT} — almacenamiento: ${config.STORAGE_MODE}`);
  if (config.STORAGE_MODE === 'memory') console.log('DEMOSTRACIÓN: los cambios se pierden al reiniciar el backend.');
});
