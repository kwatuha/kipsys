"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useRoleMenuAccess } from "@/lib/hooks/use-role-menu-access"
import { filterTabs, isTabAllowed } from "@/lib/role-menu-filter"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TabItem {
  value: string
  label: string
}

interface RoleFilteredTabsProps {
  tabs: TabItem[]
  pagePath: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  className?: string
}

/**
 * Wrapper component that filters tabs based on role permissions
 * Usage:
 * <RoleFilteredTabs tabs={[...]} pagePath="/patients/[id]">
 *   <TabsContent value="overview">...</TabsContent>
 *   <TabsContent value="vitals">...</TabsContent>
 * </RoleFilteredTabs>
 */
export function RoleFilteredTabs({
  tabs,
  pagePath,
  defaultValue,
  onValueChange,
  children,
  className,
}: RoleFilteredTabsProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { menuAccess, loading: menuLoading } = useRoleMenuAccess(user?.id)

  // Normalize page path for matching (handle dynamic routes)
  const normalizedPagePath = pagePath.replace(/\[.*?\]/g, '*')
  const currentPath = pathname

  // Filter tabs based on role access
  // While loading, show all tabs to prevent flickering
  // Once loaded, only show explicitly allowed tabs
  const allowedTabs = menuLoading
    ? tabs // Show all while loading to prevent flickering
    : filterTabs(tabs, normalizedPagePath, menuAccess)

  // Filter children (TabsContent) to only show allowed tabs
  // While loading, show all to prevent flickering
  // Once loaded, show tabs based on role configuration (permissive by default)
  const filteredChildren = React.Children.toArray(children).filter((child: any) => {
    if (menuLoading) return true // Show all while loading to prevent flickering
    if (!menuAccess) return true // If no access data, show all (permissive default)
    const tabValue = child?.props?.value
    if (!tabValue) return true // Allow non-tab children
    return isTabAllowed(normalizedPagePath, tabValue, menuAccess)
  })

  // Ensure default value is allowed
  const safeDefaultValue = defaultValue && allowedTabs.some(t => t.value === defaultValue)
    ? defaultValue
    : allowedTabs[0]?.value

  return (
    <Tabs
      defaultValue={safeDefaultValue}
      onValueChange={onValueChange}
      className={className}
    >
      <TabsList className="flex flex-wrap w-full h-auto p-1 gap-1">
        {allowedTabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="flex-grow py-2 px-3">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {filteredChildren}
    </Tabs>
  )
}

/**
 * Hook to check if a specific tab is allowed for the current user
 */
export function useTabAccess(pagePath: string, tabId: string): boolean {
  const { user } = useAuth()
  const { menuAccess, loading } = useRoleMenuAccess(user?.id)

  if (loading || !menuAccess) {
    return true // Allow by default while loading
  }

  const normalizedPagePath = pagePath.replace(/\[.*?\]/g, '*')
  return isTabAllowed(normalizedPagePath, tabId, menuAccess)
}
