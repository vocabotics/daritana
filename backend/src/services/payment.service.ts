/**
 * Payment Service
 * Multi-gateway payment processing with Stripe and FPX support
 */

import Stripe from 'stripe';

interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

interface Subscription {
  id: string;
  customerId: string;
  planId: string;
  status: string;
  currentPeriodEnd: Date;
}

class PaymentService {
  private stripe: Stripe | null = null;
  private stripeEnabled: boolean;

  constructor() {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    this.stripeEnabled = !!stripeKey;

    if (this.stripeEnabled) {
      this.stripe = new Stripe(stripeKey!, {
        apiVersion: '2024-11-20.acacia',
      });
    }
  }

  // Payment Intents
  async createPaymentIntent(amount: number, currency: string = 'myr', metadata?: Record<string, string>): Promise<PaymentIntent | null> {
    if (!this.stripe) return null;

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency.toLowerCase(),
      metadata,
    });

    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret || undefined,
    };
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<boolean> {
    if (!this.stripe) return false;

    const intent = await this.stripe.paymentIntents.confirm(paymentIntentId);
    return intent.status === 'succeeded';
  }

  // Customers
  async createCustomer(email: string, name: string, metadata?: Record<string, string>): Promise<string | null> {
    if (!this.stripe) return null;

    const customer = await this.stripe.customers.create({
      email,
      name,
      metadata,
    });

    return customer.id;
  }

  async updateCustomer(customerId: string, data: { email?: string; name?: string }): Promise<boolean> {
    if (!this.stripe) return false;

    await this.stripe.customers.update(customerId, data);
    return true;
  }

  // Subscriptions
  async createSubscription(customerId: string, priceId: string): Promise<Subscription | null> {
    if (!this.stripe) return null;

    const subscription = await this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });

    return {
      id: subscription.id,
      customerId: subscription.customer as string,
      planId: priceId,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.stripe) return false;

    await this.stripe.subscriptions.cancel(subscriptionId);
    return true;
  }

  async updateSubscription(subscriptionId: string, newPriceId: string): Promise<boolean> {
    if (!this.stripe) return false;

    const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
    await this.stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: subscription.items.data[0].id,
        price: newPriceId,
      }],
    });
    return true;
  }

  // Webhooks
  async handleWebhook(payload: string | Buffer, signature: string): Promise<any> {
    if (!this.stripe) return null;

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) throw new Error('Webhook secret not configured');

    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'payment_intent.succeeded':
        return this.handlePaymentSuccess(event.data.object);
      case 'payment_intent.payment_failed':
        return this.handlePaymentFailure(event.data.object);
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        return this.handleSubscriptionUpdate(event.data.object);
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return event;
  }

  private async handlePaymentSuccess(paymentIntent: any): Promise<void> {
    console.log('Payment succeeded:', paymentIntent.id);
    // Update database, send confirmation email, etc.
  }

  private async handlePaymentFailure(paymentIntent: any): Promise<void> {
    console.log('Payment failed:', paymentIntent.id);
    // Send failure notification
  }

  private async handleSubscriptionUpdate(subscription: any): Promise<void> {
    console.log('Subscription updated:', subscription.id);
    // Update database with new subscription status
  }

  // FPX (Malaysian online banking)
  async createFPXPayment(amount: number, email: string): Promise<PaymentIntent | null> {
    if (!this.stripe) return null;

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'myr',
      payment_method_types: ['fpx'],
      receipt_email: email,
    });

    return {
      id: intent.id,
      amount: intent.amount / 100,
      currency: intent.currency,
      status: intent.status,
      clientSecret: intent.client_secret || undefined,
    };
  }

  // Invoices
  async createInvoice(customerId: string, items: Array<{ description: string; amount: number }>): Promise<string | null> {
    if (!this.stripe) return null;

    // Create invoice items
    for (const item of items) {
      await this.stripe.invoiceItems.create({
        customer: customerId,
        amount: Math.round(item.amount * 100),
        currency: 'myr',
        description: item.description,
      });
    }

    // Create and finalize invoice
    const invoice = await this.stripe.invoices.create({
      customer: customerId,
      auto_advance: true, // Auto-finalize
    });

    await this.stripe.invoices.finalizeInvoice(invoice.id);

    return invoice.hosted_invoice_url || null;
  }

  // Refunds
  async refund(paymentIntentId: string, amount?: number): Promise<boolean> {
    if (!this.stripe) return false;

    await this.stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    return true;
  }
}

export const paymentService = new PaymentService();
export default paymentService;
