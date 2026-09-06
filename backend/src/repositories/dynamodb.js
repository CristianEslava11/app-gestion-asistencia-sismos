import { GetCommand, PutCommand, ScanCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';

export function createDynamoRepository(client, tableName) {
  return {
    async list({ limit, key, estado }) {
      // Limit limita registros evaluados, no coincidencias del filtro.
      const result = await client.send(new ScanCommand({
        TableName: tableName, Limit: limit, ExclusiveStartKey: key, ConsistentRead: true,
        ...(estado ? {
          FilterExpression: '#estado = :estado',
          ExpressionAttributeNames: { '#estado': 'estado' },
          ExpressionAttributeValues: { ':estado': estado },
        } : {}),
      }));
      return { items: result.Items ?? [], key: result.LastEvaluatedKey };
    },
    async get(solicitudId) {
      const result = await client.send(new GetCommand({
        TableName: tableName, Key: { solicitudId }, ConsistentRead: true,
      }));
      return result.Item;
    },
    async create(item) {
      await client.send(new PutCommand({
        TableName: tableName, Item: item,
        ConditionExpression: 'attribute_not_exists(solicitudId)',
      }));
      return item;
    },
    async update(solicitudId, fields) {
      const entries = Object.entries(fields);
      const result = await client.send(new UpdateCommand({
        TableName: tableName, Key: { solicitudId },
        ConditionExpression: 'attribute_exists(solicitudId)',
        UpdateExpression: `SET ${entries.map((_, i) => `#f${i} = :v${i}`).join(', ')}`,
        ExpressionAttributeNames: Object.fromEntries(entries.map(([name], i) => [`#f${i}`, name])),
        ExpressionAttributeValues: Object.fromEntries(entries.map(([, value], i) => [`:v${i}`, value])),
        ReturnValues: 'ALL_NEW',
      }));
      return result.Attributes;
    },
  };
}
