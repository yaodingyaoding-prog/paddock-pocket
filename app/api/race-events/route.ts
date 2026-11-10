import {handleRaceEventsRequest} from '../../../lib/race-events-controller';
export function GET(request:Request){return handleRaceEventsRequest(request);}
