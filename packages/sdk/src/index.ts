import {
  AbuseShieldConfig,
  BrowserSignals,
  FingerprintResult,
  VerifyOptions,
  VerifyResponse,
} from './types';
import { generateFingerprintId, murmurHash3 } from './hash';
import { getCanvasSignal } from './signals/canvas';
import { getWebGLSignal } from './signals/webgl';
import { getScreenSignal } from './signals/screen';
import { getFontsSignal } from './signals/fonts';
import { getAudioSignal } from './signals/audio';
import { getSystemSignal } from './signals/system';
import { getBotSignal } from './signals/bot';
import { getStorageSignal } from './signals/storage';

export * from './types';
export * from './hash';

class AbuseShieldClient {
  private config: AbuseShieldConfig;
  private cachedResult: FingerprintResult | null = null;
  private pendingPromise: Promise<FingerprintResult> | null = null;

  constructor(config: AbuseShieldConfig = { apiKey: 'anon' }) {
    this.config = {
      endpoint: 'http://localhost:4000/api/v1',
      autoAttachForms: true,
      debug: false,
      timeoutMs: 1500,
      ...config,
    };

    if (this.config.debug) {
      console.log('[AbuseShield] Initialized with config:', this.config);
    }

    if (typeof window !== 'undefined' && this.config.autoAttachForms) {
      this.setupFormAutoAttach();
    }
  }

  /**
   * Updates configuration at runtime.
   */
  public configure(config: Partial<AbuseShieldConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Collects all browser hardware & behavioral signals and derives a deterministic fingerprint.
   */
  public async getFingerprint(): Promise<FingerprintResult> {
    if (this.cachedResult) {
      return this.cachedResult;
    }

    if (this.pendingPromise) {
      return this.pendingPromise;
    }

    this.pendingPromise = this.collectSignals();
    try {
      this.cachedResult = await this.pendingPromise;
      return this.cachedResult;
    } finally {
      this.pendingPromise = null;
    }
  }

  private async collectSignals(): Promise<FingerprintResult> {
    const startTime = (typeof performance !== 'undefined' && performance.now)
      ? performance.now()
      : Date.now();

    // Collect synchronous signals immediately
    const canvas = getCanvasSignal();
    const webgl = getWebGLSignal();
    const screen = getScreenSignal();
    const fonts = getFontsSignal();
    const system = getSystemSignal();
    const bot = getBotSignal();
    const storage = getStorageSignal();

    // Audio signal is asynchronous with fallback
    let audio = { supported: false };
    try {
      const audioPromise = getAudioSignal();
      const timeout = new Promise<{ supported: boolean }>((res) =>
        setTimeout(() => res({ supported: true }), this.config.timeoutMs || 800)
      );
      audio = await Promise.race([audioPromise, timeout]);
    } catch {
      // Audio fallback
    }

    const elapsedMs = Math.round(
      ((typeof performance !== 'undefined' && performance.now)
        ? performance.now()
        : Date.now()) - startTime
    );

    const signals: BrowserSignals = {
      canvas,
      webgl,
      screen,
      fonts,
      audio,
      system,
      bot,
      storage,
      collectedAt: Date.now(),
      elapsedMs,
    };

    // Construct deterministic composite string from the most stable hardware signals:
    // Canvas hash + WebGL vendor & renderer + Screen resolution & pixel ratio + Font hash + Timezone + Concurrency
    const compositeParts = [
      canvas.hash,
      webgl.unmaskedRenderer || webgl.renderer || 'no_gpu',
      webgl.unmaskedVendor || webgl.vendor || 'no_vendor',
      webgl.precisionHash || 'no_prec',
      `${screen.width}x${screen.height}x${screen.colorDepth}@${screen.devicePixelRatio}`,
      fonts.hash,
      system.timezone,
      system.platform,
      system.hardwareConcurrency,
      audio.hash || 'no_audio',
    ];

    const compositeString = compositeParts.join('|||');
    const fingerprintId = generateFingerprintId(compositeString);

    // Calculate signal confidence score (0 to 1)
    let scoreWeight = 0;
    if (canvas.supported && canvas.hash !== 'blocked_or_error') scoreWeight += 25;
    if (webgl.supported && webgl.unmaskedRenderer) scoreWeight += 30;
    if (screen.width > 0) scoreWeight += 15;
    if (fonts.count > 0) scoreWeight += 15;
    if (audio.supported && audio.hash) scoreWeight += 15;
    const confidence = Math.min(1.0, parseFloat((scoreWeight / 100).toFixed(2)));

    const result: FingerprintResult = {
      fingerprintId,
      confidence,
      clientToken: storage.persistedToken,
      elapsedMs,
      signals,
    };

    if (this.config.debug) {
      console.log(`[AbuseShield] Generated Fingerprint: ${fingerprintId} in ${elapsedMs}ms (confidence: ${confidence})`, result);
    }

    return result;
  }

  /**
   * Verifies an action (such as registration or quota attempt) with the AbuseShield backend.
   */
  public async verify(options: VerifyOptions = {}): Promise<VerifyResponse> {
    const fp = await this.getFingerprint();

    const payload = {
      apiKey: this.config.apiKey,
      action: options.action || 'signup',
      email: options.email,
      userId: options.userId,
      clientFingerprintId: fp.fingerprintId,
      clientToken: fp.clientToken,
      confidence: fp.confidence,
      signals: fp.signals,
      metadata: options.metadata || {},
      timestamp: Date.now(),
    };

    const endpoint = (this.config.endpoint || '/api/v1').replace(/\/+$/, '') + '/verify';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AbuseShield-Key': this.config.apiKey,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`AbuseShield server responded with HTTP ${response.status}`);
      }

      const data: VerifyResponse = await response.json();
      if (this.config.debug) {
        console.log('[AbuseShield] Verify response:', data);
      }
      return data;
    } catch (err) {
      if (this.config.debug) {
        console.error('[AbuseShield] Verify failed:', err);
      }

      // Safe fallback on network failure: do not hard-block legitimate users
      return {
        success: false,
        action: 'allow',
        riskScore: 0,
        riskLevel: 'LOW',
        reasons: ['VERIFY_NETWORK_FALLBACK'],
        fingerprintId: fp.fingerprintId,
        eventId: `ev_local_${Date.now()}`,
        reviewRequired: false,
      };
    }
  }

  /**
   * Attaches hidden fingerprint fields to a form on submit.
   */
  public attachForm(formOrSelector: string | HTMLFormElement): void {
    if (typeof document === 'undefined') return;

    const form =
      typeof formOrSelector === 'string'
        ? (document.querySelector(formOrSelector) as HTMLFormElement)
        : formOrSelector;

    if (!form) return;

    form.addEventListener('submit', async (e) => {
      // Don't duplicate if already injected
      let fpInput = form.querySelector('input[name="as_fingerprint_id"]') as HTMLInputElement;
      let tokenInput = form.querySelector('input[name="as_client_token"]') as HTMLInputElement;

      if (!fpInput) {
        fpInput = document.createElement('input');
        fpInput.type = 'hidden';
        fpInput.name = 'as_fingerprint_id';
        form.appendChild(fpInput);
      }

      if (!tokenInput) {
        tokenInput = document.createElement('input');
        tokenInput.type = 'hidden';
        tokenInput.name = 'as_client_token';
        form.appendChild(tokenInput);
      }

      try {
        const fp = await this.getFingerprint();
        fpInput.value = fp.fingerprintId;
        tokenInput.value = fp.clientToken;
      } catch {
        // Continue form submit
      }
    });
  }

  private setupFormAutoAttach(): void {
    if (typeof document === 'undefined') return;

    const attach = () => {
      const selector =
        typeof this.config.autoAttachForms === 'string'
          ? this.config.autoAttachForms
          : 'form[data-abuseshield], form[action*="signup"], form[action*="register"], form.signup-form, form.register-form';

      const forms = document.querySelectorAll(selector);
      forms.forEach((form) => this.attachForm(form as HTMLFormElement));
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attach);
    } else {
      attach();
    }
  }
}

// Global Singleton factory
let defaultInstance: AbuseShieldClient | null = null;

export const AbuseShield = {
  init(config?: AbuseShieldConfig): AbuseShieldClient {
    defaultInstance = new AbuseShieldClient(config);
    return defaultInstance;
  },
  get instance(): AbuseShieldClient {
    if (!defaultInstance) {
      defaultInstance = new AbuseShieldClient();
    }
    return defaultInstance;
  },
  async getFingerprint(): Promise<FingerprintResult> {
    return AbuseShield.instance.getFingerprint();
  },
  async verify(options?: VerifyOptions): Promise<VerifyResponse> {
    return AbuseShield.instance.verify(options);
  },
  attachForm(form: string | HTMLFormElement): void {
    AbuseShield.instance.attachForm(form);
  },
};

// Check if running in browser and has data-attributes on script tag
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  (window as any).AbuseShield = AbuseShield;

  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript) {
    const apiKey = currentScript.getAttribute('data-api-key') || 'anon';
    const endpoint = currentScript.getAttribute('data-endpoint') || undefined;
    const autoAttach = currentScript.getAttribute('data-auto-attach') !== 'false';
    const debug = currentScript.getAttribute('data-debug') === 'true';

    AbuseShield.init({ apiKey, endpoint, autoAttachForms: autoAttach, debug });
  }
}

export default AbuseShield;
