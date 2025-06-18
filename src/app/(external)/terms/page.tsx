import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, FileText, Shield, AlertCircle } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service - Google Drive Manager",
  description: "Terms of Service for Google Drive Manager. Please read these terms carefully before using our service.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h1 className="text-4xl font-bold">Terms of Service</h1>
            <p className="text-muted-foreground">
              Last updated: December 18, 2024
            </p>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="mb-8 border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-amber-900 mb-2">Important Notice</h3>
                <p className="text-sm text-amber-800">
                  By accessing and using Google Drive Manager, you accept and agree to be bound by the terms 
                  and provision of this agreement. Please read these terms carefully.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agreement to Terms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>1. Agreement to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              These Terms of Service ("Terms") govern your use of Google Drive Manager ("the Service"), 
              operated by our team ("we", "us", or "our").
            </p>
            <p>
              By accessing or using our Service, you agree to be bound by these Terms. If you disagree 
              with any part of these terms, then you may not access the Service.
            </p>
          </CardContent>
        </Card>

        {/* Service Description */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>2. Service Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Google Drive Manager is a web-based application that provides enhanced file management 
              capabilities for Google Drive. Our Service includes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Advanced file organization and search capabilities</li>
              <li>Bulk file operations and management tools</li>
              <li>Enhanced user interface for Google Drive interactions</li>
              <li>Performance optimization and caching features</li>
            </ul>
            <p>
              The Service operates as an interface to Google Drive and does not store your files. 
              All file operations are performed directly with Google's servers.
            </p>
          </CardContent>
        </Card>

        {/* User Responsibilities */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>3. User Responsibilities</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You are responsible for:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Maintaining the confidentiality of your Google account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Ensuring your use complies with Google's Terms of Service</li>
              <li>Not using the Service for any illegal or unauthorized purpose</li>
              <li>Not transmitting viruses, malware, or any malicious code</li>
              <li>Not attempting to gain unauthorized access to other users' data</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data and Privacy */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              4. Data and Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              <strong>No File Storage:</strong> We do not store, retain, or have access to your files. 
              All files remain exclusively on Google's servers under your control.
            </p>
            <p>
              <strong>Authentication:</strong> We use OAuth 2.0 for secure authentication with Google. 
              We only request the minimum permissions necessary for the Service to function.
            </p>
            <p>
              <strong>Usage Data:</strong> We may collect anonymous usage statistics to improve the Service. 
              This data cannot be used to identify you or your files.
            </p>
            <p>
              For detailed information about our data practices, please see our 
              <Link href="/privacy" className="text-blue-600 hover:underline"> Privacy Policy</Link>.
            </p>
          </CardContent>
        </Card>

        {/* Service Availability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>5. Service Availability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We strive to provide reliable Service availability, but we cannot guarantee uninterrupted access. 
              The Service may be temporarily unavailable due to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Scheduled maintenance</li>
              <li>Technical difficulties</li>
              <li>Internet connectivity issues</li>
              <li>Google Drive API limitations or outages</li>
            </ul>
            <p>
              We will make reasonable efforts to provide notice of planned maintenance when possible.
            </p>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>6. Intellectual Property</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The Service and its original content, features, and functionality are owned by us and are 
              protected by international copyright, trademark, and other intellectual property laws.
            </p>
            <p>
              You retain all rights to your files and data stored in Google Drive. We claim no ownership 
              or control over your content.
            </p>
          </CardContent>
        </Card>

        {/* Prohibited Uses */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>7. Prohibited Uses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>You agree not to use the Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>For any unlawful purpose or to solicit others to perform unlawful acts</li>
              <li>To violate any international, federal, provincial, or state regulations, rules, laws, or local ordinances</li>
              <li>To infringe upon or violate our intellectual property rights or the intellectual property rights of others</li>
              <li>To harass, abuse, insult, harm, defame, slander, disparage, intimidate, or discriminate</li>
              <li>To submit false or misleading information</li>
              <li>To upload or transmit viruses or any other type of malicious code</li>
              <li>To spam, phish, pharm, pretext, spider, crawl, or scrape</li>
              <li>For any obscene or immoral purpose</li>
              <li>To interfere with or circumvent the security features of the Service</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>8. Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              In no event shall Google Drive Manager, nor its directors, employees, partners, agents, 
              suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, 
              or punitive damages, including without limitation, loss of profits, data, use, goodwill, 
              or other intangible losses.
            </p>
            <p>
              We are not responsible for any loss or damage to your data that may result from using 
              the Service, including but not limited to data corruption, accidental deletion, or 
              Google Drive API limitations.
            </p>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>9. Termination</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We may terminate or suspend your access immediately, without prior notice or liability, 
              for any reason whatsoever, including without limitation if you breach the Terms.
            </p>
            <p>
              You may terminate your use of the Service at any time by simply discontinuing use of 
              the application and revoking access permissions in your Google account settings.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>10. Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. 
              If a revision is material, we will try to provide at least 30 days notice prior to any new 
              terms taking effect.
            </p>
            <p>
              What constitutes a material change will be determined at our sole discretion. 
              By continuing to access or use our Service after those revisions become effective, 
              you agree to be bound by the revised terms.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>11. Governing Law</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which 
              our company is incorporated, without regard to its conflict of law provisions.
            </p>
            <p>
              Our failure to enforce any right or provision of these Terms will not be considered a 
              waiver of those rights.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>12. Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              If you have any questions about these Terms of Service, please contact us through 
              the application's support channels or by visiting our website.
            </p>
            <p>
              These terms are effective as of the date listed above and will remain in effect except 
              with respect to any changes in their provisions in the future.
            </p>
          </CardContent>
        </Card>

        <Separator className="my-8" />

        {/* Navigation */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/privacy">Privacy Policy</Link>
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
          <p>© 2025 Google Drive Manager. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}