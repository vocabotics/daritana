import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Check,
  X,
  CalendarDays,
  Plane,
  Heart,
  Briefcase,
  GraduationCap
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
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

interface LeaveType {
  id: string
  name: string
  description?: string
  daysAllowed: number
  icon: React.ReactNode
  color: string
}

interface LeaveRequest {
  id: string
  employee: {
    user: {
      firstName: string
      lastName: string
      avatar?: string
    }
    employeeId: string
    department: string
    jobTitle: string
  }
  leaveType: {
    id: string
    name: string
  }
  startDate: string
  endDate: string
  totalDays: number
  reason?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
  appliedAt: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  emergencyContact?: string
  handoverNotes?: string
}

interface LeaveBalance {
  leaveType: {
    name: string
    daysAllowed: number
  }
  allocated: number
  used: number
  balance: number
  carriedForward: number
}

const LeaveManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('requests')
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false)

  const leaveTypes: LeaveType[] = [
    {
      id: '1',
      name: 'Annual Leave',
      description: 'Yearly vacation days',
      daysAllowed: 14,
      icon: <Plane className="h-4 w-4" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      name: 'Sick Leave',
      description: 'Medical leave',
      daysAllowed: 14,
      icon: <Heart className="h-4 w-4" />,
      color: 'text-red-600'
    },
    {
      id: '3',
      name: 'Maternity/Paternity Leave',
      description: 'Family leave',
      daysAllowed: 90,
      icon: <User className="h-4 w-4" />,
      color: 'text-pink-600'
    },
    {
      id: '4',
      name: 'Study Leave',
      description: 'Educational purposes',
      daysAllowed: 5,
      icon: <GraduationCap className="h-4 w-4" />,
      color: 'text-purple-600'
    },
    {
      id: '5',
      name: 'Emergency Leave',
      description: 'Urgent personal matters',
      daysAllowed: 3,
      icon: <AlertTriangle className="h-4 w-4" />,
      color: 'text-orange-600'
    }
  ]

  // Mock data
  const mockLeaveRequests: LeaveRequest[] = [
    {
      id: '1',
      employee: {
        user: {
          firstName: 'Ahmad',
          lastName: 'Rahman',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP001',
        department: 'Architecture',
        jobTitle: 'Senior Architect'
      },
      leaveType: {
        id: '1',
        name: 'Annual Leave'
      },
      startDate: '2024-08-15',
      endDate: '2024-08-19',
      totalDays: 5,
      reason: 'Family vacation to Langkawi',
      status: 'PENDING',
      appliedAt: '2024-08-10T09:00:00Z',
      emergencyContact: 'Wife: +60123456789',
      handoverNotes: 'Ahmad Faiz will handle ongoing projects'
    },
    {
      id: '2',
      employee: {
        user: {
          firstName: 'Siti',
          lastName: 'Nurhaliza',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP002',
        department: 'Interior Design',
        jobTitle: 'Lead Interior Designer'
      },
      leaveType: {
        id: '2',
        name: 'Sick Leave'
      },
      startDate: '2024-08-12',
      endDate: '2024-08-12',
      totalDays: 1,
      reason: 'Doctor appointment',
      status: 'APPROVED',
      appliedAt: '2024-08-11T16:30:00Z',
      approvedBy: 'manager123',
      approvedAt: '2024-08-11T17:00:00Z'
    },
    {
      id: '3',
      employee: {
        user: {
          firstName: 'Lee',
          lastName: 'Wei Ming',
          avatar: '/api/placeholder/32/32'
        },
        employeeId: 'EMP003',
        department: 'Engineering',
        jobTitle: 'Structural Engineer'
      },
      leaveType: {
        id: '1',
        name: 'Annual Leave'
      },
      startDate: '2024-09-01',
      endDate: '2024-09-05',
      totalDays: 5,
      reason: 'Chinese New Year celebration',
      status: 'REJECTED',
      appliedAt: '2024-08-05T10:15:00Z',
      rejectedReason: 'Peak project period, please reschedule'
    }
  ]

  const mockLeaveBalances: LeaveBalance[] = [
    {
      leaveType: { name: 'Annual Leave', daysAllowed: 14 },
      allocated: 14,
      used: 8,
      balance: 6,
      carriedForward: 2
    },
    {
      leaveType: { name: 'Sick Leave', daysAllowed: 14 },
      allocated: 14,
      used: 3,
      balance: 11,
      carriedForward: 0
    },
    {
      leaveType: { name: 'Study Leave', daysAllowed: 5 },
      allocated: 5,
      used: 0,
      balance: 5,
      carriedForward: 0
    }
  ]

  useEffect(() => {
    setLeaveRequests(mockLeaveRequests)
    setLeaveBalances(mockLeaveBalances)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'APPROVED': return 'bg-green-100 text-green-800 border-green-200'
      case 'REJECTED': return 'bg-red-100 text-red-800 border-red-200'
      case 'CANCELLED': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return <Clock className="h-4 w-4" />
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />
      case 'REJECTED': return <XCircle className="h-4 w-4" />
      case 'CANCELLED': return <X className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = 
      request.employee.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee.user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.leaveType.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || request.status.toLowerCase() === statusFilter.toLowerCase()
    
    return matchesSearch && matchesStatus
  })

  const handleApprove = async (requestId: string) => {
    // API call to approve request
    console.log('Approving request:', requestId)
    // Update local state
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'APPROVED' as const, approvedAt: new Date().toISOString() }
        : req
    ))
  }

  const handleReject = async (requestId: string) => {
    // API call to reject request
    console.log('Rejecting request:', requestId)
    // Update local state
    setLeaveRequests(prev => prev.map(req => 
      req.id === requestId 
        ? { ...req, status: 'REJECTED' as const, rejectedReason: 'Rejected by manager' }
        : req
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Leave Management</h2>
          <p className="text-muted-foreground">Manage employee leave requests and balances</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
          <Dialog open={isNewRequestOpen} onOpenChange={setIsNewRequestOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Leave Request
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Submit Leave Request</DialogTitle>
                <DialogDescription>
                  Request time off from work
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="leave-type">Leave Type</Label>
                  <select id="leave-type" className="w-full px-3 py-2 border rounded-md">
                    {leaveTypes.map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
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
                  <Label htmlFor="reason">Reason</Label>
                  <Textarea id="reason" placeholder="Please provide a reason for your leave..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergency-contact">Emergency Contact</Label>
                  <Input id="emergency-contact" placeholder="Name and phone number" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewRequestOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsNewRequestOpen(false)}>
                    Submit Request
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="requests">Leave Requests</TabsTrigger>
          <TabsTrigger value="balances">Leave Balances</TabsTrigger>
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="types">Leave Types</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by employee name, ID, or leave type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Leave Requests Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={request.employee.user.avatar} />
                            <AvatarFallback>
                              {request.employee.user.firstName[0]}{request.employee.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">
                              {request.employee.user.firstName} {request.employee.user.lastName}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {request.employee.jobTitle}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {request.leaveType.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(request.startDate).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            to {new Date(request.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{request.totalDays}</span>
                          <span className="text-sm text-muted-foreground">
                            day{request.totalDays > 1 ? 's' : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(request.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(request.status)}
                            <span>{request.status}</span>
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {request.status === 'PENDING' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-green-600 border-green-600 hover:bg-green-50"
                                onClick={() => handleApprove(request.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => handleReject(request.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balances" className="space-y-4">
          {/* Leave Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveBalances.map((balance, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">{balance.leaveType.name}</CardTitle>
                    <CardDescription>
                      {balance.leaveType.daysAllowed} days annual allocation
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Used</span>
                        <span className="font-medium">{balance.used} / {balance.allocated} days</span>
                      </div>
                      <Progress 
                        value={(balance.used / balance.allocated) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center p-2 bg-green-50 rounded-lg">
                        <div className="text-xl font-bold text-green-600">{balance.balance}</div>
                        <div className="text-xs text-muted-foreground">Remaining</div>
                      </div>
                      {balance.carriedForward > 0 && (
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">{balance.carriedForward}</div>
                          <div className="text-xs text-muted-foreground">Carried Forward</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave Calendar</CardTitle>
              <CardDescription>
                View all approved leave requests in calendar format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Leave calendar coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaveTypes.map((type) => (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: parseInt(type.id) * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className={type.color}>
                        {type.icon}
                      </div>
                      {type.name}
                    </CardTitle>
                    <CardDescription>{type.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Annual Allocation</span>
                        <span className="font-medium">{type.daysAllowed} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Approval Required</span>
                        <Badge variant="outline" className="text-xs">Yes</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default LeaveManagement