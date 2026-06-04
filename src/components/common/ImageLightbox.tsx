import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { X, ZoomIn, ZoomOut, Crop, Maximize2, Smartphone } from 'lucide-react';
import { socialMediaSizes, platforms, SocialMediaPreset } from '../../socialMediaSizes';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

type FitMode = 'fit' | 'fill';

export default function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedPreset, setSelectedPreset] = useState<SocialMediaPreset | null>(null);
  const [fitMode, setFitMode] = useState<FitMode>('fill');
  const [platformOpen, setPlatformOpen] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ZOOM_STEP = 0.25;
  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;

  const handleZoomIn = useCallback(() => {
    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom(z => {
      const next = Math.max(z - ZOOM_STEP, MIN_ZOOM);
      if (next <= 1) { setPan({ x: 0, y: 0 }); }
      return next;
    });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) { handleZoomIn(); }
    else { handleZoomOut(); }
  }, [handleZoomIn, handleZoomOut]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { onClose(); }
    if (e.key === '+' || e.key === '=') { handleZoomIn(); }
    if (e.key === '-') { handleZoomOut(); }
  }, [onClose, handleZoomIn, handleZoomOut]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setPanStart({ ...pan });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setPan({ x: panStart.x + dx, y: panStart.y + dy });
  };

  const handleMouseUp = () => { setIsDragging(false); };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handlePresetSelect = (preset: SocialMediaPreset | null) => {
    setSelectedPreset(preset);
    if (preset) { setZoom(1); setPan({ x: 0, y: 0 }); }
  };

  const getPresetFrameStyle = (): React.CSSProperties => {
    if (!selectedPreset) return {};
    const containerW = containerRef.current?.clientWidth || 1200;
    const containerH = containerRef.current?.clientHeight || 800;

    let frameW: number;
    let frameH: number;

    if (fitMode === 'fit') {
      const scaleW = (containerW * 0.9) / selectedPreset.width;
      const scaleH = (containerH * 0.75) / selectedPreset.height;
      const scale = Math.min(scaleW, scaleH);
      frameW = selectedPreset.width * scale;
      frameH = selectedPreset.height * scale;
    } else {
      const scaleW = (containerW * 0.9) / selectedPreset.width;
      const scaleH = (containerH * 0.75) / selectedPreset.height;
      const scale = Math.max(scaleW, scaleH);
      frameW = selectedPreset.width * scale;
      frameH = selectedPreset.height * scale;
    }

    return {
      width: frameW,
      height: frameH,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      border: `2px dashed ${fitMode === 'fit' ? 'rgba(255,255,255,0.8)' : 'rgba(239,68,68,0.8)'}`,
      borderRadius: '4px',
      pointerEvents: 'none',
    } as React.CSSProperties;
  };

  const getImageContainerStyle = (): React.CSSProperties => {
    if (!selectedPreset) {
      return {
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
        transition: isDragging ? 'none' : 'transform 0.2s ease-out',
      };
    }

    if (fitMode === 'fit') {
      return {
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
      };
    } else {
      return {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        objectPosition: 'center',
      };
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center t-modal-active t-backdrop-active"
      onWheel={handleWheel}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Close button — top-right, outside image */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm rounded-full p-2 text-neutral-600 hover:text-neutral-900 transition-colors shadow-sm"
        title="Close (Esc)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Image + controls column */}
      <div className="relative z-10 flex flex-col items-center gap-4 pointer-events-none">
        {/* Image container */}
        <div
          ref={containerRef}
          className="pointer-events-auto bg-white rounded-2xl overflow-hidden shadow-2xl max-w-[90vw] max-h-[85vh] relative flex items-center justify-center"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => { if (!selectedPreset && e.target === e.currentTarget) onClose(); }}
        >
          {selectedPreset ? (
            <div className="relative" style={{ width: '90vw', height: '75vh', maxWidth: '1400px', maxHeight: '900px' }}>
              <div style={getPresetFrameStyle()} className="flex items-center justify-center overflow-hidden">
                <img
                  src={src}
                  alt={alt || 'Asset preview'}
                  style={getImageContainerStyle()}
                  className="max-w-full max-h-full"
                  draggable={false}
                />
              </div>
              <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full flex items-center gap-2 pointer-events-none shadow-sm">
                <span className="text-xs font-mono font-semibold text-neutral-800">{selectedPreset.width} × {selectedPreset.height}</span>
                <span className="text-xs text-neutral-400 font-mono">{selectedPreset.platform}</span>
                <span className={`text-xs font-semibold rounded px-1.5 py-0.5 ${fitMode === 'fill' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>
                  {fitMode === 'fill' ? 'FILL' : 'FIT'}
                </span>
              </div>
            </div>
          ) : (
            <img
              src={src}
              alt={alt || 'Asset preview'}
              style={getImageContainerStyle()}
              className="block max-w-[90vw] max-h-[85vh] select-none"
              draggable={false}
            />
          )}
        </div>

        {/* Controls pill — floating below image */}
        <div
          className="pointer-events-auto bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-3 shadow-sm"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Zoom controls */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= MIN_ZOOM}
              className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs font-mono font-semibold text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors min-w-[44px] text-center"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= MAX_ZOOM}
              className="p-1.5 rounded-lg hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed text-neutral-600 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-4 bg-neutral-200" />

          {/* Fit/Fill toggle when preset active */}
          {selectedPreset && (
            <>
              <div className="flex items-center gap-1 bg-neutral-100 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setFitMode('fit')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${fitMode === 'fit' ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}
                >Fit</button>
                <button
                  type="button"
                  onClick={() => setFitMode('fill')}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${fitMode === 'fill' ? 'bg-red-500 text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
                >Fill</button>
              </div>
              <div className="w-px h-4 bg-neutral-200" />
            </>
          )}

          {/* Social media preset selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setPlatformOpen(platformOpen ? null : '__open')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                selectedPreset
                  ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
              title="Preview as social media size"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <Crop className="w-3.5 h-3.5" />
              <span>{selectedPreset ? `${selectedPreset.platform} — ${selectedPreset.name}` : 'Preview as'}</span>
              <Maximize2 className="w-3 h-3 opacity-60" />
            </button>

            {platformOpen && (
              <div
                className="absolute bottom-full mb-2 right-0 w-64 bg-white rounded-2xl border border-neutral-200 shadow-2xl max-h-72 overflow-y-auto z-50 scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => { handlePresetSelect(null); setPlatformOpen(null); }}
                  className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors border-b border-neutral-100 ${!selectedPreset ? 'text-emerald-600 bg-emerald-50' : 'text-neutral-700 hover:bg-neutral-50'}`}
                >
                  Original (No Frame)
                </button>
                {platforms.map(platform => (
                  <div key={platform}>
                    <div className="px-4 py-2 text-[9px] font-bold text-neutral-400 uppercase tracking-widest bg-neutral-50 sticky top-0">{platform}</div>
                    {socialMediaSizes.filter(s => s.platform === platform).map(preset => (
                      <button
                        key={`${preset.platform}-${preset.name}`}
                        type="button"
                        onClick={() => { handlePresetSelect(preset); setPlatformOpen(null); setFitMode('fill'); }}
                        className={`w-full text-left px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                          selectedPreset?.name === preset.name && selectedPreset?.platform === preset.platform
                            ? 'bg-neutral-100 text-neutral-900 font-medium'
                            : 'text-neutral-600 hover:bg-neutral-50'
                        }`}
                      >
                        <span>{preset.name}</span>
                        <span className="text-[10px] font-mono text-neutral-400">{preset.width}×{preset.height}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-4 bg-neutral-200" />

          <span className="text-xs text-neutral-400">Scroll to zoom · Drag to pan</span>
        </div>
      </div>
    </div>
  );
}
