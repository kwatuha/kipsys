"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

// Define route mappings for special cases and better naming
const routeMappings: Record<string, string> = {
  patients: "Patients",
  doctors: "Doctors",
  "medical-records": "Medical Records",
  appointments: "Appointments",
  pharmacy: "Pharmacy",
  laboratory: "Laboratory",
  radiology: "Radiology",
  billing: "Billing",
  finance: "Finance",
  hr: "Human Resources",
  settings: "Settings",
  analytics: "Analytics",
  triaging: "Triaging",
  inpatient: "Inpatient",
  maternity: "Maternity",
  icu: "ICU",
  payable: "Accounts Payable",
  receivable: "Accounts Receivable",
  budgeting: "Budgeting",
  cash: "Cash Management",
  assets: "Assets",
  ledger: "General Ledger",
  charges: "Service Charges",
  procurement: "Procurement",
  vendors: "Vendors",
  insurance: "Insurance",
  "revenue-share": "Revenue Share",
}

export function BreadcrumbsEnhanced() {
  const pathname = usePathname()

  // Skip rendering breadcrumbs on the home page
  if (pathname === "/") {
    return null
  }

  // Split the pathname into segments and remove empty strings
  const segments = pathname.split("/").filter(Boolean)

  // Generate breadcrumb items
  const breadcrumbs = [
    { name: "Dashboard", href: "/" },
    ...segments.map((segment, index) => {
      const href = `/${segments.slice(0, index + 1).join("/")}`

      // Check if this is an ID segment (numeric value after a known entity)
      const isIdSegment =
        !isNaN(Number(segment)) && index > 0 && ["patients", "doctors", "appointments"].includes(segments[index - 1])

      // Format the segment name
      let name
      if (isIdSegment) {
        const entityType = segments[index - 1]
        // Remove trailing 's' and capitalize
        const entityName = entityType.charAt(0).toUpperCase() + entityType.slice(1, -1)
        name = `${entityName} #${segment}`
      } else {
        // Use the mapping if available, otherwise format the segment
        name = routeMappings[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ")
      }

      return { name, href }
    }),
  ]

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center text-sm">
      <ol className="flex items-center space-x-1">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && <ChevronRight className="mx-1 h-4 w-4 text-muted-foreground/50" />}
            {index === 0 ? (
              <Link
                href={breadcrumb.href}
                className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Home className="h-4 w-4" />
                <span className="sr-only">Home</span>
              </Link>
            ) : index === breadcrumbs.length - 1 ? (
              <span className="font-medium text-foreground">{breadcrumb.name}</span>
            ) : (
              <Link href={breadcrumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                {breadcrumb.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
