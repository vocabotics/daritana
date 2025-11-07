import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play,
  Pause,
  SkipForward,
  Volume2,
  Maximize,
  Download,
  Share,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Award,
  BookOpen,
  GraduationCap,
  TrendingUp,
  Star,
  CheckCircle,
  Lock,
  PlayCircle,
  FileText,
  Users,
  Calendar,
  DollarSign,
  Filter,
  Search,
  ChevronRight,
  ChevronDown,
  Bookmark,
  Bell,
  Certificate,
  Trophy,
  Target,
  Zap,
  Brain,
  School,
  Building,
  HardHat,
  Ruler,
  Hammer,
  PenTool,
  Layers,
  Shield,
  AlertCircle,
  BarChart,
  Globe,
  Sparkles
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string;
  instructor: {
    name: string;
    avatar: string;
    credentials: string;
    verified: boolean;
    rating: number;
    students: number;
  };
  category: 'architecture' | 'engineering' | 'construction' | 'design' | 'safety' | 'regulation' | 'technology' | 'business';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  duration: string;
  modules: number;
  enrolled: number;
  rating: number;
  reviews: number;
  price: number;
  certification: boolean;
  language: string[];
  lastUpdated: Date;
  thumbnail: string;
  preview?: string;
  tags: string[];
  progress?: number;
  isEnrolled?: boolean;
  isFeatured?: boolean;
  university?: string;
  accreditation?: string[];
}

interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: 'video' | 'reading' | 'quiz' | 'assignment' | 'live';
  isCompleted: boolean;
  isLocked: boolean;
  resources?: number;
}

interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
  duration: string;
  isExpanded: boolean;
}

// Mock courses data
const mockCourses: Course[] = [
  {
    id: '1',
    title: 'UBBL 2025 Compliance Masterclass',
    description: 'Complete guide to the new Uniform Building By-Laws amendments. Learn about BIM requirements, sustainability standards, and accessibility updates.',
    instructor: {
      name: 'Datuk Ar. Ahmad Rahman',
      avatar: '',
      credentials: 'Former CIDB Board Member, 30+ years experience',
      verified: true,
      rating: 4.9,
      students: 15420
    },
    category: 'regulation',
    level: 'intermediate',
    duration: '8 hours',
    modules: 12,
    enrolled: 3420,
    rating: 4.8,
    reviews: 892,
    price: 299,
    certification: true,
    language: ['English', 'Malay'],
    lastUpdated: new Date('2024-12-01'),
    thumbnail: '/images/courses/ubbl-2025.jpg',
    preview: '/videos/ubbl-preview.mp4',
    tags: ['UBBL', 'Compliance', 'Regulations', 'BIM', 'Sustainability'],
    isEnrolled: true,
    progress: 35,
    isFeatured: true,
    accreditation: ['CIDB', 'PAM', 'IEM']
  },
  {
    id: '2',
    title: 'Tropical Architecture Design Principles',
    description: 'Master the art of designing for Malaysian climate. Learn passive cooling, natural ventilation, and sustainable materials selection.',
    instructor: {
      name: 'Prof. Dr. Sarah Lim',
      avatar: '',
      credentials: 'UTM Architecture, Green Building Expert',
      verified: true,
      rating: 4.9,
      students: 8920
    },
    category: 'architecture',
    level: 'advanced',
    duration: '12 hours',
    modules: 15,
    enrolled: 2180,
    rating: 4.9,
    reviews: 567,
    price: 0,
    certification: true,
    language: ['English'],
    lastUpdated: new Date('2024-11-15'),
    thumbnail: '/images/courses/tropical-arch.jpg',
    tags: ['Tropical Design', 'Sustainability', 'Climate', 'Passive Cooling'],
    isFeatured: true,
    university: 'Universiti Teknologi Malaysia',
    accreditation: ['PAM', 'GBI']
  },
  {
    id: '3',
    title: 'BIM Fundamentals for Malaysian Projects',
    description: 'From basics to advanced BIM implementation. Includes Revit, AutoCAD integration, and Malaysian standards compliance.',
    instructor: {
      name: 'Ir. Michael Chen',
      avatar: '',
      credentials: 'BIM Specialist, Certified Autodesk Professional',
      verified: true,
      rating: 4.7,
      students: 12500
    },
    category: 'technology',
    level: 'beginner',
    duration: '20 hours',
    modules: 24,
    enrolled: 5670,
    rating: 4.6,
    reviews: 1234,
    price: 499,
    certification: true,
    language: ['English', 'Chinese'],
    lastUpdated: new Date('2024-10-20'),
    thumbnail: '/images/courses/bim-basics.jpg',
    tags: ['BIM', 'Revit', 'AutoCAD', 'Technology', '3D Modeling'],
    progress: 0,
    isEnrolled: false,
    accreditation: ['Autodesk', 'CIDB']
  }
];

// Mock course modules
const mockModules: Module[] = [
  {
    id: '1',
    title: 'Introduction to UBBL 2025',
    description: 'Overview of key changes and implementation timeline',
    duration: '45 min',
    isExpanded: true,
    lessons: [
      {
        id: '1-1',
        title: 'Welcome & Course Overview',
        duration: '5:30',
        type: 'video',
        isCompleted: true,
        isLocked: false
      },
      {
        id: '1-2',
        title: 'History and Evolution of UBBL',
        duration: '12:45',
        type: 'video',
        isCompleted: true,
        isLocked: false
      },
      {
        id: '1-3',
        title: 'Key Changes in 2025 Amendment',
        duration: '18:20',
        type: 'video',
        isCompleted: false,
        isLocked: false,
        resources: 3
      },
      {
        id: '1-4',
        title: 'Module 1 Quiz',
        duration: '10 min',
        type: 'quiz',
        isCompleted: false,
        isLocked: false
      }
    ]
  },
  {
    id: '2',
    title: 'BIM Requirements for Projects >RM50M',
    description: 'Mandatory BIM implementation guidelines and standards',
    duration: '1h 15min',
    isExpanded: false,
    lessons: [
      {
        id: '2-1',
        title: 'BIM Mandate Overview',
        duration: '15:00',
        type: 'video',
        isCompleted: false,
        isLocked: false
      },
      {
        id: '2-2',
        title: 'Level of Development (LOD) Requirements',
        duration: '22:30',
        type: 'video',
        isCompleted: false,
        isLocked: false
      },
      {
        id: '2-3',
        title: 'BIM Execution Plan Template',
        duration: '30 min',
        type: 'reading',
        isCompleted: false,
        isLocked: false,
        resources: 5
      }
    ]
  },
  {
    id: '3',
    title: 'Sustainability & Green Building Standards',
    description: 'New environmental requirements and green certifications',
    duration: '1h 30min',
    isExpanded: false,
    lessons: [
      {
        id: '3-1',
        title: 'Mandatory Sustainability Metrics',
        duration: '25:00',
        type: 'video',
        isCompleted: false,
        isLocked: true
      },
      {
        id: '3-2',
        title: 'Energy Efficiency Requirements',
        duration: '20:00',
        type: 'video',
        isCompleted: false,
        isLocked: true
      }
    ]
  }
];

const categoryIcons = {
  architecture: <Building className="h-4 w-4" />,
  engineering: <Ruler className="h-4 w-4" />,
  construction: <HardHat className="h-4 w-4" />,
  design: <PenTool className="h-4 w-4" />,
  safety: <Shield className="h-4 w-4" />,
  regulation: <FileText className="h-4 w-4" />,
  technology: <Layers className="h-4 w-4" />,
  business: <BarChart className="h-4 w-4" />
};

const levelColors = {
  beginner: 'bg-green-100 text-green-800',
  intermediate: 'bg-yellow-100 text-yellow-800',
  advanced: 'bg-orange-100 text-orange-800',
  expert: 'bg-red-100 text-red-800'
};

export function EducationalPlatform() {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(mockCourses[0]);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedModules, setExpandedModules] = useState<string[]>(['1']);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatCurrency = (amount: number): string => {
    if (amount === 0) return 'FREE';
    return `RM ${amount}`;
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video': return <PlayCircle className="h-4 w-4" />;
      case 'reading': return <FileText className="h-4 w-4" />;
      case 'quiz': return <Brain className="h-4 w-4" />;
      case 'assignment': return <PenTool className="h-4 w-4" />;
      case 'live': return <Users className="h-4 w-4" />;
      default: return <PlayCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Construction Academy</h2>
          <p className="text-gray-600">Learn from industry experts and earn certifications</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <School className="h-4 w-4 mr-2" />
            Become Instructor
          </Button>
          <Button>
            <GraduationCap className="h-4 w-4 mr-2" />
            My Learning
          </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">Total Courses</p>
                <p className="text-2xl font-bold">248</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">Active Learners</p>
                <p className="text-2xl font-bold">15.4K</p>
              </div>
              <Users className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">Certifications</p>
                <p className="text-2xl font-bold">89</p>
              </div>
              <Award className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100">University Partners</p>
                <p className="text-2xl font-bold">12</p>
              </div>
              <School className="h-8 w-8 text-orange-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List - Left */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Button
                  size="sm"
                  variant={selectedCategory === 'all' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('all')}
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={selectedCategory === 'regulation' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('regulation')}
                >
                  Regulation
                </Button>
                <Button
                  size="sm"
                  variant={selectedCategory === 'architecture' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('architecture')}
                >
                  Architecture
                </Button>
                <Button
                  size="sm"
                  variant={selectedCategory === 'technology' ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory('technology')}
                >
                  Technology
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Course List */}
          <div className="space-y-3">
            {mockCourses.map((course) => (
              <Card 
                key={course.id}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${
                  selectedCourse?.id === course.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedCourse(course)}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Thumbnail */}
                    <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={course.thumbnail || '/api/placeholder/400/225'}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                      {course.progress !== undefined && course.progress > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                          <div 
                            className="h-full bg-blue-500"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      )}
                      {course.isFeatured && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge 
                        className={`absolute top-2 right-2 ${levelColors[course.level]}`}
                      >
                        {course.level}
                      </Badge>
                    </div>

                    {/* Course Info */}
                    <div>
                      <h3 className="font-semibold line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{course.instructor.name}</p>
                      
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrolled.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {course.rating}
                        </span>
                      </div>

                      {/* Price and Status */}
                      <div className="flex items-center justify-between mt-3">
                        <span className={`font-bold ${course.price === 0 ? 'text-green-600' : ''}`}>
                          {formatCurrency(course.price)}
                        </span>
                        {course.isEnrolled ? (
                          <Badge className="bg-blue-100 text-blue-700">
                            {course.progress}% Complete
                          </Badge>
                        ) : (
                          <Button size="sm">Enroll</Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Course Detail - Right */}
        {selectedCourse && (
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <Card className="overflow-hidden">
              <div className="relative aspect-video bg-black">
                <video
                  className="w-full h-full"
                  poster={selectedCourse.thumbnail}
                  controls={false}
                >
                  <source src={selectedCourse.preview} type="video/mp4" />
                </video>
                
                {/* Custom Video Controls Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <button
                    className="bg-white/90 rounded-full p-4 hover:bg-white transition-colors"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? (
                      <Pause className="h-8 w-8" />
                    ) : (
                      <Play className="h-8 w-8" />
                    )}
                  </button>
                </div>

                {/* Video Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 text-white">
                  <h2 className="text-xl font-bold">{selectedCourse.title}</h2>
                  <p className="text-sm opacity-90 mt-1">
                    {selectedCourse.modules} modules • {selectedCourse.duration}
                  </p>
                </div>
              </div>
              
              {/* Video Actions */}
              <CardContent className="p-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button variant="outline" size="sm">
                      <ThumbsUp className="h-4 w-4 mr-2" />
                      Like
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Resources
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Bell className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="curriculum">Curriculum</TabsTrigger>
                <TabsTrigger value="instructor">Instructor</TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                {/* About Course */}
                <Card>
                  <CardHeader>
                    <CardTitle>About This Course</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedCourse.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div>
                        <h4 className="font-semibold mb-2">What You'll Learn</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Understanding new UBBL amendments</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>BIM implementation requirements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Sustainability compliance strategies</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                            <span>Accessibility standards updates</span>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold mb-2">Requirements</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Basic understanding of Malaysian building codes</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            <span>Experience in construction or architecture</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Certification */}
                    {selectedCourse.certification && (
                      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Award className="h-6 w-6 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-semibold">Certificate of Completion</h4>
                            <p className="text-sm text-gray-600 mt-1">
                              Earn a certificate upon successful completion of all modules and assessments
                            </p>
                            {selectedCourse.accreditation && (
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-600">Accredited by:</span>
                                <div className="flex gap-1">
                                  {selectedCourse.accreditation.map((acc, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {acc}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Course Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle>Course Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Users className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                        <div className="font-semibold">{selectedCourse.enrolled.toLocaleString()}</div>
                        <div className="text-xs text-gray-600">Students</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                        <div className="font-semibold">{selectedCourse.duration}</div>
                        <div className="text-xs text-gray-600">Total Duration</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <BookOpen className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                        <div className="font-semibold">{selectedCourse.modules}</div>
                        <div className="text-xs text-gray-600">Modules</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                        <div className="font-semibold">{selectedCourse.rating}</div>
                        <div className="text-xs text-gray-600">{selectedCourse.reviews} reviews</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="curriculum" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Course Curriculum</CardTitle>
                    <p className="text-sm text-gray-600">
                      {mockModules.length} modules • {selectedCourse.duration} total
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {mockModules.map((module) => (
                        <div key={module.id} className="border rounded-lg overflow-hidden">
                          <button
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                            onClick={() => toggleModule(module.id)}
                          >
                            <div className="flex items-center gap-3">
                              {expandedModules.includes(module.id) ? (
                                <ChevronDown className="h-5 w-5" />
                              ) : (
                                <ChevronRight className="h-5 w-5" />
                              )}
                              <div className="text-left">
                                <h4 className="font-semibold">Module {module.id}: {module.title}</h4>
                                <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {module.lessons.length} lessons • {module.duration}
                            </div>
                          </button>
                          
                          {expandedModules.includes(module.id) && (
                            <div className="border-t">
                              {module.lessons.map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
                                    lesson.isLocked ? 'opacity-50' : 'cursor-pointer'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {lesson.isCompleted ? (
                                      <CheckCircle className="h-5 w-5 text-green-500" />
                                    ) : lesson.isLocked ? (
                                      <Lock className="h-5 w-5 text-gray-400" />
                                    ) : (
                                      getLessonIcon(lesson.type)
                                    )}
                                    <div>
                                      <div className="font-medium">{lesson.title}</div>
                                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                                        <span>{lesson.duration}</span>
                                        {lesson.resources && (
                                          <span className="flex items-center gap-1">
                                            <FileText className="h-3 w-3" />
                                            {lesson.resources} resources
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {!lesson.isLocked && (
                                    <Button size="sm" variant="ghost">
                                      {lesson.isCompleted ? 'Review' : 'Start'}
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="instructor">
                <Card>
                  <CardHeader>
                    <CardTitle>About the Instructor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <Avatar className="h-20 w-20">
                        <AvatarImage src={selectedCourse.instructor.avatar} />
                        <AvatarFallback>
                          {selectedCourse.instructor.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-semibold">{selectedCourse.instructor.name}</h3>
                          {selectedCourse.instructor.verified && (
                            <Shield className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <p className="text-gray-600">{selectedCourse.instructor.credentials}</p>
                        
                        <div className="flex items-center gap-6 mt-3 text-sm">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            <span>{selectedCourse.instructor.rating} Instructor Rating</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            <span>{selectedCourse.instructor.students.toLocaleString()} Students</span>
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <p className="text-gray-700">
                            With over 30 years of experience in the Malaysian construction industry,
                            Datuk Ar. Ahmad Rahman has been instrumental in shaping building regulations
                            and standards. Former board member of CIDB and active consultant for major
                            infrastructure projects across Southeast Asia.
                          </p>
                        </div>
                        
                        <Button className="mt-4">View Profile</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews">
                <Card>
                  <CardHeader>
                    <CardTitle>Student Reviews</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Reviews Coming Soon</h3>
                      <p>Student reviews and ratings will be displayed here</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}