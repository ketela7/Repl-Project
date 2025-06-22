import React from 'react';

export function DriveLoadingSkeleton() {
  return (
    <div className="space-y-4 p-6">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex space-x-2">
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-24 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Toolbar skeleton */}
      <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded">
        <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
      
      {/* File list skeleton */}
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-3 border rounded">
            <div className="h-6 w-6 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-8 bg-gray-200 rounded animate-pulse"></div>
            <div className="flex-1 space-y-1">
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-3 w-1/2 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InitialLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-6 w-6 bg-blue-600 rounded-full animate-pulse"></div>
          </div>
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-800">Loading Google Drive</h3>
          <p className="text-sm text-gray-600">Initializing file management interface...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '45%' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}