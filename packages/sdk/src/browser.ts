/**
 * Standalone browser entry point for <script src="abuse-shield.min.js">
 */
import { AbuseShield } from './index';

if (typeof window !== 'undefined') {
  (window as any).AbuseShield = AbuseShield;
}

export default AbuseShield;
