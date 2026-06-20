import { Router } from "express";
import { supabaseAdmin } from "../config/supabase.js";

export const communityRouter = Router();

communityRouter.get("/posts", async (_req, res, next) => {
  try {
    if (!supabaseAdmin) return res.json([{ body: "Heavy rain reported near DHA", weather_tag: "rain", likes_count: 24 }]);
    const { data, error } = await supabaseAdmin.from("community_posts").select("*, comments(*)").eq("status", "published").order("created_at", { ascending: false }).limit(30);
    if (error) throw error;
    res.json(data);
  } catch (error) { next(error); }
});

communityRouter.post("/posts", async (req, res, next) => {
  try {
    if (!supabaseAdmin) return res.status(202).json({ queued: true, ...req.body });
    const { data, error } = await supabaseAdmin.from("community_posts").insert(req.body).select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (error) { next(error); }
});
