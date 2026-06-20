import { Router } from "express";
import { env } from "../config/env.js";
import { getAqi, getWeatherByCity } from "../services/weather.js";

export const weatherRouter = Router();

weatherRouter.get("/current", async (req, res, next) => {
  try {
    const city = String(req.query.city || "Lahore");
    res.json(await getWeatherByCity(city));
  } catch (error) {
    next(error);
  }
});

weatherRouter.get("/aqi", async (req, res, next) => {
  try {
    res.json(await getAqi(String(req.query.lat || "31.5204"), String(req.query.lon || "74.3587")));
  } catch (error) {
    next(error);
  }
});

weatherRouter.get("/providers", (_req, res) => {
  res.json({
    openWeatherMap: Boolean(env.OPENWEATHER_API_KEY),
    aqicn: Boolean(env.AQICN_TOKEN),
    weatherApi: Boolean(env.WEATHERAPI_KEY),
    mapbox: Boolean(env.MAPBOX_TOKEN),
    cacheTtlSeconds: 300
  });
});

weatherRouter.get("/map-layers", (_req, res) => {
  res.json({
    radar: "openweathermap/precipitation_new",
    clouds: "openweathermap/clouds_new",
    temp: "openweathermap/temp_new",
    wind: "openweathermap/wind_new",
    satellite: "mapbox/satellite-v9"
  });
});
