"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationCategories, getCategoryByPath } from "@/lib/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useRoleMenuAccess } from "@/lib/hooks/use-role-menu-access"
import { filterSidebarItems } from "@/lib/role-menu-filter"
import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Home,
  Pill,
  HelpCircle,
  Users,
  CreditCard,
  BarChart3,
  Building2,
  Stethoscope,
  BedDouble,
  Baby,
  HeartPulse,
  ShoppingCart,
  DollarSign,
  UserCog,
  Boxes,
  Receipt,
  Clipboard,
  FlaskConical,
  ImageIcon,
  Package,
  Grid,
  PlusCircle,
  Layers,
  ListOrdered,
  UserPlus,
  MapPin,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { ModeToggle } from "./mode-toggle"
import { HospitalLogoWithIcon } from "./hospital-logo-with-icon"
import { memo } from "react"

interface AppSidebarProps {
  activeCategory: string
}

// Memoize the sidebar to prevent unnecessary re-renders
export const AppSidebar = memo(function AppSidebar({ activeCategory }: AppSidebarProps) {
  const pathname = usePathname()
  const { user } = useAuth()
  const { menuAccess, loading: menuLoading } = useRoleMenuAccess(user?.id)

  // Get the current category
  const currentCategory = navigationCategories.find(cat => cat.id === activeCategory) || navigationCategories[0]

  // Filter sidebar items based on role access
  const allowedItems = menuLoading || !menuAccess
    ? currentCategory.items // Show all while loading or if no access data
    : filterSidebarItems(currentCategory.items, currentCategory.id, menuAccess)

  return (
    <Sidebar style={{ backgroundColor: "#0f4c75" }} className="text-white">
      <SidebarHeader className="flex items-center justify-center py-4 border-b border-white/10">
        <div className="flex items-center justify-center w-full">
          <HospitalLogoWithIcon />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">{currentCategory.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => {
                const Icon = item.icon
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex flex-row items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium
                        transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10
                        focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50
                        ${pathname === item.href ? "bg-white/20 text-white font-semibold" : ""}
                      `}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link
              href="/help"
              className="flex flex-row items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium
                transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10
                focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50
                ${pathname === '/help' ? 'bg-white/20 text-white font-semibold' : ''}"
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0" />
              <span>Help</span>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="p-4">
          <ModeToggle />
        </div>
      </SidebarFooter>
      <SidebarRail className="bg-white/10" />
    </Sidebar>
  )
})
