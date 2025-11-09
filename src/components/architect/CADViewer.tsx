import React, { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Ruler,
  Layers,
  Eye,
  EyeOff,
  Download,
  Upload,
  FileText,
  FileCheck,
  AlertCircle,
  Settings,
  Pencil,
  Square,
  Circle,
  Type,
  Eraser,
  Undo,
  Redo,
  Save,
  Share2,
  Grid3x3,
  Navigation,
  MousePointer,
  Box,
  Palette,
  ChevronRight,
  ChevronDown,
  Info,
  Home,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import DxfParser from 'dxf-parser'

interface CADViewerProps {
  file?: File | null
  fileUrl?: string
  onSave?: (annotations: any) => void
  className?: string
}

interface Layer {
  name: string
  visible: boolean
  color: string
  entities: number
}

interface Measurement {
  id: string
  type: 'distance' | 'area' | 'angle'
  points: { x: number; y: number }[]
  value: string
  unit: string
}

interface Annotation {
  id: string
  type: 'text' | 'arrow' | 'rectangle' | 'circle' | 'line'
  position: { x: number; y: number }
  data: any
  author: string
  timestamp: Date
}

export default function CADViewer({
  file,
  fileUrl,
  onSave,
  className
}: CADViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fileType, setFileType] = useState<string>('')
  const [fileName, setFileName] = useState<string>('')

  // View controls
  const [zoom, setZoom] = useState(100)
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [gridVisible, setGridVisible] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)

  // Layers
  const [layers, setLayers] = useState<Layer[]>([])
  const [selectedLayers, setSelectedLayers] = useState<string[]>([])

  // Tools
  const [currentTool, setCurrentTool] = useState<string>('pan')
  const [measurements, setMeasurements] = useState<Measurement[]>([])
  const [annotations, setAnnotations] = useState<Annotation[]>([])
  const [selectedAnnotation, setSelectedAnnotation] = useState<string | null>(null)

  // DXF data
  const [dxfData, setDxfData] = useState<any>(null)

  // History for undo/redo
  const [history, setHistory] = useState<any[]>([])
  const [historyIndex, setHistoryIndex] = useState(0)

  // Load and parse file
  useEffect(() => {
    if (file || fileUrl) {
      loadFile()
    }
  }, [file, fileUrl])

  const loadFile = async () => {
    setIsLoading(true)
    setError(null)

    try {
      let content: string | ArrayBuffer | null = null
      let name = ''
      let type = ''

      if (file) {
        name = file.name
        type = file.name.split('.').pop()?.toLowerCase() || ''
        content = await readFile(file)
      } else if (fileUrl) {
        name = fileUrl.split('/').pop() || 'drawing'
        type = name.split('.').pop()?.toLowerCase() || ''
        const response = await fetch(fileUrl)
        content = await response.text()
      }

      setFileName(name)
      setFileType(type)

      if (type === 'dxf' && typeof content === 'string') {
        parseDXF(content)
      } else if (type === 'dwg') {
        setError('DWG files require Autodesk Forge API integration (coming soon)')
      } else if (['pdf', 'png', 'jpg', 'jpeg'].includes(type)) {
        // For image/PDF files, display them directly
        if (fileUrl) {
          displayImage(fileUrl)
        } else if (file) {
          const url = URL.createObjectURL(file)
          displayImage(url)
        }
      } else {
        setError(`Unsupported file type: ${type}`)
      }
    } catch (err) {
      console.error('Error loading file:', err)
      setError('Failed to load file')
      toast.error('Failed to load CAD file')
    } finally {
      setIsLoading(false)
    }
  }

  const readFile = (file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result || '')
      reader.onerror = reject

      if (file.type.includes('image') || file.type === 'application/pdf') {
        reader.readAsDataURL(file)
      } else {
        reader.readAsText(file)
      }
    })
  }

  const parseDXF = (content: string) => {
    try {
      const parser = new DxfParser()
      const dxf = parser.parseSync(content)
      setDxfData(dxf)

      // Extract layers
      const layerList: Layer[] = []
      if (dxf.tables && dxf.tables.layer) {
        Object.values(dxf.tables.layer.layers).forEach((layer: any) => {
          layerList.push({
            name: layer.name,
            visible: true,
            color: getColorFromDXF(layer.color),
            entities: countEntitiesInLayer(dxf.entities, layer.name)
          })
        })
      }
      setLayers(layerList)
      setSelectedLayers(layerList.map(l => l.name))

      // Render DXF on canvas
      renderDXF(dxf)
    } catch (err) {
      console.error('Error parsing DXF:', err)
      setError('Failed to parse DXF file')
    }
  }

  const getColorFromDXF = (colorIndex: number): string => {
    // Simplified AutoCAD color index to hex conversion
    const colors: { [key: number]: string } = {
      1: '#FF0000', // Red
      2: '#FFFF00', // Yellow
      3: '#00FF00', // Green
      4: '#00FFFF', // Cyan
      5: '#0000FF', // Blue
      6: '#FF00FF', // Magenta
      7: '#FFFFFF', // White
    }
    return colors[colorIndex] || '#FFFFFF'
  }

  const countEntitiesInLayer = (entities: any[], layerName: string): number => {
    if (!entities) return 0
    return entities.filter(e => e.layer === layerName).length
  }

  const renderDXF = (dxf: any) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Apply transformations
    ctx.save()
    ctx.translate(panPosition.x, panPosition.y)
    ctx.scale(zoom / 100, zoom / 100)
    ctx.rotate((rotation * Math.PI) / 180)

    // Draw grid if visible
    if (gridVisible) {
      drawGrid(ctx, canvas.width, canvas.height)
    }

    // Draw entities
    if (dxf.entities) {
      dxf.entities.forEach((entity: any) => {
        if (selectedLayers.includes(entity.layer)) {
          drawEntity(ctx, entity)
        }
      })
    }

    // Draw measurements
    measurements.forEach(m => drawMeasurement(ctx, m))

    // Draw annotations
    annotations.forEach(a => drawAnnotation(ctx, a))

    ctx.restore()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = '#e0e0e0'
    ctx.lineWidth = 0.5
    const gridSize = 20

    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
  }

  const drawEntity = (ctx: CanvasRenderingContext2D, entity: any) => {
    const layer = layers.find(l => l.name === entity.layer)
    ctx.strokeStyle = layer?.color || '#FFFFFF'
    ctx.lineWidth = 1

    switch (entity.type) {
      case 'LINE':
        ctx.beginPath()
        ctx.moveTo(entity.vertices[0].x, entity.vertices[0].y)
        ctx.lineTo(entity.vertices[1].x, entity.vertices[1].y)
        ctx.stroke()
        break
      case 'CIRCLE':
        ctx.beginPath()
        ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI)
        ctx.stroke()
        break
      case 'ARC':
        ctx.beginPath()
        ctx.arc(
          entity.center.x,
          entity.center.y,
          entity.radius,
          entity.startAngle,
          entity.endAngle
        )
        ctx.stroke()
        break
      case 'POLYLINE':
      case 'LWPOLYLINE':
        ctx.beginPath()
        entity.vertices.forEach((v: any, i: number) => {
          if (i === 0) {
            ctx.moveTo(v.x, v.y)
          } else {
            ctx.lineTo(v.x, v.y)
          }
        })
        if (entity.closed) ctx.closePath()
        ctx.stroke()
        break
    }
  }

  const drawMeasurement = (ctx: CanvasRenderingContext2D, measurement: Measurement) => {
    ctx.strokeStyle = '#FF9800'
    ctx.fillStyle = '#FF9800'
    ctx.lineWidth = 2
    ctx.font = '12px Arial'

    if (measurement.type === 'distance' && measurement.points.length === 2) {
      // Draw line
      ctx.beginPath()
      ctx.moveTo(measurement.points[0].x, measurement.points[0].y)
      ctx.lineTo(measurement.points[1].x, measurement.points[1].y)
      ctx.stroke()

      // Draw value
      const midX = (measurement.points[0].x + measurement.points[1].x) / 2
      const midY = (measurement.points[0].y + measurement.points[1].y) / 2
      ctx.fillText(measurement.value, midX, midY - 5)
    }
  }

  const drawAnnotation = (ctx: CanvasRenderingContext2D, annotation: Annotation) => {
    ctx.fillStyle = '#2196F3'
    ctx.strokeStyle = '#2196F3'
    ctx.lineWidth = 2

    switch (annotation.type) {
      case 'text':
        ctx.font = '14px Arial'
        ctx.fillText(annotation.data.text, annotation.position.x, annotation.position.y)
        break
      case 'rectangle':
        ctx.strokeRect(
          annotation.position.x,
          annotation.position.y,
          annotation.data.width,
          annotation.data.height
        )
        break
      case 'circle':
        ctx.beginPath()
        ctx.arc(
          annotation.position.x,
          annotation.position.y,
          annotation.data.radius,
          0,
          2 * Math.PI
        )
        ctx.stroke()
        break
    }
  }

  const displayImage = (url: string) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Apply transformations
      ctx.save()
      ctx.translate(panPosition.x, panPosition.y)
      ctx.scale(zoom / 100, zoom / 100)
      ctx.rotate((rotation * Math.PI) / 180)

      ctx.drawImage(img, 0, 0)
      ctx.restore()
    }
    img.src = url
  }

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 500))
    if (dxfData) renderDXF(dxfData)
  }

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 10))
    if (dxfData) renderDXF(dxfData)
  }

  const handleResetView = () => {
    setZoom(100)
    setPanPosition({ x: 0, y: 0 })
    setRotation(0)
    if (dxfData) renderDXF(dxfData)
  }

  const handleLayerToggle = (layerName: string) => {
    setSelectedLayers(prev => {
      if (prev.includes(layerName)) {
        return prev.filter(l => l !== layerName)
      } else {
        return [...prev, layerName]
      }
    })
    if (dxfData) renderDXF(dxfData)
  }

  const handleSave = () => {
    if (onSave) {
      onSave({
        annotations,
        measurements,
        zoom,
        panPosition,
        rotation
      })
      toast.success('Annotations saved')
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      loadFile()
    }
  }

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CardTitle>CAD/BIM Viewer</CardTitle>
              {fileName && (
                <>
                  <Badge variant="secondary">{fileType.toUpperCase()}</Badge>
                  <span className="text-sm text-muted-foreground">{fileName}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              <input
                id="file-upload"
                type="file"
                accept=".dxf,.dwg,.pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              {annotations.length > 0 && (
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              )}
              <Button size="sm" variant="outline">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0">
          <div className="flex h-full">
            {/* Toolbar */}
            <div className="w-12 border-r bg-muted/10 p-2 flex flex-col gap-1">
              <Button
                size="icon"
                variant={currentTool === 'pan' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('pan')}
                title="Pan"
              >
                <Move className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={currentTool === 'select' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('select')}
                title="Select"
              >
                <MousePointer className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={currentTool === 'measure' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('measure')}
                title="Measure"
              >
                <Ruler className="h-4 w-4" />
              </Button>
              <Separator className="my-2" />
              <Button
                size="icon"
                variant={currentTool === 'text' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('text')}
                title="Text"
              >
                <Type className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={currentTool === 'line' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('line')}
                title="Line"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={currentTool === 'rectangle' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('rectangle')}
                title="Rectangle"
              >
                <Square className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant={currentTool === 'circle' ? 'default' : 'ghost'}
                onClick={() => setCurrentTool('circle')}
                title="Circle"
              >
                <Circle className="h-4 w-4" />
              </Button>
              <Separator className="my-2" />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => console.log('Undo')}
                title="Undo"
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => console.log('Redo')}
                title="Redo"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>

            {/* Main Viewer */}
            <div className="flex-1 relative" ref={containerRef}>
              {isLoading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : error ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">{error}</p>
                  </div>
                </div>
              ) : (
                <>
                  <canvas
                    ref={canvasRef}
                    width={800}
                    height={600}
                    className="w-full h-full bg-background"
                    style={{ cursor: currentTool === 'pan' ? 'move' : 'crosshair' }}
                  />

                  {/* View Controls */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-background/95 backdrop-blur rounded-lg p-2 shadow-lg">
                    <Button size="icon" variant="ghost" onClick={handleZoomOut}>
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                      <Slider
                        value={[zoom]}
                        onValueChange={([v]) => {
                          setZoom(v)
                          if (dxfData) renderDXF(dxfData)
                        }}
                        min={10}
                        max={500}
                        step={10}
                        className="w-32"
                      />
                    </div>
                    <Button size="icon" variant="ghost" onClick={handleZoomIn}>
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6" />
                    <Button size="icon" variant="ghost" onClick={handleResetView}>
                      <Home className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => console.log('Fit')}>
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Grid Toggle */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 bg-background/95 backdrop-blur rounded-lg p-2 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Grid3x3 className="h-4 w-4" />
                      <Label htmlFor="grid-toggle" className="text-xs">Grid</Label>
                      <Switch
                        id="grid-toggle"
                        checked={gridVisible}
                        onCheckedChange={setGridVisible}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right Sidebar - Layers & Properties */}
            <div className="w-64 border-l bg-muted/10">
              <Tabs defaultValue="layers" className="h-full">
                <TabsList className="w-full rounded-none">
                  <TabsTrigger value="layers" className="flex-1">
                    <Layers className="h-4 w-4 mr-2" />
                    Layers
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="flex-1">
                    <Info className="h-4 w-4 mr-2" />
                    Properties
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="layers" className="p-4 mt-0">
                  <ScrollArea className="h-[calc(100vh-20rem)]">
                    <div className="space-y-2">
                      {layers.map(layer => (
                        <div
                          key={layer.name}
                          className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              onClick={() => handleLayerToggle(layer.name)}
                            >
                              {selectedLayers.includes(layer.name) ? (
                                <Eye className="h-3 w-3" />
                              ) : (
                                <EyeOff className="h-3 w-3" />
                              )}
                            </Button>
                            <div
                              className="w-3 h-3 rounded-full border"
                              style={{ backgroundColor: layer.color }}
                            />
                            <span className="text-sm">{layer.name}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {layer.entities}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="properties" className="p-4 mt-0">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">File Name</Label>
                      <p className="text-sm font-medium">{fileName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">File Type</Label>
                      <p className="text-sm font-medium">{fileType.toUpperCase()}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Dimensions</Label>
                      <p className="text-sm font-medium">800 x 600</p>
                    </div>
                    <Separator />
                    <div>
                      <Label className="text-xs text-muted-foreground">Annotations</Label>
                      <p className="text-sm font-medium">{annotations.length} items</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Measurements</Label>
                      <p className="text-sm font-medium">{measurements.length} items</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}