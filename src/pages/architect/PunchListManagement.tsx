import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Camera,
  MapPin,
  Calendar,
  User,
  Building,
  Download,
  Filter,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'

interface PunchListItem {
  id: string
  projectId: string
  itemNumber: string
  location: string
  room: string
  description: string
  category: 'safety' | 'quality' | 'cosmetic' | 'functional' | 'compliance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  assignedTo: string
  contractor: string
  dateCreated: Date
  dueDate: Date
  status: 'open' | 'in_progress' | 'pending_review' | 'completed' | 'rejected'
  photos?: string[]
  completedDate?: Date
  verifiedBy?: string
}

export default function PunchListManagement() {
  const [punchItems, setPunchItems] = useState<PunchListItem[]>([
    {
      id: '1',
      projectId: 'proj-1',
      itemNumber: 'PL-001',
      location: 'Level 2',
      room: 'Master Bedroom',
      description: 'Paint touch-up required on north wall',
      category: 'cosmetic',
      priority: 'low',
      assignedTo: 'Painting Contractor',
      contractor: 'ABC Painters',
      dateCreated: new Date('2024-01-15'),
      dueDate: new Date('2024-01-22'),
      status: 'open',
      photos: ['photo1.jpg']
    },
    {
      id: '2',
      projectId: 'proj-1',
      itemNumber: 'PL-002',
      location: 'Level 1',
      room: 'Kitchen',
      description: 'Cabinet door alignment issue',
      category: 'functional',
      priority: 'medium',
      assignedTo: 'Carpentry Contractor',
      contractor: 'XYZ Woodworks',
      dateCreated: new Date('2024-01-16'),
      dueDate: new Date('2024-01-20'),
      status: 'in_progress'
    },
    {
      id: '3',
      projectId: 'proj-1',
      itemNumber: 'PL-003',
      location: 'External',
      room: 'Main Entrance',
      description: 'Missing handrail on stairs',
      category: 'safety',
      priority: 'critical',
      assignedTo: 'Main Contractor',
      contractor: 'DEF Construction',
      dateCreated: new Date('2024-01-17'),
      dueDate: new Date('2024-01-18'),
      status: 'pending_review'
    }
  ])

  const [filter, setFilter] = useState('all')
  const [selectedItems, setSelectedItems] = useState<string[]>([])

  const getPriorityColor = (priority: PunchListItem['priority']) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600 bg-red-100'
      case 'high':
        return 'text-orange-600 bg-orange-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-green-600 bg-green-100'
    }
  }

  const getCategoryIcon = (category: PunchListItem['category']) => {
    switch (category) {
      case 'safety':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'quality':
        return <CheckCircle2 className="h-4 w-4 text-blue-500" />
      case 'cosmetic':
        return <Circle className="h-4 w-4 text-purple-500" />
      case 'functional':
        return <Building className="h-4 w-4 text-green-500" />
      case 'compliance':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
    }
  }

  const getStatusIcon = (status: PunchListItem['status']) => {
    switch (status) {
      case 'open':
        return <Circle className="h-4 w-4 text-gray-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-500" />
      case 'pending_review':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <Circle className="h-4 w-4 text-red-500" />
    }
  }

  const filteredItems = punchItems.filter(item => {
    if (filter === 'all') return true
    if (filter === 'critical') return item.priority === 'critical'
    return item.status === filter
  })

  const stats = {
    total: punchItems.length,
    open: punchItems.filter(i => i.status === 'open').length,
    inProgress: punchItems.filter(i => i.status === 'in_progress').length,
    completed: punchItems.filter(i => i.status === 'completed').length,
    critical: punchItems.filter(i => i.priority === 'critical').length,
    overdue: punchItems.filter(i =>
      i.status !== 'completed' && new Date(i.dueDate) < new Date()
    ).length
  }

  return (
    <PageWrapper title="Punch List Management">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.open}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Punch List Items</CardTitle>
              <div className="flex items-center gap-2">
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Items</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="critical">Critical Only</SelectItem>
                  </SelectContent>
                </Select>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox />
                    </TableHead>
                    <TableHead>Item #</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedItems([...selectedItems, item.id])
                            } else {
                              setSelectedItems(selectedItems.filter(id => id !== item.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{item.itemNumber}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.location}</p>
                          <p className="text-sm text-muted-foreground">{item.room}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="line-clamp-2">{item.description}</p>
                          {item.photos && item.photos.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <Camera className="h-3 w-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {item.photos.length} photos
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.category)}
                          <span className="capitalize text-sm">{item.category}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPriorityColor(item.priority)}>
                          {item.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.assignedTo}</p>
                          <p className="text-xs text-muted-foreground">{item.contractor}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>{format(item.dueDate, 'dd MMM')}</p>
                          {new Date(item.dueDate) < new Date() && item.status !== 'completed' && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <span className="capitalize text-sm">
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {item.status === 'pending_review' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600"
                              onClick={() => toast.success('Item approved')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedItems.length > 0 && (
              <div className="mt-4 p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                <span className="text-sm font-medium">
                  {selectedItems.length} items selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Assign To
                  </Button>
                  <Button variant="outline" size="sm">
                    Change Priority
                  </Button>
                  <Button variant="outline" size="sm" className="text-red-600">
                    Delete
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}