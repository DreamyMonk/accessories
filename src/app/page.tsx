import { SearchClient } from '@/components/search/search-client';

// In a real app, this data would be fetched from a database or CMS.
const staticData = {
  categories: ['Tempered Glass', 'Cases & Covers', 'Batteries', 'Chargers', 'Cables'],
};

export default function Home() {
  const { categories } = staticData;

  return (
    <div className="container mx-auto px-4 py-6">
      <SearchClient categories={categories} />
    </div>
  );
}
