// The application uses hash navigation. Never send users to an arbitrary origin.
import { driverRouteHash, parseDriverRoute } from '../driver-route';
export function safeReturnPath(value: unknown) {
  if (typeof value === 'string' && value.startsWith('/#')) {
    const driver = parseDriverRoute(value.slice(1));
    if (driver) return '/' + (driver.driverSeason ? driverRouteHash(driver.driverId, driver.driverSeason, driver.driverFrom) : '#rankings/driver/' + driver.driverId);
  }
  return typeof value === 'string' && /^\/#(schedule|rankings|widgets|discover|profile)(\/[a-z]+)?$/.test(value) ? value : '/#schedule';
}
