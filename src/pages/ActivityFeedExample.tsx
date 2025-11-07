import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityFeed } from '@/components/collaboration';
import { Badge } from '@/components/ui/badge';
import { Activity, Calendar, Users, FileText, TrendingUp } from 'lucide-react';

export default function ActivityFeedExample() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Activity Feed Examples</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Comprehensive activity tracking for real-time project updates
        </p>
      </div>

      <Tabs defaultValue="full" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="full">Full Feature</TabsTrigger>
          <TabsTrigger value="compact">Compact View</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard Widget</TabsTrigger>
          <TabsTrigger value="project">Project Detail</TabsTrigger>
        </TabsList>

        {/* Full Feature Example */}
        <TabsContent value="full" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Full-Featured Activity Feed</CardTitle>
              <CardDescription>
                Complete activity feed with all filters, search, and real-time updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFeed
                projectId="project-1"
                showFilters={true}
                showNotificationBadge={true}
                autoRefresh={true}
                maxHeight="600px"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compact View Example */}
        <TabsContent value="compact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compact Activity Feed</CardTitle>
              <CardDescription>
                Simplified view for sidebars and smaller spaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-3">Compact with Filters</h3>
                  <ActivityFeed
                    projectId="project-1"
                    compact={true}
                    showFilters={true}
                    showNotificationBadge={true}
                    maxHeight="400px"
                  />
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-3">Compact without Filters</h3>
                  <ActivityFeed
                    projectId="project-1"
                    compact={true}
                    showFilters={false}
                    showNotificationBadge={false}
                    maxHeight="400px"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Widget Example */}
        <TabsContent value="dashboard" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Stats */}
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Project Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      <span className="text-sm">Active Tasks</span>
                    </div>
                    <Badge>24</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-600" />
                      <span className="text-sm">Team Members</span>
                    </div>
                    <Badge>12</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-600" />
                      <span className="text-sm">Documents</span>
                    </div>
                    <Badge>48</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-600" />
                      <span className="text-sm">Progress</span>
                    </div>
                    <Badge>72%</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Create new task
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Upload document
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Schedule meeting
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    Invite team member
                  </button>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Activity Feed */}
            <div className="lg:col-span-2">
              <ActivityFeed
                projectId="project-1"
                showFilters={false}
                showNotificationBadge={true}
                autoRefresh={true}
                maxHeight="600px"
                className="h-full"
              />
            </div>
          </div>
        </TabsContent>

        {/* Project Detail Example */}
        <TabsContent value="project" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>KLCC Tower Renovation</CardTitle>
                  <CardDescription>
                    Modern office space renovation with sustainable features
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                    <span className="text-gray-500">Project Visualization</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <Badge className="mt-1">In Progress</Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-600 rounded-full" style={{ width: '72%' }} />
                        </div>
                        <span className="text-sm font-medium">72%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Start Date</p>
                      <p className="text-sm font-medium mt-1">Jan 15, 2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">End Date</p>
                      <p className="text-sm font-medium mt-1">Aug 30, 2024</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This comprehensive renovation project involves transforming 15,000 sq ft of office space 
                    in the iconic KLCC Tower. The design emphasizes sustainability, incorporating biophilic 
                    elements, energy-efficient systems, and flexible workspace configurations to meet modern 
                    business needs.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Activity Feed */}
            <div>
              <ActivityFeed
                projectId="project-1"
                compact={true}
                showFilters={false}
                showNotificationBadge={true}
                autoRefresh={true}
                maxHeight="700px"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
          <CardDescription>
            How to use the ActivityFeed component in your application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Basic Usage</h3>
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto">
              <code>{`import { ActivityFeed } from '@/components/collaboration';

// Basic implementation
<ActivityFeed projectId="project-1" />

// With custom configuration
<ActivityFeed
  projectId="project-1"
  compact={false}
  maxHeight="600px"
  showFilters={true}
  showNotificationBadge={true}
  autoRefresh={true}
  refreshInterval={30000}
/>`}</code>
            </pre>
          </div>

          <div>
            <h3 className="font-medium mb-2">Props</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono">projectId</span>
                <span className="text-gray-600 dark:text-gray-400">string</span>
                <span>Filter activities by project</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2">
                <span className="font-mono">compact</span>
                <span className="text-gray-600 dark:text-gray-400">boolean</span>
                <span>Show compact view (default: false)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono">maxHeight</span>
                <span className="text-gray-600 dark:text-gray-400">string</span>
                <span>Maximum height (default: "600px")</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2">
                <span className="font-mono">showFilters</span>
                <span className="text-gray-600 dark:text-gray-400">boolean</span>
                <span>Show filter controls (default: true)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono">showNotificationBadge</span>
                <span className="text-gray-600 dark:text-gray-400">boolean</span>
                <span>Show unread count badge (default: true)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2">
                <span className="font-mono">autoRefresh</span>
                <span className="text-gray-600 dark:text-gray-400">boolean</span>
                <span>Enable auto-refresh (default: true)</span>
              </div>
              <div className="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <span className="font-mono">refreshInterval</span>
                <span className="text-gray-600 dark:text-gray-400">number</span>
                <span>Refresh interval in ms (default: 30000)</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Features</h3>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Real-time updates via WebSocket (mock implementation included)</li>
              <li>• Activity filtering by type, user, and date range</li>
              <li>• Search functionality across all activity fields</li>
              <li>• Grouped activities with collapsible date sections</li>
              <li>• Unread activity tracking and notifications</li>
              <li>• Quick actions (mark as read, undo, view details)</li>
              <li>• Infinite scroll with automatic loading</li>
              <li>• Rich activity cards with metadata display</li>
              <li>• Support for file attachments and previews</li>
              <li>• Responsive design with compact mode</li>
              <li>• Smooth animations with Framer Motion</li>
              <li>• TypeScript support with full type definitions</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}