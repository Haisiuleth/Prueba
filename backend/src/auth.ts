import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const secret = () => process.env.JWT_SECRET as string;

export const signToken = (userId: string) =>
  jwt.sign({ sub: userId }, secret(), { expiresIn: '8h' });

export const getUserId = (authHeader?: string): string | null => {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  try {
    const payload = jwt.verify(token, secret()) as jwt.JwtPayload;
    return payload.sub ?? null;
  } catch (e) {
    return null;
  }
};
export const requireAuth = (req: Request, res:
   Response, next: NextFunction) => {
  if (!getUserId(req.headers.authorization)) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
};
