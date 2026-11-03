import { AudioSignal } from '../types';
import { hash64 } from '../hash';

/**
 * WebAudio hardware signal extraction using OfflineAudioContext dynamics compressor.
 */
export async function getAudioSignal(): Promise<AudioSignal> {
  try {
    const AudioContextClass =
      (typeof window !== 'undefined' &&
        (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)) ||
      null;

    if (!AudioContextClass) {
      return { supported: false };
    }

    const context = new AudioContextClass(1, 44100, 44100);

    // Create oscillator
    const oscillator = context.createOscillator();
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(10000, context.currentTime);

    // Create dynamics compressor
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, context.currentTime);
    compressor.knee.setValueAtTime(40, context.currentTime);
    compressor.ratio.setValueAtTime(12, context.currentTime);
    compressor.attack.setValueAtTime(0, context.currentTime);
    compressor.release.setValueAtTime(0.25, context.currentTime);

    oscillator.connect(compressor);
    compressor.connect(context.destination);

    oscillator.start(0);

    const renderedBuffer = await Promise.race([
      context.startRendering(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), 350)),
    ]);

    if (!renderedBuffer) {
      return { supported: true, hash: 'timeout' };
    }

    const channelData = renderedBuffer.getChannelData(0);
    let sum = 0;
    // Sample 500 points to keep computation minimal
    const step = Math.floor(channelData.length / 500);
    for (let i = 0; i < channelData.length; i += step) {
      sum += Math.abs(channelData[i]);
    }

    return {
      supported: true,
      hash: hash64(sum.toFixed(6)),
      dynamicsCompressorValue: sum,
    };
  } catch {
    return { supported: false };
  }
}
