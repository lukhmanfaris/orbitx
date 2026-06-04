import { AssetStatus } from '../../types';

interface StatusBadgeProps {
  status: AssetStatus;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const classes = 
    status === AssetStatus.Ready ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
    status === AssetStatus.Refining ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
    'bg-amber-50 text-amber-800 border border-amber-200';

  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider t-status ${classes}`}
      aria-label={`Asset status: ${status}`}
    >
      {status}
    </span>
  );
}
