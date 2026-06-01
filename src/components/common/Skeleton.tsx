import React from 'react';

interface SkeletonProps {
  width?: string;
  height?: string;
  rounded?: string;
  className?: string;
}

export function Skeleton({ width = '100%', height = '16px', rounded = '4px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-neutral-200 ${className}`}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}

export function SkeletonAssetCard() {
  return (
    <div className="bg-white border border-[#e5e5e5] rounded-xl overflow-hidden flex flex-col lg:flex-row">
      <div className="lg:w-2/5 bg-neutral-100 min-h-[200px] flex items-center justify-center">
        <Skeleton width="120px" height="80px" rounded="8px" />
      </div>
      <div className="lg:w-3/5 p-5 space-y-3">
        <Skeleton width="60%" height="12px" />
        <Skeleton width="80%" height="32px" rounded="6px" />
        <Skeleton width="40%" height="12px" />
        <Skeleton width="100%" height="24px" rounded="6px" />
      </div>
    </div>
  );
}

export function SkeletonArticleRow() {
  return (
    <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
      <div className="flex gap-6">
        <div className="w-1/4 space-y-3">
          <Skeleton width="100%" height="16px" />
          <Skeleton width="60%" height="12px" />
          <Skeleton width="40%" height="12px" />
        </div>
        <div className="w-3/4 space-y-3">
          <Skeleton width="70%" height="20px" rounded="6px" />
          <Skeleton width="100%" height="60px" rounded="8px" />
          <Skeleton width="50%" height="12px" />
        </div>
      </div>
    </div>
  );
}
