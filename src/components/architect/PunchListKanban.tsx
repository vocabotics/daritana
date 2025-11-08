import React, { useState } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  Clock,
  XCircle,
  Camera,
  MapPin,
  Calendar,
  User,
  MoreVertical,
  Eye
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface PunchListItem {
  id: string
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

interface Column {
  id: string
  title: string
  status: PunchListItem['status']
  items: PunchListItem[]
  color: string
  icon: React.ReactNode
}

interface PunchListKanbanProps {
  items: PunchListItem[]
  onItemMove: (itemId: string, newStatus: PunchListItem['status']) => void
  onItemClick: (item: PunchListItem) => void
}

export function PunchListKanban({ items, onItemMove, onItemClick }: PunchListKanbanProps) {
  // Define Kanban columns with status mapping
  const initialColumns: Column[] = [
    {
      id: 'identified',
      title: 'Identified',
      status: 'identified',
      items: [],
      color: 'bg-gray-100 border-gray-300',
      icon: <Circle className="h-4 w-4 text-gray-500" />
    },
    {
      id: 'assigned',
      title: 'Assigned',
      status: 'assigned',
      items: [],
      color: 'bg-blue-100 border-blue-300',
      icon: <User className="h-4 w-4 text-blue-500" />
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      status: 'in_progress',
      items: [],
      color: 'bg-yellow-100 border-yellow-300',
      icon: <Clock className="h-4 w-4 text-yellow-500" />
    },
    {
      id: 'pending_verification',
      title: 'Pending Verification',
      status: 'pending_verification',
      items: [],
      color: 'bg-orange-100 border-orange-300',
      icon: <AlertTriangle className="h-4 w-4 text-orange-500" />
    },
    {
      id: 'verified',
      title: 'Verified',
      status: 'verified',
      items: [],
      color: 'bg-green-100 border-green-300',
      icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
    },
    {
      id: 'closed',
      title: 'Closed',
      status: 'closed',
      items: [],
      color: 'bg-gray-100 border-gray-400',
      icon: <XCircle className="h-4 w-4 text-gray-500" />
    }
  ]

  // Organize items into columns
  const [columns, setColumns] = useState<Column[]>(() => {
    const cols = initialColumns.map(col => ({ ...col, items: [] }))
    items.forEach(item => {
      const column = cols.find(c => c.status === item.status)
      if (column) {
        column.items.push(item)
      }
    })
    return cols
  })

  // Update columns when items prop changes
  React.useEffect(() => {
    const cols = initialColumns.map(col => ({ ...col, items: [] }))
    items.forEach(item => {
      const column = cols.find(c => c.status === item.status)
      if (column) {
        column.items.push(item)
      }
    })
    setColumns(cols)
  }, [items])

  const getPriorityBadge = (priority: PunchListItem['priority']) => {
    const config: Record<PunchListItem['priority'], { label: string; className: string }> = {
      critical: { label: 'Critical', className: 'bg-red-100 text-red-800 border-red-300' },
      high: { label: 'High', className: 'bg-orange-100 text-orange-800 border-orange-300' },
      medium: { label: 'Medium', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      low: { label: 'Low', className: 'bg-green-100 text-green-800 border-green-300' }
    }
    return (
      <Badge variant="outline" className={cn('text-xs', config[priority].className)}>
        {config[priority].label}
      </Badge>
    )
  }

  const getCategoryIcon = (category: PunchListItem['category']) => {
    const icons: Record<PunchListItem['category'], React.ReactNode> = {
      safety: <AlertTriangle className="h-3 w-3 text-red-500" />,
      quality: <CheckCircle2 className="h-3 w-3 text-blue-500" />,
      cosmetic: <Circle className="h-3 w-3 text-purple-500" />,
      functional: <Circle className="h-3 w-3 text-green-500" />,
      compliance: <AlertTriangle className="h-3 w-3 text-orange-500" />
    }
    return icons[category]
  }

  const onDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result

    // Dropped outside a valid droppable
    if (!destination) return

    // Dropped in the same position
    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return
    }

    const sourceColumn = columns.find(col => col.id === source.droppableId)
    const destColumn = columns.find(col => col.id === destination.droppableId)

    if (!sourceColumn || !destColumn) return

    // Moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newItems = Array.from(sourceColumn.items)
      const [movedItem] = newItems.splice(source.index, 1)
      newItems.splice(destination.index, 0, movedItem)

      const newColumns = columns.map(col =>
        col.id === sourceColumn.id ? { ...col, items: newItems } : col
      )
      setColumns(newColumns)
    } else {
      // Moving to a different column
      const sourceItems = Array.from(sourceColumn.items)
      const destItems = Array.from(destColumn.items)
      const [movedItem] = sourceItems.splice(source.index, 1)
      destItems.splice(destination.index, 0, movedItem)

      const newColumns = columns.map(col => {
        if (col.id === sourceColumn.id) return { ...col, items: sourceItems }
        if (col.id === destColumn.id) return { ...col, items: destItems }
        return col
      })

      setColumns(newColumns)

      // Call the callback to update the item status
      onItemMove(draggableId, destColumn.status)
    }
  }

  const isOverdue = (dueDate: Date) => {
    return new Date() > dueDate
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {columns.map(column => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className={cn('h-full', column.color)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {column.icon}
                    <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="h-6 w-6 rounded-full p-0 flex items-center justify-center">
                    {column.items.length}
                  </Badge>
                </div>
              </CardHeader>

              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <CardContent
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      'space-y-2 min-h-[400px] transition-colors',
                      snapshot.isDraggingOver && 'bg-blue-50'
                    )}
                  >
                    {column.items.length === 0 ? (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No items
                      </div>
                    ) : (
                      column.items.map((item, index) => (
                        <Draggable key={item.id} draggableId={item.id} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={cn(
                                'cursor-move hover:shadow-md transition-shadow',
                                snapshot.isDragging && 'shadow-lg ring-2 ring-blue-400',
                                item.priority === 'critical' && 'border-l-4 border-l-red-500'
                              )}
                              onClick={() => onItemClick(item)}
                            >
                              <CardContent className="p-3">
                                {/* Header */}
                                <div className="flex items-start justify-between mb-2">
                                  <div className="flex items-center gap-1">
                                    {getCategoryIcon(item.category)}
                                    <span className="text-xs font-mono text-gray-600">
                                      {item.itemNumber}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    {getPriorityBadge(item.priority)}
                                  </div>
                                </div>

                                {/* Description */}
                                <p className="text-sm font-medium text-gray-900 line-clamp-2 mb-2">
                                  {item.description}
                                </p>

                                {/* Location */}
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                  <MapPin className="h-3 w-3" />
                                  <span>{item.location} - {item.room}</span>
                                </div>

                                {/* Assigned To */}
                                <div className="flex items-center gap-1 text-xs text-gray-600 mb-2">
                                  <User className="h-3 w-3" />
                                  <span className="truncate">{item.assignedTo}</span>
                                </div>

                                {/* Due Date */}
                                <div className="flex items-center justify-between text-xs">
                                  <div className={cn(
                                    "flex items-center gap-1",
                                    isOverdue(item.dueDate) ? "text-red-600 font-medium" : "text-gray-600"
                                  )}>
                                    <Calendar className="h-3 w-3" />
                                    <span>{format(item.dueDate, 'dd MMM')}</span>
                                    {isOverdue(item.dueDate) && (
                                      <Badge variant="destructive" className="text-xs h-4 px-1">
                                        Overdue
                                      </Badge>
                                    )}
                                  </div>
                                  {item.photos && item.photos.length > 0 && (
                                    <div className="flex items-center gap-1 text-gray-500">
                                      <Camera className="h-3 w-3" />
                                      <span>{item.photos.length}</span>
                                    </div>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </CardContent>
                )}
              </Droppable>
            </Card>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
