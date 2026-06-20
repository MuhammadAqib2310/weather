# API Reference

Base URL: `/api`

- `GET /health`: service status
- `GET /weather/current?city=Lahore`: current weather and forecast fallback/provider payload
- `GET /weather/aqi?lat=31.5204&lon=74.3587`: air quality score and pollutants
- `GET /weather/map-layers`: radar, satellite, cloud, temperature, and wind layer identifiers
- `GET /locations/search?q=Karachi`: Mapbox geocoding with fallback
- `GET /alerts`: severe weather alerts
- `POST /alerts/notify`: Firebase push notification trigger
- `GET /community/posts`: published community reports
- `POST /community/posts`: create a user weather report
- `GET /admin/analytics`: admin metrics for users, alerts, posts, and notification delivery
