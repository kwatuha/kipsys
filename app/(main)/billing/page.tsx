"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Loader2, MoreVertical, Eye, DollarSign, Trash2, FileText, Printer } from "lucide-react"
import { billingApi } from "@/lib/api"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import { ViewBillDialog } from "@/components/view-bill-dialog"
import { MobilePaymentLogsSection } from "@/components/mobile-payment-logs-section"

export default function BillingPage() {
  const [isMounted, setIsMounted] = useState(false)
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string | null>(null)
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingInvoice, setDeletingInvoice] = useState<any>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentDate, setPaymentDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [recordingPayment, setRecordingPayment] = useState(false)
  const [stats, setStats] = useState<any>(null)
  const [statsLoading, setStatsLoading] = useState(true)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted) {
      loadInvoices()
      loadStats()
    }
  }, [isMounted, statusFilter])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const data = await billingApi.getInvoices(undefined, statusFilter || undefined)
      setInvoices(data || [])
    } catch (error: any) {
      console.error("Error loading invoices:", error)
      toast({
        title: "Error loading invoices",
        description: error.message || "Failed to load invoices",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      setStatsLoading(true)
      const data = await billingApi.getInvoiceStats()
      setStats(data)
    } catch (error: any) {
      console.error("Error loading stats:", error)
    } finally {
      setStatsLoading(false)
    }
  }

  const handleView = async (invoice: any) => {
    try {
      const details = await billingApi.getInvoiceById(invoice.invoiceId.toString())
      setSelectedInvoice(details)
      setViewDialogOpen(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load invoice details",
        variant: "destructive",
      })
    }
  }

  const handleDeleteClick = (invoice: any) => {
    setDeletingInvoice(invoice)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingInvoice) return

    try {
      setDeleteLoading(true)
      await billingApi.deleteInvoice(deletingInvoice.invoiceId.toString())
      toast({
        title: "Success",
        description: "Invoice deleted successfully",
      })
      setDeleteDialogOpen(false)
      setDeletingInvoice(null)
      loadInvoices()
      loadStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete invoice",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRecordPaymentClick = (invoice: any) => {
    setSelectedInvoice(invoice)
    setPaymentAmount(invoice.balance > 0 ? invoice.balance.toString() : "")
    setPaymentDate(format(new Date(), "yyyy-MM-dd"))
    setPaymentMethod("cash")
    setPaymentReference("")
    setPaymentDialogOpen(true)
  }

  const handleRecordPayment = async () => {
    if (!selectedInvoice || !paymentAmount || parseFloat(paymentAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid payment amount",
        variant: "destructive",
      })
      return
    }

    try {
      setRecordingPayment(true)
      await billingApi.recordPayment(selectedInvoice.invoiceId.toString(), {
        paymentAmount: parseFloat(paymentAmount),
        paymentDate,
        paymentMethod,
        referenceNumber: paymentReference || undefined,
      })
      toast({
        title: "Success",
        description: "Payment recorded successfully",
      })
      setPaymentDialogOpen(false)
      setSelectedInvoice(null)
      loadInvoices()
      loadStats()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record payment",
        variant: "destructive",
      })
    } finally {
      setRecordingPayment(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "default"
      case "partial":
        return "secondary"
      case "pending":
        return "outline"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
    }
  }

  const filteredInvoices = invoices.filter((invoice) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      invoice.invoiceNumber?.toLowerCase().includes(query) ||
      `${invoice.patientFirstName || ""} ${invoice.patientLastName || ""}`.toLowerCase().includes(query) ||
      invoice.patientNumber?.toLowerCase().includes(query)
    )
  })

  const formatDate = (date: string) => {
    if (!date) return "-"
    return format(new Date(date), "MMM dd, yyyy")
  }

  if (!isMounted) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoicing</h1>
          <p className="text-muted-foreground">Manage patient bills, invoices, and payments</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing & Invoicing</h1>
          <p className="text-muted-foreground">Manage patient bills, invoices, and payments</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Billed (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(parseFloat(stats?.paidThisMonthAmount || 0) + parseFloat(stats?.pendingAmount || 0) + parseFloat(stats?.partialAmount || 0))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? "Loading..." : `${stats?.totalInvoices || 0} invoices`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Payments Received</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(parseFloat(stats?.paidAmount || 0))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? "Loading..." : `${stats?.paidCount || 0} paid invoices`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(parseFloat(stats?.pendingAmount || 0) + parseFloat(stats?.partialAmount || 0))
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {statsLoading ? "Loading..." : `${(stats?.pendingCount || 0)} pending invoices`}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                formatCurrency(parseFloat(stats?.overdueAmount || 0))
              )}
            </div>
            <p className="text-xs text-muted-foreground">Overdue invoices</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="mobile-payments">Mobile Payment Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Patient Bills</CardTitle>
              <CardDescription>View and manage patient bills and invoices</CardDescription>
            </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === "paid" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("paid")}
              >
                Paid
              </Button>
              <Button
                variant={statusFilter === "partial" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("partial")}
              >
                Partial
              </Button>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search bills..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Method</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mt-2">Loading invoices...</p>
                    </TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.invoiceId}>
                      <TableCell className="font-medium">{invoice.invoiceNumber || "-"}</TableCell>
                      <TableCell>
                        {invoice.patientFirstName || invoice.patientLastName
                          ? `${invoice.patientFirstName || ""} ${invoice.patientLastName || ""}`.trim()
                          : "-"}
                        {invoice.patientNumber && (
                          <div className="text-xs text-muted-foreground">{invoice.patientNumber}</div>
                        )}
                      </TableCell>
                      <TableCell>{formatDate(invoice.invoiceDate)}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(invoice.totalAmount))}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(invoice.paidAmount || 0))}</TableCell>
                      <TableCell>{formatCurrency(parseFloat(invoice.balance))}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(invoice.status)}>
                          {invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{invoice.paymentMethod || "-"}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(invoice)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            {invoice.status !== "paid" && parseFloat(invoice.balance) > 0 && (
                              <DropdownMenuItem onClick={() => handleRecordPaymentClick(invoice)}>
                                <DollarSign className="mr-2 h-4 w-4" />
                                Record Payment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem>
                              <Printer className="mr-2 h-4 w-4" />
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDeleteClick(invoice)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
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
        </CardContent>
      </Card>
        </TabsContent>

        <TabsContent value="mobile-payments" className="space-y-4">
          <MobilePaymentLogsSection />
        </TabsContent>
      </Tabs>

      {selectedInvoice && (
        <ViewBillDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          patientId={selectedInvoice.patientId}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this invoice? This action cannot be undone.
              {deletingInvoice && (
                <div className="mt-2 p-2 bg-muted rounded">
                  <p className="font-medium">Invoice: {deletingInvoice.invoiceNumber}</p>
                  <p className="text-sm">
                    Patient: {deletingInvoice.patientFirstName} {deletingInvoice.patientLastName}
                  </p>
                  <p className="text-sm">Balance: {formatCurrency(parseFloat(deletingInvoice.balance))}</p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {selectedInvoice?.invoiceNumber}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedInvoice && (
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm">
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(selectedInvoice.totalAmount))}</span>
                  </div>
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Paid:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(selectedInvoice.paidAmount || 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-medium">{formatCurrency(parseFloat(selectedInvoice.balance))}</span>
                  </div>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="paymentAmount">Payment Amount *</Label>
              <Input
                id="paymentAmount"
                type="number"
                step="0.01"
                min="0.01"
                max={selectedInvoice?.balance || undefined}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Enter payment amount"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date *</Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <select
                id="paymentMethod"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="card">Card</option>
                <option value="insurance">Insurance</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentReference">Reference Number</Label>
              <Input
                id="paymentReference"
                type="text"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Optional reference number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} disabled={recordingPayment}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordingPayment || !paymentAmount || parseFloat(paymentAmount) <= 0}>
              {recordingPayment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Recording...
                </>
              ) : (
                "Record Payment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
