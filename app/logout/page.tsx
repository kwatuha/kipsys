"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Loader2 } from "lucide-react"

export default function LogoutPage() {
  const { logout, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    logout()
    router.push("/login")
  }, [logout, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
        <p className="text-gray-600">Logging out...</p>
      </div>
    </div>
  )
} 