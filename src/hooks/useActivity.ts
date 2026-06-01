import { useState } from 'react';
import { User } from '../types';

export interface ActivityEntry {
  id: string;
  timestamp: string;
  username: string;
  userId: string;
  action: string;
  detail: string;
}

export interface UseActivityReturn {
  activities: ActivityEntry[];
  pushActivity: (action: string, detail: string) => void;
  collapsedSections: { notifications: boolean; activity: boolean };
  setCollapsedSections: (v: { notifications: boolean; activity: boolean }) => void;
}

export function useActivity({ currentUser }: { currentUser: User | null }): UseActivityReturn {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<{ notifications: boolean; activity: boolean }>({
    notifications: true,
    activity: true,
  });

  const pushActivity = (action: string, detail: string) => {
    if (!currentUser) return;
    const entry: ActivityEntry = {
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date().toISOString(),
      username: currentUser.username,
      userId: currentUser.id,
      action,
      detail,
    };
    setActivities(prev => [entry, ...prev].slice(0, 20));
  };

  return { activities, pushActivity, collapsedSections, setCollapsedSections };
}
