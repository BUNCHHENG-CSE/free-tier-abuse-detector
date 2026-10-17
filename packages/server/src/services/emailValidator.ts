/**
 * Email Normalization and Disposable Email Detection Service
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamail.biz',
  'sharklasers.com',
  'grr.la',
  'tempmail.com',
  'temp-mail.org',
  '10minutemail.com',
  '10minutemail.net',
  'throwawaymail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
  'trashmail.com',
  'trashmail.net',
  'dispostable.com',
  'fakeinbox.com',
  'fakemailgenerator.com',
  'mohmal.com',
  'crazymailing.com',
  'mytemp.email',
  'generator.email',
  'burnermail.io',
  'inboxbear.com',
  'tempail.com',
  'tempm.com',
  'chacuo.net',
  'dropmail.me',
  'maildrop.cc',
  'getairmail.com',
  'getnada.com',
  'abakus.my',
  'boximail.com',
  'crazymailing.com',
  'dayrep.com',
  'einrot.com',
  'fleckens.com',
  'gustr.com',
  'jourrapide.com',
  'rhyta.com',
  'superrito.com',
  'teleworm.us',
  'armyspy.com',
  'cuvox.de',
  'bouncr.com',
  'emailfake.com',
  'generator.email',
  'tempmailaddress.com',
  'crazymailing.com',
  'throwawayemailaddresses.com',
  'trashmail.io',
  '10mail.org',
  'emailondeck.com',
  'clipmail.eu',
  'mailcatch.com',
  'spambox.us',
  'tempinbox.com',
  'mailnesia.com',
  'guerrillamailblock.com',
]);

const DISPOSABLE_REGEX = /(temp[-_]?mail|throwaway|disposable|fake[-_]?mail|mailinator|guerrilla|10minute|yopmail|trashmail|generator[-_]?email)/i;

export interface EmailAnalysis {
  isValid: boolean;
  raw: string;
  normalized: string;
  domain: string;
  localPart: string;
  isDisposable: boolean;
  hasSubaddressing: boolean;
  isSuspiciousPattern: boolean;
}

export function analyzeEmail(email: string = ''): EmailAnalysis {
  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.lastIndexOf('@');

  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return {
      isValid: false,
      raw: email,
      normalized: trimmed,
      domain: '',
      localPart: '',
      isDisposable: false,
      hasSubaddressing: false,
      isSuspiciousPattern: false,
    };
  }

  let localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  // Check subaddressing (e.g., user+alias@gmail.com)
  const plusIndex = localPart.indexOf('+');
  const hasSubaddressing = plusIndex !== -1;
  if (hasSubaddressing) {
    localPart = localPart.slice(0, plusIndex);
  }

  // Remove dots for Google/Gmail addresses (dots are ignored by Google)
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    localPart = localPart.replace(/\./g, '');
  }

  const normalized = `${localPart}@${domain}`;

  // Check disposable domains list or regex
  const isDisposable = DISPOSABLE_DOMAINS.has(domain) || DISPOSABLE_REGEX.test(domain);

  // Check suspicious random-looking hex or repetitive patterns (e.g. a8f9c1b2d3@..., test99999@...)
  const isSuspiciousPattern =
    /^[a-f0-9]{12,}$/i.test(localPart) ||
    /^(test|demo|temp|fake|user)\d{4,}$/i.test(localPart);

  return {
    isValid: true,
    raw: email,
    normalized,
    domain,
    localPart,
    isDisposable,
    hasSubaddressing,
    isSuspiciousPattern,
  };
}
