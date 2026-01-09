import type { ReactNode } from "react"
import "./globals.css"
import { AuthProvider } from "@/lib/auth/auth-context"

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
