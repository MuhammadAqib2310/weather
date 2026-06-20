import admin from "firebase-admin";
import { env } from "../config/env.js";

export function initFirebase() {
  if (admin.apps.length || !env.FIREBASE_PROJECT_ID || !env.FIREBASE_CLIENT_EMAIL || !env.FIREBASE_PRIVATE_KEY) return;
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: env.FIREBASE_PROJECT_ID,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
      privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    })
  });
}

export async function sendPush(token: string, title: string, body: string) {
  initFirebase();
  if (!admin.apps.length) return { dryRun: true, title, body };
  return admin.messaging().send({ token, notification: { title, body } });
}
