"use client"

import { useEffect, useState } from "react"
import { AuthService } from "@/lib/auth/auth-service"

export default function DebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})

  useEffect(() => {
    const testAuth = async () => {
      try {
        // Test auth service
        const testUser = await AuthService.login({ username: "admin", password: "admin123" })
        console.log("Debug: Auth service test:", !!testUser)
        
        setDebugInfo({
          authServiceWorking: !!testUser,
          testUser: testUser ? { name: testUser.name, role: testUser.role } : null,
          timestamp: new Date().toISOString()
        })
      } catch (error) {
        console.error("Debug: Error testing auth:", error)
        setDebugInfo({
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date().toISOString()
        })
      }
    }

    testAuth()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full space-y-4">
        <h1 className="text-2xl font-bold text-center">Debug Information</h1>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  )
} 