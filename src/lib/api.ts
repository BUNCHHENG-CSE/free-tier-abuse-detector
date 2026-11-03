import {
  OverviewData,
  ReviewItem,
  ReviewDetailData,
  FingerprintItem,
  ClusterGraphData,
  RulesConfigData,
  DeviceQuotaRecord,
} from '@/types';

const API_BASE = '/api/v1';

export const api = {
  async getOverview(): Promise<OverviewData> {
    const res = await fetch(`${API_BASE}/analytics/overview`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch overview metrics');
    return res.json();
  },

  async getReviewQueue(
    status: string = 'all',
    search: string = ''
  ): Promise<{ items: ReviewItem[]; pendingCount: number; totalCount: number }> {
    const params = new URLSearchParams({ status, search });
    const res = await fetch(`${API_BASE}/review-queue?${params}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch review queue');
    return res.json();
  },

  async getReviewDetail(id: string): Promise<ReviewDetailData> {
    const res = await fetch(`${API_BASE}/review-queue/${id}`, { cache: 'no-store' });
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
    const res = await fetch(`${API_BASE}/fingerprints?${params}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch fingerprints');
    return res.json();
  },

  async getFingerprintDetail(id: string) {
    const res = await fetch(`${API_BASE}/fingerprints/${id}`, { cache: 'no-store' });
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
    const res = await fetch(`${API_BASE}/analytics/clusters`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch clusters');
    return res.json();
  },

  async getRules(): Promise<RulesConfigData> {
    const res = await fetch(`${API_BASE}/rules`, { cache: 'no-store' });
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

  async testWebhook(url?: string, type?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/rules/test-webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, type }),
    });
    if (!res.ok) throw new Error('Failed to trigger test webhook');
    return res.json();
  },

  async getDeviceQuotas(): Promise<{ total: number; quotas: DeviceQuotaRecord[] }> {
    const res = await fetch(`${API_BASE}/quota/list`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch device quotas');
    return res.json();
  },

  async resetDeviceQuota(fingerprintId: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/quota/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprintId }),
    });
    if (!res.ok) throw new Error('Failed to reset quota');
    return res.json();
  },

  async lockDeviceQuota(fingerprintId: string, isLocked: boolean): Promise<{ success: boolean; isLocked: boolean }> {
    const res = await fetch(`${API_BASE}/quota/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fingerprintId, isLocked }),
    });
    if (!res.ok) throw new Error('Failed to update quota lock state');
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
