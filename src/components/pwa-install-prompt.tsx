'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, X, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Logo } from '@/components/logo';

export function PwaInstallPrompter() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        // Check if it's iOS
        const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIos);

        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
        if (isStandalone) return;

        // For Android/Desktop Chrome
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Wait a bit before showing the prompt so it doesn't clash with other popups
            setTimeout(() => setShowPrompt(true), 5000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        // For iOS, just show it after a delay if not standalone
        if (isIos) {
            setTimeout(() => setShowPrompt(true), 5000);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            // If no prompt event (like iOS), we can't trigger it programmatically
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    if (!showPrompt) return null;

    return (
        <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm animate-in slide-in-from-bottom-5 fade-in duration-300">
            <Card className="shadow-lg border-primary/20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <CardContent className="p-4 flex items-start gap-4">
                    <div className="bg-primary/10 p-2 rounded-xl">
                        <Logo className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h4 className="font-semibold text-sm">Install Fitmyphone</h4>
                        <p className="text-xs text-muted-foreground">
                            {isIOS
                                ? "Install our app for a better experience. Tap 'Share' then 'Add to Home Screen'."
                                : "Add to your home screen for instant access and full screen experience."}
                        </p>

                        {!isIOS && (
                            <div className="flex gap-2 pt-2">
                                <Button size="sm" onClick={handleInstallClick} className="h-8 text-xs w-full">
                                    <Download className="mr-2 h-3 w-3" />
                                    Install App
                                </Button>
                            </div>
                        )}

                        {isIOS && (
                            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-primary">
                                <span>Tap <Share className="inline h-3 w-3" /></span>
                                <span>→</span>
                                <span>Add to Home Screen</span>
                            </div>
                        )}
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
