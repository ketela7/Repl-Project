const driveColumns: ColumnDef<DriveFile>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
      cell: ({ row }) => {
        const file = row.original;
        return (
          <div className="flex items-center gap-3 min-w-0">
            <AnimatedThumbnail 
              file={file}
              className="flex-shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{file.name}</p>
              {file.mimeType === 'application/vnd.google-apps.folder' && (
                <p className="text-xs text-muted-foreground">Folder</p>
              )}
            </div>
          </div>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const nameA = rowA.original.name?.toLowerCase() || '';
        const nameB = rowB.original.name?.toLowerCase() || '';
        return nameA.localeCompare(nameB);
      },
    },
    {
      accessorKey: "size",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Size" />,
      cell: ({ row }) => {
        const size = row.original.size;
        return <span className="text-sm">{size ? formatFileSize(size) : '-'}</span>;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const sizeA = rowA.original.size || 0;
        const sizeB = rowB.original.size || 0;
        return sizeA - sizeB;
      },
    },
    {
      accessorKey: "mimeType",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
      cell: ({ row }) => {
        const file = row.original;
        const fileExtension = getFileExtension(file.name);
        const displayType = fileExtension || 
          (file.mimeType === 'application/vnd.google-apps.folder' ? 'Folder' : 
           file.mimeType?.split('/').pop() || 'Unknown');

        return (
          <Badge variant="outline" className="text-xs">
            {displayType}
          </Badge>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const getTypeForSorting = (file: DriveFile) => {
          if (file.mimeType === 'application/vnd.google-apps.folder') return 'folder';
          const extension = getFileExtension(file.name);
          return extension || file.mimeType?.split('/').pop() || 'unknown';
        };

        const typeA = getTypeForSorting(rowA.original).toLowerCase();
        const typeB = getTypeForSorting(rowB.original).toLowerCase();

        // Folders first, then by type
        if (typeA === 'folder' && typeB !== 'folder') return -1;
        if (typeA !== 'folder' && typeB === 'folder') return 1;

        return typeA.localeCompare(typeB);
      },
    },
    {
      accessorKey: "modifiedTime",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Modified" />,
      cell: ({ row }) => {
        const modifiedTime = row.original.modifiedTime;
        return <span className="text-sm">{formatDate(modifiedTime)}</span>;
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const dateA = rowA.original.modifiedTime ? new Date(rowA.original.modifiedTime).getTime() : 0;
        const dateB = rowB.original.modifiedTime ? new Date(rowB.original.modifiedTime).getTime() : 0;
        return dateA - dateB;
      },
    },
    {
      accessorKey: "owners",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Owner" />,
      cell: ({ row }) => {
        const owners = row.original.owners;
        const owner = owners?.[0];
        return (
          <span className="text-sm">
            {owner?.displayName || owner?.emailAddress || 'Unknown'}
          </span>
        );
      },
      enableSorting: true,
      sortingFn: (rowA, rowB) => {
        const getOwnerName = (file: DriveFile) => {
          const owner = file.owners?.[0];
          return (owner?.displayName || owner?.emailAddress || 'unknown').toLowerCase();
        };

        const ownerA = getOwnerName(rowA.original);
        const ownerB = getOwnerName(rowB.original);
        return ownerA.localeCompare(ownerB);
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const file = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleDownload(file)}>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {currentView !== 'trash' && (
                <>
                  <DropdownMenuItem onClick={() => handleRename(file)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMove(file)}>
                    <FolderOpen className="mr-2 h-4 w-4" />
                    Move
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCopy(file)}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => handleDelete(file)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Move to Trash
                  </DropdownMenuItem>
                </>
              )}
              {currentView === 'trash' && (
                <>
                  <DropdownMenuItem onClick={() => handleRestore(file)}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Restore
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handlePermanentDelete(file)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Forever
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
      enableSorting: false,
    },
  ];