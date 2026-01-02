"use client"

import { useState } from "react"
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
import { MoreHorizontal, FileText, CheckCircle, XCircle, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

type ClaimStatus = "Pending" | "Approved" | "Rejected" | "In Review"

interface Claim {
  id: string
  patientName: string
  patientId: string
  provider: string
  amount: number
  submissionDate: string
  status: ClaimStatus
}

const claims: Claim[] = [
  {
    id: "CLM-001",
    patientName: "John Kamau",
    patientId: "P-1001",
    provider: "NHIF",
    amount: 15000,
    submissionDate: "2023-04-15",
    status: "Approved",
  },
  {
    id: "CLM-002",
    patientName: "Mary Wanjiku",
    patientId: "P-1002",
    provider: "AAR Insurance",
    amount: 8500,
    submissionDate: "2023-04-18",
    status: "Pending",
  },
  {
    id: "CLM-003",
    patientName: "James Omondi",
    patientId: "P-1003",
    provider: "Jubilee Insurance",
    amount: 22000,
    submissionDate: "2023-04-10",
    status: "Rejected",
  },
  {
    id: "CLM-004",
    patientName: "Sarah Achieng",
    patientId: "P-1004",
    provider: "NHIF",
    amount: 12500,
    submissionDate: "2023-04-20",
    status: "In Review",
  },
  {
    id: "CLM-005",
    patientName: "David Mwangi",
    patientId: "P-1005",
    provider: "Britam Insurance",
    amount: 18000,
    submissionDate: "2023-04-12",
    status: "Approved",
  },
  {
    id: "CLM-006",
    patientName: "Elizabeth Njeri",
    patientId: "P-1006",
    provider: "CIC Insurance",
    amount: 9500,
    submissionDate: "2023-04-22",
    status: "Pending",
  },
  {
    id: "CLM-007",
    patientName: "Michael Kipchoge",
    patientId: "P-1007",
    provider: "Madison Insurance",
    amount: 14000,
    submissionDate: "2023-04-08",
    status: "Approved",
  },
  {
    id: "CLM-008",
    patientName: "Grace Wambui",
    patientId: "P-1008",
    provider: "NHIF",
    amount: 7500,
    submissionDate: "2023-04-25",
    status: "In Review",
  },
]

export function InsuranceClaimsTable() {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClaims = claims.filter(
    (claim) =>
      claim.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.provider.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: ClaimStatus) => {
    switch (status) {
      case "Approved":
        return <Badge className="bg-green-500">Approved</Badge>
      case "Pending":
        return <Badge variant="outline">Pending</Badge>
      case "Rejected":
        return <Badge variant="destructive">Rejected</Badge>
      case "In Review":
        return <Badge className="bg-yellow-500">In Review</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder="Search claims..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim ID</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Amount (KES)</TableHead>
              <TableHead>Submission Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredClaims.map((claim) => (
              <TableRow key={claim.id}>
                <TableCell className="font-medium">{claim.id}</TableCell>
                <TableCell>
                  {claim.patientName}
                  <div className="text-xs text-muted-foreground">{claim.patientId}</div>
                </TableCell>
                <TableCell>{claim.provider}</TableCell>
                <TableCell>{claim.amount.toLocaleString()}</TableCell>
                <TableCell>{new Date(claim.submissionDate).toLocaleDateString()}</TableCell>
                <TableCell>{getStatusBadge(claim.status)}</TableCell>
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
                        <FileText className="mr-2 h-4 w-4" />
                        <span>View Details</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        <span>Approve</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <XCircle className="mr-2 h-4 w-4" />
                        <span>Reject</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span>Flag for Review</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
