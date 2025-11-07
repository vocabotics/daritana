import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  Settings,
  Link2,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Camera,
  Palette,
  Bell,
  Globe,
  Moon,
  Sun,
  Laptop,
  Smartphone,
  MessageSquare,
  Mail,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Briefcase,
  GraduationCap,
  Award,
  Languages,
  Sparkles,
  Github,
  Chrome,
  Slack,
  Figma,
  Linkedin,
  Twitter,
  Instagram,
  Facebook,
  Youtube,
  Key,
  Shield,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import { settingsService } from '@/services/settings.service'

interface MemberOnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface PersonalProfile {
  firstName: string
  lastName: string
  title: string
  department: string
  phone: string
  location: string
  bio: string
  avatar?: File | null
  skills: string[]
  languages: string[]
}

interface AppPreferences {
  theme: 'light' | 'dark' | 'system'
  language: string
  timezone: string
  dateFormat: string
  notifications: {
    email: boolean
    push: boolean
    desktop: boolean
    sound: boolean
    projectUpdates: boolean
    taskAssignments: boolean
    teamMessages: boolean
    deadlines: boolean
  }
  workspace: {
    defaultView: string
    sidebarCollapsed: boolean
    compactMode: boolean
    showGridLines: boolean
  }
}

interface SocialAccounts {
  google: boolean
  microsoft: boolean
  github: boolean
  slack: boolean
  linkedin: boolean
  figma: boolean
}

export const MemberOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Step states
  const [profile, setProfile] = useState<PersonalProfile>({
    firstName: user?.name?.split(' ')[0] || '',
    lastName: user?.name?.split(' ').slice(1).join(' ') || '',
    title: '',
    department: '',
    phone: '',
    location: '',
    bio: '',
    skills: [],
    languages: ['English'],
  })

  const [preferences, setPreferences] = useState<AppPreferences>({
    theme: 'system',
    language: 'en',
    timezone: 'Asia/Kuala_Lumpur',
    dateFormat: 'DD/MM/YYYY',
    notifications: {
      email: true,
      push: true,
      desktop: true,
      sound: true,
      projectUpdates: true,
      taskAssignments: true,
      teamMessages: true,
      deadlines: true,
    },
    workspace: {
      defaultView: 'dashboard',
      sidebarCollapsed: false,
      compactMode: false,
      showGridLines: true,
    },
  })

  const [socialAccounts, setSocialAccounts] = useState<SocialAccounts>({
    google: false,
    microsoft: false,
    github: false,
    slack: false,
    linkedin: false,
    figma: false,
  })

  const steps: MemberOnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Your Workspace',
      description: 'Let\'s personalize your experience',
      icon: <Sparkles className="h-6 w-6" />,
      completed: true,
    },
    {
      id: 'profile',
      title: 'Personal Profile',
      description: 'Tell us about yourself',
      icon: <User className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'preferences',
      title: 'App Preferences',
      description: 'Customize your workspace',
      icon: <Settings className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'accounts',
      title: 'Connect Accounts',
      description: 'Link your favorite tools',
      icon: <Link2 className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your profile is ready',
      icon: <CheckCircle2 className="h-6 w-6" />,
      completed: false,
    },
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      steps[currentStep].completed = true
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleNext()
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Save user preferences to backend
      await settingsService.updatePreferences('general', {
        theme: preferences.theme,
        language: preferences.language,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
      })

      await settingsService.updatePreferences('notifications', preferences.notifications)
      await settingsService.updatePreferences('workspace', preferences.workspace)

      // Save profile data (would need a profile service)
      localStorage.setItem('userProfile', JSON.stringify(profile))
      localStorage.setItem('socialAccounts', JSON.stringify(socialAccounts))
      
      // Mark onboarding as complete
      completeOnboarding()
      
      toast.success('Profile setup complete! Welcome to Daritana.')
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate('/dashboard')
      }, 1500)
    } catch (error: any) {
      console.error('Profile setup error:', error)
      toast.error(error.message || 'Failed to save profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const connectSocialAccount = async (provider: keyof SocialAccounts) => {
    // Simulate OAuth flow
    toast.info(`Connecting to ${provider}...`)
    
    // In production, this would initiate OAuth flow
    setTimeout(() => {
      setSocialAccounts({ ...socialAccounts, [provider]: true })
      toast.success(`${provider} account connected successfully!`)
    }, 1500)
  }

  const disconnectSocialAccount = (provider: keyof SocialAccounts) => {
    setSocialAccounts({ ...socialAccounts, [provider]: false })
    toast.info(`${provider} account disconnected`)
  }

  const addSkill = (skill: string) => {
    if (skill && !profile.skills.includes(skill)) {
      setProfile({ ...profile, skills: [...profile.skills, skill] })
    }
  }

  const removeSkill = (skill: string) => {
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true
      case 'profile':
        return profile.firstName && profile.lastName && profile.title
      case 'preferences':
        return true // Preferences are optional
      case 'accounts':
        return true // Social accounts are optional
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to {user?.name?.split(' ')[0] || 'Your'} Workspace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Let's set up your personal profile and preferences
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between mt-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex flex-col items-center cursor-pointer transition-all",
                  index <= currentStep ? "text-blue-600" : "text-gray-400",
                  index === currentStep && "scale-110"
                )}
                onClick={() => index < currentStep && setCurrentStep(index)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                  index < currentStep ? "bg-blue-600 text-white" : 
                  index === currentStep ? "bg-blue-100 text-blue-600 ring-2 ring-blue-600" : 
                  "bg-gray-100 text-gray-400"
                )}>
                  {index < currentStep ? <Check className="h-5 w-5" /> : step.icon}
                </div>
                <span className="text-xs font-medium hidden md:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              {steps[currentStep].icon}
              {steps[currentStep].title}
            </CardTitle>
            <CardDescription>{steps[currentStep].description}</CardDescription>
          </CardHeader>
          
          <CardContent>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {/* Welcome Step */}
                {steps[currentStep].id === 'welcome' && (
                  <div className="space-y-6 text-center py-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
                      <User className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">
                        Hi {profile.firstName || user?.name?.split(' ')[0] || 'there'}! 👋
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        You've been invited to join <strong>{localStorage.getItem('organizationName') || 'the organization'}</strong>. 
                        Let's quickly set up your personal profile and preferences.
                      </p>
                    </div>
                    <div className="flex justify-center gap-4 pt-4">
                      <Badge variant="outline" className="py-1 px-3">
                        <Clock className="h-3 w-3 mr-1" />
                        Takes only 2-3 minutes
                      </Badge>
                      <Badge variant="outline" className="py-1 px-3">
                        <Shield className="h-3 w-3 mr-1" />
                        Your data is secure
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Profile Step */}
                {steps[currentStep].id === 'profile' && (
                  <div className="space-y-6">
                    {/* Avatar Upload */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <Avatar className="h-24 w-24">
                          <AvatarImage src={user?.avatar} />
                          <AvatarFallback>
                            {profile.firstName[0]}{profile.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Button
                          size="icon"
                          variant="secondary"
                          className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                        >
                          <Camera className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">Profile Photo</h4>
                        <p className="text-sm text-gray-600">Upload a photo to personalize your profile</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="h-4 w-4 mr-2" />
                          Choose Photo
                        </Button>
                      </div>
                    </div>

                    <Separator />

                    {/* Personal Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={profile.firstName}
                          onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={profile.lastName}
                          onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Senior Architect"
                          value={profile.title}
                          onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="department">Department</Label>
                        <Select
                          value={profile.department}
                          onValueChange={(value) => setProfile({ ...profile, department: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="architecture">Architecture</SelectItem>
                            <SelectItem value="design">Design</SelectItem>
                            <SelectItem value="engineering">Engineering</SelectItem>
                            <SelectItem value="construction">Construction</SelectItem>
                            <SelectItem value="management">Management</SelectItem>
                            <SelectItem value="admin">Administration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+60 12-345 6789"
                          value={profile.phone}
                          onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          placeholder="Kuala Lumpur, Malaysia"
                          value={profile.location}
                          onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Short Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us a bit about yourself..."
                        value={profile.bio}
                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {/* Skills */}
                    <div className="space-y-2">
                      <Label>Skills & Expertise</Label>
                      <div className="flex flex-wrap gap-2">
                        {['AutoCAD', 'Revit', 'SketchUp', '3D Modeling', 'Project Management', 'BIM', 'Rendering'].map(skill => (
                          <Badge
                            key={skill}
                            variant={profile.skills.includes(skill) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => profile.skills.includes(skill) ? removeSkill(skill) : addSkill(skill)}
                          >
                            {profile.skills.includes(skill) && <Check className="h-3 w-3 mr-1" />}
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Step */}
                {steps[currentStep].id === 'preferences' && (
                  <div className="space-y-6">
                    <Tabs defaultValue="appearance" className="w-full">
                      <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="appearance">Appearance</TabsTrigger>
                        <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        <TabsTrigger value="workspace">Workspace</TabsTrigger>
                      </TabsList>

                      <TabsContent value="appearance" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div>
                            <Label>Theme</Label>
                            <RadioGroup
                              value={preferences.theme}
                              onValueChange={(value: any) => setPreferences({ ...preferences, theme: value })}
                              className="flex gap-4 mt-2"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="light" id="light" />
                                <Label htmlFor="light" className="flex items-center cursor-pointer">
                                  <Sun className="h-4 w-4 mr-2" />
                                  Light
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dark" id="dark" />
                                <Label htmlFor="dark" className="flex items-center cursor-pointer">
                                  <Moon className="h-4 w-4 mr-2" />
                                  Dark
                                </Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="system" id="system" />
                                <Label htmlFor="system" className="flex items-center cursor-pointer">
                                  <Laptop className="h-4 w-4 mr-2" />
                                  System
                                </Label>
                              </div>
                            </RadioGroup>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="language">Language</Label>
                              <Select
                                value={preferences.language}
                                onValueChange={(value) => setPreferences({ ...preferences, language: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="en">English</SelectItem>
                                  <SelectItem value="ms">Bahasa Malaysia</SelectItem>
                                  <SelectItem value="zh">中文</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="timezone">Timezone</Label>
                              <Select
                                value={preferences.timezone}
                                onValueChange={(value) => setPreferences({ ...preferences, timezone: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="Asia/Kuala_Lumpur">Kuala Lumpur (GMT+8)</SelectItem>
                                  <SelectItem value="Asia/Singapore">Singapore (GMT+8)</SelectItem>
                                  <SelectItem value="Asia/Bangkok">Bangkok (GMT+7)</SelectItem>
                                  <SelectItem value="Asia/Jakarta">Jakarta (GMT+7)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="notifications" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Email Notifications</Label>
                              <p className="text-sm text-gray-600">Receive updates via email</p>
                            </div>
                            <Switch
                              checked={preferences.notifications.email}
                              onCheckedChange={(checked) => 
                                setPreferences({
                                  ...preferences,
                                  notifications: { ...preferences.notifications, email: checked }
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Push Notifications</Label>
                              <p className="text-sm text-gray-600">Get push notifications on mobile</p>
                            </div>
                            <Switch
                              checked={preferences.notifications.push}
                              onCheckedChange={(checked) => 
                                setPreferences({
                                  ...preferences,
                                  notifications: { ...preferences.notifications, push: checked }
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Desktop Notifications</Label>
                              <p className="text-sm text-gray-600">Show desktop alerts</p>
                            </div>
                            <Switch
                              checked={preferences.notifications.desktop}
                              onCheckedChange={(checked) => 
                                setPreferences({
                                  ...preferences,
                                  notifications: { ...preferences.notifications, desktop: checked }
                                })
                              }
                            />
                          </div>

                          <Separator />

                          <div className="space-y-3">
                            <Label>Notify me about:</Label>
                            {[
                              { key: 'projectUpdates', label: 'Project updates' },
                              { key: 'taskAssignments', label: 'Task assignments' },
                              { key: 'teamMessages', label: 'Team messages' },
                              { key: 'deadlines', label: 'Upcoming deadlines' },
                            ].map(item => (
                              <div key={item.key} className="flex items-center space-x-2">
                                <Switch
                                  checked={preferences.notifications[item.key as keyof typeof preferences.notifications] as boolean}
                                  onCheckedChange={(checked) => 
                                    setPreferences({
                                      ...preferences,
                                      notifications: { ...preferences.notifications, [item.key]: checked }
                                    })
                                  }
                                />
                                <Label className="font-normal cursor-pointer">{item.label}</Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="workspace" className="space-y-4 mt-4">
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="defaultView">Default View</Label>
                            <Select
                              value={preferences.workspace.defaultView}
                              onValueChange={(value) => 
                                setPreferences({
                                  ...preferences,
                                  workspace: { ...preferences.workspace, defaultView: value }
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dashboard">Dashboard</SelectItem>
                                <SelectItem value="projects">Projects</SelectItem>
                                <SelectItem value="tasks">Tasks</SelectItem>
                                <SelectItem value="calendar">Calendar</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Compact Mode</Label>
                              <p className="text-sm text-gray-600">Use smaller spacing and fonts</p>
                            </div>
                            <Switch
                              checked={preferences.workspace.compactMode}
                              onCheckedChange={(checked) => 
                                setPreferences({
                                  ...preferences,
                                  workspace: { ...preferences.workspace, compactMode: checked }
                                })
                              }
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                              <Label>Show Grid Lines</Label>
                              <p className="text-sm text-gray-600">Display grid lines in tables</p>
                            </div>
                            <Switch
                              checked={preferences.workspace.showGridLines}
                              onCheckedChange={(checked) => 
                                setPreferences({
                                  ...preferences,
                                  workspace: { ...preferences.workspace, showGridLines: checked }
                                })
                              }
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Connect Accounts Step */}
                {steps[currentStep].id === 'accounts' && (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      <p className="text-gray-600">
                        Connect your accounts for seamless integration and single sign-on
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { key: 'google', name: 'Google', icon: Chrome, color: 'text-red-500' },
                        { key: 'microsoft', name: 'Microsoft', icon: Laptop, color: 'text-blue-500' },
                        { key: 'github', name: 'GitHub', icon: Github, color: 'text-gray-800' },
                        { key: 'slack', name: 'Slack', icon: Slack, color: 'text-purple-500' },
                        { key: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
                        { key: 'figma', name: 'Figma', icon: Figma, color: 'text-purple-600' },
                      ].map((account) => {
                        const Icon = account.icon
                        const isConnected = socialAccounts[account.key as keyof SocialAccounts]
                        
                        return (
                          <Card key={account.key} className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Icon className={cn("h-8 w-8", account.color)} />
                                <div>
                                  <p className="font-semibold">{account.name}</p>
                                  <p className="text-sm text-gray-600">
                                    {isConnected ? 'Connected' : 'Not connected'}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant={isConnected ? "outline" : "default"}
                                size="sm"
                                onClick={() => 
                                  isConnected 
                                    ? disconnectSocialAccount(account.key as keyof SocialAccounts)
                                    : connectSocialAccount(account.key as keyof SocialAccounts)
                                }
                              >
                                {isConnected ? 'Disconnect' : 'Connect'}
                              </Button>
                            </div>
                          </Card>
                        )
                      })}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-blue-900 dark:text-blue-100">
                            Your data is secure
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            We use OAuth 2.0 for secure authentication. We never store your passwords.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Complete Step */}
                {steps[currentStep].id === 'complete' && (
                  <div className="space-y-6">
                    <div className="text-center py-8">
                      <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                        <CheckCircle2 className="h-12 w-12 text-white" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-2">You're All Set!</h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Your profile has been configured. You're ready to start collaborating with your team.
                      </p>
                    </div>

                    {/* Summary */}
                    <Card className="bg-gray-50 dark:bg-gray-800">
                      <CardContent className="p-6">
                        <h4 className="font-semibold mb-4">Profile Summary</h4>
                        <div className="space-y-3 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Name</span>
                            <span className="font-medium">{profile.firstName} {profile.lastName}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Title</span>
                            <span className="font-medium">{profile.title}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Department</span>
                            <span className="font-medium">{profile.department || 'Not specified'}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Theme</span>
                            <span className="font-medium capitalize">{preferences.theme}</span>
                          </div>
                          <Separator />
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Connected Accounts</span>
                            <span className="font-medium">
                              {Object.values(socialAccounts).filter(Boolean).length} accounts
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-4">
                        You can always update these settings later from your profile page.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep > 0 && currentStep < steps.length - 1 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              
              {currentStep === steps.length - 1 ? (
                <Button onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <Check className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}