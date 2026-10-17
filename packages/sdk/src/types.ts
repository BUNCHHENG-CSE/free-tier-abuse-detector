/**
 * AbuseShield SDK Type Definitions
 */

export interface AbuseShieldConfig {
  /** Public API key for your application */
  apiKey: string;
  /** Ingestion / verification endpoint (defaults to /api/v1) */
  endpoint?: string;
  /** Automatically intercept form submits on forms matching this selector */
  autoAttachForms?: string | boolean;
  /** Enable debug logging to console */
  debug?: boolean;
  /** Custom client token or session ID */
  clientToken?: string;
  /** Timeout for signal collection in ms (default: 1500) */
  timeoutMs?: number;
}

export interface CanvasSignal {
  hash: string;
  supported: boolean;
  geometryHash?: string;
  textHash?: string;
  winding?: boolean;
}

export interface WebGLSignal {
  supported: boolean;
  vendor?: string;
  renderer?: string;
  unmaskedVendor?: string;
  unmaskedRenderer?: string;
  version?: string;
  shadingLanguageVersion?: string;
  extensionsHash?: string;
  precisionHash?: string;
  bufferHash?: string;
}

export interface ScreenSignal {
  width: number;
  height: number;
  availWidth: number;
  availHeight: number;
  colorDepth: number;
  pixelDepth: number;
  devicePixelRatio: number;
  touchSupport: {
    maxTouchPoints: number;
    touchEvent: boolean;
    touchStart: boolean;
  };
  orientation?: string;
}

export interface FontsSignal {
  installed: string[];
  count: number;
  hash: string;
}

export interface AudioSignal {
  supported: boolean;
  hash?: string;
  dynamicsCompressorValue?: number;
}

export interface SystemSignal {
  timezone: string;
  timezoneOffset: number;
  language: string;
  languages: string[];
  platform: string;
  hardwareConcurrency: number;
  deviceMemory?: number;
  cookieEnabled: boolean;
  doNotTrack: string | null;
}

export interface BotSignal {
  isWebdriver: boolean;
  isHeadless: boolean;
  hasAutomationFlags: boolean;
  phantomJs: boolean;
  selenium: boolean;
  puppeteer: boolean;
  pluginsLength: number;
  mimeTypesLength: number;
  hasChromeObject: boolean;
}

export interface StorageSignal {
  persistedToken: string;
  storageAvailable: boolean;
}

export interface BrowserSignals {
  canvas: CanvasSignal;
  webgl: WebGLSignal;
  screen: ScreenSignal;
  fonts: FontsSignal;
  audio: AudioSignal;
  system: SystemSignal;
  bot: BotSignal;
  storage: StorageSignal;
  collectedAt: number;
  elapsedMs: number;
}

export interface FingerprintResult {
  /** Canonical client-side calculated fingerprint ID (e.g. fp_3f8a91c...) */
  fingerprintId: string;
  /** Confidence score between 0 and 1 */
  confidence: number;
  /** Unique client persistent device seed */
  clientToken: string;
  /** Milliseconds taken to collect signals */
  elapsedMs: number;
  /** Raw signal data for backend validation */
  signals: BrowserSignals;
}

export interface VerifyOptions {
  email?: string;
  userId?: string;
  action?: 'signup' | 'login' | 'trial_start' | 'checkout' | 'quota_action' | string;
  metadata?: Record<string, any>;
}

export interface VerifyResponse {
  success: boolean;
  action: 'allow' | 'flag' | 'deny';
  riskScore: number; // 0 - 100
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasons: string[];
  fingerprintId: string;
  eventId: string;
  reviewRequired: boolean;
}
