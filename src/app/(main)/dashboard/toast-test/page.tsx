'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  successToast,
  errorToast,
  warningToast,
  infoToast,
  loadingToast,
  toastUtils,
} from '@/components/ui/toast'
import { useState } from 'react'

export default function ToastTestPage() {
  const [operationRunning, setOperationRunning] = useState(false)

  const handleLongOperation = async () => {
    if (operationRunning) return
    setOperationRunning(true)

    try {
      await toastUtils.operation('Bulk File Operation', async () => {
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 3000))
        return { success: 8, total: 10 }
      })
    } catch (error) {
      // Error handled by toastUtils
    } finally {
      setOperationRunning(false)
    }
  }

  const handleDownloadTest = async () => {
    try {
      await toastUtils.download(async () => {
        // Simulate download
        await new Promise(resolve => setTimeout(resolve, 2000))
      }, 'test-document.pdf')
    } catch (error) {
      // Error handled by toastUtils
    }
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Toast Component Test</h1>
        <p className="text-muted-foreground">
          Test all toast notification types and styles available in the application
        </p>
      </div>

      <div className="grid gap-6">
        {/* Success Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Success Toasts</CardTitle>
            <CardDescription>
              Positive feedback notifications for successful operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.copied()}
              >
                Copy Success
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.downloaded('document.pdf')}
              >
                Download Success
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.uploaded(5)}
              >
                Upload Success
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.deleted(3)}
              >
                Delete Success
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.folderCreated('New Folder')}
              >
                Folder Created
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.shared(2)}
              >
                Share Success
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() => successToast.signedIn()}
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                className="border-green-200 text-green-600 hover:bg-green-50"
                onClick={() =>
                  successToast.generic('Custom success message', {
                    description: 'This is a custom success toast',
                  })
                }
              >
                Custom Success
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Error Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error Toasts</CardTitle>
            <CardDescription>Error notifications for failed operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.uploadFailed('large-file.mp4')}
              >
                Upload Failed
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.downloadFailed('document.pdf')}
              >
                Download Failed
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.deleteFailed(2)}
              >
                Delete Failed
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.authRequired()}
              >
                Auth Required
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.permissionDenied()}
              >
                Permission Denied
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.driveAccessDenied()}
              >
                Drive Access
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => errorToast.networkError()}
              >
                Network Error
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() =>
                  errorToast.generic('Custom error message', {
                    description: 'Something went wrong',
                  })
                }
              >
                Custom Error
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Warning Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-amber-600">Warning Toasts</CardTitle>
            <CardDescription>Warning notifications for potential issues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => warningToast.partialSuccess(8, 10, 'File sync')}
              >
                Partial Success
              </Button>
              <Button
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => warningToast.largeFileWarning('huge-video.mp4')}
              >
                Large File
              </Button>
              <Button
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() => warningToast.quotaWarning()}
              >
                Quota Warning
              </Button>
              <Button
                variant="outline"
                className="border-amber-200 text-amber-600 hover:bg-amber-50"
                onClick={() =>
                  warningToast.generic('Custom warning', {
                    description: 'This is a warning message',
                  })
                }
              >
                Custom Warning
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-blue-600">Info Toasts</CardTitle>
            <CardDescription>Informational notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => infoToast.processing('Upload', 5)}
              >
                Processing
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => infoToast.syncStarted()}
              >
                Sync Started
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() => infoToast.offlineMode()}
              >
                Offline Mode
              </Button>
              <Button
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
                onClick={() =>
                  infoToast.generic('Custom info', { description: 'This is an info message' })
                }
              >
                Custom Info
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading Toasts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-purple-600">Loading & Progress Toasts</CardTitle>
            <CardDescription>Loading indicators and progress notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => {
                  const id = 'test-loading'
                  loadingToast.start('Loading...', id)
                  setTimeout(() => loadingToast.success('Loaded successfully!', id), 2000)
                }}
              >
                Loading → Success
              </Button>
              <Button
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={() => {
                  const id = 'test-loading-error'
                  loadingToast.start('Processing...', id)
                  setTimeout(() => loadingToast.error('Process failed!', id), 2000)
                }}
              >
                Loading → Error
              </Button>
              <Button
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={handleDownloadTest}
              >
                Download Test
              </Button>
              <Button
                variant="outline"
                className="border-purple-200 text-purple-600 hover:bg-purple-50"
                onClick={handleLongOperation}
                disabled={operationRunning}
              >
                {operationRunning ? 'Running...' : 'Bulk Operation'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Utility Functions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-indigo-600">Utility Functions</CardTitle>
            <CardDescription>Built-in utility functions for common operations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => toastUtils.clipboard('This text was copied to clipboard!')}
              >
                Copy to Clipboard
              </Button>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => {
                  const id = 'multi-step'
                  loadingToast.start('Step 1: Preparing...', id)
                  setTimeout(() => loadingToast.update('Step 2: Processing...', id), 1000)
                  setTimeout(() => loadingToast.update('Step 3: Finalizing...', id), 2000)
                  setTimeout(() => loadingToast.success('All steps completed!', id), 3000)
                }}
              >
                Multi-Step Process
              </Button>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => {
                  const id = 'dismissible'
                  loadingToast.start('Long running task...', id)
                  setTimeout(() => loadingToast.dismiss(id), 2000)
                }}
              >
                Dismissible Toast
              </Button>
              <Button
                variant="outline"
                className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={() => {
                  successToast.bulkOperation('File sync', 15, 20)
                }}
              >
                Bulk Operation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <p className="text-muted-foreground mb-4">
          Toast notifications appear in the top-right corner of the screen
        </p>
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              successToast.generic('Success!')
              setTimeout(() => errorToast.generic('Error!'), 500)
              setTimeout(() => warningToast.generic('Warning!'), 1000)
              setTimeout(() => infoToast.generic('Info!'), 1500)
            }}
          >
            Show All Types
          </Button>
        </div>
      </div>
    </div>
  )
}
