import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../server';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8),
  username: z.string().min(3).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  organizationId: z.string().uuid().optional(), // Optional organization context
});

const switchOrgSchema = z.object({
  organizationId: z.string().uuid(),
});

// Register new user (without organization)
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        emailVerified: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        createdAt: true,
      },
    });

    // Create basic JWT token (no organization context yet)
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: 'user_only', // Indicates no organization context
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    res.status(201).json({
      message: 'Registration successful',
      user,
      token,
      needsOrganization: true, // Frontend should prompt to create or join org
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login with multi-tenant support
router.post('/login', async (req, res) => {
  console.log('🔐 Login attempt:', { email: req.body.email, organizationId: req.body.organizationId })
  try {
    const data = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                status: true,
              }
            }
          },
          where: { isActive: true }
        },
        systemAdmin: true,
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLogin: new Date(),
        lastActiveAt: new Date(),
      },
    });

    let selectedOrganization = null;
    let organizationRole = null;

    // Handle organization context
    if (user.organizationMemberships.length > 0) {
      // If specific organization requested
      if (data.organizationId) {
        const membership = user.organizationMemberships.find(
          m => m.organizationId === data.organizationId
        );
        if (membership && membership.organization.status === 'ACTIVE') {
          selectedOrganization = membership.organization;
          organizationRole = membership.role;
        } else {
          return res.status(403).json({ error: 'Access denied to organization' });
        }
      } else {
        // Default to first active organization
        const activeMembership = user.organizationMemberships.find(
          m => m.organization.status === 'ACTIVE'
        );
        if (activeMembership) {
          selectedOrganization = activeMembership.organization;
          organizationRole = activeMembership.role;
        }
      }
    }

    // Create token with appropriate context
    const tokenData: any = {
      userId: user.id,
      email: user.email,
      type: selectedOrganization ? 'organization' : 'user_only',
    };

    if (selectedOrganization) {
      tokenData.organizationId = selectedOrganization.id;
      tokenData.organizationRole = organizationRole;
    }

    if (user.systemAdmin) {
      tokenData.systemAdmin = {
        role: user.systemAdmin.role,
        permissions: user.systemAdmin.permissions,
      };
    }

    const token = jwt.sign(tokenData, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Create session
    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        organizationId: selectedOrganization?.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Response structure
    const response: any = {
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
      },
      token,
    };

    if (selectedOrganization) {
      response.organization = selectedOrganization;
      response.role = organizationRole;
    }

    if (user.systemAdmin) {
      response.systemAdmin = {
        role: user.systemAdmin.role,
        permissions: user.systemAdmin.permissions,
      };
    }

    // Include available organizations for switching
    response.availableOrganizations = user.organizationMemberships
      .filter(m => m.organization.status === 'ACTIVE')
      .map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logo: m.organization.logo,
        role: m.role,
      }));

    console.log('✅ Login successful for:', user.email, 'Organization:', selectedOrganization?.name || 'None')
    res.json(response);

  } catch (error) {
    console.error('❌ Login error:', error);
    if (error instanceof z.ZodError) {
      console.log('   📝 Validation error details:', error.errors);
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Switch organization context
router.post('/switch-organization', async (req, res) => {
  try {
    const data = switchOrgSchema.parse(req.body);
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Check if user has access to the organization
    const membership = await prisma.organizationMember.findUnique({
      where: {
        userId_organizationId: {
          userId: decoded.userId,
          organizationId: data.organizationId,
        }
      },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            status: true,
          }
        },
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    if (!membership || !membership.isActive || membership.organization.status !== 'ACTIVE') {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    // Create new token with organization context
    const newTokenData = {
      userId: decoded.userId,
      email: decoded.email,
      type: 'organization',
      organizationId: membership.organization.id,
      organizationRole: membership.role,
    };

    if (decoded.systemAdmin) {
      newTokenData.systemAdmin = decoded.systemAdmin;
    }

    const newToken = jwt.sign(newTokenData, process.env.JWT_SECRET!, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    // Update session
    await prisma.session.updateMany({
      where: { token },
      data: {
        token: newToken,
        organizationId: membership.organization.id,
      }
    });

    res.json({
      message: 'Organization switched successfully',
      token: newToken,
      organization: membership.organization,
      role: membership.role,
      user: membership.user,
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Switch organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user info with organization context
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        organizationMemberships: {
          include: {
            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                status: true,
              }
            }
          },
          where: { isActive: true }
        },
        systemAdmin: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response: any = {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        lastLogin: user.lastLogin,
        lastActiveAt: user.lastActiveAt,
      },
    };

    // Add current organization context if available
    if (decoded.organizationId) {
      const currentMembership = user.organizationMemberships.find(
        m => m.organizationId === decoded.organizationId
      );
      if (currentMembership) {
        response.organization = currentMembership.organization;
        response.role = currentMembership.role;
      }
    }

    if (user.systemAdmin) {
      response.systemAdmin = {
        role: user.systemAdmin.role,
        permissions: user.systemAdmin.permissions,
      };
    }

    // Include available organizations
    response.availableOrganizations = user.organizationMemberships
      .filter(m => m.organization.status === 'ACTIVE')
      .map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        logo: m.organization.logo,
        role: m.role,
      }));

    res.json(response);

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      
      // Delete session
      await prisma.session.deleteMany({
        where: { token },
      });
    }

    res.json({ message: 'Logout successful' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;