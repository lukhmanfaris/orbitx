import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../AppContext';

interface CreatePostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, campaignId?: string) => void;
  campaignId?: string;
}

export default function CreatePostingModal({ isOpen, onClose, onCreate, campaignId }: CreatePostingModalProps) {
  const { campaigns } = useAppContext();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState(campaignId || '');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedCampaignId(campaignId || (campaigns.length > 0 ? campaigns[0].id : ''));
      setTimeout(() => nameRef.current?.focus(), 100);
    } else {
      setName('');
      setDescription('');
    }
  }, [isOpen, campaignId, campaigns]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim(), selectedCampaignId || undefined);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/30 backdrop-blur-sm t-backdrop-active"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 t-modal-active"
          >
            <div className="mb-5">
              <h3 className="text-lg font-semibold tracking-tight text-neutral-900">New Posting</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Campaign</label>
                {campaigns.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-2">No campaigns available. Create a campaign first.</p>
                ) : (
                  <select
                    className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all appearance-none cursor-pointer"
                    value={selectedCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                  >
                    {campaigns.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Posting Name</label>
                <input
                  ref={nameRef}
                  type="text"
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all"
                  placeholder="e.g., Q3 Launch Visuals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5">Description</label>
                <textarea
                  rows={2}
                  className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-neutral-400 focus:bg-white transition-all resize-none"
                  placeholder="Brief description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <motion.button
                type="button"
                onClick={onClose}
                whileTap={{ scale: 0.97 }}
                className="text-sm text-neutral-500 hover:text-neutral-900 px-4 py-2 rounded-xl hover:bg-neutral-100 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim() || !selectedCampaignId}
                whileTap={{ scale: 0.97 }}
                className="bg-neutral-900 text-white text-sm font-medium px-4 py-2 rounded-xl hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Create Posting
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
