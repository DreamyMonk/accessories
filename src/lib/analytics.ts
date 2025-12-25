import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase/config'; // Assuming we can access db directly or pass firestore instance

export async function logSearch(firestore: any, term: string, category: string) {
    if (!term || term.trim().length < 2) return;

    try {
        // Only log if we have a valid firestore instance
        if (!firestore) return;

        await addDoc(collection(firestore, 'search_logs'), {
            term: term.trim(),
            category: category,
            timestamp: serverTimestamp(),
            date: new Date().toISOString().split('T')[0] // For easier day-grouping
        });
    } catch (error) {
        console.error("Failed to log search:", error);
        // Don't block the UI for analytics errors
    }
}
