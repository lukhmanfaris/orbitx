import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Copy, Check, Trash2, FileCode, Upload, Plus, Download } from 'lucide-react';
import { AssetStatus, Asset, Role } from '../types';
import StatusBadge from './common/StatusBadge';
import ImageLightbox from './common/ImageLightbox';
import { useAppContext } from '../AppContext';

interface AssetCardProps {
  key?: React.Key;
  asset: Asset;
  isEditing: boolean;
}

function AssetCard({ asset, isEditing }: AssetCardProps) {
  const {
    copiedAssetId,
    currentUser,
    formatMimeTypeDescription,
    deleteAsset,
    copyCaptionToClipboard,
    saveAssetField,
    saveEdits,
    handleRevisionUpload,
  } = useAppContext();

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [localCaption, setLocalCaption] = useState(asset.captionText || '');
  const [localRevisedCaption, setLocalRevisedCaption] = useState(asset.revisedCaption || '');
  const [localComment, setLocalComment] = useState(asset.artworkComment || '');
  const [localDate, setLocalDate] = useState(asset.scheduledDate || '');
  const [localStatus, setLocalStatus] = useState(asset.status);
  const [isDragOver, setIsDragOver] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const revisionInputRef = useRef<HTMLInputElement>(null);

  const isVideo = asset.fileType?.startsWith('video') || asset.s3FileUrl.endsWith('.mp4') || asset.s3FileUrl.endsWith('.mov');
  const hasImage = asset.s3FileUrl.startsWith('https://') || asset.s3FileUrl.startsWith('/uploads/');

  const isDirty =
    localCaption !== (asset.captionText || '') ||
    localRevisedCaption !== (asset.revisedCaption || '') ||
    localComment !== (asset.artworkComment || '') ||
    localDate !== (asset.scheduledDate || '') ||
    localStatus !== asset.status;

  useEffect(() => {
    setLocalCaption(asset.captionText || '');
    setLocalRevisedCaption(asset.revisedCaption || '');
    setLocalComment(asset.artworkComment || '');
    setLocalDate(asset.scheduledDate || '');
    setLocalStatus(asset.status);
    setSaveState('idle');
  }, [asset.id]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const handleSave = async () => {
    setSaveState('saving');
    try {
      await saveEdits(asset.id, {
        captionText: localCaption,
        artworkComment: localComment,
        revisedCaption: localRevisedCaption,
        scheduledDate: localDate,
        status: localStatus,
      });
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('idle');
    }
  };

  const handleStatusChange = (v: AssetStatus) => {
    setLocalStatus(v);
    saveAssetField(asset.id, { status: v });
  };

  const handleRevisionFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleRevisionUpload(file, asset);
    if (revisionInputRef.current) revisionInputRef.current.value = '';
  };

  const handleDropOnImage = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) return;
      const { uploadUrl, publicUrl } = await presignedRes.json();
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!s3PutRes.ok) return;
      await saveAssetField(asset.id, { s3FileUrl: publicUrl });
      setLightboxOpen(false);
    } catch (err) { console.error('Failed to replace asset media:', err); }
  };

  const isDesigner = currentUser?.role === Role.Designer;

  return (
    <>
      {lightboxOpen && hasImage && !isVideo && (
        <ImageLightbox src={asset.s3FileUrl} alt="Asset preview" onClose={() => setLightboxOpen(false)} />
      )}
      <motion.div
        className="bg-white border border-neutral-100 rounded-2xl shadow-sm overflow-hidden flex flex-col lg:flex-row lg:h-[70vh]"
        whileHover={{ boxShadow: "0 4px 16px rgba(0,0,0,0.08)" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div
          className="lg:w-2/5 bg-neutral-50 flex flex-col border-b lg:border-r border-neutral-100 relative min-h-[200px] max-h-[40vh] lg:max-h-none lg:h-full p-2"
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); }}
          onDrop={handleDropOnImage}
        >
          {isDragOver && (
            <div className="absolute inset-0 z-20 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
              <Upload className="w-8 h-8 mb-2" />
              <span className="text-xs font-bold">Drop to replace</span>
            </div>
          )}
          <div
            className="w-full h-full overflow-hidden rounded-xl"
          >
            {isVideo ? (
              <video controls preload="metadata" className="w-full h-full object-contain" src={asset.s3FileUrl} />
            ) : hasImage ? (
              <img
                src={asset.s3FileUrl}
                alt={asset.captionText || "Asset preview"}
                className="w-full h-full object-contain cursor-zoom-in"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="p-8 text-center text-neutral-700 space-y-2">
                <div className="w-10 h-10 rounded-lg bg-neutral-100 border border-neutral-300 mx-auto flex items-center justify-center text-neutral-500"><FileCode className="w-5 h-5" /></div>
                <h5 className="font-mono text-xs uppercase tracking-wider font-bold text-neutral-800">Raw PSD Blueprint file</h5>
                <p className="text-[10px] text-neutral-500 max-w-xs leading-normal">Offline Photoshop compilation file saved directly to S3.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:w-3/5 p-3 flex flex-col lg:h-full min-h-0">
          <div className="flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              <div>
                <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400">Contributor</span>
                <span className="text-xs font-bold text-neutral-800">{asset.uploadedByName}</span>
              </div>
            </div>
            <div>
              <span className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 text-right mb-0.5">Status</span>
              {isDesigner ? (
                <StatusBadge status={asset.status} />
              ) : (
                <select
                  className={`text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider outline-none border cursor-pointer ${
                    localStatus === AssetStatus.Ready ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
                    localStatus === AssetStatus.Refining ? 'bg-indigo-50 text-indigo-800 border-indigo-300' :
                    'bg-amber-50 text-amber-800 border-amber-300'
                  }`}
                  value={localStatus}
                  onChange={(e) => handleStatusChange(e.target.value as AssetStatus)}
                >
                  <option value={AssetStatus.Drafting}>Drafting</option>
                  <option value={AssetStatus.Refining}>Refining</option>
                  <option value={AssetStatus.Ready}>Publish ready</option>
                </select>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-2 min-h-0 py-2">
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Caption Copywriter</label>
              <div className="relative flex-1 min-h-0">
                <textarea
                  className="w-full h-full min-h-[60px] text-xs font-mono p-2 border border-neutral-100 rounded-xl focus:outline-none focus:border-neutral-300 focus:bg-white resize-none bg-neutral-50/50 transition-colors"
                  value={localCaption}
                  onChange={(e) => setLocalCaption(e.target.value)}
                  placeholder="Enter caption copy..."
                />
                <button type="button" onClick={() => copyCaptionToClipboard(localCaption, asset.id)}
                  className="absolute right-1.5 top-1.5 p-1 bg-white border border-neutral-200 hover:bg-neutral-900 hover:border-black hover:text-white rounded-md transition-all text-neutral-700"
                  title="Copy to Clipboard"
                >
                  {copiedAssetId === asset.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {asset.status !== AssetStatus.Ready && (
              <>
                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Revised Caption</label>
                  <div className="relative flex-1 min-h-0">
                    <textarea
                      className="w-full h-full min-h-[60px] text-xs font-mono p-2 border border-neutral-100 rounded-xl focus:outline-none focus:border-neutral-300 focus:bg-white resize-none bg-neutral-50/50 transition-colors"
                      value={localRevisedCaption}
                      onChange={(e) => setLocalRevisedCaption(e.target.value)}
                      placeholder="Enter revised caption..."
                    />
                    <button type="button" onClick={() => copyCaptionToClipboard(localRevisedCaption, asset.id)}
                      className="absolute right-1.5 top-1.5 p-1 bg-white border border-neutral-200 hover:bg-neutral-900 hover:border-black hover:text-white rounded-md transition-all text-neutral-700"
                      title="Copy to Clipboard"
                    >
                      {copiedAssetId === asset.id ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Comment for Artwork</label>
                  <textarea
                    className="w-full h-full flex-1 min-h-[60px] text-xs font-mono p-2 border border-neutral-100 rounded-xl focus:outline-none focus:border-neutral-300 focus:bg-white resize-none bg-neutral-50/50 transition-colors"
                    value={localComment}
                    onChange={(e) => setLocalComment(e.target.value)}
                    placeholder="Enter artwork comment..."
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex-shrink-0">
            <label className="block text-[9px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">Release Date</label>
            <input type="date" className="w-full text-xs p-2 bg-neutral-50/50 border border-neutral-100 rounded-xl focus:outline-none focus:border-neutral-300 focus:bg-white transition-colors" value={localDate} onChange={(e) => setLocalDate(e.target.value)} />
          </div>

          {isDirty && (
            <div className="flex-shrink-0 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saveState === 'saving'}
                className="w-full bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50 transition-colors"
              >
                {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? '\u2713 Saved' : 'Save Changes'}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between flex-shrink-0 pt-2 border-t border-neutral-100 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-400 font-mono">Index: {asset.id}</span>
              <input
                type="file"
                ref={revisionInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleRevisionFile}
              />
              <button
                type="button"
                onClick={() => revisionInputRef.current?.click()}
                className="text-[11px] text-neutral-400 hover:text-neutral-900 border border-neutral-100 rounded-lg px-2 py-1 hover:bg-neutral-50 transition-colors flex items-center gap-1"
                title="Upload a new revision"
              >
                <Plus className="w-3 h-3" />Add Revision
              </button>
              <button
                type="button"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = asset.s3FileUrl;
                  a.download = asset.s3FileUrl.split('/').pop()?.split('?')[0] || 'download';
                  a.click();
                }}
                className="text-[11px] text-neutral-400 hover:text-neutral-900 border border-neutral-100 rounded-lg px-2 py-1 hover:bg-neutral-50 transition-colors flex items-center gap-1"
                title="Download file"
              >
                <Download className="w-3.5 h-3.5" />Download
              </button>
            </div>
            <button type="button" onClick={() => deleteAsset(asset.id)} className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete asset"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </motion.div>
    </>
  );
}

export default React.memo(AssetCard);
