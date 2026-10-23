import { accountContext } from '../../../../lib/auth/context';
import { accountEnvironment } from '../../../../lib/auth/runtime';
export async function GET(request: Request) { return accountContext(request, accountEnvironment()).preferencesController.get(); }
export async function PATCH(request: Request) { return accountContext(request, accountEnvironment()).preferencesController.patch(request); }
