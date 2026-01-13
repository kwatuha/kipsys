"use client"

import { useState, useEffect } from "react"
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

  // 1. Handle automatic redirection if user arrives already logged in
  useEffect(() => {
    if (!isLoading && isAuthenticated && pathname === "/login") {
      setIsRedirecting(true)
      router.replace("/")
    }
  }, [isAuthenticated, isLoading, router, pathname])

  // 2. Handle the "Sign In" click
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      const result = await login(username, password)
      if (result.success) {
        setIsRedirecting(true)
        // FORCE a hard reload to ensure Middleware/Server sees the new session
        // This stops the "flicker loop" on the first login
        window.location.href = "/"
      } else {
        setError(result.error || "Invalid username or password")
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.")
    }
  }

  // Loading Screen for Auth checks and Active Redirects
  if (isLoading || (isAuthenticated && pathname === "/login") || isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-[#0f4c75] mx-auto mb-4" />
          <p className="text-sm font-medium text-[#0f4c75]">
            Securely logging you in...
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
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="h-11"
                  required
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
                className="w-full h-11 text-base font-medium bg-[#0f4c75] hover:bg-[#1b5e8a]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="pt-4 border-t">
              <div className="rounded-lg bg-muted/50 p-4 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Test Credentials</h3>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Admin:</span>
                    <code className="bg-background px-2 py-0.5 rounded border">admin / admin123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Doctor:</span>
                    <code className="bg-background px-2 py-0.5 rounded border">doctor1 / password123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Nurse:</span>
                    <code className="bg-background px-2 py-0.5 rounded border">nurse1 / password123</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Pharmacist:</span>
                    <code className="bg-background px-2 py-0.5 rounded border">pharmacist1 / password123</code>
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