import { env } from 'cloudflare:workers';
import type { AuthEnvironment } from './config';

export function accountEnvironment(): AuthEnvironment { return env as unknown as AuthEnvironment; }
