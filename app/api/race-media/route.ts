import { RaceMediaController } from '../../../lib/race-media-controller';
import { RaceMediaService, RaceMediaRepository } from '../../../lib/race-media-service';
const controller = new RaceMediaController(new RaceMediaService(new RaceMediaRepository()));
export async function GET(request: Request) { return controller.get(request); }
