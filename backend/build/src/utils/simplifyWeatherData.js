"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.simplifyIWeatherData = void 0;
// Helper function to convert Unix timestamp to readable date
const unixToReadable = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
};
const simplifyIWeatherData = (data) => {
    // Simplified data structure
    const simplified = {
        timezone: data.timezone,
        timezone_offset: data.timezone_offset,
        current_weather: {
            datetime: unixToReadable(data.current.dt),
            temperature: data.current.temp,
            feels_like: data.current.feels_like,
            humidity: data.current.humidity,
            pressure: data.current.pressure,
            wind_speed: data.current.wind_speed,
            wind_direction: data.current.wind_deg,
            wind_gust: data.current.wind_gust,
            cloud_coverage: data.current.clouds,
            visibility: data.current.visibility,
            uv_index: data.current.uvi,
            sunrise: unixToReadable(data.current.sunrise),
            sunset: unixToReadable(data.current.sunset),
            weather_condition: data.current.weather[0].main,
            weather_description: data.current.weather[0].description,
            weather_icon: data.current.weather[0].icon,
        },
        daily_forecast: [],
        hourly_forecast: [],
    };
    // Process daily forecast
    data.daily.forEach((day) => {
        const dailyEntry = {
            datetime: unixToReadable(day.dt),
            sunrise: unixToReadable(day.sunrise),
            sunset: unixToReadable(day.sunset),
            moonrise: unixToReadable(day.moonrise),
            moonset: day.moonset !== 0 ? unixToReadable(day.moonset) : 'N/A',
            moon_phase: day.moon_phase,
            temperature: {
                day: day.temp.day,
                morning: day.temp.morn,
                evening: day.temp.eve,
                night: day.temp.night,
                maximum: day.temp.max,
                minimum: day.temp.min,
            },
            feels_like: {
                day: day.feels_like.day,
                morning: day.feels_like.morn,
                evening: day.feels_like.eve,
                night: day.feels_like.night,
            },
            humidity: day.humidity,
            pressure: day.pressure,
            wind_speed: day.wind_speed,
            wind_direction: day.wind_deg,
            wind_gust: day.wind_gust,
            cloud_coverage: day.clouds,
            probability_of_precipitation: day.pop,
            rain_volume: day.rain || 0,
            uv_index: day.uvi,
            dew_point: day.dew_point,
            weather_condition: day.weather[0].main,
            weather_description: day.weather[0].description,
            weather_icon: day.weather[0].icon,
            summary: day.summary,
        };
        simplified.daily_forecast.push(dailyEntry);
    });
    // Process hourly forecast
    data.hourly.forEach((hour) => {
        const hourlyEntry = {
            datetime: unixToReadable(hour.dt),
            temperature: hour.temp,
            feels_like: hour.feels_like,
            humidity: hour.humidity,
            pressure: hour.pressure,
            wind_speed: hour.wind_speed,
            wind_direction: hour.wind_deg,
            wind_gust: hour.wind_gust,
            cloud_coverage: hour.clouds,
            probability_of_precipitation: hour.pop,
            rain_volume: hour.rain ? hour.rain['1h'] || 0 : 0,
            uv_index: hour.uvi,
            dew_point: hour.dew_point,
            visibility: hour.visibility,
            weather_condition: hour.weather[0].main,
            weather_description: hour.weather[0].description,
            weather_icon: hour.weather[0].icon,
        };
        simplified.hourly_forecast.push(hourlyEntry);
    });
    return simplified;
};
exports.simplifyIWeatherData = simplifyIWeatherData;
