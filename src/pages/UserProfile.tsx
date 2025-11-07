import React, { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Shield,
  Bell,
  Globe,
  Camera,
  Save,
  Key,
  UserCheck,
  Building,
  Award
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUserProfileStore } from '@/store/userProfileStore'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function UserProfile() {
  const { user } = useAuthStore()
  const { profile, updateProfile, uploadAvatar, addCredential, removeCredential } = useUserProfileStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string>('')
  
  // Initialize profile data from store and auth user
  const [profileData, setProfileData] = useState({
    ...profile,
    firstName: profile.firstName || user?.firstName || '',
    lastName: profile.lastName || user?.lastName || '',
    email: profile.email || user?.email || '',
    phone: profile.phone || user?.phone || '',
  })

  // Sync with store when it changes
  useEffect(() => {
    setProfileData({
      ...profile,
      firstName: profile.firstName || user?.firstName || '',
      lastName: profile.lastName || user?.lastName || '',
      email: profile.email || user?.email || '',
      phone: profile.phone || user?.phone || '',
    })
  }, [profile, user])

  const handleSaveProfile = async () => {
    setIsLoading(true)
    
    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatar(avatarFile)
      }
      
      // Save all profile data
      await updateProfile(profileData)
      
      toast.success('Profile updated successfully!')
      setIsEditing(false)
      setAvatarFile(null)
      setAvatarPreview('')
    } catch (error) {
      toast.error('Failed to update profile. Please try again.')
      console.error('Profile update error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar image must be less than 5MB')
        return
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }
      
      setAvatarFile(file)
      
      // Preview the image
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  const handleAddCredential = () => {
    // This would open a modal in production
    const newCredential = {
      name: 'New Certification',
      organization: 'Professional Body',
      status: 'pending' as const
    }
    addCredential(newCredential)
    toast.success('Credential added. Verification pending.')
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'project_lead': return 'bg-purple-100 text-purple-800'
      case 'designer': return 'bg-blue-100 text-blue-800'
      case 'contractor': return 'bg-orange-100 text-orange-800'
      case 'client': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profile Settings</h1>
            <p className="text-muted-foreground">
              Manage your personal information and preferences
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveProfile} disabled={isLoading}>
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        {/* Profile Overview Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || profile.avatar || user?.avatar} />
                  <AvatarFallback>
                    {profileData.firstName?.[0]}{profileData.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 p-1 bg-primary rounded-full cursor-pointer">
                    <Camera className="h-4 w-4 text-white" />
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarChange}
                    />
                  </label>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-semibold">
                    {profileData.firstName} {profileData.lastName}
                  </h2>
                  <Badge className={getRoleBadgeColor(user?.role || '')}>
                    {user?.role?.replace('_', ' ')}
                  </Badge>
                  {user?.verified && (
                    <Badge variant="outline" className="gap-1">
                      <UserCheck className="h-3 w-3" />
                      Verified
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground mb-4">{profileData.bio || 'No bio added yet'}</p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4" />
                    {profileData.phone || 'Not provided'}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {profileData.city}, {profileData.country}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(user?.createdAt || '').toLocaleDateString('en-MY')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="personal" className="space-y-4">
          <TabsList>
            <TabsTrigger value="personal">
              <User className="h-4 w-4 mr-2" />
              Personal Information
            </TabsTrigger>
            <TabsTrigger value="professional">
              <Briefcase className="h-4 w-4 mr-2" />
              Professional
            </TabsTrigger>
            <TabsTrigger value="notifications">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
            <TabsTrigger value="preferences">
              <Globe className="h-4 w-4 mr-2" />
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    placeholder="+60 12-345 6789"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={profileData.bio}
                    onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                    disabled={!isEditing}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="123 Jalan Ampang"
                    value={profileData.address}
                    onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={profileData.city}
                      onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Select 
                      value={profileData.state} 
                      onValueChange={(value) => setProfileData({...profileData, state: value})}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Wilayah Persekutuan">Wilayah Persekutuan</SelectItem>
                        <SelectItem value="Selangor">Selangor</SelectItem>
                        <SelectItem value="Penang">Penang</SelectItem>
                        <SelectItem value="Johor">Johor</SelectItem>
                        <SelectItem value="Perak">Perak</SelectItem>
                        <SelectItem value="Pahang">Pahang</SelectItem>
                        <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                        <SelectItem value="Melaka">Melaka</SelectItem>
                        <SelectItem value="Kedah">Kedah</SelectItem>
                        <SelectItem value="Kelantan">Kelantan</SelectItem>
                        <SelectItem value="Terengganu">Terengganu</SelectItem>
                        <SelectItem value="Perlis">Perlis</SelectItem>
                        <SelectItem value="Sabah">Sabah</SelectItem>
                        <SelectItem value="Sarawak">Sarawak</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postcode">Postcode</Label>
                    <Input
                      id="postcode"
                      placeholder="50450"
                      value={profileData.postcode}
                      onChange={(e) => setProfileData({...profileData, postcode: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>
                  Manage your professional details and credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company/Organization</Label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="company"
                        className="pl-10"
                        placeholder="Daritana Architecture"
                        value={profileData.company}
                        onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position/Title</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        id="position"
                        className="pl-10"
                        placeholder="Senior Architect"
                        value={profileData.position}
                        onChange={(e) => setProfileData({...profileData, position: e.target.value})}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="website"
                      className="pl-10"
                      type="url"
                      placeholder="https://example.com"
                      value={profileData.website}
                      onChange={(e) => setProfileData({...profileData, website: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn Profile</Label>
                  <Input
                    id="linkedin"
                    placeholder="https://linkedin.com/in/username"
                    value={profileData.linkedin}
                    onChange={(e) => setProfileData({...profileData, linkedin: e.target.value})}
                    disabled={!isEditing}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Professional Credentials</Label>
                  <div className="space-y-2">
                    {profileData.credentials && profileData.credentials.length > 0 ? (
                      profileData.credentials.map((credential) => (
                        <div key={credential.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Award className="h-5 w-5 text-primary" />
                            <div>
                              <p className="font-medium">{credential.name}</p>
                              <p className="text-sm text-muted-foreground">{credential.organization}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={credential.status === 'verified' ? 'default' : 'outline'}>
                              {credential.status}
                            </Badge>
                            {isEditing && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  removeCredential(credential.id)
                                  toast.success('Credential removed')
                                }}
                              >
                                Remove
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        No credentials added yet
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <Button variant="outline" className="w-full" onClick={handleAddCredential}>
                      Add Credential
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={profileData.emailNotifications}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, emailNotifications: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive urgent notifications via SMS
                      </p>
                    </div>
                    <Switch
                      checked={profileData.smsNotifications}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, smsNotifications: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Notification Types</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Project Updates</Label>
                      <p className="text-sm text-muted-foreground">
                        Updates on project progress and milestones
                      </p>
                    </div>
                    <Switch
                      checked={profileData.projectUpdates}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, projectUpdates: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Task Assignments</Label>
                      <p className="text-sm text-muted-foreground">
                        When tasks are assigned to you
                      </p>
                    </div>
                    <Switch
                      checked={profileData.taskAssignments}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, taskAssignments: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Deadline Reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders for upcoming deadlines
                      </p>
                    </div>
                    <Switch
                      checked={profileData.deadlineReminders}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, deadlineReminders: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Team Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Messages from team members
                      </p>
                    </div>
                    <Switch
                      checked={profileData.teamMessages}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, teamMessages: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Client Messages</Label>
                      <p className="text-sm text-muted-foreground">
                        Messages from clients
                      </p>
                    </div>
                    <Switch
                      checked={profileData.clientMessages}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, clientMessages: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Marketing Emails</Label>
                      <p className="text-sm text-muted-foreground">
                        Product updates and announcements
                      </p>
                    </div>
                    <Switch
                      checked={profileData.marketingEmails}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, marketingEmails: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Two-Factor Authentication</Label>
                      <p className="text-sm text-muted-foreground">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Switch
                      checked={profileData.twoFactorAuth}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, twoFactorAuth: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Login Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified of new login attempts
                      </p>
                    </div>
                    <Switch
                      checked={profileData.loginAlerts}
                      onCheckedChange={(checked) => 
                        setProfileData({...profileData, loginAlerts: checked})
                      }
                      disabled={!isEditing}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Session Timeout</Label>
                    <Select 
                      value={profileData.sessionTimeout}
                      onValueChange={(value) => 
                        setProfileData({...profileData, sessionTimeout: value})
                      }
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="never">Never</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Automatically log out after period of inactivity
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Password</h3>
                  <Button variant="outline" className="w-full">
                    <Key className="h-4 w-4 mr-2" />
                    Change Password
                  </Button>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Active Sessions</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">Windows • Chrome</p>
                        <p className="text-sm text-muted-foreground">
                          Kuala Lumpur, Malaysia • Current session
                        </p>
                      </div>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">iPhone • Safari</p>
                        <p className="text-sm text-muted-foreground">
                          Penang, Malaysia • Last active 2 hours ago
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        Revoke
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Preferences</CardTitle>
                <CardDescription>
                  Customize your experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select 
                    value={profileData.language}
                    onValueChange={(value) => setProfileData({...profileData, language: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="ta">தமிழ்</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select 
                    value={profileData.timezone}
                    onValueChange={(value) => setProfileData({...profileData, timezone: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kuala_Lumpur">Asia/Kuala Lumpur (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Singapore">Asia/Singapore (GMT+8)</SelectItem>
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="Asia/Jakarta">Asia/Jakarta (GMT+7)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select 
                    value={profileData.dateFormat || 'dd/mm/yyyy'}
                    onValueChange={(value) => setProfileData({...profileData, dateFormat: value})}
                    disabled={!isEditing}
                  >
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

                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select 
                    value={profileData.currency || 'MYR'}
                    onValueChange={(value) => setProfileData({...profileData, currency: value})}
                    disabled={!isEditing}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MYR">Malaysian Ringgit (RM)</SelectItem>
                      <SelectItem value="SGD">Singapore Dollar (S$)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}