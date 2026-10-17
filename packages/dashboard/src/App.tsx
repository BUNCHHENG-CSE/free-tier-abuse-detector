import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReviewModal } from './components/ReviewModal';
import { Overview } from './pages/Overview';
import { ReviewQueue } from './pages/ReviewQueue';
import { Fingerprints } from './pages/Fingerprints';
import { ClusterGraph } from './pages/ClusterGraph';
import { RulesConfig } from './pages/RulesConfig';
import { Integration } from './pages/Integration';
import { Playground } from './pages/Playground';
import { OverviewData } from './types';
import { api } from './api';

export function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModalId, setReviewModalId] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      const res = await api.getOverview();
      setOverviewData(res);
    } catch (err) {
      console.error('Failed to fetch overview metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
    const interval = setInterval(fetchOverview, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#070b14] text-slate-100 font-sans">
      <Header
        onRefresh={fetchOverview}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingCount={overviewData?.metrics.pendingReviewCount || 0}
        />

        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {loading && !overviewData ? (
            <div className="flex items-center justify-center h-64 text-xs text-slate-400">
              Initializing AbuseShield anti-abuse dashboard...
            </div>
          ) : (
            <>
              {activeTab === 'overview' && overviewData && (
                <Overview
                  data={overviewData}
                  onOpenReview={(id) => setReviewModalId(id)}
                  onSwitchTab={setActiveTab}
                />
              )}

              {activeTab === 'queue' && (
                <ReviewQueue
                  onOpenReview={(id) => setReviewModalId(id)}
                  onRefreshParent={fetchOverview}
                />
              )}

              {activeTab === 'fingerprints' && <Fingerprints />}

              {activeTab === 'clusters' && <ClusterGraph />}

              {activeTab === 'rules' && <RulesConfig />}

              {activeTab === 'integration' && <Integration />}

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
            fetchOverview();
          }}
        />
      )}
    </div>
  );
}

export default App;
