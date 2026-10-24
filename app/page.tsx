import App from './paddock-app';
import { snapshots, snapshotDate } from '../lib/snapshots';
export default function HomePage(){ return <App seed={snapshots} seededAt={snapshotDate}/>; }
