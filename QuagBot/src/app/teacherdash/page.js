import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClassroomWorkspace from '../components/Classrooms/ClassroomWorkspace';
import PageWrapper from '../components/Layout/PageWrapper';

export default async function TeacherDashboard() {
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  const userId = session?.claims?.sub;
  if (!userId) redirect('/login');

  const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role === 'teacher') return <ClassroomWorkspace teacher userId={userId} />;

  return (
    <PageWrapper>
      <main className="mx-auto w-full max-w-3xl space-y-4 p-space-5">
        <h1 className="text-xl font-semibold">Faculty Dashboard</h1>
        <p>{error ? 'Your classroom access could not be loaded.' : 'A QuagBot administrator must enable teacher access for this account.'}</p>
        <Link href="/classrooms" className="underline">Open student classrooms</Link>
      </main>
    </PageWrapper>
  );
}
