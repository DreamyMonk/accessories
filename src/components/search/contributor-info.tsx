'use client';

import { useUserDoc } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Skeleton } from '../ui/skeleton';
import { Facebook, Instagram } from 'lucide-react';

export function ContributorInfo({ uid, points, variant = 'full' }: { uid?: string, points?: number, variant?: 'full' | 'compact' }) {
  const { data: user, loading } = useUserDoc(uid);

  if (loading) {
    return <Skeleton className="h-5 w-40" />;
  }
  
  if (!uid) {
    return null;
  }

  const displayName = user?.displayName || 'Anonymous';
  
  if (displayName === 'Anonymous') {
      return null;
  }
  
  const displayPoints = points || 0;
  const socialLink = user?.socialMediaLink;

  if (variant === 'compact') {
    return (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="text-xs">(by</span>
            {user?.photoURL && (
                <Avatar className="h-4 w-4">
                    <AvatarImage src={user.photoURL} />
                    <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
                </Avatar>
            )}
            <span className="font-semibold text-foreground">{displayName}</span>
            {socialLink && (
                <a href={socialLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    {socialLink.includes('facebook') ? <Facebook className="h-4 w-4" /> : <Instagram className="h-4 w-4" />}
                </a>
            )}
            <span className="text-xs">)</span>
        </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
        Contributed by:
        {user?.photoURL && (
            <Avatar className="h-5 w-5">
                <AvatarImage src={user.photoURL} />
                <AvatarFallback>{displayName.charAt(0)}</AvatarFallback>
            </Avatar>
        )}
       <span className="font-semibold text-foreground">{displayName}</span> (+{displayPoints} pts)
       {socialLink && (
            <a href={socialLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {socialLink.includes('facebook') ? <Facebook className="h-4 w-4" /> : <Instagram className="h-4 w-4" />}
            </a>
        )}
    </div>
  );
}
