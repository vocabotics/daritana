import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const addCartItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  specifications: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1),
  specifications: z.record(z.any()).optional(),
  notes: z.string().optional(),
});

const checkoutSchema = z.object({
  deliveryAddress: z.string().min(1),
  deliveryDate: z.string().datetime().optional(),
  deliveryInstructions: z.string().optional(),
  paymentMethod: z.string().min(1),
  notes: z.string().optional(),
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    role: string;
  };
}

// Get user's cart
export const getCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;

    let cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    companyName: true,
                    isVerified: true,
                    rating: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    // Create cart if it doesn't exist
    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          organizationId,
        },
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      companyName: true,
                      isVerified: true,
                      rating: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    // Group items by vendor
    const itemsByVendor = cart.items.reduce((acc, item) => {
      const vendorId = item.product.vendor.id;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: item.product.vendor,
          items: [],
          subtotal: 0,
        };
      }
      acc[vendorId].items.push(item);
      acc[vendorId].subtotal += item.unitPrice * item.quantity;
      return acc;
    }, {} as Record<string, any>);

    res.json({
      id: cart.id,
      items: cart.items,
      itemsByVendor: Object.values(itemsByVendor),
      summary: {
        itemCount,
        subtotal,
        taxAmount: subtotal * 0.06, // 6% GST
        totalAmount: subtotal * 1.06,
      },
      updatedAt: cart.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
};

// Add item to cart
export const addToCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const validatedData = addCartItemSchema.parse(req.body);

    // Check if product exists and is active
    const product = await prisma.product.findUnique({
      where: {
        id: validatedData.productId,
        organizationId,
        isActive: true,
      },
      include: {
        vendor: {
          select: {
            isActive: true,
          },
        },
      },
    });

    if (!product || !product.vendor.isActive) {
      return res.status(404).json({ error: 'Product not found or unavailable' });
    }

    // Check stock if applicable
    if (product.stockQuantity !== null && product.stockQuantity < validatedData.quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available: product.stockQuantity 
      });
    }

    // Get or create cart
    let cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          organizationId,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: validatedData.productId,
      },
    });

    let cartItem;
    
    if (existingItem) {
      // Update existing item
      const newQuantity = existingItem.quantity + validatedData.quantity;
      
      // Check total stock
      if (product.stockQuantity !== null && product.stockQuantity < newQuantity) {
        return res.status(400).json({ 
          error: 'Insufficient stock for total quantity', 
          available: product.stockQuantity,
          currentInCart: existingItem.quantity,
        });
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          specifications: validatedData.specifications,
          notes: validatedData.notes,
        },
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Create new item
      cartItem = await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: validatedData.productId,
          quantity: validatedData.quantity,
          unitPrice: product.price,
          specifications: validatedData.specifications,
          notes: validatedData.notes,
        },
        include: {
          product: {
            include: {
              vendor: {
                select: {
                  id: true,
                  companyName: true,
                  isVerified: true,
                },
              },
            },
          },
        },
      });
    }

    res.status(201).json(cartItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error adding to cart:', error);
    res.status(500).json({ error: 'Failed to add item to cart' });
  }
};

// Update cart item
export const updateCartItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { id: userId, organizationId } = req.user!;
    const validatedData = updateCartItemSchema.parse(req.body);

    // Check if item exists and belongs to user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
          organizationId,
        },
      },
      include: {
        product: {
          select: {
            stockQuantity: true,
          },
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    // Check stock if applicable
    if (cartItem.product.stockQuantity !== null && cartItem.product.stockQuantity < validatedData.quantity) {
      return res.status(400).json({ 
        error: 'Insufficient stock', 
        available: cartItem.product.stockQuantity 
      });
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: validatedData,
      include: {
        product: {
          include: {
            vendor: {
              select: {
                id: true,
                companyName: true,
                isVerified: true,
              },
            },
          },
        },
      },
    });

    res.json(updatedItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error updating cart item:', error);
    res.status(500).json({ error: 'Failed to update cart item' });
  }
};

// Remove item from cart
export const removeFromCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { id: userId, organizationId } = req.user!;

    // Check if item exists and belongs to user's cart
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        cart: {
          userId,
          organizationId,
        },
      },
    });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found' });
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ error: 'Failed to remove item from cart' });
  }
};

// Clear entire cart
export const clearCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
    });

    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    res.json({ message: 'Cart cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
};

// Checkout cart (convert to orders by vendor)
export const checkoutCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;
    const validatedData = checkoutSchema.parse(req.body);

    // Get cart with items
    const cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: true,
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Group items by vendor
    const itemsByVendor = cart.items.reduce((acc, item) => {
      const vendorId = item.product.vendor.id;
      if (!acc[vendorId]) {
        acc[vendorId] = {
          vendor: item.product.vendor,
          items: [],
        };
      }
      acc[vendorId].items.push(item);
      return acc;
    }, {} as Record<string, any>);

    const orders = [];

    // Create separate order for each vendor
    for (const [vendorId, vendorData] of Object.entries(itemsByVendor)) {
      const { vendor, items } = vendorData as any;
      
      // Calculate totals for this vendor
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0);
      const taxAmount = subtotal * 0.06; // 6% GST
      const totalAmount = subtotal + taxAmount;

      // Generate order number
      const orderCount = await prisma.order.count();
      const orderNumber = `ORD-${new Date().getFullYear()}-${String(orderCount + 1).padStart(6, '0')}`;

      // Create order
      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          organizationId,
          vendorId,
          projectId: req.body.projectId || null,
          subtotal,
          taxAmount,
          totalAmount,
          deliveryAddress: validatedData.deliveryAddress,
          deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
          deliveryInstructions: validatedData.deliveryInstructions,
          paymentMethod: validatedData.paymentMethod,
          notes: validatedData.notes,
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.unitPrice * item.quantity,
              specifications: item.specifications,
              notes: item.notes,
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  category: true,
                  unit: true,
                },
              },
            },
          },
          vendor: {
            select: {
              companyName: true,
              contactName: true,
              email: true,
              phone: true,
            },
          },
        },
      });

      orders.push(order);

      // Create notification for vendor (if they have user accounts)
      await prisma.notification.create({
        data: {
          organizationId,
          recipientId: userId, // For now, notify the buyer
          title: 'Order Placed Successfully',
          message: `Your order ${orderNumber} has been placed with ${vendor.companyName}`,
          type: 'SUCCESS',
          resourceType: 'order',
          resourceId: order.id,
        },
      });
    }

    // Clear cart after successful checkout
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Log audit trail
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'create',
        resource: 'checkout',
        newValues: { orderCount: orders.length, totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0) },
      },
    });

    res.status(201).json({
      message: 'Checkout successful',
      orders,
      summary: {
        orderCount: orders.length,
        totalAmount: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }
    console.error('Error during checkout:', error);
    res.status(500).json({ error: 'Checkout failed' });
  }
};

// Get cart summary
export const getCartSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        items: {
          select: {
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!cart) {
      return res.json({
        itemCount: 0,
        subtotal: 0,
        taxAmount: 0,
        totalAmount: 0,
      });
    }

    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = cart.items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
    const taxAmount = subtotal * 0.06;
    const totalAmount = subtotal + taxAmount;

    res.json({
      itemCount,
      subtotal,
      taxAmount,
      totalAmount,
    });
  } catch (error) {
    console.error('Error fetching cart summary:', error);
    res.status(500).json({ error: 'Failed to fetch cart summary' });
  }
};

// Validate cart before checkout
export const validateCart = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: userId, organizationId } = req.user!;

    const cart = await prisma.cart.findUnique({
      where: {
        userId_organizationId: {
          userId,
          organizationId,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                vendor: {
                  select: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Cart is empty' 
      });
    }

    const issues = [];

    for (const item of cart.items) {
      // Check if product is still active
      if (!item.product.isActive) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Product no longer available',
        });
        continue;
      }

      // Check if vendor is still active
      if (!item.product.vendor.isActive) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Vendor no longer active',
        });
        continue;
      }

      // Check stock availability
      if (item.product.stockQuantity !== null && item.product.stockQuantity < item.quantity) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Insufficient stock',
          available: item.product.stockQuantity,
          requested: item.quantity,
        });
      }

      // Check if price has changed
      if (item.unitPrice !== item.product.price) {
        issues.push({
          itemId: item.id,
          productName: item.product.name,
          issue: 'Price has changed',
          oldPrice: item.unitPrice,
          newPrice: item.product.price,
        });
      }
    }

    res.json({
      valid: issues.length === 0,
      issues,
      itemCount: cart.items.length,
    });
  } catch (error) {
    console.error('Error validating cart:', error);
    res.status(500).json({ error: 'Failed to validate cart' });
  }
};