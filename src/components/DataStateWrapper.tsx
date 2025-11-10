import React, { ReactNode } from 'react';
import { ErrorEmptyState } from '@/components/ui/empty-state';
import { FullPageSkeleton, ListSkeleton, CardSkeleton, TableSkeleton } from '@/components/ui/skeleton';

interface DataStateWrapperProps {
  loading: boolean;
  error: Error | null;
  isEmpty: boolean;
  children: ReactNode;
  emptyState: ReactNode;
  loadingComponent?: ReactNode;
  errorMessage?: string;
  onRetry?: () => void;
}

/**
 * Wrapper component that handles loading, error, and empty states
 */
export function DataStateWrapper({
  loading,
  error,
  isEmpty,
  children,
  emptyState,
  loadingComponent,
  errorMessage,
  onRetry,
}: DataStateWrapperProps) {
  if (loading) {
    return <>{loadingComponent || <FullPageSkeleton />}</>;
  }

  if (error) {
    return (
      <ErrorEmptyState
        message={errorMessage || error.message}
        onRetry={onRetry}
      />
    );
  }

  if (isEmpty) {
    return <>{emptyState}</>;
  }

  return <>{children}</>;
}

/**
 * Wrapper for list views
 */
export function ListStateWrapper({
  loading,
  error,
  isEmpty,
  children,
  emptyState,
  itemCount = 5,
  onRetry,
}: Omit<DataStateWrapperProps, 'loadingComponent' | 'errorMessage'> & {
  itemCount?: number;
}) {
  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={emptyState}
      loadingComponent={<ListSkeleton items={itemCount} />}
      onRetry={onRetry}
    >
      {children}
    </DataStateWrapper>
  );
}

/**
 * Wrapper for card grids
 */
export function CardGridStateWrapper({
  loading,
  error,
  isEmpty,
  children,
  emptyState,
  cardCount = 6,
  onRetry,
}: Omit<DataStateWrapperProps, 'loadingComponent' | 'errorMessage'> & {
  cardCount?: number;
}) {
  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={emptyState}
      loadingComponent={
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      }
      onRetry={onRetry}
    >
      {children}
    </DataStateWrapper>
  );
}

/**
 * Wrapper for table views
 */
export function TableStateWrapper({
  loading,
  error,
  isEmpty,
  children,
  emptyState,
  rowCount = 10,
  onRetry,
}: Omit<DataStateWrapperProps, 'loadingComponent' | 'errorMessage'> & {
  rowCount?: number;
}) {
  return (
    <DataStateWrapper
      loading={loading}
      error={error}
      isEmpty={isEmpty}
      emptyState={emptyState}
      loadingComponent={<TableSkeleton rows={rowCount} />}
      onRetry={onRetry}
    >
      {children}
    </DataStateWrapper>
  );
}
