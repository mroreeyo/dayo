import { verify, JwtPayload as JwtPayloadRaw } from 'jsonwebtoken';
import { Socket } from 'socket.io';

interface DecodedPayload extends JwtPayloadRaw {
  sub: string;
  email: string;
}

export interface WsUser {
  id: string;
  email: string;
}

export function verifyWsToken(client: Socket): WsUser | null {
  const token =
    client.handshake.auth?.token ??
    client.handshake.headers.authorization?.replace('Bearer ', '');

  if (!token || typeof token !== 'string') {
    return null;
  }

  try {
    const secret = process.env.JWT_SECRET ?? 'dev-secret';
    const decoded = verify(token, secret) as DecodedPayload;
    return { id: decoded.sub, email: decoded.email };
  } catch {
    return null;
  }
}
