import React from 'react';
import { motion } from 'motion/react';
import { Clock, ChevronDown } from 'lucide-react';
import { ActivityEntry } from '../../hooks/useActivity';

const blurFade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

interface Props {
  activities: ActivityEntry[];
  collapsed: boolean;
  onToggle: () => void;
  isSidebarCollapsed: boolean;
}

export default function SidebarActivity({ activities, collapsed, onToggle, isSidebarCollapsed }: Props) {
  if (isSidebarCollapsed) {
    return (
      <div className="flex justify-center py-2 border-t border-neutral-200/60">
        <button
          type="button"
          onClick={onToggle}
          title="Recent Activity"
          className="p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
        >
          <Clock className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <motion.div {...blurFade} className="border-t border-neutral-200/60 pt-2">
      <div className="px-3 mb-1 flex items-center justify-between">
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 hover:text-neutral-600 transition-colors"
          aria-expanded={!collapsed}
        >
          <Clock className="w-3 h-3 text-neutral-400" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">RECENT ACTIVITY</span>
        </button>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </div>

      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-2 space-y-1 max-h-48 overflow-y-auto">
          {activities.length === 0 ? (
            <p className="text-[10px] text-neutral-400 py-2 text-center">No recent activity</p>
          ) : (
            activities.slice(0, 5).map(act => (
              <div key={act.id} className="flex items-start gap-2 p-2 rounded-lg">
                <div className="w-5 h-5 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[8px] font-bold text-neutral-500">{act.username.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-neutral-600 leading-relaxed">
                    <span className="font-medium text-neutral-800">{act.username}</span> {act.action} {act.detail}
                  </p>
                  <p className="text-[8px] text-neutral-400 mt-0.5">{timeAgo(act.timestamp)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
