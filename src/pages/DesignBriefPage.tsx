import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { DesignBriefForm } from '@/components/design/DesignBriefForm';
import { EnhancedDesignBriefForm } from '@/components/design/EnhancedDesignBriefForm';
import { ClientBriefPortal } from '@/components/design/ClientBriefPortal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CollaborativeEditor } from '@/components/collaboration';
import { useAuthStore } from '@/store/authStore';
import { designBriefApi } from '@/lib/api';
import { toast } from 'sonner';
import { FileText, Eye, Edit, Download, Share, Sparkles, Zap, Users, Loader2 } from 'lucide-react';

export function DesignBriefPage() {
  const { user } = useAuthStore();
  const [briefMode, setBriefMode] = useState<'standard' | 'enhanced'>('enhanced');
  const [existingBriefs, setExistingBriefs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  if (!user) return null;
  
  const isClient = user.role === 'client';

  // Load existing design briefs from API
  useEffect(() => {
    const loadDesignBriefs = async () => {
      setIsLoading(true);
      try {
        const response = await designBriefApi.getAll({ 
          client_id: user.id,
          limit: 50 
        });
        if (response.data?.briefs) {
          const formattedBriefs = response.data.briefs.map((brief: any) => ({
            id: brief.id,
            projectName: brief.brief_name || brief.title || 'Untitled Brief',
            status: brief.status || 'draft',
            lastUpdated: brief.updated_at ? new Date(brief.updated_at) : new Date(),
            version: brief.version || '1.0'
          }));
          setExistingBriefs(formattedBriefs);
        }
      } catch (error) {
        console.error('Failed to load design briefs:', error);
        toast.error('Failed to load design briefs');
        // Fallback to empty array
        setExistingBriefs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDesignBriefs();
  }, [user.id]);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'revision_needed':
        return 'bg-orange-100 text-orange-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light architect-heading">
              Design Brief
            </h1>
            <p className="text-gray-600 architect-text mt-2">
              {isClient 
                ? 'Create and manage your design requirements and preferences'
                : 'Review client design briefs and convert them into actionable design plans'}
            </p>
          </div>
          
          {!isClient && (
            <div className="flex space-x-3">
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export All
              </Button>
            </div>
          )}
        </div>
        
        {/* Existing Design Briefs */}
        {isLoading ? (
          <Card className="architect-border">
            <CardContent className="py-12">
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading design briefs...</span>
              </div>
            </CardContent>
          </Card>
        ) : existingBriefs.length > 0 ? (
          <Card className="architect-border">
            <CardHeader>
              <CardTitle className="architect-heading">
                {isClient ? 'Your Design Briefs' : 'Client Design Briefs'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {existingBriefs.map((brief) => (
                  <div key={brief.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                      <div>
                        <h3 className="font-medium">{brief.projectName}</h3>
                        <p className="text-sm text-gray-500">
                          Version {brief.version} • Updated {brief.lastUpdated.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(brief.status)}>
                        {brief.status.replace('_', ' ')}
                      </Badge>
                      
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(isClient || user.role === 'designer') && (
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="outline" size="sm">
                          <Share className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="architect-border">
            <CardContent className="py-12">
              <div className="text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No design briefs found</h3>
                <p className="text-gray-600 mb-4">
                  {isClient 
                    ? 'Create your first design brief to get started with your project'
                    : 'No client design briefs are currently available'
                  }
                </p>
                {isClient && (
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    Create New Brief
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Design Brief Form with Mode Selection */}
        <div>
          <h2 className="text-xl font-light architect-heading mb-4">
            {isClient ? 'Create New Design Brief' : 'Review & Convert to Design Plan'}
          </h2>
          
          <Tabs defaultValue="form" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="form">
                <Sparkles className="h-4 w-4 mr-2" />
                Cultural Intelligence Form
              </TabsTrigger>
              <TabsTrigger value="quick">
                <Zap className="h-4 w-4 mr-2" />
                Quick Brief
              </TabsTrigger>
              <TabsTrigger value="collaborative">
                <Users className="h-4 w-4 mr-2" />
                Collaborative Editor
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="form" className="mt-6">
              <EnhancedDesignBriefForm />
            </TabsContent>
            
            <TabsContent value="quick" className="mt-6">
              <DesignBriefForm />
            </TabsContent>
            
            <TabsContent value="collaborative" className="mt-6">
              <CollaborativeEditor
                initialContent={`# ${user?.role === 'client' ? 'My' : 'Client'} Design Brief

## Project Overview
Brief description of the project...

## Design Requirements
- Functional requirements
- Aesthetic preferences
- Space utilization needs

## Cultural Considerations
- Local architectural guidelines
- Cultural significance
- Community integration

## Timeline & Budget
- Project timeline expectations
- Budget constraints
- Priority features

## Additional Notes
Any special requirements or considerations...`}
                placeholder="Start writing your design brief. Multiple team members can edit this simultaneously..."
                onSave={async (content) => {
                  console.log('Saving collaborative design brief:', content);
                  // Here you would save to your backend
                  await new Promise(resolve => setTimeout(resolve, 1000));
                }}
                collaborators={[
                  { id: '1', name: 'Sarah Ahmad', avatar: '', isOnline: true },
                  { id: '2', name: 'David Chen', avatar: '', isOnline: true },
                  { id: '3', name: 'Maya Patel', avatar: '', isOnline: false },
                ]}
                documentId="design-brief-collaborative"
                className="max-w-none"
              />
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Information Panel for Clients */}
        {isClient && (
          <Card className="architect-border bg-gray-50">
            <CardHeader>
              <CardTitle className="architect-heading">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    1
                  </div>
                  <h3 className="font-medium mb-2">Submit Your Brief</h3>
                  <p className="text-sm text-gray-600">
                    Share your vision, requirements, and preferences with our design team
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    2
                  </div>
                  <h3 className="font-medium mb-2">Designer Review</h3>
                  <p className="text-sm text-gray-600">
                    Our designers will review and convert your brief into a detailed design plan
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-3">
                    3
                  </div>
                  <h3 className="font-medium mb-2">Timeline Update</h3>
                  <p className="text-sm text-gray-600">
                    Your project timeline will be automatically updated with design tasks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}