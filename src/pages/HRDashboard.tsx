import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Users,
  Calendar,
  BookOpen,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  UserCheck,
  GraduationCap,
  Activity,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/store/authStore'
import { hrApi } from '@/lib/api'
import EmployeeRecords from '@/components/hr/EmployeeRecords'
import LeaveManagement from '@/components/hr/LeaveManagement'
import CPDTracker from '@/components/hr/CPDTracker'

interface HRMetric {
  id: string
  title: string
  value: string
  change: string
  icon: React.ReactNode
  color: string
}

interface Employee {
  id: string
  employeeId: string
  user: {
    firstName: string
    lastName: string
    email: string
    avatar?: string
  }
  department: string
  jobTitle: string
  status: string
  startDate: string
  _count: {
    directReports: number
    leaveRequests: number
  }
}

interface LeaveRequest {
  id: string
  employee: {
    user: {
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  leaveType: {
    name: string
  }
  startDate: string
  endDate: string
  totalDays: number
  status: string
  appliedAt: string
}

const HRDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [employees, setEmployees] = useState<Employee[]>([])
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const hrMetrics: HRMetric[] = [
    {
      id: '1',
      title: 'Total Employees',
      value: '142',
      change: '+5.2%',
      icon: <Users className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      title: 'Pending Leave Requests',
      value: '8',
      change: '+2',
      icon: <Calendar className="h-5 w-5" />,
      color: 'text-orange-600'
    },
    {
      id: '3',
      title: 'CPD Hours (This Month)',
      value: '486',
      change: '+12.3%',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      id: '4',
      title: 'Active Certifications',
      value: '89',
      change: '+3',
      icon: <Award className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      id: '5',
      title: 'Performance Reviews Due',
      value: '23',
      change: '-5',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      id: '6',
      title: 'Avg. Skill Proficiency',
      value: '78%',
      change: '+2.1%',
      icon: <Activity className="h-5 w-5" />,
      color: 'text-indigo-600'
    }
  ]

  useEffect(() => {
    const loadHRData = async () => {
      setIsLoading(true)
      try {
        // Fetch employees from real API
        const employeesResponse = await hrApi.getEmployees()
        if (employeesResponse.success && employeesResponse.data.employees) {
          const formattedEmployees = employeesResponse.data.employees.map((emp: any) => ({
            id: emp.id,
            employeeId: emp.employeeId || `EMP${emp.id.padStart(3, '0')}`,
            user: {
              firstName: emp.user?.firstName || emp.user?.name?.split(' ')[0] || '',
              lastName: emp.user?.lastName || emp.user?.name?.split(' ').slice(1).join(' ') || '',
              email: emp.user?.email || '',
              avatar: emp.user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.user?.name || emp.user?.firstName || '')}&background=0D8ABC&color=fff`
            },
            department: emp.department || emp.role || 'General',
            jobTitle: emp.jobTitle || emp.position || 'Employee',
            status: emp.status || 'ACTIVE',
            startDate: emp.startDate || emp.createdAt?.split('T')[0] || '',
            _count: {
              directReports: emp._count?.directReports || 0,
              leaveRequests: emp._count?.leaveRequests || 0
            }
          }))
          setEmployees(formattedEmployees)
        }

        // Fetch leave requests from real API
        const leaveResponse = await hrApi.getLeaveRequests()
        if (leaveResponse.success && leaveResponse.data.leaveRequests) {
          const formattedLeaves = leaveResponse.data.leaveRequests.map((leave: any) => ({
            id: leave.id,
            employee: {
              user: {
                firstName: leave.employee?.firstName || leave.employeeName?.split(' ')[0] || '',
                lastName: leave.employee?.lastName || leave.employeeName?.split(' ').slice(1).join(' ') || '',
                avatar: leave.employee?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(leave.employeeName || '')}&background=0D8ABC&color=fff`
              }
            },
            leaveType: { name: leave.type || leave.leaveType || 'Annual Leave' },
            startDate: leave.startDate,
            endDate: leave.endDate,
            totalDays: leave.days || leave.totalDays || 1,
            status: leave.status?.toUpperCase() || 'PENDING',
            appliedAt: leave.appliedAt || leave.createdAt?.split('T')[0] || ''
          }))
          setLeaveRequests(formattedLeaves)
        }

      } catch (error) {
        console.error('Error loading HR data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadHRData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800'
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-800'
      case 'PENDING': return 'bg-orange-100 text-orange-800'
      case 'APPROVED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEmployees = employees.filter(emp =>
    emp.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefresh = () => {
    // Refresh data
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Layout title="HR Management" description="Human Resources Dashboard">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <Users className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-semibold text-gray-900">HR Management</span>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" className="h-8">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
        <Button size="sm" className="h-8">
          <Plus className="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="space-y-6">
        {/* HR Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {hrMetrics.map((metric) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          metric.change.startsWith('+') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                    <div className={`${metric.color} opacity-60`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main HR Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="leave">Leave Management</TabsTrigger>
            <TabsTrigger value="cpd">CPD Records</TabsTrigger>
            <TabsTrigger value="skills">Skills Matrix</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent HR Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserCheck className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">New employee onboarded</p>
                        <p className="text-xs text-muted-foreground">Sarah Lee joined as UX Designer</p>
                      </div>
                      <span className="text-xs text-muted-foreground">2h ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Leave request approved</p>
                        <p className="text-xs text-muted-foreground">Ahmad Rahman's annual leave approved</p>
                      </div>
                      <span className="text-xs text-muted-foreground">4h ago</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-4 w-4 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">CPD record added</p>
                        <p className="text-xs text-muted-foreground">Building Code Compliance Workshop completed</p>
                      </div>
                      <span className="text-xs text-muted-foreground">1d ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Performance Review Period</p>
                        <p className="text-xs text-muted-foreground">Q3 reviews due by Aug 31</p>
                      </div>
                      <Badge variant="outline">In 5 days</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Safety Training</p>
                        <p className="text-xs text-muted-foreground">Mandatory construction safety workshop</p>
                      </div>
                      <Badge variant="outline">Aug 20</Badge>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Certificate Renewal</p>
                        <p className="text-xs text-muted-foregreen">Professional Engineering License</p>
                      </div>
                      <Badge variant="destructive">Expiring Soon</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Department Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Department Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">45</p>
                    <p className="text-sm text-muted-foreground">Architecture</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">32</p>
                    <p className="text-sm text-muted-foreground">Interior Design</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">28</p>
                    <p className="text-sm text-muted-foreground">Project Management</p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <p className="text-2xl font-bold text-orange-600">37</p>
                    <p className="text-sm text-muted-foreground">Engineering</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <EmployeeRecords />
          </TabsContent>

          <TabsContent value="leave" className="space-y-4">
            <LeaveManagement />
          </TabsContent>

          <TabsContent value="cpd" className="space-y-4">
            <CPDTracker />
          </TabsContent>

          <TabsContent value="skills" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Skills Matrix</CardTitle>
                <CardDescription>
                  Employee skills assessment and development planning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Skills matrix system coming soon...</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Assess Skills
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Reviews</CardTitle>
                <CardDescription>
                  Employee performance evaluation and goal tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Performance review system coming soon...</p>
                  <Button className="mt-4" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default HRDashboard