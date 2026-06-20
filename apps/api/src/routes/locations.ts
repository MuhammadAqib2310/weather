import { Router } from "express";
import { env } from "../config/env.js";

export const locationsRouter = Router();

locationsRouter.get("/search", async (req, res, next) => {
  try {
    const q = String(req.query.q || "Lahore");
    if (!env.MAPBOX_TOKEN) return res.json([{ name: q, country: "Pakistan", latitude: 31.5204, longitude: 74.3587 }]);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json?access_token=${env.MAPBOX_TOKEN}&limit=6`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Mapbox geocoding failed");
    const data = await response.json();
    res.json(data.features.map((feature: any) => ({ name: feature.place_name, longitude: feature.center[0], latitude: feature.center[1] })));
  } catch (error) { next(error); }
});
