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
  const allowedTabs = menuLoading || !menuAccess
    ? tabs // Show all while loading or if no access data
    : filterTabs(tabs, normalizedPagePath, menuAccess)

  // Filter children (TabsContent) to only show allowed tabs
  const filteredChildren = React.Children.toArray(children).filter((child: any) => {
    if (!menuAccess || menuLoading) return true // Show all while loading
    const tabValue = child?.props?.value
    if (!tabValue) return true
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
