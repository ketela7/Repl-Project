import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Shield, Zap, Users, Globe, Code, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "About - Professional Google Drive Management",
  description: "Learn more about Professional Google Drive Management, our mission, features, and the technology behind our enterprise file management solution.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              About Professional Google Drive Management
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              An enterprise file management solution that revolutionizes how professionals interact with Google Drive
            </p>
          </div>
        </div>

        {/* Mission Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              Our Mission
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-lg">
              We believe professional file management should be intuitive, efficient, and powerful. Professional Google Drive Management bridges 
              the gap between Google Drive's capabilities and enterprise expectations, providing advanced features 
              with professional-grade reliability.
            </p>
            <p>
              Our goal is to empower individuals and teams to organize, access, and collaborate on their files 
              with unprecedented efficiency, removing the friction from digital file management.
            </p>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Key Features
            </CardTitle>
            <CardDescription>
              What makes Professional Google Drive Management special
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">File Ops</Badge>
                  <div>
                    <h4 className="font-semibold">Advanced File Operations</h4>
                    <p className="text-sm text-muted-foreground">
                      Bulk operations, smart categorization, and intelligent file handling
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">Search</Badge>
                  <div>
                    <h4 className="font-semibold">Powerful Search & Filtering</h4>
                    <p className="text-sm text-muted-foreground">
                      Find files instantly with advanced search capabilities and smart filters
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">UI/UX</Badge>
                  <div>
                    <h4 className="font-semibold">Intuitive Interface</h4>
                    <p className="text-sm text-muted-foreground">
                      Clean, responsive design that works seamlessly across all devices
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">Performance</Badge>
                  <div>
                    <h4 className="font-semibold">Optimized Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Smart caching, background processing, and resource optimization
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">Security</Badge>
                  <div>
                    <h4 className="font-semibold">Enterprise Security</h4>
                    <p className="text-sm text-muted-foreground">
                      OAuth 2.0, secure token management, and privacy-first design
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <Badge variant="secondary" className="mt-1">Sync</Badge>
                  <div>
                    <h4 className="font-semibold">Real-time Synchronization</h4>
                    <p className="text-sm text-muted-foreground">
                      Instant updates and seamless synchronization with Google Drive
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Technology Stack */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-green-600" />
              Technology Stack
            </CardTitle>
            <CardDescription>
              Built with modern, reliable technologies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                  <Code className="h-6 w-6 text-blue-600" />
                </div>
                <h4 className="font-semibold">Frontend</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Next.js 15 with App Router</p>
                  <p>React & TypeScript</p>
                  <p>Tailwind CSS & shadcn/ui</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                  <Database className="h-6 w-6 text-green-600" />
                </div>
                <h4 className="font-semibold">Backend</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Supabase Authentication</p>
                  <p>PostgreSQL Database</p>
                  <p>Google Drive API</p>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h4 className="font-semibold">Infrastructure</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Edge Deployment</p>
                  <p>Performance Monitoring</p>
                  <p>Security Best Practices</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team & Values */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-indigo-600" />
              Our Values
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Privacy First</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  We never store your files. All operations work directly with your Google Drive, 
                  ensuring your data remains under your complete control.
                </p>
                
                <h4 className="font-semibold mb-2">User-Centric Design</h4>
                <p className="text-sm text-muted-foreground">
                  Every feature is designed with the end user in mind, prioritizing ease of use 
                  without sacrificing powerful functionality.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Open Source Spirit</h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Built with transparency and community collaboration in mind, using modern 
                  open-source technologies and best practices.
                </p>
                
                <h4 className="font-semibold mb-2">Continuous Innovation</h4>
                <p className="text-sm text-muted-foreground">
                  We're constantly improving and adding new features based on user feedback 
                  and emerging technologies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Call to Action */}
        <div className="text-center space-y-6">
          <h2 className="text-2xl font-bold">Ready to Transform Your File Management?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Join thousands of users who have already discovered a better way to manage their Google Drive files.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/dashboard">Get Started</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/terms">View Terms</Link>
            </Button>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-12 pt-8 border-t text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
            <Link href="/" className="hover:text-foreground">Home</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            © 2025 Professional Google Drive Management. Built for enterprise file management excellence.
          </p>
        </div>
      </div>
    </div>
  );
}