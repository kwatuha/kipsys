"use client"
import {
  ArrowLeft,
  Edit,
  Trash2,
  History,
  Truck,
  BarChart3,
  Package,
  Layers,
  Calendar,
  MapPin,
  Tag,
  DollarSign,
  QrCode,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from "next/link"
import { BreadcrumbsEnhanced } from "@/components/breadcrumbs-enhanced"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"

export default function InventoryItemPage({ params }: { params: { id: string } }) {
  // In a real application, you would fetch the item data based on the ID
  // For this example, we'll use mock data
  const item = {
    id: params.id,
    name: "Surgical Gloves (Medium)",
    sku: "SG-M-001",
    category: "Medical Supplies",
    subcategory: "Protective Equipment",
    location: "Main Storage A1",
    shelf: "Shelf 3",
    bin: "Bin 12",
    currentStock: 1250,
    minStock: 500,
    maxStock: 2000,
    unitPrice: 8.5,
    totalValue: 10625.0,
    status: "In Stock",
    expiryDate: "2025-06-15",
    lastUpdated: "2023-04-10",
    batchNumber: "BT-2023-045",
    supplier: "MediSupply Ltd",
    supplierContact: "supplier@example.com",
    manufacturer: "SafeHands Medical",
    description:
      "Latex-free surgical gloves, medium size, powder-free, sterile, disposable. Suitable for surgical procedures and examination.",
    unitOfMeasure: "Box of 100",
    reorderPoint: 600,
    reorderQuantity: 1000,
    leadTime: "14 days",
    notes: "Preferred brand for surgical department. Alternative supplier: Kenya Medical Supplies.",
    tags: ["Surgical", "Disposable", "Latex-free", "PPE"],
    images: ["/examination-gloves-stack.png"],
  }

  // Mock transaction history
  const transactions = [
    { id: "T001", date: "2023-04-10", type: "Stock In", quantity: 1000, reference: "PO-2023-089", user: "John Doe" },
    { id: "T002", date: "2023-04-12", type: "Stock Out", quantity: -50, reference: "REQ-2023-112", user: "Jane Smith" },
    { id: "T003", date: "2023-04-15", type: "Stock In", quantity: 500, reference: "PO-2023-095", user: "John Doe" },
    {
      id: "T004",
      date: "2023-04-18",
      type: "Stock Out",
      quantity: -100,
      reference: "REQ-2023-118",
      user: "Alice Johnson",
    },
    {
      id: "T005",
      date: "2023-04-20",
      type: "Stock Out",
      quantity: -75,
      reference: "REQ-2023-121",
      user: "Bob Williams",
    },
    {
      id: "T006",
      date: "2023-04-22",
      type: "Stock Adjustment",
      quantity: -25,
      reference: "ADJ-2023-015",
      user: "John Doe",
    },
  ]

  // Calculate stock level percentage
  const stockLevelPercentage = Math.min(Math.round((item.currentStock / item.maxStock) * 100), 100)

  // Determine stock level color
  const getStockLevelColor = () => {
    if (item.currentStock <= item.minStock) return "bg-red-500"
    if (item.currentStock <= item.reorderPoint) return "bg-amber-500"
    return "bg-green-500"
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <BreadcrumbsEnhanced
          breadcrumbs={[
            { label: "Home", href: "/" },
            { label: "Inventory", href: "/inventory" },
            { label: item.name, href: `/inventory/${item.id}`, active: true },
          ]}
        />
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/inventory">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/inventory/${item.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="destructive" size="icon">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">{item.name}</CardTitle>
                <CardDescription>{item.sku}</CardDescription>
              </div>
              <Badge
                variant={
                  item.status === "In Stock" ? "default" : item.status === "Low Stock" ? "warning" : "destructive"
                }
                className="ml-2"
              >
                {item.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Package className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Current Stock:</span>
                  <span className="ml-2">
                    {item.currentStock} {item.unitOfMeasure}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Min: {item.minStock}</span>
                    <span>Reorder: {item.reorderPoint}</span>
                    <span>Max: {item.maxStock}</span>
                  </div>
                  <Progress value={stockLevelPercentage} className={getStockLevelColor()} />
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Unit Price:</span>
                  <span className="ml-2">KES {item.unitPrice.toFixed(2)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <DollarSign className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Total Value:</span>
                  <span className="ml-2">KES {item.totalValue.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center text-sm">
                  <Tag className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Category:</span>
                  <span className="ml-2">
                    {item.category} / {item.subcategory}
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Location:</span>
                  <span className="ml-2">
                    {item.location} ({item.shelf}, {item.bin})
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <Truck className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Supplier:</span>
                  <span className="ml-2">{item.supplier}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Expiry Date:</span>
                  <span className="ml-2">
                    {item.expiryDate === "N/A" ? (
                      "N/A"
                    ) : new Date(item.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) ? (
                      <span className="text-red-500">{new Date(item.expiryDate).toLocaleDateString()}</span>
                    ) : (
                      new Date(item.expiryDate).toLocaleDateString()
                    )}
                  </span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h4 className="text-sm font-medium mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {item.tags.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full justify-start" asChild>
              <Link href={`/inventory/${item.id}/adjust`}>
                <Layers className="mr-2 h-4 w-4" />
                Adjust Stock
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/procurement/orders/new?item=${item.id}`}>
                <Truck className="mr-2 h-4 w-4" />
                Create Order
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/inventory/${item.id}/history`}>
                <History className="mr-2 h-4 w-4" />
                View Full History
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/inventory/${item.id}/analytics`}>
                <BarChart3 className="mr-2 h-4 w-4" />
                Usage Analytics
              </Link>
            </Button>
            <Button className="w-full justify-start" variant="outline" asChild>
              <Link href={`/inventory/${item.id}/print`}>
                <QrCode className="mr-2 h-4 w-4" />
                Print Label/QR
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions">
        <TabsList>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          <TabsTrigger value="details">Additional Details</TabsTrigger>
          <TabsTrigger value="related">Related Items</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>User</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.id}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            transaction.type === "Stock In"
                              ? "default"
                              : transaction.type === "Stock Out"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        <span className={transaction.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {transaction.quantity > 0 ? "+" : ""}
                          {transaction.quantity}
                        </span>
                      </TableCell>
                      <TableCell>{transaction.reference}</TableCell>
                      <TableCell>{transaction.user}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <Card>
            <CardContent className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Inventory Management</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Reorder Point:</dt>
                      <dd>{item.reorderPoint}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Reorder Quantity:</dt>
                      <dd>{item.reorderQuantity}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Lead Time:</dt>
                      <dd>{item.leadTime}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Unit of Measure:</dt>
                      <dd>{item.unitOfMeasure}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Batch Number:</dt>
                      <dd>{item.batchNumber}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Supplier Information</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Supplier:</dt>
                      <dd>{item.supplier}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Contact:</dt>
                      <dd>{item.supplierContact}</dd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <dt className="text-muted-foreground">Manufacturer:</dt>
                      <dd>{item.manufacturer}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <Separator className="my-4" />

              <div>
                <h3 className="text-sm font-medium mb-2">Notes</h3>
                <p className="text-sm text-muted-foreground">{item.notes}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="related">
          <Card>
            <CardContent className="py-4">
              <p>Related items will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
