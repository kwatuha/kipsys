"use client"

import { useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { navigationCategories, getCategoryByPath } from "@/lib/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TopNavigationProps {
  onCategoryChange: (categoryId: string) => void
  activeCategory: string
}

export function TopNavigation({ onCategoryChange, activeCategory }: TopNavigationProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleCategoryClick = (categoryId: string) => {
    onCategoryChange(categoryId)
    
    // Navigate to the first item in the category
    const category = navigationCategories.find(cat => cat.id === categoryId)
    if (category && category.items.length > 0) {
      router.push(category.items[0].href)
    }
  }

  return (
    <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4">
        <div className="flex items-center space-x-4">
          {navigationCategories.map((category) => {
            const Icon = category.icon
            const isActive = activeCategory === category.id
            
            return (
              <Button
                key={category.id}
                variant={isActive ? "default" : "ghost"}
                size="sm"
                onClick={() => handleCategoryClick(category.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{category.title}</span>
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
} 