
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FileTags } from '@/components/ui/file-tags';
import { SmartCategoryBadge } from '@/components/ui/smart-category-badge';
import { 
  Settings, 
  Tag, 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  RefreshCw,
  Filter
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrganizationSettings, TaggingRule } from '@/lib/google-drive/types';
import { toast } from 'sonner';

interface FileOrganizationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: OrganizationSettings;
  onSettingsChange: (settings: OrganizationSettings) => void;
  onReprocessFiles: () => void;
}

export function FileOrganizationPanel({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  onReprocessFiles
}: FileOrganizationPanelProps) {
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<TaggingRule | null>(null);
  const [newRule, setNewRule] = useState<Partial<TaggingRule>>({
    name: '',
    condition: {},
    tags: [],
    enabled: true,
    priority: 1
  });

  const handleSettingChange = (key: keyof OrganizationSettings, value: any) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  const handleAddRule = () => {
    if (!newRule.name || newRule.tags?.length === 0) {
      toast.error('Please provide a name and at least one tag for the rule');
      return;
    }

    const rule: TaggingRule = {
      id: Date.now().toString(),
      name: newRule.name,
      condition: newRule.condition || {},
      tags: newRule.tags || [],
      enabled: newRule.enabled || true,
      priority: newRule.priority || 1
    };

    handleSettingChange('customRules', [...settings.customRules, rule]);
    setIsAddingRule(false);
    setNewRule({ name: '', condition: {}, tags: [], enabled: true, priority: 1 });
    toast.success('Tagging rule added successfully');
  };

  const handleDeleteRule = (ruleId: string) => {
    handleSettingChange('customRules', settings.customRules.filter(rule => rule.id !== ruleId));
    toast.success('Tagging rule deleted');
  };

  const handleToggleRule = (ruleId: string) => {
    handleSettingChange('customRules', settings.customRules.map(rule =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50">
      <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">File Organization</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          {/* Auto-organization Settings */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Auto-Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="auto-tagging">Auto-tagging</Label>
                <Switch
                  id="auto-tagging"
                  checked={settings.autoTagging}
                  onCheckedChange={(checked) => handleSettingChange('autoTagging', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="smart-categorization">Smart categorization</Label>
                <Switch
                  id="smart-categorization"
                  checked={settings.smartCategorization}
                  onCheckedChange={(checked) => handleSettingChange('smartCategorization', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="tag-suggestions">Tag suggestions</Label>
                <Switch
                  id="tag-suggestions"
                  checked={settings.tagSuggestions}
                  onCheckedChange={(checked) => handleSettingChange('tagSuggestions', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="duplicate-detection">Duplicate detection</Label>
                <Switch
                  id="duplicate-detection"
                  checked={settings.duplicateDetection}
                  onCheckedChange={(checked) => handleSettingChange('duplicateDetection', checked)}
                />
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                onClick={onReprocessFiles}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reprocess All Files
              </Button>
            </CardContent>
          </Card>

          {/* Custom Tagging Rules */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Custom Tagging Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsAddingRule(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>

              <div className="space-y-2">
                {settings.customRules.map((rule) => (
                  <div key={rule.id} className="border rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                          size="sm"
                        />
                        <span className="text-sm font-medium">{rule.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="h-6 w-6 p-0 text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {rule.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {rule.condition.fileName && (
                      <div className="text-xs text-muted-foreground">
                        Filename: {rule.condition.fileName.toString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Rule Dialog */}
          <Dialog open={isAddingRule} onOpenChange={setIsAddingRule}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Tagging Rule</DialogTitle>
                <DialogDescription>
                  Create a custom rule to automatically tag files based on conditions.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rule-name">Rule Name</Label>
                  <Input
                    id="rule-name"
                    value={newRule.name || ''}
                    onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                    placeholder="e.g., Project Documents"
                  />
                </div>

                <div>
                  <Label htmlFor="filename-pattern">Filename Pattern (optional)</Label>
                  <Input
                    id="filename-pattern"
                    value={newRule.condition?.fileName?.toString() || ''}
                    onChange={(e) => setNewRule({
                      ...newRule, 
                      condition: {...newRule.condition, fileName: e.target.value}
                    })}
                    placeholder="e.g., project-*, *.pdf"
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (comma separated)</Label>
                  <Input
                    id="tags"
                    value={newRule.tags?.join(', ') || ''}
                    onChange={(e) => setNewRule({
                      ...newRule, 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="e.g., project, important, work"
                  />
                </div>

                <div>
                  <Label htmlFor="priority">Priority (1-10)</Label>
                  <Input
                    id="priority"
                    type="number"
                    min="1"
                    max="10"
                    value={newRule.priority || 1}
                    onChange={(e) => setNewRule({...newRule, priority: parseInt(e.target.value)})}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingRule(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddRule}>
                  <Save className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
}
