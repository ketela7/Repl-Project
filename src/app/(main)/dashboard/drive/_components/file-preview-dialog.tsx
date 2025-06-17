"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, Maximize2, Minimize2 } from "lucide-react";
import { DriveFile } from '@/lib/google-drive/types';
import { getPreviewUrl, isImageFile, isVideoFile, isAudioFile, isDocumentFile } from '@/lib/google-drive/utils';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: DriveFile | null;
}

export function FilePreviewDialog({ open, onClose, file }: FilePreviewDialogProps) {
  const [imageError, setImageError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle escape key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        event.preventDefault();
      }
    };

    if (isFullscreen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen]);

  // Reset fullscreen when dialog closes
  useEffect(() => {
    if (!open) {
      setIsFullscreen(false);
    }
  }, [open]);

  if (!file) return null;

  const previewUrl = getPreviewUrl(file.id, file.mimeType, file.webContentLink);
  const isImage = isImageFile(file.mimeType);
  const isVideo = isVideoFile(file.mimeType);
  const isAudio = isAudioFile(file.mimeType);
  const isDocument = isDocumentFile(file.mimeType);

  const handleDownload = () => {
    if (file.webContentLink) {
      window.open(file.webContentLink, '_blank');
    }
  };

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const renderPreviewContent = () => {
    const fullscreenClasses = isFullscreen 
      ? "h-screen w-screen bg-black" 
      : "bg-gray-50 dark:bg-gray-900 rounded-lg";
    
    const imageClasses = isFullscreen
      ? "h-full w-full object-contain"
      : "max-w-full max-h-full object-contain";
    
    const containerHeight = isFullscreen 
      ? "h-screen" 
      : "min-h-[250px] sm:min-h-[400px] max-h-[60vh] sm:max-h-[70vh]";

    if (isImage && !imageError) {
      return (
        <div className={`flex items-center justify-center ${fullscreenClasses} ${containerHeight} overflow-hidden ${isFullscreen ? '' : 'cursor-pointer'}`}
             onClick={isFullscreen ? undefined : () => setIsFullscreen(true)}>
          <img
            src={previewUrl}
            alt={file.name}
            className={imageClasses}
            onError={() => setImageError(true)}
            onLoad={() => setImageError(false)}
          />
        </div>
      );
    }

    if (isVideo) {
      const videoHeight = isFullscreen ? "h-screen" : "min-h-[200px] sm:min-h-[400px] max-h-[60vh] sm:max-h-[70vh]";
      const videoClasses = isFullscreen ? "w-full h-full" : "w-full h-full min-h-[200px] sm:min-h-[400px]";
      
      return (
        <div className={`${isFullscreen ? 'bg-black h-screen w-screen' : 'bg-black rounded-lg'} overflow-hidden ${videoHeight}`}>
          <iframe
            src={previewUrl}
            className={videoClasses}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title={`Video preview: ${file.name}`}
          />
        </div>
      );
    }

    if (isAudio) {
      return (
        <div className={`flex flex-col items-center justify-center ${fullscreenClasses} p-4 sm:p-8 ${containerHeight}`}>
          <div className={`${isFullscreen ? 'text-8xl mb-8' : 'text-4xl sm:text-6xl mb-2 sm:mb-4'}`}>🎵</div>
          <h3 className={`${isFullscreen ? 'text-2xl mb-8' : 'text-sm sm:text-lg mb-2 sm:mb-4'} font-medium text-center truncate w-full ${isFullscreen ? 'text-white' : ''}`}>
            {file.name}
          </h3>
          <audio controls className={`${isFullscreen ? 'w-full max-w-2xl' : 'w-full max-w-md'}`}>
            <source src={previewUrl} type={file.mimeType} />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    if (isDocument) {
      const docHeight = isFullscreen ? "h-screen" : "min-h-[300px] sm:min-h-[500px] max-h-[60vh] sm:max-h-[70vh]";
      const docClasses = isFullscreen ? "w-full h-full" : "w-full h-full min-h-[300px] sm:min-h-[500px]";
      
      return (
        <div className={`${isFullscreen ? 'bg-white h-screen w-screen' : 'bg-white rounded-lg border'} overflow-hidden ${docHeight}`}>
          <iframe
            src={previewUrl}
            className={docClasses}
            title={`Document preview: ${file.name}`}
          />
        </div>
      );
    }

    // Fallback for unsupported file types
    return (
      <div className="flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 rounded-lg p-4 sm:p-8 min-h-[200px] sm:min-h-[300px]">
        <div className="text-4xl sm:text-6xl mb-2 sm:mb-4">📄</div>
        <h3 className="text-sm sm:text-lg font-medium mb-2 text-center">{file.name}</h3>
        <p className="text-muted-foreground mb-4 text-center text-xs sm:text-sm">
          This file type cannot be previewed directly.
        </p>
        <Button onClick={handleOpenInDrive} variant="outline" size="sm">
          <ExternalLink className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Open in Google Drive</span>
          <span className="sm:hidden">Open in Drive</span>
        </Button>
      </div>
    );
  };

  // Render fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black">
        {/* Fullscreen toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-white font-medium truncate max-w-md">
                {file.name}
              </h2>
              <div className="text-white/70 text-sm hidden sm:block">
                {file.mimeType}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {file.webContentLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInDrive}
                className="text-white hover:bg-white/10"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Open in Drive</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/10"
              >
                <Minimize2 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Fullscreen content */}
        <div className="h-full w-full pt-16">
          {renderPreviewContent()}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[95vh] h-auto overflow-hidden p-2 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-sm sm:text-lg font-medium truncate flex-1 pr-2">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Fullscreen toggle for media files */}
              {(isImage || isVideo || isDocument) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="hidden sm:flex"
                >
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Fullscreen
                </Button>
              )}
              {(isImage || isVideo || isDocument) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="sm:hidden h-8 w-8 p-0"
                >
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
              {file.webContentLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="hidden sm:flex"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              )}
              {file.webContentLink && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownload}
                  className="sm:hidden h-8 w-8 p-0"
                >
                  <Download className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInDrive}
                className="hidden sm:flex"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in Drive
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenInDrive}
                className="sm:hidden h-8 w-8 p-0"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-2 sm:mt-4 flex-1 overflow-hidden">
          {renderPreviewContent()}
        </div>

        {/* File info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-2 sm:pt-4 border-t text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
          <span className="truncate">
            Type: {file.mimeType}
          </span>
          {file.size && (
            <span className="text-right">
              Size: {(parseInt(file.size) / (1024 * 1024)).toFixed(2)} MB
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}