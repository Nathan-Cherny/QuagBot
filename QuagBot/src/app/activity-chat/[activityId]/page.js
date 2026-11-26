import Link from 'next/link';
import { redirect } from 'next/navigation';
import { isDocumentId } from '@/lib/pdfCitations.mjs';
import { createClient } from '@/lib/supabase/server';
import PageWrapper from '../../components/Layout/PageWrapper';
import ActivityChat from '../../components/Classrooms/ActivityChat';

export default async function ActivityChatPage({ params }) {
  const { activityId } = await params;
  const supabase = await createClient();
  const { data: session } = await supabase.auth.getClaims();
  const userId = session?.claims?.sub;
  if (!userId) redirect('/login');

  if (isDocumentId(activityId)) {
    const { data: activity } = await supabase.from('classroom_activities')
      .select('id,title,prompt,source_title').eq('id', activityId).maybeSingle();
    if (activity) return <ActivityChat activity={activity} userId={userId} />;
  }

  return (
    <PageWrapper>
      <main className="mx-auto w-full max-w-3xl space-y-4 p-space-5">
        <h1 className="text-xl font-semibold">Activity unavailable</h1>
        <p>Check that you joined the classroom that published this activity.</p>
        <Link href="/classrooms" className="underline">Back to classrooms</Link>
      </main>
    </PageWrapper>
  );
}
