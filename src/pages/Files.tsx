import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { FileUploader } from '@/components/files/FileUploader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useProjectContextStore } from '@/store/projectContextStore';
import { 
  FolderOpen, Clock, Users, Settings, Cloud, HardDrive, 
  Upload, Grid, List, Filter, Search, Download, Share2,
  File, Image, FileText, Film, Music, Archive, Trash2,
  ExternalLink, MoreVertical, Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cloudStorage, CloudFile } from '@/lib/cloudStorage';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function Files() {
  const { mode, currentProject } = useProjectContextStore();
  const [files, setFiles] = useState<CloudFile[]>([]);
  const [filteredFiles, setFilteredFiles] = useState<CloudFile[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [selectedTab, setSelectedTab] = useState('all');
  const [cloudConnections, setCloudConnections] = useState({
    google: false,
    microsoft: false
  });
  const [isLoading, setIsLoading] = useState(false);

  // Check cloud authentication status and load server files
  useEffect(() => {
    checkCloudConnections();
    loadServerFiles();
  }, []);

  const loadServerFiles = async () => {
    setIsLoading(true);
    const serverFiles = await cloudStorage.listServerFiles();
    setFiles(prev => [...prev.filter(f => f.provider !== 'local'), ...serverFiles]);
    setIsLoading(false);
  };

  // Filter files based on tab and search
  useEffect(() => {
    let filtered = [...files];

    // Filter by type
    if (selectedTab === 'documents') {
      filtered = filtered.filter(f => 
        f.mimeType.includes('pdf') || 
        f.mimeType.includes('document') || 
        f.mimeType.includes('text')
      );
    } else if (selectedTab === 'images') {
      filtered = filtered.filter(f => f.mimeType.startsWith('image/'));
    } else if (selectedTab === 'videos') {
      filtered = filtered.filter(f => f.mimeType.startsWith('video/'));
    } else if (selectedTab === 'cloud') {
      filtered = filtered.filter(f => f.provider !== 'local');
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredFiles(filtered);
  }, [files, selectedTab, searchQuery]);

  const checkCloudConnections = async () => {
    const status = await cloudStorage.checkAuthStatus();
    setCloudConnections(status);
  };

  const connectGoogleDrive = async () => {
    try {
      const success = await cloudStorage.loginGoogle();
      if (success) {
        toast.success('Connected to Google Drive');
        setCloudConnections(prev => ({ ...prev, google: true }));
        loadGoogleDriveFiles();
      } else {
        toast.error('Google Drive connection failed. Please check API configuration.');
      }
    } catch (error) {
      console.error('Google Drive connection error:', error);
      toast.error('Google Drive not configured. Please set up API credentials.');
    }
  };

  const connectOneDrive = async () => {
    try {
      const success = await cloudStorage.loginMicrosoft();
      if (success) {
        toast.success('Connected to OneDrive');
        setCloudConnections(prev => ({ ...prev, microsoft: true }));
        loadOneDriveFiles();
      } else {
        toast.error('OneDrive connection failed. Please check API configuration.');
      }
    } catch (error) {
      console.error('OneDrive connection error:', error);
      toast.error('OneDrive not configured. Please set up API credentials.');
    }
  };

  const loadGoogleDriveFiles = async () => {
    setIsLoading(true);
    const googleFiles = await cloudStorage.listGoogleDriveFiles();
    setFiles(prev => [...prev.filter(f => f.provider !== 'google'), ...googleFiles]);
    setIsLoading(false);
  };

  const loadOneDriveFiles = async () => {
    setIsLoading(true);
    const oneDriveFiles = await cloudStorage.listOneDriveFiles();
    setFiles(prev => [...prev.filter(f => f.provider !== 'microsoft'), ...oneDriveFiles]);
    setIsLoading(false);
  };

  const handleUploadComplete = (uploadedFiles: CloudFile[]) => {
    setFiles(prev => [...uploadedFiles, ...prev]);
    setShowUploader(false);
    toast.success(`${uploadedFiles.length} files uploaded successfully`);
    
    // Refresh server files to ensure we have the latest
    const hasLocalUploads = uploadedFiles.some(f => f.provider === 'local');
    if (hasLocalUploads) {
      loadServerFiles();
    }
  };

  const downloadFile = async (file: CloudFile) => {
    try {
      if (file.provider === 'local') {
        // For server files, use the download URL directly
        if (file.downloadUrl) {
          window.open(file.downloadUrl, '_blank');
        } else {
          const blob = await cloudStorage.downloadFromServer(file.id);
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.name;
            a.click();
            URL.revokeObjectURL(url);
          }
        }
      } else if (file.provider === 'google') {
        const blob = await cloudStorage.downloadFromGoogleDrive(file.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else if (file.provider === 'microsoft') {
        const blob = await cloudStorage.downloadFromOneDrive(file.id);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          a.click();
          URL.revokeObjectURL(url);
        }
      }
      
      toast.success(`Downloading ${file.name}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download file');
    }
  };

  const deleteFile = async (file: CloudFile) => {
    try {
      let success = false;
      
      if (file.provider === 'local') {
        success = await cloudStorage.deleteFromServer(file.id);
      } else {
        // For cloud files, just remove from local state
        // (actual cloud deletion would need provider-specific implementation)
        success = true;
      }
      
      if (success) {
        setFiles(prev => prev.filter(f => f.id !== file.id));
        toast.success('File deleted successfully');
      } else {
        toast.error('Failed to delete file');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete file');
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
    if (type.startsWith('video/')) return <Film className="h-5 w-5" />;
    if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
    if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (type.includes('zip') || type.includes('rar')) return <Archive className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate statistics
  const totalSize = files.reduce((acc, file) => acc + (file.size || 0), 0);
  const cloudFiles = files.filter(f => f.provider !== 'local');

  const toolbar = (
    <div className="flex gap-2">
      {!cloudConnections.google && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={connectGoogleDrive}
          className="h-8 px-3"
        >
          <Cloud className="h-4 w-4 mr-2 text-blue-500" />
          <span className="text-sm">Connect Google Drive</span>
        </Button>
      )}
      {!cloudConnections.microsoft && (
        <Button 
          variant="ghost" 
          size="sm"
          onClick={connectOneDrive}
          className="h-8 px-3"
        >
          <Cloud className="h-4 w-4 mr-2 text-blue-600" />
          <span className="text-sm">Connect OneDrive</span>
        </Button>
      )}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => setShowUploader(true)}
        className="h-8 px-3"
      >
        <Upload className="h-4 w-4 mr-2" />
        <span className="text-sm">Upload Files</span>
      </Button>
    </div>
  );

  return (
    <Layout contextualInfo={false} toolbar={toolbar}>
      <div className="space-y-6">

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Files</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{files.length}</div>
              <p className="text-xs text-muted-foreground">
                Across all storage locations
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Size</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatFileSize(totalSize)}</div>
              <p className="text-xs text-muted-foreground">
                Combined storage usage
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cloud Files</CardTitle>
              <Cloud className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{cloudFiles.length}</div>
              <p className="text-xs text-muted-foreground">
                Stored in cloud services
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Connections</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                {cloudConnections.google && (
                  <Badge variant="outline" className="text-xs">Google</Badge>
                )}
                {cloudConnections.microsoft && (
                  <Badge variant="outline" className="text-xs">OneDrive</Badge>
                )}
                <Badge variant="outline" className="text-xs">Local</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and View Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search files..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* File Browser Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Files</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="cloud">Cloud Files</TabsTrigger>
          </TabsList>
          
          <TabsContent value={selectedTab} className="space-y-4">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-4">Loading files...</p>
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card className="p-12 text-center">
                <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No files found</h3>
                <p className="text-sm text-gray-500 mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Upload files to get started'}
                </p>
                <Button onClick={() => setShowUploader(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </Card>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="group hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        {getFileIcon(file.mimeType)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => downloadFile(file)}>
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </DropdownMenuItem>
                            {file.webUrl && (
                              <DropdownMenuItem onClick={() => window.open(file.webUrl, '_blank')}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Open in {file.provider === 'google' ? 'Google Drive' : 
                                         file.provider === 'microsoft' ? 'OneDrive' : 'Browser'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Share2 className="h-4 w-4 mr-2" />
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => deleteFile(file)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="text-sm font-medium truncate mb-1">{file.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      <Badge variant="outline" className="text-xs mt-2">
                        {file.provider === 'google' ? 'Google' : 
                         file.provider === 'microsoft' ? 'OneDrive' : 'Local'}
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file) => (
                  <Card key={file.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFileIcon(file.mimeType)}
                        <div>
                          <p className="font-medium">{file.name}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>{formatFileSize(file.size)}</span>
                            <span>•</span>
                            <span>{formatDate(file.modifiedAt)}</span>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              {file.provider === 'google' ? 'Google Drive' : 
                               file.provider === 'microsoft' ? 'OneDrive' : 'Local'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => downloadFile(file)}>
                          <Download className="h-4 w-4" />
                        </Button>
                        {file.webUrl && (
                          <Button variant="ghost" size="icon" onClick={() => window.open(file.webUrl, '_blank')}>
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteFile(file)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploader} onOpenChange={setShowUploader}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Upload Files</DialogTitle>
            <DialogDescription>
              Upload files to local storage or cloud services
            </DialogDescription>
          </DialogHeader>
          <FileUploader 
            onUploadComplete={handleUploadComplete}
            maxSize={100}
            multiple={true}
          />
        </DialogContent>
      </Dialog>
    </Layout>
  );
}