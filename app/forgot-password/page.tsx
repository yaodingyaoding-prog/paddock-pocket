import { publicAuthAvailability } from '../../lib/auth/config';
import { accountEnvironment } from '../../lib/auth/runtime';
import { AuthScreen } from '../auth-screen';
export default function ForgotPasswordPage() { return <AuthScreen mode="forgot" availability={publicAuthAvailability(accountEnvironment())}/>; }
