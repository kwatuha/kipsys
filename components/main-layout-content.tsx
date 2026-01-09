"use client"

import { useNavigation } from "@/lib/navigation-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { TopNavigation } from "@/components/top-navigation"
import { CriticalNotificationsProvider } from "@/lib/critical-notifications-context"
import { FloatingCriticalNotifications } from "@/components/floating-critical-notifications"

interface MainLayoutContentProps {
  children: React.ReactNode
}

export function MainLayoutContent({ children }: MainLayoutContentProps) {
  const { activeCategory, setActiveCategory } = useNavigation()

  return (
    <CriticalNotificationsProvider>
      <SidebarProvider>
        <div className="flex h-screen">
          <AppSidebar activeCategory={activeCategory} />
          <div className="flex flex-col flex-1 overflow-hidden ml-64">
            <Header />
            <TopNavigation 
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
            <main className="flex-1 overflow-auto p-6">
              {children}
            </main>
          </div>
        </div>
        <FloatingCriticalNotifications />
      </SidebarProvider>
    </CriticalNotificationsProvider>
  )
} 