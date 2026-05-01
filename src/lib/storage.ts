// Keys used in Web Storage — prefixed to avoid collisions with other apps
const KEYS = {
  TOKEN: 'ghw_token',
  TOKEN_EXP: 'ghw_token_exp',
  MEMBER_ID: 'ghw_member_id',
  MEMBER_NAME: 'ghw_member_name',
} as const;

// Token TTL: 8 hours (covers a full service shift)
const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

/**
 * localStorage with TTL — survives tab switches and PWA backgrounding on iOS.
 * The token expires automatically after 8 hours, mimicking session-like behavior
 * without relying on sessionStorage (which iOS clears when PWA is backgrounded).
 */
export const session = {
  setToken: (token: string): void => {
    localStorage.setItem(KEYS.TOKEN, token);
    localStorage.setItem(KEYS.TOKEN_EXP, String(Date.now() + TOKEN_TTL_MS));
  },
  getToken: (): string | null => {
    const token = localStorage.getItem(KEYS.TOKEN);
    const exp = localStorage.getItem(KEYS.TOKEN_EXP);
    if (!token || !exp) return null;
    if (Date.now() > Number(exp)) {
      // Expired — clean up and force re-login
      localStorage.removeItem(KEYS.TOKEN);
      localStorage.removeItem(KEYS.TOKEN_EXP);
      return null;
    }
    return token;
  },
  clear: (): void => {
    localStorage.removeItem(KEYS.TOKEN);
    localStorage.removeItem(KEYS.TOKEN_EXP);
  },
};

/**
 * localStorage — persists across reloads on the same device.
 * The member identity lives here so the dropdown pre-selects the last user after a refresh.
 */
export const local = {
  setMember: (id: number, name: string): void => {
    localStorage.setItem(KEYS.MEMBER_ID, String(id));
    localStorage.setItem(KEYS.MEMBER_NAME, name);
  },
  getMemberId: (): number | null => {
    const val = localStorage.getItem(KEYS.MEMBER_ID);
    return val ? Number(val) : null;
  },
  getMemberName: (): string | null => {
    return localStorage.getItem(KEYS.MEMBER_NAME);
  },
};
