"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { billingApi } from "@/lib/api"
import { Loader2, Download, X } from "lucide-react"
import { InvoiceInsuranceClaim } from "@/components/invoice-insurance-claim"
import { formatDate } from "@/lib/date-utils"

interface InvoiceDetailsDialogProps {
  invoiceId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function InvoiceDetailsDialog({ invoiceId, open, onOpenChange, onUpdate }: InvoiceDetailsDialogProps) {
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open && invoiceId) {
      loadInvoice()
    }
  }, [open, invoiceId])

  const loadInvoice = async () => {
    try {
      setLoading(true)
      const data = await billingApi.getInvoiceById(invoiceId!)
      setInvoice(data)
    } catch (error: any) {
      console.error('Error loading invoice:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      paid: { variant: 'default' as const, label: 'Paid', className: 'bg-green-500' },
      pending: { variant: 'outline' as const, label: 'Pending' },
      cancelled: { variant: 'destructive' as const, label: 'Cancelled' },
      partial: { variant: 'secondary' as const, label: 'Partial' },
    }

    const config = variants[status?.toLowerCase()] || { variant: 'outline' as const, label: status }
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!invoice) {
    return null
  }

  const totalAmount = parseFloat(invoice.totalAmount || 0)
  const paidAmount = parseFloat(invoice.paidAmount || 0)
  const balance = parseFloat(invoice.balance || totalAmount)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details - {invoice.invoiceNumber}</DialogTitle>
          <DialogDescription>
            Patient: {invoice.patientFirstName} {invoice.patientLastName} ({invoice.patientNumber})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Invoice Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Invoice Date</p>
                  <p className="text-sm font-medium">
                    {invoice.invoiceDate ? formatDate(invoice.invoiceDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Due Date</p>
                  <p className="text-sm font-medium">
                    {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-semibold">{formatCurrency(totalAmount)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                </div>
              </div>
              {balance > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Paid Amount</p>
                      <p className="text-sm font-medium">{formatCurrency(paidAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Balance</p>
                      <p className="text-sm font-semibold text-orange-600">{formatCurrency(balance)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Insurance Claim Section */}
          <InvoiceInsuranceClaim
            invoiceId={invoiceId!}
            invoiceNumber={invoice.invoiceNumber}
            patientId={invoice.patientId?.toString() || ''}
            onUpdate={() => {
              loadInvoice()
              onUpdate?.()
            }}
          />

          {/* Invoice Items */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Invoice Items</h3>
              {invoice.items && invoice.items.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoice.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.description || item.itemDescription || 'Service'}</TableCell>
                          <TableCell className="text-right">{item.quantity || 1}</TableCell>
                          <TableCell className="text-right">{formatCurrency(parseFloat(item.unitPrice || item.price || 0))}</TableCell>
                          <TableCell className="text-right font-medium">
                            {formatCurrency(parseFloat(item.totalPrice || item.total || 0))}
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="font-semibold">
                        <TableCell colSpan={3} className="text-right">Total</TableCell>
                        <TableCell className="text-right">{formatCurrency(totalAmount)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No items found</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

