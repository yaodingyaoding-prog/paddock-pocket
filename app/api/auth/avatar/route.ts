import { accountContext } from '../../../../lib/auth/context';
import { accountEnvironment } from '../../../../lib/auth/runtime';
export async function GET(request: Request) { return accountContext(request, accountEnvironment()).avatarController.get(); }
export async function POST(request: Request) { return accountContext(request, accountEnvironment()).avatarController.mutate(request); }
export async function DELETE(request: Request) { return accountContext(request, accountEnvironment()).avatarController.mutate(request); }
