import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Edit,
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Users,
  DollarSign,
  Badge as BadgeIcon,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Star,
  Award,
  Activity,
  Download,
  Upload,
  Plus,
  Search,
  Filter,
  MoreVertical
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'

interface EmployeeRecord {
  id: string
  employeeId: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
    phone?: string
    avatar?: string
  }
  department: string
  jobTitle: string
  reportingTo?: {
    user: {
      firstName: string
      lastName: string
    }
  }
  employmentType: string
  status: string
  startDate: string
  baseSalary?: number
  workLocation?: string
  _count: {
    directReports: number
    leaveRequests: number
  }
  lastLogin?: string
  skillProficiency?: number
  performanceRating?: number
}

const EmployeeRecords: React.FC = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Mock data - replace with API call
  const mockEmployees: EmployeeRecord[] = [
    {
      id: '1',
      employeeId: 'EMP001',
      user: {
        id: '1',
        firstName: 'Ahmad',
        lastName: 'Rahman',
        email: 'ahmad.rahman@daritana.com',
        phone: '+60123456789',
        avatar: '/api/placeholder/64/64'
      },
      department: 'Architecture',
      jobTitle: 'Senior Architect',
      reportingTo: {
        user: {
          firstName: 'Datuk',
          lastName: 'Abdullah'
        }
      },
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      startDate: '2023-01-15',
      baseSalary: 8500,
      workLocation: 'KLCC Office',
      _count: { directReports: 3, leaveRequests: 2 },
      lastLogin: '2024-08-10T08:30:00Z',
      skillProficiency: 85,
      performanceRating: 4.2
    },
    {
      id: '2',
      employeeId: 'EMP002',
      user: {
        id: '2',
        firstName: 'Siti',
        lastName: 'Nurhaliza',
        email: 'siti.nurhaliza@daritana.com',
        phone: '+60123456790',
        avatar: '/api/placeholder/64/64'
      },
      department: 'Interior Design',
      jobTitle: 'Lead Interior Designer',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      startDate: '2022-08-22',
      baseSalary: 7200,
      workLocation: 'Penang Office',
      _count: { directReports: 2, leaveRequests: 1 },
      lastLogin: '2024-08-09T17:45:00Z',
      skillProficiency: 92,
      performanceRating: 4.5
    },
    {
      id: '3',
      employeeId: 'EMP003',
      user: {
        id: '3',
        firstName: 'Lee',
        lastName: 'Wei Ming',
        email: 'lee.weiming@daritana.com',
        phone: '+60123456791',
        avatar: '/api/placeholder/64/64'
      },
      department: 'Engineering',
      jobTitle: 'Structural Engineer',
      employmentType: 'CONTRACT',
      status: 'ACTIVE',
      startDate: '2023-06-01',
      baseSalary: 6800,
      workLocation: 'Remote',
      _count: { directReports: 0, leaveRequests: 0 },
      lastLogin: '2024-08-10T09:15:00Z',
      skillProficiency: 78,
      performanceRating: 3.9
    }
  ]

  React.useEffect(() => {
    setEmployees(mockEmployees)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800 border-green-200'
      case 'INACTIVE': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'ON_LEAVE': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'SUSPENDED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getEmploymentTypeColor = (type: string) => {
    switch (type.toUpperCase()) {
      case 'FULL_TIME': return 'bg-blue-100 text-blue-800'
      case 'PART_TIME': return 'bg-orange-100 text-orange-800'
      case 'CONTRACT': return 'bg-purple-100 text-purple-800'
      case 'INTERN': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.jobTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesDepartment = filterDepartment === 'all' || emp.department === filterDepartment
    
    return matchesSearch && matchesDepartment
  })

  const departments = Array.from(new Set(employees.map(emp => emp.department)))

  const renderEmployeeCard = (employee: EmployeeRecord) => (
    <motion.div
      key={employee.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="relative h-full hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-12 w-12 ring-2 ring-blue-50">
                <AvatarImage src={employee.user.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                  {employee.user.firstName[0]}{employee.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">
                  {employee.user.firstName} {employee.user.lastName}
                </h3>
                <p className="text-sm text-muted-foreground">{employee.jobTitle}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  ID: {employee.employeeId}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSelectedEmployee(employee)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Record
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status and Employment */}
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={getStatusColor(employee.status)}>
              {employee.status}
            </Badge>
            <Badge variant="outline" className={getEmploymentTypeColor(employee.employmentType)}>
              {employee.employmentType.replace('_', ' ')}
            </Badge>
          </div>

          {/* Department and Location */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{employee.department}</span>
            </div>
            {employee.workLocation && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{employee.workLocation}</span>
              </div>
            )}
          </div>

          {/* Performance Indicators */}
          <div className="space-y-3">
            {employee.skillProficiency && (
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Skill Proficiency</span>
                  <span className="font-medium">{employee.skillProficiency}%</span>
                </div>
                <Progress value={employee.skillProficiency} className="h-2" />
              </div>
            )}
            
            {employee.performanceRating && (
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance Rating</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{employee.performanceRating}/5.0</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="font-semibold">{employee._count.directReports}</span>
              </div>
              <span className="text-xs text-muted-foreground">Reports</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Calendar className="h-4 w-4 text-green-500" />
                <span className="font-semibold">{employee._count.leaveRequests}</span>
              </div>
              <span className="text-xs text-muted-foreground">Leave Requests</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setSelectedEmployee(employee)}
            >
              <Eye className="h-4 w-4 mr-2" />
              View
            </Button>
            <Button variant="outline" size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Records</h2>
          <p className="text-muted-foreground">Manage employee information and records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Employee
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search employees by name, ID, title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background text-sm"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredEmployees.length} of {employees.length} employees
      </div>

      {/* Employee Grid/Table */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEmployees.map(renderEmployeeCard)}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={employee.user.avatar} />
                          <AvatarFallback>
                            {employee.user.firstName[0]}{employee.user.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {employee.user.firstName} {employee.user.lastName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {employee.jobTitle}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{employee.department}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(employee.status)}>
                        {employee.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getEmploymentTypeColor(employee.employmentType)}>
                        {employee.employmentType.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {employee.performanceRating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{employee.performanceRating}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedEmployee(employee)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Record
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Employee Detail Modal - placeholder */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Employee Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setSelectedEmployee(null)}>
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={selectedEmployee.user.avatar} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white text-lg font-semibold">
                      {selectedEmployee.user.firstName[0]}{selectedEmployee.user.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-2xl font-bold">
                      {selectedEmployee.user.firstName} {selectedEmployee.user.lastName}
                    </h3>
                    <p className="text-muted-foreground">{selectedEmployee.jobTitle}</p>
                    <p className="text-sm text-muted-foreground">Employee ID: {selectedEmployee.employeeId}</p>
                  </div>
                </div>

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="performance">Performance</TabsTrigger>
                    <TabsTrigger value="leave">Leave</TabsTrigger>
                    <TabsTrigger value="skills">Skills</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h4 className="font-semibold">Contact Information</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedEmployee.user.email}</span>
                          </div>
                          {selectedEmployee.user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span>{selectedEmployee.user.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="font-semibold">Employment Details</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-muted-foreground" />
                            <span>{selectedEmployee.department}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Started {new Date(selectedEmployee.startDate).toLocaleDateString()}</span>
                          </div>
                          {selectedEmployee.baseSalary && (
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-muted-foreground" />
                              <span>RM {selectedEmployee.baseSalary.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="performance">
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Performance details coming soon...</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="leave">
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Leave history coming soon...</p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="skills">
                    <div className="text-center py-8">
                      <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Skills assessment coming soon...</p>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

export default EmployeeRecords