'use client';

import { useEffect, useState } from 'react';
import { useMessaging } from '@/firebase/provider';
import { getToken, onMessage } from 'firebase/messaging';
import { Button } from '@/components/ui/button';
import { BellRing, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

export function PushNotificationManager() {
    const messaging = useMessaging();
    const { toast } = useToast();
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
            // Show prompt if permission is default (not asked yet)
            if (Notification.permission === 'default') {
                const timer = setTimeout(() => setShowPrompt(true), 3000); // Delay prompt
                return () => clearTimeout(timer);
            }
        }
    }, []);

    useEffect(() => {
        if (messaging) {
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('[FCM] Foreground message:', payload);
                toast({
                    title: payload.notification?.title || 'New Notification',
                    description: payload.notification?.body,
                });
            });
            return () => unsubscribe();
        }
    }, [messaging, toast]);

    const requestPermission = async () => {
        if (!messaging) return;

        try {
            const perm = await Notification.requestPermission();
            setPermission(perm);

            if (perm === 'granted') {
                // NOTE: You need to generate a VAPID pair in Firebase Console -> Project Settings -> Cloud Messaging -> Web Configuration
                // And replace 'YOUR_VAPID_KEY' below with your public key string.
                const token = await getToken(messaging, {
                    vapidKey: 'BAiLc2os5oYSdJUDI-gUH3LMOQojtTz9d1QfccAQSIZStiT5kTUiNMZvlwCFUH9t3a_l3fXyA7Mq__LTeor3638'
                });

                console.log('FCM Token:', token);
                // Here you would typically save this token to your database for the current user

                toast({
                    title: "Notifications Enabled! 🔔",
                    description: "You'll now receive updates about new accessories.",
                });
            } else {
                toast({
                    title: "Notifications blocked",
                    description: "You won't receive updates.",
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('Unable to get permission/token', error);
        } finally {
            setShowPrompt(false);
        }
    };

    if (permission === 'granted' || permission === 'denied' || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardContent className="p-4 flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-full">
                        <BellRing className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-sm">Enable Notifications?</h4>
                        <p className="text-xs text-muted-foreground">
                            Get instant alerts for new compatible accessories and deals.
                        </p>
                        <div className="flex gap-2 pt-2">
                            <Button size="sm" onClick={requestPermission} className="h-8 text-xs">
                                Allow
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setShowPrompt(false)} className="h-8 text-xs">
                                Later
                            </Button>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowPrompt(false)}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
