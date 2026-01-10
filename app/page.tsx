"use client"

import { ProtectedRoute } from "@/components/protected-route"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProvider } from "@/lib/navigation-context"
import { MainLayoutContent } from "@/components/main-layout-content"
import { ComprehensiveDashboard } from "@/components/comprehensive-dashboard"

export default function RootPage() {
  // Wrap content in ProtectedRoute to ensure authentication is required
  return (
    <ProtectedRoute>
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
    </ProtectedRoute>
  )
}

