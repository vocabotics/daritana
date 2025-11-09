import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  FileText,
  Download,
  Upload,
  Eye,
  Edit,
  Share2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Folder,
  FolderOpen,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  User,
  Building,
  Layers,
  GitBranch,
  History,
  Send,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import PageWrapper from '@/components/PageWrapper'
import CADViewer from '@/components/architect/CADViewer'
import { DrawingTransmittalList } from '@/components/architect/DrawingTransmittalList'
import { useDrawingStore } from '@/store/architect/drawingStore'
import type { Drawing, DrawingTransmittal } from '@/types/architect'

export default function DrawingManagement() {
  // Zustand store
  const {
    drawings,
    transmittals,
    loading,
    error,
    fetchDrawings,
    fetchTransmittals,
    createTransmittal,
    acknowledgeTransmittal,
    clearError
  } = useDrawingStore()

  // Load data on mount
  useEffect(() => {
    fetchDrawings()
    fetchTransmittals('current-project')
  }, [fetchDrawings, fetchTransmittals])

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedDrawing, setSelectedDrawing] = useState<Drawing | null>(null)
  const [showCADViewer, setShowCADViewer] = useState(false)

  const getDisciplineColor = (discipline: Drawing['discipline']) => {
    const colors = {
      architectural: 'bg-blue-100 text-blue-800',
      structural: 'bg-red-100 text-red-800',
      mep: 'bg-yellow-100 text-yellow-800',
      civil: 'bg-green-100 text-green-800',
      landscape: 'bg-purple-100 text-purple-800'
    }
    return colors[discipline]
  }

  const getStatusIcon = (status: Drawing['status']) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'for_review':
        return <Eye className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'for_construction':
        return <CheckCircle className="h-4 w-4 text-blue-500" />
      case 'as_built':
        return <Building className="h-4 w-4 text-purple-500" />
    }
  }

  // Transmittal handlers
  const handleCreateTransmittal = async (transmittal: Omit<DrawingTransmittal, 'id'>) => {
    try {
      await createTransmittal(transmittal)
    } catch (error) {
      console.error('Failed to create transmittal:', error)
    }
  }

  const handleAcknowledgeTransmittal = async (transmittalId: string) => {
    try {
      await acknowledgeTransmittal(transmittalId)
    } catch (error) {
      console.error('Failed to acknowledge transmittal:', error)
    }
  }

  const handleViewTransmittalDetails = (transmittal: DrawingTransmittal) => {
    // TODO: Open detail modal or navigate to detail page
    toast.info(`Viewing transmittal: ${transmittal.transmittalNumber}`)
  }

  return (
    <PageWrapper title="Drawing Management">
      <div className="space-y-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading drawings...</span>
          </div>
        )}

        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Drawings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{drawings.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">For Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {drawings.filter(d => d.status === 'for_review').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {drawings.filter(d => d.status === 'approved').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Revisions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {drawings.reduce((sum, d) => sum + d.revisions.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Transmittals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {drawings.reduce((sum, d) => sum + d.transmittals.length, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="drawings" className="space-y-4">
          <TabsList>
            <TabsTrigger value="drawings">Drawing Register</TabsTrigger>
            <TabsTrigger value="transmittals">Transmittals</TabsTrigger>
            <TabsTrigger value="viewer">CAD Viewer</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
          </TabsList>

          <TabsContent value="drawings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Drawing Register</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={() => setViewMode('list')}>
                      <List className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={() => setViewMode('grid')}>
                      <Grid className="h-4 w-4" />
                    </Button>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Drawing
                    </Button>
                    <Button variant="outline">
                      <Send className="h-4 w-4 mr-2" />
                      Transmit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {viewMode === 'list' ? (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Drawing #</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>Discipline</TableHead>
                          <TableHead>Version</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Uploaded</TableHead>
                          <TableHead>Size</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {drawings.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                              No drawings found
                            </TableCell>
                          </TableRow>
                        ) : (
                          drawings.map((drawing) => {
                            const latestRevision = drawing.revisions.length > 0
                              ? drawing.revisions[drawing.revisions.length - 1]
                              : null

                            return (
                              <TableRow key={drawing.id}>
                                <TableCell className="font-medium">{drawing.drawingNumber}</TableCell>
                                <TableCell>{drawing.title}</TableCell>
                                <TableCell>
                                  <Badge className={getDisciplineColor(drawing.discipline)}>
                                    {drawing.discipline}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline">{drawing.currentRevision}</Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-2">
                                    {getStatusIcon(drawing.status)}
                                    <span className="capitalize">
                                      {drawing.status.replace('_', ' ')}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm">
                                    <p>{format(new Date(drawing.createdAt), 'dd MMM')}</p>
                                    <p className="text-muted-foreground">{drawing.createdBy}</p>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  {latestRevision
                                    ? `${(latestRevision.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                    : 'N/A'
                                  }
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        setSelectedDrawing(drawing)
                                        setShowCADViewer(true)
                                      }}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon">
                                      <Download className="h-4 w-4" />
                                    </Button>
                                <Button variant="ghost" size="icon">
                                  <History className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                            )
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {drawings.map((drawing) => (
                      <Card key={drawing.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-center justify-between">
                            <Badge className={getDisciplineColor(drawing.discipline)}>
                              {drawing.discipline}
                            </Badge>
                            {getStatusIcon(drawing.status)}
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="font-bold text-lg">{drawing.number}</p>
                          <p className="text-sm text-muted-foreground">{drawing.title}</p>
                          <div className="mt-2 flex items-center justify-between">
                            <Badge variant="outline">{drawing.version}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {drawing.fileSize} MB
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transmittals">
            <DrawingTransmittalList
              transmittals={transmittals}
              drawings={drawings}
              onCreateTransmittal={handleCreateTransmittal}
              onAcknowledge={handleAcknowledgeTransmittal}
              onViewDetails={handleViewTransmittalDetails}
            />
          </TabsContent>

          <TabsContent value="viewer">
            <CADViewer />
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardHeader>
                <CardTitle>Specifications & Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="cursor-pointer hover:shadow-md">
                      <CardContent className="pt-6">
                        <FileText className="h-8 w-8 mb-2 text-blue-600" />
                        <p className="font-medium">Door Schedule</p>
                        <p className="text-sm text-muted-foreground">45 items</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md">
                      <CardContent className="pt-6">
                        <FileText className="h-8 w-8 mb-2 text-green-600" />
                        <p className="font-medium">Window Schedule</p>
                        <p className="text-sm text-muted-foreground">32 items</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md">
                      <CardContent className="pt-6">
                        <FileText className="h-8 w-8 mb-2 text-purple-600" />
                        <p className="font-medium">Finish Schedule</p>
                        <p className="text-sm text-muted-foreground">18 rooms</p>
                      </CardContent>
                    </Card>
                    <Card className="cursor-pointer hover:shadow-md">
                      <CardContent className="pt-6">
                        <FileText className="h-8 w-8 mb-2 text-orange-600" />
                        <p className="font-medium">Fixture Schedule</p>
                        <p className="text-sm text-muted-foreground">67 items</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  )
}