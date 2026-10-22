export type AuthEnvironment = Record<string, unknown>;
export type AuthConfig = {
  required: boolean;
  configured: boolean;
  baseUrl: string;
  supabaseUrl: string;
  publishableKey: string;
  sessionSecret: string;
  secure: boolean;
};

// All account configuration is server-only and resolved per request.
export function unifiedAuthConfig(env: AuthEnvironment): AuthConfig {
  const value = (key: string) => typeof env[key] === 'string' ? (env[key] as string).trim() : '';
  const baseUrl = value('AUTH_BASE_URL') || 'https://f1.xiaodinglab.com';
  const supabaseUrl = value('SUPABASE_URL');
  const publishableKey = value('SUPABASE_PUBLISHABLE_KEY');
  const sessionSecret = value('AUTH_SESSION_SECRET');
  const mode = value('AUTH_MODE');
  const validBase = /^https:\/\/[^\s/]+$/.test(baseUrl) || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(baseUrl);
  const validProvider = /^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(supabaseUrl);
  return {
    required: mode !== '' && mode !== 'off',
    configured: ['', 'off', 'required'].includes(mode) && validBase && validProvider && publishableKey.startsWith('sb_publishable_') && publishableKey.length > 20 && sessionSecret.length >= 32,
    baseUrl, supabaseUrl, publishableKey, sessionSecret, secure: baseUrl.startsWith('https:'),
  };
}
