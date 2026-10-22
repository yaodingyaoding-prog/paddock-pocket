import { z } from 'zod';
export { safeReturnPath } from './paths';

export const passwordSchema = z.string().min(6, '密码至少需要 6 个字符。').max(128, '密码不能超过 128 个字符。');
const email = z.string().trim().max(254).email('请填写有效的邮箱地址。').transform(value => value.toLowerCase());
export const actionSchemas = {
  login: z.object({ email, password: z.string().min(1, '请输入密码。').max(128), remember: z.boolean().default(true), next: z.string().max(500).optional() }).strict(),
  register: z.object({ email, password: passwordSchema, name: z.string().trim().min(1, '请输入昵称。').max(30, '昵称不能超过 30 个字符。'), next: z.string().max(500).optional() }).strict(),
  resend: z.object({ email }).strict(),
  forgot: z.object({ email }).strict(),
  verify: z.object({ tokenHash: z.string().regex(/^[a-zA-Z0-9_-]{20,256}$/, '验证链接无效，请重新发送。'), type: z.enum(['signup', 'recovery']) }).strict(),
  reset: z.object({ password: passwordSchema }).strict(),
  logout: z.object({}).strict(),
};
