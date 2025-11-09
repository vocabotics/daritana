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
  Trash2,
  LayoutGrid,
  List,
  XCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import { PunchListKanban } from '@/components/architect/PunchListKanban'

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
  status: 'identified' | 'assigned' | 'in_progress' | 'pending_verification' | 'verified' | 'closed'
  photos?: string[]
  completedDate?: Date
  verifiedBy?: string
}

export default function PunchListManagement() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
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
      status: 'identified',
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
      status: 'pending_verification'
    },
    {
      id: '4',
      projectId: 'proj-1',
      itemNumber: 'PL-004',
      location: 'Level 3',
      room: 'Bathroom',
      description: 'Tile grouting incomplete',
      category: 'quality',
      priority: 'medium',
      assignedTo: 'Tiling Contractor',
      contractor: 'ABC Tilers',
      dateCreated: new Date('2024-01-14'),
      dueDate: new Date('2024-01-25'),
      status: 'assigned'
    },
    {
      id: '5',
      projectId: 'proj-1',
      itemNumber: 'PL-005',
      location: 'Level 1',
      room: 'Living Room',
      description: 'Window seal leak during rain',
      category: 'functional',
      priority: 'high',
      assignedTo: 'Glazing Contractor',
      contractor: 'XYZ Windows',
      dateCreated: new Date('2024-01-12'),
      dueDate: new Date('2024-01-19'),
      status: 'verified'
    },
    {
      id: '6',
      projectId: 'proj-1',
      itemNumber: 'PL-006',
      location: 'Level 2',
      room: 'Corridor',
      description: 'Emergency lighting not functioning',
      category: 'safety',
      priority: 'critical',
      assignedTo: 'Electrical Contractor',
      contractor: 'DEF Electrical',
      dateCreated: new Date('2024-01-10'),
      dueDate: new Date('2024-01-15'),
      status: 'closed',
      completedDate: new Date('2024-01-14'),
      verifiedBy: 'Architect A'
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
      case 'identified':
        return <Circle className="h-4 w-4 text-gray-500" />
      case 'assigned':
        return <User className="h-4 w-4 text-blue-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'pending_verification':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      case 'verified':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'closed':
        return <XCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const handleItemMove = (itemId: string, newStatus: PunchListItem['status']) => {
    setPunchItems(items =>
      items.map(item =>
        item.id === itemId
          ? { ...item, status: newStatus }
          : item
      )
    )
    toast.success('Item status updated')
  }

  const handleItemClick = (item: PunchListItem) => {
    toast.info(`Viewing item: ${item.itemNumber}`)
    // TODO: Open detail modal
  }

  const filteredItems = punchItems.filter(item => {
    if (filter === 'all') return true
    if (filter === 'critical') return item.priority === 'critical'
    return item.status === filter
  })

  const stats = {
    total: punchItems.length,
    identified: punchItems.filter(i => i.status === 'identified').length,
    inProgress: punchItems.filter(i => i.status === 'in_progress').length,
    verified: punchItems.filter(i => i.status === 'verified').length,
    critical: punchItems.filter(i => i.priority === 'critical').length,
    overdue: punchItems.filter(i =>
      i.status !== 'verified' && i.status !== 'closed' && new Date(i.dueDate) < new Date()
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
              <CardTitle className="text-sm font-medium">Identified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.identified}</div>
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
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
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
                {/* View Toggle */}
                <div className="flex items-center border rounded-lg p-1">
                  <Button
                    variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('kanban')}
                    className="h-8"
                  >
                    <LayoutGrid className="h-4 w-4 mr-2" />
                    Kanban
                  </Button>
                  <Button
                    variant={viewMode === 'table' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('table')}
                    className="h-8"
                  >
                    <List className="h-4 w-4 mr-2" />
                    Table
                  </Button>
                </div>

                {viewMode === 'table' && (
                  <Select value={filter} onValueChange={setFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Items</SelectItem>
                      <SelectItem value="identified">Identified</SelectItem>
                      <SelectItem value="assigned">Assigned</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="pending_verification">Pending Verification</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="critical">Critical Only</SelectItem>
                    </SelectContent>
                  </Select>
                )}

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
            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <PunchListKanban
                items={punchItems}
                onItemMove={handleItemMove}
                onItemClick={handleItemClick}
              />
            )}

            {/* Table View */}
            {viewMode === 'table' && (
              <>
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
                              {new Date(item.dueDate) < new Date() && item.status !== 'verified' && item.status !== 'closed' && (
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
                              <Button variant="ghost" size="icon" onClick={() => handleItemClick(item)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              {item.status === 'pending_verification' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-green-600"
                                  onClick={() => {
                                    handleItemMove(item.id, 'verified')
                                    toast.success('Item verified')
                                  }}
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}