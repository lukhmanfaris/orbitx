import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Plus, X, Upload, Building2, Trash2 } from 'lucide-react';
import { Role } from '../types';
import { useAppContext } from '../AppContext';
import { BRAND_ICONS, getPresetIconById } from '../constants/brandIcons';

export default function CompanySelector() {
  const {
    availableCompanies,
    currentUser,
    setCurrentCompany,
    isCreatingCompany,
    setIsCreatingCompany,
    companyErrorMsg,
    setCompanyErrorMsg,
    newCompanyName,
    setNewCompanyName,
    newCompanyDescription,
    setNewCompanyDescription,
    newCompanyLogoType,
    setNewCompanyLogoType,
    newCompanyLogoData,
    setNewCompanyLogoData,
    handleCreateCompany,
    handleLogoUpload,
    handleDeleteCompany,
  } = useAppContext();

  const [logoTab, setLogoTab] = useState<'upload' | 'icon'>('icon');
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFileError, setLogoFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoFileDrop = useCallback((file: File) => {
    setLogoFileError('');
    if (!file.type.startsWith('image/')) {
      setLogoFileError('Please select an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoFileError('File size must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogoPreview(dataUrl);
      setNewCompanyLogoType('upload');
      setNewCompanyLogoData(dataUrl);
    };
    reader.onerror = () => setLogoFileError('Failed to read file.');
    reader.readAsDataURL(file);
  }, [setNewCompanyLogoType, setNewCompanyLogoData]);

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoFileDrop(file);
  };

  const handleClearUpload = () => {
    setLogoPreview(null);
    setNewCompanyLogoType('none');
    setNewCompanyLogoData('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleIconSelect = (iconId: string) => {
    if (newCompanyLogoType === 'icon' && newCompanyLogoData === iconId) {
      setNewCompanyLogoType('none');
      setNewCompanyLogoData('');
    } else {
      setNewCompanyLogoType('icon');
      setNewCompanyLogoData(iconId);
    }
  };

  const renderCompanyLogo = (comp: typeof availableCompanies[0]) => {
    if (comp.logoType === 'upload' && comp.logoData) {
      return <img src={comp.logoData} alt={comp.name} className="w-14 h-14 rounded-xl shadow-sm object-contain" />;
    }
    if (comp.logoType === 'icon' && comp.logoData) {
      const IconComponent = getPresetIconById(comp.logoData);
      if (IconComponent) {
        return (
          <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 shadow-sm">
            <IconComponent className="w-6 h-6" />
          </div>
        );
      }
    }
    if (comp.logoUrl) {
      return <img src={comp.logoUrl} alt={comp.name} className="w-14 h-14 rounded-xl shadow-sm object-cover" />;
    }
    const prefix = comp.name.substring(0, 3).toUpperCase();
    return (
      <div className="w-14 h-14 flex items-center justify-center rounded-xl bg-neutral-100 text-neutral-800 font-bold text-[10px] font-mono tracking-wider shadow-sm">
        {prefix}
      </div>
    );
  };

  const renderHeaderLogo = (comp: typeof availableCompanies[0]) => {
    if (comp.logoType === 'upload' && comp.logoData) {
      return <img src={comp.logoData} alt={comp.name} className="h-5 w-auto rounded" />;
    }
    if (comp.logoType === 'icon' && comp.logoData) {
      const IconComponent = getPresetIconById(comp.logoData);
      if (IconComponent) {
        return (
          <div className="p-1.5 rounded bg-neutral-100 text-neutral-700">
            <IconComponent className="w-4 h-4" />
          </div>
        );
      }
    }
    if (comp.logoUrl) {
      return <img src={comp.logoUrl} alt={comp.name} className="h-5 w-auto rounded" />;
    }
    return (
      <div className="p-1.5 rounded bg-neutral-100 text-neutral-600 font-black text-[9px] font-mono tracking-wider">
        {comp.logoText || comp.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  return (
    <>
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-neutral-50 via-neutral-100 to-neutral-200 min-h-[85vh]">
        <div className="max-w-5xl w-full text-center mb-8">
          <span className="text-[11px] font-mono font-black tracking-widest text-[#047857] bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200/50 shadow-xs mb-3 inline-block">
            CONGLOMERATE CENTRAL GATEWAY
          </span>
          <h1 className="text-4xl font-extrabold text-neutral-900 tracking-tight leading-none mt-1">
            Select Corporate Brand Workspace
          </h1>
          <p className="text-sm text-neutral-500 mt-2.5 max-w-xl mx-auto">
            Choose one of the active subsidiaries to enter the designated Creative Workspace Lobby.
          </p>
        </div>

        {availableCompanies.length === 0 && !isCreatingCompany ? (
          <div className="text-center py-16 bg-white border border-[#e5e5e5] rounded-2xl shadow-xs">
            <Building2 className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-sm font-extrabold text-neutral-900 uppercase">No brand workspaces yet</h3>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
              Create your first subsidiary workspace to begin managing campaign assets.
            </p>
            <button type="button" onClick={() => setIsCreatingCompany(true)}
              className="mt-4 bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs px-5 py-2.5 rounded-lg transition-colors"
            >
              Create Workspace
            </button>
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl w-full">
          {availableCompanies.map((comp) => {
            return (
              <motion.div
                key={comp.id}
                onClick={() => setCurrentCompany(comp)}
                className="group relative bg-white border border-neutral-100 rounded-2xl p-5 cursor-pointer shadow-sm flex flex-col justify-between overflow-hidden"
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
                whileTap={{ scale: 0.99 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="relative group/logo">
                      {currentUser?.role === Role.TeamLead ? (
                        <label onClick={e => e.stopPropagation()} className="cursor-pointer">
                          <input type="file" className="hidden" accept="image/*" onChange={e => handleLogoUpload(comp.id, e)} />
                          {renderCompanyLogo(comp)}
                          <div className="absolute -inset-2 bg-black/50 text-white opacity-0 group-hover/logo:opacity-100 rounded flex items-center justify-center transition pointer-events-none text-[10px] font-bold">
                            Update Logo
                          </div>
                        </label>
                      ) : (
                        <div>
                          {renderCompanyLogo(comp)}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                    {currentUser?.role === Role.TeamLead && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteCompany(comp.id, comp.name); }}
                        className="p-1 rounded text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete brand workspace"
                        aria-label={`Delete ${comp.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <ChevronRight className={`w-5 h-5 text-neutral-300 group-hover:text-neutral-900 group-hover:translate-x-1 transition-all`} />
                  </div>
                  </div>

                  <h3 className="text-base font-semibold tracking-tight text-neutral-900 mb-1">
                    {comp.name}
                  </h3>
                  <p className="text-sm text-neutral-400 mt-1 leading-relaxed mb-4">
                    {comp.description}
                  </p>
                </div>

                <div className="border-t border-neutral-100 pt-5 mt-auto flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider font-extrabold text-neutral-400 group-hover:text-neutral-700 uppercase">
                    Enter Lobby Node
                  </span>
                  <span className="text-[9px] font-mono tracking-widest font-black uppercase px-2 py-1 rounded bg-neutral-100 text-neutral-600">
                    {comp.logoText || comp.name.substring(0, 3).toUpperCase()}
                  </span>
                </div>
              </motion.div>
            );
          })}

          <motion.div
            onClick={() => {
              setIsCreatingCompany(true);
              setCompanyErrorMsg("");
              setLogoPreview(null);
              setLogoFileError('');
              setLogoTab('icon');
              setNewCompanyLogoType('none');
              setNewCompanyLogoData('');
            }}
            className="group relative rounded-2xl p-5 cursor-pointer flex flex-col items-center justify-center min-h-[240px] border-2 border-dashed border-neutral-200 hover:border-neutral-400 transition-colors"
            whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}
            whileTap={{ scale: 0.99 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            title="Add a new subsidiary corporate workspace brand"
          >
            <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center mb-3">
              <Plus className="w-6 h-6 text-neutral-400" />
            </div>
            <h3 className="text-sm font-semibold tracking-tight text-neutral-400">
              Add Subsidiary Brand
            </h3>
            <p className="text-[10px] text-neutral-400 mt-2 max-w-[200px] text-center font-sans leading-relaxed">
              Provision a dynamic brand workspace container for campaigns, media, and digital copy registers.
            </p>
          </motion.div>
        </div>
        )}
      </div>

      <AnimatePresence>
        {isCreatingCompany && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-neutral-200 rounded-3xl p-6 shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
                <div className="flex items-center space-x-2 text-neutral-900">
                  <span className="p-1.5 rounded-lg bg-neutral-100 text-neutral-800 text-xs font-extrabold font-mono">+</span>
                  <h3 className="text-sm font-black uppercase font-mono tracking-wider">Create Brand Workspace</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreatingCompany(false)}
                  className="p-1.5 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCompany} className="space-y-4 text-left">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-wider mb-1">Company/Brand Name</label>
                  <input
                    type="text"
                    required
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900 font-sans"
                    placeholder="e.g. Apex Gear Group"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-wider mb-1">Company Logo (optional)</label>

                  <div className="flex bg-neutral-100 rounded-lg p-0.5 border border-neutral-200 mb-2">
                    <button type="button" onClick={() => setLogoTab('icon')}
                      className={`flex-1 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1.5 rounded transition-all ${logoTab === 'icon' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                    >
                      Choose Icon
                    </button>
                    <button type="button" onClick={() => setLogoTab('upload')}
                      className={`flex-1 text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-1.5 rounded transition-all ${logoTab === 'upload' ? 'bg-neutral-800 text-white shadow-xs' : 'text-neutral-600 hover:text-neutral-900'}`}
                    >
                      Upload
                    </button>
                  </div>

                  {logoTab === 'upload' ? (
                    <div>
                      {logoPreview ? (
                        <div className="relative inline-block">
                          <img src={logoPreview} alt="Logo preview" className="h-20 w-20 rounded-xl object-cover border border-neutral-200" />
                          <button type="button" onClick={handleClearUpload}
                            className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition shadow-sm"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          onDrop={(e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.files?.[0]) handleLogoFileDrop(e.dataTransfer.files[0]); }}
                          className="w-20 h-20 border-2 border-dashed border-neutral-300 hover:border-neutral-500 rounded-xl flex flex-col items-center justify-center cursor-pointer bg-neutral-50 hover:bg-neutral-100 transition-colors"
                        >
                          <Upload className="w-5 h-5 text-neutral-400 mb-1" />
                          <span className="text-[8px] text-neutral-400 font-mono">Drop file</span>
                        </div>
                      )}
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoFileChange} />
                      {logoFileError && <p className="text-[9px] text-red-600 font-bold mt-1">{logoFileError}</p>}
                      <p className="text-[8px] text-neutral-400 mt-1.5">PNG, JPG, SVG, WebP — max 2MB</p>
                      <p className="text-xs text-neutral-400 text-center mt-1.5">Recommended: 512×512px, PNG or SVG, transparent background</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid grid-cols-6 gap-1.5">
                        {BRAND_ICONS.map(item => {
                          const isSelected = newCompanyLogoType === 'icon' && newCompanyLogoData === item.id;
                          const IconComponent = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => handleIconSelect(item.id)}
                              title={item.name}
                              className={`p-2 rounded-lg flex items-center justify-center transition-colors ${isSelected ? 'bg-neutral-800 text-white ring-2 ring-neutral-400' : 'bg-neutral-50 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700'}`}
                            >
                              <IconComponent className="w-4 h-4" />
                            </button>
                          );
                        })}
                      </div>
                      {newCompanyLogoType === 'icon' && (
                        <p className="text-[9px] text-neutral-500 mt-1.5">
                          Selected: {BRAND_ICONS.find(i => i.id === newCompanyLogoData)?.name}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase font-mono tracking-wider mb-1">Brand Description</label>
                  <textarea
                    rows={3}
                    className="w-full text-xs p-2.5 bg-neutral-50 border border-[#e5e5e5] rounded-xl focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
                    placeholder="High performance athletic gear conglomerate."
                    value={newCompanyDescription}
                    onChange={(e) => setNewCompanyDescription(e.target.value)}
                  />
                </div>

                {companyErrorMsg && (
                  <p className="text-[10px] text-red-600 font-bold font-mono">{companyErrorMsg}</p>
                )}

                <div className="flex items-center space-x-2.5 pt-2 border-t border-neutral-100">
                  <button
                    type="submit"
                    className="flex-1 bg-neutral-900 hover:bg-neutral-800 text-white font-mono font-bold text-xs py-2.5 rounded-lg transition-all shadow-sm cursor-pointer"
                  >
                    Provision Workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreatingCompany(false)}
                    className="bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-600 font-bold text-xs px-4 py-2.5 rounded-lg transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
