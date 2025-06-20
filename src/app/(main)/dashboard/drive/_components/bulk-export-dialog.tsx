"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useIsMobile } from "@/hooks/use-mobile";
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle, BottomSheetFooter } from "@/components/ui/bottom-sheet";
import { 
  FileDown, 
  AlertTriangle, 
  FileText, 
  FileSpreadsheet, 
  Presentation,
  Image,
  Info
} from "lucide-react";
import { toast } from "sonner";
// Simple error handling without complex recovery

interface BulkExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (exportFormat: string) => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
    mimeType?: string;
  }>;
}

const EXPORT_FORMATS = [
  {
    id: 'pdf',
    label: 'PDF Document',
    icon: FileText,
    description: 'For Docs, Sheets, and Slides',
    supportedTypes: [
      'application/vnd.google-apps.document',
      'application/vnd.google-apps.spreadsheet',
      'application/vnd.google-apps.presentation'
    ]
  },
  {
    id: 'docx',
    label: 'Microsoft Word (.docx)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document']
  },
  {
    id: 'xlsx',
    label: 'Microsoft Excel (.xlsx)',
    icon: FileSpreadsheet,
    description: 'For Google Sheets only',
    supportedTypes: ['application/vnd.google-apps.spreadsheet']
  },
  {
    id: 'pptx',
    label: 'Microsoft PowerPoint (.pptx)',
    icon: Presentation,
    description: 'For Google Slides only',
    supportedTypes: ['application/vnd.google-apps.presentation']
  },
  {
    id: 'odt',
    label: 'OpenDocument Text (.odt)',
    icon: FileText,
    description: 'For Google Docs only',
    supportedTypes: ['application/vnd.google-apps.document']
  },
  {
    id: 'ods',
    label: 'OpenDocument Spreadsheet (.ods)',
    icon: FileSpreadsheet,
    description: 'For Google Sheets only',
    supportedTypes: ['application/vnd.google-apps.spreadsheet']
  },
  {
    id: 'png',
    label: 'PNG Image',
    icon: Image,
    description: 'For Google Drawings only',
    supportedTypes: ['application/vnd.google-apps.drawing']
  },
  {
    id: 'jpeg',
    label: 'JPEG Image',
    icon: Image,
    description: 'For Google Drawings only',
    supportedTypes: ['application/vnd.google-apps.drawing']
  }
];

export function BulkExportDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState('pdf');
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');

  // Filter exportable files (Google Workspace files only)
  const exportableFiles = selectedItems.filter(item => 
    item.type === 'file' && 
    item.mimeType && 
    item.mimeType.startsWith('application/vnd.google-apps.') &&
    !item.mimeType.includes('folder') &&
    !item.mimeType.includes('shortcut')
  );

  const nonExportableFiles = selectedItems.filter(item => 
    item.type === 'folder' || 
    !item.mimeType ||
    !item.mimeType.startsWith('application/vnd.google-apps.') ||
    item.mimeType.includes('folder') ||
    item.mimeType.includes('shortcut')
  );

  // Get compatible files for selected format
  const selectedFormatData = EXPORT_FORMATS.find(f => f.id === selectedFormat);
  const compatibleFiles = exportableFiles.filter(file => 
    selectedFormatData?.supportedTypes.includes(file.mimeType || '')
  );
  const incompatibleFiles = exportableFiles.filter(file => 
    !selectedFormatData?.supportedTypes.includes(file.mimeType || '')
  );

  const handleExport = async () => {
    if (compatibleFiles.length === 0) return;

    let successfulExports = 0;
    const failedExports: { fileName: string; error: string }[] = [];

    const format = selectedFormat;

    // Function to determine the filename based on the export format
    const getExportFilename = (filename: string, format: string) => {
      const baseName = filename.replace(/\.[^/.]+$/, ""); // Remove existing extension
      return `${baseName}.${format}`;
    };
        // Process files with simple error handling
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < compatibleFiles.length; i++) {
          const file = compatibleFiles[i];
          try {
            setProgress(prev => ({ 
              ...prev, 
              current: i + 1,
              currentFile: file.name
            }));
            
            // Attempt to export the file
                const response = await fetch(
                  `/api/drive/files/${file.id}/export?format=${format}`,
                  { method: 'GET' }
                );

                if (!response.ok) {
                  const error = new Error(`Export failed: ${response.statusText}`);
                  (error as any).status = response.status;
                  throw error;
                }

            if (!response.ok) {
              throw new Error(`Export failed: ${response.statusText}`);
            }

            const blob = await response.blob();
            
            // Download the exported file
            const filename = getExportFilename(file.name, format);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            successCount++;
          } catch (error) {
            console.error(`Export failed for ${file.name}:`, error);
            errorCount++;
          }
        }

        // Show completion message
        if (successCount > 0) {
          toast.success(`Successfully exported ${successCount} file(s)`);
        }
        if (errorCount > 0) {
          toast.error(`Failed to export ${errorCount} file(s)`);
        }
  };

  const renderContent = () => (
    <>
      <div className="text-base">
        Export <span className="font-semibold">{exportableFiles.length}</span> Google Workspace file{exportableFiles.length > 1 ? 's' : ''} to your selected format.
      </div>

      <div className="flex flex-wrap gap-2">
        {exportableFiles.length > 0 && (
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
            {exportableFiles.length} exportable file{exportableFiles.length > 1 ? 's' : ''}
          </Badge>
        )}
        {nonExportableFiles.length > 0 && (
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            {nonExportableFiles.length} non-exportable item{nonExportableFiles.length > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {nonExportableFiles.length > 0 && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            Only Google Workspace files (Docs, Sheets, Slides, Drawings) can be exported. Other files and folders will be skipped.
          </div>
        </div>
      )}

      {exportableFiles.length > 0 && (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Export Format:</Label>
            <RadioGroup
              value={selectedFormat}
              onValueChange={setSelectedFormat}
              className="space-y-3"
            >
              {EXPORT_FORMATS.map((format) => {
                const Icon = format.icon;
                return (
                  <div key={format.id} className="flex items-start space-x-3">
                    <RadioGroupItem 
                      value={format.id} 
                      id={format.id} 
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={format.id}
                        className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                      >
                        <Icon className="h-4 w-4" />
                        {format.label}
                      </Label>
                      <div className="text-xs text-muted-foreground mt-1">
                        {format.description}
                      </div>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-semibold">
                {compatibleFiles.length} file{compatibleFiles.length > 1 ? 's' : ''} compatible with {selectedFormatData?.label}
              </span>
            </div>

            {incompatibleFiles.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {incompatibleFiles.length} file{incompatibleFiles.length > 1 ? 's' : ''} will be skipped (incompatible format)
              </div>
            )}
          </div>

          {compatibleFiles.length <= 5 ? (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Files to be exported:</div>
              <div className="max-h-32 overflow-y-auto rounded-md bg-slate-50 dark:bg-slate-900/50 p-3">
                <ul className="text-sm space-y-1">
                  {compatibleFiles.map((item) => (
                    <li key={item.id} className="flex items-center gap-2 truncate">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-semibold">Preview (first 3 files):</div>
              <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 p-3">
                <ul className="text-sm space-y-1">
                  {compatibleFiles.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2 truncate">
                      <div className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </li>
                  ))}
                  <li className="flex items-center gap-2 text-muted-foreground/70 italic">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                    and {compatibleFiles.length - 3} more files...
                  </li>
                </ul>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 p-3 border border-green-200 dark:border-green-800">
            <div className="h-4 w-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="h-1.5 w-1.5 rounded-full bg-white" />
            </div>
            <div className="text-sm text-green-800 dark:text-green-200">
              Files will be downloaded automatically after export processing completes.
            </div>
          </div>
        </>
      )}
    </>
  );

  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <BottomSheet open={isOpen} onOpenChange={onClose}>
        <BottomSheetContent className="max-h-[90vh]">
          <BottomSheetHeader className="pb-4">
            <BottomSheetTitle className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <div className="text-lg font-semibold">Export Files</div>
                <div className="text-sm font-normal text-muted-foreground">
                  Bulk export operation
                </div>
              </div>
            </BottomSheetTitle>
          </BottomSheetHeader>

          <div className="px-4 pb-4 space-y-4 overflow-y-auto">
            {renderContent()}
          </div>

          <BottomSheetFooter className="flex-row gap-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            {compatibleFiles.length > 0 && (
              <Button 
                onClick={handleExport}
                className="flex-1"
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export {compatibleFiles.length} File{compatibleFiles.length > 1 ? 's' : ''}
              </Button>
            )}
          </BottomSheetFooter>
        </BottomSheetContent>
      </BottomSheet>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
              <FileDown className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Export Files</div>
              <div className="text-sm font-normal text-muted-foreground">
                Bulk export operation
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-1 space-y-4">
          {renderContent()}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          {compatibleFiles.length > 0 && (
            <Button 
              onClick={handleExport}
              className="w-full sm:w-auto bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 dark:bg-green-700 dark:hover:bg-green-800"
            >
              Export {compatibleFiles.length} File{compatibleFiles.length > 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}