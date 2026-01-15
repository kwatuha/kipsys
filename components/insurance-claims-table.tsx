"use client"

import { useState, useEffect } from "react"
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
import { Progress } from "@/components/ui/progress"
import { MoreHorizontal, FileText, CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { insuranceApi } from "@/lib/api"
import { ClaimDetailsDialog } from "@/components/claim-details-dialog"
import { toast } from "sonner"

export function InsuranceClaimsTable() {
  const [claims, setClaims] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  useEffect(() => {
    loadClaims()
  }, [])

  const loadClaims = async () => {
    try {
      setLoading(true)
      const data = await insuranceApi.getClaims()
      setClaims(data)
    } catch (error: any) {
      console.error('Error loading claims:', error)
      toast.error('Failed to load claims')
    } finally {
      setLoading(false)
    }
  }

  const handleViewDetails = (claimId: string) => {
    setSelectedClaimId(claimId)
    setDetailsOpen(true)
  }

  const filteredClaims = claims.filter(
    (claim) =>
      `${claim.firstName} ${claim.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.claimNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      claim.providerName?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      draft: { variant: 'outline' as const, label: 'Draft' },
      submitted: { variant: 'default' as const, label: 'Submitted' },
      under_review: { variant: 'default' as const, label: 'Under Review' },
      approved: { variant: 'default' as const, label: 'Approved', className: 'bg-green-500' },
      partially_approved: { variant: 'default' as const, label: 'Partially Approved' },
      rejected: { variant: 'destructive' as const, label: 'Rejected' },
      paid: { variant: 'default' as const, label: 'Paid', className: 'bg-blue-500' },
    }

    const config = variants[status] || { variant: 'outline' as const, label: status }
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
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
        <Button variant="outline" size="sm" onClick={loadClaims} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Refresh'}
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Claim Number</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Amount (KES)</TableHead>
              <TableHead>Claim Date</TableHead>
              <TableHead>Requirements</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No claims found
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map((claim) => (
                <TableRow key={claim.claimId}>
                  <TableCell className="font-medium">{claim.claimNumber}</TableCell>
                  <TableCell>
                    {claim.firstName} {claim.lastName}
                    <div className="text-xs text-muted-foreground">{claim.patientNumber}</div>
                  </TableCell>
                  <TableCell>{claim.providerName}</TableCell>
                  <TableCell>KES {parseFloat(claim.claimAmount || 0).toLocaleString()}</TableCell>
                  <TableCell>
                    {claim.claimDate ? new Date(claim.claimDate).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    {claim.requirementsMet !== undefined ? (
                      <div className="flex items-center gap-2">
                        {claim.requirementsMet ? (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Complete
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Incomplete
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">N/A</span>
                    )}
                  </TableCell>
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
                        <DropdownMenuItem onClick={() => handleViewDetails(claim.claimId.toString())}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span>View Details & Requirements</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ClaimDetailsDialog
        claimId={selectedClaimId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onUpdate={loadClaims}
      />
    </div>
  )
}
