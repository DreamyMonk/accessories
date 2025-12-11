import { AppLayout } from '@/components/layout/app-layout';
import { SearchClient } from '@/components/search/search-client';

export default function Home() {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <SearchClient />
      </div>
    </AppLayout>
  );
}
