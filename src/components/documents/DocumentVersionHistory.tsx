import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Download, RotateCcw, Clock, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { Document } from '@/types/document';
import { documentApi } from '@/lib/api';
import { formatFileSize } from '@/types/document';
import { toast } from 'sonner';

interface DocumentVersionHistoryProps {
  document: Document;
  onClose: () => void;
}

const DocumentVersionHistory: React.FC<DocumentVersionHistoryProps> = ({ document, onClose }) => {
  const [versions, setVersions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load document versions from API
  useEffect(() => {
    const loadVersions = async () => {
      if (!document.id) return;
      
      setIsLoading(true);
      try {
        const response = await documentApi.getDocumentVersions(document.id);
        if (response.data?.versions) {
          const formattedVersions = response.data.versions.map((version: any) => ({
            id: version.id,
            version_number: version.version || version.versionNumber,
            is_major_version: version.isMajorVersion || false,
            status: version.status || 'draft',
            change_summary: version.changeSummary || version.message || 'Version update',
            revision_notes: version.revisionNotes || version.description,
            file_size: version.fileSize || version.metadata?.fileSize || 0,
            created_at: new Date(version.createdAt || version.timestamp),
            created_by: version.createdBy || version.author?.name || 'Unknown'
          }));
          setVersions(formattedVersions);
        }
      } catch (error) {
        console.error('Failed to load document versions:', error);
        toast.error('Failed to load version history');
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [document.id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Version History</h2>
            <p className="text-sm text-gray-600">{document.title}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-gray-300 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading version history...</p>
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No version history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {versions.map((version) => (
                <div key={version.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-medium">Version {version.version_number}</h4>
                        {version.is_major_version && (
                          <Badge variant="secondary">Major</Badge>
                        )}
                        {version.status === 'active' && (
                          <Badge className="bg-green-100 text-green-800">Current</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{version.change_summary}</p>
                      {version.revision_notes && (
                        <p className="text-xs text-gray-500">{version.revision_notes}</p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{formatFileSize(version.file_size)}</span>
                        <span>Created {formatDistanceToNow(version.created_at, { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {version.status !== 'active' && (
                        <Button variant="ghost" size="sm">
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentVersionHistory;