import { DriverController } from '../../../../lib/drivers/DriverController';
import { DriverService } from '../../../../lib/drivers/driverService';
import { PublicDriverRepository } from '../../../../lib/drivers/DriverRepository';
const controller = new DriverController(new DriverService(new PublicDriverRepository()));
export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) { return controller.get((await context.params).id); }
