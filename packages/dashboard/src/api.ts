import {
  OverviewData,
  ReviewItem,
  ReviewDetailData,
  FingerprintItem,
  ClusterGraphData,
  RulesConfigData,
} from './types';

const API_BASE = 'http://localhost:4000/api/v1';

export const api = {
  async getOverview(): Promise<OverviewData> {
    const res = await fetch(`${API_BASE}/analytics/overview`);
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    return res.json();
  },

  async getReviewQueue(status: string = 'all', search: string = ''): Promise<{ items: ReviewItem[]; pendingCount: number; totalCount: number }> {
    const params = new URLSearchParams({ status, search });
    const res = await fetch(`${API_BASE}/review-queue?${params}`);
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
  },

  async getReviewDetail(id: string): Promise<ReviewDetailData> {
    const res = await fetch(`${API_BASE}/review-queue/${id}`);
    if (!res.ok) throw new Error('Failed to fetch review detail');
    return res.json();
  },

  async submitDecision(id: string, decision: 'approved' | 'rejected' | 'abuser', notes?: string) {
    const res = await fetch(`${API_BASE}/review-queue/${id}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes }),
    });
    if (!res.ok) throw new Error('Failed to submit review decision');
    return res.json();
  },

  async getFingerprints(search: string = ''): Promise<{ fingerprints: FingerprintItem[]; totalCount: number }> {
    const params = new URLSearchParams({ search });
    const res = await fetch(`${API_BASE}/fingerprints?${params}`);
    if (!res.ok) throw new Error('Failed to fetch fingerprints');
    return res.json();
  },

  async getFingerprintDetail(id: string) {
    const res = await fetch(`${API_BASE}/fingerprints/${id}`);
    if (!res.ok) throw new Error('Failed to fetch fingerprint detail');
    return res.json();
  },

  async toggleBanFingerprint(id: string, isBanned: boolean) {
    const res = await fetch(`${API_BASE}/fingerprints/${id}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBanned }),
    });
    if (!res.ok) throw new Error('Failed to update ban status');
    return res.json();
  },

  async getClusters(): Promise<ClusterGraphData> {
    const res = await fetch(`${API_BASE}/analytics/clusters`);
    if (!res.ok) throw new Error('Failed to fetch clusters');
    return res.json();
  },

  async getRules(): Promise<RulesConfigData> {
    const res = await fetch(`${API_BASE}/rules`);
    if (!res.ok) throw new Error('Failed to fetch rules config');
    return res.json();
  },

  async updateRules(payload: Partial<RulesConfigData['rules']> & { webhook_url?: string }) {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Failed to update rules');
    return res.json();
  },

  async triggerScenario(scenario: string) {
    const res = await fetch(`${API_BASE}/simulate/scenario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    });
    if (!res.ok) throw new Error('Failed to execute scenario');
    return res.json();
  },
};
