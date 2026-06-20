create extension if not exists "uuid-ossp";

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'admin', 'moderator')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.locations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  country text,
  latitude numeric(9,6) not null,
  longitude numeric(9,6) not null,
  timezone text,
  is_current boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, location_id)
);

create table if not exists public.weather_data (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade,
  provider text not null default 'openweathermap',
  observed_at timestamptz not null,
  condition text,
  temperature numeric(5,2),
  feels_like numeric(5,2),
  temp_min numeric(5,2),
  temp_max numeric(5,2),
  humidity integer,
  wind_speed numeric(6,2),
  pressure integer,
  visibility integer,
  uv_index numeric(4,2),
  sunrise timestamptz,
  sunset timestamptz,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default uuid_generate_v4(),
  location_id uuid references public.locations(id) on delete cascade,
  type text not null check (type in ('thunderstorm', 'rain', 'flood', 'heatwave', 'wind', 'air_quality', 'emergency')),
  severity text not null check (severity in ('info', 'watch', 'warning', 'critical')),
  title text not null,
  message text not null,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  source text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  body text not null,
  image_url text,
  weather_tag text,
  likes_count integer not null default 0,
  status text not null default 'published' check (status in ('published', 'review', 'hidden')),
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  alert_id uuid references public.alerts(id) on delete set null,
  title text not null,
  body text not null,
  channel text not null default 'push',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.user_settings (
  user_id uuid primary key references public.users(id) on delete cascade,
  language text not null default 'en' check (language in ('en', 'ur')),
  theme text not null default 'dark' check (theme in ('dark', 'light', 'system')),
  units text not null default 'metric' check (units in ('metric', 'imperial')),
  push_enabled boolean not null default true,
  severe_alerts boolean not null default true,
  rain_alerts boolean not null default true,
  aqi_alerts boolean not null default true,
  fcm_token text,
  updated_at timestamptz not null default now()
);

create index if not exists weather_data_location_observed_idx on public.weather_data(location_id, observed_at desc);
create index if not exists alerts_location_starts_idx on public.alerts(location_id, starts_at desc);
create index if not exists community_posts_created_idx on public.community_posts(created_at desc);

alter table public.users enable row level security;
alter table public.locations enable row level security;
alter table public.favorites enable row level security;
alter table public.weather_data enable row level security;
alter table public.alerts enable row level security;
alter table public.community_posts enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;
alter table public.user_settings enable row level security;

create policy "Users can read own profile" on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
create policy "Users manage own settings" on public.user_settings for all using (auth.uid() = user_id);
create policy "Users manage own locations" on public.locations for all using (auth.uid() = user_id);
create policy "Users manage own favorites" on public.favorites for all using (auth.uid() = user_id);
create policy "Public can read weather" on public.weather_data for select using (true);
create policy "Public can read alerts" on public.alerts for select using (true);
create policy "Public can read published posts" on public.community_posts for select using (status = 'published');
create policy "Users can create posts" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "Users can update own posts" on public.community_posts for update using (auth.uid() = user_id);
create policy "Public can read comments" on public.comments for select using (true);
create policy "Users can create comments" on public.comments for insert with check (auth.uid() = user_id);
create policy "Users read own notifications" on public.notifications for select using (auth.uid() = user_id);
