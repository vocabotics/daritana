import { Router } from 'express';

const router = Router();

// Mock settings data
const defaultSettings = {
  language: 'en',
  timezone: 'Asia/Kuala_Lumpur',
  currency: 'MYR',
  dateFormat: 'dd/mm/yyyy',
  theme: 'light',
  emailNotifications: true,
  pushNotifications: true,
  smsNotifications: false,
  projectUpdates: true,
  taskAssignments: true,
  meetingReminders: true,
  twoFactorAuth: false,
  allowTeamInvitations: true,
  requireApproval: false,
  shareProjectVisibility: true,
  userId: 'user_1',
  email: 'admin@test.com',
  name: 'Admin User',
  organizationSettings: {
    companyName: 'Daritana Architecture',
    industry: 'Architecture & Design',
    size: '50-100',
    country: 'Malaysia'
  }
};

// Get user settings
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: defaultSettings
  });
});

// Update user settings
router.put('/', (req, res) => {
  const updatedSettings = {
    ...defaultSettings,
    ...req.body
  };
  
  res.json({
    success: true,
    message: 'Settings updated successfully',
    settings: updatedSettings
  });
});

// Get preferences with available options
router.get('/preferences', (req, res) => {
  res.json({
    success: true,
    data: {
      regional: {
        language: {
          current: 'en',
          available: ['en', 'ms', 'zh']
        },
        timezone: {
          current: 'Asia/Kuala_Lumpur',
          available: [
            { value: 'Asia/Kuala_Lumpur', label: 'Kuala Lumpur (GMT+8)' },
            { value: 'Asia/Singapore', label: 'Singapore (GMT+8)' },
            { value: 'Asia/Jakarta', label: 'Jakarta (GMT+7)' },
            { value: 'Asia/Bangkok', label: 'Bangkok (GMT+7)' }
          ]
        },
        currency: {
          current: 'MYR',
          available: [
            { value: 'MYR', label: 'Malaysian Ringgit', symbol: 'RM' },
            { value: 'SGD', label: 'Singapore Dollar', symbol: 'S$' },
            { value: 'USD', label: 'US Dollar', symbol: '$' },
            { value: 'EUR', label: 'Euro', symbol: '€' }
          ]
        },
        dateFormat: {
          current: 'dd/mm/yyyy',
          available: [
            { value: 'dd/mm/yyyy', label: 'DD/MM/YYYY', example: '31/12/2024' },
            { value: 'mm/dd/yyyy', label: 'MM/DD/YYYY', example: '12/31/2024' },
            { value: 'yyyy-mm-dd', label: 'YYYY-MM-DD', example: '2024-12-31' }
          ]
        }
      },
      appearance: {
        theme: {
          current: 'light',
          available: [
            { value: 'light', label: 'Light', icon: 'sun' },
            { value: 'dark', label: 'Dark', icon: 'moon' },
            { value: 'auto', label: 'Auto', icon: 'computer' }
          ]
        }
      },
      notifications: {
        email: true,
        push: true,
        sms: false
      }
    }
  });
});

// Update preference category
router.put('/preferences/:category', (req, res) => {
  const { category } = req.params;
  const preferences = req.body;
  
  res.json({
    success: true,
    message: `${category} preferences updated successfully`,
    updated: preferences
  });
});

// Reset settings to defaults
router.post('/reset', (req, res) => {
  res.json({
    success: true,
    message: 'Settings reset to defaults',
    settings: defaultSettings
  });
});

export default router;