const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const query = searchParams.get('query');
    const mimeType = searchParams.get('mimeType');
    const pageToken = searchParams.get('pageToken');
    const pageSize = parseInt(searchParams.get('pageSize') || '20'); // Reduced default page size
    const view = searchParams.get('view');
    const fileTypes = searchParams.get('fileTypes');

// Build Google Drive API query
    let driveQuery = "trashed=false";

    // Handle view filters
    if (view === 'my-drive') {
      driveQuery += " and 'me' in owners";
    } else if (view === 'shared') {
      driveQuery += " and sharedWithMe=true";
    } else if (view === 'starred') {
      driveQuery += " and starred=true";
    } else if (view === 'recent') {
      // Get files accessed in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      driveQuery += ` and viewedByMeTime > '${thirtyDaysAgo.toISOString()}'`;
    } else if (view === 'trash') {
      driveQuery = "trashed=true"; // Override the default trashed=false
    }

    if (parentId && view !== 'shared' && view !== 'starred' && view !== 'recent') {
      driveQuery += ` and '${parentId}' in parents`;
    } else if (!query && !parentId && view !== 'shared' && view !== 'starred' && view !== 'recent' && view !== 'trash') {
      // If no parent and no search query, get root files
      driveQuery += " and 'root' in parents";
    }

    if (query) {
      driveQuery += ` and name contains '${query.replace(/'/g, "\\'")}'`;
    }

    if (mimeType) {
      driveQuery += ` and mimeType='${mimeType}'`;
    }

    // Handle file type filters
    if (fileTypes) {
      const types = fileTypes.split(',').filter(Boolean);
      const mimeTypeConditions: string[] = [];

      types.forEach(type => {
        switch (type.toLowerCase()) {
          case 'folder':
            mimeTypeConditions.push("mimeType='application/vnd.google-apps.folder'");
            break;
          case 'document':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.document' or mimeType='application/pdf' or mimeType='text/plain' or mimeType='application/msword' or mimeType='application/vnd.openxmlformats-officedocument.wordprocessingml.document')");
            break;
          case 'spreadsheet':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.spreadsheet' or mimeType='application/vnd.ms-excel' or mimeType='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')");
            break;
          case 'presentation':
            mimeTypeConditions.push("(mimeType='application/vnd.google-apps.presentation' or mimeType='application/vnd.ms-powerpoint' or mimeType='application/vnd.openxmlformats-officedocument.presentationml.presentation')");
            break;
          case 'image':
            mimeTypeConditions.push("(mimeType contains 'image/')");
            break;
          case 'video':
            mimeTypeConditions.push("(mimeType contains 'video/')");
            break;
          case 'audio':
            mimeTypeConditions.push("(mimeType contains 'audio/')");
            break;
          case 'archive':
            mimeTypeConditions.push("(mimeType='application/zip' or mimeType='application/x-rar-compressed' or mimeType='application/x-tar' or mimeType='application/gzip' or mimeType='application/x-7z-compressed')");
            break;
        }
      });

      if (mimeTypeConditions.length > 0) {
        driveQuery += ` and (${mimeTypeConditions.join(' or ')})`;
      }
    }