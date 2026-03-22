/**
 * Role-based menu and tab filtering utilities
 *
 * These utilities filter navigation categories, sidebar items, and page tabs
 * based on the user's role permissions.
 */

import { NavigationCategory, NavigationItem } from './navigation'

export interface RoleMenuAccess {
  /** True if role_menu_categories or role_menu_items has any rows (saved in Menu & Tab Access). */
  menuConfigPresent: boolean
  /** categoryIds that have ≥1 row in role_menu_items (distinguishes "no item rows" vs "all items denied"). */
  categoriesWithMenuItemRows: string[]
  categories: string[]  // Allowed category IDs
  menuItems: Array<{ categoryId: string; path: string }>  // Allowed menu item paths
  tabs: Array<{ pagePath: string; tabId: string }>  // Allowed tabs
  queues: string[]  // Allowed queue service points
}

/**
 * Effective top-level category IDs for filtering.
 * - If `role_menu_categories` has rows → use those.
 * - Else if `role_menu_items` has rows but categories are empty → derive unique categoryIds
 *   from menu items (admins often configure sidebar paths without duplicating category rows).
 * - Else → none configured (caller shows full nav).
 */
export function getEffectiveAllowedCategoryIds(roleAccess: RoleMenuAccess): string[] {
  if (roleAccess.categories.length > 0) {
    return roleAccess.categories
  }
  if (roleAccess.menuItems.length > 0) {
    return [...new Set(roleAccess.menuItems.map((m) => m.categoryId))]
  }
  return []
}

function isLegacyUnconfiguredMenu(roleAccess: RoleMenuAccess): boolean {
  return !roleAccess.menuConfigPresent
}

/**
 * Filter navigation categories based on role access
 */
export function filterNavigationCategories(
  categories: NavigationCategory[],
  roleAccess: RoleMenuAccess | null
): NavigationCategory[] {
  if (!roleAccess) {
    return []
  }

  const allowedCategoryIds = getEffectiveAllowedCategoryIds(roleAccess)

  // Saved in Menu & Tab Access but nothing allowed → hide all top categories
  if (allowedCategoryIds.length === 0) {
    if (!isLegacyUnconfiguredMenu(roleAccess)) {
      return []
    }
    // Never saved menu config for this role → legacy permissive default (show all)
    return categories
  }

  return categories.filter((category) => allowedCategoryIds.includes(category.id))
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

  const hasExplicitCategories = roleAccess.categories.length > 0
  const hasMenuItemRows = roleAccess.menuItems.length > 0

  // Menu config saved but every category/item denied → API returns empty allow lists
  if (
    roleAccess.menuConfigPresent &&
    roleAccess.categories.length === 0 &&
    roleAccess.menuItems.length === 0
  ) {
    return []
  }

  // Explicit category list: hide sidebar for categories not allowed
  if (hasExplicitCategories && !roleAccess.categories.includes(categoryId)) {
    return []
  }

  // Get allowed paths for this category
  const allowedPaths = roleAccess.menuItems
    .filter((item) => item.categoryId === categoryId)
    .map((item) => item.path)

  const hasItemRowsForCategory =
    roleAccess.categoriesWithMenuItemRows?.includes(categoryId) ?? false

  /**
   * Menu-item-only configuration: `role_menu_categories` empty but `role_menu_items` has rows.
   * In that mode, a category with no allowed paths is hidden (do not show full category sidebar).
   */
  if (!hasExplicitCategories && hasMenuItemRows) {
    if (allowedPaths.length === 0) {
      return []
    }
    return items.filter((item) => allowedPaths.includes(item.href))
  }

  // Top category allowed + item-level rows exist for this category but no allowed paths → all denied
  if (
    hasExplicitCategories &&
    roleAccess.categories.includes(categoryId) &&
    allowedPaths.length === 0 &&
    roleAccess.menuConfigPresent &&
    hasItemRowsForCategory
  ) {
    return []
  }

  // Category allowed and no per-item restrictions in DB → show all items in that category
  if (allowedPaths.length === 0) {
    return items
  }

  return items.filter((item) => allowedPaths.includes(item.href))
}

/**
 * Check if a tab is allowed for a role
 * Permissive by default: shows all tabs unless explicitly restricted
 */
export function isTabAllowed(
  pagePath: string,
  tabId: string,
  roleAccess: RoleMenuAccess | null
): boolean {
  if (!roleAccess) {
    return true // Allow by default if no access data
  }

  // Normalize the input page path for matching
  const normalizedInputPath = normalizePagePath(pagePath)

  // Check if there are any tab restrictions for this page
  // Normalize both stored paths and input path, then compare
  const pageTabs = roleAccess.tabs.filter(t => {
    const normalizedStoredPath = normalizePagePath(t.pagePath)
    // Match if normalized paths are equal, or use pattern matching
    return normalizedInputPath === normalizedStoredPath ||
           matchPagePath(normalizedInputPath, normalizedStoredPath)
  })

  // If no restrictions configured for this page, allow all tabs (permissive by default)
  // This ensures roles see tabs unless explicitly restricted
  if (pageTabs.length === 0) {
    return true
  }

  // If restrictions exist, check if this specific tab is allowed
  return pageTabs.some(t => t.tabId === tabId)
}

/**
 * Filter tabs based on role access
 * Permissive by default: shows all tabs unless explicitly restricted
 */
export function filterTabs(
  tabs: Array<{ value: string; label: string }>,
  pagePath: string,
  roleAccess: RoleMenuAccess | null
): Array<{ value: string; label: string }> {
  if (!roleAccess) {
    return tabs // Show all tabs if no access data (permissive default)
  }

  // Normalize the input page path for matching
  const normalizedInputPath = normalizePagePath(pagePath)

  // Check if there are any tab restrictions for this page
  // Normalize both stored paths and input path, then compare
  const pageTabs = roleAccess.tabs.filter(t => {
    const normalizedStoredPath = normalizePagePath(t.pagePath)
    // Match if normalized paths are equal, or use pattern matching
    return normalizedInputPath === normalizedStoredPath ||
           matchPagePath(normalizedInputPath, normalizedStoredPath)
  })

  // If no restrictions configured for this page, show all tabs (permissive by default)
  // This ensures roles see all tabs unless explicitly restricted
  if (pageTabs.length === 0) {
    return tabs
  }

  // If restrictions exist, filter tabs based on allowed tab IDs
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
