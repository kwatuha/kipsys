/**
 * Role-based menu and tab filtering utilities
 *
 * These utilities filter navigation categories, sidebar items, and page tabs
 * based on the user's role permissions.
 */

import { NavigationCategory, NavigationItem } from './navigation'

export interface RoleMenuAccess {
  categories: string[]  // Allowed category IDs
  menuItems: Array<{ categoryId: string; path: string }>  // Allowed menu item paths
  tabs: Array<{ pagePath: string; tabId: string }>  // Allowed tabs
  queues: string[]  // Allowed queue service points
}

/**
 * Filter navigation categories based on role access
 */
export function filterNavigationCategories(
  categories: NavigationCategory[],
  roleAccess: RoleMenuAccess | null
): NavigationCategory[] {
  if (!roleAccess || roleAccess.categories.length === 0) {
    // If no access data, return empty array (secure by default)
    // Or return all if you want permissive default
    return []
  }

  return categories.filter(category =>
    roleAccess.categories.includes(category.id)
  )
}

/**
 * Filter sidebar items within a category based on role access
 */
export function filterSidebarItems(
  items: NavigationItem[],
  categoryId: string,
  roleAccess: RoleMenuAccess | null
): NavigationItem[] {
  if (!roleAccess) {
    return []
  }

  // If category is not allowed, return empty
  if (!roleAccess.categories.includes(categoryId)) {
    return []
  }

  // Get allowed paths for this category
  const allowedPaths = roleAccess.menuItems
    .filter(item => item.categoryId === categoryId)
    .map(item => item.path)

  // If no specific menu item restrictions, allow all items in the category
  if (allowedPaths.length === 0) {
    return items
  }

  // Filter items based on allowed paths
  return items.filter(item => allowedPaths.includes(item.href))
}

/**
 * Check if a tab is allowed for a role
 */
export function isTabAllowed(
  pagePath: string,
  tabId: string,
  roleAccess: RoleMenuAccess | null
): boolean {
  if (!roleAccess) {
    return false
  }

  // Check if there are any tab restrictions for this page
  const pageTabs = roleAccess.tabs.filter(t => t.pagePath === pagePath)

  // If no restrictions for this page, allow all tabs
  if (pageTabs.length === 0) {
    return true
  }

  // Check if this specific tab is allowed
  return pageTabs.some(t => t.tabId === tabId)
}

/**
 * Filter tabs based on role access
 */
export function filterTabs(
  tabs: Array<{ value: string; label: string }>,
  pagePath: string,
  roleAccess: RoleMenuAccess | null
): Array<{ value: string; label: string }> {
  if (!roleAccess) {
    return []
  }

  // Check if there are any tab restrictions for this page
  const pageTabs = roleAccess.tabs.filter(t => t.pagePath === pagePath)

  // If no restrictions for this page, allow all tabs
  if (pageTabs.length === 0) {
    return tabs
  }

  // Filter tabs based on allowed tab IDs
  const allowedTabIds = pageTabs.map(t => t.tabId)
  return tabs.filter(tab => allowedTabIds.includes(tab.value))
}

/**
 * Normalize page path for matching
 * Converts dynamic routes like "/patients/[id]" to pattern "/patients/*"
 */
export function normalizePagePath(path: string): string {
  // Replace dynamic segments like [id] with *
  return path.replace(/\[.*?\]/g, '*')
}

/**
 * Match page path against a pattern
 * Supports exact match and wildcard patterns
 */
export function matchPagePath(pagePath: string, pattern: string): boolean {
  // Exact match
  if (pattern === pagePath) {
    return true
  }

  // Wildcard pattern matching
  if (pattern.includes('*')) {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$')
    return regex.test(pagePath)
  }

  // Prefix match (for paths like "/patients" matching "/patients/123")
  if (pagePath.startsWith(pattern + '/')) {
    return true
  }

  return false
}

/**
 * Check if a queue service point is allowed for a role
 */
export function isQueueAllowed(
  servicePoint: string,
  roleAccess: RoleMenuAccess | null
): boolean {
  if (!roleAccess) {
    return false
  }

  // If no queue restrictions, allow all queues
  if (roleAccess.queues.length === 0) {
    return true
  }

  // Check if this specific service point is allowed
  return roleAccess.queues.includes(servicePoint)
}

/**
 * Filter queue service points based on role access
 */
export function filterQueueServicePoints(
  servicePoints: string[],
  roleAccess: RoleMenuAccess | null
): string[] {
  if (!roleAccess) {
    return []
  }

  // If no queue restrictions, allow all service points
  if (roleAccess.queues.length === 0) {
    return servicePoints
  }

  // Filter service points based on allowed queues
  return servicePoints.filter(sp => roleAccess.queues.includes(sp))
}
