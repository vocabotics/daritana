import React from 'react';
import { FileText, File, Image, FileSpreadsheet, FileCode, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function RecentFilesWidget({ data }: { data: any }) {
  // Use real data if available, otherwise show loading state
  const files = data && Array.isArray(data) ? data : [];

  const getIcon = (type: string) => {
    const lowerType = type?.toLowerCase() || '';
    if (lowerType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (lowerType.includes('xls') || lowerType.includes('excel')) return <FileSpreadsheet className="h-4 w-4 text-green-500" />;
    if (lowerType.includes('jpg') || lowerType.includes('jpeg') || lowerType.includes('png') || lowerType.includes('image')) return <Image className="h-4 w-4 text-blue-500" />;
    if (lowerType.includes('dwg') || lowerType.includes('cad')) return <FileCode className="h-4 w-4 text-purple-500" />;
    return <File className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatModifiedTime = (date: Date | string) => {
    if (!date) return 'Unknown time';
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Recently';
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <File className="h-8 w-8 mb-2 text-gray-300" />
        <p className="text-sm">No recent files</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.slice(0, 5).map((file, index) => (
        <div key={file.id || index} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 cursor-pointer">
          {getIcon(file.type)}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{file.name}</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>{formatFileSize(file.size)}</span>
              <span>•</span>
              <span>{file.modifiedBy}</span>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatModifiedTime(file.modifiedAt)}</span>
              </div>
            </div>
            {file.projectName && (
              <p className="text-xs text-blue-600 mt-1">{file.projectName}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}