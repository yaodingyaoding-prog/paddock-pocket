import { accountContext } from '../../../../lib/auth/context';
import { accountEnvironment } from '../../../../lib/auth/runtime';

export function GET(request: Request) { return accountContext(request, accountEnvironment()).controller.session(); }
