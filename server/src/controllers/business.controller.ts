import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as businessService from '../services/business.service';
import * as paymentService from '../services/payment.service';
import * as subscriptionService from '../services/subscription.service';

export async function create(req: AuthRequest, res: Response) {
  try {
    const business = await businessService.createBusiness(req.user!.id, req.body);

    // Crear suscripción en Mercado Pago
    const mpResult = await paymentService.createSubscriptionPlan(
      req.user!.email,
      business.id,
      business.name
    );

    await subscriptionService.createSubscriptionRecord(business.id, mpResult.preapprovalId);

    res.status(201).json({
      business,
      initPoint: mpResult.initPoint,
      preapprovalId: mpResult.preapprovalId,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}

export async function list(_req: AuthRequest, res: Response) {
  try {
    const businesses = await businessService.getActiveBusinesses();
    res.json(businesses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getById(req: AuthRequest, res: Response) {
  try {
    const business = await businessService.getBusinessById(req.params.id as string);
    if (!business) return res.status(404).json({ error: 'Comercio no encontrado' });
    res.json(business);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function getMyBusinesses(req: AuthRequest, res: Response) {
  try {
    const businesses = await businessService.getBusinessesByOwner(req.user!.id);
    res.json(businesses);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}

export async function update(req: AuthRequest, res: Response) {
  try {
    const business = await businessService.updateBusiness(req.params.id as string, req.user!.id, req.body);
    if (!business) return res.status(404).json({ error: 'Comercio no encontrado o no autorizado' });
    res.json(business);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
}
