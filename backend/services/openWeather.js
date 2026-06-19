const fetch = global.fetch;

// Get actual weather parameters from Open-Meteo using lat/lng coordinates and travel dates
exports.getWeatherForecast = async (lat, lng, startDate, endDate) => {
  try {
    const start = new Date(startDate).toISOString().split('T')[0];
    const end = new Date(endDate).toISOString().split('T')[0];
    
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&start_date=${start}&end_date=${end}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,relative_humidity_2m_max,wind_speed_10m_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.daily) {
      throw new Error('No weather forecast data returned from Open-Meteo');
    }

    const tempsMax = data.daily.temperature_2m_max || [72];
    const tempsMin = data.daily.temperature_2m_min || [60];
    const precip = data.daily.precipitation_probability_max || [0];
    const humid = data.daily.relative_humidity_2m_max || [50];
    const wind = data.daily.wind_speed_10m_max || [10];

    const avgTempMax = tempsMax.reduce((s, v) => s + v, 0) / tempsMax.length;
    const avgTempMin = tempsMin.reduce((s, v) => s + v, 0) / tempsMin.length;
    const avgTemp = Math.round((avgTempMax + avgTempMin) / 2);
    const maxRainProb = Math.max(...precip);
    const avgHumidity = Math.round(humid.reduce((s, v) => s + v, 0) / humid.length);
    const maxWindSpeed = Math.round(Math.max(...wind));

    console.log(`[DEBUG] Open-Meteo weather loaded: avgTemp=${avgTemp}°F, maxRain=${maxRainProb}%, avgHumidity=${avgHumidity}%, maxWind=${maxWindSpeed}mph`);

    return {
      temperature: avgTemp,
      rainProbability: maxRainProb,
      humidity: avgHumidity,
      windSpeed: maxWindSpeed
    };
  } catch (err) {
    console.error('[ERROR] Open-Meteo query failed:', err);
    throw err;
  }
};
