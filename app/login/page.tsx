"use client"

import { useState, useEffect, useLayoutEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AlertCircle, Loader2, Heart } from "lucide-react"

export default function LoginPage() {
  const { login, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Only redirect if already authenticated and we're on the login page
  // Use useLayoutEffect to prevent flickering (runs synchronously before paint)
  useLayoutEffect(() => {
    if (!isLoading && isAuthenticated && pathname === "/login" && !isRedirecting) {
      setIsRedirecting(true)
      // Immediate redirect
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router, pathname, isRedirecting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    const result = await login(username, password)
    if (result.success) {
      router.replace("/")
    } else {
      setError(result.error || "Login failed")
    }
  }

  // Early return: Show loading state while checking authentication OR if authenticated/redirecting
  // This prevents flickering by showing loading during both auth check and redirect
  // Check isRedirecting first to prevent any flicker during redirect
  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (isLoading || isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            {isAuthenticated ? "Redirecting..." : "Loading..."}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex justify-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#0f4c75] to-[#3282b8] shadow-lg">
                  <Heart className="h-8 w-8 text-white" fill="white" />
                </div>
                <div className="text-center space-y-2">
                  <h1 className="text-2xl font-bold text-[#0f4c75] tracking-tight">
                    Kiplombe Medical Centre
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Hospital Management Information System
                  </p>
                  <p className="text-xs text-muted-foreground/80 italic pt-1">
                    For Quality Healthcare Service Delivery
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  autoComplete="username"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="pt-4 border-t">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Test Credentials
                </h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-medium text-foreground">Admin:</span>
                    <code className="px-2.5 py-1 rounded-md bg-background border text-xs font-mono text-foreground">
                      admin / admin123
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-medium text-foreground">Doctor:</span>
                    <code className="px-2.5 py-1 rounded-md bg-background border text-xs font-mono text-foreground">
                      doctor1 / password123
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-medium text-foreground">Nurse:</span>
                    <code className="px-2.5 py-1 rounded-md bg-background border text-xs font-mono text-foreground">
                      nurse1 / password123
                    </code>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <span className="font-medium text-foreground">Pharmacist:</span>
                    <code className="px-2.5 py-1 rounded-md bg-background border text-xs font-mono text-foreground">
                      pharmacist1 / password123
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
