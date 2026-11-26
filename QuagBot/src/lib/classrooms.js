import { createClient } from '@/lib/supabase/client';

async function dataFrom(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export const activityFields = 'id,classroom_id,title,prompt,source_id,source_title,published_at';

export function listClassrooms(teacher, userId) {
  let query = createClient().from('classrooms').select(teacher ? 'id,name,join_code' : 'id,name');
  if (teacher) query = query.eq('owner_id', userId);
  return dataFrom(query.order('created_at', { ascending: false }));
}

export function createClassroom(name, userId) {
  return dataFrom(createClient().from('classrooms').insert({ name, owner_id: userId })
    .select('id,name,join_code').single());
}

export function joinClassroom(code) {
  return dataFrom(createClient().rpc('join_classroom', { code }));
}

export async function loadClassroom(classroomId, teacher) {
  const supabase = createClient();
  const [activities, roster] = await Promise.all([
    dataFrom(supabase.from('classroom_activities').select(activityFields)
      .eq('classroom_id', classroomId).order('published_at', { ascending: false })),
    teacher ? dataFrom(supabase.rpc('classroom_roster', { classroom_id: classroomId })) : [],
  ]);
  const progress = activities.length
    ? await dataFrom(supabase.from('classroom_activity_progress')
      .select('activity_id,student_id,response,submitted_at').in('activity_id', activities.map(({ id }) => id)))
    : [];
  return { activities, roster, progress };
}

export function publishActivity(classroomId, { title, prompt, source }) {
  return dataFrom(createClient().from('classroom_activities').insert({
    classroom_id: classroomId, title, prompt, source_id: source.id, source_title: source.title,
  }).select(activityFields).single());
}

export async function recordActivity(activityId, answer = null) {
  const data = await dataFrom(createClient().rpc('record_classroom_activity', { target_activity_id: activityId, answer }));
  const progress = Array.isArray(data) ? data[0] : data;
  if (progress?.activity_id !== activityId) throw new Error('Activity progress could not be saved.');
  return progress;
}
