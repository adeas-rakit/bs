
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

    // Mengganti 'include' dengan 'select' untuk memastikan semua field yang diperlukan
    // ada dalam tipe data yang dikembalikan, termasuk 'notificationsLastReadAt'.
    // Ini memperbaiki peringatan TypeScript di seluruh aplikasi.
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        unitId: true,
        notificationsLastReadAt: true, // <-- FIX: Explicitly select the field
        nasabah: true,
        unit: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting user from token:", error);
    return null;
  }
}
