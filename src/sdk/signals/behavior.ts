import { BehaviorSignal } from '../types';

const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
const keyTimes: number[] = [];
const mousePositions: { x: number; y: number; t: number }[] = [];
let pasteDetected = false;
let interactionCount = 0;

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  window.addEventListener('keydown', () => {
    interactionCount++;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (keyTimes.length < 30) {
      keyTimes.push(now);
    }
  }, { passive: true });

  window.addEventListener('mousemove', (e) => {
    interactionCount++;
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (mousePositions.length < 30) {
      mousePositions.push({ x: e.clientX, y: e.clientY, t: now });
    }
  }, { passive: true });

  window.addEventListener('paste', () => {
    interactionCount++;
    pasteDetected = true;
  }, { passive: true });
}

/**
 * Calculates behavioral cadence, interaction timing, and human movement entropy.
 */
export function getBehaviorSignal(): BehaviorSignal {
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const timeOnPageMs = Math.round(now - startTime);

  // 1. Calculate keystroke variance (standard deviation in ms)
  let keystrokeVariance = 0;
  if (keyTimes.length >= 3) {
    const intervals: number[] = [];
    for (let i = 1; i < keyTimes.length; i++) {
      intervals.push(keyTimes[i] - keyTimes[i - 1]);
    }
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const squaredDiffs = intervals.map((v) => Math.pow(v - mean, 2));
    keystrokeVariance = Math.round(Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / intervals.length));
  }

  // 2. Calculate mouse movement entropy (curvature ratio)
  let mouseEntropy = 1.0;
  if (mousePositions.length >= 5) {
    let totalPath = 0;
    for (let i = 1; i < mousePositions.length; i++) {
      const dx = mousePositions[i].x - mousePositions[i - 1].x;
      const dy = mousePositions[i].y - mousePositions[i - 1].y;
      totalPath += Math.hypot(dx, dy);
    }
    const directDist = Math.hypot(
      mousePositions[mousePositions.length - 1].x - mousePositions[0].x,
      mousePositions[mousePositions.length - 1].y - mousePositions[0].y
    );
    // Humans exhibit natural curved trajectory: path > directDist
    mouseEntropy = directDist > 0 ? parseFloat(Math.min(1.0, (totalPath / (directDist * 1.5))).toFixed(2)) : 0.5;
  }

  // Automated cadence check:
  // Immediate submission (< 600ms) OR 0 mouse movements with >= 10 rapid key presses with zero variance
  const isAutomatedCadence =
    timeOnPageMs < 600 ||
    (interactionCount > 10 && mousePositions.length === 0 && keystrokeVariance < 8);

  return {
    timeOnPageMs,
    interactionCount,
    mouseMovementsCount: mousePositions.length,
    mouseEntropy,
    keystrokeVariance,
    pasteDetected,
    isAutomatedCadence,
  };
}
