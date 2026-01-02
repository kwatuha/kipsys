import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PlusCircle, Search, Edit, Trash2, Eye } from "lucide-react"
import Link from "next/link"
import { BreadcrumbsEnhanced } from "@/components/breadcrumbs-enhanced"

export default function ProcurementOrdersPage() {
  // Mock data for procurement orders
  const orders = [
    {
      id: "PO-2023-001",
      vendorId: "V-001",
      vendorName: "Medequip Supplies Ltd",
      dateCreated: "2023-10-15",
      dateRequired: "2023-10-30",
      status: "approved",
      totalAmount: 245000,
      items: 12,
    },
    {
      id: "PO-2023-002",
      vendorId: "V-003",
      vendorName: "Pharma Distributors Kenya",
      dateCreated: "2023-10-16",
      dateRequired: "2023-11-05",
      status: "pending",
      totalAmount: 187500,
      items: 8,
    },
    {
      id: "PO-2023-003",
      vendorId: "V-007",
      vendorName: "Medical Imaging Solutions",
      dateCreated: "2023-10-18",
      dateRequired: "2023-12-01",
      status: "draft",
      totalAmount: 1250000,
      items: 3,
    },
    {
      id: "PO-2023-004",
      vendorId: "V-002",
      vendorName: "Laboratory Supplies Co.",
      dateCreated: "2023-10-20",
      dateRequired: "2023-11-10",
      status: "received",
      totalAmount: 78500,
      items: 15,
    },
    {
      id: "PO-2023-005",
      vendorId: "V-005",
      vendorName: "Surgical Instruments Kenya",
      dateCreated: "2023-10-22",
      dateRequired: "2023-11-15",
      status: "approved",
      totalAmount: 325000,
      items: 7,
    },
    {
      id: "PO-2023-006",
      vendorId: "V-010",
      vendorName: "Office Supplies Nairobi",
      dateCreated: "2023-10-25",
      dateRequired: "2023-11-05",
      status: "pending",
      totalAmount: 45000,
      items: 22,
    },
    {
      id: "PO-2023-007",
      vendorId: "V-004",
      vendorName: "Cleaning Solutions Ltd",
      dateCreated: "2023-10-27",
      dateRequired: "2023-11-10",
      status: "approved",
      totalAmount: 62500,
      items: 10,
    },
    {
      id: "PO-2023-008",
      vendorId: "V-008",
      vendorName: "IT Hardware Suppliers",
      dateCreated: "2023-10-28",
      dateRequired: "2023-12-15",
      status: "draft",
      totalAmount: 875000,
      items: 6,
    },
  ]

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
        <h1 className="text-2xl font-bold tracking-tight">Procurement Orders</h1>
        <Link href="/procurement/orders/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Orders Management</CardTitle>
          <CardDescription>Manage purchase orders for hospital supplies, equipment, and services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" placeholder="Search orders..." className="pl-8 w-full" />
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending Approval</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="newest">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount-high">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-low">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order ID</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date Created</TableHead>
                  <TableHead>Required By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{order.vendorName}</div>
                      <div className="text-xs text-muted-foreground">{order.vendorId}</div>
                    </TableCell>
                    <TableCell>{order.dateCreated}</TableCell>
                    <TableCell>{order.dateRequired}</TableCell>
                    <TableCell>{renderStatusBadge(order.status)}</TableCell>
                    <TableCell>{order.items}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(order.totalAmount)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/procurement/orders/${order.id}`}>
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">View</span>
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing <strong>8</strong> of <strong>8</strong> orders
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
