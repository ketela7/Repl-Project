import React from 'react'
import { X, Plus, Tag, Sparkles } from 'lucide-react'

import { cn } from '@/shared/utils'

import { Badge } from './badge'
import { Button } from './button'
import { Input } from './input'

interface FileTagsProps {
  autoTags?: string[]
  manualTags?: string[]
  suggestions?: string[]
  onAddTag?: (tag: string) => void
  onRemoveTag?: (tag: string) => void
  onAcceptSuggestion?: (tag: string) => void
  editable?: boolean
  className?: string
}

export function FileTags({
  autoTags = [],
  manualTags = [],
  suggestions = [],
  onAddTag,
  onRemoveTag,
  onAcceptSuggestion,
  editable = false,
  className,
}: FileTagsProps) {
  const [isAddingTag, setIsAddingTag] = React.useState(false)
  const [newTag, setNewTag] = React.useState('')

  const handleAddTag = () => {
    if (newTag.trim() && onAddTag) {
      onAddTag(newTag.trim().toLowerCase())
      setNewTag('')
      setIsAddingTag(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag()
    } else if (e.key === 'Escape') {
      setIsAddingTag(false)
      setNewTag('')
    }
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Auto Tags */}
      {autoTags.length > 0 && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Sparkles className="h-3 w-3" />
            Auto-generated tags
          </div>
          <div className="flex flex-wrap gap-1">
            {autoTags.map((tag) => (
              <Badge
                key={`auto-${tag}`}
                variant="secondary"
                className="border-blue-200 bg-blue-50 text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Manual Tags */}
      {(manualTags.length > 0 || editable) && (
        <div className="space-y-2">
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <Tag className="h-3 w-3" />
            Your tags
          </div>
          <div className="flex flex-wrap gap-1">
            {manualTags.map((tag) => (
              <Badge
                key={`manual-${tag}`}
                variant="default"
                className="border-green-200 bg-green-50 text-xs text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
              >
                {tag}
                {editable && onRemoveTag && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-3 w-3 p-0 hover:bg-green-200 dark:hover:bg-green-800"
                    onClick={() => onRemoveTag(tag)}
                  >
                    <X className="h-2 w-2" />
                  </Button>
                )}
              </Badge>
            ))}

            {editable && (
              <>
                {isAddingTag ? (
                  <div className="flex items-center gap-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={handleKeyPress}
                      onBlur={() => {
                        if (!newTag.trim()) {
                          setIsAddingTag(false)
                        }
                      }}
                      placeholder="Enter tag..."
                      className="h-6 w-20 px-2 text-xs"
                      autoFocus
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={handleAddTag}
                      disabled={!newTag.trim()}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 border-dashed px-2 text-xs"
                    onClick={() => setIsAddingTag(true)}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Add tag
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Suggested Tags */}
      {suggestions.length > 0 && editable && (
        <div className="space-y-2">
          <div className="text-muted-foreground text-sm">Suggested tags</div>
          <div className="flex flex-wrap gap-1">
            {suggestions.slice(0, 6).map((tag) => (
              <Badge
                key={`suggestion-${tag}`}
                variant="outline"
                className="hover:bg-accent cursor-pointer border-dashed text-xs"
                onClick={() => onAcceptSuggestion?.(tag)}
              >
                <Plus className="mr-1 h-2 w-2" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
