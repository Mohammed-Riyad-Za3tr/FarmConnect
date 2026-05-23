export type PaymentProviderId = 'STRIPE' | 'BARIDIMOB';

export interface CreatePaymentIntentInput {
  orderId: string;
  amount: number;
  currency: string;
  metadata: Record<string, string>;
  returnUrl?: string;
}

export interface CreatePaymentIntentResult {
  provider: PaymentProviderId;
  gatewayRef: string;
  status: 'PENDING' | 'REQUIRES_ACTION';
  clientSecret?: string;
  redirectUrl?: string;
  raw: Record<string, unknown>;
}

export interface PaymentProvider {
  id: PaymentProviderId;
  createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult>;
}
