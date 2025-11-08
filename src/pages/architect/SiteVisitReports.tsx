import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Camera,
  MapPin,
  Calendar,
  User,
  Cloud,
  Sun,
  CloudRain,
  CheckCircle,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  Plus,
  Clock,
  ThermometerSun,
  Wind,
  Droplets
} from 'lucide-react'
import { format } from 'date-fns'
import PageWrapper from '@/components/PageWrapper'

interface SiteVisit {
  id: string
  projectId: string
  visitNumber: string
  date: Date
  inspector: string
  weather: 'sunny' | 'cloudy' | 'rainy' | 'stormy'
  temperature: number
  workProgress: number
  workersOnSite: number
  safetyIssues: number
  qualityIssues: number
  photos: number
  notes: string
  punchListItems: number
}

export default function SiteVisitReports() {
  const [visits, setVisits] = useState<SiteVisit[]>([
    {
      id: '1',
      projectId: 'proj-1',
      visitNumber: 'SV-001',
      date: new Date('2024-01-18'),
      inspector: 'Ahmad Rahman',
      weather: 'sunny',
      temperature: 32,
      workProgress: 45,
      workersOnSite: 28,
      safetyIssues: 2,
      qualityIssues: 3,
      photos: 24,
      notes: 'Foundation work completed. Starting column work on Grid A-C.',
      punchListItems: 5
    },
    {
      id: '2',
      projectId: 'proj-1',
      visitNumber: 'SV-002',
      date: new Date('2024-01-16'),
      inspector: 'Sarah Lee',
      weather: 'rainy',
      temperature: 28,
      workProgress: 42,
      workersOnSite: 15,
      safetyIssues: 1,
      qualityIssues: 2,
      photos: 18,
      notes: 'Work slowed due to rain. Waterproofing inspection completed.',
      punchListItems: 3
    }
  ])

  const getWeatherIcon = (weather: SiteVisit['weather']) => {
    switch (weather) {
      case 'sunny':
        return <Sun className="h-5 w-5 text-yellow-500" />
      case 'cloudy':
        return <Cloud className="h-5 w-5 text-gray-500" />
      case 'rainy':
        return <CloudRain className="h-5 w-5 text-blue-500" />
      case 'stormy':
        return <CloudRain className="h-5 w-5 text-purple-500" />
    }
  }

  return (
    <PageWrapper title="Site Visit Reports">
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{visits.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">8</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Photos Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {visits.reduce((sum, v) => sum + v.photos, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Visit Form */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>New Site Visit Report</CardTitle>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Report
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Weather Conditions</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <span>Sunny, 32°C</span>
                </div>
              </div>
              <div>
                <Label>Workers on Site</Label>
                <Input type="number" placeholder="Number of workers" className="mt-2" />
              </div>
              <div>
                <Label>Work Progress</Label>
                <Input type="number" placeholder="Percentage complete" className="mt-2" />
              </div>
            </div>
            <div className="mt-4">
              <Label>Site Observations</Label>
              <Textarea
                placeholder="Document work progress, issues, and observations..."
                rows={4}
                className="mt-2"
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Button variant="outline">
                <Camera className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
              <Button variant="outline">
                <MapPin className="h-4 w-4 mr-2" />
                Tag Location
              </Button>
              <Button variant="outline">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Visits */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Site Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {visits.map((visit) => (
                <div key={visit.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <h3 className="font-semibold">{visit.visitNumber}</h3>
                        <Badge variant="outline">
                          {format(visit.date, 'dd MMM yyyy')}
                        </Badge>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span className="text-sm">{visit.inspector}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(visit.weather)}
                          <span>{visit.temperature}°C</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          <span>{visit.workersOnSite} workers</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Camera className="h-4 w-4" />
                          <span>{visit.photos} photos</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{visit.notes}</p>
                      <div className="flex items-center gap-4">
                        {visit.safetyIssues > 0 && (
                          <Badge variant="destructive">
                            {visit.safetyIssues} Safety Issues
                          </Badge>
                        )}
                        {visit.qualityIssues > 0 && (
                          <Badge variant="default" className="bg-orange-500">
                            {visit.qualityIssues} Quality Issues
                          </Badge>
                        )}
                        {visit.punchListItems > 0 && (
                          <Badge variant="secondary">
                            {visit.punchListItems} Punch List Items
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageWrapper>
  )
}