import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  Plus,
  Edit,
  Eye,
  Settings,
  Calendar,
  Clock,
  FileText,
  Award,
  BarChart3,
  Search,
  Filter,
  Upload,
  Video,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  MessageSquare,
  Target
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface TeachingCourse {
  id: string
  title: string
  code: string
  description?: string
  status: string
  level: string
  credits: number
  department: {
    name: string
  }
  _count: {
    enrollments: number
    modules: number
    lessons: number
    assignments: number
  }
  createdAt: string
  updatedAt: string
}

interface StudentProgress {
  student: {
    id: string
    user: {
      firstName: string
      lastName: string
      avatar?: string
      email: string
    }
    studentId: string
  }
  enrolledAt: string
  progress: {
    completedLessons: number
    totalLessons: number
    percentage: number
  }
  assignments: {
    submitted: number
    graded: number
    total: number
    averageGrade: number
  }
  lastActivity: string
}

interface Assignment {
  id: string
  title: string
  dueDate: string
  maxPoints: number
  _count: {
    submissions: number
  }
  course: {
    title: string
    code: string
  }
  status: string
}

const CourseManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('courses')
  const [courses, setCourses] = useState<TeachingCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<TeachingCourse | null>(null)
  const [studentProgress, setStudentProgress] = useState<StudentProgress[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isNewCourseOpen, setIsNewCourseOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Mock data for teaching courses
  const mockTeachingCourses: TeachingCourse[] = [
    {
      id: '1',
      title: 'Advanced Architectural Design',
      code: 'ARCH401',
      description: 'Advanced concepts in architectural design and theory',
      status: 'ACTIVE',
      level: 'UNDERGRADUATE',
      credits: 4,
      department: {
        name: 'Architecture'
      },
      _count: {
        enrollments: 28,
        modules: 12,
        lessons: 48,
        assignments: 8
      },
      createdAt: '2024-01-15',
      updatedAt: '2024-08-10'
    },
    {
      id: '2',
      title: 'Building Information Modeling',
      code: 'TECH301',
      description: 'BIM software and 3D modeling techniques',
      status: 'ACTIVE',
      level: 'GRADUATE',
      credits: 3,
      department: {
        name: 'Technology'
      },
      _count: {
        enrollments: 35,
        modules: 8,
        lessons: 32,
        assignments: 6
      },
      createdAt: '2024-02-01',
      updatedAt: '2024-08-08'
    },
    {
      id: '3',
      title: 'Construction Project Management',
      code: 'PM401',
      description: 'Project management principles in construction',
      status: 'DRAFT',
      level: 'PROFESSIONAL',
      credits: 3,
      department: {
        name: 'Project Management'
      },
      _count: {
        enrollments: 0,
        modules: 4,
        lessons: 16,
        assignments: 3
      },
      createdAt: '2024-07-20',
      updatedAt: '2024-08-05'
    }
  ]

  const mockStudentProgress: StudentProgress[] = [
    {
      student: {
        id: '1',
        user: {
          firstName: 'Ahmad',
          lastName: 'Rahman',
          avatar: '/api/placeholder/32/32',
          email: 'ahmad.rahman@student.daritana.edu'
        },
        studentId: 'STU001'
      },
      enrolledAt: '2024-01-20',
      progress: {
        completedLessons: 42,
        totalLessons: 48,
        percentage: 87.5
      },
      assignments: {
        submitted: 7,
        graded: 6,
        total: 8,
        averageGrade: 85.2
      },
      lastActivity: '2024-08-10'
    },
    {
      student: {
        id: '2',
        user: {
          firstName: 'Siti',
          lastName: 'Nurhaliza',
          avatar: '/api/placeholder/32/32',
          email: 'siti.nurhaliza@student.daritana.edu'
        },
        studentId: 'STU002'
      },
      enrolledAt: '2024-01-22',
      progress: {
        completedLessons: 38,
        totalLessons: 48,
        percentage: 79.2
      },
      assignments: {
        submitted: 6,
        graded: 5,
        total: 8,
        averageGrade: 78.8
      },
      lastActivity: '2024-08-09'
    }
  ]

  const mockAssignments: Assignment[] = [
    {
      id: '1',
      title: 'Building Analysis Report',
      dueDate: '2024-08-25',
      maxPoints: 100,
      _count: {
        submissions: 22
      },
      course: {
        title: 'Advanced Architectural Design',
        code: 'ARCH401'
      },
      status: 'ACTIVE'
    },
    {
      id: '2',
      title: 'BIM Model Creation',
      dueDate: '2024-08-30',
      maxPoints: 120,
      _count: {
        submissions: 15
      },
      course: {
        title: 'Building Information Modeling',
        code: 'TECH301'
      },
      status: 'ACTIVE'
    }
  ]

  useEffect(() => {
    const loadTeachingData = async () => {
      setIsLoading(true)
      try {
        // Mock API calls
        setTimeout(() => {
          setCourses(mockTeachingCourses)
          setStudentProgress(mockStudentProgress)
          setAssignments(mockAssignments)
          setIsLoading(false)
        }, 800)
      } catch (error) {
        console.error('Error loading teaching data:', error)
        setIsLoading(false)
      }
    }

    loadTeachingData()
  }, [])

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'PUBLISHED': return 'bg-blue-100 text-blue-800'
      case 'ARCHIVED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'UNDERGRADUATE': return 'bg-blue-100 text-blue-800'
      case 'GRADUATE': return 'bg-purple-100 text-purple-800'
      case 'DOCTORAL': return 'bg-red-100 text-red-800'
      case 'PROFESSIONAL': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Teaching Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Courses</p>
                <p className="text-2xl font-bold">{courses.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold">
                  {courses.reduce((sum, course) => sum + course._count.enrollments, 0)}
                </p>
              </div>
              <Users className="h-8 w-8 text-green-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Assignments</p>
                <p className="text-2xl font-bold">{assignments.length}</p>
              </div>
              <FileText className="h-8 w-8 text-orange-600 opacity-60" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg. Progress</p>
                <p className="text-2xl font-bold">82%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600 opacity-60" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="students">Student Progress</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <Dialog open={isNewCourseOpen} onOpenChange={setIsNewCourseOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Set up a new course for your students
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="course-title">Course Title</Label>
                    <Input id="course-title" placeholder="e.g., Advanced Architectural Design" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="course-code">Course Code</Label>
                    <Input id="course-code" placeholder="e.g., ARCH401" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Brief description of the course" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="level">Level</Label>
                    <select id="level" className="w-full px-3 py-2 border rounded-md">
                      <option value="UNDERGRADUATE">Undergraduate</option>
                      <option value="GRADUATE">Graduate</option>
                      <option value="DOCTORAL">Doctoral</option>
                      <option value="PROFESSIONAL">Professional</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits">Credits</Label>
                    <Input id="credits" type="number" placeholder="3" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max-enrollment">Max Students</Label>
                    <Input id="max-enrollment" type="number" placeholder="30" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="syllabus">Syllabus</Label>
                  <Textarea id="syllabus" placeholder="Course syllabus and learning outcomes" />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsNewCourseOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsNewCourseOpen(false)}>
                    Create Course
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="courses" className="space-y-4">
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                      <Badge className={getStatusColor(course.status)}>
                        {course.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg">{course.code}</CardTitle>
                    <CardDescription>{course.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span>{course._count.enrollments} students</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{course._count.modules} modules</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Video className="h-4 w-4 text-muted-foreground" />
                          <span>{course._count.lessons} lessons</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span>{course._count.assignments} assignments</span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Last updated: {new Date(course.updatedAt).toLocaleDateString()}
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Student Progress Overview</CardTitle>
              <CardDescription>Monitor your students' learning progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrolled</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Assignments</TableHead>
                      <TableHead>Avg Grade</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentProgress.map((progress) => (
                      <TableRow key={progress.student.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={progress.student.user.avatar} />
                              <AvatarFallback>
                                {progress.student.user.firstName[0]}{progress.student.user.lastName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">
                                {progress.student.user.firstName} {progress.student.user.lastName}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {progress.student.studentId}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(progress.enrolledAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>{progress.progress.percentage.toFixed(0)}%</span>
                              <span className="text-muted-foreground">
                                {progress.progress.completedLessons}/{progress.progress.totalLessons}
                              </span>
                            </div>
                            <Progress value={progress.progress.percentage} className="h-1" />
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {progress.assignments.submitted}/{progress.assignments.total}
                        </TableCell>
                        <TableCell className="text-sm font-medium">
                          {progress.assignments.averageGrade.toFixed(1)}%
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(progress.lastActivity).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Assignments</CardTitle>
              <CardDescription>Manage assignments and track submissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {assignments.map((assignment) => (
                  <div key={assignment.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold">{assignment.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {assignment.course.code} - {assignment.course.title}
                        </p>
                      </div>
                      <Badge className={getStatusColor(assignment.status)}>
                        {assignment.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment.maxPoints} points</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{assignment._count.submissions} submissions</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-2" />
                        View Submissions
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Assignment
                      </Button>
                      <Button size="sm" variant="outline">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Analytics
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Analytics</CardTitle>
              <CardDescription>
                Comprehensive analytics for your courses and student performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Teaching analytics coming soon...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default CourseManagement