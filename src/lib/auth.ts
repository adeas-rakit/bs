import { db } from "./db";
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: string;
  iat: number;
  exp: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function getUserFromToken(token: string) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

    if (!decoded || !decoded.userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      include: {
        nasabah: true,
        unit: true, // <-- FIX: Add this line to include unit data
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}
