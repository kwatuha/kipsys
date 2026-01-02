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

interface InsuranceProvider {
  id: string
  name: string
  contactPerson: string
  email: string
  phone: string
  active: boolean
}

const providers: InsuranceProvider[] = [
  {
    id: "INS-001",
    name: "NHIF",
    contactPerson: "John Mwangi",
    email: "john.mwangi@nhif.or.ke",
    phone: "+254 712 345 678",
    active: true,
  },
  {
    id: "INS-002",
    name: "AAR Insurance",
    contactPerson: "Sarah Ochieng",
    email: "sarah.o@aar.co.ke",
    phone: "+254 723 456 789",
    active: true,
  },
  {
    id: "INS-003",
    name: "Jubilee Insurance",
    contactPerson: "David Kimani",
    email: "david.k@jubilee.co.ke",
    phone: "+254 734 567 890",
    active: true,
  },
  {
    id: "INS-004",
    name: "Britam Insurance",
    contactPerson: "Mary Wanjiku",
    email: "mary.w@britam.com",
    phone: "+254 745 678 901",
    active: true,
  },
  {
    id: "INS-005",
    name: "CIC Insurance",
    contactPerson: "James Omondi",
    email: "james.o@cic.co.ke",
    phone: "+254 756 789 012",
    active: false,
  },
]

export function InsuranceProvidersTable() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Provider</TableHead>
            <TableHead>Contact Person</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {providers.map((provider) => (
            <TableRow key={provider.id}>
              <TableCell className="font-medium">
                {provider.name}
                <div className="text-xs text-muted-foreground">{provider.id}</div>
              </TableCell>
              <TableCell>{provider.contactPerson}</TableCell>
              <TableCell>
                {provider.email}
                <div className="text-xs text-muted-foreground">{provider.phone}</div>
              </TableCell>
              <TableCell>
                {provider.active ? (
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
