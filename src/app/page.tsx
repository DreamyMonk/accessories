import { SearchClient } from '@/components/search/search-client';

// In a real app, this data would be fetched from a database or CMS.
const staticData = {
  brands: [
    { id: 'apple', name: 'Apple' },
    { id: 'samsung', name: 'Samsung' },
    { id: 'google', name: 'Google' },
    { id: 'oneplus', name: 'OnePlus' },
    { id: 'redmi', name: 'Redmi' },
    { id: 'oppo', name: 'Oppo' },
    { id: 'vivo', name: 'Vivo' },
    { id: 'xiaomi', name: 'Xiaomi' },
    { id: 'realme', name: 'Realme' },
    { id: 'motorola', name: 'Motorola' },
  ],
  categories: ['Tempered Glass', 'Cases & Covers', 'Batteries', 'Chargers', 'Cables'],
};

export default function Home() {
  const { brands, categories } = staticData;

  return (
    <div className="container mx-auto px-4 py-6">
      <SearchClient brands={brands} categories={categories} />
    </div>
  );
}
