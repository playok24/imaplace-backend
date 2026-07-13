import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database';
import { env } from '../config/env';
import { User, toSafeUser, SafeUser } from '../models/user.model';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: 'user' | 'business_owner' = 'user'
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    throw new Error('Email ya registrado');
  }

  const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [email, password_hash, name, role]
  );

  const user: User = result.rows[0];
  const tokens = generateTokens(user.id, user.role);
  return { user: toSafeUser(user), ...tokens };
}

export async function loginUser(
  email: string,
  password: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  if (result.rows.length === 0) {
    throw new Error('Email o contraseña incorrectos');
  }

  const user: User = result.rows[0];
  if (!user.is_active) {
    throw new Error('Cuenta desactivada');
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw new Error('Email o contraseña incorrectos');
  }

  const tokens = generateTokens(user.id, user.role);
  return { user: toSafeUser(user), ...tokens };
}

export async function refreshUserToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  try {
    const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string; role: string };
    const result = await query('SELECT id, role FROM users WHERE id = $1 AND is_active = TRUE', [decoded.userId]);
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado o inactivo');
    }
    return generateTokens(result.rows[0].id, result.rows[0].role);
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      throw new Error('Refresh token inválido');
    }
    throw err;
  }
}

function generateTokens(userId: string, role: string) {
  const accessToken = jwt.sign({ userId, role }, env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId, role }, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}
