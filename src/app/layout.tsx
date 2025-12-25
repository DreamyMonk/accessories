import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { PushNotificationManager } from '@/components/push-notification-manager';

export const metadata: Metadata = {
  title: 'Fitmyphone - World\'s Largest Mobile Accessory Compatibility Database',
  description: 'Find compatible accessories for any phone model instantly. Fitmyphone is the world\'s largest mobile accessory compatibility finder with the biggest database for tempered glass, cases, chargers, and more.',
  keywords: 'phone accessories, mobile accessories, tempered glass compatibility, phone case finder, accessory compatibility, Fitmyphone',
  openGraph: {
    title: 'Fitmyphone - Find Compatible Accessories Instantly',
    description: 'World\'s largest mobile accessory compatibility database. Search any phone model and find compatible tempered glass, cases, chargers and more.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0B84FF" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Fitmyphone" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          {children}
          <Toaster />
          <PushNotificationManager />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
