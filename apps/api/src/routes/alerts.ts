import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";
import { sendPush } from "../services/notifications.js";

export const alertsRouter = Router();

alertsRouter.get("/", async (_req, res, next) => {
  try {
    if (!supabaseAdmin) return res.json([{ type: "thunderstorm", severity: "warning", title: "Thunderstorm Watch", message: "Lightning cluster moving NE within 42 minutes" }]);
    const { data, error } = await supabaseAdmin.from("alerts").select("*").order("starts_at", { ascending: false }).limit(50);
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
});

alertsRouter.post("/notify", async (req, res, next) => {
  try {
    const { token, title, body } = req.body;
    res.json(await sendPush(token, title, body));
  } catch (error) { next(error); }
});
