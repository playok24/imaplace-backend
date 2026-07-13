import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller';

const router = Router();

router.post('/mercadopago', webhookController.mercadopagoWebhook);

export default router;
