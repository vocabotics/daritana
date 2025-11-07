import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Calendar,
  Clock,
  Award,
  Target,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Users,
  Building,
  GraduationCap,
  Presentation,
  Video,
  FileText,
  Lightbulb,
  User,
  Coffee
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface CPDCategory {
  id: string
  name: string
  description?: string
  requiredHours: number
  color: string
  icon: React.ReactNode
}

interface CPDRecord {
  id: string
  employee?: {
    user: {
      firstName: string
      lastName: string
      avatar?: string
    }
    employeeId: string
  }
  category?: {
    name: string
  }
  title: string
  description?: string
  provider?: string
  type: string
  hours: number
  cost?: number
  startDate: string
  endDate?: string
  completionDate?: string
  status: string
  certificateUrl?: string
  learningOutcomes?: string
  reflection?: string
  verifiedBy?: string
  verifiedAt?: string
}

interface CPDProgress {
  category: {
    name: string
    requiredHours: number
    color: string
  }
  totalHours: number
  completedHours: number
  percentage: number
}

const CPDTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('records')
  const [cpdRecords, setCpdRecords] = useState<CPDRecord[]>([])
  const [cpdProgress, setCpdProgress] = useState<CPDProgress[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isNewRecordOpen, setIsNewRecordOpen] = useState(false)

  const cpdCategories: CPDCategory[] = [
    {
      id: '1',
      name: 'Technical Skills',
      description: 'Software, tools, and technical competencies',
      requiredHours: 20,
      color: 'text-blue-600',
      icon: <GraduationCap className="h-4 w-4" />
    },
    {
      id: '2',
      name: 'Professional Development',
      description: 'Leadership, management, and soft skills',
      requiredHours: 15,
      color: 'text-green-600',
      icon: <TrendingUp className="h-4 w-4" />
    },
    {
      id: '3',
      name: 'Industry Knowledge',
      description: 'Architecture, design, and building codes',
      requiredHours: 25,
      color: 'text-purple-600',
      icon: <Building className="h-4 w-4" />
    },
    {
      id: '4',
      name: 'Compliance & Safety',
      description: 'Legal, regulatory, and safety requirements',
      requiredHours: 10,
      color: 'text-red-600',
      icon: <AlertCircle className="h-4 w-4" />
    }
  ]

  const cpdTypes = [
    { value: 'FORMAL_COURSE', label: 'Formal Course', icon: <BookOpen className="h-4 w-4" /> },
    { value: 'CONFERENCE', label: 'Conference', icon: <Users className="h-4 w-4" /> },
    { value: 'WORKSHOP', label: 'Workshop', icon: <Presentation className="h-4 w-4" /> },
    { value: 'SEMINAR', label: 'Seminar', icon: <Coffee className="h-4 w-4" /> },
    { value: 'WEBINAR', label: 'Webinar', icon: <Video className="h-4 w-4" /> },
    { value: 'READING', label: 'Reading', icon: <FileText className="h-4 w-4" /> },
    { value: 'RESEARCH', label: 'Research', icon: <Lightbulb className="h-4 w-4" /> },
    { value: 'MENTORING', label: 'Mentoring', icon: <User className="h-4 w-4" /> }
  ]

  // Mock data
  const mockCPDRecords: CPDRecord[] = [
    {
      id: '1',
      employee: {
        user: {
          firstName: 'Ahmad',
          lastName: 'Rahman',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP001'
      },
      category: { name: 'Technical Skills' },
      title: 'Advanced AutoCAD 3D Modeling',
      description: 'Comprehensive course on 3D modeling techniques in AutoCAD',
      provider: 'Autodesk Training Center',
      type: 'FORMAL_COURSE',
      hours: 16,
      cost: 1200,
      startDate: '2024-07-01',
      endDate: '2024-07-05',
      completionDate: '2024-07-05',
      status: 'COMPLETED',
      certificateUrl: 'https://example.com/certificate',
      learningOutcomes: 'Gained proficiency in 3D modeling, surface modeling, and rendering techniques',
      reflection: 'This course significantly improved my design visualization capabilities'
    },
    {
      id: '2',
      employee: {
        user: {
          firstName: 'Siti',
          lastName: 'Nurhaliza',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP002'
      },
      category: { name: 'Professional Development' },
      title: 'Project Leadership Masterclass',
      description: 'Leadership skills for project managers',
      provider: 'Leadership Institute Malaysia',
      type: 'WORKSHOP',
      hours: 8,
      cost: 800,
      startDate: '2024-08-10',
      endDate: '2024-08-10',
      status: 'IN_PROGRESS',
      learningOutcomes: 'Developing team leadership and communication skills'
    },
    {
      id: '3',
      employee: {
        user: {
          firstName: 'Lee',
          lastName: 'Wei Ming',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP003'
      },
      category: { name: 'Industry Knowledge' },
      title: 'Malaysian Building Code Updates 2024',
      description: 'Latest updates to building codes and regulations',
      provider: 'Board of Architects Malaysia',
      type: 'SEMINAR',
      hours: 4,
      cost: 250,
      startDate: '2024-09-15',
      status: 'PLANNED'
    }
  ]

  const mockCPDProgress: CPDProgress[] = [
    {
      category: {
        name: 'Technical Skills',
        requiredHours: 20,
        color: 'text-blue-600'
      },
      totalHours: 20,
      completedHours: 16,
      percentage: 80
    },
    {
      category: {
        name: 'Professional Development',
        requiredHours: 15,
        color: 'text-green-600'
      },
      totalHours: 15,
      completedHours: 8,
      percentage: 53
    },
    {
      category: {
        name: 'Industry Knowledge',
        requiredHours: 25,
        color: 'text-purple-600'
      },
      totalHours: 25,
      completedHours: 4,
      percentage: 16
    },
    {
      category: {
        name: 'Compliance & Safety',
        requiredHours: 10,
        color: 'text-red-600'
      },
      totalHours: 10,
      completedHours: 0,
      percentage: 0
    }
  ]

  useEffect(() => {
    setCpdRecords(mockCPDRecords)
    setCpdProgress(mockCPDProgress)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PLANNED': return 'bg-blue-100 text-blue-800'
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800'
      case 'COMPLETED': return 'bg-green-100 text-green-800'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800'
      case 'VERIFIED': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    const typeData = cpdTypes.find(t => t.value === type)
    return typeData?.icon || <BookOpen className="h-4 w-4" />
  }

  const getTypeLabel = (type: string) => {
    const typeData = cpdTypes.find(t => t.value === type)
    return typeData?.label || type.replace('_', ' ')
  }

  const filteredRecords = cpdRecords.filter(record => {
    const matchesSearch = 
      record.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee?.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee?.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = typeFilter === 'all' || record.type === typeFilter
    const matchesStatus = statusFilter === 'all' || record.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesType && matchesStatus
  })

  const totalCPDHours = cpdProgress.reduce((sum, progress) => sum + progress.completedHours, 0)
  const totalRequiredHours = cpdProgress.reduce((sum, progress) => sum + progress.category.requiredHours, 0)
  const overallProgress = totalRequiredHours > 0 ? (totalCPDHours / totalRequiredHours) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">CPD Tracker</h2>
          <p className="text-muted-foreground">Continuous Professional Development tracking and management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewRecordOpen} onOpenChange={setIsNewRecordOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add CPD Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add CPD Record</DialogTitle>
                <DialogDescription>
                  Record your professional development activity
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" placeholder="Course or activity title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Input id="provider" placeholder="Training provider" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the activity" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <select id="category" className="w-full px-3 py-2 border rounded-md">
                      {cpdCategories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select id="type" className="w-full px-3 py-2 border rounded-md">
                      {cpdTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hours">Hours</Label>
                    <Input id="hours" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost (RM)</Label>
                    <Input id="cost" type="number" placeholder="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select id="status" className="w-full px-3 py-2 border rounded-md">
                      <option value="PLANNED">Planned</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-date">Start Date</Label>
                    <Input id="start-date" type="date" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end-date">End Date</Label>
                    <Input id="end-date" type="date" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learning-outcomes">Learning Outcomes</Label>
                  <Textarea id="learning-outcomes" placeholder="What did you learn or achieve?" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewRecordOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsNewRecordOpen(false)}>
                    Save Record
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CPD Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-2 lg:col-span-1"
        >
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Overall Progress</CardTitle>
              <CardDescription>Annual CPD requirement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{totalCPDHours}h</span>
                  <span className="text-sm text-muted-foreground">of {totalRequiredHours}h</span>
                </div>
                <Progress value={overallProgress} className="h-3" />
                <div className="text-sm text-center text-muted-foreground">
                  {overallProgress.toFixed(1)}% complete
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {cpdProgress.map((progress, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: (index + 1) * 0.1 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={progress.category.color}>
                    {cpdCategories.find(c => c.name === progress.category.name)?.icon}
                  </div>
                  {progress.category.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{progress.completedHours}h</span>
                    <span className="text-sm text-muted-foreground">of {progress.category.requiredHours}h</span>
                  </div>
                  <Progress value={progress.percentage} className="h-2" />
                  <div className="text-sm text-center text-muted-foreground">
                    {progress.percentage.toFixed(0)}% complete
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="records">CPD Records</TabsTrigger>
          <TabsTrigger value="progress">Progress Tracking</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, provider, or employee name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="all">All Types</option>
                {cpdTypes.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="verified">Verified</option>
              </select>
            </div>
          </div>

          {/* CPD Records Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.provider}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={record.employee?.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {record.employee?.user.firstName[0]}{record.employee?.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            {record.employee?.user.firstName} {record.employee?.user.lastName}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="flex items-center gap-1 w-fit">
                          {getTypeIcon(record.type)}
                          <span className="text-xs">{getTypeLabel(record.type)}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{record.hours}h</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(record.startDate).toLocaleDateString()}</div>
                          {record.endDate && (
                            <div className="text-muted-foreground">
                              to {new Date(record.endDate).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(record.status)}>
                          {record.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {record.certificateUrl && (
                            <Button size="sm" variant="ghost">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cpdProgress.map((progress, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <div className={progress.category.color}>
                      {cpdCategories.find(c => c.name === progress.category.name)?.icon}
                    </div>
                    {progress.category.name}
                  </CardTitle>
                  <CardDescription>
                    {cpdCategories.find(c => c.name === progress.category.name)?.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Progress</span>
                        <span className="font-medium">{progress.completedHours} / {progress.category.requiredHours} hours</span>
                      </div>
                      <Progress value={progress.percentage} className="h-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-2 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{progress.completedHours}</div>
                        <div className="text-xs text-muted-foreground">Completed</div>
                      </div>
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">{progress.category.requiredHours - progress.completedHours}</div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cpdCategories.map((category) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: parseInt(category.id) * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={category.color}>
                        {category.icon}
                      </div>
                      {category.name}
                    </CardTitle>
                    <CardDescription>{category.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Annual Requirement</span>
                        <span className="font-medium">{category.requiredHours} hours</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Priority</span>
                        <Badge variant="outline">
                          {category.requiredHours >= 20 ? 'High' : category.requiredHours >= 15 ? 'Medium' : 'Low'}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>CPD Analytics</CardTitle>
              <CardDescription>
                Comprehensive analysis of professional development activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">CPD analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CPDTracker