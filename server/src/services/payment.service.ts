import { MercadoPagoConfig, PreApproval } from 'mercadopago';
import { env } from '../config/env';

const client = new MercadoPagoConfig({
  accessToken: env.MERCADO_PAGO_ACCESS_TOKEN,
});

const preApproval = new PreApproval(client);

export interface CreateSubscriptionResult {
  preapprovalId: string;
  initPoint: string;
}

export async function createSubscriptionPlan(
  payerEmail: string,
  businessId: string,
  businessName: string
): Promise<CreateSubscriptionResult> {
  const payload = {
    payer_email: payerEmail,
    reason: `Suscripción Maps Interactive - ${businessName}`,
    external_reference: businessId,
    auto_recurring: {
      frequency: 1,
      frequency_type: 'months' as const,
      transaction_amount: 5500,
      currency_id: 'ARS',
    },
    back_url: 'http://192.168.0.55:3000/api/payments/success',
    status: 'pending',
  };

  const response = await preApproval.create({ body: payload });
  return {
    preapprovalId: response.id!,
    initPoint: response.init_point!,
  };
}

export async function getSubscriptionStatus(preapprovalId: string): Promise<string> {
  const response = await preApproval.get({ id: preapprovalId });
  return response.status || 'unknown';
}

export async function cancelSubscription(preapprovalId: string): Promise<void> {
  await preApproval.update({
    id: preapprovalId,
    body: { status: 'cancelled' },
  });
}
