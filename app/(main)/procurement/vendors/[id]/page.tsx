"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileEdit, Mail, Phone, Printer, Download, Star, Calendar, FileText, AlertTriangle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { VendorRatingForm } from "@/components/vendor-rating-form"
import { Progress } from "@/components/ui/progress"

// Sample vendor data - in a real app, this would come from an API call
const vendors = {
  V001: {
    id: "V001",
    name: "MediSupply Co.",
    contact: "John Smith",
    email: "john@medisupply.com",
    phone: "+254 712 345 678",
    category: "Medical Supplies",
    status: "Active",
    address: "123 Kimathi Street, Nairobi",
    website: "www.medisupply.co.ke",
    taxId: "KRA-12345678",
    registrationDate: "2020-05-15",
    paymentTerms: "Net 30",
    bankAccount: "ACC-123456789",
    bankName: "Kenya Commercial Bank",
    notes: "Preferred supplier for surgical equipment and disposables.",
    rating: 4.8,
    onTimeDelivery: 95,
    qualityScore: 98,
    responseTime: 4.8,
    costSavings: 12,
    products: [
      { id: "P001", name: "Surgical Gloves", category: "Disposables", unitPrice: 500, unit: "Box" },
      { id: "P002", name: "Surgical Masks", category: "Disposables", unitPrice: 300, unit: "Box" },
      { id: "P003", name: "Stethoscope", category: "Equipment", unitPrice: 3500, unit: "Piece" },
      { id: "P004", name: "Blood Pressure Monitor", category: "Equipment", unitPrice: 8000, unit: "Piece" },
    ],
    orders: [
      { id: "PO001", date: "2023-05-15", amount: "KES 250,000", status: "Delivered" },
      { id: "PO005", date: "2023-04-10", amount: "KES 180,000", status: "Delivered" },
      { id: "PO010", date: "2023-03-05", amount: "KES 320,000", status: "Delivered" },
    ],
    contacts: [
      { name: "John Smith", position: "Sales Manager", phone: "+254 712 345 678", email: "john@medisupply.com" },
      { name: "Jane Doe", position: "Account Manager", phone: "+254 723 456 789", email: "jane@medisupply.com" },
    ],
    documents: [
      { id: "D001", name: "Registration Certificate", type: "PDF", date: "2020-05-15", size: "1.2 MB" },
      { id: "D002", name: "Tax Compliance Certificate", type: "PDF", date: "2023-01-10", size: "0.8 MB" },
      { id: "D003", name: "Product Catalog", type: "PDF", date: "2023-03-22", size: "4.5 MB" },
      { id: "D004", name: "ISO 9001 Certificate", type: "PDF", date: "2022-11-05", size: "1.5 MB" },
    ],
    ratings: [
      {
        id: "R001",
        user: "Dr. Sarah Kamau",
        department: "Surgery",
        date: "2023-04-15",
        overall: 4.8,
        quality: 5,
        delivery: 4.5,
        service: 5,
        pricing: 4.5,
        communication: 5,
        comment:
          "Excellent supplier with high-quality products. Delivery is usually on time, and their customer service is exceptional.",
      },
      {
        id: "R002",
        user: "James Omondi",
        department: "Procurement",
        date: "2023-02-20",
        overall: 4.6,
        quality: 5,
        delivery: 4,
        service: 5,
        pricing: 4,
        communication: 5,
        comment:
          "Very reliable vendor with competitive pricing. Occasionally delayed deliveries but always communicates proactively.",
      },
    ],
    issues: [
      {
        id: "I001",
        title: "Delayed Delivery",
        date: "2023-02-05",
        status: "Resolved",
        description: "Order PO007 was delivered 3 days late due to transportation issues.",
        resolution: "Vendor provided a 5% discount on the next order as compensation.",
      },
      {
        id: "I002",
        title: "Product Quality Issue",
        date: "2022-11-15",
        status: "Resolved",
        description: "Batch of surgical masks had defective ear loops.",
        resolution: "Vendor replaced the entire batch at no additional cost.",
      },
    ],
    contract: {
      id: "C001",
      startDate: "2022-06-01",
      endDate: "2024-05-31",
      status: "Active",
      value: "KES 5,000,000",
      type: "Annual Supply",
      renewalOption: "Yes",
      keyTerms: [
        "Delivery within 7 days of order",
        "Payment terms: Net 30",
        "Quality assurance guarantee",
        "Price lock for contract duration",
        "Quarterly performance review",
      ],
    },
  },
  V002: {
    id: "V002",
    name: "PharmaTech Ltd",
    contact: "Jane Doe",
    email: "jane@pharmatech.com",
    phone: "+254 723 456 789",
    category: "Pharmaceuticals",
    status: "Active",
    address: "456 Kenyatta Avenue, Nairobi",
    website: "www.pharmatech.co.ke",
    taxId: "KRA-23456789",
    registrationDate: "2019-08-20",
    paymentTerms: "Net 45",
    bankAccount: "ACC-234567890",
    bankName: "Equity Bank",
    notes: "Main supplier for antibiotics and specialized medications.",
    rating: 4.5,
    onTimeDelivery: 92,
    qualityScore: 95,
    responseTime: 4.5,
    costSavings: 8,
    products: [
      { id: "P005", name: "Amoxicillin", category: "Antibiotics", unitPrice: 1200, unit: "Pack" },
      { id: "P006", name: "Paracetamol", category: "Analgesics", unitPrice: 500, unit: "Pack" },
      { id: "P007", name: "Insulin", category: "Hormones", unitPrice: 3000, unit: "Vial" },
    ],
    orders: [
      { id: "PO002", date: "2023-05-20", amount: "KES 180,000", status: "Pending" },
      { id: "PO006", date: "2023-04-15", amount: "KES 220,000", status: "Delivered" },
      { id: "PO011", date: "2023-03-10", amount: "KES 150,000", status: "Delivered" },
    ],
    contacts: [
      { name: "Jane Doe", position: "Sales Director", phone: "+254 723 456 789", email: "jane@pharmatech.com" },
      {
        name: "Robert Johnson",
        position: "Technical Support",
        phone: "+254 734 567 890",
        email: "robert@pharmatech.com",
      },
    ],
    documents: [
      { id: "D001", name: "Registration Certificate", type: "PDF", date: "2019-08-20", size: "1.1 MB" },
      { id: "D002", name: "Tax Compliance Certificate", type: "PDF", date: "2023-02-15", size: "0.9 MB" },
      { id: "D003", name: "Product Catalog", type: "PDF", date: "2023-01-10", size: "5.2 MB" },
      { id: "D004", name: "GMP Certificate", type: "PDF", date: "2022-10-12", size: "1.3 MB" },
    ],
    ratings: [
      {
        id: "R001",
        user: "Dr. Michael Njoroge",
        department: "Pharmacy",
        date: "2023-03-25",
        overall: 4.5,
        quality: 5,
        delivery: 4,
        service: 4.5,
        pricing: 4,
        communication: 5,
        comment:
          "Reliable pharmaceutical supplier with excellent product quality. Occasionally delayed deliveries but good communication.",
      },
    ],
    issues: [
      {
        id: "I001",
        title: "Incorrect Order Quantity",
        date: "2023-01-12",
        status: "Resolved",
        description: "Received 50 packs of Paracetamol instead of the ordered 100 packs.",
        resolution: "Vendor delivered the remaining 50 packs the next day with an apology.",
      },
    ],
    contract: {
      id: "C002",
      startDate: "2022-09-15",
      endDate: "2024-09-14",
      status: "Active",
      value: "KES 3,500,000",
      type: "Exclusive Supply",
      renewalOption: "Yes",
      keyTerms: [
        "Exclusive supplier for listed medications",
        "Payment terms: Net 45",
        "Monthly inventory review",
        "Emergency delivery within 24 hours",
        "Annual price negotiation",
      ],
    },
  },
  V003: {
    id: "V003",
    name: "CleanPro Services",
    contact: "Michael Johnson",
    email: "michael@cleanpro.com",
    phone: "+254 734 567 890",
    category: "Cleaning Supplies",
    status: "Inactive",
    address: "789 Moi Avenue, Nairobi",
    website: "www.cleanpro.co.ke",
    taxId: "KRA-34567890",
    registrationDate: "2021-02-10",
    paymentTerms: "Net 15",
    bankAccount: "ACC-345678901",
    bankName: "Standard Chartered",
    notes: "Supplier for cleaning chemicals and janitorial equipment.",
    rating: 3.9,
    onTimeDelivery: 85,
    qualityScore: 88,
    responseTime: 3.9,
    costSavings: 5,
    products: [
      { id: "P008", name: "Disinfectant", category: "Chemicals", unitPrice: 800, unit: "Bottle" },
      { id: "P009", name: "Floor Cleaner", category: "Chemicals", unitPrice: 600, unit: "Bottle" },
      { id: "P010", name: "Mop", category: "Equipment", unitPrice: 1500, unit: "Piece" },
    ],
    orders: [
      { id: "PO003", date: "2023-05-22", amount: "KES 45,000", status: "Processing" },
      { id: "PO007", date: "2023-04-20", amount: "KES 60,000", status: "Delivered" },
    ],
    contacts: [
      { name: "Michael Johnson", position: "Owner", phone: "+254 734 567 890", email: "michael@cleanpro.com" },
    ],
    documents: [
      { id: "D001", name: "Registration Certificate", type: "PDF", date: "2021-02-10", size: "1.0 MB" },
      { id: "D002", name: "Tax Compliance Certificate", type: "PDF", date: "2022-12-05", size: "0.7 MB" },
      { id: "D003", name: "Product Catalog", type: "PDF", date: "2022-08-15", size: "3.1 MB" },
    ],
    ratings: [
      {
        id: "R001",
        user: "Elizabeth Wanjiku",
        department: "Housekeeping",
        date: "2022-11-10",
        overall: 3.8,
        quality: 4,
        delivery: 3.5,
        service: 3.5,
        pricing: 4,
        communication: 4,
        comment: "Products are good quality and reasonably priced, but delivery can be inconsistent.",
      },
    ],
    issues: [
      {
        id: "I001",
        title: "Product Quality Issue",
        date: "2022-09-18",
        status: "Resolved",
        description: "Disinfectant bottles were leaking upon delivery.",
        resolution: "Vendor replaced all affected products.",
      },
      {
        id: "I002",
        title: "Missed Delivery",
        date: "2022-07-05",
        status: "Resolved",
        description: "Scheduled delivery was completely missed without notice.",
        resolution: "Vendor apologized and offered a 10% discount on the order.",
      },
    ],
    contract: {
      id: "C003",
      startDate: "2021-03-01",
      endDate: "2023-02-28",
      status: "Expired",
      value: "KES 1,200,000",
      type: "Service",
      renewalOption: "No",
      keyTerms: [
        "Monthly supply of cleaning products",
        "Payment terms: Net 15",
        "Quarterly product training",
        "Emergency supply within 48 hours",
        "Price adjustment based on market conditions",
      ],
    },
  },
}

export default function VendorDetailPage() {
  const params = useParams()
  const vendorId = params.id as string
  const vendor = vendors[vendorId] || null
  const [isRatingDialogOpen, setIsRatingDialogOpen] = useState(false)

  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h1 className="text-2xl font-bold">Vendor Not Found</h1>
        <p className="text-muted-foreground">The vendor with ID {vendorId} could not be found.</p>
      </div>
    )
  }

  // Calculate average ratings
  const avgQuality = vendor.ratings?.reduce((sum, rating) => sum + rating.quality, 0) / vendor.ratings.length
  const avgDelivery = vendor.ratings?.reduce((sum, rating) => sum + rating.delivery, 0) / vendor.ratings.length
  const avgService = vendor.ratings?.reduce((sum, rating) => sum + rating.service, 0) / vendor.ratings.length
  const avgPricing = vendor.ratings?.reduce((sum, rating) => sum + rating.pricing, 0) / vendor.ratings.length
  const avgCommunication =
    vendor.ratings?.reduce((sum, rating) => sum + rating.communication, 0) / vendor.ratings.length

  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{vendor.name}</h1>
            <Badge variant={vendor.status === "Active" ? "default" : "secondary"}>{vendor.status}</Badge>
          </div>
          <p className="text-muted-foreground">
            {vendor.category} • Vendor ID: {vendor.id}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <FileEdit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Button>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Dialog open={isRatingDialogOpen} onOpenChange={setIsRatingDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Star className="h-4 w-4 mr-2" />
                Rate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Rate Vendor: {vendor.name}</DialogTitle>
                <DialogDescription>Share your experience working with this vendor</DialogDescription>
              </DialogHeader>
              <VendorRatingForm
                vendorId={vendor.id}
                vendorName={vendor.name}
                onSuccess={() => setIsRatingDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Performance Summary Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Performance Summary</CardTitle>
          <CardDescription>Overall vendor performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold flex items-center">
                {vendor.rating}
                <Star className="h-5 w-5 text-yellow-500 fill-yellow-500 ml-1" />
              </div>
              <p className="text-sm text-muted-foreground">Overall Rating</p>
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">On-Time Delivery</span>
                <span className="text-sm font-medium">{vendor.onTimeDelivery}%</span>
              </div>
              <Progress value={vendor.onTimeDelivery} className="h-2" />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Quality Score</span>
                <span className="text-sm font-medium">{vendor.qualityScore}%</span>
              </div>
              <Progress value={vendor.qualityScore} className="h-2" />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Response Time</span>
                <span className="text-sm font-medium">{vendor.responseTime} hrs</span>
              </div>
              <Progress value={vendor.responseTime * 10} className="h-2" />
            </div>
            <div className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Cost Savings</span>
                <span className="text-sm font-medium">{vendor.costSavings}%</span>
              </div>
              <Progress value={vendor.costSavings * 5} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Vendor Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Primary Contact</h3>
              <p className="text-sm">{vendor.contact}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
              <p className="text-sm">{vendor.email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Phone</h3>
              <p className="text-sm">{vendor.phone}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Address</h3>
              <p className="text-sm">{vendor.address}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Website</h3>
              <p className="text-sm">{vendor.website}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Tax ID</h3>
              <p className="text-sm">{vendor.taxId}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Registration Date</h3>
              <p className="text-sm">{vendor.registrationDate}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Payment Terms</h3>
              <p className="text-sm">{vendor.paymentTerms}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Rating</h3>
              <p className="text-sm">{vendor.rating}/5.0</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
            <p className="text-sm">{vendor.notes}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="contract">Contract</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="ratings">Ratings & Issues</TabsTrigger>
        </TabsList>
        <div className="mt-4">
          <TabsContent value="products">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Products & Services</CardTitle>
                <CardDescription>Products and services offered by this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Unit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell>{product.id}</TableCell>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category}</TableCell>
                        <TableCell>KES {product.unitPrice.toLocaleString()}</TableCell>
                        <TableCell>{product.unit}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="orders">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Purchase Orders</CardTitle>
                <CardDescription>Order history with this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.id}</TableCell>
                        <TableCell>{order.date}</TableCell>
                        <TableCell>{order.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "Delivered"
                                ? "default"
                                : order.status === "Processing"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contacts">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contact Persons</CardTitle>
                <CardDescription>Key contacts at this vendor</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {vendor.contacts.map((contact, index) => (
                    <Card key={index}>
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{contact.name}</h3>
                            <p className="text-sm text-muted-foreground">{contact.position}</p>
                          </div>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{contact.email}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="contract">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Contract Information</CardTitle>
                <CardDescription>Contract details and terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract ID</h3>
                    <p className="text-sm">{vendor.contract.id}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract Type</h3>
                    <p className="text-sm">{vendor.contract.type}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Start Date</h3>
                    <p className="text-sm">{vendor.contract.startDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">End Date</h3>
                    <p className="text-sm">{vendor.contract.endDate}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Contract Value</h3>
                    <p className="text-sm">{vendor.contract.value}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                    <Badge variant={vendor.contract.status === "Active" ? "default" : "destructive"}>
                      {vendor.contract.status}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Renewal Option</h3>
                    <p className="text-sm">{vendor.contract.renewalOption}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">Key Terms</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {vendor.contract.keyTerms.map((term, index) => (
                      <li key={index} className="text-sm">
                        {term}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    View Full Contract
                  </Button>
                  <Button variant="outline" size="sm">
                    <Calendar className="h-4 w-4 mr-2" />
                    Renew Contract
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="documents">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Documents</CardTitle>
                <CardDescription>Vendor documentation and certificates</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Document ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendor.documents.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell>{doc.id}</TableCell>
                        <TableCell className="font-medium">{doc.name}</TableCell>
                        <TableCell>{doc.type}</TableCell>
                        <TableCell>{doc.date}</TableCell>
                        <TableCell>{doc.size}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="mt-4 flex justify-end">
                  <Button variant="outline" size="sm">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="ratings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Ratings</CardTitle>
                  <CardDescription>User ratings and feedback</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Quality</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgQuality ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{avgQuality?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Delivery</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgDelivery ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{avgDelivery?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Service</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgService ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{avgService?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Pricing</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgPricing ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{avgPricing?.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Communication</span>
                      <div className="flex items-center">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= avgCommunication ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="ml-2 text-sm">{avgCommunication?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {vendor.ratings.map((rating) => (
                      <Card key={rating.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{rating.user}</h3>
                              <p className="text-sm text-muted-foreground">{rating.department}</p>
                            </div>
                            <div className="flex items-center">
                              <div className="flex">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`h-4 w-4 ${
                                      star <= rating.overall ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="ml-2 text-sm">{rating.overall}</span>
                            </div>
                          </div>
                          <p className="text-sm">{rating.comment}</p>
                          <p className="text-xs text-muted-foreground mt-2">{rating.date}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Issues</CardTitle>
                  <CardDescription>Reported issues and resolutions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {vendor.issues.map((issue) => (
                      <Card key={issue.id}>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{issue.title}</h3>
                            <Badge
                              variant={
                                issue.status === "Resolved"
                                  ? "default"
                                  : issue.status === "Pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {issue.status}
                            </Badge>
                          </div>
                          <p className="text-sm mb-2">{issue.description}</p>
                          {issue.resolution && (
                            <div className="bg-muted p-2 rounded-md">
                              <p className="text-sm font-medium">Resolution:</p>
                              <p className="text-sm">{issue.resolution}</p>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">{issue.date}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
