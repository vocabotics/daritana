import { Router } from 'express';
import { prisma } from '../server';
import { authenticate } from '../middleware/auth';

const router = Router();

// Get all products
router.get('/products', authenticate, async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;
    
    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } }
      ];
    }
    
    // Mock products for now
    const products = [
      {
        id: '1',
        name: 'Premium Marble Tiles',
        category: 'Materials',
        price: 250,
        unit: 'sq.m',
        vendor: 'ABC Supplies',
        rating: 4.5,
        inStock: true,
        image: '/placeholder.jpg'
      },
      {
        id: '2',
        name: 'LED Ceiling Lights',
        category: 'Lighting',
        price: 180,
        unit: 'piece',
        vendor: 'LightTech',
        rating: 4.8,
        inStock: true,
        image: '/placeholder.jpg'
      }
    ];
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by ID
router.get('/products/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mock product details
    const product = {
      id,
      name: 'Premium Marble Tiles',
      category: 'Materials',
      price: 250,
      unit: 'sq.m',
      vendor: {
        id: 'v1',
        name: 'ABC Supplies',
        rating: 4.5,
        verified: true
      },
      description: 'High-quality imported marble tiles',
      specifications: {
        size: '60x60cm',
        thickness: '12mm',
        finish: 'Polished'
      },
      rating: 4.5,
      reviews: 23,
      inStock: true,
      minOrder: 10,
      deliveryTime: '3-5 days',
      images: ['/placeholder.jpg']
    };
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get vendors
router.get('/vendors', authenticate, async (req, res) => {
  try {
    // Mock vendors
    const vendors = [
      {
        id: 'v1',
        name: 'ABC Supplies',
        category: 'Materials',
        rating: 4.5,
        verified: true,
        products: 156,
        responseTime: '< 2 hours'
      },
      {
        id: 'v2',
        name: 'LightTech Solutions',
        category: 'Lighting',
        rating: 4.8,
        verified: true,
        products: 89,
        responseTime: '< 1 hour'
      }
    ];
    
    res.json(vendors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get quotes
router.get('/quotes', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    const quotes = await prisma.quote.findMany({
      where: { 
        organizationId
      },
      include: {
        user: true,
        vendor: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(quotes);
  } catch (error) {
    console.error('Get quotes error:', error);
    res.status(500).json({ error: 'Failed to fetch quotes' });
  }
});

// Create quote request
router.post('/quotes', authenticate, async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user!;
    const { vendorId, items = [], validUntil, notes } = req.body;
    
    // Generate quote number
    const quoteCount = await prisma.quote.count({ where: { organizationId } });
    const quoteNumber = `Q-${new Date().getFullYear()}-${String(quoteCount + 1).padStart(4, '0')}`;
    
    const totalAmount = items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0);
    
    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        userId,
        organizationId,
        vendorId,
        totalAmount,
        status: 'DRAFT',
        validUntil: validUntil ? new Date(validUntil) : undefined,
        notes
      },
      include: {
        user: true,
        vendor: true
      }
    });
    
    res.json(quote);
  } catch (error) {
    console.error('Create quote error:', error);
    res.status(500).json({ error: 'Failed to create quote request' });
  }
});

// Get orders
router.get('/orders', authenticate, async (req, res) => {
  try {
    const { organizationId } = req.user!;
    
    // Mock orders
    const orders = [
      {
        id: 'o1',
        orderNumber: 'ORD-2024-001',
        vendor: 'ABC Supplies',
        items: 3,
        total: 12500,
        status: 'delivered',
        date: new Date().toISOString()
      },
      {
        id: 'o2',
        orderNumber: 'ORD-2024-002',
        vendor: 'LightTech',
        items: 5,
        total: 8900,
        status: 'processing',
        date: new Date().toISOString()
      }
    ];
    
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Create order
router.post('/orders', authenticate, async (req, res) => {
  try {
    const { items, vendorId, projectId, deliveryAddress } = req.body;
    
    const order = {
      id: `o${Date.now()}`,
      orderNumber: `ORD-2024-${Date.now()}`,
      items,
      vendor: vendorId,
      project: projectId,
      total: items.reduce((sum: number, item: any) => sum + (item.quantity * item.price), 0),
      status: 'pending',
      deliveryAddress,
      createdAt: new Date().toISOString()
    };
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Get cart
router.get('/cart', authenticate, async (req, res) => {
  try {
    const { id: userId } = req.user!;
    
    // Return empty cart for now
    res.json({ items: [] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// Add to cart
router.post('/cart', authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    
    res.json({ 
      success: true,
      message: 'Item added to cart'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// Update cart item
router.put('/cart/:itemId', authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    
    res.json({ 
      success: true,
      message: 'Cart updated'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cart' });
  }
});

// Remove from cart
router.delete('/cart/:itemId', authenticate, async (req, res) => {
  try {
    res.json({ 
      success: true,
      message: 'Item removed from cart'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

export default router;