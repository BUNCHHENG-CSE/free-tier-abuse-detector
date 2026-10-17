import { BotSignal } from '../types';

/**
 * Detects automated browsers, headless environments, and bot tampering signals.
 */
export function getBotSignal(): BotSignal {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isWebdriver: false,
      isHeadless: false,
      hasAutomationFlags: false,
      phantomJs: false,
      selenium: false,
      puppeteer: false,
      pluginsLength: 0,
      mimeTypesLength: 0,
      hasChromeObject: false,
    };
  }

  const n = navigator as any;
  const w = window as any;
  const d = document as any;

  const isWebdriver = Boolean(n.webdriver);
  const selenium = Boolean(
    w._Selenium_IDE_Recorder ||
    d.__webdriver_evaluate ||
    d.__selenium_evaluate ||
    d.__webdriver_script_function
  );
  const phantomJs = Boolean(w.callPhantom || w._phantom);
  const puppeteer = Boolean(
    w.__nightmare ||
    w.__puppeteer_evaluation_script__ ||
    (w.chrome && !w.chrome.runtime)
  );

  const pluginsLength = n.plugins?.length || 0;
  const mimeTypesLength = n.mimeTypes?.length || 0;
  const isHeadless =
    /HeadlessChrome|Headless|PhantomJS/i.test(n.userAgent || '') ||
    (isWebdriver && pluginsLength === 0);

  return {
    isWebdriver,
    isHeadless,
    hasAutomationFlags: isWebdriver || isHeadless || selenium || phantomJs || puppeteer,
    phantomJs,
    selenium,
    puppeteer,
    pluginsLength,
    mimeTypesLength,
    hasChromeObject: Boolean(w.chrome),
  };
}
