# Zeeshu Weather Alert

Premium full-stack weather application with Next.js 15, Express, Supabase PostgreSQL/Auth, OpenWeatherMap, AQICN, Mapbox-ready maps, Firebase push notification hooks, Zustand, Recharts, Urdu/English support, dark/light modes and production-focused docs.

## Run in VS Code

If you opened the outer Desktop folder, run:

```bat
npm.cmd run install:app
npm.cmd run dev
```

If you opened this actual project folder, run:

```bat
npm.cmd install
npm.cmd run dev
```

Web: http://localhost:3000
API: http://localhost:4000/api/health

## Features

- Premium glassmorphism weather command dashboard
- Current weather with real API fetch and resilient fallback
- Hourly temperature and humidity chart
- 7-day forecast cards
- Radar, satellite, wind and temperature map layer shell
- Lightning tracking module
- AQI score, pollutants and health recommendation
- Severe alert center
- Community reports and admin operations panels
- Supabase database schema with RLS policies
- Firebase Cloud Messaging hooks
- PWA manifest and service worker file

## Important

Copy `.env.example` to `.env` and fill real provider keys before production deployment.
See `docs/deployment.md`, `docs/api.md` and `docs/production-checklist.md`.
