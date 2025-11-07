import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, FolderOpen, CheckSquare, Users, FileText, 
  ArrowRight, Calendar, MapPin, User, Clock
} from 'lucide-react';
import { SearchResult } from '@/services/search.service';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

export default function SearchResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const { query, results } = location.state as { query: string; results: SearchResult };
  const [activeTab, setActiveTab] = useState('all');

  // Redirect if no search results
  useEffect(() => {
    if (!results) {
      navigate('/projects');
    }
  }, [results, navigate]);

  if (!results) return null;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-6 h-6 text-gray-400" />
            <h1 className="text-2xl font-bold text-gray-900">
              Search Results for "{query}"
            </h1>
          </div>
          <p className="text-gray-600">
            Found {results.total} result{results.total !== 1 ? 's' : ''} across projects, tasks, users, and documents
          </p>
        </div>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">
              All ({results.total})
            </TabsTrigger>
            {results.projects.length > 0 && (
              <TabsTrigger value="projects">
                Projects ({results.projects.length})
              </TabsTrigger>
            )}
            {results.tasks.length > 0 && (
              <TabsTrigger value="tasks">
                Tasks ({results.tasks.length})
              </TabsTrigger>
            )}
            {results.users.length > 0 && (
              <TabsTrigger value="users">
                Users ({results.users.length})
              </TabsTrigger>
            )}
            {results.documents.length > 0 && (
              <TabsTrigger value="documents">
                Documents ({results.documents.length})
              </TabsTrigger>
            )}
          </TabsList>

          {/* All Results */}
          <TabsContent value="all">
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="space-y-6"
            >
              {/* Projects Section */}
              {results.projects.length > 0 && (
                <motion.div variants={item}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FolderOpen className="w-5 h-5" />
                    Projects
                  </h2>
                  <div className="grid gap-4">
                    {results.projects.slice(0, 3).map((project) => (
                      <ProjectCard key={project.id} project={project} />
                    ))}
                  </div>
                  {results.projects.length > 3 && (
                    <Button
                      variant="link"
                      onClick={() => setActiveTab('projects')}
                      className="mt-2"
                    >
                      View all {results.projects.length} projects
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Tasks Section */}
              {results.tasks.length > 0 && (
                <motion.div variants={item}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <CheckSquare className="w-5 h-5" />
                    Tasks
                  </h2>
                  <div className="grid gap-4">
                    {results.tasks.slice(0, 3).map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                  {results.tasks.length > 3 && (
                    <Button
                      variant="link"
                      onClick={() => setActiveTab('tasks')}
                      className="mt-2"
                    >
                      View all {results.tasks.length} tasks
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </motion.div>
              )}

              {/* Users Section */}
              {results.users.length > 0 && (
                <motion.div variants={item}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Team Members
                  </h2>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {results.users.slice(0, 6).map((user) => (
                      <UserCard key={user.id} user={user} />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Documents Section */}
              {results.documents.length > 0 && (
                <motion.div variants={item}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents
                  </h2>
                  <div className="grid gap-4">
                    {results.documents.slice(0, 3).map((document) => (
                      <DocumentCard key={document.id} document={document} />
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects">
            <div className="grid gap-4">
              {results.projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          </TabsContent>

          {/* Tasks Tab */}
          <TabsContent value="tasks">
            <div className="grid gap-4">
              {results.tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.users.map((user) => (
                <UserCard key={user.id} user={user} />
              ))}
            </div>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents">
            <div className="grid gap-4">
              {results.documents.map((document) => (
                <DocumentCard key={document.id} document={document} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

// Component Cards
function ProjectCard({ project }: { project: any }) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/projects/${project.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {project.name}
            </h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {project.description}
            </p>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {project.location}
                </span>
              )}
              {project.client && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {project.client.name}
                </span>
              )}
            </div>
          </div>
          <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>
            {project.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function TaskCard({ task }: { task: any }) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/tasks?id=${task.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {task.title}
            </h3>
            {task.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {task.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {task.project.name}
              </span>
              {task.assignedTo && (
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {task.assignedTo.email}
                </span>
              )}
            </div>
          </div>
          <Badge 
            variant={
              task.status === 'completed' ? 'default' : 
              task.status === 'in_progress' ? 'secondary' : 
              'outline'
            }
          >
            {task.status}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function UserCard({ user }: { user: any }) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/team?user=${user.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <img
            src={`https://ui-avatars.com/api/?name=${user.email}&background=667eea&color=fff`}
            alt={user.email}
            className="w-12 h-12 rounded-full"
          />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">
              {user.profile?.firstName} {user.profile?.lastName}
            </h3>
            <p className="text-sm text-gray-600">{user.email}</p>
            {user.organizationMembers?.[0] && (
              <Badge variant="outline" className="mt-1">
                {user.organizationMembers[0].role}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentCard({ document }: { document: any }) {
  const navigate = useNavigate();
  
  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={() => navigate(`/documents?id=${document.id}`)}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {document.name}
            </h3>
            {document.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {document.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <FolderOpen className="w-4 h-4" />
                {document.project.name}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {format(new Date(document.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
          </div>
          <FileText className="w-5 h-5 text-gray-400" />
        </div>
      </CardContent>
    </Card>
  );
}