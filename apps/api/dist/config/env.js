import "dotenv/config";
import { z } from "zod";
const schema = z.object({
    PORT: z.coerce.number().default(4000),
    NODE_ENV: z.string().default("development"),
    CLIENT_URL: z.string().default("http://localhost:3000"),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
    OPENWEATHER_API_KEY: z.string().optional(),
    WEATHERAPI_KEY: z.string().optional(),
    AQICN_TOKEN: z.string().optional(),
    MAPBOX_TOKEN: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional()
});
export const env = schema.parse(process.env);
