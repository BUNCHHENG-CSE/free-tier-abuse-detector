import { WebGLSignal } from '../types';
import { hash64 } from '../hash';

/**
 * Extracts WebGL hardware acceleration attributes and renderer fingerprint.
 * Highly stable across sessions, hard to spoof without browser modification.
 */
export function getWebGLSignal(): WebGLSignal {
  try {
    if (typeof document === 'undefined') {
      return { supported: false };
    }

    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl =
        (canvas.getContext('webgl') as WebGLRenderingContext) ||
        (canvas.getContext('experimental-webgl') as WebGLRenderingContext);
    } catch {
      // Context creation blocked
    }

    if (!gl) {
      return { supported: false };
    }

    let unmaskedVendor: string | undefined;
    let unmaskedRenderer: string | undefined;

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      unmaskedVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || undefined;
      unmaskedRenderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || undefined;
    }

    const vendor = gl.getParameter(gl.VENDOR) || undefined;
    const renderer = gl.getParameter(gl.RENDERER) || undefined;
    const version = gl.getParameter(gl.VERSION) || undefined;
    const shadingLanguageVersion = gl.getParameter(gl.SHADING_LANGUAGE_VERSION) || undefined;

    // Supported extensions
    const extensions = gl.getSupportedExtensions() || [];
    const extensionsHash = hash64(extensions.sort().join(','));

    // Precision info
    let precisionHash: string | undefined;
    try {
      const vert = gl.getShaderPrecisionFormat(gl.VERTEX_SHADER, gl.HIGH_FLOAT);
      const frag = gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT);
      if (vert && frag) {
        precisionHash = hash64(`${vert.rangeMin},${vert.rangeMax},${vert.precision}|${frag.rangeMin},${frag.precision}`);
      }
    } catch {
      // Precision query not supported
    }

    return {
      supported: true,
      vendor,
      renderer,
      unmaskedVendor,
      unmaskedRenderer,
      version,
      shadingLanguageVersion,
      extensionsHash,
      precisionHash,
    };
  } catch {
    return { supported: false };
  }
}
