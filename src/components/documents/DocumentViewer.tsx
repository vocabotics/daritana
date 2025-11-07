import React from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Share2, Maximize2 } from 'lucide-react';
import type { Document } from '@/types/document';

interface DocumentViewerProps {
  document: Document;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ document, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{document.title}</h2>
          <p className="text-sm text-gray-400">{document.document_number}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="text-white hover:bg-gray-800">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-gray-800">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full h-full flex items-center justify-center">
          <p className="text-gray-500">Document preview would appear here</p>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;