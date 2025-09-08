"use client"

import { useUser } from "@auth0/nextjs-auth0"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Smartphone, Users, Lock } from "lucide-react"

export default function HomePage() {
  const { user, isLoading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">SecureAuth</h1>
          </div>
          <Button asChild>
            <a href="/auth/login">Sign In</a>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-5xl font-bold text-foreground mb-6 text-balance">
            Professional Multi-Device Authentication
          </h2>
          <p className="text-xl text-muted-foreground mb-8 text-pretty max-w-2xl mx-auto">
            Secure your applications with enterprise-grade authentication that intelligently manages device access and
            ensures seamless user experiences.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <a href="/auth/login">Get Started</a>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 bg-transparent">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <h3 className="text-3xl font-bold text-center text-foreground mb-12">Enterprise-Grade Security Features</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-border bg-card">
              <CardHeader>
                <Smartphone className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Multi-Device Management</CardTitle>
                <CardDescription>
                  Control how many devices can access your account simultaneously with intelligent session management.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Configurable device limits</li>
                  <li>• Real-time device monitoring</li>
                  <li>• Graceful logout handling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <Lock className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">Secure Authentication</CardTitle>
                <CardDescription>
                  Built with Auth0 for industry-standard security protocols and compliance.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• OAuth 2.0 & OpenID Connect</li>
                  <li>• Multi-factor authentication</li>
                  <li>• Enterprise SSO support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-xl">User Experience</CardTitle>
                <CardDescription>
                  Seamless authentication flows with intelligent device conflict resolution.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>• Smooth login experiences</li>
                  <li>• Device conflict prompts</li>
                  <li>• Professional interface</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-2xl">
          <h3 className="text-3xl font-bold text-foreground mb-6">Ready to Secure Your Application?</h3>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of organizations that trust SecureAuth for their authentication needs.
          </p>
          <Button size="lg" asChild className="text-lg px-8 py-6">
            <a href="/auth/login">Start Free Trial</a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold text-foreground">SecureAuth</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 SecureAuth. Professional multi-device authentication solution.
          </p>
        </div>
      </footer>
    </div>
  )
}
