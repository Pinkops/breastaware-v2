/** Entitlement layer (§32–33): commerce stays behind this interface so the
 * payment provider can change (e.g., Gumroad activation codes) without touching
 * product code. Commerce data and health data are kept conceptually separate —
 * entitlement records carry no health information. */

export interface ActivationResult {
  ok: boolean;
  message: string;
}

export interface EntitlementProvider {
  readonly id: string;
  readonly label: string;
  /** Whether this copy currently has access. */
  check(): Promise<{ active: boolean; plan: string; activatedAt: string }>;
  /** Redeem a purchase. Providers never receive health data. */
  activate(code: string): Promise<ActivationResult>;
}

/** Default provider for the distributed one-time copy: access is granted with
 * the install. A future GumroadProvider implements the same interface:
 *   purchase → verified transaction → activation code → activate() → stored
 *   entitlement. No health information is transferred to the commerce system. */
export const localCopyProvider: EntitlementProvider = {
  id: 'local-copy',
  label: 'Local copy',
  async check() {
    return { active: true, plan: 'BreastAware one-time copy', activatedAt: new Date(0).toISOString() };
  },
  async activate() {
    return {
      ok: false,
      message: 'This copy is already active. Purchase activation arrives with the public release.',
    };
  },
};

let provider: EntitlementProvider = localCopyProvider;

export function setEntitlementProvider(next: EntitlementProvider): void {
  provider = next;
}

export function getEntitlementProvider(): EntitlementProvider {
  return provider;
}
