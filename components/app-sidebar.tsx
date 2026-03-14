"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { navigationCategories, getCategoryByPath } from "@/lib/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { useRoleMenuAccess } from "@/lib/hooks/use-role-menu-access"
import { filterSidebarItems } from "@/lib/role-menu-filter"
import * as LucideIcons from "lucide-react"
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
  ArrowRight,
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
import { HospitalLogoImage } from "./hospital-logo-image"
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

  // User's landing quick links – shown in sidebar like standard nav for consistency
  const quickLinks = (user?.landingConfig as any)?.quickLinks
  const hasQuickLinks = Array.isArray(quickLinks) && quickLinks.length > 0

  const sidebarLinkClass = (isActive: boolean) =>
    `flex flex-row items-center gap-2 w-full rounded-md px-3 py-2 text-sm font-medium
     transition-colors hover:bg-white/10 hover:text-white focus:bg-white/10
     focus:text-white focus:outline-none disabled:pointer-events-none disabled:opacity-50
     ${isActive ? "bg-white/20 text-white font-semibold" : ""}`

  const isQuickLinkActive = (url: string) => {
    const path = url?.split("?")[0] || url
    return pathname === path || (path !== "/" && pathname.startsWith(path + "/"))
  }

  return (
    <Sidebar style={{ backgroundColor: "#0f4c75" }} className="text-white">
      <SidebarHeader className="flex items-center justify-center py-4 border-b border-white/10">
        <Link href="/" className="flex flex-col items-center justify-center w-full gap-2">
          <HospitalLogoImage variant="sidebar" className="max-w-[180px]" />
          <div className="flex flex-col items-center text-center">
            <span className="text-lg font-bold tracking-tight text-white">KIPLOMBE</span>
            <span className="text-xs font-medium text-white/90">Medical Centre</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        {hasQuickLinks && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-white/70">My links</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {quickLinks.map((link: { label: string; url: string; icon?: string }, idx: number) => {
                  const IconComponent = (LucideIcons as any)[link.icon || "ArrowRight"] || ArrowRight
                  const active = isQuickLinkActive(link.url || "")
                  return (
                    <SidebarMenuItem key={`quick-${idx}-${link.url}`}>
                      <Link href={link.url || "#"} className={sidebarLinkClass(active)}>
                        <IconComponent className="h-4 w-4 flex-shrink-0" />
                        <span>{link.label}</span>
                      </Link>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/70">{currentCategory.title}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {allowedItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <SidebarMenuItem key={item.href}>
                    <Link href={item.href} className={sidebarLinkClass(isActive)}>
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
            <Link href="/help" className={sidebarLinkClass(pathname === "/help")}>
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
