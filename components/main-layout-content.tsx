"use client"

import { useNavigation } from "@/lib/navigation-context"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Header } from "@/components/header"
import { TopNavigation } from "@/components/top-navigation"
import { CriticalNotificationsProvider } from "@/lib/critical-notifications-context"
import { Toaster } from "@/components/ui/toaster"
import { TelemedicineFloatingProvider, useTelemedicineFloating } from "@/lib/telemedicine-floating-context"
import { TelemedicineFloatingPanel } from "@/components/telemedicine-floating-panel"
import { cn } from "@/lib/utils"

interface MainLayoutContentProps {
  children: React.ReactNode
}

/**
 * While the telemedicine dock is open (not minimized), hide the fixed sidebar and drop `ml-64`
 * so the encounter + video dock can use the full viewport width. Minimize or close telemedicine
 * to bring the sidebar back.
 */
function MainLayoutShell({ children }: { children: React.ReactNode }) {
  const { activeCategory, setActiveCategory } = useNavigation()
  const { sessionId, minimized } = useTelemedicineFloating()
  const telemedicineDockExpanded = Boolean(sessionId && !minimized)

  return (
    <div className="flex h-screen">
      {!telemedicineDockExpanded && <AppSidebar activeCategory={activeCategory} />}
      <div
        className={cn(
          "flex min-w-0 flex-1 flex-col overflow-hidden transition-[margin] duration-200 ease-out",
          telemedicineDockExpanded ? "ml-0" : "ml-64",
        )}
      >
        <Header />
        <TopNavigation activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}

export function MainLayoutContent({ children }: MainLayoutContentProps) {
  return (
    <TelemedicineFloatingProvider>
      <CriticalNotificationsProvider>
        <SidebarProvider>
          <MainLayoutShell>{children}</MainLayoutShell>
          <Toaster />
          <TelemedicineFloatingPanel />
        </SidebarProvider>
      </CriticalNotificationsProvider>
    </TelemedicineFloatingProvider>
  )
}