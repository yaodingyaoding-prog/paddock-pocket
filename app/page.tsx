import App from './paddock-app';
import { snapshots, snapshotDate } from '../lib/snapshots';
export const dynamic = 'force-dynamic';
export default function HomePage(){ return <App seed={snapshots} seededAt={snapshotDate} initialNow={Date.now()}/>; }
