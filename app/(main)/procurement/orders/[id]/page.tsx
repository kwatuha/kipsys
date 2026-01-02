import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Printer, Download, Edit, ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { BreadcrumbsEnhanced } from "@/components/breadcrumbs-enhanced"

export default function ProcurementOrderDetailPage({ params }: { params: { id: string } }) {
  // Mock data for a specific order
  const order = {
    id: params.id,
    vendorId: "V-001",
    vendorName: "Medequip Supplies Ltd",
    vendorAddress: "123 Medical Plaza, Nairobi, Kenya",
    vendorContact: "+254 712 345 678",
    dateCreated: "2023-10-15",
    dateRequired: "2023-10-30",
    status: "approved",
    approvedBy: "Dr. James Mwangi",
    approvedDate: "2023-10-18",
    totalAmount: 245000,
    tax: 39200,
    grandTotal: 284200,
    notes:
      "Please ensure all items are delivered before the required date. Contact the procurement office for any clarifications.",
    items: [
      {
        id: 1,
        productId: "P-001",
        description: "Surgical Gloves (Box of 100)",
        quantity: 50,
        unitPrice: 1200,
        total: 60000,
      },
      {
        id: 2,
        productId: "P-003",
        description: "Blood Pressure Monitor",
        quantity: 5,
        unitPrice: 12500,
        total: 62500,
      },
      {
        id: 3,
        productId: "P-007",
        description: "Stethoscope",
        quantity: 8,
        unitPrice: 7500,
        total: 60000,
      },
      {
        id: 4,
        productId: "P-009",
        description: "Syringes (Box of 100)",
        quantity: 25,
        unitPrice: 1500,
        total: 37500,
      },
      {
        id: 5,
        productId: "P-004",
        description: "Surgical Masks (Box of 50)",
        quantity: 30,
        unitPrice: 800,
        total: 24000,
      },
    ],
  }

  // Function to render status badge with appropriate color
  const renderStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }
    > = {
      draft: { label: "Draft", variant: "outline" },
      pending: { label: "Pending Approval", variant: "secondary" },
      approved: { label: "Approved", variant: "success" },
      received: { label: "Received", variant: "default" },
      cancelled: { label: "Cancelled", variant: "destructive" },
    }

    const { label, variant } = statusMap[status] || { label: status, variant: "outline" }

    return <Badge variant={variant}>{label}</Badge>
  }

  // Function to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="space-y-4">
      <BreadcrumbsEnhanced />

      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/procurement/orders">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Order: {order.id}</h1>
          {renderStatusBadge(order.status)}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Purchase order information and line items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Order Header Information */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Vendor</h3>
                <div className="font-medium">{order.vendorName}</div>
                <div className="text-sm">{order.vendorAddress}</div>
                <div className="text-sm">{order.vendorContact}</div>
              </div>
              <div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Order Date</h3>
                    <div>{order.dateCreated}</div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Required By</h3>
                    <div>{order.dateRequired}</div>
                  </div>
                </div>
                {order.status === "approved" && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-muted-foreground mb-1">Approved By</h3>
                    <div>
                      {order.approvedBy} on {order.approvedDate}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Items */}
            <div>
              <h3 className="text-lg font-medium mb-3">Order Items</h3>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-center">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.productId}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell className="text-center">{item.quantity}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right font-medium">{formatCurrency(item.total)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end mt-4">
                <div className="w-[250px] space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(order.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax (16%):</span>
                    <span>{formatCurrency(order.tax)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-base">
                    <span>Total:</span>
                    <span>{formatCurrency(order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            {order.notes && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Notes</h3>
                <div className="text-sm p-3 bg-muted rounded-md">{order.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Order Status</CardTitle>
            <CardDescription>Track the current status of this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Created</div>
                  <div className="text-sm text-muted-foreground">{order.dateCreated}</div>
                  <div className="text-sm">Order created by John Doe</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Submitted for Approval</div>
                  <div className="text-sm text-muted-foreground">2023-10-16</div>
                  <div className="text-sm">Submitted by John Doe</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <div className="font-medium">Approved</div>
                  <div className="text-sm text-muted-foreground">{order.approvedDate}</div>
                  <div className="text-sm">Approved by {order.approvedBy}</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-muted mt-0.5" />
                <div>
                  <div className="font-medium">Sent to Vendor</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full border-2 border-muted mt-0.5" />
                <div>
                  <div className="font-medium">Received</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <div className="w-full space-y-2">
              {order.status === "approved" && (
                <Button className="w-full">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark as Sent to Vendor
                </Button>
              )}
              {order.status === "pending" && (
                <div className="flex gap-2 w-full">
                  <Button className="flex-1" variant="success">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button className="flex-1" variant="destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
