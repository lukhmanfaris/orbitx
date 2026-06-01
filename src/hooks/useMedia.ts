import React, { useState, useEffect, useRef } from 'react';
import { Role, AssetStatus, Asset, User } from '../types';
import { ToastType } from './useToast';
import { apiGet, apiPost, apiPut, apiDelete, parseJSON } from '../utils/api';

export interface UseMediaParams {
  currentUser: User | null;
  selectedPostingId: string;
  addToast?: (type: ToastType, title: string, message: string) => void;
}

export interface UseMediaReturn {
  assets: Asset[];
  loadingAssets: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  statusFilter: string;
  setStatusFilter: (v: string) => void;
  sortOrder: 'asc' | 'desc';
  setSortOrder: (v: 'asc' | 'desc') => void;
  isDragOver: boolean;
  setIsDragOver: (v: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadError: string;
  uploadingFileName: string;
  editingAssetId: string | null;
  setEditingAssetId: (id: string | null) => void;
  editCaption: string;
  setEditCaption: (v: string) => void;
  editArtworkComment: string;
  setEditArtworkComment: (v: string) => void;
  editRevisedCaption: string;
  setEditRevisedCaption: (v: string) => void;
  editSchedule: string;
  setEditSchedule: (v: string) => void;
  editStatus: AssetStatus;
  setEditStatus: (v: AssetStatus) => void;
  copiedAssetId: string | null;
  filteredAssets: Asset[];
  draftCount: number;
  refineCount: number;
  readyCount: number;
  formatMimeTypeDescription: (mime: string) => string;
  handleS3FileUpload: (file: File) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleQuickStatusUpdate: (assetId: string, statusKey: AssetStatus) => void;
  triggerEditing: (asset: Asset) => void;
  saveEdits: (assetId: string, fields: { captionText: string; artworkComment: string; revisedCaption: string; scheduledDate: string; status: AssetStatus }) => void;
  saveAssetField: (assetId: string, changes: Record<string, string>) => void;
  deleteAsset: (assetId: string) => void;
  copyCaptionToClipboard: (text: string, assetId: string) => void;
  fetchAssets: (postingId: string) => void;
  handleRevisionUpload: (file: File, originalAsset: Asset) => void;
}

export function useMedia({ currentUser, selectedPostingId, addToast }: UseMediaParams): UseMediaReturn {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loadingAssets, setLoadingAssets] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [uploadingFileName, setUploadingFileName] = useState('');
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editArtworkComment, setEditArtworkComment] = useState('');
  const [editRevisedCaption, setEditRevisedCaption] = useState('');
  const [editSchedule, setEditSchedule] = useState('');
  const [editStatus, setEditStatus] = useState<AssetStatus>(AssetStatus.Drafting);
  const [copiedAssetId, setCopiedAssetId] = useState<string | null>(null);

  const fetchAssets = async (postingId: string) => {
    setLoadingAssets(true);
    try {
      const data = await apiGet<Asset[]>(`/api/postings/${postingId}/assets`);
      setAssets(data);
    } catch (err) { console.error(err); }
    finally { setLoadingAssets(false); }
  };

  useEffect(() => {
    if (selectedPostingId) {
      fetchAssets(selectedPostingId);
    } else {
      setAssets([]);
    }
  }, [selectedPostingId]);

  const handleS3FileUpload = async (file: File) => {
    if (!selectedPostingId) { setUploadError('Select a posting folder as target.'); return; }
    if (!currentUser) return;
    if (currentUser.role === Role.ContentWriter) {
      addToast?.('error', 'Access Denied', 'Content Writers cannot upload media files.');
      return;
    }
    setIsUploading(true); setUploadError(''); setUploadingFileName(file.name); setUploadProgress(15);
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Could not acquire direct S3 write credentials.');
      const { uploadUrl, publicUrl, fileType } = await parseJSON(presignedRes);
      setUploadProgress(45);
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file });
      if (!s3PutRes.ok) throw new Error('Simulated AWS S3 binary cache storage rejected block.');
      setUploadProgress(80);
      const dateToday = new Date().toLocaleDateString('en-CA');
      const newAsset = await apiPost<Asset>('/api/assets', {
        postingFolderId: selectedPostingId, s3FileUrl: publicUrl, fileType: fileType,
        captionText: '', artworkComment: '', revisedCaption: '', scheduledDate: dateToday, status: AssetStatus.Drafting, uploadedBy: currentUser.id
      });
      setUploadProgress(100);
      setTimeout(() => { setIsUploading(false); setUploadingFileName(''); setAssets(prev => [newAsset, ...prev]); addToast?.('success', 'Upload Complete', file.name); }, 500);
    } catch (err: any) { setUploadError(err.message || 'Direct S3 Write failed.'); setIsUploading(false); }
  };

  const handleRevisionUpload = async (file: File, originalAsset: Asset) => {
    if (!currentUser) return;
    if (currentUser.role === Role.ContentWriter) {
      addToast?.('error', 'Access Denied', 'Content Writers cannot upload media files.');
      return;
    }
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Could not acquire direct S3 write credentials.');
      const { uploadUrl, publicUrl, fileType } = await parseJSON(presignedRes);
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': fileType }, body: file });
      if (!s3PutRes.ok) throw new Error('S3 upload failed.');
      const dateToday = new Date().toLocaleDateString('en-CA');
      const newAsset = await apiPost<Asset>('/api/assets', {
        postingFolderId: originalAsset.postingFolderId,
        s3FileUrl: publicUrl,
        fileType: fileType,
        captionText: originalAsset.captionText,
        artworkComment: '',
        revisedCaption: originalAsset.revisedCaption,
        scheduledDate: originalAsset.scheduledDate,
        status: AssetStatus.Drafting,
        uploadedBy: currentUser.id,
      });
      setAssets(prev => [newAsset, ...prev]);
      addToast?.('success', 'Revision Uploaded', file.name);
    } catch (err: any) { addToast?.('error', 'Upload Failed', err.message || 'Revision upload failed.'); }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragOver(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) { handleS3FileUpload(e.dataTransfer.files[0]); }
  };

  const handleQuickStatusUpdate = async (assetId: string, statusKey: AssetStatus) => {
    if (!currentUser || currentUser.role === Role.Designer) { addToast?.('error', 'Access Denied', 'Designers cannot modify status trackers.'); return; }
    if (statusKey === AssetStatus.Ready && currentUser.role !== Role.TeamLead) { addToast?.('error', 'Access Denied', 'Only Team Lead can set Ready status.'); return; }
    try {
      await apiPut(`/api/assets/${assetId}/status`, { status: statusKey });
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, status: statusKey } : a));
    } catch (err) { console.error(err); }
  };

  const triggerEditing = (asset: Asset) => {
    if (!currentUser || currentUser.role === Role.Designer) { addToast?.('error', 'Access Denied', 'Designers cannot edit captions.'); return; }
    setEditingAssetId(asset.id);
    setEditCaption(asset.captionText);
    setEditArtworkComment(asset.artworkComment || '');
    setEditRevisedCaption(asset.revisedCaption || '');
    setEditSchedule(asset.scheduledDate);
    setEditStatus(asset.status);
  };

  const saveEdits = async (assetId: string, fields: { captionText: string; artworkComment: string; revisedCaption: string; scheduledDate: string; status: AssetStatus }) => {
    if (!currentUser) return;
    if (fields.status === AssetStatus.Ready && currentUser.role !== Role.TeamLead) { addToast?.('error', 'Access Denied', 'Only Team Lead can publish.'); return; }
    try {
      await apiPut(`/api/assets/${assetId}`, fields);
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...fields } : a));
      addToast?.('success', 'Saved', 'Asset updated successfully.');
    } catch (err) { console.error(err); }
  };

  const saveAssetField = async (assetId: string, changes: Record<string, string>) => {
    if (!currentUser) return;
    if (changes.status === AssetStatus.Ready && currentUser.role !== Role.TeamLead) return;
    try {
      await apiPut(`/api/assets/${assetId}`, changes);
      setAssets(prev => prev.map(a => a.id === assetId ? { ...a, ...changes } : a));
    } catch (err) { console.error(err); }
  };

  const deleteAsset = async (assetId: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) { addToast?.('error', 'Access Denied', 'Only Team Lead can delete assets.'); return; }
    if (confirm('Permanently purge this visual campaign asset? This scrub cannot be undone.')) {
      try {
        await apiDelete(`/api/assets/${assetId}`);
        setAssets(prev => prev.filter(a => a.id !== assetId));
      } catch (err) { console.error(err); }
    }
  };

  const copyCaptionToClipboard = (text: string, assetId: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedAssetId(assetId);
    setTimeout(() => { setCopiedAssetId(null); }, 2000);
  };

  const formatMimeTypeDescription = (mime: string) => {
    if (!mime) return 'GENERIC ASSET';
    if (mime.includes('image')) return 'RASTER RENDER';
    if (mime.includes('video')) return 'MASTER VIDEO';
    if (mime.includes('photoshop') || mime.includes('psd') || mime.includes('octet-stream')) return 'RAW PSD PROJECT';
    return mime.toUpperCase();
  };

  const filteredAssets = assets
    .filter(asset => {
      const matchesSearch = asset.captionText.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || asset.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const t1 = new Date(a.scheduledDate).getTime();
      const t2 = new Date(b.scheduledDate).getTime();
      return sortOrder === 'asc' ? t1 - t2 : t2 - t1;
    });

  const draftCount = assets.filter(a => a.status === AssetStatus.Drafting).length;
  const refineCount = assets.filter(a => a.status === AssetStatus.Refining).length;
  const readyCount = assets.filter(a => a.status === AssetStatus.Ready).length;

  return {
    assets, loadingAssets,
    searchQuery, setSearchQuery,
    statusFilter, setStatusFilter,
    sortOrder, setSortOrder,
    isDragOver, setIsDragOver,
    fileInputRef,
    isUploading, uploadProgress, uploadError, uploadingFileName,
    editingAssetId, setEditingAssetId,
    editCaption, setEditCaption,
    editArtworkComment, setEditArtworkComment,
    editRevisedCaption, setEditRevisedCaption,
    editSchedule, setEditSchedule,
    editStatus, setEditStatus,
    copiedAssetId,
    filteredAssets, draftCount, refineCount, readyCount,
    formatMimeTypeDescription,
    handleS3FileUpload, handleDragOver, handleDragLeave, handleDrop,
    handleQuickStatusUpdate, triggerEditing, saveEdits, saveAssetField, deleteAsset,
    copyCaptionToClipboard,
    fetchAssets,
    handleRevisionUpload,
  };
}
