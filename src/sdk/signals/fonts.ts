import { FontsSignal } from '../types';
import { hash64 } from '../hash';

const TEST_FONTS = [
  'Segoe UI',
  'Calibri',
  'Consolas',
  'Franklin Gothic Medium',
  'SF Pro Text',
  'Helvetica Neue',
  'Menlo',
  'Optima',
  'Gill Sans',
  'Ubuntu',
  'Roboto',
  'DejaVu Sans',
  'Impact',
  'Georgia',
  'Courier New',
  'Comic Sans MS',
  'Palatino Linotype',
  'PingFang SC',
];

const TEST_STRING = 'mmmmmmmmmmlliWWWW12345';
const BASE_FONTS = ['monospace', 'sans-serif', 'serif'];

/**
 * Fast OS font detection via DOM glyph width measurement.
 * Compares font dimensions against base fallback fonts.
 */
export function getFontsSignal(): FontsSignal {
  if (typeof document === 'undefined' || !document.body) {
    return { installed: [], count: 0, hash: 'unsupported' };
  }

  try {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.visibility = 'hidden';
    container.style.fontSize = '72px';
    container.style.fontStyle = 'normal';
    container.style.fontWeight = 'normal';
    container.style.letterSpacing = 'normal';
    container.style.lineHeight = 'normal';
    container.style.whiteSpace = 'nowrap';

    // Measure base fonts
    const baseWidths: Record<string, number> = {};
    const baseHeights: Record<string, number> = {};

    const spans: HTMLSpanElement[] = [];

    BASE_FONTS.forEach((base) => {
      const s = document.createElement('span');
      s.style.fontFamily = base;
      s.textContent = TEST_STRING;
      container.appendChild(s);
      spans.push(s);
    });

    document.body.appendChild(container);

    BASE_FONTS.forEach((base, idx) => {
      baseWidths[base] = spans[idx].offsetWidth;
      baseHeights[base] = spans[idx].offsetHeight;
    });

    // Now test fonts
    const installed: string[] = [];

    TEST_FONTS.forEach((font) => {
      let isPresent = false;
      for (const base of BASE_FONTS) {
        spans[0].style.fontFamily = `"${font}", ${base}`;
        const w = spans[0].offsetWidth;
        const h = spans[0].offsetHeight;
        if (w !== baseWidths[base] || h !== baseHeights[base]) {
          isPresent = true;
          break;
        }
      }
      if (isPresent) {
        installed.push(font);
      }
    });

    document.body.removeChild(container);

    return {
      installed,
      count: installed.length,
      hash: hash64(installed.sort().join('|')),
    };
  } catch {
    return { installed: [], count: 0, hash: 'error' };
  }
}
