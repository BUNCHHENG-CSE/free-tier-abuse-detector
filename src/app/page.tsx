'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/Header';
import { Sidebar } from '@/components/Sidebar';
import { Overview } from '@/components/pages/Overview';
import { OverviewData } from '@/types';
import { api } from '@/lib/api';

// Loading skeleton for lazy-loaded dashboard tabs
const TabLoadingSkeleton = () => (
  <div className="flex flex-col items-center justify-center h-80 text-xs text-muted-foreground gap-3">
    <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    <span className="font-mono text-xs text-foreground font-medium">Loading module...</span>
  </div>
);

// Dynamic imports for secondary views to minimize initial bundle size and optimize Core Web Vitals
const ReviewQueue = dynamic(
  () => import('@/components/pages/ReviewQueue').then((m) => m.ReviewQueue),
  { loading: TabLoadingSkeleton }
);
const Fingerprints = dynamic(
  () => import('@/components/pages/Fingerprints').then((m) => m.Fingerprints),
  { loading: TabLoadingSkeleton }
);
const ClusterGraph = dynamic(
  () => import('@/components/pages/ClusterGraph').then((m) => m.ClusterGraph),
  { loading: TabLoadingSkeleton }
);
const DeviceQuotas = dynamic(
  () => import('@/components/pages/DeviceQuotas').then((m) => m.DeviceQuotas),
  { loading: TabLoadingSkeleton }
);
const RulesConfig = dynamic(
  () => import('@/components/pages/RulesConfig').then((m) => m.RulesConfig),
  { loading: TabLoadingSkeleton }
);
const Integration = dynamic(
  () => import('@/components/pages/Integration').then((m) => m.Integration),
  { loading: TabLoadingSkeleton }
);
const Playground = dynamic(
  () => import('@/components/pages/Playground').then((m) => m.Playground),
  { loading: TabLoadingSkeleton }
);
const ReviewModal = dynamic(
  () => import('@/components/ReviewModal').then((m) => m.ReviewModal),
  { ssr: false }
);

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await api.getOverview();
      setOverviewData(res);
    } catch (err) {
      console.error('Failed to fetch overview metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGlobalRefresh = useCallback(() => {
    fetchOverview();
    setRefreshKey((k) => k + 1);
  }, [fetchOverview]);

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, [fetchOverview]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background text-foreground font-sans relative">
      <Header
        onRefresh={handleGlobalRefresh}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden relative z-10">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={overviewData?.metrics.pendingReviewCount || 0}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        />

        <main
          className={`flex-1 min-h-0 ${
            activeTab === 'queue'
              ? 'h-full overflow-hidden flex flex-col p-3 sm:p-4 md:px-6 md:py-4'
              : 'overflow-y-auto overflow-x-hidden p-3 sm:p-4 md:px-6 md:py-4'
          }`}
        >
          {loading && !overviewData ? (
            <div className="flex flex-col items-center justify-center h-80 text-xs text-muted-foreground gap-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="font-mono text-foreground font-medium">
                Initializing TCT Shield Security Operations HUD...
              </span>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && overviewData && (
                <Overview
                  key={`overview-${refreshKey}`}
                  data={overviewData}
                  onOpenReview={(id) => setReviewModalId(id)}
                  onSwitchTab={setActiveTab}
                />
              )}

              {activeTab === 'queue' && (
                <ReviewQueue
                  key={`queue-${refreshKey}`}
                  onOpenReview={(id) => setReviewModalId(id)}
                  onRefreshParent={handleGlobalRefresh}
                />
              )}

              {activeTab === 'fingerprints' && <Fingerprints key={`fps-${refreshKey}`} />}

              {activeTab === 'clusters' && <ClusterGraph key={`clusters-${refreshKey}`} />}

              {activeTab === 'quotas' && <DeviceQuotas key={`quotas-${refreshKey}`} />}

              {activeTab === 'rules' && <RulesConfig key={`rules-${refreshKey}`} />}

              {activeTab === 'integration' && <Integration key={`integration-${refreshKey}`} />}

              {activeTab === 'playground' && (
                <Playground onSwitchToQueue={() => setActiveTab('queue')} />
              )}
            </>
          )}
        </main>
      </div>

      {reviewModalId && (
        <ReviewModal
          itemId={reviewModalId}
          onClose={() => setReviewModalId(null)}
          onDecisionSubmitted={() => {
            handleGlobalRefresh();
          }}
        />
      )}
    </div>
  );
}
