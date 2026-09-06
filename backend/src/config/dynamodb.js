import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export function createDynamoClients(config) {
  // El SDK usa el perfil local o las variables del servidor. No hay claves en código.
  const client = new DynamoDBClient({ region: config.AWS_REGION });
  const documentClient = DynamoDBDocumentClient.from(client, {
    marshallOptions: { removeUndefinedValues: true },
  });
  return { client, documentClient };
}
