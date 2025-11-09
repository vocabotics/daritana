import express, { Request, Response, Router } from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';
import { rateLimit } from 'express-rate-limit';

const router: Router = express.Router();

// Initialize Stripe with environment-based configuration
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-07-30.basil',
  typescript: true,
});

// Rate limiting for payment endpoints
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many payment requests from this IP, please try again later.',
});

// Webhook signature verification
const verifyWebhookSignature = (req: Request, signature: string, body: string) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      throw new Error('Webhook secret not configured');
    }
    
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    return event;
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return null;
  }
};

// Create payment intent
(router.post as any)('/create-payment-intent', authenticate, paymentLimiter, async (req: any, res: Response) => {
  try {
    const { amount, currency = 'usd', organizationId, description, metadata = {} } = req.body;
    const userId = (req as any).user?.id;

    if (!amount || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Amount and organization ID are required' 
      });
    }

    // Verify user has access to organization
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId: organizationId 
      } as any
    });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied to organization' 
      });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description,
      metadata: {
        ...metadata,
        userId,
        organizationId,
        timestamp: new Date().toISOString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Log payment intent creation
    await prisma.payment.create({
      data: {
        organizationId,
        stripePaymentIntentId: paymentIntent.id,
        amount: amount,
        currency,
        status: 'PENDING',
        description,
        metadata: metadata as any
      } as any
    });

    return res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent creation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create payment intent' 
    });
  }
});

// Process payment
(router.post as any)('/process-payment', authenticate, paymentLimiter, async (req: any, res: Response) => {
  try {
    const { paymentIntentId, organizationId } = req.body;
    const userId = (req as any).user?.id;

    if (!paymentIntentId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment intent ID and organization ID are required' 
      });
    }

    // Retrieve payment intent
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update payment log
      await prisma.payment.updateMany({
        where: { 
          stripePaymentIntentId: paymentIntentId 
        } as any,
        data: { 
          status: 'COMPLETED'
        } as any
      });

      // Create or update subscription
      if (paymentIntent.metadata.subscriptionId) {
        await prisma.subscription.update({
          where: { id: paymentIntent.metadata.subscriptionId },
          data: { 
            status: 'ACTIVE',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
          } as any
        });
      }

      return res.json({
        success: true,
        message: 'Payment processed successfully',
        paymentIntent
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        status: paymentIntent.status
      });
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process payment' 
    });
  }
});

// Webhook handler for Stripe events
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  const event = verifyWebhookSignature(req, signature, req.body as string);
  if (!event) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Payment reconciliation
(router.post as any)('/reconcile', authenticate, async (req: any, res: Response) => {
  try {
    const { organizationId, startDate, endDate } = req.body;
    const userId = (req as any).user?.id;

    // Verify admin access
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId,
        role: { in: ['admin', 'owner'] }
      } as any
    });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required' 
      });
    }

    // Get payment logs for reconciliation
    const payments = await prisma.payment.findMany({
      where: {
        organizationId,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      } as any,
      orderBy: { createdAt: 'desc' } as any
    });

    // Reconcile with Stripe
    const reconciliationResults = [];
    for (const payment of payments) {
      if (payment.stripePaymentIntentId) {
        try {
          const stripePayment = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
          // Map Stripe status to our PaymentStatus enum for comparison
          const stripeStatusToPaymentStatus: { [key: string]: string } = {
            'succeeded': 'COMPLETED',
            'processing': 'PROCESSING',
            'requires_payment_method': 'PENDING',
            'requires_confirmation': 'PENDING',
            'requires_action': 'PENDING',
            'canceled': 'CANCELLED'
          };
          
          const mappedStripeStatus = stripeStatusToPaymentStatus[stripePayment.status] || 'PENDING';
          
          const reconciled = {
            paymentId: payment.id,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            localStatus: payment.status,
            stripeStatus: stripePayment.status,
            mappedStripeStatus,
            reconciled: payment.status === mappedStripeStatus,
            amount: payment.amount,
            stripeAmount: stripePayment.amount / 100
          };
          reconciliationResults.push(reconciled);
        } catch (error) {
          reconciliationResults.push({
            paymentId: payment.id,
            stripePaymentIntentId: payment.stripePaymentIntentId,
            localStatus: payment.status,
            stripeStatus: 'unknown',
            reconciled: false,
            error: 'Failed to retrieve from Stripe'
          });
        }
      }
    }

    return res.json({
      success: true,
      reconciliationResults,
      summary: {
        total: reconciliationResults.length,
        reconciled: reconciliationResults.filter(r => r.reconciled).length,
        discrepancies: reconciliationResults.filter(r => !r.reconciled).length
      }
    });
  } catch (error) {
    console.error('Payment reconciliation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to reconcile payments' 
    });
  }
});

// Get payment history
(router.get as any)('/history/:organizationId', authenticate, async (req: any, res: Response) => {
  try {
    const { organizationId } = req.params;
    const userId = (req as any).user?.id;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;

    // Verify access
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId 
      } as any
    });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied' 
      });
    }

    // Build where clause
    const where: any = { organizationId };
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    // Get payments with pagination
    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' } as any,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        organization: {
          select: { name: true }
        }
      } as any
    });

    // Get total count
    const total = await prisma.payment.count({ where });

    return res.json({
      success: true,
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Payment history error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve payment history' 
    });
  }
});

// Refund processing
(router.post as any)('/refund', authenticate, async (req: any, res: Response) => {
  try {
    const { paymentIntentId, reason, amount, organizationId } = req.body;
    const userId = (req as any).user?.id;

    if (!paymentIntentId || !organizationId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Payment intent ID and organization ID are required' 
      });
    }

    // Verify admin access
    const user = await prisma.user.findFirst({
      where: { 
        id: userId,
        organizationId,
        role: { in: ['admin', 'owner'] }
      } as any
    });

    if (!user) {
      return res.status(403).json({ 
        success: false, 
        error: 'Admin access required for refunds' 
      });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: reason || 'requested_by_customer',
      amount: amount ? Math.round(amount * 100) : undefined
    });

    // Update payment log
    await prisma.payment.updateMany({
      where: { 
        stripePaymentIntentId: paymentIntentId 
      } as any,
      data: { 
        status: 'REFUNDED'
      } as any
    });

    // Create refund record in payment table with refund metadata
    await prisma.payment.create({
      data: {
        organizationId,
        stripePaymentIntentId: paymentIntentId,
        amount: -(amount || 0), // Negative amount for refunds
        currency: 'usd',
        status: 'REFUNDED',
        description: `Refund: ${reason}`,
        metadata: { 
          refundId: refund.id,
          originalPaymentIntentId: paymentIntentId,
          reason: reason
        } as any
      } as any
    });

    return res.json({
      success: true,
      refund,
      message: 'Refund processed successfully'
    });
  } catch (error) {
    console.error('Refund processing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process refund' 
    });
  }
});

// Webhook event handlers
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  try {
    await prisma.payment.updateMany({
      where: { 
        stripePaymentIntentId: paymentIntent.id 
      } as any,
      data: { 
        status: 'COMPLETED'
      } as any
    });

    // Update subscription if applicable
    if (paymentIntent.metadata.subscriptionId) {
      await prisma.subscription.update({
        where: { id: paymentIntent.metadata.subscriptionId },
        data: { 
          status: 'ACTIVE',
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        } as any
      });
    }
  } catch (error) {
    console.error('Payment success handler error:', error);
  }
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  try {
    await prisma.payment.updateMany({
      where: { 
        stripePaymentIntentId: paymentIntent.id 
      } as any,
      data: { 
        status: 'FAILED'
      } as any
    });
  } catch (error) {
    console.error('Payment failure handler error:', error);
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    // Handle new subscription creation
    console.log('New subscription created:', subscription.id);
  } catch (error) {
    console.error('Subscription created handler error:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    // Handle subscription updates
    console.log('Subscription updated:', subscription.id);
  } catch (error) {
    console.error('Subscription updated handler error:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    // Handle subscription deletion
    console.log('Subscription deleted:', subscription.id);
  } catch (error) {
    console.error('Subscription deleted handler error:', error);
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    // Handle successful invoice payment
    console.log('Invoice payment succeeded:', invoice.id);
  } catch (error) {
    console.error('Invoice payment succeeded handler error:', error);
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Handle failed invoice payment
    console.log('Invoice payment failed:', invoice.id);
  } catch (error) {
    console.error('Invoice payment failed handler error:', error);
  }
}

export default router;