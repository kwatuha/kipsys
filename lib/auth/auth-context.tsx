"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { UserRole } from "./permissions"
import { AuthService, type User } from "./auth-service"

interface AuthContextType {
  user: User | null
  userRole: UserRole
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const userRole = user?.role || "registration"

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const user = await AuthService.login({ username, password })
      
      if (user) {
        const token = AuthService.generateToken(user)
        localStorage.setItem('auth_token', token)
        setUser(user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: 'Invalid username or password' }
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole, 
      isAuthenticated, 
      isLoading, 
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
