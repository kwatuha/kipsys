import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "../globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { NavigationProvider } from "@/lib/navigation-context"
import { MainLayoutContent } from "@/components/main-layout-content"
import { ProtectedRoute } from "@/components/protected-route"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kiplombe Medical Centre MIS",
  description: "Hospital Management Information System for Kiplombe Medical Centre",
  generator: 'v0.dev'
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ProtectedRoute>
        <NavigationProvider>
          <MainLayoutContent>{children}</MainLayoutContent>
        </NavigationProvider>
      </ProtectedRoute>
    </ThemeProvider>
  )
} 