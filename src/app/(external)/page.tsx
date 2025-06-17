import { AuthStatus } from "@/components/auth/auth-status";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileIcon } from "@/components/file-icon";
import { fileTypeUtils } from "@/lib/google-drive/utils";

export default function Home() {
  // Showcase enhanced features
  const featuresDemo = [
    { type: "application/vnd.google-apps.document", label: "Google Docs" },
    { type: "image/jpeg", label: "Images" },
    { type: "video/mp4", label: "Videos" },
    { type: "application/pdf", label: "PDF Files" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-8">
          
          {/* Main Header */}
          <div className="text-center space-y-4 max-w-2xl">
            <Badge variant="secondary" className="mb-4">
              Professional Google Drive Manager
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Drive Management
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              Enhanced cross-platform file management with professional UI design
            </p>
          </div>

          {/* Features Showcase */}
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-center">Enhanced File Type Support</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {featuresDemo.map((item, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <FileIcon 
                      mimeType={item.type} 
                      size="lg" 
                      animated 
                      showBackground 
                    />
                    <span className="text-sm font-medium">{item.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {fileTypeUtils.getCategory(item.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-center">Get Started</CardTitle>
            </CardHeader>
            <CardContent>
              <AuthStatus />
            </CardContent>
          </Card>

          {/* Cross-platform indicators */}
          <div className="text-center space-y-2 opacity-75">
            <p className="text-sm text-muted-foreground">
              Optimized for desktop, tablet, and mobile devices
            </p>
            <div className="flex justify-center space-x-4 text-xs text-muted-foreground">
              <span>📱 Touch-friendly</span>
              <span>🎨 High DPI ready</span>
              <span>♿ Accessible</span>
              <span>🌐 Cross-platform</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
