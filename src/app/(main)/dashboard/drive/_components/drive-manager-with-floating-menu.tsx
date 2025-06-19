"use client";

import React from 'react';
import { FloatingMenuProvider } from '@/components/floating-menu';
import { DriveManager } from './drive-manager';

export function DriveManagerWithFloatingMenu() {
  return (
    <FloatingMenuProvider>
      <DriveManager />
    </FloatingMenuProvider>
  );
}