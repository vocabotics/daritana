import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  Video,
  Calendar,
  MessageSquare,
  Settings,
  CheckCircle,
  Link,
  Folder
} from 'lucide-react';
import { toast } from 'sonner';

export function TeamsIntegration() {
  const [isConnected, setIsConnected] = useState(false);
  const [tenant, setTenant] = useState('');
  const [teams, setTeams] = useState([
    { id: 1, name: 'Architecture Team', connected: true, channels: ['General', 'Projects', 'Design'] },
    { id: 2, name: 'Engineering Team', connected: false, channels: ['General', 'Development'] }
  ]);

  const features = {
    meetings: true,
    chat: true,
    files: true,
    calendar: true,
    presence: false
  };

  const connectTeams = () => {
    // Simulate Microsoft OAuth
    window.open('https://login.microsoftonline.com/common/oauth2/v2.0/authorize', '_blank');
    setTimeout(() => {
      setIsConnected(true);
      toast.success('Successfully connected to Microsoft Teams');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle>Microsoft Teams Integration</CardTitle>
                <CardDescription>Collaborate with your team using Microsoft Teams</CardDescription>
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
                    Disconnect
                  </Button>
                </>
              ) : (
                <Button onClick={connectTeams}>
                  <Link className="h-4 w-4 mr-2" />
                  Connect Teams
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        {isConnected && (
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tenant">Organization Tenant</Label>
                <Input
                  id="tenant"
                  placeholder="your-org.onmicrosoft.com"
                  value={tenant}
                  onChange={(e) => setTenant(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Features Configuration */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Features Configuration</CardTitle>
            <CardDescription>Enable Teams features for your workspace</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Video className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Video Meetings</p>
                    <p className="text-sm text-gray-500">Schedule and join Teams meetings</p>
                  </div>
                </div>
                <Switch defaultChecked={features.meetings} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Chat Integration</p>
                    <p className="text-sm text-gray-500">Send messages to Teams channels</p>
                  </div>
                </div>
                <Switch defaultChecked={features.chat} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Folder className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">File Sharing</p>
                    <p className="text-sm text-gray-500">Share files through Teams</p>
                  </div>
                </div>
                <Switch defaultChecked={features.files} />
              </div>
              
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Calendar Sync</p>
                    <p className="text-sm text-gray-500">Sync meetings with Teams calendar</p>
                  </div>
                </div>
                <Switch defaultChecked={features.calendar} />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teams & Channels */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Teams & Channels</CardTitle>
            <CardDescription>Select teams and channels to integrate</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams.map(team => (
                <div key={team.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{team.name}</span>
                      <Switch checked={team.connected} />
                      <Badge variant={team.connected ? 'default' : 'secondary'}>
                        {team.connected ? 'Connected' : 'Not Connected'}
                      </Badge>
                    </div>
                  </div>
                  
                  {team.connected && (
                    <div className="ml-7">
                      <p className="text-sm text-gray-500 mb-2">Active Channels:</p>
                      <div className="flex flex-wrap gap-2">
                        {team.channels.map((channel, i) => (
                          <Badge key={i} variant="outline">
                            #{channel}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}