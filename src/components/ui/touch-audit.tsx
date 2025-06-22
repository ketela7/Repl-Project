"use client";

import { useEffect, useState } from "react";
import { auditTouchTargets, TOUCH_TARGETS } from "@/lib/mobile-optimization";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TouchAuditResult {
  compliant: boolean;
  issues: string[];
  suggestions: string[];
  totalElements: number;
  compliantElements: number;
}

export function TouchAuditPanel() {
  const [auditResult, setAuditResult] = useState<TouchAuditResult | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);

  const runAudit = () => {
    setIsAuditing(true);
    
    // Small delay to show loading state
    setTimeout(() => {
      const result = auditTouchTargets(document.body);
      const interactiveElements = document.querySelectorAll('button, a, input, [role="button"], [tabindex]');
      
      setAuditResult({
        ...result,
        totalElements: interactiveElements.length,
        compliantElements: interactiveElements.length - result.issues.length,
      });
      
      setIsAuditing(false);
    }, 500);
  };

  useEffect(() => {
    // Auto-run audit on mount in development
    if (process.env.NODE_ENV === 'development') {
      runAudit();
    }
  }, []);

  if (process.env.NODE_ENV === 'production') {
    return null; // Hide in production
  }

  return (
    <Card className="fixed bottom-4 right-4 w-80 max-h-96 overflow-hidden shadow-lg z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4" />
          Touch Target Audit
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <Button 
          onClick={runAudit} 
          disabled={isAuditing}
          size="sm"
          className="w-full"
        >
          {isAuditing ? "Auditing..." : "Run Audit"}
        </Button>

        {auditResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {auditResult.compliant ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              )}
              <Badge variant={auditResult.compliant ? "default" : "destructive"}>
                {auditResult.compliant ? "Compliant" : "Issues Found"}
              </Badge>
            </div>

            <div className="text-xs space-y-1">
              <div>Total Elements: {auditResult.totalElements}</div>
              <div>Compliant: {auditResult.compliantElements}</div>
              <div>Non-compliant: {auditResult.issues.length}</div>
              <div>Target Size: {TOUCH_TARGETS.MINIMUM}px minimum</div>
            </div>

            {auditResult.issues.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-destructive">Issues:</div>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {auditResult.issues.slice(0, 5).map((issue, index) => (
                    <div key={index} className="text-xs p-2 bg-destructive/10 rounded text-destructive">
                      {issue}
                    </div>
                  ))}
                  {auditResult.issues.length > 5 && (
                    <div className="text-xs text-muted-foreground">
                      +{auditResult.issues.length - 5} more issues
                    </div>
                  )}
                </div>
              </div>
            )}

            {auditResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-orange-600">Suggestions:</div>
                <div className="max-h-24 overflow-y-auto">
                  {auditResult.suggestions.slice(0, 3).map((suggestion, index) => (
                    <div key={index} className="text-xs p-2 bg-orange-50 rounded text-orange-800">
                      {suggestion}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}