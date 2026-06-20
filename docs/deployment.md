# Deployment Guide

## Web

Deploy `apps/web` to Vercel or any Next.js host. Set public variables for Supabase, Mapbox, Firebase, and API URL.

## API

Deploy `apps/api` to Render, Railway, Fly.io, or a VPS. Keep Supabase service role, Firebase admin credentials, and weather provider keys private.

## Supabase

Create a Supabase project, run `supabase/schema.sql`, enable Auth providers, and add your production URL to redirect URLs.

## Firebase Push

Create a Firebase web app, generate a VAPID key, create a service account, and store the private credentials only in the backend environment.

## Production Checklist

- Enable Supabase RLS policies.
- Use HTTPS for web and API.
- Configure API rate limiting and provider caching.
- Rotate weather and notification provider keys.
- Monitor API error rates and notification delivery.
