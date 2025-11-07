import { Router } from 'express'
import { body, query, param } from 'express-validator'
import { authenticate, authorize } from '../middleware/auth'
import { validationResult } from 'express-validator'
import { PrismaClient } from '@prisma/client'
import Stripe from 'stripe'

const router = Router()
const prisma = new PrismaClient()

// Initialize Stripe (will be configured with actual keys in production)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder', {
  apiVersion: '2024-11-20.acacia'
})

// Validation middleware
const validate = (req: any, res: any, next: any) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation error', details: errors.array() })
  }
  next()
}

// All routes require authentication
router.use(authenticate)

// Get subscription plans
router.get('/plans', async (req: any, res: any) => {
  try {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' }
    })

    // Malaysian pricing with RM currency
    const formattedPlans = plans.map(plan => ({
      ...plan,
      displayPrice: `RM ${plan.price.toFixed(2)}`,
      features: plan.features || [],
      limits: {
        maxUsers: plan.maxUsers,
        maxProjects: plan.maxProjects,
        maxStorage: plan.maxStorage,
        maxFileSize: plan.maxFileSize
      }
    }))

    res.json({
      success: true,
      plans: formattedPlans,
      currency: 'MYR'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription plans',
      message: error.message
    })
  }
})

// Get current subscription
router.get('/subscription', async (req: any, res: any) => {
  try {
    const organizationId = req.user.organizationId

    const subscription = await prisma.subscription.findFirst({
      where: {
        organizationId,
        status: { in: ['ACTIVE', 'TRIALING'] }
      },
      include: {
        plan: true,
        organization: {
          select: {
            id: true,
            name: true,
            billingEmail: true
          }
        }
      }
    })

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      })
    }

    // Calculate usage
    const [userCount, projectCount, storageUsed] = await Promise.all([
      prisma.organizationMember.count({
        where: { organizationId, status: 'ACTIVE' }
      }),
      prisma.project.count({
        where: { organizationId }
      }),
      prisma.file.aggregate({
        where: { organizationId },
        _sum: { size: true }
      })
    ])

    res.json({
      success: true,
      subscription: {
        ...subscription,
        usage: {
          users: {
            current: userCount,
            limit: subscription.plan.maxUsers
          },
          projects: {
            current: projectCount,
            limit: subscription.plan.maxProjects
          },
          storage: {
            current: storageUsed._sum.size || 0,
            limit: subscription.plan.maxStorage
          }
        },
        daysRemaining: Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subscription details',
      message: error.message
    })
  }
})

// Create subscription checkout session
router.post('/checkout', [
  body('planId').isUUID(),
  body('billingPeriod').isIn(['MONTHLY', 'YEARLY']),
  body('paymentMethod').isIn(['STRIPE', 'FPX', 'BANK_TRANSFER']),
  validate
], async (req: any, res: any) => {
  try {
    const { planId, billingPeriod, paymentMethod } = req.body
    const organizationId = req.user.organizationId

    // Get plan details
    const plan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!plan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      })
    }

    // Calculate price based on billing period
    const price = billingPeriod === 'YEARLY' ? plan.price * 10 : plan.price // 2 months free for yearly
    const currency = 'MYR'

    if (paymentMethod === 'STRIPE') {
      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card', 'fpx'], // FPX is Malaysian online banking
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: plan.name,
                description: plan.description || `${plan.name} Subscription`
              },
              unit_amount: Math.round(price * 100), // Convert to cents
              recurring: {
                interval: billingPeriod === 'YEARLY' ? 'year' : 'month'
              }
            },
            quantity: 1
          }
        ],
        mode: 'subscription',
        success_url: `${process.env.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment/cancel`,
        metadata: {
          organizationId,
          planId,
          billingPeriod
        }
      })

      res.json({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
      })
    } else if (paymentMethod === 'FPX') {
      // Malaysian FPX payment integration
      // This would integrate with actual FPX gateway in production
      const fpxTransaction = await prisma.payment.create({
        data: {
          organizationId,
          amount: price,
          currency,
          status: 'PENDING',
          method: 'FPX',
          description: `${plan.name} Subscription - ${billingPeriod}`,
          metadata: {
            planId,
            billingPeriod,
            fpxReference: `FPX${Date.now()}`
          }
        }
      })

      // In production, this would redirect to actual FPX gateway
      res.json({
        success: true,
        paymentId: fpxTransaction.id,
        fpxUrl: `${process.env.FPX_GATEWAY_URL}/pay?ref=${fpxTransaction.id}`,
        amount: price,
        currency
      })
    } else if (paymentMethod === 'BANK_TRANSFER') {
      // Manual bank transfer option
      const invoice = await prisma.invoice.create({
        data: {
          organizationId,
          invoiceNumber: `INV-${Date.now()}`,
          amount: price,
          currency,
          status: 'PENDING',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          items: [{
            description: `${plan.name} Subscription - ${billingPeriod}`,
            quantity: 1,
            unitPrice: price,
            total: price
          }],
          bankDetails: {
            bankName: 'Maybank',
            accountName: 'Daritana Sdn Bhd',
            accountNumber: '512345678901',
            swiftCode: 'MBBEMYKL',
            reference: `ORG${organizationId.substring(0, 8)}`
          }
        }
      })

      res.json({
        success: true,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          amount: price,
          currency,
          bankDetails: invoice.bankDetails,
          dueDate: invoice.dueDate
        }
      })
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session',
      message: error.message
    })
  }
})

// Upgrade/downgrade subscription
router.post('/subscription/change', [
  body('planId').isUUID(),
  body('billingPeriod').optional().isIn(['MONTHLY', 'YEARLY']),
  validate
], authorize(['ORG_OWNER', 'ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const { planId, billingPeriod } = req.body
    const organizationId = req.user.organizationId

    // Get current subscription
    const currentSubscription = await prisma.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE'
      },
      include: { plan: true }
    })

    if (!currentSubscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      })
    }

    // Get new plan
    const newPlan = await prisma.subscriptionPlan.findUnique({
      where: { id: planId }
    })

    if (!newPlan) {
      return res.status(404).json({
        success: false,
        error: 'Plan not found'
      })
    }

    // Check if downgrade is allowed based on usage
    const [userCount, projectCount, storageUsed] = await Promise.all([
      prisma.organizationMember.count({
        where: { organizationId, status: 'ACTIVE' }
      }),
      prisma.project.count({
        where: { organizationId }
      }),
      prisma.file.aggregate({
        where: { organizationId },
        _sum: { size: true }
      })
    ])

    if (userCount > newPlan.maxUsers) {
      return res.status(400).json({
        success: false,
        error: 'Cannot downgrade: Too many active users',
        details: {
          current: userCount,
          limit: newPlan.maxUsers
        }
      })
    }

    if (projectCount > newPlan.maxProjects) {
      return res.status(400).json({
        success: false,
        error: 'Cannot downgrade: Too many projects',
        details: {
          current: projectCount,
          limit: newPlan.maxProjects
        }
      })
    }

    const storageBytes = storageUsed._sum.size || 0
    if (storageBytes > newPlan.maxStorage) {
      return res.status(400).json({
        success: false,
        error: 'Cannot downgrade: Storage limit exceeded',
        details: {
          current: storageBytes,
          limit: newPlan.maxStorage
        }
      })
    }

    // Update subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: {
        planId,
        billingPeriod: billingPeriod || currentSubscription.billingPeriod,
        updatedAt: new Date()
      },
      include: { plan: true }
    })

    // Log the change
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'SUBSCRIPTION_CHANGED',
        entityType: 'SUBSCRIPTION',
        entityId: updatedSubscription.id,
        metadata: {
          from: currentSubscription.plan.name,
          to: newPlan.name,
          billingPeriod: updatedSubscription.billingPeriod
        }
      }
    })

    res.json({
      success: true,
      subscription: updatedSubscription,
      message: `Successfully changed to ${newPlan.name} plan`
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to change subscription',
      message: error.message
    })
  }
})

// Get payment history
router.get('/payments', [
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { limit = 20, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: { organizationId },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' },
        include: {
          invoice: {
            select: {
              id: true,
              invoiceNumber: true
            }
          }
        }
      }),
      prisma.payment.count({
        where: { organizationId }
      })
    ])

    res.json({
      success: true,
      payments,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch payment history',
      message: error.message
    })
  }
})

// Get invoices
router.get('/invoices', [
  query('status').optional().isIn(['DRAFT', 'PENDING', 'PAID', 'OVERDUE', 'CANCELLED']),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 }),
  validate
], async (req: any, res: any) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query
    const organizationId = req.user.organizationId

    const where: any = { organizationId }
    if (status) where.status = status

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ])

    res.json({
      success: true,
      invoices,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string)
      }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch invoices',
      message: error.message
    })
  }
})

// Download invoice PDF
router.get('/invoices/:id/download', [
  param('id').isUUID(),
  validate
], async (req: any, res: any) => {
  try {
    const { id } = req.params
    const organizationId = req.user.organizationId

    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        organization: true,
        payment: true
      }
    })

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: 'Invoice not found'
      })
    }

    // In production, generate actual PDF
    // For now, return invoice data for frontend PDF generation
    res.json({
      success: true,
      invoice,
      downloadUrl: `/api/v1/payments/invoices/${id}/pdf`
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate invoice',
      message: error.message
    })
  }
})

// Cancel subscription
router.post('/subscription/cancel', [
  body('reason').optional().isString(),
  body('feedback').optional().isString(),
  validate
], authorize(['ORG_OWNER', 'ORG_ADMIN']), async (req: any, res: any) => {
  try {
    const { reason, feedback } = req.body
    const organizationId = req.user.organizationId

    const subscription = await prisma.subscription.findFirst({
      where: {
        organizationId,
        status: 'ACTIVE'
      }
    })

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: 'No active subscription found'
      })
    }

    // Cancel at period end
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        cancelAtPeriodEnd: true,
        cancelReason: reason,
        cancelFeedback: feedback,
        cancelledAt: new Date(),
        cancelledBy: req.user.id
      }
    })

    // Log cancellation
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: req.user.id,
        action: 'SUBSCRIPTION_CANCELLED',
        entityType: 'SUBSCRIPTION',
        entityId: subscription.id,
        metadata: {
          reason,
          feedback,
          effectiveDate: subscription.currentPeriodEnd
        }
      }
    })

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period',
      effectiveDate: subscription.currentPeriodEnd
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription',
      message: error.message
    })
  }
})

// Apply promo code
router.post('/promo/apply', [
  body('code').notEmpty().isString(),
  validate
], async (req: any, res: any) => {
  try {
    const { code } = req.body
    const organizationId = req.user.organizationId

    // Check if promo code exists and is valid
    const promo = await prisma.promotionCode.findUnique({
      where: { code: code.toUpperCase() }
    })

    if (!promo) {
      return res.status(404).json({
        success: false,
        error: 'Invalid promo code'
      })
    }

    if (!promo.isActive) {
      return res.status(400).json({
        success: false,
        error: 'This promo code is no longer active'
      })
    }

    if (promo.expiresAt && promo.expiresAt < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This promo code has expired'
      })
    }

    if (promo.maxUses && promo.usageCount >= promo.maxUses) {
      return res.status(400).json({
        success: false,
        error: 'This promo code has reached its usage limit'
      })
    }

    // Check if already used by this organization
    const existingUsage = await prisma.promotionUsage.findFirst({
      where: {
        promotionId: promo.id,
        organizationId
      }
    })

    if (existingUsage) {
      return res.status(400).json({
        success: false,
        error: 'This promo code has already been used'
      })
    }

    // Apply promo code
    await prisma.promotionUsage.create({
      data: {
        promotionId: promo.id,
        organizationId,
        usedBy: req.user.id
      }
    })

    // Update usage count
    await prisma.promotionCode.update({
      where: { id: promo.id },
      data: { usageCount: promo.usageCount + 1 }
    })

    res.json({
      success: true,
      discount: {
        type: promo.discountType,
        value: promo.discountValue,
        description: promo.description
      },
      message: 'Promo code applied successfully'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to apply promo code',
      message: error.message
    })
  }
})

// Webhook for payment providers
router.post('/webhook/:provider', async (req: any, res: any) => {
  try {
    const { provider } = req.params
    const payload = req.body

    if (provider === 'stripe') {
      // Verify webhook signature
      const sig = req.headers['stripe-signature']
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

      if (!sig || !webhookSecret) {
        return res.status(400).json({ error: 'Missing signature or webhook secret' })
      }

      let event
      try {
        event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
      } catch (err: any) {
        return res.status(400).json({ error: `Webhook Error: ${err.message}` })
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as any
          // Update subscription status
          await prisma.subscription.update({
            where: { stripeCustomerId: session.customer },
            data: { status: 'ACTIVE' }
          })
          break

        case 'invoice.payment_succeeded':
          const invoice = event.data.object as any
          // Record payment
          await prisma.payment.create({
            data: {
              organizationId: invoice.metadata.organizationId,
              amount: invoice.amount_paid / 100,
              currency: invoice.currency.toUpperCase(),
              status: 'COMPLETED',
              method: 'STRIPE',
              stripePaymentId: invoice.payment_intent,
              description: 'Subscription payment'
            }
          })
          break

        case 'customer.subscription.deleted':
          const subscription = event.data.object as any
          // Cancel subscription
          await prisma.subscription.update({
            where: { stripeSubscriptionId: subscription.id },
            data: { status: 'CANCELLED' }
          })
          break
      }
    } else if (provider === 'fpx') {
      // Handle FPX webhook
      const { transactionId, status, amount } = payload

      if (status === 'SUCCESS') {
        await prisma.payment.update({
          where: { id: transactionId },
          data: {
            status: 'COMPLETED',
            completedAt: new Date()
          }
        })
      } else if (status === 'FAILED') {
        await prisma.payment.update({
          where: { id: transactionId },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: payload.reason
          }
        })
      }
    }

    res.json({ received: true })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message
    })
  }
})

export default router