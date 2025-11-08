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
  Send,
  CheckCircle2,
  Clock,
  FileText,
  Eye,
  Download,
  Plus,
  Mail
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DrawingTransmittal, Drawing } from '@/types/architect'

interface DrawingTransmittalListProps {
  transmittals: DrawingTransmittal[]
  drawings: Drawing[]
  onCreateTransmittal: (transmittal: Omit<DrawingTransmittal, 'id'>) => void
  onAcknowledge: (transmittalId: string) => void
  onViewDetails: (transmittal: DrawingTransmittal) => void
}

export function DrawingTransmittalList({
  transmittals,
  drawings,
  onCreateTransmittal,
  onAcknowledge,
  onViewDetails
}: DrawingTransmittalListProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedDrawings, setSelectedDrawings] = useState<string[]>([])
  const [formData, setFormData] = useState({
    recipientName: '',
    recipientCompany: '',
    recipientEmail: '',
    purpose: 'for_review' as DrawingTransmittal['purpose'],
    dueDate: '',
    comments: ''
  })

  const getStatusBadge = (status: DrawingTransmittal['status']) => {
    const config: Record<DrawingTransmittal['status'], { label: string; className: string; icon: React.ReactNode }> = {
      draft: {
        label: 'Draft',
        className: 'bg-gray-100 text-gray-800 border-gray-300',
        icon: <FileText className="h-3 w-3" />
      },
      sent: {
        label: 'Sent',
        className: 'bg-blue-100 text-blue-800 border-blue-300',
        icon: <Send className="h-3 w-3" />
      },
      acknowledged: {
        label: 'Acknowledged',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-300',
        icon: <Clock className="h-3 w-3" />
      },
      responded: {
        label: 'Responded',
        className: 'bg-green-100 text-green-800 border-green-300',
        icon: <CheckCircle2 className="h-3 w-3" />
      }
    }

    return (
      <Badge variant="outline" className={cn('flex items-center gap-1', config[status].className)}>
        {config[status].icon}
        {config[status].label}
      </Badge>
    )
  }

  const getPurposeBadge = (purpose: DrawingTransmittal['purpose']) => {
    const labels: Record<DrawingTransmittal['purpose'], string> = {
      for_review: 'For Review',
      for_approval: 'For Approval',
      for_construction: 'For Construction',
      for_information: 'For Information',
      as_built: 'As Built'
    }
    return <Badge variant="secondary">{labels[purpose]}</Badge>
  }

  const handleCreateTransmittal = () => {
    if (!formData.recipientName || !formData.recipientEmail || selectedDrawings.length === 0) {
      toast.error('Please fill in all required fields and select at least one drawing')
      return
    }

    const transmittalNumber = `TR-${Date.now().toString().slice(-6)}`

    onCreateTransmittal({
      transmittalNumber,
      projectId: 'current-project',
      drawings: selectedDrawings,
      recipient: {
        name: formData.recipientName,
        company: formData.recipientCompany,
        email: formData.recipientEmail
      },
      purpose: formData.purpose,
      sentDate: new Date().toISOString(),
      dueDate: formData.dueDate || undefined,
      status: 'sent',
      comments: formData.comments || undefined
    })

    // Reset form
    setFormData({
      recipientName: '',
      recipientCompany: '',
      recipientEmail: '',
      purpose: 'for_review',
      dueDate: '',
      comments: ''
    })
    setSelectedDrawings([])
    setShowCreateDialog(false)
    toast.success('Transmittal created and sent successfully')
  }

  const stats = {
    total: transmittals.length,
    sent: transmittals.filter(t => t.status === 'sent').length,
    acknowledged: transmittals.filter(t => t.status === 'acknowledged').length,
    responded: transmittals.filter(t => t.status === 'responded').length
  }

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Transmittals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.sent}</div>
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
            <CardTitle className="text-sm font-medium">Responded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.responded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Transmittal List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Drawing Transmittals</CardTitle>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Transmittal
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transmittals.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">No transmittals created yet</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => setShowCreateDialog(true)}
              >
                Create First Transmittal
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transmittal #</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Drawings</TableHead>
                    <TableHead>Sent Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transmittals.map((transmittal) => (
                    <TableRow key={transmittal.id}>
                      <TableCell className="font-medium">
                        {transmittal.transmittalNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transmittal.recipient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {transmittal.recipient.company}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getPurposeBadge(transmittal.purpose)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{transmittal.drawings.length} drawings</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(transmittal.sentDate), 'dd MMM yyyy')}
                      </TableCell>
                      <TableCell>
                        {transmittal.dueDate
                          ? format(new Date(transmittal.dueDate), 'dd MMM yyyy')
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{getStatusBadge(transmittal.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetails(transmittal)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                          {transmittal.status === 'sent' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-green-600"
                              onClick={() => {
                                onAcknowledge(transmittal.id)
                                toast.success('Transmittal acknowledged')
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
          )}
        </CardContent>
      </Card>

      {/* Create Transmittal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Drawing Transmittal</DialogTitle>
            <DialogDescription>
              Send drawings to contractors, consultants, or clients for review or approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Recipient Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Recipient Information</h4>
              <div className="grid gap-4">
                <div>
                  <Label htmlFor="recipientName">Recipient Name *</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientCompany">Company</Label>
                  <Input
                    id="recipientCompany"
                    value={formData.recipientCompany}
                    onChange={(e) => setFormData({ ...formData, recipientCompany: e.target.value })}
                    placeholder="ABC Construction Sdn Bhd"
                  />
                </div>
                <div>
                  <Label htmlFor="recipientEmail">Email *</Label>
                  <Input
                    id="recipientEmail"
                    type="email"
                    value={formData.recipientEmail}
                    onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Transmittal Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Transmittal Details</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="purpose">Purpose</Label>
                  <Select
                    value={formData.purpose}
                    onValueChange={(value: DrawingTransmittal['purpose']) =>
                      setFormData({ ...formData, purpose: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for_review">For Review</SelectItem>
                      <SelectItem value="for_approval">For Approval</SelectItem>
                      <SelectItem value="for_construction">For Construction</SelectItem>
                      <SelectItem value="for_information">For Information</SelectItem>
                      <SelectItem value="as_built">As Built</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="comments">Comments</Label>
                <Textarea
                  id="comments"
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Additional notes or instructions..."
                  rows={3}
                />
              </div>
            </div>

            {/* Drawing Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-sm">Select Drawings *</h4>
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {drawings.map((drawing) => (
                  <div
                    key={drawing.id}
                    className="flex items-center gap-3 p-3 border-b last:border-b-0 hover:bg-muted/50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDrawings.includes(drawing.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDrawings([...selectedDrawings, drawing.id])
                        } else {
                          setSelectedDrawings(selectedDrawings.filter(id => id !== drawing.id))
                        }
                      }}
                      className="h-4 w-4"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{drawing.drawingNumber}</p>
                      <p className="text-xs text-muted-foreground">{drawing.title}</p>
                    </div>
                    <Badge variant="outline">{drawing.currentRevision}</Badge>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedDrawings.length} drawing(s) selected
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTransmittal}>
              <Send className="h-4 w-4 mr-2" />
              Create & Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
