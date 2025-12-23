import { getSubmissions } from './actions';
import { SubmissionsManager } from '@/components/admin/submissions-manager';

export default async function SubmissionsPage() {
  const submissions = await getSubmissions();

  return (
    <div className="space-y-6">
      <SubmissionsManager initialSubmissions={submissions} />
    </div>
  );
}
