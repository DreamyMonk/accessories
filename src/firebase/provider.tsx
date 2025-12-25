import { createContext, useContext, ReactNode } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Messaging } from 'firebase/messaging';

interface FirebaseContextValue {
  firebaseApp: FirebaseApp | null;
  auth: Auth | null;
  firestore: Firestore | null;
  messaging: Messaging | null;
}

const FirebaseContext = createContext<FirebaseContextValue | undefined>(
  undefined
);

export function FirebaseProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: FirebaseContextValue;
}) {
  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const useFirebaseApp = () => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) {
    throw new Error('Firebase App not available.');
  }
  return firebaseApp;
};

export const useAuth = () => {
  const { auth } = useFirebase();
  if (!auth) {
    throw new Error('Firebase Auth not available.');
  }
  return auth;
};

export const useFirestore = () => {
  const { firestore } = useFirebase();
  if (!firestore) {
    throw new Error('Firestore not available.');
  }
  return firestore;
};

export const useMessaging = () => {
  const { messaging } = useFirebase();
  // Messaging might be null on server or unsupported browsers
  return messaging;
};
