import React, { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TwoFactorAuth } from '@/components/security/TwoFactorAuth';
import { SingleSignOn } from '@/components/security/SingleSignOn';
import { AuditLog } from '@/components/security/AuditLog';
import { SessionManagement } from '@/components/security/SessionManagement';
import { SecuritySettings } from '@/components/security/SecuritySettings';
import { 
  Shield,
  Lock,
  Key,
  UserCheck,
  Activity,
  Settings,
  AlertTriangle,
  CheckCircle,
  Smartphone,
  Globe
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SecurityEnhanced() {
  const [securityScore, setSecurityScore] = useState(85);

  const securityMetrics = [
    { label: '2FA Enabled Users', value: '87%', status: 'good' },
    { label: 'SSO Adoption', value: '65%', status: 'medium' },
    { label: 'Password Strength', value: '92%', status: 'good' },
    { label: 'Active Sessions', value: '124', status: 'neutral' }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Layout>
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold">Security Center</h1>
            <p className="text-gray-500 mt-1">Manage authentication, access control, and security settings</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="px-3 py-1">
              <Shield className="h-4 w-4 mr-1" />
              Security Score
            </Badge>
            <span className={`text-2xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}/100
            </span>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {securityMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-500">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{metric.value}</span>
                    {metric.status === 'good' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {metric.status === 'medium' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Security Alerts */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle>Security Recommendations</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-sm">13 users haven't enabled 2FA - send reminder</span>
                <Button size="sm" variant="outline" className="ml-auto">Take Action</Button>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-sm">5 weak passwords detected - force reset recommended</span>
                <Button size="sm" variant="outline" className="ml-auto">Review</Button>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-400 rounded-full" />
                <span className="text-sm">2 suspicious login attempts blocked yesterday</span>
                <Button size="sm" variant="outline" className="ml-auto">View Details</Button>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Main Security Tabs */}
        <Tabs defaultValue="2fa" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="2fa" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              2FA
            </TabsTrigger>
            <TabsTrigger value="sso" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              SSO
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Audit Log
            </TabsTrigger>
            <TabsTrigger value="sessions" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Sessions
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="2fa">
            <TwoFactorAuth />
          </TabsContent>

          <TabsContent value="sso">
            <SingleSignOn />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLog />
          </TabsContent>

          <TabsContent value="sessions">
            <SessionManagement />
          </TabsContent>

          <TabsContent value="settings">
            <SecuritySettings />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}