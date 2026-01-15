"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download, Eye, AlertCircle } from "lucide-react"
import { billingApi } from "@/lib/api"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { InvoiceDetailsDialog } from "@/components/invoice-details-dialog"

type Invoice = {
  id: string
  invoiceId?: number // Store invoiceId for lookup
  date: string
  amount: number
  status: string
  dueDate: string
  items: InvoiceItem[]
  paymentMethod: string
  paymentDate: string | null
  insuranceCoverage: number
  patientResponsibility: number
}

type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  total: number
  category: string
}

export function PatientBilling({ patientId }: { patientId: string }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoicesData, setInvoicesData] = useState<any[]>([]) // Store raw invoice data with IDs
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null)
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false)

  useEffect(() => {
    loadBilling()
  }, [patientId])

  const loadBilling = async () => {
    try {
      setLoading(true)
      setError(null)

      const invoicesData = await billingApi.getInvoices(patientId)
      setInvoicesData(invoicesData) // Store for invoice ID lookup

      const bills: Invoice[] = await Promise.all(invoicesData.map(async (inv: any) => {
        // Get invoice details including items
        let items: InvoiceItem[] = []
        try {
          const invoiceDetails = await billingApi.getInvoiceById(inv.invoiceId.toString())
          if (invoiceDetails.items && invoiceDetails.items.length > 0) {
            items = invoiceDetails.items.map((item: any) => ({
              description: item.description || item.itemDescription || item.serviceName || 'Service',
              quantity: item.quantity || 1,
              unitPrice: parseFloat(item.unitPrice || item.price || 0),
              total: parseFloat(item.total || item.totalAmount || 0),
              category: item.category || item.serviceCategory || 'General'
            }))
          }
        } catch (err) {
          console.error(`Error loading invoice ${inv.invoiceId} details:`, err)
        }

        const totalAmount = parseFloat(inv.totalAmount || 0)
        const paidAmount = parseFloat(inv.paidAmount || 0)
        const invoiceDate = new Date(inv.invoiceDate || inv.date || new Date())
        const dueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days default

        return {
          id: inv.invoiceNumber || `INV-${inv.invoiceId}`,
          invoiceId: inv.invoiceId, // Store invoiceId for dialog
          date: invoiceDate.toISOString().split('T')[0],
          amount: totalAmount,
          status: paidAmount >= totalAmount ? 'Paid' : 'Pending',
          dueDate: dueDate.toISOString().split('T')[0],
          items: items,
          paymentMethod: inv.paymentMethod || 'N/A',
          paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString().split('T')[0] : null,
          insuranceCoverage: parseFloat(inv.insuranceCoverage || inv.insuranceAmount || 0),
          patientResponsibility: totalAmount - parseFloat(inv.insuranceCoverage || inv.insuranceAmount || 0)
        }
      }))

      // Sort by date descending
      bills.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      setInvoices(bills)
    } catch (err: any) {
      console.error("Error loading billing:", err)
      setError(err.message || "Failed to load billing information")
    } finally {
      setLoading(false)
    }
  }

  const paidInvoices = invoices.filter((bill) => bill.status === "Paid")
  const pendingInvoices = invoices.filter((bill) => bill.status === "Pending")

  // Calculate totals
  const totalBilled = invoices.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPaid = paidInvoices.reduce((sum, bill) => sum + bill.amount, 0)
  const totalPending = pendingInvoices.reduce((sum, bill) => sum + bill.amount, 0)
  const totalInsuranceCoverage = invoices.reduce((sum, bill) => sum + bill.insuranceCoverage, 0)
  const totalPatientResponsibility = invoices.reduce((sum, bill) => sum + bill.patientResponsibility, 0)

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Payments</CardTitle>
          <CardDescription>Invoice history and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing & Payments</CardTitle>
          <CardDescription>Invoice history and payment information</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing & Payments</CardTitle>
        <CardDescription>Invoice history and payment information</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Total Billed</div>
              <div className="text-2xl font-bold">KES {totalBilled.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Insurance Coverage</div>
              <div className="text-2xl font-bold">KES {totalInsuranceCoverage.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-muted-foreground">Patient Responsibility</div>
              <div className="text-2xl font-bold">KES {totalPatientResponsibility.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Invoices</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="paid">Paid</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {invoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.insuranceCoverage.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.patientResponsibility.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={bill.status === "Paid" ? "default" : "secondary"}>{bill.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (bill.invoiceId) {
                                  setSelectedInvoiceId(bill.invoiceId.toString())
                                  setInvoiceDialogOpen(true)
                                }
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button variant="outline" size="sm">
                              <Download className="h-4 w-4 mr-1" />
                              PDF
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No invoices found</div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="space-y-4">
            {pendingInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Insurance</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvoices.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>{bill.dueDate}</TableCell>
                        <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.insuranceCoverage.toLocaleString()}</TableCell>
                        <TableCell>KES {bill.patientResponsibility.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <Button size="sm">Pay Now</Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No pending invoices found</div>
            )}
          </TabsContent>

          <TabsContent value="paid" className="space-y-4">
            {paidInvoices.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Payment Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidInvoices.map((bill) => (
                      <TableRow key={bill.id}>
                        <TableCell className="font-medium">{bill.id}</TableCell>
                        <TableCell>{bill.date}</TableCell>
                        <TableCell>KES {bill.amount.toLocaleString()}</TableCell>
                        <TableCell>{bill.paymentMethod}</TableCell>
                        <TableCell>{bill.paymentDate || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Receipt
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-4 text-muted-foreground">No paid invoices found</div>
            )}
          </TabsContent>
        </Tabs>

        <InvoiceDetailsDialog
          invoiceId={selectedInvoiceId}
          open={invoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          onUpdate={loadBilling}
        />
      </CardContent>
    </Card>
  )
}
