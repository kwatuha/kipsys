"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProvider } from "@/lib/navigation-context"
import { MainLayoutContent } from "@/components/main-layout-content"
import { ComprehensiveDashboard } from "@/components/comprehensive-dashboard"
import { Loader2 } from "lucide-react"

export default function RootPage() {
  const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // User is not authenticated, redirect to login
      router.replace("/login")
    }
  }, [isAuthenticated, isLoading, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null
  }

  // If authenticated, render the dashboard with all necessary providers
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NavigationProvider>
        <MainLayoutContent>
          <ComprehensiveDashboard />
        </MainLayoutContent>
      </NavigationProvider>
    </ThemeProvider>
  )
}

