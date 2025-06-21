"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function LocalStorageDebug() {
  const [localStorageData, setLocalStorageData] = useState<Record<string, string>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    checkLocalStorage();
  }, []);

  const checkLocalStorage = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const data: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          data[key] = localStorage.getItem(key) || '';
        }
      }
      setLocalStorageData(data);
      console.log("[LocalStorage Debug] Current localStorage:", data);
    }
  };

  const testRememberMe = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('rememberMe', 'true');
        console.log("[Debug] Set rememberMe to true");
        checkLocalStorage();
      } catch (error) {
        console.error("[Debug] Failed to set rememberMe:", error);
      }
    }
  };

  const clearRememberMe = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('rememberMe');
      console.log("[Debug] Removed rememberMe");
      checkLocalStorage();
    }
  };

  const clearAllLocalStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
      console.log("[Debug] Cleared all localStorage");
      checkLocalStorage();
    }
  };

  if (!isClient) {
    return <div>Loading localStorage debug...</div>;
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>LocalStorage Debug</CardTitle>
        <CardDescription>Debug tool untuk testing Remember Me</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Current localStorage:</h4>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {Object.keys(localStorageData).length === 0 
              ? "Empty" 
              : JSON.stringify(localStorageData, null, 2)
            }
          </pre>
        </div>
        
        <div className="space-y-2">
          <Button onClick={testRememberMe} variant="outline" size="sm" className="w-full">
            Set rememberMe = true
          </Button>
          <Button onClick={clearRememberMe} variant="outline" size="sm" className="w-full">
            Remove rememberMe
          </Button>
          <Button onClick={checkLocalStorage} variant="outline" size="sm" className="w-full">
            Refresh Data
          </Button>
          <Button onClick={clearAllLocalStorage} variant="destructive" size="sm" className="w-full">
            Clear All
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <p>Remember Me value: <strong>{localStorageData.rememberMe || 'not set'}</strong></p>
          <p>localStorage supported: <strong>{typeof window !== 'undefined' && !!window.localStorage ? 'Yes' : 'No'}</strong></p>
        </div>
      </CardContent>
    </Card>
  );
}