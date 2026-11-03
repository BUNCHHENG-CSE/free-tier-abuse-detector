import { CanvasSignal } from '../types';
import { hash64 } from '../hash';

/**
 * Extracts 2D canvas fingerprint signals and detects anti-fingerprinting
 * farbling/spoofing noise injected by Brave Shields or Canvas Blocker extensions.
 */
export function getCanvasSignal(): CanvasSignal {
  try {
    if (typeof document === 'undefined') {
      return { supported: false, hash: 'unsupported', isCanvasFarblingDetected: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      return { supported: false, hash: 'no_context', isCanvasFarblingDetected: false };
    }

    // Canvas winding rule test
    ctx.rect(0, 0, 10, 10);
    ctx.rect(2, 2, 6, 6);
    const winding = ctx.isPointInPath(5, 5, 'evenodd');

    // Reset and draw complex scene
    ctx.clearRect(0, 0, 240, 60);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 240, 0);
    grad.addColorStop(0, '#f26522');
    grad.addColorStop(0.5, '#f7941e');
    grad.addColorStop(1, '#ed1c24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 240, 60);

    // Layer 1: Semi-transparent shapes and arcs
    ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(40, 30, 20, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 0, 255, 0.5)';
    ctx.fillRect(80, 10, 45, 40);

    // Layer 2: Text with shadows, emojis, and subpixel blending
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#069';
    ctx.font = '14px "Arial", "Helvetica Neue", sans-serif';
    ctx.fillText('AbuseShield🛡️ 123.45', 15, 25);

    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.font = '16px "Times New Roman", "Georgia", serif';
    ctx.fillText('Anti-Fraud SDK 🔍', 20, 48);

    // Layer 3: Shadow blur test
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.shadowBlur = 4;
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.fillStyle = '#ffffff';
    ctx.font = '11px sans-serif';
    ctx.fillText('~#@!%^&*()', 150, 20);

    // Dual-Pass Read: Detects Brave Farbling and anti-fingerprint noise injection
    const dataUrl1 = canvas.toDataURL();
    const dataUrl2 = canvas.toDataURL();
    const isCanvasFarblingDetected = dataUrl1 !== dataUrl2;

    const hash = hash64(dataUrl1);

    return {
      supported: true,
      hash,
      winding,
      textHash: hash64(dataUrl1.slice(0, 100)),
      isCanvasFarblingDetected,
    };
  } catch {
    return {
      supported: false,
      hash: 'blocked_or_error',
      isCanvasFarblingDetected: false,
    };
  }
}
