import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search, BookOpen, Video, FileText, HelpCircle, Lightbulb, Zap,
  Rocket, Users, Settings, DollarSign, FileCheck, Calendar, BarChart,
  MessageSquare, Bell, Shield, Clock, CheckCircle, Star, Play, Download,
  ExternalLink, ChevronRight, Sparkles, GraduationCap, Target, Award
} from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  popularity: number;
  icon: any;
  content: string;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: number;
  videoUrl?: string;
  completed?: boolean;
}

const helpArticles: HelpArticle[] = [
  {
    id: '1',
    title: 'Getting Started with Daritana',
    description: 'Learn the basics of navigating and using Daritana for your architecture projects',
    category: 'Getting Started',
    readTime: '5 min',
    popularity: 95,
    icon: Rocket,
    content: `# Getting Started with Daritana

Welcome to Daritana! This guide will help you get up and running quickly.

## Quick Setup

1. **Complete Your Profile**: Add your professional details and preferences
2. **Create Your First Project**: Click "New Project" and fill in project details
3. **Invite Team Members**: Add your team to collaborate
4. **Set Up Workflows**: Configure your preferred workflows and templates

## Key Features

- **Project Management**: Track all your architecture projects in one place
- **Team Collaboration**: Real-time updates and communication
- **Document Management**: Version control and review workflows
- **Financial Tracking**: Budgets, invoices, and payment tracking

## Next Steps

- Explore the Dashboard to see project overviews
- Set up your first design brief
- Configure notifications and preferences`
  },
  {
    id: '2',
    title: 'Creating and Managing Projects',
    description: 'Complete guide to project creation, setup, and management',
    category: 'Projects',
    readTime: '8 min',
    popularity: 88,
    icon: FileCheck,
    content: `# Creating and Managing Projects

Learn how to effectively create and manage your architecture projects.

## Creating a New Project

1. Click the "New Project" button in the toolbar
2. Fill in project details:
   - Project name and type
   - Client information
   - Location and site details
   - Budget and timeline
3. Assign team members and roles
4. Set project status and priority

## Project Organization

- Use **Tags** to categorize projects
- Set **Milestones** for key deliverables
- Create **Tasks** for project phases
- Upload **Documents** for reference

## Best Practices

- Keep project information up-to-date
- Set realistic timelines and budgets
- Regular team check-ins
- Document all decisions and changes`
  },
  {
    id: '3',
    title: 'Kanban Board and Task Management',
    description: 'Master the Kanban board for efficient task tracking',
    category: 'Tasks',
    readTime: '6 min',
    popularity: 82,
    icon: BarChart,
    content: `# Kanban Board and Task Management

Optimize your workflow with our powerful Kanban board.

## Board Structure

- **To Do**: New tasks and backlog
- **In Progress**: Active work items
- **Review**: Tasks awaiting approval
- **Done**: Completed tasks

## Task Management

### Creating Tasks
1. Click "New Task" button
2. Enter task details and description
3. Assign team members
4. Set priority and due date

### Moving Tasks
- Drag and drop between columns
- Tasks update in real-time
- Team members get notifications

### Task Details
- Add comments and attachments
- Set dependencies
- Track time spent
- View activity history

## Keyboard Shortcuts

- \`Ctrl+N\`: Create new task
- \`Ctrl+K\`: Open Kanban board
- \`/\`: Focus search`
  },
  {
    id: '4',
    title: 'Team Collaboration Features',
    description: 'Learn how to collaborate effectively with your team',
    category: 'Collaboration',
    readTime: '7 min',
    popularity: 79,
    icon: Users,
    content: `# Team Collaboration Features

Daritana provides powerful tools for team collaboration.

## Real-Time Communication

- **Team Chat**: Direct and group messaging
- **Project Comments**: Contextual discussions
- **@Mentions**: Tag team members for attention
- **Notifications**: Stay updated on important changes

## Virtual Office

- See who's online and available
- Join virtual meeting rooms
- Share screens and files
- Quick video calls

## File Collaboration

- **Version Control**: Track document changes
- **Review Workflows**: Approve designs collaboratively
- **Comments & Markup**: Annotate drawings
- **Access Control**: Manage permissions

## Presence & Status

Set your status:
- 🟢 Online: Available for work
- 🟡 Busy: In a meeting or focused work
- 🔴 Away: Temporarily unavailable
- ⚫ Offline: Not working`
  },
  {
    id: '5',
    title: 'Document Management & Version Control',
    description: 'Organize and track your project documents efficiently',
    category: 'Documents',
    readTime: '9 min',
    popularity: 85,
    icon: FileText,
    content: `# Document Management & Version Control

Keep your architectural documents organized and tracked.

## Uploading Documents

1. Navigate to Documents page
2. Click "Upload" button
3. Select files or drag & drop
4. Choose category and add metadata

## Document Categories

- **Architectural**: Floor plans, elevations, sections
- **Structural**: Structural drawings and calculations
- **MEP**: Mechanical, electrical, plumbing
- **Site Plans**: Site layouts and surveys
- **Specifications**: Material specs and standards

## Version Control

- Automatic version tracking
- Compare versions side-by-side
- Revert to previous versions
- Version comments and notes

## Review Workflows

1. Upload document for review
2. Invite reviewers
3. Reviewers add comments and markup
4. Address feedback
5. Approve and finalize

## 3D Model Reviews

- Upload 3D models
- Navigate and inspect models
- Add 3D annotations
- Section cuts and measurements`
  },
  {
    id: '6',
    title: 'Financial Management',
    description: 'Track budgets, invoices, and project finances',
    category: 'Financial',
    readTime: '10 min',
    popularity: 76,
    icon: DollarSign,
    content: `# Financial Management

Manage your project finances effectively with Daritana.

## Budget Tracking

- Set project budgets
- Track expenses by category
- Monitor budget utilization
- Get alerts for overruns

## Invoice Management

### Creating Invoices
1. Go to Financial page
2. Click "New Invoice"
3. Add line items and amounts
4. Set payment terms
5. Send to client

### Payment Tracking
- Track payment status
- Record partial payments
- Send payment reminders
- Generate payment reports

## Expense Management

- Record project expenses
- Attach receipts
- Categorize spending
- Export for accounting

## Financial Reports

- Budget vs Actual reports
- Cash flow analysis
- Profit margin tracking
- Tax-ready exports

## Malaysian Context

- RM currency support
- FPX payment integration
- SST/GST tracking
- Local tax compliance`
  },
  {
    id: '7',
    title: 'Notifications and Alerts',
    description: 'Stay informed with smart notifications',
    category: 'Settings',
    readTime: '4 min',
    popularity: 71,
    icon: Bell,
    content: `# Notifications and Alerts

Configure notifications to stay updated without overwhelm.

## Notification Types

- **Project Updates**: Status changes, milestones
- **Task Assignments**: New tasks and changes
- **Messages**: Team chat and mentions
- **Deadlines**: Upcoming due dates
- **Financial**: Invoice payments, budget alerts
- **Documents**: New uploads, reviews

## Notification Channels

- **In-App**: Notification bell icon
- **Email**: Digest or instant
- **SMS**: Critical alerts only
- **Push**: Mobile app notifications

## Customization

### Per-Project Settings
- Enable/disable by project
- Set priority levels
- Choose channels

### Global Preferences
1. Go to Settings > Notifications
2. Toggle notification types
3. Set quiet hours
4. Configure digest frequency

## Best Practices

- Use quiet hours for focused work
- Enable critical alerts only
- Check notifications daily
- Archive old notifications`
  },
  {
    id: '8',
    title: 'Keyboard Shortcuts',
    description: 'Work faster with keyboard shortcuts',
    category: 'Productivity',
    readTime: '3 min',
    popularity: 68,
    icon: Zap,
    content: `# Keyboard Shortcuts

Speed up your workflow with these keyboard shortcuts.

## Navigation

- \`Ctrl+D\`: Go to Dashboard
- \`Ctrl+P\`: Go to Projects
- \`Ctrl+K\`: Open Kanban Board
- \`Ctrl+T\`: Go to Timeline
- \`Ctrl+M\`: Go to Financial

## Actions

- \`Ctrl+N\`: Create New Item
- \`/\`: Focus Search
- \`?\`: Show All Shortcuts
- \`Esc\`: Close Dialog/Modal

## UI Controls

- \`Ctrl+B\`: Toggle Sidebar
- \`Ctrl+,\`: Open Settings

## Pro Tips

1. Press \`?\` to see all shortcuts anytime
2. Shortcuts work on all pages
3. Customize shortcuts in Settings
4. Print shortcut reference card`
  },
  {
    id: '9',
    title: 'Mobile App Usage',
    description: 'Use Daritana on the go with mobile apps',
    category: 'Mobile',
    readTime: '5 min',
    popularity: 73,
    icon: Target,
    content: `# Mobile App Usage

Access Daritana anywhere with our mobile apps.

## Installation

### iOS
1. Download from App Store
2. Sign in with your account
3. Enable notifications

### Android
1. Download from Google Play
2. Sign in with your account
3. Enable notifications

## Mobile Features

- View projects and tasks
- Upload photos from site
- Quick updates and comments
- Voice notes
- Offline mode
- Location tagging

## Site Visits

- Take site photos
- Add notes and observations
- Create punch list items
- Record measurements
- GPS location tracking

## Offline Work

- View cached projects
- Create tasks offline
- Add notes and photos
- Auto-sync when online

## Tips

- Enable auto-upload for photos
- Use voice-to-text for notes
- Set up biometric login
- Keep app updated`
  },
  {
    id: '10',
    title: 'Security and Privacy',
    description: 'Keep your data secure and private',
    category: 'Security',
    readTime: '6 min',
    popularity: 80,
    icon: Shield,
    content: `# Security and Privacy

Your data security is our top priority.

## Account Security

- **Strong Passwords**: 12+ characters, mixed case, symbols
- **Two-Factor Authentication**: SMS or authenticator app
- **Session Management**: Auto-logout after inactivity
- **Login History**: Monitor account access

## Data Protection

- **Encryption**: AES-256 encryption at rest
- **HTTPS**: All data in transit encrypted
- **Backups**: Daily automated backups
- **Redundancy**: Multi-region storage

## Access Control

### User Roles
- **Admin**: Full system access
- **Project Lead**: Project management
- **Staff**: Team collaboration
- **Client**: View-only access
- **Contractor**: Limited project access

### Permissions
- Granular permission control
- Role-based access
- Project-level permissions
- Document access restrictions

## Compliance

- **PDPA**: Malaysian data protection
- **ISO 27001**: Security standards
- **SOC 2**: Security audits
- **GDPR**: EU data compliance

## Best Practices

1. Use strong, unique passwords
2. Enable 2FA immediately
3. Review access logs regularly
4. Don't share login credentials
5. Report suspicious activity`
  }
];

const tutorials: Tutorial[] = [
  {
    id: 't1',
    title: 'Quick Start: Your First Project',
    description: 'Create your first project in 5 minutes',
    duration: '5 min',
    difficulty: 'beginner',
    steps: 5,
    completed: false
  },
  {
    id: 't2',
    title: 'Mastering the Kanban Board',
    description: 'Learn advanced task management techniques',
    duration: '12 min',
    difficulty: 'intermediate',
    steps: 8,
    completed: false
  },
  {
    id: 't3',
    title: 'Document Review Workflows',
    description: 'Set up collaborative document review processes',
    duration: '15 min',
    difficulty: 'intermediate',
    steps: 10,
    completed: false
  },
  {
    id: 't4',
    title: 'Financial Management Setup',
    description: 'Configure invoicing and budget tracking',
    duration: '10 min',
    difficulty: 'beginner',
    steps: 7,
    completed: false
  },
  {
    id: 't5',
    title: 'Team Collaboration Best Practices',
    description: 'Optimize your team workflows',
    duration: '18 min',
    difficulty: 'advanced',
    steps: 12,
    completed: false
  }
];

export function HelpCenter() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'Getting Started', name: 'Getting Started', icon: Rocket },
    { id: 'Projects', name: 'Projects', icon: FileCheck },
    { id: 'Tasks', name: 'Tasks', icon: BarChart },
    { id: 'Collaboration', name: 'Collaboration', icon: Users },
    { id: 'Documents', name: 'Documents', icon: FileText },
    { id: 'Financial', name: 'Financial', icon: DollarSign },
    { id: 'Settings', name: 'Settings', icon: Settings },
    { id: 'Security', name: 'Security', icon: Shield },
  ];

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const popularArticles = [...helpArticles].sort((a, b) => b.popularity - a.popularity).slice(0, 5);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-blue-100 text-blue-700';
      case 'advanced': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (selectedArticle) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-8 px-6">
          <Button
            variant="ghost"
            onClick={() => setSelectedArticle(null)}
            className="mb-6"
          >
            ← Back to Help Center
          </Button>

          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-lg">
                <selectedArticle.icon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{selectedArticle.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedArticle.readTime} read
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-yellow-500" />
                    {selectedArticle.popularity}% helpful
                  </span>
                  <Badge variant="outline">{selectedArticle.category}</Badge>
                </div>
              </div>
            </div>

            <div className="prose prose-slate max-w-none">
              {selectedArticle.content.split('\n').map((line, i) => {
                if (line.startsWith('# ')) {
                  return <h1 key={i} className="text-2xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
                } else if (line.startsWith('## ')) {
                  return <h2 key={i} className="text-xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
                } else if (line.startsWith('### ')) {
                  return <h3 key={i} className="text-lg font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
                } else if (line.startsWith('- ')) {
                  return <li key={i} className="ml-4">{line.substring(2)}</li>;
                } else if (line.trim().match(/^\d+\./)) {
                  return <li key={i} className="ml-4">{line.substring(line.indexOf('.') + 1).trim()}</li>;
                } else if (line.includes('`') && line.includes(':')) {
                  const parts = line.split('`');
                  return (
                    <p key={i} className="my-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{parts[1]}</code>
                      <span className="ml-2">{parts[2]}</span>
                    </p>
                  );
                } else if (line.trim()) {
                  return <p key={i} className="my-3">{line}</p>;
                }
                return <br key={i} />;
              })}
            </div>

            <div className="mt-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-2">Was this article helpful?</p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline">👍 Yes</Button>
                <Button size="sm" variant="outline">👎 No</Button>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto py-8 px-6">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
              <GraduationCap className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-4">Daritana Help Center</h1>
          <p className="text-xl text-gray-600 mb-8">
            Everything you need to master Daritana for your architecture projects
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search for help articles, tutorials, and guides..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-14 text-lg"
            />
          </div>
        </div>

        <Tabs defaultValue="articles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
            <TabsTrigger value="articles">
              <BookOpen className="h-4 w-4 mr-2" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="tutorials">
              <Video className="h-4 w-4 mr-2" />
              Tutorials
            </TabsTrigger>
            <TabsTrigger value="quickstart">
              <Rocket className="h-4 w-4 mr-2" />
              Quick Start
            </TabsTrigger>
          </TabsList>

          {/* Articles Tab */}
          <TabsContent value="articles" className="space-y-6">
            {/* Categories */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <Button
                    key={cat.id}
                    variant={selectedCategory === cat.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(cat.id)}
                    className="whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {cat.name}
                  </Button>
                );
              })}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Articles List */}
              <div className="md:col-span-2 space-y-4">
                <h2 className="text-2xl font-bold">Help Articles</h2>
                {filteredArticles.map((article) => {
                  const Icon = article.icon;
                  return (
                    <Card
                      key={article.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Icon className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg">{article.title}</CardTitle>
                            <CardDescription className="mt-1">{article.description}</CardDescription>
                            <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                              <span>{article.readTime} read</span>
                              <Badge variant="secondary">{article.category}</Badge>
                              <span className="flex items-center gap-1 ml-auto">
                                <Star className="h-4 w-4 text-yellow-500" />
                                {article.popularity}%
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Popular Articles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {popularArticles.map((article) => (
                      <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article)}
                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <p className="font-medium text-sm">{article.title}</p>
                        <p className="text-xs text-gray-600 mt-1">{article.readTime} read</p>
                      </button>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      Need More Help?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Community Forum
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Video className="h-4 w-4 mr-2" />
                      Schedule Training
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tutorials Tab */}
          <TabsContent value="tutorials" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-2">Interactive Tutorials</h2>
              <p className="text-gray-600 mb-6">
                Step-by-step guided tutorials to help you master Daritana
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {tutorials.map((tutorial) => (
                  <Card key={tutorial.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getDifficultyColor(tutorial.difficulty)}>
                          {tutorial.difficulty}
                        </Badge>
                        {tutorial.completed && (
                          <Badge className="bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <CardTitle>{tutorial.title}</CardTitle>
                      <CardDescription>{tutorial.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {tutorial.duration}
                        </span>
                        <span>{tutorial.steps} steps</span>
                      </div>
                      <Button className="w-full">
                        <Play className="h-4 w-4 mr-2" />
                        Start Tutorial
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Card className="bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <Award className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">Complete All Tutorials</h3>
                    <p className="text-gray-600 mb-4">
                      Finish all tutorials to become a Daritana expert and earn your certification!
                    </p>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 bg-white rounded-full h-3 overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full w-0" />
                      </div>
                      <span className="text-sm font-medium">0/5</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Quick Start Tab */}
          <TabsContent value="quickstart" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                    <Rocket className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">Quick Start Guide</CardTitle>
                    <CardDescription>Get up and running in 10 minutes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    step: 1,
                    title: 'Complete Your Profile',
                    description: 'Add your company details, professional information, and preferences',
                    time: '2 min',
                    icon: Users
                  },
                  {
                    step: 2,
                    title: 'Create Your First Project',
                    description: 'Set up a new project with client details, timeline, and budget',
                    time: '3 min',
                    icon: FileCheck
                  },
                  {
                    step: 3,
                    title: 'Invite Team Members',
                    description: 'Add your team and assign roles for collaboration',
                    time: '2 min',
                    icon: Users
                  },
                  {
                    step: 4,
                    title: 'Upload Documents',
                    description: 'Add your first architectural drawings and specifications',
                    time: '2 min',
                    icon: FileText
                  },
                  {
                    step: 5,
                    title: 'Explore Features',
                    description: 'Take a tour of the dashboard, Kanban board, and other tools',
                    time: '3 min',
                    icon: Sparkles
                  }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.step} className="flex items-start gap-4 p-4 rounded-lg border hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {item.step}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{item.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                        <Badge variant="secondary">{item.time}</Badge>
                      </div>
                      <Icon className="h-6 w-6 text-gray-400" />
                    </div>
                  );
                })}

                <div className="flex gap-4 mt-6">
                  <Button size="lg" className="flex-1">
                    <Play className="h-5 w-5 mr-2" />
                    Start Quick Setup
                  </Button>
                  <Button size="lg" variant="outline">
                    <Download className="h-5 w-5 mr-2" />
                    Download PDF Guide
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Video Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5 text-red-500" />
                  Video Tutorials
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { title: 'Platform Overview', duration: '5:30' },
                    { title: 'Creating Projects', duration: '8:45' },
                    { title: 'Team Collaboration', duration: '12:20' }
                  ].map((video, i) => (
                    <div key={i} className="group cursor-pointer">
                      <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg mb-2 flex items-center justify-center group-hover:from-gray-300 group-hover:to-gray-400 transition-all">
                        <Play className="h-12 w-12 text-gray-600 group-hover:text-gray-800 group-hover:scale-110 transition-all" />
                      </div>
                      <h4 className="font-medium text-sm">{video.title}</h4>
                      <p className="text-xs text-gray-600">{video.duration}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
