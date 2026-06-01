import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Plus } from 'lucide-react';

interface CreatePostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export default function CreatePostingModal({ isOpen, onClose, onCreate }: CreatePostingModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => nameRef.current?.focus(), 100);
    } else {
      setName('');
      setDescription('');
    }
  }, [isOpen]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), description.trim());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-black text-neutral-900 uppercase tracking-tight">New Posting</h3>
              <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Posting Name</label>
                <input
                  ref={nameRef}
                  type="text"
                  className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 focus:ring-0 transition-colors"
                  placeholder="e.g., Q3 Launch Visuals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase font-mono mb-1">Description</label>
                <textarea
                  rows={2}
                  className="w-full text-sm bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-3 focus:outline-none focus:border-neutral-900 focus:ring-0 resize-none transition-colors"
                  placeholder="Brief description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-900 px-4 py-3 text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!name.trim()}
                className="bg-neutral-900 text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Create Posting
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
