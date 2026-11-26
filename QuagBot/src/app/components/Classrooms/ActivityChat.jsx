'use client';

import { useEffect, useState } from 'react';
import { recordActivity } from '@/lib/classrooms';
import Home from '../../page';

export default function ActivityChat({ activity, userId }) {
  const [notice, setNotice] = useState('');
  useEffect(() => {
    let active = true;
    recordActivity(activity.id).catch(() => {
      if (active) setNotice('Activity progress could not be saved. You can still study and submit your response from Classrooms.');
    });
    return () => { active = false; };
  }, [activity.id]);

  return <Home activity={activity} activityUserId={userId} activityNotice={notice} />;
}
