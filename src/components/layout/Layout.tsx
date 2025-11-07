import React from 'react';
import { ResponsiveLayout } from './ResponsiveLayout';
import { ContextualPageWrapper } from './ContextualPageWrapper';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  actions?: React.ReactNode;
  contextualInfo?: boolean;
  fullHeight?: boolean;
  toolbar?: React.ReactNode;
}

export function Layout({ children, title, description, actions, contextualInfo, fullHeight, toolbar }: LayoutProps) {
  return (
    <ResponsiveLayout toolbar={toolbar}>
      <ContextualPageWrapper
        title={title}
        description={description}
        actions={actions}
        contextualInfo={contextualInfo}
        fullHeight={fullHeight}
      >
        {children}
      </ContextualPageWrapper>
    </ResponsiveLayout>
  );
}