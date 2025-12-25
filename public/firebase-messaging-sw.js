// Firebase Messaging Service Worker
// Handles background push notifications

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyDU3ckJw8zDMjNWAq4axyGb3C9RCbJN9Gk",
  authDomain: "healthcheck-43bcp.firebaseapp.com",
  projectId: "healthcheck-43bcp",
  storageBucket: "healthcheck-43bcp.firebasestorage.app",
  messagingSenderId: "824886408498",
  appId: "1:824886408498:web:4a44ba7c91a5bb1b6e3c99"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// If you would like to customize notifications that are received in the background (Web app is closed or not in browser focus) capability,
// then you should implement this optional method.
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification?.title || 'Fitmyphone Update';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/icons/icon-192x192.svg',
    badge: '/icons/icon-192x192.svg', // Small monochrome icon for status bar (Android)
    image: payload.notification?.image,
    vibrate: [200, 100, 200],
    requireInteraction: true,
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Open App',
      }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event);
  event.notification.close();

  // Open the app/url when clicked
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
