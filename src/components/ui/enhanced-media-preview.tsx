"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  RotateCw,
  ZoomIn,
  ZoomOut,
  DownloadIcon
} from 'lucide-react';

interface EnhancedMediaPreviewProps {
  src: string;
  type: 'image' | 'video' | 'audio';
  fileName: string;
  className?: string;
  onDownload?: () => void;
}

export function EnhancedMediaPreview({ 
  src, 
  type, 
  fileName, 
  className = '',
  onDownload 
}: EnhancedMediaPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState(false);
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset zoom and rotation when src changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setError(false);
  }, [src]);

  const handlePlayPause = () => {
    if (mediaRef.current) {
      if (isPlaying) {
        mediaRef.current.pause();
      } else {
        mediaRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleMuteToggle = () => {
    if (mediaRef.current) {
      mediaRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-muted rounded-lg p-8 ${className}`}>
        <div className="text-center">
          <div className="text-muted-foreground mb-2">Failed to load media</div>
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload}>
              <DownloadIcon className="h-4 w-4 mr-2" />
              Download File
            </Button>
          )}
        </div>
      </div>
    );
  }

  const renderImagePreview = () => (
    <div className={`relative overflow-hidden rounded-lg bg-black/5 ${className}`}>
      <div className="relative h-full w-full overflow-auto">
        <img
          ref={imageRef}
          src={src}
          alt={fileName}
          className="max-w-none transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            transformOrigin: 'center center'
          }}
          onError={() => setError(true)}
        />
      </div>
      
      {/* Image controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomOut}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-white text-sm min-w-12 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleZoomIn}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <div className="w-px h-6 bg-white/30 mx-1" />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRotate}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetView}
            className="text-white hover:bg-white/20 h-8 px-3 text-xs"
          >
            Reset
          </Button>
        </div>
      </div>
    </div>
  );

  const renderVideoPreview = () => (
    <div className={`relative rounded-lg overflow-hidden bg-black ${className}`}>
      <video
        ref={mediaRef as React.RefObject<HTMLVideoElement>}
        src={src}
        className="w-full h-full object-contain"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setError(true)}
        controls={false}
        preload="metadata"
      />
      
      {/* Video controls overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg p-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePlayPause}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMuteToggle}
            className="text-white hover:bg-white/20 h-8 w-8 p-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAudioPreview = () => (
    <div className={`flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-8 ${className}`}>
      <audio
        ref={mediaRef as React.RefObject<HTMLAudioElement>}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onError={() => setError(true)}
        preload="metadata"
      />
      
      <div className="text-center">
        <div className="mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Volume2 className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium text-lg mb-1">{fileName}</h3>
          <p className="text-muted-foreground text-sm">Audio File</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlayPause}
            className="h-10 px-6"
          >
            {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMuteToggle}
            className="h-10 w-10 p-0"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'image':
      return renderImagePreview();
    case 'video':
      return renderVideoPreview();
    case 'audio':
      return renderAudioPreview();
    default:
      return null;
  }
}