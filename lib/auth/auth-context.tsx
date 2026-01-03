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
      
      // Try backend API login first
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password }),
        })

        if (response.ok) {
          const data = await response.json()
          // Store the JWT token from backend
          if (data.token) {
            localStorage.setItem('token', data.token)
            localStorage.setItem('jwt_token', data.token)
            // Also store user data
            if (data.user) {
              setUser({
                id: data.user.id.toString(),
                username: data.user.username,
                role: data.user.role?.toLowerCase() || 'registration',
                name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
                email: data.user.email,
                department: data.user.department || '',
              })
              setIsAuthenticated(true)
              return { success: true }
            }
          }
        } else {
          const errorData = await response.json().catch(() => ({}))
          return { success: false, error: errorData.error || 'Invalid username or password' }
        }
      } catch (apiError) {
        // If backend API fails, fall back to mock auth for development
        console.warn('Backend login failed, using mock auth:', apiError)
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
      }
      
      return { success: false, error: 'Login failed. Please try again.' }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('token')
    localStorage.removeItem('jwt_token')
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
