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

  // Handle keyboard shortcuts for fullscreen and navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Exit fullscreen with Escape
      if (event.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
        event.preventDefault();
        return;
      }
      
      // Toggle fullscreen with F11 or F key
      if ((event.key === 'F11' || (event.key === 'f' && !event.ctrlKey && !event.metaKey)) && open) {
        event.preventDefault();
        setIsFullscreen(!isFullscreen);
        return;
      }

      // Close dialog with Escape when not in fullscreen
      if (event.key === 'Escape' && !isFullscreen && open) {
        onClose();
        event.preventDefault();
        return;
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
      
      // Manage body overflow for fullscreen
      if (isFullscreen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = 'unset';
      }
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isFullscreen, open, onClose]);

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
    // Responsive preview dimensions with proper spacing from screen edges
    const getPreviewHeight = () => {
      if (isFullscreen) return "h-full";
      
      // Calculate available height with proper spacing
      // Mobile: 16px margin top/bottom (2rem), header ~80px, footer ~60px, padding
      if (window.innerWidth < 640) return "h-[calc(100vh-12rem)] min-h-[280px] max-h-[70vh]";
      // Tablet: 32px margin top/bottom (4rem), header ~100px, footer ~70px, padding
      if (window.innerWidth < 1024) return "h-[calc(100vh-14rem)] min-h-[400px] max-h-[75vh]";
      // Desktop: 48px margin top/bottom (6rem), header ~120px, footer ~80px, padding
      return "h-[calc(100vh-16rem)] min-h-[500px] max-h-[80vh]";
    };

    const previewHeight = getPreviewHeight();
    const previewClasses = isFullscreen ? "w-full h-full" : "w-full h-full border-0";
    const containerClasses = isFullscreen 
      ? 'bg-white h-full w-full' 
      : 'bg-white rounded-lg border overflow-hidden shadow-lg';

    // Universal Google Drive preview - handles all file types automatically
    return (
      <div className={`${containerClasses} ${previewHeight}`}>
        <iframe
          src={previewUrl}
          className={previewClasses}
          title={`Preview: ${file.name}`}
          allow="autoplay; encrypted-media; fullscreen"
          allowFullScreen
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
          loading="lazy"
          style={{
            border: 'none',
            outline: 'none',
            borderRadius: isFullscreen ? '0' : '0.5rem'
          }}
        />
      </div>
    );
  };

  // Render fullscreen overlay with proper spacing and controls
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/95">
        {/* Fullscreen toolbar following PROJECT_RULES.md design standards */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/90 via-black/70 to-transparent p-4 sm:p-6">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <h2 className="text-white font-medium truncate text-sm sm:text-base lg:text-lg max-w-xs sm:max-w-md lg:max-w-lg">
                {file.name}
              </h2>
              <div className="text-white/60 text-xs sm:text-sm hidden md:block truncate">
                {file.mimeType}
              </div>
              {file.size && (
                <div className="text-white/60 text-xs hidden lg:block">
                  {(parseInt(file.size) / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {file.webContentLink && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20 transition-colors h-11 min-w-[44px]"
                  title="Download file"
                >
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Download</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleOpenInDrive}
                className="text-white hover:bg-white/20 transition-colors h-11 min-w-[44px]"
                title="Open in Google Drive"
              >
                <ExternalLink className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Open in Drive</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:bg-white/20 transition-colors h-11 min-w-[44px]"
                title="Exit fullscreen (Esc)"
              >
                <Minimize2 className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit Fullscreen</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20 transition-colors h-11 w-11"
                title="Close preview"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Fullscreen content with proper spacing following responsive design standards */}
        <div className="h-full w-full pt-20 sm:pt-24 pb-6 px-4 sm:px-6 lg:px-12">
          <div className="h-full w-full max-w-screen-2xl mx-auto">
            {renderPreviewContent()}
          </div>
        </div>

        {/* Bottom gradient for better visual separation */}
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] lg:w-[calc(100vw-8rem)] max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-6rem)] h-auto overflow-hidden p-3 sm:p-4 md:p-6" showCloseButton={false}>
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

        {/* Enhanced file info with better spacing */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-3 sm:pt-4 border-t border-border/50 text-xs sm:text-sm text-muted-foreground gap-1 sm:gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
            <span className="truncate font-medium">
              Type: <span className="font-normal">{file.mimeType}</span>
            </span>
            {file.modifiedTime && (
              <span className="truncate text-xs text-muted-foreground/80">
                Modified: {new Date(file.modifiedTime).toLocaleDateString()}
              </span>
            )}
          </div>
          {file.size && (
            <span className="text-right font-medium">
              Size: <span className="font-normal">{(parseInt(file.size) / (1024 * 1024)).toFixed(2)} MB</span>
            </span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}