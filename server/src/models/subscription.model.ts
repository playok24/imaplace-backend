export interface Subscription {
  id: string;
  business_id: string;
  mp_preapproval_id?: string;
  mp_subscription_id?: string;
  status: 'pending' | 'authorized' | 'cancelled' | 'expired';
  amount: number;
  currency: string;
  current_period_start?: Date;
  current_period_end?: Date;
  cancelled_at?: Date;
  created_at: Date;
  updated_at: Date;
}
