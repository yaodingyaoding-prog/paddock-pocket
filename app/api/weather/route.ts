import { OpenMeteoRepository, SharedWeatherCache, WeatherController, WeatherService } from '../../../lib/weather-service';
const controller = new WeatherController(new WeatherService(new OpenMeteoRepository(), new SharedWeatherCache()));
export function GET(request: Request) { return controller.get(request); }
