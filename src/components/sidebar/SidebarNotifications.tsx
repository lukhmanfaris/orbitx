import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, ChevronDown } from 'lucide-react';

const blurFade = {
  initial: { opacity: 0, filter: 'blur(4px)' },
  animate: { opacity: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, filter: 'blur(4px)' },
  transition: { duration: 0.2, ease: 'easeOut' },
} as const;

export interface NotificationItem {
  id: string;
  message: string;
  postingFolderId: string;
  campaignId: string;
  type: string;
}

interface Props {
  notifications: NotificationItem[];
  collapsed: boolean;
  onToggle: () => void;
  onNotificationClick: (n: NotificationItem) => void;
  isSidebarCollapsed: boolean;
}

export default function SidebarNotifications({ notifications, collapsed, onToggle, onNotificationClick, isSidebarCollapsed }: Props) {
  if (isSidebarCollapsed) {
    return (
      <div className="flex justify-center py-2 border-t border-neutral-200/60">
        <button
          type="button"
          onClick={onToggle}
          title={`Notifications${notifications.length > 0 ? ` (${notifications.length})` : ''}`}
          className="relative p-2 rounded-lg text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-3.5 bg-blue-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center px-0.5">
              {notifications.length}
            </span>
          )}
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
          <Bell className="w-3 h-3 text-neutral-400" />
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">NOTIFICATIONS</span>
          {notifications.length > 0 && (
            <span className="text-[9px] font-bold bg-blue-500 text-white px-1.5 py-0 rounded-full min-w-[16px] text-center">{notifications.length}</span>
          )}
        </button>
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
      </div>

      <motion.div
        initial={false}
        animate={{ height: collapsed ? 0 : 'auto', opacity: collapsed ? 0 : 1 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="overflow-hidden"
      >
        <div className="px-3 pb-2 space-y-1 max-h-40 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-[10px] text-neutral-400 py-2 text-center">All clear</p>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => onNotificationClick(n)}
                className="w-full text-left p-2 rounded-lg hover:bg-neutral-200/50 transition-colors"
              >
                <p className="text-[10px] text-neutral-600 leading-relaxed">{n.message}</p>
              </button>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
