import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LanguageSettings } from '@/components/ui/language-switcher';
import { useAuthStore } from '@/store/authStore';
import { useSettingsStore } from '@/store/settingsStore';
import { settingsService } from '@/services/settings.service';
import { toast } from 'sonner';
import { 
  Bell, Globe, Palette, Shield, CreditCard, Users, 
  Key, Mail, Smartphone, Monitor, Moon, Sun, Settings as SettingsIcon, Loader2
} from 'lucide-react';

function SettingsPage() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { settings, updateSettings } = useSettingsStore();
  
  // Local state for form inputs
  const [localSettings, setLocalSettings] = useState(settings);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setInitialLoading(true);
        const backendSettings = await settingsService.loadAndSyncSettings();
        updateSettings(backendSettings);
        setLocalSettings(backendSettings);
        
        // Apply theme
        settingsService.applyTheme(backendSettings.theme);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Use local settings as fallback
      } finally {
        setInitialLoading(false);
      }
    };

    loadSettings();
  }, [updateSettings]);

  const handleSaveSettings = async (section: string, updates?: any) => {
    try {
      setLoading(true);
      
      const settingsToSave = updates || localSettings;
      
      // Save to backend
      const success = await settingsService.saveSettings(settingsToSave);
      
      if (success) {
        // Update local store
        updateSettings(settingsToSave);
        setLocalSettings({ ...localSettings, ...settingsToSave });
        
        // Apply theme if changed
        if (settingsToSave.theme) {
          settingsService.applyTheme(settingsToSave.theme);
        }
        
        toast.success(t('success.settingsUpdated') || `${section} settings saved successfully`);
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handlePasswordChange = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    // In production, this would call an API
    toast.success('Password updated successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const [activeTab, setActiveTab] = useState('general');

  // Show loading state
  if (initialLoading) {
    return (
      <Layout contextualInfo={false} fullHeight={true}>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8 bg-transparent border-0 p-0">
          <TabsTrigger value="general" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <SettingsIcon className="h-4 w-4 mr-2" />
            {t('settings.general')}
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="h-4 w-4 mr-2" />
            {t('settings.notifications')}
          </TabsTrigger>
          <TabsTrigger value="security" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield className="h-4 w-4 mr-2" />
            {t('settings.security')}
          </TabsTrigger>
          <TabsTrigger value="billing" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard className="h-4 w-4 mr-2" />
            {t('settings.billing')}
          </TabsTrigger>
          <TabsTrigger value="team" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            {t('navigation.team')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">

          <TabsContent value="general" className="space-y-4">
            {/* Language Settings */}
            <LanguageSettings />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  {t('settings.preferences')}
                </CardTitle>
                <CardDescription>
                  {t('settings.timezone')}, {t('settings.currency')}, and {t('settings.dateFormat')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">{t('settings.timezone')}</Label>
                    <Select value={localSettings.timezone} onValueChange={(value) => setLocalSettings({...localSettings, timezone: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (GMT+8)</SelectItem>
                        <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                        <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                        <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="currency">{t('settings.currency')}</Label>
                    <Select value={localSettings.currency} onValueChange={(value) => setLocalSettings({...localSettings, currency: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MYR">{t('currency.myr')} (RM)</SelectItem>
                        <SelectItem value="SGD">{t('currency.sgd')} (S$)</SelectItem>
                        <SelectItem value="USD">{t('currency.usd')} ($)</SelectItem>
                        <SelectItem value="EUR">{t('currency.eur')} (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateFormat">{t('settings.dateFormat')}</Label>
                    <Select value={localSettings.dateFormat} onValueChange={(value) => setLocalSettings({...localSettings, dateFormat: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dd/mm/yyyy">DD/MM/YYYY</SelectItem>
                        <SelectItem value="mm/dd/yyyy">MM/DD/YYYY</SelectItem>
                        <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSaveSettings('Regional', {
                    timezone: localSettings.timezone,
                    currency: localSettings.currency,
                    dateFormat: localSettings.dateFormat
                  })}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('common.save')} {t('settings.preferences')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('settings.appearance')}
                </CardTitle>
                <CardDescription>
                  {t('settings.theme')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>{t('settings.theme')}</Label>
                    <p className="text-sm text-gray-500">{t('settings.appearance')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={localSettings.theme === 'light' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocalSettings({...localSettings, theme: 'light'})}
                    >
                      <Sun className="h-4 w-4 mr-1" />
                      {t('common.light') || 'Light'}
                    </Button>
                    <Button
                      variant={localSettings.theme === 'dark' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocalSettings({...localSettings, theme: 'dark'})}
                    >
                      <Moon className="h-4 w-4 mr-1" />
                      {t('common.dark') || 'Dark'}
                    </Button>
                    <Button
                      variant={localSettings.theme === 'auto' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setLocalSettings({...localSettings, theme: 'auto'})}
                    >
                      <Monitor className="h-4 w-4 mr-1" />
                      {t('common.auto') || 'Auto'}
                    </Button>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleSaveSettings('Appearance', { theme: localSettings.theme })}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {t('common.save')} {t('settings.appearance')}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Control how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-gray-500">Receive updates via email</p>
                  </div>
                  <Switch
                    checked={localSettings.emailNotifications}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, emailNotifications: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-gray-500">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={localSettings.pushNotifications}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, pushNotifications: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Project Updates</Label>
                    <p className="text-sm text-gray-500">Notifications for project changes</p>
                  </div>
                  <Switch 
                    checked={localSettings.projectUpdates}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, projectUpdates: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Task Assignments</Label>
                    <p className="text-sm text-gray-500">When tasks are assigned to you</p>
                  </div>
                  <Switch 
                    checked={localSettings.taskAssignments}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, taskAssignments: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Meeting Reminders</Label>
                    <p className="text-sm text-gray-500">15 minutes before meetings</p>
                  </div>
                  <Switch 
                    checked={localSettings.meetingReminders}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, meetingReminders: checked})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveSettings('Notification', {
                    emailNotifications: localSettings.emailNotifications,
                    pushNotifications: localSettings.pushNotifications,
                    projectUpdates: localSettings.projectUpdates,
                    taskAssignments: localSettings.taskAssignments,
                    meetingReminders: localSettings.meetingReminders
                  })}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-gray-500">Add an extra layer of security</p>
                  </div>
                  <Switch
                    checked={localSettings.twoFactorAuth}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, twoFactorAuth: checked})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Change Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Input 
                    type="password" 
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Active Sessions</Label>
                  <div className="border rounded p-3 space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">Current Session</p>
                        <p className="text-sm text-gray-500">Chrome on Windows - Kuala Lumpur</p>
                      </div>
                      <span className="text-sm text-green-600">Active now</span>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => {
                    handleSaveSettings('Security', { twoFactorAuth: localSettings.twoFactorAuth });
                    if (currentPassword && newPassword) {
                      handlePasswordChange();
                    }
                  }}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Update Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
                <CardDescription>
                  Manage your subscription and payment methods
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border rounded p-4 bg-gray-50">
                  <h4 className="font-medium mb-2">Current Plan</h4>
                  <p className="text-2xl font-bold">Professional</p>
                  <p className="text-sm text-gray-500">RM 299/month</p>
                  <p className="text-sm text-gray-500 mt-2">Next billing date: February 1, 2024</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Payment Methods</Label>
                  <div className="border rounded p-3 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <p className="font-medium">•••• •••• •••• 4242</p>
                        <p className="text-sm text-gray-500">Expires 12/2025</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Edit</Button>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline">Change Plan</Button>
                  <Button variant="outline">Add Payment Method</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Team Settings
                </CardTitle>
                <CardDescription>
                  Manage team members and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Allow team invitations</Label>
                    <p className="text-sm text-gray-500">Team members can invite others</p>
                  </div>
                  <Switch 
                    checked={localSettings.allowTeamInvitations}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, allowTeamInvitations: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Require approval for new members</Label>
                    <p className="text-sm text-gray-500">Admin approval needed for new team members</p>
                  </div>
                  <Switch 
                    checked={localSettings.requireApproval}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, requireApproval: checked})}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Share project visibility</Label>
                    <p className="text-sm text-gray-500">All team members can see all projects</p>
                  </div>
                  <Switch 
                    checked={localSettings.shareProjectVisibility}
                    onCheckedChange={(checked) => setLocalSettings({...localSettings, shareProjectVisibility: checked})}
                  />
                </div>
                
                <Button 
                  onClick={() => handleSaveSettings('Team', {
                    allowTeamInvitations: localSettings.allowTeamInvitations,
                    requireApproval: localSettings.requireApproval,
                    shareProjectVisibility: localSettings.shareProjectVisibility
                  })}
                  disabled={loading}
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Save Team Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

export default SettingsPage;