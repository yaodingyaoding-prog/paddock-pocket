import { publicAuthAvailability } from '../../lib/auth/config';
import { accountEnvironment } from '../../lib/auth/runtime';
import { AuthScreen } from '../auth-screen';
export default function LoginPage() { return <AuthScreen mode="login" availability={publicAuthAvailability(accountEnvironment())}/>; }
