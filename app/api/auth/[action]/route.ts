import { accountContext } from '../../../../lib/auth/context';
import { accountEnvironment } from '../../../../lib/auth/runtime';

export async function POST(request: Request, context: { params: Promise<{ action: string }> }) {
  const { action } = await context.params;
  return accountContext(request, accountEnvironment()).controller.post(request, action);
}
