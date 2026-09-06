import { createHash, timingSafeEqual } from 'node:crypto';

export function basicAuth(user, password) {
  const hash = (value) => createHash('sha256').update(value).digest();
  const expected = hash(`${user}:${password}`);
  return (req, res, next) => {
    const authorization = req.get('authorization') ?? '';
    const valid = authorization.startsWith('Basic ') && timingSafeEqual(
      expected, hash(Buffer.from(authorization.slice(6), 'base64').toString('utf8')),
    );
    if (valid) return next();
    res.set('WWW-Authenticate', 'Basic realm="Taller de sismos", charset="UTF-8"');
    return res.status(401).json({ error: { message: 'Se requiere el acceso de evaluación.' } });
  };
}
