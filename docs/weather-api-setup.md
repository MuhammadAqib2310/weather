# Step 2: Weather API Setup

The backend now supports live OpenWeatherMap current weather plus 5-day forecast conversion into dashboard-friendly hourly and daily data.

## Required key

Add this to `.env` in the project root:

```env
OPENWEATHER_API_KEY="your_openweathermap_key"
```

Optional AQI key:

```env
AQICN_TOKEN="your_aqicn_token"
```

## Local test

Start the app:

```bat
npm.cmd run dev
```

Test endpoints:

```text
http://localhost:4000/api/weather/current?city=Lahore
http://localhost:4000/api/weather/aqi?lat=31.5204&lon=74.3587
http://localhost:4000/api/weather/providers
```

## Behavior

- If `OPENWEATHER_API_KEY` is present, the API fetches live current weather and forecast.
- If the key is missing or a provider fails, the dashboard uses a polished fallback response.
- Weather and AQI responses are cached for 5 minutes to reduce provider usage.
