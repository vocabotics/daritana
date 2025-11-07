import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Link, Mail, Calendar, Lock } from 'lucide-react';
import { documentsService } from '@/services/documents.service';
import { toast } from 'sonner';

interface DocumentShareModalProps {
  document: any;
  onClose: () => void;
}

const DocumentShareModal: React.FC<DocumentShareModalProps> = ({ document, onClose }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [expiration, setExpiration] = useState('7');
  const [canDownload, setCanDownload] = useState(true);
  const [canPrint, setCanPrint] = useState(true);
  const [passwordProtected, setPasswordProtected] = useState(false);

  const [sharing, setSharing] = useState(false);

  const handleShare = async () => {
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setSharing(true);
    try {
      const documentId = document._raw?.id || document.id;
      await documentsService.shareDocument(documentId, {
        emails: [email],
        permissions: permission as 'view' | 'edit' | 'admin',
        message: `Shared document: ${document.title}`
      });
      
      toast.success('Document shared successfully');
      onClose();
    } catch (error) {
      console.error('Failed to share document:', error);
      toast.error('Failed to share document');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="border-b p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Share Document</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <p className="font-medium text-sm text-gray-700 mb-1">{document.title}</p>
            <p className="text-xs text-gray-500">{document.document_number}</p>
          </div>
          
          <div>
            <Label htmlFor="email">Share with email address</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="permission">Permission level</Label>
            <Select value={permission} onValueChange={setPermission}>
              <SelectTrigger id="permission">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="comment">View & Comment</SelectItem>
                <SelectItem value="edit">View & Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="expiration">Link expires in</Label>
            <Select value={expiration} onValueChange={setExpiration}>
              <SelectTrigger id="expiration">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="download" 
                checked={canDownload}
                onCheckedChange={(checked) => setCanDownload(checked as boolean)}
              />
              <Label htmlFor="download" className="text-sm font-normal">
                Allow download
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="print" 
                checked={canPrint}
                onCheckedChange={(checked) => setCanPrint(checked as boolean)}
              />
              <Label htmlFor="print" className="text-sm font-normal">
                Allow printing
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="password" 
                checked={passwordProtected}
                onCheckedChange={(checked) => setPasswordProtected(checked as boolean)}
              />
              <Label htmlFor="password" className="text-sm font-normal">
                Password protect
              </Label>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={onClose} disabled={sharing}>Cancel</Button>
            <Button onClick={handleShare} disabled={sharing || !email}>
              <Link className="h-4 w-4 mr-2" />
              {sharing ? 'Sharing...' : 'Create Share Link'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentShareModal;