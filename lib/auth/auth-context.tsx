"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
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
  const [isLoading, setIsLoading] = useState(true) // Start with true to check auth on mount

  const userRole = user?.role || "registration"

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      try {
        // Check for JWT token in localStorage
        const token = localStorage.getItem('token') || localStorage.getItem('jwt_token')
        
        if (token) {
          // Verify token with backend
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
          try {
            const response = await fetch(`${apiUrl}/api/auth/verify`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            })

            if (response.ok) {
              const data = await response.json()
              if (data.user) {
                setUser({
                  id: data.user.id?.toString() || data.user.userId?.toString() || '',
                  username: data.user.username,
                  role: data.user.role?.toLowerCase() || 'registration',
                  name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim(),
                  email: data.user.email,
                  department: data.user.department || '',
                })
                setIsAuthenticated(true)
              }
            } else {
              // Token invalid, clear it
              localStorage.removeItem('token')
              localStorage.removeItem('jwt_token')
              localStorage.removeItem('auth_token')
            }
          } catch (error) {
            // If verify endpoint doesn't exist, try to decode JWT token
            try {
              // Simple JWT decode (without verification for now)
              const payload = JSON.parse(atob(token.split('.')[1]))
              if (payload.user && payload.exp && payload.exp * 1000 > Date.now()) {
                // Token not expired, use stored user data
                setUser({
                  id: payload.user.id?.toString() || '',
                  username: payload.user.username,
                  role: payload.user.roleName?.toLowerCase() || payload.user.role?.toLowerCase() || 'registration',
                  name: `${payload.user.firstName || ''} ${payload.user.lastName || ''}`.trim(),
                  email: payload.user.email,
                  department: payload.user.department || '',
                })
                setIsAuthenticated(true)
              } else {
                // Token expired
                localStorage.removeItem('token')
                localStorage.removeItem('jwt_token')
                localStorage.removeItem('auth_token')
              }
            } catch (decodeError) {
              // Token decode failed, clear it
              localStorage.removeItem('token')
              localStorage.removeItem('jwt_token')
              localStorage.removeItem('auth_token')
            }
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid tokens
        localStorage.removeItem('token')
        localStorage.removeItem('jwt_token')
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      
      // Try backend API login first
      try {
        // Use relative URL in browser, or public URL if set
        const apiUrl = typeof window !== 'undefined' 
          ? (process.env.NEXT_PUBLIC_API_URL || '')
          : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');
        const response = await fetch(`${apiUrl}/api/auth/login`, {
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
