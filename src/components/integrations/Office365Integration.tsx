import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import { 
  FileText,
  FolderOpen,
  Calendar,
  Mail,
  Table,
  Users,
  CheckCircle,
  Link,
  Cloud,
  Building
} from 'lucide-react';
import { toast } from 'sonner';

export function Office365Integration() {
  const [isConnected, setIsConnected] = useState(false);
  const [services, setServices] = useState({
    onedrive: { enabled: true, storage: 4.8, total: 5 },
    outlook: { enabled: true, emails: 1234, calendars: 5 },
    teams: { enabled: false, teams: 0, channels: 0 },
    sharepoint: { enabled: true, sites: 3, libraries: 12 },
    excel: { enabled: true, files: 87 },
    word: { enabled: true, files: 234 }
  });

  const connectOffice = () => {
    // Simulate Microsoft OAuth
    window.open('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', '_blank');
    setTimeout(() => {
      setIsConnected(true);
      toast.success('Successfully connected to Office 365');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Building className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <CardTitle>Office 365 Integration</CardTitle>
                <CardDescription>Connect Microsoft Office apps and services</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isConnected ? (
                <>
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Connected
                  </Badge>
                  <Button variant="outline" size="sm">
                    Manage
                  </Button>
                </>
              ) : (
                <Button onClick={connectOffice}>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Office 365
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Services Overview */}
      {isConnected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* OneDrive */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cloud className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">OneDrive</CardTitle>
                </div>
                <Switch checked={services.onedrive.enabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Storage</span>
                    <span>{services.onedrive.storage}GB / {services.onedrive.total}GB</span>
                  </div>
                  <Progress value={(services.onedrive.storage / services.onedrive.total) * 100} />
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Manage Files
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Outlook */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-blue-500" />
                  <CardTitle className="text-base">Outlook</CardTitle>
                </div>
                <Switch checked={services.outlook.enabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-2xl font-bold">{services.outlook.emails}</p>
                    <p className="text-gray-500">Emails</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{services.outlook.calendars}</p>
                    <p className="text-gray-500">Calendars</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Sync Settings
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SharePoint */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">SharePoint</CardTitle>
                </div>
                <Switch checked={services.sharepoint.enabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-2xl font-bold">{services.sharepoint.sites}</p>
                    <p className="text-gray-500">Sites</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{services.sharepoint.libraries}</p>
                    <p className="text-gray-500">Libraries</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Browse Sites
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Excel & Word */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-base">Office Apps</CardTitle>
                </div>
                <Switch checked={services.excel.enabled && services.word.enabled} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-2xl font-bold">{services.excel.files}</p>
                    <p className="text-gray-500">Excel Files</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{services.word.files}</p>
                    <p className="text-gray-500">Word Docs</p>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="w-full">
                  Open in Office
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}