import { CreateTableCommand, DescribeTableCommand, waitUntilTableExists } from '@aws-sdk/client-dynamodb';
import definition from '../../infra/dynamodb-table.json' with { type: 'json' };
import { readConfig } from '../src/config/env.js';
import { createDynamoClients } from '../src/config/dynamodb.js';

const config = readConfig();
const { client } = createDynamoClients(config);
try {
  let table;
  try {
    table = (await client.send(new DescribeTableCommand({ TableName: config.DYNAMODB_TABLE }))).Table;
  } catch (error) {
    if (error.name !== 'ResourceNotFoundException') throw error;
  }
  if (table) {
    const compatible = table.KeySchema?.length === 1
      && table.KeySchema[0].AttributeName === 'solicitudId' && table.KeySchema[0].KeyType === 'HASH'
      && table.AttributeDefinitions?.some((attribute) => attribute.AttributeName === 'solicitudId' && attribute.AttributeType === 'S');
    if (!compatible) throw new Error('La tabla existente no tiene la clave solicitudId (String) esperada. No se modificó.');
    console.log('La tabla ya existe y tiene la clave esperada. No se modificó su configuración.');
  } else {
    await client.send(new CreateTableCommand({ ...definition, TableName: config.DYNAMODB_TABLE }));
    console.log(`Creación solicitada: ${config.DYNAMODB_TABLE} (${config.AWS_REGION}).`);
  }
  await waitUntilTableExists({ client, maxWaitTime: 120 }, { TableName: config.DYNAMODB_TABLE });
  console.log('Tabla activa y lista para usar.');
} catch (error) {
  console.error(`No se pudo preparar la tabla (${error.name}). Revisa credenciales, región, permisos y clave primaria.`);
  if (error.name === 'Error') console.error(error.message);
  process.exitCode = 1;
} finally { client.destroy(); }
