import React, { useState, useEffect, useRef } from 'react';
import { Role, Company, Campaign, PostingFolder, User } from '../types';
import { ToastType } from './useToast';
import { apiGet, apiPost, apiDelete, parseJSON } from '../utils/api';

export interface UseWorkspaceParams {
  currentUser: User | null;
  addToast?: (type: ToastType, title: string, message: string) => void;
}

export interface UseWorkspaceReturn {
  currentCompany: Company | null;
  setCurrentCompany: (c: Company | null) => void;
  availableCompanies: Company[];
  setAvailableCompanies: (c: Company[]) => void;
  campaigns: Campaign[];
  setCampaigns: (f: Campaign[]) => void;
  selectedCampaignId: string;
  setSelectedCampaignId: (id: string) => void;
  allCompanyCampaigns: Campaign[];
  setAllCompanyCampaigns: (f: Campaign[]) => void;
  postingFolders: PostingFolder[];
  setPostingFolders: (f: PostingFolder[]) => void;
  selectedPostingId: string;
  setSelectedPostingId: (id: string) => void;
  isCreatingCompany: boolean;
  setIsCreatingCompany: (v: boolean) => void;
  newCompanyName: string;
  setNewCompanyName: (v: string) => void;
  newCompanyLogoText: string;
  setNewCompanyLogoText: (v: string) => void;
  newCompanyLogoType: 'upload' | 'icon' | 'none';
  setNewCompanyLogoType: (v: 'upload' | 'icon' | 'none') => void;
  newCompanyLogoData: string;
  setNewCompanyLogoData: (v: string) => void;
  newCompanyAccentColor: 'emerald' | 'indigo' | 'amber';
  setNewCompanyAccentColor: (v: 'emerald' | 'indigo' | 'amber') => void;
  newCompanyDescription: string;
  setNewCompanyDescription: (v: string) => void;
  newCompanyLogoUrl: string;
  setNewCompanyLogoUrl: (v: string) => void;
  companyErrorMsg: string;
  setCompanyErrorMsg: (v: string) => void;
  isCreatingCampaign: boolean;
  setIsCreatingCampaign: (v: boolean) => void;
  newCampaignName: string;
  setNewCampaignName: (v: string) => void;
  newCampaignDescription: string;
  setNewCampaignDescription: (v: string) => void;
  newCampaignProjectType: 'both' | 'media' | 'articles';
  setNewCampaignProjectType: (v: 'both' | 'media' | 'articles') => void;
  isCreatingPosting: boolean;
  setIsCreatingPosting: (v: boolean) => void;
  newPostingName: string;
  setNewPostingName: (v: string) => void;
  newPostingDescription: string;
  setNewPostingDescription: (v: string) => void;
  newPostingProjectType: 'both' | 'media' | 'articles';
  setNewPostingProjectType: (v: 'both' | 'media' | 'articles') => void;
  folderError: string;
  setFolderError: (v: string) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  campaignPostingCounts: { [campaignId: string]: number };
  setCampaignPostingCounts: (v: { [campaignId: string]: number }) => void;
  selectedCampaign: Campaign | undefined;
  selectedPosting: PostingFolder | undefined;
  fetchCompanies: () => void;
  fetchDirectoryInfo: () => void;
  handleCreateCompany: (e: React.FormEvent) => void;
  handleLogoUpload: (companyId: string, event: React.ChangeEvent<HTMLInputElement>) => void;
  handleCreateCampaign: (e: React.FormEvent) => void;
  handleDeleteCampaign: (id: string, skipConfirm?: boolean) => void;
  handleCreatePosting: (e: React.FormEvent) => void;
  handleDeletePosting: (id: string) => void;
  getBrandBannerClass: () => string;
  getBrandBadgeClass: () => string;
  isCreatePostingModalOpen: boolean;
  setIsCreatePostingModalOpen: (v: boolean) => void;
  handleCreatePostingFromModal: (name: string, description: string) => void;
  showAllAssets: boolean;
  setShowAllAssets: (v: boolean) => void;
  handleDeleteCompany: (companyId: string, companyName: string) => Promise<void>;
}

export function useWorkspace({ currentUser, addToast }: UseWorkspaceParams): UseWorkspaceReturn {
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [availableCompanies, setAvailableCompanies] = useState<Company[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [allCompanyCampaigns, setAllCompanyCampaigns] = useState<Campaign[]>([]);
  const [postingFolders, setPostingFolders] = useState<PostingFolder[]>([]);
  const [selectedPostingId, setSelectedPostingId] = useState<string>('');
  const [isCreatingCompany, setIsCreatingCompany] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyLogoText, setNewCompanyLogoText] = useState('');
  const [newCompanyLogoType, setNewCompanyLogoType] = useState<'upload' | 'icon' | 'none'>('none');
  const [newCompanyLogoData, setNewCompanyLogoData] = useState('');
  const [newCompanyAccentColor, setNewCompanyAccentColor] = useState<'emerald' | 'indigo' | 'amber'>('indigo');
  const [newCompanyDescription, setNewCompanyDescription] = useState('');
  const [newCompanyLogoUrl, setNewCompanyLogoUrl] = useState('');
  const [companyErrorMsg, setCompanyErrorMsg] = useState('');
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignDescription, setNewCampaignDescription] = useState('');
  const [newCampaignProjectType, setNewCampaignProjectType] = useState<'both' | 'media' | 'articles'>('both');
  const [isCreatingPosting, setIsCreatingPosting] = useState(false);
  const [newPostingName, setNewPostingName] = useState('');
  const [newPostingDescription, setNewPostingDescription] = useState('');
  const [newPostingProjectType, setNewPostingProjectType] = useState<'both' | 'media' | 'articles'>('both');
  const [folderError, setFolderError] = useState('');
  const [campaignPostingCounts, setCampaignPostingCounts] = useState<{ [campaignId: string]: number }>({});
  const [isCreatePostingModalOpen, setIsCreatePostingModalOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try { return localStorage.getItem('orbitx_sidebar_collapsed') === 'true'; }
    catch { return false; }
  });

  const [showAllAssets, setShowAllAssets] = useState(false);
  const skipPostingFetchRef = useRef(false);

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);
  const selectedPosting = postingFolders.find(p => p.id === selectedPostingId);

  const fetchCompanies = async () => {
    try {
      const data = await apiGet<Company[]>('/api/companies');
      setAvailableCompanies(data);
    } catch (err) { console.error('Failed to load companies', err); }
  };

  const fetchDirectoryInfo = async () => {
    try {
      if (currentUser) {
        const data = await apiGet<Company[]>('/api/companies');
        setAvailableCompanies(data);
      }
    } catch (err) { console.error('Failed to load companies/users directories', err); }
  };

  const fetchCampaigns = async (companyId: string) => {
    try {
      const [data, countsData] = await Promise.all([
        apiGet<Campaign[]>(`/api/companies/${companyId}/campaigns`),
        apiGet<{ campaignId: string; postingCount: number }[]>(`/api/companies/${companyId}/campaign-counts`),
      ]);
      setCampaigns(data);
      setAllCompanyCampaigns(data);
      const countsMap: { [id: string]: number } = {};
      countsData.forEach(c => { countsMap[c.campaignId] = c.postingCount; });
      setCampaignPostingCounts(countsMap);
    } catch (err) { console.error(err); }
  };

  const fetchPostings = async (campaignId: string) => {
    try {
      const data = await apiGet<PostingFolder[]>(`/api/campaigns/${campaignId}/postings`);
      setPostingFolders(data);
    } catch (err) { console.error(err); }
  };

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) {
      setCompanyErrorMsg("Company name is required.");
      return;
    }
    try {
      setCompanyErrorMsg("");
      const data = await apiPost<Company>("/api/companies", {
        name: newCompanyName, description: newCompanyDescription, logoUrl: newCompanyLogoUrl,
        logoType: newCompanyLogoType, logoData: newCompanyLogoData
      });
      setAvailableCompanies(prev => [...prev, data]);
      setIsCreatingCompany(false);
      setNewCompanyName(""); setNewCompanyLogoText(""); setNewCompanyDescription("");
      setNewCompanyLogoUrl(""); setNewCompanyLogoType('none'); setNewCompanyLogoData('');
    } catch (err: any) { console.error('Failed to create company:', err); setCompanyErrorMsg(err.message || "Network error trying to create brand workspace."); }
  };

  const handleLogoUpload = async (companyId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const presignedRes = await fetch(`/api/upload/presigned-url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);
      if (!presignedRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, publicUrl } = await parseJSON(presignedRes);
      const s3PutRes = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!s3PutRes.ok) throw new Error('Upload failed');
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: publicUrl })
      });
      if (res.ok) {
        const updated = await parseJSON(res);
        setAvailableCompanies(prev => prev.map(c => c.id === companyId ? updated : c));
        if (currentCompany && currentCompany.id === companyId) { setCurrentCompany(updated); }
      }
    } catch (err) { console.error('Failed to update company logo:', err); }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');
    if (!currentUser || !currentCompany) return;
    if (currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads can manage campaigns.');
      return;
    }
    if (!newCampaignName.trim()) { setFolderError('Campaign name is required.'); return; }
    try {
      const created = await apiPost<Campaign>(`/api/companies/${currentCompany.id}/campaigns`, {
        name: newCampaignName, description: newCampaignDescription, projectType: newCampaignProjectType
      });
      setNewCampaignName(''); setNewCampaignDescription('');
      setIsCreatingCampaign(false);
      setCampaigns(prev => [...prev, created]);
      setAllCompanyCampaigns(prev => [...prev, created]);
      setPostingFolders([]);
      setSelectedPostingId('');
      skipPostingFetchRef.current = true;
      setSelectedCampaignId(created.id);
      addToast?.('success', 'Campaign Created', created.name);
    } catch (err: any) { console.error('Failed to create campaign:', err); setFolderError(err.message || 'Network error. Please try again.'); addToast?.('error', 'Failed', err.message); }
  };

  const handleDeleteCampaign = async (campaignId: string, skipConfirm?: boolean) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads are authorized to delete campaigns.');
      return;
    }
    const campaign = campaigns.find(f => f.id === campaignId);
    if (!campaign) return;
    if (!skipConfirm && !confirm(`Purge campaign "${campaign.name}"? This permanently deletes all postings and assets within.`)) {
      return;
    }
    try {
      const res = await apiDelete<{ postingCount: number; assetCount: number }>(`/api/campaigns/${campaignId}`);
      if (selectedCampaignId === campaignId) { setSelectedCampaignId(''); setSelectedPostingId(''); }
      setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      setAllCompanyCampaigns(prev => prev.filter(c => c.id !== campaignId));
      setPostingFolders(prev => prev.filter(p => p.campaignId !== campaignId));
      setCampaignPostingCounts(prev => { const next = { ...prev }; delete next[campaignId]; return next; });
      addToast?.('success', 'Campaign Deleted', `"${campaign.name}" removed with ${res.postingCount} posting folder${res.postingCount !== 1 ? 's' : ''} and ${res.assetCount} asset${res.assetCount !== 1 ? 's' : ''}.`);
    } catch (err) { console.error(err); }
  };

  const handleCreatePosting = async (e: React.FormEvent) => {
    e.preventDefault();
    setFolderError('');
    if (!currentUser || !currentCompany) return;
    if (currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads can manage posting folders.');
      return;
    }
    if (!selectedCampaignId) { setFolderError('Select a campaign first.'); return; }
    if (!newPostingName.trim()) { setFolderError('Posting folder name is required.'); return; }
    try {
      const body: any = { name: newPostingName, description: newPostingDescription };
      if (newPostingProjectType) body.projectType = newPostingProjectType;
      const created = await apiPost<PostingFolder>(`/api/campaigns/${selectedCampaignId}/postings`, body);
      setNewPostingName(''); setNewPostingDescription(''); setNewPostingProjectType('both');
      setIsCreatingPosting(false);
      setPostingFolders(prev => [...prev, created]);
      setSelectedPostingId(created.id);
      setCampaignPostingCounts(prev => ({ ...prev, [selectedCampaignId]: (prev[selectedCampaignId] || 0) + 1 }));
      addToast?.('success', 'Posting Created', created.name);
    } catch (err: any) { console.error('Failed to create posting:', err); setFolderError(err.message || 'Network error. Please try again.'); addToast?.('error', 'Failed', err.message); }
  };

  const handleCreatePostingFromModal = async (name: string, description: string) => {
    if (!currentUser || !currentCompany) return;
    if (currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads can manage posting folders.');
      return;
    }
    if (!selectedCampaignId) return;
    if (!name.trim()) return;
    try {
      const body: any = { name: name.trim(), description: description.trim() };
      if (newPostingProjectType) body.projectType = newPostingProjectType;
      const created = await apiPost<PostingFolder>(`/api/campaigns/${selectedCampaignId}/postings`, body);
      setPostingFolders(prev => [...prev, created]);
      setSelectedPostingId(created.id);
      setCampaignPostingCounts(prev => ({ ...prev, [selectedCampaignId]: (prev[selectedCampaignId] || 0) + 1 }));
      addToast?.('success', 'Posting Created', created.name);
    } catch (err: any) { console.error('Failed to create posting:', err); addToast?.('error', 'Failed', err.message); }
  };

  const handleDeleteCompany = async (companyId: string, companyName: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads can delete brand workspaces.');
      return;
    }
    try {
      const stats = await apiGet<{ campaigns: number; postingFolders: number; assets: number; articleFolders: number; articles: number }>(`/api/companies/${companyId}/stats`);
      const confirmed = window.confirm(
        `Delete brand '${companyName}'?\n\nThis will permanently delete:\n- ${stats.campaigns} campaigns\n- ${stats.postingFolders} posting folders\n- ${stats.assets} media assets\n- ${stats.articleFolders} article folders\n- ${stats.articles} articles\n\nThis action cannot be undone.`
      );
      if (!confirmed) return;
      await apiDelete(`/api/companies/${companyId}`);
      setAvailableCompanies(prev => prev.filter(c => c.id !== companyId));
      if (currentCompany?.id === companyId) {
        setCurrentCompany(null);
        setSelectedCampaignId('');
        setSelectedPostingId('');
        setShowAllAssets(false);
      }
      addToast?.('success', 'Brand Deleted', `"${companyName}" removed with ${stats.campaigns} campaign${stats.campaigns !== 1 ? 's' : ''} and ${stats.assets} asset${stats.assets !== 1 ? 's' : ''}.`);
    } catch (err: any) {
      console.error(err);
      addToast?.('error', 'Delete Failed', err.message || 'Failed to delete brand workspace.');
    }
  };

  const handleDeletePosting = async (postingId: string) => {
    if (!currentUser || currentUser.role !== Role.TeamLead) {
      addToast?.('error', 'Access Denied', 'Only Team Leads are authorized to delete posting folders.');
      return;
    }
    const posting = postingFolders.find(p => p.id === postingId);
    if (!posting) return;
    if (confirm(`Purge posting folder "${posting.name}"? This permanently deletes all assets and articles within.`)) {
      try {
        await apiDelete(`/api/postings/${postingId}`);
        if (selectedPostingId === postingId) setSelectedPostingId('');
        setPostingFolders(prev => prev.filter(p => p.id !== postingId));
        if (posting.campaignId) {
          setCampaignPostingCounts(prev => ({ ...prev, [posting.campaignId]: Math.max(0, (prev[posting.campaignId] || 0) - 1) }));
        }
      } catch (err) { console.error(err); }
    }
  };

  const getBrandBannerClass = () => 'bg-neutral-900 border-neutral-800 text-neutral-100';
  const getBrandBadgeClass = () => 'bg-neutral-100 text-neutral-800 border-neutral-200';

  useEffect(() => {
    fetchCompanies();
    const storedCompany = localStorage.getItem('hub_company');
    if (storedCompany) {
      try { setCurrentCompany(JSON.parse(storedCompany)); }
      catch (e) { localStorage.removeItem('hub_user'); }
    }
    const storedCampaign = localStorage.getItem('hub_campaign');
    if (storedCampaign) {
      try { setSelectedCampaignId(JSON.parse(storedCampaign)); } catch {}
    }
    const storedPosting = localStorage.getItem('hub_posting');
    if (storedPosting) {
      try { setSelectedPostingId(JSON.parse(storedPosting)); } catch {}
    }
    const storedSidebar = localStorage.getItem('orbitx_sidebar_collapsed');
    if (storedSidebar !== null) {
      setSidebarCollapsed(storedSidebar === 'true');
    }
  }, []);

  useEffect(() => {
    if (currentCompany) {
      fetchCampaigns(currentCompany.id);
      localStorage.setItem('hub_company', JSON.stringify(currentCompany));
    } else {
      setCampaigns([]); setAllCompanyCampaigns([]); setPostingFolders([]); setCampaignPostingCounts({});
      localStorage.removeItem('hub_company');
    }
  }, [currentCompany]);

  useEffect(() => {
    if (selectedCampaignId) {
      localStorage.removeItem('hub_article_folder');
      localStorage.removeItem('hub_article');
      if (skipPostingFetchRef.current) {
        skipPostingFetchRef.current = false;
        localStorage.setItem('hub_campaign', JSON.stringify(selectedCampaignId));
        return;
      }
      fetchPostings(selectedCampaignId);
      localStorage.setItem('hub_campaign', JSON.stringify(selectedCampaignId));
    } else {
      setPostingFolders([]);
      localStorage.removeItem('hub_campaign');
    }
  }, [selectedCampaignId]);

  useEffect(() => {
    if (selectedPostingId) {
      localStorage.setItem('hub_posting', JSON.stringify(selectedPostingId));
    } else {
      localStorage.removeItem('hub_posting');
    }
  }, [selectedPostingId]);

  useEffect(() => {
    localStorage.setItem('orbitx_sidebar_collapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  return {
    currentCompany, 
    setCurrentCompany: (c: Company | null) => {
      setCurrentCompany(c);
      setShowAllAssets(false);
      if (c) {
        setSelectedCampaignId('');
        setSelectedPostingId('');
        localStorage.removeItem('hub_campaign');
        localStorage.removeItem('hub_posting');
      }
    },
    availableCompanies, setAvailableCompanies,
    campaigns, setCampaigns,
    selectedCampaignId, setSelectedCampaignId,
    allCompanyCampaigns, setAllCompanyCampaigns,
    postingFolders, setPostingFolders,
    selectedPostingId, setSelectedPostingId,
    isCreatingCompany, setIsCreatingCompany,
    newCompanyName, setNewCompanyName,
    newCompanyLogoText, setNewCompanyLogoText,
    newCompanyLogoType, setNewCompanyLogoType,
    newCompanyLogoData, setNewCompanyLogoData,
    newCompanyAccentColor, setNewCompanyAccentColor,
    newCompanyDescription, setNewCompanyDescription,
    newCompanyLogoUrl, setNewCompanyLogoUrl,
    companyErrorMsg, setCompanyErrorMsg,
    isCreatingCampaign, setIsCreatingCampaign,
    newCampaignName, setNewCampaignName,
    newCampaignDescription, setNewCampaignDescription,
    newCampaignProjectType, setNewCampaignProjectType,
    isCreatingPosting, setIsCreatingPosting,
    newPostingName, setNewPostingName,
    newPostingDescription, setNewPostingDescription,
    newPostingProjectType, setNewPostingProjectType,
    folderError, setFolderError,
    sidebarCollapsed, setSidebarCollapsed,
    campaignPostingCounts, setCampaignPostingCounts,
    selectedCampaign, selectedPosting,
    fetchCompanies, fetchDirectoryInfo,
    handleCreateCompany, handleLogoUpload,
    handleCreateCampaign, handleDeleteCampaign,
    handleCreatePosting, handleDeletePosting,
    getBrandBannerClass, getBrandBadgeClass,
    isCreatePostingModalOpen, setIsCreatePostingModalOpen,
    handleCreatePostingFromModal,
    showAllAssets, setShowAllAssets,
    handleDeleteCompany,
  };
}
