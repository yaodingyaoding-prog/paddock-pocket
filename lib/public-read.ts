type ReadOptions = { signal?: AbortSignal; timeoutMs?: number; request?: typeof fetch; pause?: (ms: number) => Promise<void> };
const transientStatus = new Set([408, 425, 500, 502, 503, 504]);
// Public GETs only. Authentication mutations deliberately do not use this helper.
export async function readPublicJson<T>(url: string, options: ReadOptions = {}): Promise<T> {
  const request = options.request || fetch;
  const pause = options.pause || (ms => new Promise(resolve => setTimeout(resolve, ms)));
  for (let attempt = 0; attempt < 2; attempt++) {
    if (options.signal?.aborted) throw new DOMException('Request cancelled', 'AbortError');
    const timeout = AbortSignal.timeout(options.timeoutMs || 6000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
    let response: Response;
    try { response = await request(url, {method: 'GET', signal}); }
    catch (error) {
      if (options.signal?.aborted || attempt || !(error instanceof TypeError || error instanceof Error && ['AbortError','TimeoutError'].includes(error.name))) throw error;
      await pause(250); continue;
    }
    if (!response.ok) {
      if (!attempt && transientStatus.has(response.status)) { await response.body?.cancel(); await pause(250); continue; }
      throw new Error('数据暂不可用，请稍后重试。');
    }
    try { return await response.json() as T; }
    catch (error) {
      if (options.signal?.aborted || attempt || !(error instanceof TypeError || error instanceof Error && ['AbortError','TimeoutError'].includes(error.name))) throw error;
      await pause(250);
    }
  }
  throw new Error('网络暂时无法连接，请稍后重试。');
}
