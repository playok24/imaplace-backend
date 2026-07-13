import { query } from '../config/database';
import { Subscription } from '../models/subscription.model';

export async function createSubscriptionRecord(
  businessId: string,
  mpPreapprovalId: string,
  amount: number = 5500
): Promise<Subscription> {
  const result = await query(
    `INSERT INTO subscriptions (business_id, mp_preapproval_id, amount, status)
     VALUES ($1, $2, $3, 'pending')
     RETURNING *`,
    [businessId, mpPreapprovalId, amount]
  );
  return result.rows[0];
}

export async function activateSubscription(preapprovalId: string): Promise<void> {
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await query(
    `UPDATE subscriptions
     SET status = 'authorized',
         current_period_start = $1,
         current_period_end = $2,
         updated_at = NOW()
     WHERE mp_preapproval_id = $3`,
    [now, periodEnd, preapprovalId]
  );

  // Activar el comercio asociado
  await query(
    `UPDATE businesses SET is_active = TRUE, updated_at = NOW()
     WHERE id = (SELECT business_id FROM subscriptions WHERE mp_preapproval_id = $1)`,
    [preapprovalId]
  );
}

export async function deactivateSubscription(preapprovalId: string): Promise<void> {
  await query(
    `UPDATE subscriptions
     SET status = 'cancelled', cancelled_at = NOW(), updated_at = NOW()
     WHERE mp_preapproval_id = $1`,
    [preapprovalId]
  );

  await query(
    `UPDATE businesses SET is_active = FALSE, updated_at = NOW()
     WHERE id = (SELECT business_id FROM subscriptions WHERE mp_preapproval_id = $1)`,
    [preapprovalId]
  );
}

export async function getSubscriptionByBusiness(businessId: string): Promise<Subscription | null> {
  const result = await query(
    'SELECT * FROM subscriptions WHERE business_id = $1 ORDER BY created_at DESC LIMIT 1',
    [businessId]
  );
  return result.rows[0] || null;
}

export async function getExpiringSubscriptions(): Promise<Subscription[]> {
  const result = await query(
    `SELECT * FROM subscriptions
     WHERE status = 'authorized'
       AND current_period_end < NOW() + INTERVAL '3 days'`
  );
  return result.rows;
}

export async function expireOverdueSubscriptions(): Promise<void> {
  const result = await query(
    `UPDATE subscriptions SET status = 'expired', updated_at = NOW()
     WHERE status = 'authorized' AND current_period_end < NOW()
     RETURNING business_id`
  );

  for (const row of result.rows) {
    await query('UPDATE businesses SET is_active = FALSE, updated_at = NOW() WHERE id = $1', [row.business_id]);
  }

  console.log(`Expired ${result.rowCount} overdue subscriptions`);
}
