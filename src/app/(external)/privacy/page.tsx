import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Shield, Eye, Lock, Database, Globe, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy - Professional Google Drive Management",
  description: "Privacy Policy for Professional Google Drive Management. Learn how we protect your privacy and handle your data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground">
              Last updated: December 18, 2024
            </p>
          </div>
        </div>

        {/* Privacy Commitment */}
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Our Privacy Commitment</h3>
                <p className="text-sm text-green-800">
                  Your privacy is fundamental to our mission. We've designed Professional Google Drive Management to be 
                  privacy-first, ensuring your files remain exclusively under your control at all times.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Privacy at a Glance
            </CardTitle>
            <CardDescription>
              The essentials of how we handle your privacy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ No File Storage</Badge>
                  <span className="text-sm">We never store your files</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ OAuth Only</Badge>
                  <span className="text-sm">Secure Google authentication</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Minimal Data</Badge>
                  <span className="text-sm">Only essential information collected</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ No Sharing</Badge>
                  <span className="text-sm">We never sell or share your data</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Transparent</Badge>
                  <span className="text-sm">Clear about what we collect</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Your Control</Badge>
                  <span className="text-sm">You control your data completely</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" />
              1. Information We Collect
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 text-green-700">✓ What We DO Collect:</h4>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <div>
                    <strong>Authentication Information:</strong> Your Google account email and basic profile information 
                    (name, profile picture) through OAuth 2.0
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <div>
                    <strong>Session Data:</strong> Temporary authentication tokens to maintain your login session
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <div>
                    <strong>Usage Analytics:</strong> Anonymous, aggregated usage statistics to improve the service 
                    (e.g., feature usage frequency, performance metrics)
                  </div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <div>
                    <strong>Technical Information:</strong> Browser type, device information, and basic system 
                    specifications for optimization purposes
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-red-700">✗ What We DO NOT Collect:</h4>
              <ul className="space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <div><strong>Your Files:</strong> We never download, store, or access the content of your files</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <div><strong>File Names or Metadata:</strong> We don't store information about your files or folder structure</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <div><strong>Personal Communications:</strong> We don't access emails, documents, or other personal content</div>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 mt-1">•</span>
                  <div><strong>Location Data:</strong> We don't track your physical location</div>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. How We Use Your Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use the minimal information we collect solely for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Authentication:</strong> Verifying your identity and maintaining secure sessions</li>
              <li><strong>Service Provision:</strong> Enabling file management operations through Google Drive API</li>
              <li><strong>Performance Optimization:</strong> Improving app speed and user experience</li>
              <li><strong>Technical Support:</strong> Troubleshooting issues and providing customer support</li>
              <li><strong>Service Improvement:</strong> Understanding how features are used to enhance functionality</li>
            </ul>
            <p className="text-sm text-muted-foreground italic">
              All file operations are performed directly between your browser and Google's servers. 
              We act only as an interface and never intercept or store your file data.
            </p>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-red-600" />
              3. Data Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We implement multiple layers of security to protect your information:</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Technical Safeguards</h4>
                <ul className="text-sm space-y-1">
                  <li>• HTTPS encryption for all communications</li>
                  <li>• OAuth 2.0 secure authentication</li>
                  <li>• Secure token storage and management</li>
                  <li>• Regular security audits and updates</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Operational Safeguards</h4>
                <ul className="text-sm space-y-1">
                  <li>• Limited data access on need-to-know basis</li>
                  <li>• Regular staff security training</li>
                  <li>• Incident response procedures</li>
                  <li>• Compliance with industry standards</li>
                </ul>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Zero File Access Architecture</h4>
              <p className="text-sm text-blue-800">
                Our application is designed with a "zero file access" architecture. All file operations 
                happen directly between your browser and Google Drive servers. We never receive, process, 
                or store your actual file content, providing the highest level of privacy protection.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-600" />
              4. Data Sharing and Disclosure
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Our Promise: We Don't Sell Data</h4>
              <p className="text-sm text-green-800">
                We have never and will never sell, rent, or trade your personal information to third parties.
              </p>
            </div>

            <p>We may share limited information only in these specific circumstances:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
              <li><strong>Safety Protection:</strong> To protect our rights, safety, or the safety of others</li>
              <li><strong>Service Providers:</strong> With trusted third-party services that help us operate 
                  (e.g., Supabase for authentication, hosting providers)</li>
              <li><strong>Business Transfer:</strong> In the event of a merger or acquisition 
                  (with the same privacy protections)</li>
            </ul>

            <p className="text-sm text-muted-foreground">
              All third-party services we use are carefully vetted and bound by strict data protection agreements.
            </p>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Your Privacy Rights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You have complete control over your data and privacy:</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Access & Control</h4>
                <ul className="text-sm space-y-1">
                  <li>• View what data we have about you</li>
                  <li>• Request data correction or deletion</li>
                  <li>• Export your data</li>
                  <li>• Withdraw consent at any time</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">Account Management</h4>
                <ul className="text-sm space-y-1">
                  <li>• Revoke app permissions in Google account</li>
                  <li>• Delete your account and all data</li>
                  <li>• Control authentication preferences</li>
                  <li>• Opt out of analytics (where applicable)</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h4 className="font-semibold text-amber-900 mb-2">Easy Data Removal</h4>
              <p className="text-sm text-amber-800">
                To completely remove all data, simply revoke access in your Google account settings. 
                Since we don't store files, your Google Drive data remains completely unaffected.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Cookies and Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Cookies and Tracking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>We use minimal cookies and tracking technologies:</p>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Essential Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Required for authentication and basic app functionality. These cannot be disabled.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">Analytics Cookies</h4>
                <p className="text-sm text-muted-foreground">
                  Anonymous usage statistics to improve the service. These can be disabled in your browser settings.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold">No Third-Party Tracking</h4>
                <p className="text-sm text-muted-foreground">
                  We don't use advertising trackers, social media pixels, or other invasive tracking technologies.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* International Users */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-600" />
              7. International Users
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We welcome users worldwide and respect international privacy laws including GDPR, CCPA, 
              and other regional privacy regulations.
            </p>
            <p>
              Your data is processed in accordance with the highest privacy standards regardless of 
              your location. If you're in the EU, you have additional rights under GDPR including:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Right to data portability</li>
              <li>Right to be forgotten</li>
              <li>Right to restrict processing</li>
              <li>Right to object to processing</li>
            </ul>
          </CardContent>
        </Card>

        {/* Changes to Privacy Policy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Changes to This Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices 
              or legal requirements. We will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Post the updated policy on this page</li>
              <li>Update the "Last Updated" date</li>
              <li>Notify users of significant changes via the application</li>
              <li>Provide 30 days notice for material changes</li>
            </ul>
            <p>
              Your continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>9. Contact Us</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If you have questions about this Privacy Policy or our privacy practices, please contact us:
            </p>
            <div className="bg-slate-50 border rounded-lg p-4">
              <p className="text-sm">
                <strong>Privacy Questions:</strong> Contact us through the application's support system<br />
                <strong>Data Requests:</strong> Use the in-app privacy controls or contact support<br />
                <strong>Security Concerns:</strong> Report immediately through our security contact
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              We typically respond to privacy inquiries within 72 hours and data requests within 30 days.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Navigation */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/terms">Terms of Service</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/about">About Us</Link>
            </Button>
            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-xs text-muted-foreground">
          <p>© 2025 Professional Google Drive Management. Your privacy is our priority.</p>
        </div>
      </div>
    </div>
  );
}