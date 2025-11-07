import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  Maximize,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  FileText,
  Download,
  MessageCircle,
  CheckCircle,
  Clock,
  User,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Lesson {
  id: string
  title: string
  content: string
  type: 'VIDEO' | 'TEXT' | 'INTERACTIVE' | 'QUIZ' | 'ASSIGNMENT'
  duration?: number
  orderIndex: number
  resources?: string
  module: {
    title: string
    course: {
      title: string
      code: string
      instructor: {
        user: {
          firstName: string
          lastName: string
          avatar?: string
        }
      }
    }
  }
  isCompleted: boolean
  completedAt?: string
}

interface LessonViewerProps {
  lessonId?: string
  courseId?: string
}

const LessonViewer: React.FC<LessonViewerProps> = ({ lessonId, courseId }) => {
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [activeTab, setActiveTab] = useState('content')
  const [isLoading, setIsLoading] = useState(true)

  // Mock lesson data
  const mockLesson: Lesson = {
    id: '1',
    title: 'Introduction to Sustainable Design Principles',
    content: `
# Sustainable Design Principles

## Introduction
Sustainable design is a philosophy that seeks to minimize the negative environmental impact of buildings through efficient and moderate use of materials, energy, and development space.

## Key Principles

### 1. Energy Efficiency
- Maximizing natural light and ventilation
- Using renewable energy sources
- Implementing efficient building systems

### 2. Water Conservation
- Rainwater harvesting systems
- Greywater recycling
- Low-flow fixtures and drought-resistant landscaping

### 3. Material Selection
- Using locally sourced materials
- Selecting renewable and recycled materials
- Minimizing waste during construction

### 4. Site Integration
- Preserving natural site features
- Minimizing site disruption
- Creating buildings that work with climate and context

## Case Studies
We'll explore several award-winning sustainable buildings that demonstrate these principles in practice.

## Learning Outcomes
By the end of this lesson, you will be able to:
- Identify key sustainable design principles
- Evaluate buildings for sustainability features
- Apply basic sustainable design concepts to your projects
    `,
    type: 'TEXT',
    duration: 45,
    orderIndex: 1,
    resources: JSON.stringify([
      { name: 'Sustainable Design Guidelines.pdf', url: '/resources/sustainable-guidelines.pdf' },
      { name: 'Case Study Examples', url: '/resources/case-studies/' },
      { name: 'Additional Reading List', url: '/resources/reading-list.pdf' }
    ]),
    module: {
      title: 'Environmental Architecture Fundamentals',
      course: {
        title: 'Environmental Architecture',
        code: 'ARCH301',
        instructor: {
          user: {
            firstName: 'Dr. Sarah',
            lastName: 'Green',
            avatar: '/api/placeholder/40/40'
          }
        }
      }
    },
    isCompleted: false
  }

  useEffect(() => {
    const loadLesson = async () => {
      setIsLoading(true)
      try {
        // Mock API call
        setTimeout(() => {
          setCurrentLesson(mockLesson)
          setIsLoading(false)
        }, 800)
      } catch (error) {
        console.error('Error loading lesson:', error)
        setIsLoading(false)
      }
    }

    loadLesson()
  }, [lessonId])

  const handleMarkComplete = () => {
    if (currentLesson) {
      setCurrentLesson({
        ...currentLesson,
        isCompleted: true,
        completedAt: new Date().toISOString()
      })
    }
  }

  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'VIDEO': return <Play className="h-4 w-4" />
      case 'TEXT': return <BookOpen className="h-4 w-4" />
      case 'INTERACTIVE': return <MessageCircle className="h-4 w-4" />
      case 'QUIZ': return <FileText className="h-4 w-4" />
      case 'ASSIGNMENT': return <FileText className="h-4 w-4" />
      default: return <BookOpen className="h-4 w-4" />
    }
  }

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case 'VIDEO': return 'bg-red-100 text-red-800'
      case 'TEXT': return 'bg-blue-100 text-blue-800'
      case 'INTERACTIVE': return 'bg-green-100 text-green-800'
      case 'QUIZ': return 'bg-purple-100 text-purple-800'
      case 'ASSIGNMENT': return 'bg-orange-100 text-orange-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!currentLesson) {
    return (
      <div className="text-center py-8">
        <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">Lesson not found</p>
      </div>
    )
  }

  const resources = currentLesson.resources ? JSON.parse(currentLesson.resources) : []

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Lesson Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{currentLesson.module.course.code}</span>
                <ChevronRight className="h-4 w-4" />
                <span>{currentLesson.module.title}</span>
              </div>
              <CardTitle className="text-2xl">{currentLesson.title}</CardTitle>
              <div className="flex items-center gap-4">
                <Badge className={getLessonTypeColor(currentLesson.type)}>
                  {getLessonTypeIcon(currentLesson.type)}
                  <span className="ml-1">{currentLesson.type}</span>
                </Badge>
                {currentLesson.duration && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{currentLesson.duration} min</span>
                  </div>
                )}
                {currentLesson.isCompleted && (
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentLesson.module.course.instructor.user.avatar} />
                <AvatarFallback>
                  {currentLesson.module.course.instructor.user.firstName[0]}
                  {currentLesson.module.course.instructor.user.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {currentLesson.module.course.instructor.user.firstName}{' '}
                  {currentLesson.module.course.instructor.user.lastName}
                </p>
                <p className="text-xs text-muted-foreground">Instructor</p>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="h-full">
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b px-6 pt-6">
                  <TabsList>
                    <TabsTrigger value="content">Lesson Content</TabsTrigger>
                    <TabsTrigger value="notes">My Notes</TabsTrigger>
                    <TabsTrigger value="discussion">Discussion</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="content" className="p-6">
                  {currentLesson.type === 'VIDEO' ? (
                    <div className="space-y-4">
                      {/* Video Player Placeholder */}
                      <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                        <div className="text-center text-white">
                          <Play className="h-16 w-16 mx-auto mb-4" />
                          <p>Video Player</p>
                          <p className="text-sm opacity-75">Click to play lesson video</p>
                        </div>
                      </div>
                      
                      {/* Video Controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Button variant="outline" size="sm">
                            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </Button>
                          <div className="flex items-center gap-2">
                            <Volume2 className="h-4 w-4" />
                            <div className="w-20 h-1 bg-gray-300 rounded">
                              <div className="w-1/2 h-1 bg-blue-600 rounded"></div>
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Maximize className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>{progress}% complete</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  ) : (
                    <div className="prose max-w-none">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: currentLesson.content.replace(/\n/g, '<br>').replace(/#{3} /g, '<h3>').replace(/#{2} /g, '<h2>').replace(/#{1} /g, '<h1>') 
                        }} 
                      />
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="p-6">
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Note-taking feature coming soon...</p>
                  </div>
                </TabsContent>

                <TabsContent value="discussion" className="p-6">
                  <div className="text-center py-8">
                    <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Discussion forum coming soon...</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lesson Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lesson Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Completion</span>
                  <span>{currentLesson.isCompleted ? '100%' : '0%'}</span>
                </div>
                <Progress value={currentLesson.isCompleted ? 100 : 0} className="h-2" />
                
                {!currentLesson.isCompleted ? (
                  <Button onClick={handleMarkComplete} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </Button>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-green-600 py-2">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Lesson Complete</span>
                  </div>
                )}

                {currentLesson.completedAt && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Completed {new Date(currentLesson.completedAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resources */}
          {resources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resources.map((resource: any, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={resource.url} 
                        className="text-sm text-blue-600 hover:underline flex-1"
                        target="_blank" 
                        rel="noopener noreferrer"
                      >
                        {resource.name}
                      </a>
                      <Button size="sm" variant="ghost">
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous Lesson
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Next Lesson
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default LessonViewer