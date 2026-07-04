const axios = require('axios');

async function getWeather({ lat, lng }) {
  try {
    const { data } = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon: lng,
        appid: process.env.OPENWEATHER_API_KEY,
        units: 'metric',
      },
    });
    return {
      condition: data.weather?.[0]?.main || 'Unknown',
      description: data.weather?.[0]?.description || '',
      tempC: data.main?.temp ?? null,
    };
  } catch (err) {
    // Weather is a nice-to-have; never fail the whole route search over it.
    return { condition: 'Unavailable', description: 'Could not fetch weather', tempC: null };
  }
}

module.exports = { getWeather };
