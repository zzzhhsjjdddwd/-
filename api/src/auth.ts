import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'yunqi-light-meal-dev-secret';

export function signToken(payload: { id: number; username?: string; role: string }) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string | undefined) {
  if (!token) return null;
  try {
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    return jwt.verify(raw, JWT_SECRET) as any;
  } catch (e) {
    return null;
  }
}
