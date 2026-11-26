import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ClassroomWorkspace from '../components/Classrooms/ClassroomWorkspace';

export default async function StudentClassrooms() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profile?.role === 'teacher') redirect('/teacherdash');
  return <ClassroomWorkspace userId={userId} />;
}
