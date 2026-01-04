import {
  Activity,
  Calendar,
  ClipboardList,
  FileText,
  Home,
  Pill,
  Settings,
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
  Shield,
  Bell,
} from "lucide-react"

export interface NavigationItem {
  title: string
  href: string
  icon: any
  description?: string
}

export interface NavigationCategory {
  id: string
  title: string
  icon: any
  description: string
  items: NavigationItem[]
}

export const navigationCategories: NavigationCategory[] = [
  {
    id: "overview",
    title: "Dashboard",
    icon: Home,
    description: "Main dashboard and overview sections",
    items: [
      {
        title: "Dashboard",
        icon: Home,
        href: "/",
      },
      {
        title: "Departments",
        href: "/departments",
        icon: Building2,
      },
      {
        title: "Analytics",
        icon: BarChart3,
        href: "/analytics",
      },
      {
        title: "Regional Dashboard",
        icon: MapPin,
        href: "/regional-dashboard",
      },
    ],
  },
  {
    id: "patient-care",
    title: "Patient Care",
    icon: Users,
    description: "Patient management and care services",
    items: [
      {
        title: "Patient Registration",
        icon: Users,
        href: "/patients",
      },
      {
        title: "Triaging",
        icon: Activity,
        href: "/triaging",
      },
      {
        title: "Appointments",
        icon: Calendar,
        href: "/appointments",
      },
      {
        title: "Queue Management",
        icon: ListOrdered,
        href: "/queue",
      },
      {
        title: "Medical Records",
        icon: FileText,
        href: "/medical-records",
      },
    ],
  },
  {
    id: "clinical-services",
    title: "Clinical Services",
    icon: Stethoscope,
    description: "Clinical departments and services",
    items: [
      {
        title: "Doctors Module",
        icon: Stethoscope,
        href: "/doctors",
      },
      {
        title: "Pharmacy",
        icon: Pill,
        href: "/pharmacy",
      },
      {
        title: "Laboratory",
        icon: FlaskConical,
        href: "/laboratory",
      },
      {
        title: "Radiology",
        icon: ImageIcon,
        href: "/radiology",
      },
      {
        title: "Inpatient",
        icon: BedDouble,
        href: "/inpatient",
      },
      {
        title: "Maternity",
        icon: Baby,
        href: "/maternity",
      },
      {
        title: "ICU",
        icon: HeartPulse,
        href: "/icu",
      },
    ],
  },
  {
    id: "financial",
    title: "Financial Management",
    icon: DollarSign,
    description: "Financial operations and billing",
    items: [
      {
        title: "General Ledger",
        icon: Clipboard,
        href: "/finance/ledger",
      },
      {
        title: "Accounts Payable",
        icon: Receipt,
        href: "/finance/payable",
      },
      {
        title: "Accounts Receivable",
        icon: CreditCard,
        href: "/finance/receivable",
      },
      {
        title: "Budgeting",
        icon: DollarSign,
        href: "/finance/budgeting",
      },
      {
        title: "Cash Management",
        icon: DollarSign,
        href: "/finance/cash",
      },
      {
        title: "Fixed Assets",
        icon: Building2,
        href: "/finance/assets",
      },
      {
        title: "Hospital Charges",
        icon: DollarSign,
        href: "/finance/charges",
      },
      {
        title: "Revenue Share",
        icon: DollarSign,
        href: "/finance/revenue-share",
      },
      {
        title: "Billing & Invoicing",
        icon: Receipt,
        href: "/billing",
      },
      {
        title: "Insurance Management",
        icon: FileText,
        href: "/insurance",
      },
    ],
  },
  {
    id: "procurement",
    title: "Procurement & Inventory",
    icon: ShoppingCart,
    description: "Procurement and inventory management",
    items: [
      {
        title: "Vendor Management",
        icon: Users,
        href: "/procurement/vendors",
      },
      {
        title: "Purchase Orders",
        icon: ShoppingCart,
        href: "/procurement/orders",
      },
      {
        title: "Inventory Overview",
        icon: Grid,
        href: "/inventory",
      },
      {
        title: "Add Inventory Item",
        icon: PlusCircle,
        href: "/inventory/new",
      },
      {
        title: "Stock Adjustment",
        icon: Layers,
        href: "/inventory/adjust",
      },
      {
        title: "Inventory Analytics",
        icon: BarChart3,
        href: "/inventory/analytics",
      },
      {
        title: "Drug Notifications",
        icon: Bell,
        href: "/procurement/notifications",
      },
    ],
  },
  {
    id: "administrative",
    title: "Administrative",
    icon: UserCog,
    description: "HR and administrative functions",
    items: [
      {
        title: "Employee Management",
        icon: UserCog,
        href: "/hr/employees",
      },
      {
        title: "System Administration",
        icon: Shield,
        href: "/administration",
      },
      {
        title: "Clinical Configuration",
        icon: ClipboardList,
        href: "/configuration",
      },
      {
        title: "Settings",
        icon: Settings,
        href: "/settings",
      },
    ],
  },
]

export function getCategoryById(id: string): NavigationCategory | undefined {
  return navigationCategories.find(category => category.id === id)
}

export function getCategoryByPath(pathname: string): NavigationCategory {
  // Find the category that contains the current path
  for (const category of navigationCategories) {
    if (category.items.some(item => pathname.startsWith(item.href))) {
      return category
    }
  }
  // Default to overview if no match found
  return navigationCategories[0]
} 