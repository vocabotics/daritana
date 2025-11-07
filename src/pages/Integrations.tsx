import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SlackIntegration } from '@/components/integrations/SlackIntegration';
import { TeamsIntegration } from '@/components/integrations/TeamsIntegration';
import { GoogleWorkspaceIntegration } from '@/components/integrations/GoogleWorkspaceIntegration';
import { Office365Integration } from '@/components/integrations/Office365Integration';
import { WebhookManager } from '@/components/integrations/WebhookManager';
import { 
  Plug,
  Link,
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  ExternalLink,
  Plus,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Integrations() {
  const [activeIntegrations, setActiveIntegrations] = useState({
    slack: false,
    teams: false,
    googleWorkspace: true,
    office365: false,
    github: false,
    jira: false,
    trello: false,
    zapier: true
  });

  const integrationCategories = [
    {
      name: 'Communication',
      integrations: [
        {
          id: 'slack',
          name: 'Slack',
          description: 'Real-time messaging and notifications',
          icon: '💬',
          status: activeIntegrations.slack ? 'connected' : 'disconnected',
          features: ['Real-time notifications', 'Channel integration', 'File sharing', 'Slash commands']
        },
        {
          id: 'teams',
          name: 'Microsoft Teams',
          description: 'Team collaboration and video meetings',
          icon: '👥',
          status: activeIntegrations.teams ? 'connected' : 'disconnected',
          features: ['Meeting scheduling', 'Team channels', 'File collaboration', 'Video calls']
        }
      ]
    },
    {
      name: 'Productivity',
      integrations: [
        {
          id: 'googleWorkspace',
          name: 'Google Workspace',
          description: 'Docs, Sheets, Drive integration',
          icon: '📊',
          status: activeIntegrations.googleWorkspace ? 'connected' : 'disconnected',
          features: ['Google Drive sync', 'Docs collaboration', 'Calendar sync', 'Gmail integration']
        },
        {
          id: 'office365',
          name: 'Office 365',
          description: 'Microsoft Office suite integration',
          icon: '📝',
          status: activeIntegrations.office365 ? 'connected' : 'disconnected',
          features: ['OneDrive sync', 'Word/Excel integration', 'Outlook calendar', 'SharePoint']
        }
      ]
    },
    {
      name: 'Development',
      integrations: [
        {
          id: 'github',
          name: 'GitHub',
          description: 'Code repository and version control',
          icon: '🐙',
          status: activeIntegrations.github ? 'connected' : 'disconnected',
          features: ['Repository sync', 'Issue tracking', 'Pull requests', 'Actions integration']
        },
        {
          id: 'jira',
          name: 'Jira',
          description: 'Issue tracking and agile project management',
          icon: '🎯',
          status: activeIntegrations.jira ? 'connected' : 'disconnected',
          features: ['Issue sync', 'Sprint planning', 'Roadmap integration', 'Custom workflows']
        }
      ]
    },
    {
      name: 'Automation',
      integrations: [
        {
          id: 'zapier',
          name: 'Zapier',
          description: 'Automate workflows between apps',
          icon: '⚡',
          status: activeIntegrations.zapier ? 'connected' : 'disconnected',
          features: ['1000+ app connections', 'Custom workflows', 'Triggers and actions', 'Multi-step zaps']
        },
        {
          id: 'webhooks',
          name: 'Webhooks',
          description: 'Custom HTTP callbacks for events',
          icon: '🔗',
          status: 'connected',
          features: ['Custom endpoints', 'Event triggers', 'Payload customization', 'Retry logic']
        }
      ]
    }
  ];

  const toggleIntegration = (id: string) => {
    setActiveIntegrations(prev => ({
      ...prev,
      [id]: !prev[id as keyof typeof prev]
    }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-gray-400';
      case 'error': return 'text-red-500';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />;
      case 'disconnected': return <XCircle className="h-4 w-4" />;
      case 'error': return <AlertCircle className="h-4 w-4" />;
      default: return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Integrations</h1>
            <p className="text-gray-500 mt-1">Connect your favorite tools and services</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync All
            </Button>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Integration
            </Button>
          </div>
        </div>

        {/* Integration Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Active Integrations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Object.values(activeIntegrations).filter(v => v).length}
              </div>
              <p className="text-xs text-gray-500 mt-1">Connected services</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">API Calls Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,847</div>
              <p className="text-xs text-gray-500 mt-1">Across all integrations</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Webhooks Active</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-gray-500 mt-1">Receiving events</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500">Last Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2m</div>
              <p className="text-xs text-gray-500 mt-1">ago</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Integration Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Integrations</TabsTrigger>
            <TabsTrigger value="slack">Slack</TabsTrigger>
            <TabsTrigger value="teams">Teams</TabsTrigger>
            <TabsTrigger value="google">Google</TabsTrigger>
            <TabsTrigger value="office">Office 365</TabsTrigger>
            <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {integrationCategories.map((category, categoryIndex) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
              >
                <h3 className="text-lg font-semibold mb-4">{category.name}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.integrations.map((integration) => (
                    <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="text-3xl">{integration.icon}</div>
                            <div>
                              <CardTitle className="text-lg">{integration.name}</CardTitle>
                              <CardDescription>{integration.description}</CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1 ${getStatusColor(integration.status)}`}>
                              {getStatusIcon(integration.status)}
                              <span className="text-sm capitalize">{integration.status}</span>
                            </div>
                            <Switch
                              checked={integration.status === 'connected'}
                              onCheckedChange={() => toggleIntegration(integration.id)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Features:</p>
                            <div className="flex flex-wrap gap-1">
                              {integration.features.map((feature, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between pt-3 border-t">
                            <Button variant="outline" size="sm">
                              <Settings className="h-3 w-3 mr-1" />
                              Configure
                            </Button>
                            <Button variant="ghost" size="sm">
                              Learn More
                              <ExternalLink className="h-3 w-3 ml-1" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            ))}
          </TabsContent>

          <TabsContent value="slack">
            <SlackIntegration />
          </TabsContent>

          <TabsContent value="teams">
            <TeamsIntegration />
          </TabsContent>

          <TabsContent value="google">
            <GoogleWorkspaceIntegration />
          </TabsContent>

          <TabsContent value="office">
            <Office365Integration />
          </TabsContent>

          <TabsContent value="webhooks">
            <WebhookManager />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}