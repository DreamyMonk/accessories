import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

import { getMessaging, Messaging } from 'firebase/messaging';

export function initializeFirebase() {
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  let messaging: Messaging | null = null;
  if (typeof window !== 'undefined') {
    try {
      messaging = getMessaging(app);
    } catch (e) {
      // Messaging likely not supported in this environment
    }
  }

  return { firebaseApp: app, auth, firestore, messaging };
}
