import test from 'node:test';
import assert from 'node:assert/strict';
import { createDynamoRepository } from '../src/repositories/dynamodb.js';

test('repositorio AWS conserva paginación y condiciones para no sobrescribir ni crear al editar', async () => {
  const commands = [];
  const lastKey = { solicitudId: '00000000-0000-4000-8000-000000000001' };
  const repository = createDynamoRepository({ async send(command) {
    commands.push(command);
    if (command.constructor.name === 'ScanCommand') return { Items: [], LastEvaluatedKey: lastKey };
    return { Attributes: { ...lastKey, estado: 'ATENDIDA' } };
  } }, 'SolicitudesAsistencia');
  const result = await repository.list({ limit: 1, key: lastKey, estado: 'EN_ATENCION' });
  assert.deepEqual(result.key, lastKey);
  assert.equal(commands[0].input.Limit, 1);
  assert.deepEqual(commands[0].input.ExclusiveStartKey, lastKey);
  assert.equal(commands[0].input.ExpressionAttributeValues[':estado'], 'EN_ATENCION');
  await repository.create(lastKey);
  assert.equal(commands[1].input.ConditionExpression, 'attribute_not_exists(solicitudId)');
  await repository.update(lastKey.solicitudId, { estado: 'ATENDIDA' });
  assert.equal(commands[2].input.ConditionExpression, 'attribute_exists(solicitudId)');
  assert.equal(commands[2].input.ReturnValues, 'ALL_NEW');
  assert.deepEqual(commands[2].input.Key, lastKey);
});
