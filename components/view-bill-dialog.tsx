"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { billingApi } from "@/lib/api"
import { Loader2, Receipt } from "lucide-react"
import { formatDate } from "@/lib/date-utils"

interface ViewBillDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  patientId: number
  queueNotes?: string
}

export function ViewBillDialog({ open, onOpenChange, patientId, queueNotes }: ViewBillDialogProps) {
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && patientId) {
      loadPendingInvoices()
    }
  }, [open, patientId])

  const loadPendingInvoices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await billingApi.getPendingInvoicesForPatient(patientId.toString())
      setInvoices(data || [])
    } catch (err: any) {
      console.error("Error loading pending invoices:", err)
      setError(err.message || "Failed to load bills")
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | string | null) => {
    if (amount === null || amount === undefined) return "KES 0.00"
    const num = typeof amount === 'string' ? parseFloat(amount) : amount
    return `KES ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return <Badge variant="default">Paid</Badge>
      case "partial":
        return <Badge variant="secondary">Partial</Badge>
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status || "Pending"}</Badge>
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Patient Bills
          </DialogTitle>
          <DialogDescription>
            {queueNotes && (
              <div className="mt-2 p-2 bg-muted rounded-md">
                <span className="text-sm font-medium">Queue Note: </span>
                <span className="text-sm">{queueNotes}</span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Loading bills...</span>
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-destructive">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              No pending bills found for this patient
            </p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="py-8 text-center">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No pending bills found for this patient</p>
            {queueNotes && (
              <p className="text-xs text-muted-foreground mt-2">
                Bill may need to be created based on: {queueNotes}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {invoices.map((invoice) => (
              <div key={invoice.invoiceId} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Invoice #{invoice.invoiceNumber}</h3>
                    <p className="text-sm text-muted-foreground">
                      Date: {formatDate(invoice.invoiceDate)}
                      {invoice.dueDate && ` | Due: ${formatDate(invoice.dueDate)}`}
                    </p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(invoice.status)}
                    <div className="mt-2">
                      <p className="text-sm text-muted-foreground">Total Amount</p>
                      <p className="text-lg font-bold">{formatCurrency(invoice.totalAmount)}</p>
                      {invoice.paidAmount > 0 && (
                        <>
                          <p className="text-xs text-muted-foreground mt-1">
                            Paid: {formatCurrency(invoice.paidAmount)}
                          </p>
                          <p className="text-xs font-medium">
                            Balance: {formatCurrency(invoice.balance)}
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {invoice.items && invoice.items.length > 0 && (
                  <div className="border-t pt-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Quantity</TableHead>
                          <TableHead className="text-right">Unit Price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoice.items.map((item: any) => (
                          <TableRow key={item.itemId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">
                                  {item.chargeName || item.description || "Item"}
                                </div>
                                {item.chargeCode && (
                                  <div className="text-xs text-muted-foreground">
                                    Code: {item.chargeCode}
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right">{item.quantity || 1}</TableCell>
                            <TableCell className="text-right">
                              {formatCurrency(item.unitPrice)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(item.totalPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {invoice.notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm">
                      <span className="font-medium">Notes: </span>
                      <span className="text-muted-foreground">{invoice.notes}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}

            {invoices.length > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total Pending Amount:</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(
                      invoices.reduce((sum, inv) => sum + parseFloat(inv.balance || inv.totalAmount || 0), 0)
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}


