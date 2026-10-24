import { publicAuthAvailability } from '../../lib/auth/config';
import { accountEnvironment } from '../../lib/auth/runtime';
import { AuthScreen } from '../auth-screen';
export default function RegisterPage() { return <AuthScreen mode="register" availability={publicAuthAvailability(accountEnvironment())}/>; }
