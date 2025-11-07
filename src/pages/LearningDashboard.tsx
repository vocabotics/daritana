import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen,
  Users,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  Play,
  FileText,
  MessageCircle,
  Target,
  BarChart3,
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  GraduationCap,
  Video,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Star,
  ChevronRight,
  PlayCircle
} from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useAuthStore } from '@/store/authStore'
import { learningApi } from '@/lib/api'
import CourseManagement from '@/components/learning/CourseManagement'
import { StudentDashboard } from '@/components/learning/StudentDashboard'
import LessonViewer from '@/components/learning/LessonViewer'

interface LearningMetric {
  id: string
  title: string
  value: string
  change: string
  icon: React.ReactNode
  color: string
}

interface Course {
  id: string
  title: string
  code: string
  description?: string
  instructor: {
    user: {
      firstName: string
      lastName: string
      avatar?: string
    }
  }
  department: {
    name: string
    institution: {
      name: string
    }
  }
  _count: {
    enrollments: number
    modules: number
    lessons: number
    assignments: number
  }
  level: string
  credits: number
  status: string
}

interface RecentActivity {
  id: string
  type: 'lesson' | 'assignment' | 'discussion' | 'achievement'
  title: string
  description: string
  timestamp: string
  course?: {
    title: string
    code: string
  }
  icon: React.ReactNode
  color: string
}

const LearningDashboard: React.FC = () => {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('overview')
  const [courses, setCourses] = useState<Course[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const isInstructor = user?.role === 'PROJECT_LEAD' || user?.role === 'ADMIN'
  const isStudent = user?.role === 'STAFF' || user?.role === 'DESIGNER'

  const learningMetrics: LearningMetric[] = [
    {
      id: '1',
      title: 'Active Courses',
      value: '8',
      change: '+2',
      icon: <BookOpen className="h-5 w-5" />,
      color: 'text-blue-600'
    },
    {
      id: '2',
      title: 'Total Students',
      value: '247',
      change: '+18',
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      id: '3',
      title: 'Learning Hours',
      value: '1,432',
      change: '+156',
      icon: <Clock className="h-5 w-5" />,
      color: 'text-orange-600'
    },
    {
      id: '4',
      title: 'Certificates Earned',
      value: '89',
      change: '+12',
      icon: <Award className="h-5 w-5" />,
      color: 'text-purple-600'
    },
    {
      id: '5',
      title: 'Course Completion',
      value: '78%',
      change: '+5.2%',
      icon: <TrendingUp className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      id: '6',
      title: 'Active Discussions',
      value: '156',
      change: '+23',
      icon: <MessageCircle className="h-5 w-5" />,
      color: 'text-indigo-600'
    }
  ]

  // Course and activity data will be loaded from real APIs

  useEffect(() => {
    const loadLearningData = async () => {
      setIsLoading(true)
      try {
        // Fetch courses from real API
        const coursesResponse = await learningApi.getCourses()
        if (coursesResponse.success && coursesResponse.data.courses) {
          const formattedCourses = coursesResponse.data.courses.map((course: any) => ({
            id: course.id,
            title: course.title,
            code: course.code || course.id,
            description: course.description,
            instructor: {
              user: {
                firstName: course.instructor?.name?.split(' ')[0] || course.instructor?.firstName || 'Instructor',
                lastName: course.instructor?.name?.split(' ').slice(1).join(' ') || course.instructor?.lastName || '',
                avatar: course.instructor?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(course.instructor?.name || 'Instructor')}&background=0D8ABC&color=fff`
              }
            },
            department: {
              name: course.category || course.department?.name || 'General',
              institution: {
                name: course.institution?.name || 'Daritana University'
              }
            },
            _count: {
              enrollments: course.enrolled || course._count?.enrollments || 0,
              modules: course.modules || course._count?.modules || 0,
              lessons: course._count?.lessons || 0,
              assignments: course._count?.assignments || 0
            },
            level: course.level?.toUpperCase() || 'UNDERGRADUATE',
            credits: course.credits || 3,
            status: course.status || 'ACTIVE'
          }))
          setCourses(formattedCourses)
        }

        // Fetch recent activities from real API
        const activitiesResponse = await learningApi.getActivities()
        if (activitiesResponse.success && activitiesResponse.data.activities) {
          const formattedActivities = activitiesResponse.data.activities.map((activity: any) => ({
            id: activity.id,
            type: activity.type || 'lesson',
            title: activity.title,
            description: activity.description,
            timestamp: activity.timestamp || 'Recently',
            course: activity.course ? {
              title: activity.course.title,
              code: activity.course.code || activity.course.id
            } : undefined,
            icon: getActivityIcon(activity.type),
            color: getActivityColor(activity.type)
          }))
          setRecentActivity(formattedActivities)
        }

      } catch (error) {
        console.error('Error loading learning data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLearningData()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <CheckCircle className="h-4 w-4" />
      case 'assignment': return <AlertCircle className="h-4 w-4" />
      case 'discussion': return <MessageCircle className="h-4 w-4" />
      case 'achievement': return <Award className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lesson': return 'text-green-600'
      case 'assignment': return 'text-orange-600'
      case 'discussion': return 'text-blue-600'
      case 'achievement': return 'text-purple-600'
      default: return 'text-green-600'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'DRAFT': return 'bg-gray-100 text-gray-800'
      case 'COMPLETED': return 'bg-blue-100 text-blue-800'
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
    course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.instructor.user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isLoading) {
    return (
      <Layout title="Learning Platform" description="Digital Learning Management System">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </Layout>
    )
  }

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <div className="flex items-center gap-3">
        <GraduationCap className="h-5 w-5 text-blue-600" />
        <span className="text-lg font-semibold text-gray-900">Learning Platform</span>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={handleRefresh} variant="outline" size="sm" className="h-8">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button size="sm" className="h-8">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="space-y-6">
        {/* Learning Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {learningMetrics.map((metric) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.title}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-2xl font-bold">{metric.value}</p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          metric.change.startsWith('+') 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {metric.change}
                        </span>
                      </div>
                    </div>
                    <div className={`${metric.color} opacity-60`}>
                      {metric.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Learning Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isStudent && <TabsTrigger value="my-courses">My Courses</TabsTrigger>}
            {isInstructor && <TabsTrigger value="teaching">Teaching</TabsTrigger>}
            <TabsTrigger value="browse">Browse Courses</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            activity.color === 'text-green-600' ? 'bg-green-100' :
                            activity.color === 'text-orange-600' ? 'bg-orange-100' :
                            activity.color === 'text-blue-600' ? 'bg-blue-100' :
                            'bg-purple-100'
                          }`}>
                            <div className={activity.color}>
                              {activity.icon}
                            </div>
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium">{activity.title}</p>
                            <p className="text-xs text-muted-foreground">{activity.description}</p>
                            {activity.course && (
                              <p className="text-xs text-blue-600">
                                {activity.course.code} - {activity.course.title}
                              </p>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Learning Goals
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Course Completion</span>
                          <span className="text-sm text-muted-foreground">6/8</span>
                        </div>
                        <Progress value={75} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Skills Development</span>
                          <span className="text-sm text-muted-foreground">12/15</span>
                        </div>
                        <Progress value={80} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium">Certification Progress</span>
                          <span className="text-sm text-muted-foreground">3/5</span>
                        </div>
                        <Progress value={60} className="h-2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                          <Star className="h-4 w-4 text-yellow-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Fast Learner</p>
                          <p className="text-xs text-muted-foreground">Complete 5 lessons in a day</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Course Conqueror</p>
                          <p className="text-xs text-muted-foreground">Complete first course</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Users className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Active Participant</p>
                          <p className="text-xs text-muted-foreground">Join 10 discussions</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Featured Courses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Featured Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.slice(0, 3).map((course) => (
                    <motion.div
                      key={course.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <Badge className={getLevelColor(course.level)}>
                            {course.level}
                          </Badge>
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                        </div>
                        <div>
                          <h3 className="font-semibold">{course.code}</h3>
                          <p className="text-sm font-medium text-muted-foreground">{course.title}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={course.instructor.user.avatar} />
                            <AvatarFallback className="text-xs">
                              {course.instructor.user.firstName[0]}{course.instructor.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {course.instructor.user.firstName} {course.instructor.user.lastName}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>{course._count.enrollments} students</span>
                          <span>{course._count.lessons} lessons</span>
                          <span>{course.credits} credits</span>
                        </div>
                        <Button className="w-full" size="sm">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {isStudent ? 'Enroll Now' : 'View Course'}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {isStudent && (
            <TabsContent value="my-courses" className="space-y-4">
              <StudentDashboard />
            </TabsContent>
          )}

          {isInstructor && (
            <TabsContent value="teaching" className="space-y-4">
              <CourseManagement />
            </TabsContent>
          )}

          <TabsContent value="browse" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
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
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={course.instructor.user.avatar} />
                            <AvatarFallback>
                              {course.instructor.user.firstName[0]}{course.instructor.user.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {course.instructor.user.firstName} {course.instructor.user.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">{course.department.name}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{course._count.enrollments} students</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Play className="h-4 w-4 text-muted-foreground" />
                            <span>{course._count.lessons} lessons</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span>{course._count.assignments} assignments</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Award className="h-4 w-4 text-muted-foreground" />
                            <span>{course.credits} credits</span>
                          </div>
                        </div>

                        <Button className="w-full">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          {isStudent ? 'Enroll' : 'View Details'}
                          <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Progress</CardTitle>
                <CardDescription>
                  Track your progress across all courses and learning activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Progress tracking system coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Learning Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analysis of learning patterns and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  )
}

export default LearningDashboard