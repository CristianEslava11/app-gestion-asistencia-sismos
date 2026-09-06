import { readConfig } from '../src/config/env.js';
import { createDynamoClients } from '../src/config/dynamodb.js';
import { createDynamoRepository } from '../src/repositories/dynamodb.js';
import { ejemplos } from '../src/data/ejemplos.js';

const config = readConfig();
const { client, documentClient } = createDynamoClients(config);
const repository = createDynamoRepository(documentClient, config.DYNAMODB_TABLE);
try {
  let created = 0;
  for (const item of ejemplos) {
    try { await repository.create(item); created += 1; }
    catch (error) { if (error.name !== 'ConditionalCheckFailedException') throw error; }
  }
  console.log(`${created} ejemplos creados; ${ejemplos.length - created} ya existían y se conservaron.`);
} catch (error) {
  console.error(`No se pudieron cargar los ejemplos (${error.name}). Revisa la tabla y el acceso de AWS.`);
  process.exitCode = 1;
} finally { client.destroy(); }
