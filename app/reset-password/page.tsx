import { publicAuthAvailability } from '../../lib/auth/config';
import { accountEnvironment } from '../../lib/auth/runtime';
import { AuthScreen } from '../auth-screen';
export default function ResetPasswordPage() { return <AuthScreen mode="reset" availability={publicAuthAvailability(accountEnvironment())}/>; }
