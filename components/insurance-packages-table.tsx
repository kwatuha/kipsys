"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Edit, Trash, FileText } from "lucide-react"

interface InsurancePackage {
  id: string
  name: string
  provider: string
  coverageLimit: number
  annualPremium: number
  benefits: string[]
  active: boolean
}

const packages: InsurancePackage[] = [
  {
    id: "PKG-001",
    name: "Basic Cover",
    provider: "NHIF",
    coverageLimit: 500000,
    annualPremium: 6000,
    benefits: ["Outpatient", "Inpatient", "Maternity"],
    active: true,
  },
  {
    id: "PKG-002",
    name: "Gold Plan",
    provider: "AAR Insurance",
    coverageLimit: 2000000,
    annualPremium: 48000,
    benefits: ["Outpatient", "Inpatient", "Maternity", "Dental", "Optical", "Chronic Conditions"],
    active: true,
  },
  {
    id: "PKG-003",
    name: "Silver Plan",
    provider: "Jubilee Insurance",
    coverageLimit: 1000000,
    annualPremium: 24000,
    benefits: ["Outpatient", "Inpatient", "Maternity", "Dental"],
    active: true,
  },
  {
    id: "PKG-004",
    name: "Bronze Plan",
    provider: "Britam Insurance",
    coverageLimit: 750000,
    annualPremium: 18000,
    benefits: ["Outpatient", "Inpatient"],
    active: true,
  },
  {
    id: "PKG-005",
    name: "Platinum Plan",
    provider: "CIC Insurance",
    coverageLimit: 3000000,
    annualPremium: 72000,
    benefits: [
      "Outpatient",
      "Inpatient",
      "Maternity",
      "Dental",
      "Optical",
      "Chronic Conditions",
      "International Coverage",
    ],
    active: false,
  },
]

export function InsurancePackagesTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Provider</TableHead>
            <TableHead>Coverage Limit (KES)</TableHead>
            <TableHead>Annual Premium (KES)</TableHead>
            <TableHead>Benefits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.map((pkg) => (
            <TableRow key={pkg.id}>
              <TableCell className="font-medium">
                {pkg.name}
                <div className="text-xs text-muted-foreground">{pkg.id}</div>
              </TableCell>
              <TableCell>{pkg.provider}</TableCell>
              <TableCell>{pkg.coverageLimit.toLocaleString()}</TableCell>
              <TableCell>{pkg.annualPremium.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {pkg.benefits.slice(0, 3).map((benefit) => (
                    <Badge key={benefit} variant="outline" className="text-xs">
                      {benefit}
                    </Badge>
                  ))}
                  {pkg.benefits.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{pkg.benefits.length - 3} more
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {pkg.active ? (
                  <Badge className="bg-green-500">Active</Badge>
                ) : (
                  <Badge variant="outline">Inactive</Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      <span>Edit</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FileText className="mr-2 h-4 w-4" />
                      <span>View Details</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Trash className="mr-2 h-4 w-4" />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
