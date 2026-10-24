import {env} from 'cloudflare:workers';
import {androidDownload} from '../../../lib/android-download';
export const GET=(request:Request)=>androidDownload(request,(env as unknown as {ASSETS:{fetch(request:Request):Promise<Response>}}).ASSETS);
export const HEAD=GET;
