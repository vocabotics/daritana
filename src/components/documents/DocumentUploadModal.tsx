import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Upload, File, FileText, FileImage, CheckCircle2, AlertCircle } from 'lucide-react';
import { documentsService } from '@/services/documents.service';
import { toast } from 'sonner';

interface DocumentUploadModalProps {
  projectId?: string;
  onClose: () => void;
  onUploadComplete: () => void;
}

interface UploadFile {
  id: string;
  file: File;
  name: string;
  category?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({ 
  projectId, 
  onClose, 
  onUploadComplete 
}) => {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; code: string; }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load categories on mount
  React.useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const cats = await documentsService.getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const newFiles: UploadFile[] = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      category: categories[0]?.id,
      status: 'pending',
      progress: 0
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    const newFiles: UploadFile[] = droppedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      name: file.name.replace(/\.[^/.]+$/, ''),
      category: categories[0]?.id,
      status: 'pending',
      progress: 0
    }));
    setFiles([...files, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const updateFile = (id: string, updates: Partial<UploadFile>) => {
    setFiles(files.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const uploadFiles = async () => {
    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setUploading(true);
    let successCount = 0;
    let errorCount = 0;

    for (const uploadFile of files) {
      if (uploadFile.status === 'success') continue;

      try {
        updateFile(uploadFile.id, { status: 'uploading', progress: 50 });

        await documentsService.uploadDocument({
          name: uploadFile.name,
          category: uploadFile.category,
          projectId,
          file: uploadFile.file
        });

        updateFile(uploadFile.id, { status: 'success', progress: 100 });
        successCount++;
      } catch (error: any) {
        updateFile(uploadFile.id, { 
          status: 'error', 
          progress: 0,
          error: error.message || 'Upload failed'
        });
        errorCount++;
        console.error('Failed to upload file:', error);
      }
    }

    setUploading(false);

    if (successCount > 0) {
      toast.success(`Successfully uploaded ${successCount} file(s)`);
      if (errorCount === 0) {
        setTimeout(() => {
          onUploadComplete();
        }, 500);
      }
    }

    if (errorCount > 0) {
      toast.error(`Failed to upload ${errorCount} file(s)`);
    }
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) {
      return <FileImage className="h-5 w-5 text-blue-500" />;
    } else if (type === 'application/pdf') {
      return <FileText className="h-5 w-5 text-red-500" />;
    } else {
      return <File className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-white border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Upload Documents</h2>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={uploading}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {/* Drop Zone */}
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
            <p className="text-sm text-gray-500">Supported formats: PDF, Word, Excel, Images</p>
            <p className="text-sm text-gray-500">Maximum file size: 100MB</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-6 space-y-3">
              <h3 className="text-sm font-semibold text-gray-700">Files to upload ({files.length})</h3>
              {files.map((uploadFile) => (
                <div key={uploadFile.id} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {getFileIcon(uploadFile.file)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Input
                          value={uploadFile.name}
                          onChange={(e) => updateFile(uploadFile.id, { name: e.target.value })}
                          placeholder="Document name"
                          disabled={uploadFile.status === 'uploading'}
                          className="flex-1"
                        />
                        <Select
                          value={uploadFile.category}
                          onValueChange={(value) => updateFile(uploadFile.id, { category: value })}
                          disabled={uploadFile.status === 'uploading'}
                        >
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {uploadFile.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                        {uploadFile.status === 'success' && (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        )}
                        {uploadFile.status === 'error' && (
                          <AlertCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{uploadFile.file.name}</span>
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                      </div>
                      {uploadFile.status === 'uploading' && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadFile.progress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      {uploadFile.error && (
                        <p className="text-sm text-red-500 mt-1">{uploadFile.error}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-600">
            {files.length > 0 && (
              <span>
                {files.filter(f => f.status === 'success').length} of {files.length} uploaded
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Cancel
            </Button>
            <Button 
              onClick={uploadFiles} 
              disabled={files.length === 0 || uploading}
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload {files.length > 0 && `(${files.length})`}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentUploadModal;