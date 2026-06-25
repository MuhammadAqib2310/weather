import { supabaseAdmin } from "../config/supabase.js";
export async function requireAuth(req, res, next) {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token || !supabaseAdmin)
        return res.status(401).json({ error: "Authentication required" });
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user)
        return res.status(401).json({ error: "Invalid session" });
    req.userId = data.user.id;
    next();
}
export function requireAdmin(req, res, next) {
    if (req.userRole !== "admin")
        return res.status(403).json({ error: "Admin access required" });
    next();
}
