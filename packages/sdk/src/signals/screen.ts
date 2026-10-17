import { ScreenSignal } from '../types';

/**
 * Collects physical display and viewport characteristics.
 */
export function getScreenSignal(): ScreenSignal {
  if (typeof window === 'undefined' || typeof screen === 'undefined') {
    return {
      width: 0,
      height: 0,
      availWidth: 0,
      availHeight: 0,
      colorDepth: 0,
      pixelDepth: 0,
      devicePixelRatio: 1,
      touchSupport: {
        maxTouchPoints: 0,
        touchEvent: false,
        touchStart: false,
      },
    };
  }

  const nav = typeof navigator !== 'undefined' ? navigator : null;
  const maxTouchPoints = nav && 'maxTouchPoints' in nav ? nav.maxTouchPoints : 0;
  const touchEvent = 'ontouchstart' in window;
  const touchStart = Boolean(window.TouchEvent);

  return {
    width: screen.width || 0,
    height: screen.height || 0,
    availWidth: screen.availWidth || 0,
    availHeight: screen.availHeight || 0,
    colorDepth: screen.colorDepth || 0,
    pixelDepth: screen.pixelDepth || 0,
    devicePixelRatio: window.devicePixelRatio || 1,
    touchSupport: {
      maxTouchPoints,
      touchEvent,
      touchStart,
    },
    orientation: screen.orientation ? screen.orientation.type : undefined,
  };
}
