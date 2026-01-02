"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { getCategoryByPath, navigationCategories } from "./navigation"

interface NavigationContextType {
  activeCategory: string
  setActiveCategory: (categoryId: string) => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [activeCategory, setActiveCategory] = useState("overview")
  const isManualUpdateRef = useRef(false)
  const lastPathnameRef = useRef(pathname)
  const activeCategoryRef = useRef(activeCategory)

  // Keep ref in sync with state
  useEffect(() => {
    activeCategoryRef.current = activeCategory
  }, [activeCategory])

  // Wrapper for setActiveCategory that marks it as manual
  const handleSetActiveCategory = (categoryId: string) => {
    isManualUpdateRef.current = true
    setActiveCategory(categoryId)
    activeCategoryRef.current = categoryId
    // Reset the flag after navigation completes (give enough time for router.push to complete)
    setTimeout(() => {
      isManualUpdateRef.current = false
    }, 300)
  }

  // Update active category based on current path, but only if not manually set
  useEffect(() => {
    // Skip if this is the same pathname (no actual navigation occurred)
    if (pathname === lastPathnameRef.current) {
      return
    }
    
    lastPathnameRef.current = pathname
    
    // Only update automatically if not in a manual update window
    if (!isManualUpdateRef.current) {
      console.log('NavigationProvider pathname changed:', pathname)
      const category = getCategoryByPath(pathname)
      
      // Check if the new pathname belongs to the currently active category
      // If it does, preserve the active category (don't change it)
      // Only update if the pathname belongs to a different category
      const currentCategory = navigationCategories.find(cat => cat.id === activeCategoryRef.current)
      const pathBelongsToCurrentCategory = currentCategory?.items.some(item => 
        pathname.startsWith(item.href)
      )
      
      if (pathBelongsToCurrentCategory) {
        console.log('NavigationProvider: Path belongs to current category, preserving active category')
        // Keep the current active category - don't change it
        return
      }
      
      // Path belongs to a different category, update it
      console.log('NavigationProvider: Path belongs to different category, updating:', category.id)
      setActiveCategory(category.id)
    } else {
      console.log('NavigationProvider: Skipping automatic update - manual selection in progress')
    }
  }, [pathname])

  return (
    <NavigationContext.Provider value={{ activeCategory, setActiveCategory: handleSetActiveCategory }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
} 