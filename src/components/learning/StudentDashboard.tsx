import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Clock,
  Calendar,
  CheckCircle,
  AlertCircle,
  PlayCircle,
  FileText,
  Award,
  TrendingUp,
  User,
  ChevronRight,
  Target,
  BarChart3,
  Loader2,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { learningService } from '@/services/learning.service'

interface EnrolledCourse {
  id: string
  course: {
    id: string
    title: string
    code: string
    instructor: {
      user: {
        firstName: string
        lastName: string
        avatar?: string
      }
    }
    _count: {
      lessons: number
      assignments: number
    }
  }
  progress: {
    completedLessons: number
    totalLessons: number
    percentage: number
  }
  status: string
  enrolledAt: string
}

interface Assignment {
  id: string
  title: string
  description: string
  dueDate: string
  maxPoints: number
  course: {
    title: string
    code: string
  }
  isSubmitted: boolean
  grade?: number
  submittedAt?: string
}

interface StudentStats {
  totalCourses: number
  completedLessons: number
  pendingAssignments: number
  averageProgress: number
}

export const StudentDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses')
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [stats, setStats] = useState<StudentStats | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  useEffect(() => {
    loadStudentData()
  }, [])

  const loadStudentData = async () => {
    try {
      setIsLoadingData(true)
      
      // Load data in parallel
      const [coursesData, assignmentsData, statsData] = await Promise.all([
        learningService.getEnrolledCourses(),
        learningService.getStudentAssignments(),
        learningService.getStudentStats()
      ])

      setEnrolledCourses(coursesData || [])
      setAssignments(assignmentsData || [])
      setStats(statsData || null)
    } catch (error) {
      console.error('Error loading student data:', error)
      toast.error('Failed to load student data')
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleCourseAction = async (courseId: string, action: 'resume' | 'view' | 'download') => {
    try {
      setIsLoading(true)
      
      switch (action) {
        case 'resume':
          await learningService.resumeCourse(courseId)
          toast.success('Course resumed successfully')
          break
        case 'view':
          await learningService.viewCourse(courseId)
          break
        case 'download':
          await learningService.downloadCourse(courseId)
          toast.success('Course materials downloaded')
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on course:`, error)
      toast.error(`Failed to ${action} course`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAssignmentAction = async (assignmentId: string, action: 'submit' | 'view' | 'download') => {
    try {
      setIsLoading(true)
      
      switch (action) {
        case 'submit':
          await learningService.submitAssignment(assignmentId, {})
          toast.success('Assignment submitted successfully')
          await loadStudentData() // Refresh data
          break
        case 'view':
          await learningService.viewAssignment(assignmentId)
          break
        case 'download':
          await learningService.downloadAssignment(assignmentId)
          toast.success('Assignment downloaded')
          break
      }
    } catch (error) {
      console.error(`Error performing ${action} on assignment:`, error)
      toast.error(`Failed to ${action} assignment`)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
      case 'DROPPED': return 'bg-red-100 text-red-800'
      case 'PAUSED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDaysUntilDue = (dueDate: string): number => {
    const due = new Date(dueDate)
    const today = new Date()
    const diffTime = due.getTime() - today.getTime()
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getAssignmentStatus = (assignment: Assignment) => {
    if (assignment.isSubmitted) {
      return assignment.grade ? 'Graded' : 'Submitted'
    }
    
    const daysUntilDue = getDaysUntilDue(assignment.dueDate)
    if (daysUntilDue < 0) return 'Overdue'
    if (daysUntilDue <= 2) return 'Due Soon'
    return 'Pending'
  }

  const getAssignmentStatusColor = (assignment: Assignment) => {
    const status = getAssignmentStatus(assignment)
    switch (status) {
      case 'Graded': return 'bg-green-100 text-green-800'
      case 'Submitted': return 'bg-blue-100 text-blue-800'
      case 'Due Soon': return 'bg-orange-100 text-orange-800'
      case 'Overdue': return 'bg-red-100 text-red-800'
      case 'Pending': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading student dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Student Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Enrolled Courses</p>
                  <p className="text-2xl font-bold">{stats.totalCourses}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed Lessons</p>
                  <p className="text-2xl font-bold">{stats.completedLessons}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pending Assignments</p>
                  <p className="text-2xl font-bold">{stats.pendingAssignments}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600 opacity-60" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Average Progress</p>
                  <p className="text-2xl font-bold">{stats.averageProgress.toFixed(1)}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600 opacity-60" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Enrolled Courses</h2>
            <Button onClick={() => window.location.href = '/learning/courses'}>
              Browse More Courses
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No courses enrolled</h3>
                <p className="text-gray-600 mb-4">
                  Start your learning journey by enrolling in courses
                </p>
                <Button onClick={() => window.location.href = '/learning/courses'}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrolledCourse) => (
                <Card key={enrolledCourse.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{enrolledCourse.course.title}</CardTitle>
                        <CardDescription className="text-sm font-mono">
                          {enrolledCourse.course.code}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(enrolledCourse.status)}>
                        {enrolledCourse.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Instructor Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={enrolledCourse.course.instructor.user.avatar} />
                        <AvatarFallback>
                          {enrolledCourse.course.instructor.user.firstName[0]}
                          {enrolledCourse.course.instructor.user.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm">
                        <p className="font-medium">
                          {enrolledCourse.course.instructor.user.firstName} {enrolledCourse.course.instructor.user.lastName}
                        </p>
                        <p className="text-muted-foreground">Instructor</p>
                      </div>
                    </div>

                    {/* Course Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Lessons</p>
                        <p className="font-medium">{enrolledCourse.course._count.lessons}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Assignments</p>
                        <p className="font-medium">{enrolledCourse.course._count.assignments}</p>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span>Progress</span>
                        <span>{enrolledCourse.progress.percentage}%</span>
                      </div>
                      <Progress value={enrolledCourse.progress.percentage} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {enrolledCourse.progress.completedLessons} of {enrolledCourse.progress.totalLessons} lessons completed
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      {enrolledCourse.status === 'ACTIVE' && (
                        <Button
                          size="sm"
                          className="flex-1"
                          onClick={() => handleCourseAction(enrolledCourse.course.id, 'resume')}
                          disabled={isLoading}
                        >
                          <PlayCircle className="mr-2 h-4 w-4" />
                          Resume
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCourseAction(enrolledCourse.course.id, 'view')}
                        disabled={isLoading}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCourseAction(enrolledCourse.course.id, 'download')}
                        disabled={isLoading}
                      >
                        <FileText className="mr-2 h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Assignments Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">My Assignments</h2>
            <Button onClick={() => window.location.href = '/learning/assignments'}>
              View All Assignments
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No assignments</h3>
                <p className="text-gray-600 mb-4">
                  You don't have any assignments at the moment
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">{assignment.description}</p>
                          </div>
                          <Badge className={getAssignmentStatusColor(assignment)}>
                            {getAssignmentStatus(assignment)}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Course</p>
                            <p className="font-medium">{assignment.course.title}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">
                              {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Max Points</p>
                            <p className="font-medium">{assignment.maxPoints}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Days Left</p>
                            <p className="font-medium">
                              {getDaysUntilDue(assignment.dueDate)}
                            </p>
                          </div>
                        </div>

                        {assignment.isSubmitted && assignment.grade && (
                          <div className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-600">
                              Grade: {assignment.grade}/{assignment.maxPoints}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col space-y-2 ml-4">
                        {!assignment.isSubmitted && (
                          <Button
                            size="sm"
                            onClick={() => handleAssignmentAction(assignment.id, 'submit')}
                            disabled={isLoading}
                          >
                            Submit
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignmentAction(assignment.id, 'view')}
                          disabled={isLoading}
                        >
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAssignmentAction(assignment.id, 'download')}
                          disabled={isLoading}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <h2 className="text-2xl font-bold">Learning Progress</h2>
          
          {enrolledCourses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No progress data</h3>
                <p className="text-gray-600 mb-4">
                  Enroll in courses to start tracking your progress
                </p>
                <Button onClick={() => window.location.href = '/learning/courses'}>
                  Browse Courses
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Overall Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Overall Learning Progress</CardTitle>
                  <CardDescription>
                    Your progress across all enrolled courses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Average Progress</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {stats?.averageProgress.toFixed(1)}%
                      </span>
                    </div>
                    <Progress value={stats?.averageProgress || 0} className="h-3" />
                  </div>
                </CardContent>
              </Card>

              {/* Course Progress Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Progress Breakdown</CardTitle>
                  <CardDescription>
                    Detailed progress for each enrolled course
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrolledCourses.map((enrolledCourse) => (
                      <div key={enrolledCourse.id} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{enrolledCourse.course.title}</span>
                          <span>{enrolledCourse.progress.percentage}%</span>
                        </div>
                        <Progress value={enrolledCourse.progress.percentage} className="h-2" />
                        <p className="text-xs text-muted-foreground">
                          {enrolledCourse.progress.completedLessons} of {enrolledCourse.progress.totalLessons} lessons completed
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Learning Streak */}
              <Card>
                <CardHeader>
                  <CardTitle>Learning Streak</CardTitle>
                  <CardDescription>
                    Maintain consistency in your learning journey
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">7</div>
                    <p className="text-sm text-muted-foreground">Days in a row</p>
                    <div className="mt-4 flex justify-center space-x-1">
                      {Array.from({ length: 7 }, (_, i) => (
                        <div
                          key={i}
                          className="w-3 h-3 rounded-full bg-orange-500"
                        />
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}