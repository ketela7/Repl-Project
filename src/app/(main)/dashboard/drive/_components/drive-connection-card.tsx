"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HardDrive, Shield, Upload, Search, Folder } from "lucide-react";

export function DriveConnectionCard() {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    // Request additional Google Drive permissions without logout
    window.location.href = '/api/auth/google-drive';
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <HardDrive className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Grant Google Drive Access</CardTitle>
          <CardDescription className="text-base">
            Grant permission to access your Google Drive files and folders
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
              <p className="text-sm font-medium">Upload Files</p>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </div>
            <div className="text-center space-y-2">
              <Folder className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Organize Folders</p>
              <p className="text-xs text-muted-foreground">Create and manage folder structure</p>
            </div>
            <div className="text-center space-y-2">
              <Search className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Search Files</p>
              <p className="text-xs text-muted-foreground">Find files quickly with search</p>
            </div>
            <div className="text-center space-y-2">
              <Shield className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="text-sm font-medium">Secure Access</p>
              <p className="text-xs text-muted-foreground">Protected with OAuth 2.0</p>
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to grant Google Drive access. 
              You'll be redirected to Google to authorize permissions.
            </p>
            
            <Button 
              onClick={handleConnect} 
              disabled={connecting}
              size="lg"
              className="w-full"
            >
              {connecting ? (
                <>
                  <HardDrive className="h-4 w-4 mr-2 animate-pulse" />
                  Connecting...
                </>
              ) : (
                <>
                  <HardDrive className="h-4 w-4 mr-2" />
                  Grant Drive Access
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}