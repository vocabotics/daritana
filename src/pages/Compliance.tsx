import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  FileCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock,
  Building,
  Users,
  FileText,
  Plus,
  Send
} from 'lucide-react';
import ComplianceDashboard from '@/components/compliance/ComplianceDashboard';
import ComplianceRules from '@/components/compliance/ComplianceRules';
import ProjectComplianceList from '@/components/compliance/ProjectComplianceList';
import ComplianceAlerts from '@/components/compliance/ComplianceAlerts';
import UBBLBylawsList from '@/components/compliance/UBBLBylawsList';
import AuthoritySubmissions from '@/components/submissions/AuthoritySubmissions';
import { useAuthStore } from '@/store/authStore';

export default function Compliance() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSubmissionWizard, setShowSubmissionWizard] = useState(false);

  const canManageCompliance = user?.role === 'project_lead' || user?.role === 'staff' || user?.role === 'architect';

  const toolbar = (
    <div className="flex items-center justify-between w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8 bg-transparent border-0 p-0">
          <TabsTrigger value="dashboard" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Projects
          </TabsTrigger>
          <TabsTrigger value="submissions" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Submissions
          </TabsTrigger>
          <TabsTrigger value="rules" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Rules
          </TabsTrigger>
          <TabsTrigger value="ubbl" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            UBBL
          </TabsTrigger>
          <TabsTrigger value="alerts" className="text-sm data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Alerts
          </TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="flex items-center gap-2">
        {canManageCompliance && (activeTab === 'rules' || activeTab === 'submissions') && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => {
              if (activeTab === 'submissions') {
                setShowSubmissionWizard(true);
              }
              // TODO: Handle Add Rule for rules tab
            }}
            className="h-8 px-3"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="text-sm">{activeTab === 'rules' ? 'Add Rule' : 'New Submission'}</span>
          </Button>
        )}
      </div>
    </div>
  );


  return (
    <Layout
      contextualInfo={false}
      fullHeight={true}
      toolbar={toolbar}
    >
      <div className="h-full">
        {activeTab === 'dashboard' && <ComplianceDashboard />}
        
        {activeTab === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Compliance Status</CardTitle>
              <CardDescription>Monitor compliance status across all active projects</CardDescription>
            </CardHeader>
            <CardContent>
              <ProjectComplianceList />
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'submissions' && (
          <AuthoritySubmissions 
            showWizard={showSubmissionWizard} 
            setShowWizard={setShowSubmissionWizard}
            hideHeader={true}
          />
        )}
        
        {activeTab === 'rules' && (
          <Card>
            <CardHeader>
              <CardTitle>Compliance Rules</CardTitle>
              <CardDescription>Manage regulatory rules and requirements</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceRules />
            </CardContent>
          </Card>
        )}
        
        {activeTab === 'ubbl' && <UBBLBylawsList />}
        
        {activeTab === 'alerts' && (
          <Card>
            <CardHeader>
              <CardTitle>Compliance Alerts</CardTitle>
              <CardDescription>Active compliance alerts requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <ComplianceAlerts />
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}