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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { 
  Edit3, 
  Hash, 
  Calendar, 
  AlignLeft,
  AlertTriangle,
  Info,
  Code2,
  HelpCircle
} from "lucide-react";

interface BulkRenameDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (renamePattern: string, renameType: string) => void;
  selectedItems: Array<{
    id: string;
    name: string;
    type: 'file' | 'folder';
  }>;
}

const RENAME_TYPES = [
  {
    id: 'prefix',
    label: 'Add Prefix',
    icon: AlignLeft,
    description: 'Add text before existing name',
    example: 'NewPrefix_OriginalName.ext'
  },
  {
    id: 'suffix',
    label: 'Add Suffix',
    icon: AlignLeft,
    description: 'Add text before file extension',
    example: 'OriginalName_NewSuffix.ext'
  },
  {
    id: 'numbering',
    label: 'Sequential Numbering',
    icon: Hash,
    description: 'Replace with pattern and numbers',
    example: 'NewName_001, NewName_002, ...'
  },
  {
    id: 'timestamp',
    label: 'Add Timestamp',
    icon: Calendar,
    description: 'Add current date and time',
    example: 'OriginalName_2024-06-18_14-30.ext'
  },
  {
    id: 'regex',
    label: 'Regex Replace',
    icon: Code2,
    description: 'Find and replace using regular expressions',
    example: 'Replace patterns with custom text'
  }
];

export function BulkRenameDialog({
  isOpen,
  onClose,
  onConfirm,
  selectedItems
}: BulkRenameDialogProps) {
  const [renameType, setRenameType] = useState('prefix');
  const [renamePattern, setRenamePattern] = useState('');
  const [regexPattern, setRegexPattern] = useState('');
  const [regexReplacement, setRegexReplacement] = useState('');
  const [regexFlags, setRegexFlags] = useState('g');
  const [showRegexGuide, setShowRegexGuide] = useState(false);

  const fileCount = selectedItems.filter(item => item.type === 'file').length;
  const folderCount = selectedItems.filter(item => item.type === 'folder').length;

  const getPreviewName = (originalName: string, index: number = 0) => {
    if (renameType === 'regex') {
      if (!regexPattern.trim()) return originalName;
      
      try {
        const regex = new RegExp(regexPattern, regexFlags);
        return originalName.replace(regex, regexReplacement);
      } catch (error) {
        return `[Invalid Regex] ${originalName}`;
      }
    }

    if (!renamePattern.trim() && renameType !== 'timestamp') return originalName;

    const fileExtension = originalName.includes('.') ? 
      originalName.substring(originalName.lastIndexOf('.')) : '';
    const baseName = fileExtension ? 
      originalName.substring(0, originalName.lastIndexOf('.')) : originalName;

    switch (renameType) {
      case 'prefix':
        return `${renamePattern}_${originalName}`;
      
      case 'suffix':
        return fileExtension ? 
          `${baseName}_${renamePattern}${fileExtension}` : 
          `${originalName}_${renamePattern}`;
      
      case 'numbering':
        const number = String(index + 1).padStart(3, '0');
        return fileExtension ? 
          `${renamePattern}_${number}${fileExtension}` : 
          `${renamePattern}_${number}`;
      
      case 'timestamp':
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 16).replace('T', '_').replace(':', '-');
        return fileExtension ? 
          `${baseName}_${timestamp}${fileExtension}` : 
          `${originalName}_${timestamp}`;
      
      default:
        return originalName;
    }
  };

  const handleRename = () => {
    if (renameType === 'regex') {
      if (regexPattern.trim()) {
        // Pass regex data as JSON string in the pattern parameter
        const regexData = JSON.stringify({
          pattern: regexPattern.trim(),
          replacement: regexReplacement,
          flags: regexFlags
        });
        onConfirm(regexData, renameType);
      }
    } else if (renamePattern.trim() || renameType === 'timestamp') {
      onConfirm(renamePattern.trim(), renameType);
    }
  };

  const selectedRenameType = RENAME_TYPES.find(type => type.id === renameType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Edit3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <div className="text-lg font-semibold">Bulk Rename</div>
              <div className="text-sm font-normal text-muted-foreground">
                Rename multiple items at once
              </div>
            </div>
          </DialogTitle>
          <DialogDescription className="space-y-4 pt-2">
            <div className="text-base">
              Rename <span className="font-semibold">{selectedItems.length}</span> item{selectedItems.length > 1 ? 's' : ''} using a consistent pattern.
            </div>
            
            <div className="flex flex-wrap gap-2">
              {fileCount > 0 && (
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                  {fileCount} file{fileCount > 1 ? 's' : ''}
                </Badge>
              )}
              {folderCount > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100">
                  {folderCount} folder{folderCount > 1 ? 's' : ''}
                </Badge>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold">Rename Type:</Label>
                <RadioGroup
                  value={renameType}
                  onValueChange={setRenameType}
                  className="mt-2 space-y-3"
                >
                  {RENAME_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <div key={type.id} className="flex items-start space-x-3">
                        <RadioGroupItem 
                          value={type.id} 
                          id={type.id} 
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={type.id}
                            className="flex items-center gap-2 text-sm font-medium cursor-pointer"
                          >
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </Label>
                          <div className="text-xs text-muted-foreground mt-1">
                            {type.description}
                          </div>
                          <div className="text-xs text-green-600 dark:text-green-400 mt-1 font-mono">
                            Example: {type.example}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>

              {renameType === 'regex' ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">Regex Configuration:</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegexGuide(!showRegexGuide)}
                      className="text-xs"
                    >
                      <HelpCircle className="h-3 w-3 mr-1" />
                      Guide
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="regex-pattern" className="text-xs font-medium text-muted-foreground">
                        Find Pattern (Regex):
                      </Label>
                      <Input
                        id="regex-pattern"
                        value={regexPattern}
                        onChange={(e) => setRegexPattern(e.target.value)}
                        placeholder="e.g., \d{4} or [A-Z]+ or \s+"
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="regex-replacement" className="text-xs font-medium text-muted-foreground">
                        Replace With:
                      </Label>
                      <Input
                        id="regex-replacement"
                        value={regexReplacement}
                        onChange={(e) => setRegexReplacement(e.target.value)}
                        placeholder="e.g., NewText or $1 or leave empty to remove"
                        className="font-mono text-sm"
                      />
                    </div>

                    <div>
                      <Label htmlFor="regex-flags" className="text-xs font-medium text-muted-foreground">
                        Flags:
                      </Label>
                      <Input
                        id="regex-flags"
                        value={regexFlags}
                        onChange={(e) => setRegexFlags(e.target.value)}
                        placeholder="g, i, m, etc."
                        className="font-mono text-sm"
                        maxLength={10}
                      />
                      <div className="text-xs text-muted-foreground mt-1">
                        g = global, i = case insensitive, m = multiline
                      </div>
                    </div>
                  </div>

                  {showRegexGuide && (
                    <div className="rounded-lg border bg-slate-50 dark:bg-slate-900/50 p-4 space-y-3">
                      <div className="font-semibold text-sm">Regex Guide for Beginners:</div>
                      
                      <div className="space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="font-medium text-green-600 dark:text-green-400">Common Patterns:</div>
                            <div className="space-y-1 mt-1">
                              <div><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\d+</code> - Numbers</div>
                              <div><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">[A-Z]+</code> - Uppercase letters</div>
                              <div><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">[a-z]+</code> - Lowercase letters</div>
                              <div><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\s+</code> - Spaces</div>
                              <div><code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">_+</code> - Underscores</div>
                            </div>
                          </div>
                          
                          <div>
                            <div className="font-medium text-blue-600 dark:text-blue-400">Examples:</div>
                            <div className="space-y-1 mt-1">
                              <div><strong>Remove numbers:</strong></div>
                              <div>Find: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\d+</code>, Replace: <em>(empty)</em></div>
                              <div><strong>Replace spaces with dashes:</strong></div>
                              <div>Find: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\s+</code>, Replace: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">-</code></div>
                              <div><strong>Remove file extension:</strong></div>
                              <div>Find: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded">\.[^.]+$</code>, Replace: <em>(empty)</em></div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="border-t pt-2 mt-3">
                          <div className="font-medium text-amber-600 dark:text-amber-400">Pro Tips:</div>
                          <div className="space-y-1 mt-1">
                            <div>• Use parentheses () to capture groups, then reference with $1, $2, etc.</div>
                            <div>• Add 'i' flag for case-insensitive matching</div>
                            <div>• Test your regex on a few files first before applying to all</div>
                            <div>• Escape special characters with backslash: \. \+ \* \? \[ \] \( \)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : renameType !== 'timestamp' && (
                <div className="space-y-2">
                  <Label htmlFor="rename-pattern" className="text-sm font-semibold">
                    {renameType === 'numbering' ? 'Base Name:' : 'Text to Add:'}
                  </Label>
                  <Input
                    id="rename-pattern"
                    value={renamePattern}
                    onChange={(e) => setRenamePattern(e.target.value)}
                    placeholder={
                      renameType === 'prefix' ? 'Enter prefix text...' :
                      renameType === 'suffix' ? 'Enter suffix text...' :
                      'Enter base name for numbering...'
                    }
                    className="w-full"
                  />
                </div>
              )}

              {/* Preview section */}
              {(renamePattern.trim() || renameType === 'timestamp' || (renameType === 'regex' && regexPattern.trim())) && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-semibold">Preview:</span>
                  </div>
                  
                  <div className="rounded-md bg-slate-50 dark:bg-slate-900/50 p-3 max-h-32 overflow-y-auto">
                    <ul className="text-sm space-y-1">
                      {selectedItems.slice(0, 3).map((item, index) => (
                        <li key={item.id} className="space-y-1">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />
                            <span className="truncate text-xs">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <span className="text-xs text-green-600 dark:text-green-400">→</span>
                            <span className="truncate font-medium">{getPreviewName(item.name, index)}</span>
                          </div>
                        </li>
                      ))}
                      {selectedItems.length > 3 && (
                        <li className="flex items-center gap-2 text-muted-foreground/70 italic">
                          <div className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                          and {selectedItems.length - 3} more items...
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  Renaming cannot be undone. Please review the preview carefully before proceeding.
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 p-3 border border-orange-200 dark:border-orange-800">
                <div className="h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>
                <div className="text-sm text-orange-800 dark:text-orange-200">
                  All selected items will be renamed according to the chosen pattern.
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button 
            onClick={handleRename}
            disabled={
              renameType === 'regex' 
                ? !regexPattern.trim() 
                : !renamePattern.trim() && renameType !== 'timestamp'
            }
            className="w-full sm:w-auto bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500 dark:bg-orange-700 dark:hover:bg-orange-800"
          >
            Rename {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}