"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Download, ExternalLink, Maximize2, Minimize2, FileText, Image, Video, Music, AlertCircle } from "lucide-react";
import { DriveFile } from '@/lib/google-drive/types';
import { getPreviewUrl, isImageFile, isVideoFile, isAudioFile, isDocumentFile } from '@/lib/google-drive/utils';

interface FilePreviewDialogProps {
  open: boolean;
  onClose: () => void;
  file: DriveFile | null;
}

export function FilePreviewDialog({ open, onClose, file }: FilePreviewDialogProps) {
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

  const handleDownload = () => {
    // Use direct download API endpoint instead of export link
    const link = document.createElement('a');
    link.href = `/api/drive/download/${file.id}`;
    link.download = file.name;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenInDrive = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank');
    }
  };

  const renderPreviewContent = () => {
    // Universal preview using Google Drive - supports all file types
    const previewHeight = isFullscreen ? "h-screen" : "h-[50vh] sm:h-[60vh] lg:h-[70vh] min-h-[300px] max-h-[80vh]";
    const previewClasses = isFullscreen ? "w-full h-full" : "w-full h-full";

    // Universal Google Drive preview - handles all file types automatically
    return (
      <div className={`${isFullscreen ? 'bg-white h-screen w-screen' : 'bg-white rounded-lg border'} overflow-hidden ${previewHeight}`}>
        <iframe
          src={previewUrl}
          className={previewClasses}
          title={`Preview: ${file.name}`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          loading="lazy"
        />
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
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] h-auto overflow-hidden p-3 sm:p-4 md:p-6">
        <DialogHeader className="pb-2 sm:pb-3">
          <div className="flex items-start justify-between gap-2">
            <DialogTitle className="text-sm sm:text-base md:text-lg font-medium truncate flex-1 pr-2">
              {file.name}
            </DialogTitle>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* Fullscreen toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="hidden sm:flex"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Fullscreen
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(true)}
                className="sm:hidden h-8 w-8 p-0"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {/* Download button */}
              {file.webContentLink && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="hidden sm:flex"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownload}
                    className="sm:hidden h-8 w-8 p-0"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </>
              )}
              {/* Open in Drive */}
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
              {/* Close button */}
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
        
        <div className="mt-2 sm:mt-3 flex-1 overflow-hidden">
          {renderPreviewContent()}
        </div>

        {/* File info */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 border-t text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-0">
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