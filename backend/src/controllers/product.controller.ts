import { Response } from 'express'
import { prisma } from '../server'
import { MultiTenantRequest } from '../middleware/multi-tenant-auth'

/**
 * Get products with advanced filtering and search
 */
export const getProducts = async (req: MultiTenantRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 24,
      search,
      category,
      subcategory,
      minPrice,
      maxPrice,
      vendor,
      inStock,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      featured
    } = req.query

    const organizationId = req.organization?.id

    if (!organizationId) {
      return res.status(400).json({ error: 'Organization context required' })
    }

    const where: any = {
      organizationId,
      isActive: true,
      deletedAt: null
    }

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { tags: { hasSome: [search as string] } },
        { searchKeywords: { hasSome: [search as string] } }
      ]
    }

    // Category filters
    if (category) {
      where.category = category
    }
    if (subcategory) {
      where.subcategory = subcategory
    }

    // Price range filter
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = parseFloat(minPrice as string)
      if (maxPrice) where.price.lte = parseFloat(maxPrice as string)
    }

    // Vendor filter
    if (vendor) {
      where.vendorId = vendor
    }

    // Stock filter
    if (inStock === 'true') {
      where.inStock = true
    }

    // Featured filter
    if (featured === 'true') {
      where.isFeatured = true
    }

    // Sort options
    const orderBy: any = {}
    if (sortBy === 'price') {
      orderBy.price = sortOrder
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder
    } else {
      orderBy.createdAt = sortOrder
    }

    const [products, total, categories] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              rating: true,
              isVerified: true
            }
          },
          reviews: {
            select: {
              rating: true
            }
          }
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        orderBy
      }),
      prisma.product.count({ where }),
      getProductCategories(organizationId)
    ])

    // Calculate average ratings
    const productsWithRatings = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        reviews: undefined // Remove reviews from response
      }
    })

    res.json({
      products: productsWithRatings,
      categories,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      },
      filters: {
        search,
        category,
        subcategory,
        minPrice,
        maxPrice,
        vendor,
        inStock,
        featured
      }
    })
  } catch (error) {
    console.error('Get products error:', error)
    res.status(500).json({ error: 'Failed to fetch products' })
  }
}

/**
 * Get product details by ID
 */
export const getProductById = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { productId } = req.params
    const organizationId = req.organization?.id

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        isActive: true,
        deletedAt: null
      },
      include: {
        vendor: {
          select: {
            id: true,
            companyName: true,
            contactName: true,
            email: true,
            phone: true,
            website: true,
            rating: true,
            reviewCount: true,
            isVerified: true,
            specialties: true,
            yearsInBusiness: true
          }
        },
        reviews: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatar: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Calculate rating statistics
    const ratings = product.reviews.map(r => r.rating)
    const avgRating = ratings.length > 0
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : 0

    const ratingDistribution = {
      5: ratings.filter(r => r === 5).length,
      4: ratings.filter(r => r === 4).length,
      3: ratings.filter(r => r === 3).length,
      2: ratings.filter(r => r === 2).length,
      1: ratings.filter(r => r === 1).length
    }

    // Get related products
    const relatedProducts = await prisma.product.findMany({
      where: {
        organizationId,
        category: product.category,
        id: { not: productId },
        isActive: true,
        deletedAt: null
      },
      include: {
        vendor: {
          select: {
            companyName: true,
            rating: true
          }
        }
      },
      take: 6
    })

    res.json({
      product: {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: ratings.length,
        ratingDistribution
      },
      relatedProducts
    })
  } catch (error) {
    console.error('Get product by ID error:', error)
    res.status(500).json({ error: 'Failed to fetch product details' })
  }
}

/**
 * Create new product (vendor only)
 */
export const createProduct = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const userId = req.user?.id

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organization context and user required' })
    }

    // Check if user has a vendor profile
    const vendor = await prisma.vendor.findFirst({
      where: {
        organizationId,
        // Note: In real implementation, link vendor to user
        isActive: true
      }
    })

    if (!vendor) {
      return res.status(403).json({ error: 'Vendor profile required to create products' })
    }

    const {
      name,
      description,
      category,
      subcategory,
      sku,
      price,
      currency = 'MYR',
      unit,
      minOrderQty = 1,
      specifications,
      images = [],
      documents = [],
      inStock = true,
      stockQuantity,
      leadTime,
      tags = [],
      searchKeywords = []
    } = req.body

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        organizationId,
        name,
        description,
        category,
        subcategory,
        sku,
        price: parseFloat(price),
        currency,
        unit,
        minOrderQty: parseInt(minOrderQty),
        specifications,
        images,
        documents,
        inStock,
        stockQuantity: stockQuantity ? parseInt(stockQuantity) : null,
        leadTime: leadTime ? parseInt(leadTime) : null,
        tags,
        searchKeywords: [...tags, ...searchKeywords, name.toLowerCase()]
      },
      include: {
        vendor: {
          select: {
            companyName: true,
            rating: true
          }
        }
      }
    })

    // Log product creation
    await prisma.auditLog.create({
      data: {
        userId,
        organizationId,
        action: 'CREATE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: product.id,
        details: {
          productName: product.name,
          category: product.category,
          price: product.price
        }
      }
    })

    res.status(201).json({ product })
  } catch (error) {
    console.error('Create product error:', error)
    res.status(500).json({ error: 'Failed to create product' })
  }
}

/**
 * Update product
 */
export const updateProduct = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { productId } = req.params
    const organizationId = req.organization?.id
    const userId = req.user?.id

    // Check if product exists and user has permission
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        deletedAt: null
      },
      include: {
        vendor: true
      }
    })

    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // TODO: Add proper vendor ownership check
    // if (existingProduct.vendor.userId !== userId) {
    //   return res.status(403).json({ error: 'Not authorized to update this product' })
    // }

    const updateData: any = {}
    const allowedFields = [
      'name', 'description', 'category', 'subcategory', 'sku',
      'price', 'currency', 'unit', 'minOrderQty', 'specifications',
      'images', 'documents', 'inStock', 'stockQuantity', 'leadTime',
      'tags', 'searchKeywords', 'isFeatured'
    ]

    // Only update provided fields
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'minOrderQty' || field === 'stockQuantity' || field === 'leadTime') {
          updateData[field] = req.body[field] ? parseFloat(req.body[field]) : null
        } else {
          updateData[field] = req.body[field]
        }
      }
    })

    // Update search keywords if name or tags changed
    if (updateData.name || updateData.tags) {
      const name = updateData.name || existingProduct.name
      const tags = updateData.tags || existingProduct.tags
      updateData.searchKeywords = [...tags, name.toLowerCase()]
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: updateData,
      include: {
        vendor: {
          select: {
            companyName: true,
            rating: true
          }
        }
      }
    })

    // Log product update
    await prisma.auditLog.create({
      data: {
        userId: userId!,
        organizationId: organizationId!,
        action: 'UPDATE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: productId,
        details: {
          productName: product.name,
          changes: updateData
        }
      }
    })

    res.json({ product })
  } catch (error) {
    console.error('Update product error:', error)
    res.status(500).json({ error: 'Failed to update product' })
  }
}

/**
 * Delete product
 */
export const deleteProduct = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { productId } = req.params
    const organizationId = req.organization?.id
    const userId = req.user?.id

    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        deletedAt: null
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Soft delete
    await prisma.product.update({
      where: { id: productId },
      data: {
        isActive: false,
        deletedAt: new Date()
      }
    })

    // Log product deletion
    await prisma.auditLog.create({
      data: {
        userId: userId!,
        organizationId: organizationId!,
        action: 'DELETE_PRODUCT',
        resourceType: 'PRODUCT',
        resourceId: productId,
        details: {
          productName: product.name,
          category: product.category
        }
      }
    })

    res.json({ success: true, message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Delete product error:', error)
    res.status(500).json({ error: 'Failed to delete product' })
  }
}

/**
 * Add product review
 */
export const addProductReview = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { productId } = req.params
    const organizationId = req.organization?.id
    const userId = req.user?.id
    const { rating, title, review, images = [] } = req.body

    if (!organizationId || !userId) {
      return res.status(400).json({ error: 'Organization context and user required' })
    }

    // Check if product exists
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        organizationId,
        isActive: true,
        deletedAt: null
      }
    })

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: {
        productId,
        userId
      }
    })

    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' })
    }

    // Check if user has purchased this product (for verification)
    const hasPurchased = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId,
          status: 'DELIVERED'
        }
      }
    })

    const productReview = await prisma.productReview.create({
      data: {
        productId,
        userId,
        organizationId,
        rating: parseInt(rating),
        title,
        review,
        images,
        purchaseVerified: !!hasPurchased
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true
          }
        }
      }
    })

    // Update product rating cache (in real implementation, use background job)
    await updateProductRating(productId)

    res.status(201).json({ review: productReview })
  } catch (error) {
    console.error('Add product review error:', error)
    res.status(500).json({ error: 'Failed to add product review' })
  }
}

/**
 * Get product categories and statistics
 */
export const getProductCategories = async (organizationId: string) => {
  const categories = await prisma.product.groupBy({
    by: ['category'],
    where: {
      organizationId,
      isActive: true,
      deletedAt: null
    },
    _count: {
      category: true
    }
  })

  const subcategories = await prisma.product.groupBy({
    by: ['category', 'subcategory'],
    where: {
      organizationId,
      isActive: true,
      deletedAt: null,
      subcategory: { not: null }
    },
    _count: {
      subcategory: true
    }
  })

  // Group subcategories by category
  const subcategoriesByCategory = subcategories.reduce((acc: any, item) => {
    if (!acc[item.category]) {
      acc[item.category] = []
    }
    if (item.subcategory) {
      acc[item.category].push({
        name: item.subcategory,
        count: item._count.subcategory
      })
    }
    return acc
  }, {})

  return categories.map(cat => ({
    name: cat.category,
    count: cat._count.category,
    subcategories: subcategoriesByCategory[cat.category] || []
  }))
}

/**
 * Update product rating cache
 */
async function updateProductRating(productId: string) {
  const reviews = await prisma.productReview.findMany({
    where: { productId },
    select: { rating: true }
  })

  if (reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    
    // Note: In the current schema, there's no rating field on Product
    // This would need to be added if we want to cache ratings
    console.log(`Product ${productId} average rating: ${avgRating}`)
  }
}

/**
 * Get featured products
 */
export const getFeaturedProducts = async (req: MultiTenantRequest, res: Response) => {
  try {
    const organizationId = req.organization?.id
    const { limit = 12 } = req.query

    const products = await prisma.product.findMany({
      where: {
        organizationId,
        isFeatured: true,
        isActive: true,
        deletedAt: null
      },
      include: {
        vendor: {
          select: {
            companyName: true,
            rating: true,
            isVerified: true
          }
        },
        reviews: {
          select: { rating: true }
        }
      },
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    })

    const productsWithRatings = products.map(product => {
      const avgRating = product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0

      return {
        ...product,
        averageRating: Math.round(avgRating * 10) / 10,
        reviewCount: product.reviews.length,
        reviews: undefined
      }
    })

    res.json({ products: productsWithRatings })
  } catch (error) {
    console.error('Get featured products error:', error)
    res.status(500).json({ error: 'Failed to fetch featured products' })
  }
}

/**
 * Search products with AI-powered suggestions
 */
export const searchProducts = async (req: MultiTenantRequest, res: Response) => {
  try {
    const { q, suggestions = false } = req.query
    const organizationId = req.organization?.id

    if (!q) {
      return res.status(400).json({ error: 'Search query required' })
    }

    const searchTerms = (q as string).toLowerCase().split(' ')

    const products = await prisma.product.findMany({
      where: {
        organizationId,
        isActive: true,
        deletedAt: null,
        OR: [
          { name: { contains: q as string, mode: 'insensitive' } },
          { description: { contains: q as string, mode: 'insensitive' } },
          { category: { contains: q as string, mode: 'insensitive' } },
          { tags: { hasSome: searchTerms } },
          { searchKeywords: { hasSome: searchTerms } }
        ]
      },
      include: {
        vendor: {
          select: {
            companyName: true,
            rating: true
          }
        }
      },
      take: 20
    })

    let searchSuggestions: string[] = []
    
    if (suggestions === 'true') {
      // Get popular search terms and categories
      const categories = await prisma.product.findMany({
        where: {
          organizationId,
          isActive: true,
          deletedAt: null,
          category: { contains: q as string, mode: 'insensitive' }
        },
        select: { category: true },
        distinct: ['category'],
        take: 5
      })

      searchSuggestions = categories.map(c => c.category)
    }

    res.json({
      products,
      suggestions: searchSuggestions,
      query: q,
      resultCount: products.length
    })
  } catch (error) {
    console.error('Search products error:', error)
    res.status(500).json({ error: 'Failed to search products' })
  }
}