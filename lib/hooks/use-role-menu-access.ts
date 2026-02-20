/**
 * React hook for accessing role-based menu and tab permissions
 */

import { useState, useEffect, useCallback } from 'react'
import { roleMenuApi } from '@/lib/api'
import { RoleMenuAccess } from '@/lib/role-menu-filter'

export function useRoleMenuAccess(userId?: string) {
  const [menuAccess, setMenuAccess] = useState<RoleMenuAccess | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMenuAccess = useCallback(async () => {
    if (!userId) {
      setLoading(false)
      setMenuAccess(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await roleMenuApi.getUserMenuAccess(userId)

      // Transform API response to RoleMenuAccess format
      const access: RoleMenuAccess = {
        categories: data.categories || [],
        menuItems: data.menuItems || [],
        tabs: data.tabs || [],
        queues: data.queues || []
      }

      setMenuAccess(access)
    } catch (err: any) {
      console.error('Error loading menu access:', err)
      setError(err.message || 'Failed to load menu access')
      setMenuAccess(null)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadMenuAccess()
  }, [loadMenuAccess])

  return {
    menuAccess,
    loading,
    error,
    refetch: loadMenuAccess
  }
}
