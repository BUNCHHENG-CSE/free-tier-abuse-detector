/**
 * Standalone browser entry point for <script src="abuse-shield.min.js"> / <script src="tct-shield.min.js">
 */
import { AbuseShield, TCTShield } from './index';

if (typeof window !== 'undefined') {
  (window as any).AbuseShield = AbuseShield;
  (window as any).TCTShield = TCTShield;
}

export { AbuseShield, TCTShield };
export default TCTShield;
