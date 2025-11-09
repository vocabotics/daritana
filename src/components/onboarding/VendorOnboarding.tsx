import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2,
  Package,
  CreditCard,
  FileCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Upload,
  Plus,
  X,
  Shield,
  Award,
  Briefcase,
  MapPin,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  Users,
  FileText,
  AlertCircle,
  Banknote,
  Receipt,
  ShoppingBag,
  Truck,
  Wrench,
  HardHat,
  Palette,
  Ruler,
  Home,
  Factory,
  Sparkles,
  Check,
  Info,
  DollarSign,
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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useOnboardingStore } from '@/store/onboardingStore'
import { useNavigate } from 'react-router-dom'
import { marketplaceService } from '@/services/marketplace.service'

interface VendorOnboardingStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  completed: boolean
}

interface BusinessDetails {
  companyName: string
  registrationNumber: string
  taxNumber: string
  businessType: string
  establishedYear: string
  numberOfEmployees: string
  website: string
  description: string
  address: string
  city: string
  state: string
  postcode: string
  country: string
  contactPerson: string
  contactEmail: string
  contactPhone: string
  emergencyContact: string
  emergencyPhone: string
}

interface Service {
  id: string
  name: string
  category: string
  description: string
  unitPrice: number
  unit: string
  minimumOrder: number
  deliveryTime: string
  availability: boolean
}

interface Product {
  id: string
  name: string
  category: string
  brand: string
  description: string
  price: number
  unit: string
  inStock: number
  leadTime: string
  warranty: string
  specifications: string
}

interface PaymentDetails {
  bankName: string
  accountName: string
  accountNumber: string
  swiftCode: string
  bankAddress: string
  paymentTerms: string
  creditLimit: number
  preferredCurrency: string
  taxExempt: boolean
  acceptedPaymentMethods: {
    bankTransfer: boolean
    creditCard: boolean
    fpx: boolean
    cheque: boolean
    cash: boolean
  }
  invoiceEmail: string
  billingAddress: string
}

interface Certification {
  id: string
  name: string
  issuingBody: string
  issueDate: string
  expiryDate: string
  certificateNumber: string
  file?: File
}

interface Insurance {
  type: string
  provider: string
  policyNumber: string
  coverageAmount: number
  expiryDate: string
  file?: File
}

export const VendorOnboarding: React.FC = () => {
  const navigate = useNavigate()
  const { user, completeOnboarding } = useAuthStore()
  const { setVendorOnboardingComplete } = useOnboardingStore()
  const [currentStep, setCurrentStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)

  // Step states
  const [businessDetails, setBusinessDetails] = useState<BusinessDetails>({
    companyName: '',
    registrationNumber: '',
    taxNumber: '',
    businessType: '',
    establishedYear: new Date().getFullYear().toString(),
    numberOfEmployees: '',
    website: '',
    description: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Malaysia',
    contactPerson: user?.name || '',
    contactEmail: user?.email || '',
    contactPhone: '',
    emergencyContact: '',
    emergencyPhone: '',
  })

  const [services, setServices] = useState<Service[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [vendorType, setVendorType] = useState<'services' | 'products' | 'both'>('services')

  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails>({
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    bankAddress: '',
    paymentTerms: '30',
    creditLimit: 50000,
    preferredCurrency: 'MYR',
    taxExempt: false,
    acceptedPaymentMethods: {
      bankTransfer: true,
      creditCard: false,
      fpx: true,
      cheque: false,
      cash: false,
    },
    invoiceEmail: user?.email || '',
    billingAddress: '',
  })

  const [certifications, setCertifications] = useState<Certification[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [agreementsAccepted, setAgreementsAccepted] = useState({
    terms: false,
    marketplace: false,
    dataProtection: false,
    qualityStandards: false,
  })

  const steps: VendorOnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to Marketplace',
      description: 'Register as a vendor/supplier',
      icon: <Sparkles className="h-6 w-6" />,
      completed: true,
    },
    {
      id: 'business',
      title: 'Business Details',
      description: 'Company registration information',
      icon: <Building2 className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'catalog',
      title: 'Services & Products',
      description: 'What you offer',
      icon: <Package className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'payment',
      title: 'Payment & Banking',
      description: 'Financial information',
      icon: <CreditCard className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'compliance',
      title: 'Certifications',
      description: 'Licenses and compliance',
      icon: <FileCheck className="h-6 w-6" />,
      completed: false,
    },
    {
      id: 'complete',
      title: 'Verification',
      description: 'Review and submit',
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

  const addService = () => {
    const newService: Service = {
      id: Date.now().toString(),
      name: '',
      category: '',
      description: '',
      unitPrice: 0,
      unit: 'hour',
      minimumOrder: 1,
      deliveryTime: '1-3 days',
      availability: true,
    }
    setServices([...services, newService])
  }

  const updateService = (id: string, field: keyof Service, value: any) => {
    setServices(services.map(s => s.id === id ? { ...s, [field]: value } : s))
  }

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id))
  }

  const addProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      name: '',
      category: '',
      brand: '',
      description: '',
      price: 0,
      unit: 'piece',
      inStock: 0,
      leadTime: '1-3 days',
      warranty: '1 year',
      specifications: '',
    }
    setProducts([...products, newProduct])
  }

  const updateProduct = (id: string, field: keyof Product, value: any) => {
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p))
  }

  const removeProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id))
  }

  const addCertification = () => {
    const newCert: Certification = {
      id: Date.now().toString(),
      name: '',
      issuingBody: '',
      issueDate: '',
      expiryDate: '',
      certificateNumber: '',
    }
    setCertifications([...certifications, newCert])
  }

  const updateCertification = (id: string, field: keyof Certification, value: any) => {
    setCertifications(certifications.map(c => c.id === id ? { ...c, [field]: value } : c))
  }

  const removeCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id))
  }

  const addInsurance = () => {
    const newInsurance: Insurance = {
      type: '',
      provider: '',
      policyNumber: '',
      coverageAmount: 0,
      expiryDate: '',
    }
    setInsurances([...insurances, newInsurance])
  }

  const handleComplete = async () => {
    setIsLoading(true)
    
    try {
      // Create vendor profile
      const vendorData = {
        businessDetails,
        services: vendorType === 'products' ? [] : services,
        products: vendorType === 'services' ? [] : products,
        paymentDetails,
        certifications,
        insurances,
        vendorType,
        status: 'pending_verification',
      }

      // Save to backend
      await marketplaceService.createVendorProfile(vendorData)

      // Mark vendor onboarding as complete in onboarding store (memory-only, no localStorage)
      setVendorOnboardingComplete(true)

      // Also complete onboarding in auth store
      await completeOnboarding('vendor')

      toast.success('Vendor registration submitted! We\'ll review your application within 2-3 business days.')
      
      // Redirect to marketplace dashboard
      setTimeout(() => {
        navigate('/marketplace/vendor-dashboard')
      }, 2000)
    } catch (error: any) {
      console.error('Vendor registration error:', error)
      toast.error(error.message || 'Failed to submit registration. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true
      case 'business':
        return businessDetails.companyName && 
               businessDetails.registrationNumber && 
               businessDetails.contactEmail && 
               businessDetails.contactPhone
      case 'catalog':
        return (vendorType === 'services' && services.length > 0) ||
               (vendorType === 'products' && products.length > 0) ||
               (vendorType === 'both' && services.length > 0 && products.length > 0)
      case 'payment':
        return paymentDetails.bankName && 
               paymentDetails.accountName && 
               paymentDetails.accountNumber
      case 'compliance':
        return true // Certifications are optional
      case 'complete':
        return Object.values(agreementsAccepted).every(v => v === true)
      default:
        return false
    }
  }

  const serviceCategories = [
    'Architecture Design',
    'Interior Design',
    'Construction',
    'Electrical',
    'Plumbing',
    'HVAC',
    'Landscaping',
    'Project Management',
    'Consultation',
    'Surveying',
    'Engineering',
    'Renovation',
  ]

  const productCategories = [
    'Building Materials',
    'Electrical Components',
    'Plumbing Fixtures',
    'Flooring',
    'Lighting',
    'Furniture',
    'Paint & Finishes',
    'Hardware',
    'Safety Equipment',
    'Tools',
    'Decorative Items',
    'Smart Home Devices',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
            Vendor Registration Portal
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Join our marketplace and connect with architecture & construction professionals
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
                  index <= currentStep ? "text-purple-600" : "text-gray-400",
                  index === currentStep && "scale-110"
                )}
                onClick={() => index < currentStep && setCurrentStep(index)}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all",
                  index < currentStep ? "bg-purple-600 text-white" : 
                  index === currentStep ? "bg-purple-100 text-purple-600 ring-2 ring-purple-600" : 
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
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto">
                      <ShoppingBag className="h-12 w-12 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-semibold mb-2">
                        Become a Verified Vendor
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                        Join Malaysia's premier architecture and construction marketplace. 
                        Connect with thousands of professionals and grow your business.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <Card className="p-4">
                        <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-semibold">Grow Revenue</h4>
                        <p className="text-sm text-gray-600">Access new clients and projects</p>
                      </Card>
                      <Card className="p-4">
                        <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-semibold">Network</h4>
                        <p className="text-sm text-gray-600">Connect with industry professionals</p>
                      </Card>
                      <Card className="p-4">
                        <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                        <h4 className="font-semibold">Secure Payments</h4>
                        <p className="text-sm text-gray-600">Protected transactions</p>
                      </Card>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                      <Badge variant="outline" className="py-1 px-3">
                        <Clock className="h-3 w-3 mr-1" />
                        Takes 10-15 minutes
                      </Badge>
                      <Badge variant="outline" className="py-1 px-3">
                        <FileCheck className="h-3 w-3 mr-1" />
                        Verification in 2-3 days
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Business Details Step */}
                {steps[currentStep].id === 'business' && (
                  <div className="space-y-6">
                    <Tabs defaultValue="company" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="company">Company Information</TabsTrigger>
                        <TabsTrigger value="contact">Contact Details</TabsTrigger>
                      </TabsList>

                      <TabsContent value="company" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="companyName">Company Name *</Label>
                            <Input
                              id="companyName"
                              value={businessDetails.companyName}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, companyName: e.target.value })}
                              placeholder="ABC Construction Sdn Bhd"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="registrationNumber">Registration Number (SSM) *</Label>
                            <Input
                              id="registrationNumber"
                              value={businessDetails.registrationNumber}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, registrationNumber: e.target.value })}
                              placeholder="202301234567"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="taxNumber">Tax Number (GST)</Label>
                            <Input
                              id="taxNumber"
                              value={businessDetails.taxNumber}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, taxNumber: e.target.value })}
                              placeholder="000123456789"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="businessType">Business Type *</Label>
                            <Select
                              value={businessDetails.businessType}
                              onValueChange={(value) => setBusinessDetails({ ...businessDetails, businessType: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="contractor">General Contractor</SelectItem>
                                <SelectItem value="subcontractor">Sub-Contractor</SelectItem>
                                <SelectItem value="supplier">Material Supplier</SelectItem>
                                <SelectItem value="manufacturer">Manufacturer</SelectItem>
                                <SelectItem value="consultant">Consultant</SelectItem>
                                <SelectItem value="service">Service Provider</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="establishedYear">Established Year</Label>
                            <Input
                              id="establishedYear"
                              type="number"
                              value={businessDetails.establishedYear}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, establishedYear: e.target.value })}
                              min="1900"
                              max={new Date().getFullYear()}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="numberOfEmployees">Number of Employees</Label>
                            <Select
                              value={businessDetails.numberOfEmployees}
                              onValueChange={(value) => setBusinessDetails({ ...businessDetails, numberOfEmployees: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select range" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1-10">1-10</SelectItem>
                                <SelectItem value="11-50">11-50</SelectItem>
                                <SelectItem value="51-200">51-200</SelectItem>
                                <SelectItem value="201-500">201-500</SelectItem>
                                <SelectItem value="500+">500+</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="website">Company Website</Label>
                          <Input
                            id="website"
                            type="url"
                            value={businessDetails.website}
                            onChange={(e) => setBusinessDetails({ ...businessDetails, website: e.target.value })}
                            placeholder="https://www.example.com"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="description">Business Description</Label>
                          <Textarea
                            id="description"
                            value={businessDetails.description}
                            onChange={(e) => setBusinessDetails({ ...businessDetails, description: e.target.value })}
                            placeholder="Describe your business, specializations, and experience..."
                            rows={4}
                          />
                        </div>
                      </TabsContent>

                      <TabsContent value="contact" className="space-y-4 mt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">Business Address *</Label>
                            <Input
                              id="address"
                              value={businessDetails.address}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, address: e.target.value })}
                              placeholder="123, Jalan Example, Taman Business"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="city">City *</Label>
                            <Input
                              id="city"
                              value={businessDetails.city}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, city: e.target.value })}
                              placeholder="Kuala Lumpur"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="state">State *</Label>
                            <Select
                              value={businessDetails.state}
                              onValueChange={(value) => setBusinessDetails({ ...businessDetails, state: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Kuala Lumpur">Kuala Lumpur</SelectItem>
                                <SelectItem value="Selangor">Selangor</SelectItem>
                                <SelectItem value="Penang">Penang</SelectItem>
                                <SelectItem value="Johor">Johor</SelectItem>
                                <SelectItem value="Perak">Perak</SelectItem>
                                <SelectItem value="Pahang">Pahang</SelectItem>
                                <SelectItem value="Negeri Sembilan">Negeri Sembilan</SelectItem>
                                <SelectItem value="Melaka">Melaka</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="postcode">Postcode *</Label>
                            <Input
                              id="postcode"
                              value={businessDetails.postcode}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, postcode: e.target.value })}
                              placeholder="50450"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Input
                              id="country"
                              value={businessDetails.country}
                              disabled
                            />
                          </div>
                        </div>

                        <Separator />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contactPerson">Contact Person *</Label>
                            <Input
                              id="contactPerson"
                              value={businessDetails.contactPerson}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, contactPerson: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactEmail">Contact Email *</Label>
                            <Input
                              id="contactEmail"
                              type="email"
                              value={businessDetails.contactEmail}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, contactEmail: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="contactPhone">Contact Phone *</Label>
                            <Input
                              id="contactPhone"
                              value={businessDetails.contactPhone}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, contactPhone: e.target.value })}
                              placeholder="+60 12-345 6789"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="emergencyContact">Emergency Contact</Label>
                            <Input
                              id="emergencyContact"
                              value={businessDetails.emergencyContact}
                              onChange={(e) => setBusinessDetails({ ...businessDetails, emergencyContact: e.target.value })}
                            />
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </div>
                )}

                {/* Services & Products Step */}
                {steps[currentStep].id === 'catalog' && (
                  <div className="space-y-6">
                    {/* Vendor Type Selection */}
                    <div className="space-y-3">
                      <Label>What do you offer?</Label>
                      <RadioGroup
                        value={vendorType}
                        onValueChange={(value: any) => setVendorType(value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="services" id="services" />
                          <Label htmlFor="services" className="cursor-pointer">
                            Services Only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="products" id="products" />
                          <Label htmlFor="products" className="cursor-pointer">
                            Products Only
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="both" id="both" />
                          <Label htmlFor="both" className="cursor-pointer">
                            Both Services and Products
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <Separator />

                    {/* Services Section */}
                    {(vendorType === 'services' || vendorType === 'both') && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Services Offered</h4>
                          <Button onClick={addService} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Service
                          </Button>
                        </div>

                        {services.length === 0 ? (
                          <Card className="p-8 text-center text-gray-500">
                            <Wrench className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No services added yet</p>
                            <p className="text-sm">Click "Add Service" to get started</p>
                          </Card>
                        ) : (
                          <div className="space-y-4">
                            {services.map((service, index) => (
                              <Card key={service.id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <h5 className="font-medium">Service #{index + 1}</h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeService(service.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Service Name *</Label>
                                    <Input
                                      value={service.name}
                                      onChange={(e) => updateService(service.id, 'name', e.target.value)}
                                      placeholder="e.g., Interior Design Consultation"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                      value={service.category}
                                      onValueChange={(value) => updateService(service.id, 'category', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {serviceCategories.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit Price (RM) *</Label>
                                    <Input
                                      type="number"
                                      value={service.unitPrice}
                                      onChange={(e) => updateService(service.id, 'unitPrice', parseFloat(e.target.value))}
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit *</Label>
                                    <Select
                                      value={service.unit}
                                      onValueChange={(value) => updateService(service.id, 'unit', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="hour">Per Hour</SelectItem>
                                        <SelectItem value="day">Per Day</SelectItem>
                                        <SelectItem value="project">Per Project</SelectItem>
                                        <SelectItem value="sqft">Per Sq Ft</SelectItem>
                                        <SelectItem value="sqm">Per Sq M</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Description</Label>
                                    <Textarea
                                      value={service.description}
                                      onChange={(e) => updateService(service.id, 'description', e.target.value)}
                                      placeholder="Describe the service..."
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Products Section */}
                    {(vendorType === 'products' || vendorType === 'both') && (
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="font-semibold">Products Catalog</h4>
                          <Button onClick={addProduct} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Product
                          </Button>
                        </div>

                        {products.length === 0 ? (
                          <Card className="p-8 text-center text-gray-500">
                            <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No products added yet</p>
                            <p className="text-sm">Click "Add Product" to get started</p>
                          </Card>
                        ) : (
                          <div className="space-y-4">
                            {products.map((product, index) => (
                              <Card key={product.id} className="p-4">
                                <div className="flex justify-between items-start mb-3">
                                  <h5 className="font-medium">Product #{index + 1}</h5>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeProduct(product.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label>Product Name *</Label>
                                    <Input
                                      value={product.name}
                                      onChange={(e) => updateProduct(product.id, 'name', e.target.value)}
                                      placeholder="e.g., Premium Floor Tiles"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <Select
                                      value={product.category}
                                      onValueChange={(value) => updateProduct(product.id, 'category', value)}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {productCategories.map(cat => (
                                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input
                                      value={product.brand}
                                      onChange={(e) => updateProduct(product.id, 'brand', e.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Price (RM) *</Label>
                                    <Input
                                      type="number"
                                      value={product.price}
                                      onChange={(e) => updateProduct(product.id, 'price', parseFloat(e.target.value))}
                                      min="0"
                                      step="0.01"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Unit *</Label>
                                    <Input
                                      value={product.unit}
                                      onChange={(e) => updateProduct(product.id, 'unit', e.target.value)}
                                      placeholder="e.g., piece, box, sqm"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Stock Available</Label>
                                    <Input
                                      type="number"
                                      value={product.inStock}
                                      onChange={(e) => updateProduct(product.id, 'inStock', parseInt(e.target.value))}
                                      min="0"
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <Label>Specifications</Label>
                                    <Textarea
                                      value={product.specifications}
                                      onChange={(e) => updateProduct(product.id, 'specifications', e.target.value)}
                                      placeholder="Technical specifications, dimensions, materials..."
                                      rows={2}
                                    />
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Payment & Banking Step */}
                {steps[currentStep].id === 'payment' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Banknote className="h-5 w-5" />
                        Banking Information
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="bankName">Bank Name *</Label>
                          <Select
                            value={paymentDetails.bankName}
                            onValueChange={(value) => setPaymentDetails({ ...paymentDetails, bankName: value })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select bank" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Maybank">Maybank</SelectItem>
                              <SelectItem value="CIMB">CIMB Bank</SelectItem>
                              <SelectItem value="Public Bank">Public Bank</SelectItem>
                              <SelectItem value="RHB">RHB Bank</SelectItem>
                              <SelectItem value="Hong Leong">Hong Leong Bank</SelectItem>
                              <SelectItem value="AmBank">AmBank</SelectItem>
                              <SelectItem value="Bank Islam">Bank Islam</SelectItem>
                              <SelectItem value="OCBC">OCBC Bank</SelectItem>
                              <SelectItem value="HSBC">HSBC</SelectItem>
                              <SelectItem value="Standard Chartered">Standard Chartered</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountName">Account Name *</Label>
                          <Input
                            id="accountName"
                            value={paymentDetails.accountName}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, accountName: e.target.value })}
                            placeholder="ABC Construction Sdn Bhd"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountNumber">Account Number *</Label>
                          <Input
                            id="accountNumber"
                            value={paymentDetails.accountNumber}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })}
                            placeholder="1234567890"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="swiftCode">SWIFT Code</Label>
                          <Input
                            id="swiftCode"
                            value={paymentDetails.swiftCode}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, swiftCode: e.target.value })}
                            placeholder="MBBEMYKL"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bankAddress">Bank Branch Address</Label>
                        <Input
                          id="bankAddress"
                          value={paymentDetails.bankAddress}
                          onChange={(e) => setPaymentDetails({ ...paymentDetails, bankAddress: e.target.value })}
                          placeholder="Branch name and address"
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-semibold flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Payment Terms
                      </h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentTerms">Standard Payment Terms (Days)</Label>
                          <Select
                            value={paymentDetails.paymentTerms}
                            onValueChange={(value) => setPaymentDetails({ ...paymentDetails, paymentTerms: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="0">Immediate</SelectItem>
                              <SelectItem value="7">7 Days</SelectItem>
                              <SelectItem value="14">14 Days</SelectItem>
                              <SelectItem value="30">30 Days</SelectItem>
                              <SelectItem value="60">60 Days</SelectItem>
                              <SelectItem value="90">90 Days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="creditLimit">Suggested Credit Limit (RM)</Label>
                          <Input
                            id="creditLimit"
                            type="number"
                            value={paymentDetails.creditLimit}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, creditLimit: parseFloat(e.target.value) })}
                            min="0"
                            step="1000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="preferredCurrency">Preferred Currency</Label>
                          <Select
                            value={paymentDetails.preferredCurrency}
                            onValueChange={(value) => setPaymentDetails({ ...paymentDetails, preferredCurrency: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MYR">Malaysian Ringgit (MYR)</SelectItem>
                              <SelectItem value="USD">US Dollar (USD)</SelectItem>
                              <SelectItem value="SGD">Singapore Dollar (SGD)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="invoiceEmail">Invoice Email</Label>
                          <Input
                            id="invoiceEmail"
                            type="email"
                            value={paymentDetails.invoiceEmail}
                            onChange={(e) => setPaymentDetails({ ...paymentDetails, invoiceEmail: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label>Accepted Payment Methods</Label>
                        <div className="space-y-2">
                          {Object.entries(paymentDetails.acceptedPaymentMethods).map(([method, accepted]) => (
                            <div key={method} className="flex items-center space-x-2">
                              <Checkbox
                                checked={accepted}
                                onCheckedChange={(checked) => 
                                  setPaymentDetails({
                                    ...paymentDetails,
                                    acceptedPaymentMethods: {
                                      ...paymentDetails.acceptedPaymentMethods,
                                      [method]: checked as boolean
                                    }
                                  })
                                }
                              />
                              <Label className="font-normal cursor-pointer capitalize">
                                {method.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Compliance Step */}
                {steps[currentStep].id === 'compliance' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Certifications & Licenses
                        </h4>
                        <Button onClick={addCertification} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Certification
                        </Button>
                      </div>

                      {certifications.length === 0 ? (
                        <Card className="p-6 text-center text-gray-500">
                          <FileCheck className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No certifications added</p>
                          <p className="text-xs">Optional but recommended for verification</p>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {certifications.map((cert, index) => (
                            <Card key={cert.id} className="p-4">
                              <div className="flex justify-between items-start mb-3">
                                <h5 className="font-medium">Certification #{index + 1}</h5>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeCertification(cert.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Certification Name</Label>
                                  <Input
                                    value={cert.name}
                                    onChange={(e) => updateCertification(cert.id, 'name', e.target.value)}
                                    placeholder="e.g., ISO 9001:2015"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Issuing Body</Label>
                                  <Input
                                    value={cert.issuingBody}
                                    onChange={(e) => updateCertification(cert.id, 'issuingBody', e.target.value)}
                                    placeholder="e.g., SIRIM"
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Issue Date</Label>
                                  <Input
                                    type="date"
                                    value={cert.issueDate}
                                    onChange={(e) => updateCertification(cert.id, 'issueDate', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Expiry Date</Label>
                                  <Input
                                    type="date"
                                    value={cert.expiryDate}
                                    onChange={(e) => updateCertification(cert.id, 'expiryDate', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Certificate Number</Label>
                                  <Input
                                    value={cert.certificateNumber}
                                    onChange={(e) => updateCertification(cert.id, 'certificateNumber', e.target.value)}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Upload Certificate</Label>
                                  <Button variant="outline" size="sm" className="w-full">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Choose File
                                  </Button>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Shield className="h-5 w-5" />
                          Insurance Coverage
                        </h4>
                        <Button onClick={addInsurance} size="sm" variant="outline">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Insurance
                        </Button>
                      </div>

                      {insurances.length === 0 ? (
                        <Card className="p-6 text-center text-gray-500">
                          <Shield className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                          <p className="text-sm">No insurance policies added</p>
                          <p className="text-xs">Optional but increases trust</p>
                        </Card>
                      ) : (
                        <div className="space-y-3">
                          {insurances.map((insurance, index) => (
                            <Card key={index} className="p-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Insurance Type</Label>
                                  <Select
                                    value={insurance.type}
                                    onValueChange={(value) => {
                                      const updated = [...insurances]
                                      updated[index].type = value
                                      setInsurances(updated)
                                    }}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="general">General Liability</SelectItem>
                                      <SelectItem value="professional">Professional Indemnity</SelectItem>
                                      <SelectItem value="product">Product Liability</SelectItem>
                                      <SelectItem value="workers">Workers Compensation</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-2">
                                  <Label>Insurance Provider</Label>
                                  <Input
                                    value={insurance.provider}
                                    onChange={(e) => {
                                      const updated = [...insurances]
                                      updated[index].provider = e.target.value
                                      setInsurances(updated)
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Policy Number</Label>
                                  <Input
                                    value={insurance.policyNumber}
                                    onChange={(e) => {
                                      const updated = [...insurances]
                                      updated[index].policyNumber = e.target.value
                                      setInsurances(updated)
                                    }}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Coverage Amount (RM)</Label>
                                  <Input
                                    type="number"
                                    value={insurance.coverageAmount}
                                    onChange={(e) => {
                                      const updated = [...insurances]
                                      updated[index].coverageAmount = parseFloat(e.target.value)
                                      setInsurances(updated)
                                    }}
                                  />
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Complete Step */}
                {steps[currentStep].id === 'complete' && (
                  <div className="space-y-6">
                    <div className="text-center py-4">
                      <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="h-10 w-10 text-white" />
                      </div>
                      
                      <h3 className="text-xl font-bold mb-2">Almost There!</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        Review your information and accept the terms to complete registration
                      </p>
                    </div>

                    {/* Summary */}
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="business">
                        <AccordionTrigger>Business Information</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Company</span>
                              <span className="font-medium">{businessDetails.companyName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Registration</span>
                              <span className="font-medium">{businessDetails.registrationNumber}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Type</span>
                              <span className="font-medium capitalize">{businessDetails.businessType}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Contact</span>
                              <span className="font-medium">{businessDetails.contactPhone}</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="offerings">
                        <AccordionTrigger>Services & Products</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            {services.length > 0 && (
                              <div>
                                <span className="text-gray-600">Services: </span>
                                <span className="font-medium">{services.length} added</span>
                              </div>
                            )}
                            {products.length > 0 && (
                              <div>
                                <span className="text-gray-600">Products: </span>
                                <span className="font-medium">{products.length} added</span>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="payment">
                        <AccordionTrigger>Payment Details</AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bank</span>
                              <span className="font-medium">{paymentDetails.bankName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account</span>
                              <span className="font-medium">****{paymentDetails.accountNumber.slice(-4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Payment Terms</span>
                              <span className="font-medium">{paymentDetails.paymentTerms} days</span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    {/* Terms & Agreements */}
                    <Card className="p-4 bg-gray-50 dark:bg-gray-800">
                      <h4 className="font-semibold mb-3">Terms & Agreements</h4>
                      <div className="space-y-3">
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            checked={agreementsAccepted.terms}
                            onCheckedChange={(checked) => 
                              setAgreementsAccepted({ ...agreementsAccepted, terms: checked as boolean })
                            }
                          />
                          <Label className="font-normal text-sm cursor-pointer">
                            I accept the <span className="text-blue-600 underline">Terms of Service</span> and 
                            <span className="text-blue-600 underline"> Privacy Policy</span>
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            checked={agreementsAccepted.marketplace}
                            onCheckedChange={(checked) => 
                              setAgreementsAccepted({ ...agreementsAccepted, marketplace: checked as boolean })
                            }
                          />
                          <Label className="font-normal text-sm cursor-pointer">
                            I agree to the <span className="text-blue-600 underline">Marketplace Agreement</span> and 
                            commission structure
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            checked={agreementsAccepted.dataProtection}
                            onCheckedChange={(checked) => 
                              setAgreementsAccepted({ ...agreementsAccepted, dataProtection: checked as boolean })
                            }
                          />
                          <Label className="font-normal text-sm cursor-pointer">
                            I consent to data processing under PDPA regulations
                          </Label>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Checkbox
                            checked={agreementsAccepted.qualityStandards}
                            onCheckedChange={(checked) => 
                              setAgreementsAccepted({ ...agreementsAccepted, qualityStandards: checked as boolean })
                            }
                          />
                          <Label className="font-normal text-sm cursor-pointer">
                            I commit to maintaining quality standards and professional conduct
                          </Label>
                        </div>
                      </div>
                    </Card>

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                      <div className="flex gap-3">
                        <Info className="h-5 w-5 text-yellow-600 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                            Verification Process
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            Your application will be reviewed within 2-3 business days. 
                            You'll receive an email once your vendor account is approved.
                          </p>
                        </div>
                      </div>
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
              {currentStep > 0 && currentStep < steps.length - 2 && (
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
              )}
              
              {currentStep === steps.length - 1 ? (
                <Button 
                  onClick={handleComplete} 
                  disabled={!canProceed() || isLoading}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
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