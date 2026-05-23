import Stripe from 'stripe';

import { BadRequestError, ServiceUnavailableError } from '../../../core/errors';
import type {
  CreatePaymentIntentInput,
  CreatePaymentIntentResult,
  PaymentProvider,
} from './payment-provider';

export class StripeProvider implements PaymentProvider {
  id = 'STRIPE' as const;

  private readonly client: Stripe;

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new ServiceUnavailableError('Stripe provider is not configured');
    }

    this.client = new Stripe(secretKey);
  }

  async createPaymentIntent(input: CreatePaymentIntentInput): Promise<CreatePaymentIntentResult> {
    try {
      const amountInMinor = Math.max(1, Math.round(input.amount * 100));
      const intent = await this.client.paymentIntents.create({
        amount: amountInMinor,
        currency: input.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: input.metadata,
        description: `FarmConnect order ${input.orderId}`,
      });

      return {
        provider: this.id,
        gatewayRef: intent.id,
        status: 'PENDING',
        clientSecret: intent.client_secret ?? undefined,
        raw: {
          id: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          status: intent.status,
          clientSecretPresent: !!intent.client_secret,
        },
      };
    } catch (err) {
      throw new BadRequestError(
        err instanceof Error ? `Stripe payment intent creation failed: ${err.message}` : 'Stripe payment intent creation failed',
      );
    }
  }

  constructWebhookEvent(rawBody: Buffer, signature: string, webhookSecret: string): Stripe.Event {
    if (!webhookSecret) {
      throw new ServiceUnavailableError('Stripe webhook secret is not configured');
    }

    return this.client.webhooks.constructEvent(rawBody, signature, webhookSecret);
  }
}
