import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Users,
  CreditCard,
  Rocket,
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Shield,
  Zap,
  Package,
  Sparkles,
  UserPlus,
  Send,
  Copy,
  ExternalLink,
  Calendar,
  Clock,
  Target,
  Briefcase,
  Home,
  Settings,
  CheckCircle2,
  Circle,
  ArrowRight,
  Building,
  Users2,
  FolderOpen,
  Plug,
  HelpCircle,
  Info,
  AlertCircle,
  X,
  Plus,
  Trash2,
  Edit,
  Save,
  Loader2,
  Download,
  Share2,
  Key,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Database,
  Cloud,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  Github,
  Slack,
  Chrome,
  Figma,
  Trello,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useNavigate } from 'react-router-dom'
import organizationService, { SUBSCRIPTION_PLANS } from '@/services/organization.service'
import Confetti from 'react-confetti'

interface OnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface OrganizationData {
  name: string
  type: 'architecture' | 'engineering' | 'construction' | 'interior_design' | 'landscape' | 'other'
  size: 'solo' | 'small' | 'medium' | 'large' | 'enterprise'
  website?: string
  phone?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  registrationNumber?: string
  taxId?: string
  logo?: File | null
  description?: string
  industry?: string
  founded?: string
}

interface TeamMember {
  id: string
  email: string
  name: string
  role: 'admin' | 'project_lead' | 'designer' | 'contractor' | 'client' | 'staff'
  department?: string
  sendInvite: boolean
}

interface ProjectTemplate {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  features: string[]
  selected: boolean
}

interface Integration {
  id: string
  name: string
  description: string
  icon: React.ReactNode
  category: 'storage' | 'communication' | 'design' | 'project' | 'accounting'
  connected: boolean
  requiresAuth: boolean
}

const subscriptionPlans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 49.99,
    currency: 'MYR',
    period: 'month',
    description: 'Perfect for solo architects and small teams',
    features: [
      '5 active projects',
      '10 GB storage',
      '3 team members',
      'Basic project management',
      'Document sharing',
      'Email support',
    ],
    limitations: [
      'No API access',
      'No custom branding',
      'No advanced analytics',
    ],
    recommended: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 99.99,
    currency: 'MYR',
    period: 'month',
    description: 'Ideal for growing architecture firms',
    features: [
      '20 active projects',
      '100 GB storage',
      '15 team members',
      'Advanced project management',
      'Client portal access',
      'Real-time collaboration',
      'Priority support',
      'Custom branding',
      'API access',
    ],
    limitations: [
      'No white-label options',
      'Limited integrations',
    ],
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 299.99,
    currency: 'MYR',
    period: 'month',
    description: 'Complete solution for large organizations',
    features: [
      'Unlimited projects',
      '1 TB storage',
      'Unlimited team members',
      'Enterprise project management',
      'White-label options',
      'Advanced analytics',
      'Custom integrations',
      'Dedicated account manager',
      'SLA guarantee',
      'On-premise deployment option',
    ],
    limitations: [],
    recommended: false,
  },
]

const projectTemplates: ProjectTemplate[] = [
  {
    id: 'residential',
    name: 'Residential Projects',
    description: 'Houses, apartments, and residential complexes',
    icon: <Home className="h-5 w-5" />,
    features: ['Floor plans', 'Interior design', '3D visualization', 'Client approvals'],
    selected: false,
  },
  {
    id: 'commercial',
    name: 'Commercial Buildings',
    description: 'Offices, retail spaces, and commercial complexes',
    icon: <Building2 className="h-5 w-5" />,
    features: ['Space planning', 'Compliance tracking', 'Tenant management', 'Cost estimation'],
    selected: false,
  },
  {
    id: 'infrastructure',
    name: 'Infrastructure',
    description: 'Roads, bridges, and public infrastructure',
    icon: <Target className="h-5 w-5" />,
    features: ['Engineering drawings', 'Safety compliance', 'Progress tracking', 'Government approvals'],
    selected: false,
  },
  {
    id: 'landscape',
    name: 'Landscape Architecture',
    description: 'Parks, gardens, and outdoor spaces',
    icon: <Activity className="h-5 w-5" />,
    features: ['Site planning', 'Plant databases', 'Irrigation design', 'Environmental impact'],
    selected: false,
  },
  {
    id: 'interior',
    name: 'Interior Design',
    description: 'Interior spaces and renovations',
    icon: <Sparkles className="h-5 w-5" />,
    features: ['Mood boards', 'Material libraries', 'Furniture catalogs', '3D walkthroughs'],
    selected: false,
  },
]

const availableIntegrations: Integration[] = [
  // Storage
  {
    id: 'google-drive',
    name: 'Google Drive',
    description: 'Store and sync project files',
    icon: <Cloud className="h-5 w-5" />,
    category: 'storage',
    connected: false,
    requiresAuth: true,
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    description: 'Microsoft cloud storage integration',
    icon: <Server className="h-5 w-5" />,
    category: 'storage',
    connected: false,
    requiresAuth: true,
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    description: 'Sync files across devices',
    icon: <Database className="h-5 w-5" />,
    category: 'storage',
    connected: false,
    requiresAuth: true,
  },
  // Communication
  {
    id: 'slack',
    name: 'Slack',
    description: 'Team communication and notifications',
    icon: <Slack className="h-5 w-5" />,
    category: 'communication',
    connected: false,
    requiresAuth: true,
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Collaborate with Teams channels',
    icon: <Users2 className="h-5 w-5" />,
    category: 'communication',
    connected: false,
    requiresAuth: true,
  },
  // Design
  {
    id: 'autocad',
    name: 'AutoCAD',
    description: 'Import and export CAD files',
    icon: <Cpu className="h-5 w-5" />,
    category: 'design',
    connected: false,
    requiresAuth: false,
  },
  {
    id: 'revit',
    name: 'Revit',
    description: 'BIM model integration',
    icon: <Package className="h-5 w-5" />,
    category: 'design',
    connected: false,
    requiresAuth: false,
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Design collaboration platform',
    icon: <Figma className="h-5 w-5" />,
    category: 'design',
    connected: false,
    requiresAuth: true,
  },
  // Project Management
  {
    id: 'trello',
    name: 'Trello',
    description: 'Sync tasks with Trello boards',
    icon: <Trello className="h-5 w-5" />,
    category: 'project',
    connected: false,
    requiresAuth: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Version control for documents',
    icon: <Github className="h-5 w-5" />,
    category: 'project',
    connected: false,
    requiresAuth: true,
  },
  // Accounting
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    description: 'Financial management integration',
    icon: <DollarSign className="h-5 w-5" />,
    category: 'accounting',
    connected: false,
    requiresAuth: true,
  },
  {
    id: 'xero',
    name: 'Xero',
    description: 'Cloud accounting software',
    icon: <TrendingUp className="h-5 w-5" />,
    category: 'accounting',
    connected: false,
    requiresAuth: true,
  },
]

export const OnboardingWizard: React.FC = () => {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [organizationId, setOrganizationId] = useState<string | null>(null)

  // Step states
  const [organizationData, setOrganizationData] = useState<OrganizationData>({
    name: '',
    type: 'architecture',
    size: 'small',
    country: 'Malaysia',
    description: '',
  })

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      id: '1',
      email: '',
      name: '',
      role: 'designer',
      sendInvite: true,
    },
  ])

  const [selectedPlan, setSelectedPlan] = useState('professional')
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>(['residential'])
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([])
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Daritana',
      description: 'Let\'s set up your architecture management platform',
      icon: <Rocket className="h-6 w-6" />,
      completed: true,
    },
    {
      id: 'organization',
      title: 'Organization Details',
      description: 'Tell us about your company',
      icon: <Building2 className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'team',
      title: 'Invite Your Team',
      description: 'Add team members to collaborate',
      icon: <Users className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'subscription',
      title: 'Choose Your Plan',
      description: 'Select the right subscription for your needs',
      icon: <CreditCard className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'templates',
      title: 'Project Templates',
      description: 'Choose templates for your projects',
      icon: <FolderOpen className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'integrations',
      title: 'Connect Your Tools',
      description: 'Integrate with your existing workflow',
      icon: <Plug className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'complete',
      title: 'All Set!',
      description: 'Your workspace is ready',
      icon: <CheckCircle2 className="h-6 w-6" />,
      completed: false,
    },
  ]

  const progress = ((currentStep + 1) / steps.length) * 100

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Mark current step as completed
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
      // Get the admin user's info
      const adminEmail = user?.email || organizationData.email || ''
      const nameParts = (user?.name || 'Admin User').split(' ')
      const adminFirstName = nameParts[0] || 'Admin'
      const adminLastName = nameParts.slice(1).join(' ') || 'User'

      // Generate a secure random password
      const generateSecurePassword = () => {
        const length = 16
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
        let password = ''
        const array = new Uint8Array(length)
        crypto.getRandomValues(array)
        for (let i = 0; i < length; i++) {
          password += charset[array[i] % charset.length]
        }
        return password
      }

      const adminPassword = generateSecurePassword()
      
      // Map plan selection to UUID
      const planMap: Record<string, string> = {
        'basic': SUBSCRIPTION_PLANS.BASIC.id,
        'professional': SUBSCRIPTION_PLANS.PROFESSIONAL.id,
        'enterprise': SUBSCRIPTION_PLANS.ENTERPRISE.id
      }
      
      // Step 1: Create organization if not already created
      if (!organizationId) {
        const orgData = {
          name: organizationData.name,
          slug: organizationData.name.toLowerCase().replace(/\s+/g, '-'),
          email: organizationData.email || adminEmail,
          phone: organizationData.phone || '',
          website: organizationData.website || '',
          businessType: organizationData.type || 'architecture',
          country: organizationData.country || 'Malaysia',
          planId: planMap[selectedPlan] || SUBSCRIPTION_PLANS.PROFESSIONAL.id,
          adminEmail,
          adminFirstName,
          adminLastName,
          adminPassword
        }
        
        console.log('Creating organization:', orgData)
        const orgResult = await organizationService.createOrganization(orgData)
        setOrganizationId(orgResult.organization.id)
        
        // Step 2: Invite team members if any
        const validMembers = teamMembers.filter(m => m.email && m.email !== adminEmail)
        if (validMembers.length > 0) {
          console.log('Inviting team members:', validMembers)
          const inviteResults = await organizationService.inviteMultipleUsers(
            orgResult.organization.id,
            validMembers.map(m => ({
              email: m.email,
              firstName: m.name.split(' ')[0] || '',
              lastName: m.name.split(' ').slice(1).join(' ') || '',
              role: m.role.toUpperCase() as any,
              department: '',
              title: m.role
            }))
          )
          
          const successCount = inviteResults.filter(r => r.success).length
          if (successCount > 0) {
            toast.success(`Invited ${successCount} team member(s) successfully`)
          }
        }
        
        // Step 3: Save project templates preference (stored locally for now)
        if (selectedTemplates.length > 0) {
          localStorage.setItem('projectTemplates', JSON.stringify(selectedTemplates))
        }
        
        // Step 4: Save integrations preference (stored locally for now)
        if (selectedIntegrations.length > 0) {
          localStorage.setItem('integrations', JSON.stringify(selectedIntegrations))
        }
      }
      
      // Mark onboarding as complete in auth store
      completeOnboarding()
      
      setShowConfetti(true)
      toast.success('Welcome to Daritana! Your workspace is ready.')
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('Failed to complete setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const addTeamMember = () => {
    setTeamMembers([
      ...teamMembers,
      {
        id: Date.now().toString(),
        email: '',
        name: '',
        role: 'staff',
        sendInvite: true,
      },
    ])
  }

  const removeTeamMember = (id: string) => {
    setTeamMembers(teamMembers.filter(m => m.id !== id))
  }

  const updateTeamMember = (id: string, field: keyof TeamMember, value: any) => {
    setTeamMembers(teamMembers.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const toggleTemplate = (templateId: string) => {
    if (selectedTemplates.includes(templateId)) {
      setSelectedTemplates(selectedTemplates.filter(id => id !== templateId))
    } else {
      setSelectedTemplates([...selectedTemplates, templateId])
    }
  }

  const toggleIntegration = (integrationId: string) => {
    if (selectedIntegrations.includes(integrationId)) {
      setSelectedIntegrations(selectedIntegrations.filter(id => id !== integrationId))
    } else {
      setSelectedIntegrations([...selectedIntegrations, integrationId])
    }
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true
      case 'organization':
        return organizationData.name && organizationData.type && organizationData.email
      case 'team':
        return true // Team is optional
      case 'subscription':
        return selectedPlan
      case 'templates':
        return selectedTemplates.length > 0
      case 'integrations':
        return true // Integrations are optional
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Setup Your Workspace
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Complete these steps to get your architecture studio up and running
          </p>
        </div>

        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={cn(
                  "flex items-center",
                  index < steps.length - 1 && "flex-1"
                )}
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all",
                    index < currentStep
                      ? "bg-green-500 border-green-500 text-white"
                      : index === currentStep
                      ? "bg-blue-500 border-blue-500 text-white animate-pulse"
                      : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                  )}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : index === currentStep ? (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2 transition-all",
                      index < currentStep
                        ? "bg-green-500"
                        : "bg-gray-300 dark:bg-gray-600"
                    )}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="shadow-xl">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                      {steps[currentStep].icon}
                    </div>
                    <div>
                      <CardTitle>{steps[currentStep].title}</CardTitle>
                      <CardDescription>{steps[currentStep].description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="min-h-[400px]">
                  {/* Welcome Step */}
                  {steps[currentStep].id === 'welcome' && (
                    <div className="space-y-6">
                      <div className="text-center py-8">
                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6">
                          <Rocket className="h-12 w-12 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                          Let's get your architecture management platform set up in just a few minutes. 
                          We'll guide you through customizing your workspace, inviting your team, and 
                          connecting your favorite tools.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="border-2 border-blue-100 dark:border-blue-900">
                          <CardContent className="p-4">
                            <Shield className="h-8 w-8 text-blue-500 mb-2" />
                            <h3 className="font-semibold mb-1">Secure & Compliant</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Enterprise-grade security with Malaysian compliance
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-purple-100 dark:border-purple-900">
                          <CardContent className="p-4">
                            <Zap className="h-8 w-8 text-purple-500 mb-2" />
                            <h3 className="font-semibold mb-1">AI-Powered</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              ARIA AI assistant helps optimize your workflow
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-2 border-green-100 dark:border-green-900">
                          <CardContent className="p-4">
                            <Users className="h-8 w-8 text-green-500 mb-2" />
                            <h3 className="font-semibold mb-1">Team Collaboration</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Real-time collaboration with your entire team
                            </p>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  )}

                  {/* Organization Details Step */}
                  {steps[currentStep].id === 'organization' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="org-name">Organization Name *</Label>
                          <Input
                            id="org-name"
                            placeholder="e.g., Daritana Architecture Studio"
                            value={organizationData.name}
                            onChange={(e) => setOrganizationData({ ...organizationData, name: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-type">Organization Type *</Label>
                          <Select
                            value={organizationData.type}
                            onValueChange={(value: any) => setOrganizationData({ ...organizationData, type: value })}
                          >
                            <SelectTrigger id="org-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="architecture">Architecture Firm</SelectItem>
                              <SelectItem value="engineering">Engineering Consultancy</SelectItem>
                              <SelectItem value="construction">Construction Company</SelectItem>
                              <SelectItem value="interior_design">Interior Design Studio</SelectItem>
                              <SelectItem value="landscape">Landscape Architecture</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-size">Team Size *</Label>
                          <Select
                            value={organizationData.size}
                            onValueChange={(value: any) => setOrganizationData({ ...organizationData, size: value })}
                          >
                            <SelectTrigger id="org-size">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solo">Just me (1)</SelectItem>
                              <SelectItem value="small">Small (2-10)</SelectItem>
                              <SelectItem value="medium">Medium (11-50)</SelectItem>
                              <SelectItem value="large">Large (51-200)</SelectItem>
                              <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-website">Website</Label>
                          <Input
                            id="org-website"
                            type="url"
                            placeholder="https://www.yourcompany.com"
                            value={organizationData.website}
                            onChange={(e) => setOrganizationData({ ...organizationData, website: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-phone">Phone Number</Label>
                          <Input
                            id="org-phone"
                            type="tel"
                            placeholder="+60 3-1234 5678"
                            value={organizationData.phone}
                            onChange={(e) => setOrganizationData({ ...organizationData, phone: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-email">Contact Email *</Label>
                          <Input
                            id="org-email"
                            type="email"
                            placeholder="contact@yourcompany.com"
                            value={organizationData.email}
                            onChange={(e) => setOrganizationData({ ...organizationData, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org-phone">Phone Number</Label>
                          <Input
                            id="org-phone"
                            placeholder="+60 3-1234 5678"
                            value={organizationData.phone}
                            onChange={(e) => setOrganizationData({ ...organizationData, phone: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org-website">Website</Label>
                          <Input
                            id="org-website"
                            placeholder="https://www.yourcompany.com"
                            value={organizationData.website}
                            onChange={(e) => setOrganizationData({ ...organizationData, website: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="org-country">Country</Label>
                          <Input
                            id="org-country"
                            placeholder="Malaysia"
                            value={organizationData.country}
                            onChange={(e) => setOrganizationData({ ...organizationData, country: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-city">City</Label>
                          <Input
                            id="org-city"
                            placeholder="Kuala Lumpur"
                            value={organizationData.city}
                            onChange={(e) => setOrganizationData({ ...organizationData, city: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="org-registration">Registration Number</Label>
                          <Input
                            id="org-registration"
                            placeholder="e.g., SSM Registration No."
                            value={organizationData.registrationNumber}
                            onChange={(e) => setOrganizationData({ ...organizationData, registrationNumber: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="org-description">Description</Label>
                        <Textarea
                          id="org-description"
                          placeholder="Tell us about your organization..."
                          rows={4}
                          value={organizationData.description}
                          onChange={(e) => setOrganizationData({ ...organizationData, description: e.target.value })}
                        />
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-700 dark:text-blue-300">Privacy Notice</p>
                            <p className="text-blue-600 dark:text-blue-400 mt-1">
                              Your organization information is securely stored and never shared with third parties.
                              You can update these details anytime from your settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Team Members Step */}
                  {steps[currentStep].id === 'team' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="font-semibold">Invite Team Members</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Add your team members to start collaborating immediately
                          </p>
                        </div>
                        <Button onClick={addTeamMember} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      </div>

                      <div className="space-y-4 max-h-96 overflow-y-auto">
                        {teamMembers.map((member, index) => (
                          <Card key={member.id} className="p-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Badge variant="outline">Team Member {index + 1}</Badge>
                                {teamMembers.length > 1 && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeTeamMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                  <Label>Email Address</Label>
                                  <Input
                                    type="email"
                                    placeholder="team@example.com"
                                    value={member.email}
                                    onChange={(e) => updateTeamMember(member.id, 'email', e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Full Name</Label>
                                  <Input
                                    placeholder="John Doe"
                                    value={member.name}
                                    onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                                  />
                                </div>

                                <div className="space-y-2">
                                  <Label>Role</Label>
                                  <Select
                                    value={member.role}
                                    onValueChange={(value: any) => updateTeamMember(member.id, 'role', value)}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="admin">Administrator</SelectItem>
                                      <SelectItem value="project_lead">Project Lead</SelectItem>
                                      <SelectItem value="designer">Designer</SelectItem>
                                      <SelectItem value="contractor">Contractor</SelectItem>
                                      <SelectItem value="client">Client</SelectItem>
                                      <SelectItem value="staff">Staff</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label>Department</Label>
                                  <Input
                                    placeholder="e.g., Architecture"
                                    value={member.department}
                                    onChange={(e) => updateTeamMember(member.id, 'department', e.target.value)}
                                  />
                                </div>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`invite-${member.id}`}
                                  checked={member.sendInvite}
                                  onCheckedChange={(checked) => updateTeamMember(member.id, 'sendInvite', checked)}
                                />
                                <Label htmlFor={`invite-${member.id}`} className="text-sm">
                                  Send invitation email when setup is complete
                                </Label>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <UserPlus className="h-5 w-5 text-green-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-green-700 dark:text-green-300">
                              Team members will receive an invitation
                            </p>
                            <p className="text-green-600 dark:text-green-400 mt-1">
                              Each member will get an email with login instructions and a temporary password.
                              You can always add more team members later from the Team settings.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subscription Plan Step */}
                  {steps[currentStep].id === 'subscription' && (
                    <div className="space-y-6">
                      {/* Billing Period Toggle */}
                      <div className="flex items-center justify-center mb-6">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1 flex items-center">
                          <Button
                            variant={billingPeriod === 'monthly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingPeriod('monthly')}
                            className="rounded-md"
                          >
                            Monthly
                          </Button>
                          <Button
                            variant={billingPeriod === 'yearly' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setBillingPeriod('yearly')}
                            className="rounded-md"
                          >
                            Yearly
                            <Badge variant="secondary" className="ml-2">Save 20%</Badge>
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {subscriptionPlans.map((plan) => {
                          const price = billingPeriod === 'yearly' 
                            ? plan.price * 12 * 0.8 // 20% discount for yearly
                            : plan.price

                          return (
                            <Card
                              key={plan.id}
                              className={cn(
                                "relative cursor-pointer transition-all",
                                selectedPlan === plan.id && "ring-2 ring-blue-500",
                                plan.recommended && "border-blue-500"
                              )}
                              onClick={() => setSelectedPlan(plan.id)}
                            >
                              {plan.recommended && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                  <Badge className="bg-blue-500">Recommended</Badge>
                                </div>
                              )}
                              
                              <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                  {plan.name}
                                  {selectedPlan === plan.id && (
                                    <CheckCircle2 className="h-5 w-5 text-blue-500" />
                                  )}
                                </CardTitle>
                                <CardDescription>{plan.description}</CardDescription>
                              </CardHeader>
                              
                              <CardContent>
                                <div className="mb-4">
                                  <span className="text-3xl font-bold">
                                    {plan.currency} {price.toFixed(2)}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    /{billingPeriod === 'yearly' ? 'year' : 'month'}
                                  </span>
                                </div>

                                <div className="space-y-2 mb-4">
                                  {plan.features.map((feature, idx) => (
                                    <div key={idx} className="flex items-start gap-2">
                                      <Check className="h-4 w-4 text-green-500 mt-0.5" />
                                      <span className="text-sm">{feature}</span>
                                    </div>
                                  ))}
                                </div>

                                {plan.limitations.length > 0 && (
                                  <div className="space-y-2 pt-4 border-t">
                                    {plan.limitations.map((limitation, idx) => (
                                      <div key={idx} className="flex items-start gap-2">
                                        <X className="h-4 w-4 text-gray-400 mt-0.5" />
                                        <span className="text-sm text-gray-500">{limitation}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CreditCard className="h-5 w-5 text-blue-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-blue-700 dark:text-blue-300">
                              30-Day Free Trial
                            </p>
                            <p className="text-blue-600 dark:text-blue-400 mt-1">
                              All plans include a 30-day free trial. No credit card required to start.
                              You can upgrade, downgrade, or cancel anytime.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Project Templates Step */}
                  {steps[currentStep].id === 'templates' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Select Project Types</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose the types of projects you typically work on. We'll set up templates and workflows for each.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {projectTemplates.map((template) => (
                          <Card
                            key={template.id}
                            className={cn(
                              "cursor-pointer transition-all",
                              selectedTemplates.includes(template.id) && "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                            )}
                            onClick={() => toggleTemplate(template.id)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                  {template.icon}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-semibold">{template.name}</h4>
                                    <Checkbox
                                      checked={selectedTemplates.includes(template.id)}
                                      onCheckedChange={() => toggleTemplate(template.id)}
                                    />
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                    {template.description}
                                  </p>
                                  <div className="flex flex-wrap gap-1">
                                    {template.features.map((feature, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {feature}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <Sparkles className="h-5 w-5 text-purple-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-purple-700 dark:text-purple-300">
                              AI-Powered Templates
                            </p>
                            <p className="text-purple-600 dark:text-purple-400 mt-1">
                              ARIA AI will customize these templates based on your specific needs and 
                              learn from your workflow to suggest improvements over time.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Integrations Step */}
                  {steps[currentStep].id === 'integrations' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold mb-2">Connect Your Tools</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Integrate with your existing tools to streamline your workflow
                        </p>
                      </div>

                      <Tabs defaultValue="storage" className="w-full">
                        <TabsList className="grid w-full grid-cols-5">
                          <TabsTrigger value="storage">Storage</TabsTrigger>
                          <TabsTrigger value="communication">Comm</TabsTrigger>
                          <TabsTrigger value="design">Design</TabsTrigger>
                          <TabsTrigger value="project">Project</TabsTrigger>
                          <TabsTrigger value="accounting">Finance</TabsTrigger>
                        </TabsList>

                        {['storage', 'communication', 'design', 'project', 'accounting'].map((category) => (
                          <TabsContent key={category} value={category} className="mt-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {availableIntegrations
                                .filter(integration => integration.category === category)
                                .map((integration) => (
                                  <Card
                                    key={integration.id}
                                    className={cn(
                                      "cursor-pointer transition-all",
                                      selectedIntegrations.includes(integration.id) && "ring-2 ring-blue-500"
                                    )}
                                    onClick={() => toggleIntegration(integration.id)}
                                  >
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                            {integration.icon}
                                          </div>
                                          <div>
                                            <h4 className="font-semibold">{integration.name}</h4>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                              {integration.description}
                                            </p>
                                          </div>
                                        </div>
                                        <Switch
                                          checked={selectedIntegrations.includes(integration.id)}
                                          onCheckedChange={() => toggleIntegration(integration.id)}
                                        />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))
                              }
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>

                      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-yellow-700 dark:text-yellow-300">
                              Setup Later
                            </p>
                            <p className="text-yellow-600 dark:text-yellow-400 mt-1">
                              You can connect these integrations later from the Settings page.
                              Some integrations may require additional authentication.
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
                        {showConfetti && (
                          <Confetti
                            width={window.innerWidth}
                            height={window.innerHeight}
                            recycle={false}
                            numberOfPieces={200}
                            gravity={0.2}
                          />
                        )}
                        
                        <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                          <CheckCircle2 className="h-12 w-12 text-white" />
                        </div>
                        
                        <h2 className="text-3xl font-bold mb-4">You're All Set!</h2>
                        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
                          Your workspace has been configured successfully. You're ready to start managing 
                          your architecture projects with Daritana.
                        </p>

                        <div className="max-w-2xl mx-auto space-y-4">
                          <Card>
                            <CardContent className="p-6">
                              <h3 className="font-semibold mb-4">Setup Summary</h3>
                              <div className="space-y-3 text-left">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Organization</span>
                                  <span className="text-sm font-medium">{organizationData.name}</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Team Members</span>
                                  <span className="text-sm font-medium">
                                    {teamMembers.filter(m => m.email).length} invited
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Subscription</span>
                                  <span className="text-sm font-medium">
                                    {subscriptionPlans.find(p => p.id === selectedPlan)?.name} Plan
                                  </span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Project Templates</span>
                                  <span className="text-sm font-medium">{selectedTemplates.length} selected</span>
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Integrations</span>
                                  <span className="text-sm font-medium">{selectedIntegrations.length} connected</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="text-center">
                              <CardContent className="p-4">
                                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                                <h4 className="font-semibold text-sm">Quick Start Guide</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  Learn the basics in 5 minutes
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="text-center">
                              <CardContent className="p-4">
                                <HelpCircle className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                                <h4 className="font-semibold text-sm">Video Tutorials</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  Watch step-by-step guides
                                </p>
                              </CardContent>
                            </Card>

                            <Card className="text-center">
                              <CardContent className="p-4">
                                <Users className="h-8 w-8 text-green-500 mx-auto mb-2" />
                                <h4 className="font-semibold text-sm">Join Community</h4>
                                <p className="text-xs text-gray-600 mt-1">
                                  Connect with other architects
                                </p>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={currentStep === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>

                  <div className="flex items-center gap-2">
                    {currentStep > 0 && currentStep < steps.length - 1 && (
                      <Button
                        variant="ghost"
                        onClick={handleSkip}
                      >
                        Skip
                      </Button>
                    )}

                    {currentStep === steps.length - 1 ? (
                      <Button
                        onClick={handleComplete}
                        disabled={isLoading}
                        className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Setting up...
                          </>
                        ) : (
                          <>
                            Go to Dashboard
                            <Rocket className="h-4 w-4 ml-2" />
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNext}
                        disabled={!canProceed()}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}