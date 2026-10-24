import { publicAuthAvailability } from '../../../lib/auth/config';
import { accountEnvironment } from '../../../lib/auth/runtime';
import { AuthScreen } from '../../auth-screen';
export default function ConfirmEmailPage() { return <AuthScreen mode="confirm" availability={publicAuthAvailability(accountEnvironment())}/>; }
