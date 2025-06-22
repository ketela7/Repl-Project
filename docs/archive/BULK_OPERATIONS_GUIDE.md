# Bulk Operations Guide

## Overview

The Google Drive Management Application includes a comprehensive bulk operations system that allows users to perform multiple file operations simultaneously with intelligent progress tracking and error handling.

## Features

### 1. Bulk Selection Mode

**Activation**: Click the floating selection button (bottom-left corner)
- **Multi-select**: Click on files/folders to add to selection
- **Select All**: Use the checkbox button to select all visible items
- **Visual Feedback**: Selected items are highlighted with blue border
- **Selection Counter**: Shows "X of Y selected" badge

### 2. Bulk Download

**Purpose**: Download multiple files simultaneously with intelligent processing
- **Performance**: Parallel processing in batches of up to 5 files for faster completion
- **Smart Preview**: Shows exactly how many files will download vs skip before starting
- **File Filtering**: Only files can be downloaded (folders automatically skipped)
- **Smart Skip Logic**: 
  - Folders skipped with reason "Folders cannot be downloaded (only individual files)"
  - Google Workspace files skipped with suggestion to use Export feature
  - Restricted files skipped with permission message
- **Progress Tracking**: Real-time progress with time remaining estimates
- **Error Handling**: Failed downloads can be retried individually
- **Rate Limiting**: 200ms delays between batches to prevent browser overload

### 3. Bulk Export

**Purpose**: Export Google Workspace files to various formats
- **Supported Files**: Docs, Sheets, Slides, Drawings
- **Export Formats**:
  - PDF (universal format for all workspace files)
  - DOCX (Google Docs only)
  - XLSX (Google Sheets only)
  - PPTX (Google Slides only)
  - ODT/ODS (OpenDocument formats)
  - PNG/JPEG (Google Drawings only)
- **Smart Filtering**: Shows only compatible files for selected format
- **Automatic Download**: Exported files download automatically

### 4. Bulk Rename

**Purpose**: Rename multiple items using consistent patterns
- **Rename Types**:
  - **Prefix**: Add text before existing name
  - **Suffix**: Add text before file extension
  - **Sequential Numbering**: Replace with pattern + numbers (001, 002, etc.)
  - **Timestamp**: Add current date/time stamp
- **Live Preview**: Shows how names will look before applying
- **Extension Preservation**: File extensions are preserved automatically

### 5. Bulk Move

**Purpose**: Move multiple items to a new folder
- **Folder Selection**: Interactive folder picker dialog
- **Mixed Selection**: Supports both files and folders
- **Progress Tracking**: Shows current item being moved
- **Error Recovery**: Failed moves are reported individually

### 6. Bulk Copy

**Purpose**: Create copies of multiple files
- **File Only**: Only files can be copied (API limitation)
- **Automatic Naming**: Copies are named "Copy of [original name]"
- **Target Selection**: Choose destination folder
- **Folder Handling**: Folders in selection are skipped with warning

### 7. Bulk Delete (Move to Trash)

**Purpose**: Move multiple items to Google Drive trash
- **Confirmation Dialog**: Shows detailed list of items to be deleted
- **Reversible Action**: Items can be restored from trash
- **Mixed Types**: Supports both files and folders
- **Batch Processing**: Items processed sequentially with rate limiting

### 8. Bulk Restore (From Trash)

**Purpose**: Restore multiple items from trash
- **Original Location**: Items restored to original parent folder
- **Orphaned Items**: If parent was deleted, items go to Drive root
- **Confirmation**: Shows items to be restored
- **Available Only**: Only in trash view (when viewing trashed items)

### 9. Bulk Permanent Delete

**Purpose**: Permanently delete items (cannot be undone)
- **Enhanced Security**: 
  - Requires typing "permanently delete" to confirm
  - Must acknowledge warning checkbox
  - Shows detailed preview of deletion impact
- **Irreversible**: No recovery option available
- **High-risk Operation**: Multiple confirmation steps required

## User Interface

### Floating Action Toolbar

**Location**: Bottom-left corner of the screen
- **Selection Mode Toggle**: Round button to enter/exit selection mode
- **Actions Menu**: Dropdown with all available bulk operations
- **Context Aware**: Shows different options based on current view (normal vs trash)
- **Progress Display**: Shows operation progress when running

### Context-Aware Options

**Normal View**:
- Download Files
- Export As...
- Bulk Rename
- Move Items
- Copy Items
- Move to Trash

**Trash View**:
- Restore Items
- Permanently Delete

### Progress Tracking

**Visual Indicators**:
- Progress bar showing completion percentage
- Current/total item counter
- Operation description
- Estimated completion status

## Technical Implementation

### Performance Optimizations (Phase 1 Complete)

- **Intelligent Processing**: Automatic detection between parallel and sequential processing
- **Parallel Execution**: Safe operations (download, copy, share) run in batches of up to 5 items
- **Adaptive Batching**: Batch size optimizes based on operation type and item count
- **Rate Limiting**: 200ms delays between batches, 300ms for sequential operations
- **Memory Management**: Efficient blob handling with controlled concurrency
- **Database Logging**: All operations logged to database for audit trail

### Enhanced User Experience (Phase 1 Complete)

- **Operation Preview**: Shows exactly what will happen before execution
  - Number of items to process vs skip
  - Estimated completion time
  - Detailed skip reasons grouped by type
- **Real-time Progress**: Enhanced progress tracking with time remaining estimates
- **Performance Metrics**: Completion reports include total time and average per item
- **Retry Functionality**: Failed operations can be retried with just failed items
- **Operation History**: Previous operations stored for retry capability

### Smart Error Handling

- **Pre-filtering**: Items filtered before execution to prevent unnecessary API calls
- **Individual Tracking**: Each item's success/failure tracked separately
- **Smart Skip Logic**: Items automatically skipped with clear reasons:
  - Folders cannot be downloaded (only individual files supported)
  - Google Workspace files require export instead of download
  - Items already in trash cannot be trashed again
  - Items not in trash cannot be restored
  - Folders cannot be copied due to API limitations
  - Items in trash cannot be shared
- **Grouped Feedback**: Error messages grouped by type with affected item names
- **Retry Guidance**: Automatic suggestions for retrying failed operations
- **Activity Logging**: All operations saved to database with timestamps and user info

### Security Features

- **Confirmation Dialogs**: All destructive operations require confirmation
- **Enhanced Security**: Permanent delete requires multiple confirmations
- **Data Validation**: Input validation for rename patterns
- **Access Control**: Operations respect Google Drive permissions

## Best Practices

### For Users

1. **Start Small**: Test bulk operations with a few items first
2. **Check Selection**: Review selected items before proceeding
3. **Stable Connection**: Ensure stable internet for large operations
4. **Monitor Progress**: Watch progress indicators for status updates
5. **Review Results**: Check completion messages for any errors

### For Administrators

1. **Rate Limiting**: Operations include built-in rate limiting
2. **Error Logging**: All errors are logged to browser console
3. **Performance Monitoring**: Progress tracking helps identify bottlenecks
4. **User Education**: Train users on bulk operation capabilities

## Troubleshooting

### Common Issues

**Bulk Operation Fails**:
- Check internet connection
- Verify Google Drive permissions
- Try smaller batch sizes

**Some Items Skip**:
- Check file types (e.g., folders can't be copied)
- Verify item permissions
- Ensure items still exist

**Slow Performance**:
- Rate limiting is intentional to prevent API overload
- Large operations take time for stability
- Progress bar shows current status

**Export Not Working**:
- Only Google Workspace files can be exported
- Check if files are in supported format
- Verify export format compatibility

## API Integration

### Endpoints Used

- `GET /api/drive/files` - File listing
- `PUT /api/drive/files/{id}` - Rename, move to trash, restore
- `POST /api/drive/files/{id}/copy` - Copy files
- `GET /api/drive/files/{id}/export` - Export workspace files
- `DELETE /api/drive/files/{id}` - Permanent delete

### Rate Limiting

All bulk operations include appropriate delays:
- File operations: 300ms between items
- Downloads: 500ms between files
- Exports: 500ms between conversions

This ensures API stability and prevents rate limit errors.