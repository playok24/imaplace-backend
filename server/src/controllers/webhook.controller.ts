import { Request, Response } from 'express';
import * as subscriptionService from '../services/subscription.service';

export async function mercadopagoWebhook(req: Request, res: Response) {
  try {
    const { action, data } = req.body;

    console.log('MP Webhook received:', { action, data });

    if (!data?.id) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    switch (action) {
      case 'subscription_authorized':
      case 'subscription_updated':
        await subscriptionService.activateSubscription(data.id);
        break;

      case 'subscription_cancelled':
        await subscriptionService.deactivateSubscription(data.id);
        break;

      case 'subscription_charged':
        // Extender período actual
        break;

      default:
        console.log('Unhandled action:', action);
    }

    res.json({ received: true });
  } catch (err: any) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: err.message });
  }
}
