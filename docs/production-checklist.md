# Production Readiness Checklist

## Required before launch

- Add real keys to `.env`: Supabase, OpenWeatherMap, AQICN, Mapbox and Firebase.
- Run `supabase/schema.sql` in Supabase SQL editor.
- Enable Supabase Auth providers and production redirect URLs.
- Deploy API with private provider keys only on the server.
- Deploy web with public Supabase, Firebase and Mapbox values only.
- Enable HTTPS, API rate limiting, monitoring and provider usage alerts.

## App quality

- Dashboard uses resilient provider fallback so UI stays usable if keys are missing.
- TypeScript checks must pass with `npm.cmd run typecheck`.
- Production build must pass with `npm.cmd run build`.
- Push notifications require Firebase service account on API and VAPID key on web.

## Recommended next phase

- Replace radar visual shell with Mapbox GL or Leaflet tile layer controls.
- Add authenticated saved locations and community post creation forms.
- Add admin role checking from Supabase profile rows.
- Add Redis/provider cache in the API for high-traffic cities.
