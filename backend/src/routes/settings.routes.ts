import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateMultiTenant } from '../middleware/multi-tenant-auth';

const router = Router();
const prisma = new PrismaClient();

// Extended Request type with auth context
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    organizationId?: string;
    role?: string;
  };
}

// Get user settings
router.get('/', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get user with their preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        language: true,
        timezone: true,
        currency: true,
        dateFormat: true,
        theme: true,
        emailNotifications: true,
        smsNotifications: true,
        pushNotifications: true,
        twoFactorEnabled: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get additional settings if user belongs to an organization
    let organizationSettings = null;
    if (req.user?.organizationId) {
      const orgMember = await prisma.organizationMember.findUnique({
        where: {
          userId_organizationId: {
            userId: userId,
            organizationId: req.user.organizationId
          }
        },
        include: {
          organization: {
            select: {
              name: true,
              timezone: true,
              currency: true,
              language: true,
              dateFormat: true,
            }
          }
        }
      });
      
      if (orgMember) {
        organizationSettings = orgMember.organization;
      }
    }

    // Construct settings response with defaults
    const settings = {
      // User preferences (with defaults)
      language: user.language || organizationSettings?.language || 'en',
      timezone: user.timezone || organizationSettings?.timezone || 'Asia/Kuala_Lumpur',
      currency: user.currency || organizationSettings?.currency || 'MYR',
      dateFormat: user.dateFormat || organizationSettings?.dateFormat || 'dd/mm/yyyy',
      theme: user.theme || 'light',
      
      // Notification preferences
      emailNotifications: user.emailNotifications ?? true,
      pushNotifications: user.pushNotifications ?? true,
      smsNotifications: user.smsNotifications ?? false,
      projectUpdates: true, // These will be stored in a separate table later
      taskAssignments: true,
      meetingReminders: true,
      
      // Security
      twoFactorAuth: user.twoFactorEnabled || false,
      
      // Team settings (organization-level, stored separately)
      allowTeamInvitations: true,
      requireApproval: true,
      shareProjectVisibility: false,
      
      // User info
      userId: user.id,
      email: user.email,
      name: user.name || `${user.firstName} ${user.lastName}`,
      organizationSettings: organizationSettings
    };

    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// Update preferences by category
router.put('/preferences/:category', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { category } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Validate category
    const validCategories = ['general', 'notifications', 'security', 'team'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid preference category' });
    }
    
    let updateData: any = {};
    
    switch (category) {
      case 'general':
        const { language, timezone, currency, dateFormat, theme } = req.body;
        updateData = {
          language,
          timezone,
          currency,
          dateFormat,
          theme
        };
        break;
        
      case 'notifications':
        const { emailNotifications, pushNotifications, smsNotifications } = req.body;
        updateData = {
          emailNotifications,
          pushNotifications,
          smsNotifications
        };
        break;
        
      case 'security':
        const { twoFactorAuth } = req.body;
        updateData = {
          twoFactorEnabled: twoFactorAuth
        };
        break;
        
      default:
        return res.status(400).json({ error: 'Category not implemented' });
    }
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        language: true,
        timezone: true,
        currency: true,
        dateFormat: true,
        theme: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        twoFactorEnabled: true
      }
    });
    
    res.json({
      message: `${category} preferences updated successfully`,
      preferences: updatedUser
    });
    
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Update user settings
router.put('/', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      language,
      timezone,
      currency,
      dateFormat,
      theme,
      emailNotifications,
      pushNotifications,
      smsNotifications,
      projectUpdates,
      taskAssignments,
      meetingReminders,
      twoFactorAuth,
      allowTeamInvitations,
      requireApproval,
      shareProjectVisibility
    } = req.body;

    // Update user preferences
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        language: language,
        timezone: timezone,
        currency: currency,
        dateFormat: dateFormat,
        theme: theme,
        emailNotifications: emailNotifications,
        pushNotifications: pushNotifications,
        smsNotifications: smsNotifications,
        twoFactorEnabled: twoFactorAuth,
      },
      select: {
        id: true,
        email: true,
        language: true,
        timezone: true,
        currency: true,
        dateFormat: true,
        theme: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
        twoFactorEnabled: true,
      }
    });

    // TODO: Store additional notification preferences (projectUpdates, taskAssignments, etc.)
    // in a separate UserNotificationPreferences table

    // TODO: Store team settings at organization level if user has proper permissions

    res.json({
      message: 'Settings updated successfully',
      settings: {
        language: updatedUser.language,
        timezone: updatedUser.timezone,
        currency: updatedUser.currency,
        dateFormat: updatedUser.dateFormat,
        theme: updatedUser.theme,
        emailNotifications: updatedUser.emailNotifications,
        pushNotifications: updatedUser.pushNotifications,
        smsNotifications: updatedUser.smsNotifications,
        twoFactorAuth: updatedUser.twoFactorEnabled,
        // Return the other settings as-is for now
        projectUpdates,
        taskAssignments,
        meetingReminders,
        allowTeamInvitations,
        requireApproval,
        shareProjectVisibility
      }
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Get user preferences (more detailed)
router.get('/preferences', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        language: true,
        timezone: true,
        currency: true,
        dateFormat: true,
        theme: true,
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return detailed preferences with available options
    const preferences = {
      regional: {
        language: {
          current: user.language || 'en',
          available: ['en', 'ms', 'zh', 'ta', 'hi']
        },
        timezone: {
          current: user.timezone || 'Asia/Kuala_Lumpur',
          available: [
            { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (GMT+8)' },
            { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
            { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
            { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' },
            { value: 'Asia/Manila', label: 'Manila (GMT+8)' },
            { value: 'Asia/Hong_Kong', label: 'Hong Kong (GMT+8)' },
          ]
        },
        currency: {
          current: user.currency || 'MYR',
          available: [
            { value: 'MYR', label: 'Malaysian Ringgit (RM)', symbol: 'RM' },
            { value: 'SGD', label: 'Singapore Dollar (S$)', symbol: 'S$' },
            { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
            { value: 'EUR', label: 'Euro (€)', symbol: '€' },
            { value: 'GBP', label: 'British Pound (£)', symbol: '£' },
          ]
        },
        dateFormat: {
          current: user.dateFormat || 'dd/mm/yyyy',
          available: [
            { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '31/12/2024' },
            { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '12/31/2024' },
            { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2024-12-31' },
            { value: 'dd.mm.yyyy', label: 'DD.MM.YYYY', example: '31.12.2024' },
          ]
        }
      },
      appearance: {
        theme: {
          current: user.theme || 'light',
          available: [
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
            { value: 'auto', label: 'System', icon: 'monitor' }
          ]
        }
      },
      notifications: {
        email: user.emailNotifications ?? true,
        push: user.pushNotifications ?? true,
        sms: user.smsNotifications ?? false,
      }
    };

    res.json(preferences);
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({ error: 'Failed to fetch preferences' });
  }
});

// Update specific preference category
router.put('/preferences/:category', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { category } = req.params;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let updateData: any = {};

    switch (category) {
      case 'regional':
        const { language, timezone, currency, dateFormat } = req.body;
        updateData = {
          ...(language && { language }),
          ...(timezone && { timezone }),
          ...(currency && { currency }),
          ...(dateFormat && { dateFormat })
        };
        break;
      
      case 'appearance':
        const { theme } = req.body;
        updateData = {
          ...(theme && { theme })
        };
        break;
      
      case 'notifications':
        const { email, push, sms } = req.body;
        updateData = {
          ...(email !== undefined && { emailNotifications: email }),
          ...(push !== undefined && { pushNotifications: push }),
          ...(sms !== undefined && { smsNotifications: sms })
        };
        break;
      
      default:
        return res.status(400).json({ error: 'Invalid preference category' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData
    });

    res.json({
      message: `${category} preferences updated successfully`,
      updated: updateData
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// Reset settings to defaults
router.post('/reset', authenticateMultiTenant, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Reset to default values
    const defaultSettings = {
      language: 'en',
      timezone: 'Asia/Kuala_Lumpur',
      currency: 'MYR',
      dateFormat: 'dd/mm/yyyy',
      theme: 'light',
      emailNotifications: true,
      pushNotifications: true,
      smsNotifications: false,
      twoFactorEnabled: false,
    };

    await prisma.user.update({
      where: { id: userId },
      data: defaultSettings
    });

    res.json({
      message: 'Settings reset to defaults',
      settings: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({ error: 'Failed to reset settings' });
  }
});

export default router;