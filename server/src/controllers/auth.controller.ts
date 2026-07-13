import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { toSafeUser } from '../models/user.model';
import * as authService from '../services/auth.service';

export async function register(req: Request, res: Response) {
  try {
    const { email, password, name, role } = req.body;
    const result = await authService.registerUser(email, password, name, role);
    res.status(201).json(result);
  } catch (err: any) {
    console.error('Register error:', err.message);
    res.status(400).json({ error: err.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);
    res.json(result);
  } catch (err: any) {
    console.error('Login error:', err.message);
    res.status(401).json({ error: err.message });
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }
    const result = await authService.refreshUserToken(refreshToken);
    res.json(result);
  } catch (err: any) {
    res.status(401).json({ error: err.message });
  }
}

export async function me(req: AuthRequest, res: Response) {
  if (!req.user) return res.status(401).json({ error: 'No autenticado' });
  res.json(toSafeUser(req.user));
}
