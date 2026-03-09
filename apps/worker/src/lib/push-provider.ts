export interface PushResult {
  success: boolean;
  invalidToken?: boolean;
}

let firebaseApp: FirebaseApp | null = null;

interface FirebaseApp {
  messaging(): { send(msg: Record<string, unknown>): Promise<string> };
}

function getFirebaseApp(): FirebaseApp | null {
  if (firebaseApp) return firebaseApp;

  const sa = process.env.FIREBASE_SA;
  if (!sa) return null;

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const admin = require('firebase-admin') as typeof import('firebase-admin');
    const credential = admin.credential.cert(JSON.parse(sa));
    firebaseApp = admin.initializeApp({ credential }) as unknown as FirebaseApp;
    return firebaseApp;
  } catch {
    console.error('Failed to initialize Firebase Admin');
    return null;
  }
}

export async function sendPush(
  token: string,
  platform: string,
  title: string,
  body: string,
): Promise<PushResult> {
  if (platform === 'ios') {
    console.log(`[push] iOS token skipped (no APNs key): ${token.slice(0, 8)}...`);
    return { success: false };
  }

  const app = getFirebaseApp();
  if (!app) {
    console.log(`[push] No Firebase SA configured, logging only: title="${title}" body="${body}"`);
    return { success: true };
  }

  try {
    await app.messaging().send({
      token,
      notification: { title, body },
    });
    return { success: true };
  } catch (err: unknown) {
    const errorCode = (err as { code?: string }).code;
    if (
      errorCode === 'messaging/invalid-registration-token' ||
      errorCode === 'messaging/registration-token-not-registered'
    ) {
      return { success: false, invalidToken: true };
    }
    console.error('[push] FCM send failed:', err);
    return { success: false };
  }
}
