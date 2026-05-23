import { randomUUID } from 'node:crypto';

import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
} from './payment-provider';

export class BaridiMobProvider implements PaymentProvider {
  id = 'BARIDIMOB' as const;

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    const reference = `baridimob_${randomUUID()}`;

    return {
      provider: this.id,
      gatewayRef: reference,
      status: 'REQUIRES_ACTION',
      redirectUrl: input.returnUrl,
      raw: {
        notice: 'BaridiMob provider is currently a placeholder implementation',
        orderId: input.orderId,
        amount: input.amount,
        currency: input.currency,
        reference,
      },
    };
  }
}
