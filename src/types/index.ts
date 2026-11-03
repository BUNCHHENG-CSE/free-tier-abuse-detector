export interface OverviewMetrics {
  totalSignups: number;
  flaggedCount: number;
  pendingReviewCount: number;
  multiAccountFpCount: number;
  abuseSharePercent: number;
  estimatedSavings: number;
}

export interface TimelinePoint {
  time: string;
  total: number;
  flagged: number;
}

export interface ReasonStat {
  reason: string;
  count: number;
}

export interface OverviewData {
  metrics: OverviewMetrics;
  timeline: TimelinePoint[];
  topReasons: ReasonStat[];
}

export interface ReviewItem {
  id: string;
  event_id: string;
  email: string;
  fingerprint_id: string;
  risk_score: number;
  reasons: string[];
  status: 'pending' | 'approved' | 'rejected' | 'abuser';
  reviewer_notes?: string;
  reviewed_at?: number;
  created_at: number;
  ip_address: string;
  event_type: string;
  user_agent?: string;
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  linked_accounts_count?: number;
  is_banned?: number;
}

export interface ReviewDetailData {
  item: ReviewItem & { raw_signals?: any };
  linkedAccounts: Array<{
    email: string;
    status: string;
    first_seen_at: number;
    last_seen_at: number;
    ip_address: string;
  }>;
  eventTimeline: Array<{
    id: string;
    event_type: string;
    email: string;
    ip_address: string;
    risk_score: number;
    status: string;
    created_at: number;
  }>;
}

export interface FingerprintItem {
  id: string;
  first_seen_at: number;
  last_seen_at: number;
  total_events: number;
  linked_accounts_count: number;
  primary_ip: string;
  canvas_hash?: string;
  webgl_renderer?: string;
  tags?: string;
  is_banned: number;
}

export interface ClusterNode {
  id: string;
  label: string;
  type: 'fingerprint' | 'account' | 'ip';
  status?: string;
  count?: number;
  isBanned?: boolean;
}

export interface ClusterLink {
  source: string;
  target: string;
  type: string;
}

export interface ClusterGraphData {
  nodes: ClusterNode[];
  links: ClusterLink[];
  stats: {
    totalClusters: number;
    multiAccountDevices: number;
    totalAccountsInClusters: number;
  };
}

export interface DeviceQuotaRecord {
  fingerprint_id: string;
  app_id: string;
  credits_allocated: number;
  credits_used: number;
  linked_accounts_count: number;
  is_locked: number;
  last_used_at: number;
}

export interface RulesConfigData {
  rules: {
    app_id: string;
    max_registrations_24h: number;
    max_accounts_per_fp: number;
    flag_disposable_email: number;
    flag_headless_bot: number;
    flag_ip_hopping: number;
    flag_behavioral_bot?: number;
    flag_tampering?: number;
    pow_enabled?: number;
    pow_difficulty?: number;
    quota_limit?: number;
    discord_webhook_url?: string;
    slack_webhook_url?: string;
    min_score_to_flag: number;
    webhook_on_flag: number;
    updated_at: number;
  };
  app: {
    name: string;
    api_key: string;
    webhook_url: string;
  };
}
