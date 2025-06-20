import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDriveService } from '@/lib/google-drive/service';

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;
    const body = await request.json();
    const { action, role, type, emailAddress, message, allowFileDiscovery, expirationTime } = body;

    // Initialize Google Drive service
    const driveService = new GoogleDriveService();
    const accessToken = session.provider_token;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google Drive access token not found',
        needsReauth: true 
      }, { status: 401 });
    }

    let result;

    switch (action) {
      case 'get_share_link':
        // Get or create a shareable link
        try {
          // First, try to get existing permissions to see if it's already shared
          const existingPermissions = await driveService.getFilePermissions(fileId, accessToken);
          
          // Check if there's already a public link permission
          const publicPermission = existingPermissions?.find(p => 
            p.type === type && p.role === role
          );

          if (publicPermission) {
            // Get file details to return the webViewLink
            const fileDetails = await driveService.getFileDetails(fileId, accessToken);
            result = {
              webViewLink: fileDetails.webViewLink,
              webContentLink: fileDetails.webContentLink,
              permissionId: publicPermission.id,
              message: 'File is already shared with these settings'
            };
          } else {
            // Create new permission
            const permission = await driveService.createPermission(fileId, {
              type,
              role,
              allowFileDiscovery
            }, accessToken);

            // Get updated file details
            const fileDetails = await driveService.getFileDetails(fileId, accessToken);
            
            result = {
              webViewLink: fileDetails.webViewLink,
              webContentLink: fileDetails.webContentLink,
              permissionId: permission.id,
              message: 'Share link created successfully'
            };
          }
        } catch (error: any) {
          console.error('Error creating share link:', error);
          
          if (error.code === 403) {
            return NextResponse.json({ 
              error: 'Insufficient permissions to share this file',
              needsReauth: false 
            }, { status: 403 });
          }
          
          if (error.code === 401) {
            return NextResponse.json({ 
              error: 'Google Drive access expired',
              needsReauth: true 
            }, { status: 401 });
          }
          
          throw error;
        }
        break;

      case 'add_permission':
        // Add specific user permission
        try {
          const permission = await driveService.createPermission(fileId, {
            type,
            role,
            emailAddress,
            allowFileDiscovery,
            expirationTime
          }, accessToken);

          if (message) {
            await driveService.sendNotificationEmail(fileId, {
              emailAddress,
              message
            }, accessToken);
          }

          result = {
            permissionId: permission.id,
            message: 'Permission added successfully'
          };
        } catch (error: any) {
          console.error('Error adding permission:', error);
          
          if (error.code === 403) {
            return NextResponse.json({ 
              error: 'Insufficient permissions to share this file',
              needsReauth: false 
            }, { status: 403 });
          }
          
          if (error.code === 401) {
            return NextResponse.json({ 
              error: 'Google Drive access expired',
              needsReauth: true 
            }, { status: 401 });
          }
          
          throw error;
        }
        break;

      case 'remove_permission':
        // Remove specific permission
        try {
          await driveService.deletePermission(fileId, body.permissionId, accessToken);
          
          result = {
            message: 'Permission removed successfully'
          };
        } catch (error: any) {
          console.error('Error removing permission:', error);
          
          if (error.code === 403) {
            return NextResponse.json({ 
              error: 'Insufficient permissions to modify sharing settings',
              needsReauth: false 
            }, { status: 403 });
          }
          
          if (error.code === 401) {
            return NextResponse.json({ 
              error: 'Google Drive access expired',
              needsReauth: true 
            }, { status: 401 });
          }
          
          throw error;
        }
        break;

      default:
        return NextResponse.json({ 
          error: 'Invalid action specified' 
        }, { status: 400 });
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Share API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error during share operation' 
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = params;

    // Initialize Google Drive service
    const driveService = new GoogleDriveService();
    const accessToken = session.provider_token;
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Google Drive access token not found',
        needsReauth: true 
      }, { status: 401 });
    }

    try {
      // Get current permissions for the file
      const permissions = await driveService.getFilePermissions(fileId, accessToken);
      
      // Get file details for additional context
      const fileDetails = await driveService.getFileDetails(fileId, accessToken);
      
      return NextResponse.json({
        permissions,
        fileDetails: {
          webViewLink: fileDetails.webViewLink,
          webContentLink: fileDetails.webContentLink,
          shared: fileDetails.shared
        }
      });

    } catch (error: any) {
      console.error('Error fetching share details:', error);
      
      if (error.code === 403) {
        return NextResponse.json({ 
          error: 'Insufficient permissions to view sharing settings',
          needsReauth: false 
        }, { status: 403 });
      }
      
      if (error.code === 401) {
        return NextResponse.json({ 
          error: 'Google Drive access expired',
          needsReauth: true 
        }, { status: 401 });
      }
      
      throw error;
    }

  } catch (error) {
    console.error('Share details API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error while fetching share details' 
    }, { status: 500 });
  }
}