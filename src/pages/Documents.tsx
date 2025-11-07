import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import DocumentManager from '@/components/documents/DocumentManager';
import { DocumentReviewHub } from '@/components/documents/DocumentReviewHub';
import { DocumentVersionControl } from '@/components/documents/DocumentVersionControl';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Upload, Grid, List, Users, GitBranch, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { documentsService } from '@/services/documents.service';

export default function Documents() {
  const { user } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeTab, setActiveTab] = useState('documents');
  const [showReviewHub, setShowReviewHub] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    inReview: 0,
    approved: 0,
    totalSize: 0,
    weeklyGrowth: 0,
    approvalRate: 0
  });

  const canUpload = user?.role === 'project_lead' || user?.role === 'staff' || user?.role === 'designer';

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const statsData = await documentsService.getStatistics();
      setStats({
        total: statsData.total,
        inReview: statsData.inReview,
        approved: statsData.approved,
        totalSize: statsData.totalSize,
        weeklyGrowth: 12, // Calculate from actual data if available
        approvalRate: statsData.total > 0 ? Math.round((statsData.approved / statsData.total) * 100) : 0
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 GB';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb.toFixed(1) + ' GB';
  };

  // If showing review hub, render it instead
  if (showReviewHub) {
    return <DocumentReviewHub />;
  }

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8 bg-transparent border-0 p-0">
          <TabsTrigger value="documents" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileText className="h-4 w-4 mr-2" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="review" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="h-4 w-4 mr-2" />
            Review Hub
          </TabsTrigger>
          <TabsTrigger value="versions" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <GitBranch className="h-4 w-4 mr-2" />
            Version Control
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        <div className="flex items-center">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="h-8 px-2"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="h-8 px-2"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
        {canUpload && (
          <Button 
            variant="ghost" 
            size="sm"
            className="h-8 px-3"
            onClick={() => setShowReviewHub(true)}
          >
            <Upload className="h-4 w-4 mr-2" />
            <span className="text-sm">Start Review</span>
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="h-full">
        {activeTab === 'documents' && (
          <div className="space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-gray-500 mt-1">+{stats.weeklyGrowth} this week</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">In Review</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">{stats.inReview}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {stats.inReview > 0 && <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />}
                    <span className="text-xs text-gray-500">{stats.inReview > 0 ? `${Math.min(3, stats.inReview)} live sessions` : 'No active sessions'}</span>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <p className="text-xs text-gray-500 mt-1">{stats.approvalRate}% approval rate</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-600">Storage Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</div>
                  <p className="text-xs text-gray-500 mt-1">of 10 GB</p>
                </CardContent>
              </Card>
            </div>

            {/* Category Filters */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory}>
              <TabsList className="bg-gray-100">
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="cat-arch">Architectural</TabsTrigger>
                <TabsTrigger value="cat-struct">Structural</TabsTrigger>
                <TabsTrigger value="cat-mep">MEP</TabsTrigger>
                <TabsTrigger value="cat-site">Site Plans</TabsTrigger>
                <TabsTrigger value="cat-spec">Specifications</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Document Grid */}
            <DocumentManager 
              categoryFilter={activeCategory === 'all' ? undefined : activeCategory}
              viewMode={viewMode}
              key={activeCategory} // Force refresh when category changes
            />
          </div>
        )}

        {activeTab === 'review' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Review Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setShowReviewHub(true)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">KLCC Tower Floor Plan</h3>
                          <p className="text-sm text-gray-500 mt-1">Version 1.1.0 • 3 reviewers online</p>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse mr-2" />
                          Live
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                            >
                              {String.fromCharCode(64 + i)}
                            </div>
                          ))}
                        </div>
                        <Button size="sm" className="ml-auto">Join Review</Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold">Electrical Layout Plan</h3>
                          <p className="text-sm text-gray-500 mt-1">Version 2.0.0 • Scheduled for 3:00 PM</p>
                        </div>
                        <Badge variant="outline">Scheduled</Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-4">
                        <div className="flex -space-x-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium"
                            >
                              {String.fromCharCode(68 + i)}
                            </div>
                          ))}
                        </div>
                        <Button size="sm" variant="outline" className="ml-auto">Schedule</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            <Button 
              className="w-full" 
              size="lg"
              onClick={() => setShowReviewHub(true)}
            >
              <Users className="h-5 w-5 mr-2" />
              Start New Review Session
            </Button>
          </div>
        )}

        {activeTab === 'versions' && (
          <DocumentVersionControl
            documentId={selectedDocumentId || '1'}
            onVersionChange={(version) => console.log('Version changed:', version)}
          />
        )}
      </div>
    </Layout>
  );
}