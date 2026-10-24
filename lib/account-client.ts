export type AccountReply = { error?: string; code?: string; message?: string; next?: string };
export async function accountRequest(action: string, body: object, request: typeof fetch = fetch): Promise<AccountReply> {
  let response: Response;
  try {
    response = await request('/api/auth/' + action, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(18000) });
  } catch (error) {
    throw new Error(error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? '连接超时，请重试；无需修改密码。' : '网络连接中断，请检查网络后重试。');
  }
  let json: AccountReply;
  try {
    const value: unknown = await response.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid response');
    json = value as AccountReply;
  } catch {
    throw Object.assign(new Error(response.status === 403 ? '网络访问被拦截，请重新打开本站后重试。' : '账号服务响应异常，请稍后重试。'), { code: 'INVALID_RESPONSE' });
  }
  if (!response.ok) throw Object.assign(new Error(typeof json.error === 'string' ? json.error : '暂时无法完成操作，请重试。'), { code: json.code, retryAfter: Number(response.headers.get('Retry-After')) || 0 });
  return json;
}
