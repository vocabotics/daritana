import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { UserManagement } from '@/components/admin/UserManagement';
import { SystemAnalytics } from '@/components/admin/SystemAnalytics';
import { SystemSettings } from '@/components/admin/SystemSettings';
import { AuditLogs } from '@/components/admin/AuditLogs';
import { BackupRestore } from '@/components/admin/BackupRestore';
import { SystemMaintenance } from '@/components/admin/SystemMaintenance';

export const AdminPortal: React.FC = () => {
  return (
    <Layout>
      <Routes>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="analytics" element={<SystemAnalytics />} />
        <Route path="settings" element={<SystemSettings />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="backup" element={<BackupRestore />} />
        <Route path="maintenance" element={<SystemMaintenance />} />
      </Routes>
    </Layout>
  );
};

export default AdminPortal;