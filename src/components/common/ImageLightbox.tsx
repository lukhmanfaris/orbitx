import React, { useState, useCallback, useEffect, useRef } from 'react';
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

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) { onClose(); }
  };

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
    const presetAspect = selectedPreset.width / selectedPreset.height;

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

    const presetAspect = selectedPreset.width / selectedPreset.height;
    const imgAspect = 1;

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
      className="fixed inset-0 z-[100] bg-black/80 flex flex-col"
      onClick={handleBackdropClick}
      onWheel={handleWheel}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-black/60 backdrop-blur-sm flex-shrink-0" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-neutral-800 rounded-lg p-1">
            <button type="button" onClick={handleZoomOut} disabled={zoom <= MIN_ZOOM}
              className="p-1.5 rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors" title="Zoom Out">
              <ZoomOut className="w-4 h-4" />
            </button>
            <button type="button" onClick={handleResetZoom}
              className="px-2 py-1 text-[11px] font-mono font-bold text-white hover:bg-neutral-700 rounded transition-colors min-w-[48px] text-center">
              {Math.round(zoom * 100)}%
            </button>
            <button type="button" onClick={handleZoomIn} disabled={zoom >= MAX_ZOOM}
              className="p-1.5 rounded hover:bg-neutral-700 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors" title="Zoom In">
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {selectedPreset && (
            <div className="flex items-center space-x-1 bg-neutral-800 rounded-lg p-1">
              <button type="button"
                onClick={() => setFitMode('fit')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${fitMode === 'fit' ? 'bg-white text-neutral-900' : 'text-neutral-300 hover:bg-neutral-700'}`}
              >Fit</button>
              <button type="button"
                onClick={() => setFitMode('fill')}
                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-colors ${fitMode === 'fill' ? 'bg-red-500 text-white' : 'text-neutral-300 hover:bg-neutral-700'}`}
              >Fill</button>
            </div>
          )}

          <span className="text-[10px] text-neutral-400 font-mono">
            Scroll to zoom • Drag to pan
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button type="button"
              onClick={() => setPlatformOpen(platformOpen ? null : '__open')}
              className={`flex items-center space-x-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${selectedPreset ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-neutral-800 hover:bg-neutral-700 text-white'}`}
              title="Preview image as social media size"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <Crop className="w-3.5 h-3.5" />
              <span>Preview as:</span>
              <span className={selectedPreset ? 'text-blue-200' : 'text-neutral-400'}>{selectedPreset ? `${selectedPreset.platform} — ${selectedPreset.name}` : 'Original'}</span>
              <Maximize2 className="w-3 h-3 opacity-60" />
            </button>

            {platformOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-neutral-900 rounded-xl border border-neutral-700 shadow-2xl max-h-[70vh] overflow-y-auto z-50 scrollbar-thin"
                onClick={(e) => e.stopPropagation()}
              >
                <button type="button"
                  onClick={() => { setSelectedPreset(null); setPlatformOpen(null); }}
                  className={`w-full text-left px-3 py-2 text-[11px] font-bold transition-colors border-b border-neutral-800 ${!selectedPreset ? 'bg-emerald-600/20 text-emerald-400' : 'text-neutral-300 hover:bg-neutral-800'}`}
                >
                  Original (No Frame)
                </button>
                {platforms.map(platform => (
                  <div key={platform}>
                    <div className="px-3 py-1.5 text-[9px] font-black text-neutral-500 uppercase tracking-wider bg-neutral-800/50 sticky top-0">{platform}</div>
                    {socialMediaSizes.filter(s => s.platform === platform).map(preset => (
                      <button key={`${preset.platform}-${preset.name}`} type="button"
                        onClick={() => { setSelectedPreset(preset); setPlatformOpen(null); setFitMode('fill'); }}
                        className={`w-full text-left px-3 py-2 text-[11px] transition-colors flex items-center justify-between ${
                          selectedPreset?.name === preset.name && selectedPreset?.platform === preset.platform
                            ? 'bg-blue-600/20 text-blue-400'
                            : 'text-neutral-300 hover:bg-neutral-800'
                        }`}
                      >
                        <span>{preset.name}</span>
                        <span className="text-[9px] font-mono text-neutral-500">{preset.width}×{preset.height}</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="button" onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-700 text-white transition-colors" title="Close (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden flex items-center justify-center"
        style={{ touchAction: 'manipulation' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => { if (!selectedPreset && e.target === e.currentTarget) onClose(); }}
      >
        {selectedPreset ? (
          <div className="relative" style={{ width: '90%', height: '75%', maxWidth: '1400px', maxHeight: '900px' }}>
            <div style={getPresetFrameStyle()} className="flex items-center justify-center overflow-hidden bg-black/30">
              <img
                src={src}
                alt={alt || 'Asset preview'}
                style={getImageContainerStyle()}
                className="max-w-full max-h-full"
                draggable={false}
              />
            </div>
            <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full flex items-center space-x-2 pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-white">{selectedPreset.width} × {selectedPreset.height}</span>
              <span className="text-[10px] text-neutral-400 font-mono">{selectedPreset.platform}</span>
              <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 ${fitMode === 'fill' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {fitMode === 'fill' ? 'FILL' : 'FIT'}
              </span>
            </div>
          </div>
        ) : (
          <img
            src={src}
            alt={alt || 'Asset preview'}
            style={getImageContainerStyle()}
            className="max-w-[90vw] max-h-[75vh] select-none"
            draggable={false}
          />
        )}
      </div>
    </div>
  );
}