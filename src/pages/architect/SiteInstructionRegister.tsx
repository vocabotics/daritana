import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  FileSignature,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Calendar as CalendarIcon,
  Plus,
  Eye,
  Download,
  Link as LinkIcon,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import PageWrapper from '@/components/PageWrapper'
import type { SiteInstruction } from '@/types/architect'

export default function SiteInstructionRegister() {
  const [instructions, setInstructions] = useState<SiteInstruction[]>([
    {
      id: '1',
      instructionNumber: 'AI-001',
      projectId: 'proj-1',
      projectName: 'KLCC Residential Tower',
      issuedDate: new Date('2024-01-15').toISOString(),
      issuedBy: 'Ar. Ahmad bin Abdullah',
      contractorName: 'ABC Construction Sdn Bhd',
      subject: 'Modification to external facade cladding',
      description: 'Change facade cladding from aluminum composite panel to ceramic tiles as per client request. Contractor to submit samples and cost implications within 7 days.',
      category: 'variation',
      priority: 'high',
      costImplication: 85000,
      timeImplication: 14,
      isVariation: true,
      relatedVariationId: 'VO-003',
      relatedDrawings: ['A-101', 'A-102', 'A-201'],
      status: 'acknowledged',
      acknowledgedBy: 'Project Manager - ABC Construction',
      acknowledgedDate: new Date('2024-01-16').toISOString(),
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-16').toISOString()
    },
    {
      id: '2',
      instructionNumber: 'AI-002',
      projectId: 'proj-1',
      projectName: 'KLCC Residential Tower',
      issuedDate: new Date('2024-01-18').toISOString(),
      issuedBy: 'Ar. Ahmad bin Abdullah',
      contractorName: 'ABC Construction Sdn Bhd',
      subject: 'Rectification of concrete spalling at Level 5',
      description: 'Concrete spalling observed at columns C3 and C7 on Level 5. Contractor to hack and replace affected concrete using approved repair mortar. Works to be supervised by structural consultant.',
      category: 'rectification',
      priority: 'urgent',
      costImplication: 0, // Under contractor's obligation
      timeImplication: 7,
      isVariation: false,
      relatedDrawings: ['S-105'],
      status: 'in_progress',
      acknowledgedBy: 'Site Agent - ABC Construction',
      acknowledgedDate: new Date('2024-01-18').toISOString(),
      createdAt: new Date('2024-01-18').toISOString(),
      updatedAt: new Date('2024-01-20').toISOString()
    },
    {
      id: '3',
      instructionNumber: 'AI-003',
      projectId: 'proj-1',
      projectName: 'KLCC Residential Tower',
      issuedDate: new Date('2024-01-22').toISOString(),
      issuedBy: 'Ar. Ahmad bin Abdullah',
      contractorName: 'ABC Construction Sdn Bhd',
      subject: 'Sequence of work - MEP installation',
      description: 'MEP contractor to complete all vertical piping installation before plastering works commence. Coordinate with main contractor for access and schedule.',
      category: 'sequence',
      priority: 'normal',
      costImplication: 0,
      timeImplication: 0,
      isVariation: false,
      status: 'completed',
      acknowledgedBy: 'MEP Coordinator',
      acknowledgedDate: new Date('2024-01-22').toISOString(),
      completionDate: new Date('2024-01-25').toISOString(),
      createdAt: new Date('2024-01-22').toISOString(),
      updatedAt: new Date('2024-01-25').toISOString()
    }
  ])

  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'general' as SiteInstruction['category'],
    priority: 'normal' as SiteInstruction['priority'],
    costImplication: '',
    timeImplication: '',
    isVariation: false,
    relatedVariationId: '',
    relatedRFIId: '',
    relatedDrawings: ''
  })

  const getStatusBadge = (status: SiteInstruction['status']) => {
    const config: Record<SiteInstruction['status'], { label: string; className: string; icon: React.ReactNode }> = {
      issued: {
        label: 'Issued',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <FileSignature className="h-3 w-3" />
      },
      acknowledged: {
        label: 'Acknowledged',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="h-3 w-3" />
      },
      in_progress: {
        label: 'In Progress',
        className: 'bg-purple-100 text-purple-800 border-purple-300',
        icon: <Clock className="h-3 w-3" />
      },
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle className="h-3 w-3" />
      },
      superseded: {
        label: 'Superseded',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <FileText className="h-3 w-3" />
      }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: SiteInstruction['priority']) => {
    const config: Record<SiteInstruction['priority'], { className: string }> = {
      urgent: { className: 'bg-red-100 text-red-800 border-red-300' },
      high: { className: 'bg-orange-100 text-orange-800 border-orange-300' },
      normal: { className: 'bg-blue-100 text-blue-800 border-blue-300' },
      low: { className: 'bg-gray-100 text-gray-800 border-gray-300' }
    }

    return (
      <Badge variant="outline" className={config[priority].className}>
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getCategoryLabel = (category: SiteInstruction['category']) => {
    const labels: Record<SiteInstruction['category'], string> = {
      clarification: 'Clarification',
      variation: 'Variation',
      quality: 'Quality',
      safety: 'Safety',
      sequence: 'Sequence',
      rectification: 'Rectification',
      general: 'General'
    }
    return labels[category]
  }

  const handleCreateInstruction = () => {
    if (!formData.subject || !formData.description) {
      toast.error('Please fill in all required fields')
      return
    }

    const instructionNumber = `AI-${String(instructions.length + 1).padStart(3, '0')}`

    const newInstruction: SiteInstruction = {
      id: String(Date.now()),
      instructionNumber,
      projectId: 'proj-1',
      projectName: 'KLCC Residential Tower',
      issuedDate: new Date().toISOString(),
      issuedBy: 'Ar. Ahmad bin Abdullah',
      contractorName: 'ABC Construction Sdn Bhd',
      subject: formData.subject,
      description: formData.description,
      category: formData.category,
      priority: formData.priority,
      costImplication: parseFloat(formData.costImplication) || 0,
      timeImplication: parseInt(formData.timeImplication) || 0,
      isVariation: formData.isVariation,
      relatedVariationId: formData.relatedVariationId || undefined,
      relatedRFIId: formData.relatedRFIId || undefined,
      relatedDrawings: formData.relatedDrawings ? formData.relatedDrawings.split(',').map(d => d.trim()) : undefined,
      status: 'issued',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    setInstructions([newInstruction, ...instructions])
    setFormData({
      subject: '',
      description: '',
      category: 'general',
      priority: 'normal',
      costImplication: '',
      timeImplication: '',
      isVariation: false,
      relatedVariationId: '',
      relatedRFIId: '',
      relatedDrawings: ''
    })
    setShowCreateDialog(false)
    toast.success(`Site Instruction ${instructionNumber} created successfully`)
  }

  const stats = {
    total: instructions.length,
    issued: instructions.filter(i => i.status === 'issued').length,
    acknowledged: instructions.filter(i => i.status === 'acknowledged').length,
    inProgress: instructions.filter(i => i.status === 'in_progress').length,
    completed: instructions.filter(i => i.status === 'completed').length,
    variations: instructions.filter(i => i.isVariation).length,
    totalCost: instructions.reduce((sum, i) => sum + i.costImplication, 0)
  }

  return (
    <PageWrapper title="Site Instruction Register (AI)">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Issued</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.issued}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Acknowledged</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.acknowledged}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
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
              <CardTitle className="text-sm font-medium">Variations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.variations}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Cost Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                RM {stats.totalCost.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Instruction List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Architect's Instructions</CardTitle>
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Issue Instruction
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export Register
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>AI No.</TableHead>
                    <TableHead>Date Issued</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Cost Impact</TableHead>
                    <TableHead>Time Impact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {instructions.map((instruction) => (
                    <TableRow key={instruction.id}>
                      <TableCell className="font-medium">
                        {instruction.instructionNumber}
                      </TableCell>
                      <TableCell>
                        {format(new Date(instruction.issuedDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{instruction.subject}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {instruction.description}
                          </p>
                          {instruction.isVariation && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              <LinkIcon className="h-3 w-3 mr-1" />
                              Linked to {instruction.relatedVariationId}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="capitalize">{getCategoryLabel(instruction.category)}</span>
                      </TableCell>
                      <TableCell>{getPriorityBadge(instruction.priority)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {instruction.costImplication > 0 && (
                            <>
                              <DollarSign className="h-4 w-4 text-red-500" />
                              <span className="text-red-600 font-medium">
                                RM {instruction.costImplication.toLocaleString()}
                              </span>
                            </>
                          )}
                          {instruction.costImplication === 0 && (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {instruction.timeImplication > 0 ? (
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4 text-orange-500" />
                            <span className="text-orange-600">
                              +{instruction.timeImplication} days
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(instruction.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Create Instruction Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Issue Site Instruction (AI)</DialogTitle>
              <DialogDescription>
                Create a formal Architect's Instruction to the contractor
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Brief description of the instruction"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the instruction, including requirements and specifications"
                  rows={5}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: SiteInstruction['category']) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="clarification">Clarification</SelectItem>
                      <SelectItem value="variation">Variation</SelectItem>
                      <SelectItem value="quality">Quality</SelectItem>
                      <SelectItem value="safety">Safety</SelectItem>
                      <SelectItem value="sequence">Sequence of Work</SelectItem>
                      <SelectItem value="rectification">Rectification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: SiteInstruction['priority']) =>
                      setFormData({ ...formData, priority: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="costImplication">Cost Implication (RM)</Label>
                  <Input
                    id="costImplication"
                    type="number"
                    value={formData.costImplication}
                    onChange={(e) => setFormData({ ...formData, costImplication: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label htmlFor="timeImplication">Time Impact (days)</Label>
                  <Input
                    id="timeImplication"
                    type="number"
                    value={formData.timeImplication}
                    onChange={(e) => setFormData({ ...formData, timeImplication: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isVariation"
                  checked={formData.isVariation}
                  onChange={(e) => setFormData({ ...formData, isVariation: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="isVariation" className="text-sm font-normal">
                  This instruction results in a variation order
                </Label>
              </div>

              {formData.isVariation && (
                <div>
                  <Label htmlFor="relatedVariationId">Related Variation Order Number</Label>
                  <Input
                    id="relatedVariationId"
                    value={formData.relatedVariationId}
                    onChange={(e) => setFormData({ ...formData, relatedVariationId: e.target.value })}
                    placeholder="VO-001"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="relatedRFIId">Related RFI (if applicable)</Label>
                <Input
                  id="relatedRFIId"
                  value={formData.relatedRFIId}
                  onChange={(e) => setFormData({ ...formData, relatedRFIId: e.target.value })}
                  placeholder="RFI-001"
                />
              </div>

              <div>
                <Label htmlFor="relatedDrawings">Related Drawing Numbers</Label>
                <Input
                  id="relatedDrawings"
                  value={formData.relatedDrawings}
                  onChange={(e) => setFormData({ ...formData, relatedDrawings: e.target.value })}
                  placeholder="A-101, A-102, S-105 (comma separated)"
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateInstruction}>
                <FileSignature className="h-4 w-4 mr-2" />
                Issue Instruction
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageWrapper>
  )
}
