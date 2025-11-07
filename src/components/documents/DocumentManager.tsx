import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Download,
  Share2,
  Edit,
  Trash2,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  FileImage,
  File,
  MoreVertical,
  Plus,
  Building,
  Layers,
  Zap,
  MapPin
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { documentsService, type Document as ServiceDocument } from '@/services/documents.service';
import type { DocumentCategory } from '@/types/document';
import { formatFileSize } from '@/types/document';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentViewer from './DocumentViewer';
import DocumentVersionHistory from './DocumentVersionHistory';
import DocumentShareModal from './DocumentShareModal';
import { useAuthStore } from '@/store/authStore';
import { useProjectStore } from '@/store/projectStore';

interface DocumentManagerProps {
  projectId?: string;
  categoryFilter?: string;
  viewMode?: 'grid' | 'list';
}

// Map service document to internal format
const mapServiceDocument = (doc: ServiceDocument): any => ({
  id: doc.id,
  title: doc.name,
  document_number: doc.id.substring(0, 8).toUpperCase(),
  description: '',
  category_id: doc.category || 'all',
  project_id: doc.projectId || '',
  status: doc.status.toLowerCase().replace('_', '-'),
  approval_status: doc.status === 'APPROVED' ? 'approved' : doc.status === 'IN_REVIEW' ? 'pending' : 'none',
  file_format: doc.type || doc.mimeType?.split('/')[1] || 'pdf',
  file_size: doc.size,
  revision: '1.0',
  version_number: doc._count?.versions || 1,
  tags: [],
  uploaded_by: doc.uploadedBy ? `${doc.uploadedBy.firstName} ${doc.uploadedBy.lastName}` : 'Unknown',
  created_at: new Date(doc.createdAt),
  updated_at: new Date(doc.updatedAt),
  file_url: doc.url,
  _raw: doc // Keep original for other operations
});

export const DocumentManager: React.FC<DocumentManagerProps> = ({ 
  projectId, 
  categoryFilter,
  viewMode: initialViewMode = 'grid'
}) => {
  const { user } = useAuthStore();
  const { projects } = useProjectStore();
  
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(initialViewMode);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryFilter || 'all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  
  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    totalSize: 0
  });

  const canEdit = user?.role === 'project_lead' || user?.role === 'staff' || user?.role === 'designer';

  useEffect(() => {
    loadDocuments();
    loadCategories();
    loadStatistics();
  }, [projectId, categoryFilter]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const filters = {
        projectId,
        category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined
      };
      
      const docs = await documentsService.getDocuments(filters);
      const mappedDocs = docs.map(mapServiceDocument);
      setDocuments(mappedDocs);
    } catch (error) {
      console.error('Failed to load documents:', error);
      // Fallback to empty array on error
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await documentsService.getCategories();
      setCategories(cats.map(cat => ({
        id: cat.id,
        code: cat.code,
        name_en: cat.name,
        name_ms: cat.name,
        description: '',
        parent_id: null,
        display_order: 0,
        icon: cat.code,
        color: '#3B82F6'
      })));
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const loadStatistics = async () => {
    try {
      const statsData = await documentsService.getStatistics(projectId);
      setStats({
        total: statsData.total,
        pending: statsData.inReview,
        approved: statsData.approved,
        totalSize: statsData.totalSize
      });
    } catch (error) {
      console.error('Failed to load statistics:', error);
    }
  };

  // Filter documents based on search and filters
  const getFilteredDocuments = () => {
    let filtered = [...documents];

    // Tab filter
    if (activeTab === 'pending') {
      filtered = filtered.filter(doc => doc.approval_status === 'pending');
    } else if (activeTab === 'approved') {
      filtered = filtered.filter(doc => doc.approval_status === 'approved');
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(doc => doc.category_id === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(doc => doc.status === selectedStatus);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.title.toLowerCase().includes(query) ||
        doc.document_number?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  };

  const handleDocumentAction = async (action: 'view' | 'edit' | 'share' | 'versions' | 'delete' | 'download', document: any) => {
    setSelectedDocument(document);
    
    switch (action) {
      case 'view':
        setShowViewer(true);
        break;
      case 'share':
        setShowShareModal(true);
        break;
      case 'versions':
        setShowVersionHistory(true);
        break;
      case 'delete':
        if (confirm('Are you sure you want to delete this document?')) {
          try {
            await documentsService.deleteDocument(document._raw?.id || document.id);
            await loadDocuments();
            await loadStatistics();
          } catch (error) {
            console.error('Failed to delete document:', error);
          }
        }
        break;
      case 'download':
        try {
          await documentsService.downloadDocument(document._raw?.id || document.id);
        } catch (error) {
          console.error('Failed to download document:', error);
        }
        break;
    }
  };

  const getCategoryIcon = (code: string) => {
    const icons: Record<string, React.ReactNode> = {
      'ARCH': <Building className="h-4 w-4" />,
      'STRUCT': <Layers className="h-4 w-4" />,
      'MEP': <Zap className="h-4 w-4" />,
      'SITE': <MapPin className="h-4 w-4" />
    };
    return icons[code] || <FileText className="h-4 w-4" />;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'draft': 'bg-gray-100 text-gray-800',
      'for_review': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'superseded': 'bg-red-100 text-red-800',
      'archived': 'bg-gray-100 text-gray-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const filteredDocuments = getFilteredDocuments();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Management</h2>
          <p className="text-gray-600">Manage project documents and drawings</p>
        </div>
        {canEdit && (
          <Button onClick={() => setShowUploadModal(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Approval</p>
                <p className="text-2xl font-bold">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Size</p>
                <p className="text-2xl font-bold">{formatFileSize(stats.totalSize)}</p>
              </div>
              <FolderOpen className="h-8 w-8 text-purple-500 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all">All Documents</TabsTrigger>
                <TabsTrigger value="pending">
                  Pending Approval
                  {stats.pending > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {stats.pending}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(category.code)}
                      {category.name_en}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="for_review">For Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="superseded">Superseded</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Documents Grid/List */}
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Upload your first document to get started'}
              </p>
              {canEdit && (
                <Button onClick={() => setShowUploadModal(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <AnimatePresence>
                {filteredDocuments.map((document) => (
                  <motion.div
                    key={document.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group"
                  >
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            {document.file_format === 'jpg' || document.file_format === 'png' ? (
                              <FileImage className="h-6 w-6 text-blue-600" />
                            ) : (
                              <FileText className="h-6 w-6 text-blue-600" />
                            )}
                          </div>
                          <div className="relative group">
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                              <div className="py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDocumentAction('download', document);
                                  }}
                                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </button>
                                {canEdit && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDocumentAction('delete', document);
                                    }}
                                    className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">
                          {document.title}
                        </h3>
                        
                        {document.document_number && (
                          <p className="text-sm text-gray-600 mb-2">{document.document_number}</p>
                        )}
                        
                        <div className="flex items-center justify-between mb-3">
                          <Badge className={getStatusColor(document.status)}>
                            {document.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {document.revision || 'v' + document.version_number}
                          </span>
                        </div>
                        
                        <div className="text-xs text-gray-500 space-y-1">
                          <div className="flex items-center justify-between">
                            <span>{formatFileSize(document.file_size)}</span>
                            <span>{document.file_format.toUpperCase()}</span>
                          </div>
                          <div>
                            Updated {formatDistanceToNow(document.updated_at, { addSuffix: true })}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentAction('view', document)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentAction('share', document)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDocumentAction('versions', document)}
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{document.title}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {document.document_number && <span>{document.document_number}</span>}
                        <span>{formatFileSize(document.file_size)}</span>
                        <span>{document.file_format.toUpperCase()}</span>
                        <span>Updated {formatDistanceToNow(document.updated_at, { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(document.status)}>
                      {document.status.replace('_', ' ')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentAction('view', document)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentAction('share', document)}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentAction('download', document)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      {showUploadModal && (
        <DocumentUploadModal
          projectId={projectId}
          onClose={() => setShowUploadModal(false)}
          onUploadComplete={() => {
            setShowUploadModal(false);
            loadDocuments();
          }}
        />
      )}

      {showViewer && selectedDocument && (
        <DocumentViewer
          document={selectedDocument}
          onClose={() => setShowViewer(false)}
        />
      )}

      {showVersionHistory && selectedDocument && (
        <DocumentVersionHistory
          document={selectedDocument}
          onClose={() => setShowVersionHistory(false)}
        />
      )}

      {showShareModal && selectedDocument && (
        <DocumentShareModal
          document={selectedDocument}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
};

export default DocumentManager;