"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Loader2, MoreVertical, Eye, CheckCircle, XCircle, FlaskConical, Edit, FileText, AlertTriangle, Trash2, Settings } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AddTestRequestForm } from "@/components/add-test-request-form"
import { laboratoryApi } from "@/lib/api"
import { format } from "date-fns"
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface LabOrder {
  orderId: number
  orderNumber: string
  patientId: number
  orderedBy: number
  orderDate: string
  priority: string
  status: string
  clinicalIndication?: string
  firstName?: string
  lastName?: string
  patientNumber?: string
  doctorFirstName?: string
  doctorLastName?: string
}

export default function LaboratoryPage() {
  const [addTestRequestOpen, setAddTestRequestOpen] = useState(false)
  const [labOrders, setLabOrders] = useState<LabOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [criticalResults, setCriticalResults] = useState<any[]>([])
  const [criticalPatientIds, setCriticalPatientIds] = useState<Set<number>>(new Set())
  
  // Order actions state
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<LabOrder | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)
  const [resultsFormOpen, setResultsFormOpen] = useState(false)
  const [orderForResults, setOrderForResults] = useState<LabOrder | null>(null)
  const [savingResults, setSavingResults] = useState(false)
  const [orderItems, setOrderItems] = useState<any[]>([])

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await laboratoryApi.getOrders(undefined, statusFilter || undefined)
      setLabOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load laboratory orders')
      console.error('Error loading laboratory orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCriticalResults = async () => {
    try {
      const data = await laboratoryApi.getCriticalResults()
      console.log('Critical results data:', data)
      setCriticalResults(data)
      // Create a set of patient IDs with critical results
      const patientIds = new Set(data.map((result: any) => result.patientId))
      console.log('Critical patient IDs:', Array.from(patientIds))
      setCriticalPatientIds(patientIds)
    } catch (err: any) {
      console.error('Error loading critical results:', err)
      // Don't show error to user, just log it
    }
  }

  useEffect(() => {
    loadOrders()
    loadCriticalResults()
  }, [statusFilter])

  const filteredOrders = labOrders.filter((order) => {
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        `${order.firstName || ''} ${order.lastName || ''}`.toLowerCase().includes(searchLower) ||
        order.patientNumber?.toLowerCase().includes(searchLower) ||
        order.clinicalIndication?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getPatientName = (order: LabOrder) => {
    return `${order.firstName || ''} ${order.lastName || ''}`.trim() || `Patient ${order.patientId}`
  }

  const getDoctorName = (order: LabOrder) => {
    const firstName = order.doctorFirstName || ''
    const lastName = order.doctorLastName || ''
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim()
    }
    return `Doctor ${order.orderedBy}`
  }

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd')
    } catch {
      return dateString
    }
  }

  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1)
  }

  const formatStatus = (status: string) => {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
  }

  const handleViewOrder = async (order: LabOrder) => {
    setSelectedOrder(order)
    setViewOrderOpen(true)
    setLoadingOrderDetails(true)
    try {
      const details = await laboratoryApi.getOrder(order.orderId.toString())
      
      // Load results for this order
      try {
        const itemsWithResults = await laboratoryApi.getOrderResults(order.orderId.toString())
        // Merge results into order items
        if (details.items && itemsWithResults) {
          details.items = details.items.map((item: any) => {
            const itemWithResult = itemsWithResults.find((i: any) => i.itemId === item.itemId)
            return itemWithResult ? { ...item, result: itemWithResult.result } : item
          })
        }
      } catch (resultsErr) {
        console.error('Error loading results:', resultsErr)
        // Continue without results if there's an error
      }
      
      setSelectedOrder(details)
    } catch (err: any) {
      setError(err.message || 'Failed to load order details')
      console.error('Error loading order details:', err)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  const handleUpdateOrderStatus = async (orderId: number, status: string) => {
    setUpdatingStatus(orderId.toString())
    try {
      setError(null)
      await laboratoryApi.updateOrder(orderId.toString(), { status })
      await loadOrders()
      toast({
        title: "Order status updated",
        description: `Order status has been updated successfully.`,
      })
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update order status'
      setError(errorMessage)
      toast({
        title: "Error updating status",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Error updating order status:', err)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const handleEditOrder = async (order: LabOrder) => {
    // Load full order details for editing
    try {
      setLoadingOrderDetails(true)
      const fullOrder = await laboratoryApi.getOrder(order.orderId.toString())
      setEditingOrder(fullOrder)
      setEditOrderOpen(true)
    } catch (err: any) {
      toast({
        title: "Error loading order",
        description: err.message || "Failed to load order details",
        variant: "destructive",
      })
      console.error('Error loading order details:', err)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  const handleSaveOrder = async (data: any) => {
    if (!editingOrder) return

    setSavingOrder(true)
    try {
      setError(null)
      await laboratoryApi.updateOrder(editingOrder.orderId.toString(), data)
      toast({
        title: "Order updated",
        description: `Order ${editingOrder.orderNumber} has been updated successfully.`,
      })
      setEditOrderOpen(false)
      setEditingOrder(null)
      await loadOrders()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update order'
      setError(errorMessage)
      toast({
        title: "Error updating order",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Error updating order:', err)
    } finally {
      setSavingOrder(false)
    }
  }

  const handleAddResults = async (order: LabOrder) => {
    try {
      setLoadingOrderDetails(true)
      const fullOrder = await laboratoryApi.getOrder(order.orderId.toString())
      setOrderForResults(fullOrder)
      
      // Load order items with existing results
      const items = await laboratoryApi.getOrderResults(order.orderId.toString())
      setOrderItems(items)
      
      setResultsFormOpen(true)
    } catch (err: any) {
      toast({
        title: "Error loading order",
        description: err.message || "Failed to load order details",
        variant: "destructive",
      })
      console.error('Error loading order details:', err)
    } finally {
      setLoadingOrderDetails(false)
    }
  }

  const handleSaveResults = async (data: { orderItemId: number, testDate: string, notes?: string, values: any[] }) => {
    if (!orderForResults) return

    setSavingResults(true)
    try {
      setError(null)
      await laboratoryApi.createResult(orderForResults.orderId.toString(), data)
      toast({
        title: "Results added",
        description: `Results have been added successfully.`,
      })
      setResultsFormOpen(false)
      setOrderForResults(null)
      setOrderItems([])
      await loadOrders()
      await loadCriticalResults() // Reload critical results after saving
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to save results'
      setError(errorMessage)
      toast({
        title: "Error saving results",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Error saving results:', err)
    } finally {
      setSavingResults(false)
    }
  }

  const getStatusActionLabel = (status: string) => {
    switch (status) {
      case 'sample_collected':
        return 'Mark Sample Collected'
      case 'in_progress':
        return 'Mark as In Progress'
      case 'completed':
        return 'Mark as Completed'
      case 'cancelled':
        return 'Cancel Order'
      default:
        return status
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'pending':
        return 'sample_collected'
      case 'sample_collected':
        return 'in_progress'
      case 'in_progress':
        return 'completed'
      default:
        return null
    }
  }

  const testTypes = [
    {
      id: "TEST-1001",
      name: "Complete Blood Count (CBC)",
      category: "Hematology",
      turnaroundTime: "1 day",
      price: 1500,
      description: "Measures red and white blood cells, platelets, hemoglobin, and hematocrit",
    },
    {
      id: "TEST-1002",
      name: "Lipid Profile",
      category: "Chemistry",
      turnaroundTime: "1 day",
      price: 2000,
      description: "Measures cholesterol, triglycerides, HDL, and LDL",
    },
    {
      id: "TEST-1003",
      name: "Liver Function Test (LFT)",
      category: "Chemistry",
      turnaroundTime: "1 day",
      price: 2500,
      description: "Measures ALT, AST, ALP, bilirubin, and albumin",
    },
    {
      id: "TEST-1004",
      name: "Urinalysis",
      category: "Microbiology",
      turnaroundTime: "1 day",
      price: 1000,
      description: "Analyzes urine for abnormalities",
    },
    {
      id: "TEST-1005",
      name: "Blood Glucose",
      category: "Chemistry",
      turnaroundTime: "1 hour",
      price: 800,
      description: "Measures blood sugar levels",
    },
  ]

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Laboratory</h1>
          <p className="text-muted-foreground">Manage laboratory tests and results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button onClick={() => setAddTestRequestOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Test Request
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tests" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="tests">Test Requests</TabsTrigger>
          <TabsTrigger value="catalog">Test Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Laboratory Test Requests</CardTitle>
              <CardDescription>View and manage laboratory test requests and results</CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="mb-4 p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {error}
                  <Button variant="link" size="sm" onClick={loadOrders} className="ml-2 h-auto p-0">
                    Retry
                  </Button>
                </div>
              )}
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={statusFilter === "" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter("")}
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
                    variant={statusFilter === "sample_collected" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter("sample_collected")}
                  >
                    Sample Collected
                  </Button>
                  <Button 
                    variant={statusFilter === "in_progress" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter("in_progress")}
                  >
                    In Progress
                  </Button>
                  <Button 
                    variant={statusFilter === "completed" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter("completed")}
                  >
                    Completed
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search tests..." 
                    className="w-full pl-8"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading orders...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Clinical Indication</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No laboratory orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => {
                          const hasCriticalResults = criticalPatientIds.has(order.patientId)
                          return (
                          <TableRow 
                            key={order.orderId}
                            className={hasCriticalResults ? "bg-red-50 hover:bg-red-100 border-l-4 border-l-red-600" : ""}
                          >
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {hasCriticalResults && (
                                  <span className="inline-block h-3 w-3 rounded-full bg-red-600" title="Patient has critical test results requiring urgent attention" />
                                )}
                                <div>
                                  <span className={hasCriticalResults ? "font-semibold text-red-700" : ""}>
                                    {getPatientName(order)}
                                  </span>
                                  {order.patientNumber && (
                                    <div className="text-xs text-muted-foreground">{order.patientNumber}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {order.clinicalIndication || "-"}
                            </TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
                            <TableCell className="text-sm">{getDoctorName(order)}</TableCell>
                            <TableCell>
                              <Badge variant={order.priority === "urgent" || order.priority === "stat" ? "destructive" : "outline"}>
                                {formatPriority(order.priority)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  order.status === "completed"
                                    ? "default"
                                    : order.status === "in_progress"
                                      ? "secondary"
                                      : "outline"
                                }
                              >
                                {formatStatus(order.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleViewOrder(order)}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </DropdownMenuItem>
                                  {order.status !== 'completed' && order.status !== 'cancelled' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleEditOrder(order)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Order
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      {getNextStatus(order.status) && (
                                        <DropdownMenuItem 
                                          onClick={() => handleUpdateOrderStatus(order.orderId, getNextStatus(order.status)!)}
                                          disabled={updatingStatus === order.orderId.toString()}
                                        >
                                          <FlaskConical className="mr-2 h-4 w-4" />
                                          {updatingStatus === order.orderId.toString() ? 'Updating...' : getStatusActionLabel(getNextStatus(order.status)!)}
                                        </DropdownMenuItem>
                                      )}
                                      {order.status !== 'cancelled' && (
                                        <DropdownMenuItem 
                                          onClick={() => handleUpdateOrderStatus(order.orderId, 'completed')}
                                          disabled={updatingStatus === order.orderId.toString()}
                                        >
                                          <CheckCircle className="mr-2 h-4 w-4" />
                                          {updatingStatus === order.orderId.toString() ? 'Marking...' : 'Mark as Completed'}
                                        </DropdownMenuItem>
                                      )}
                                      <DropdownMenuItem 
                                        onClick={() => handleUpdateOrderStatus(order.orderId, 'cancelled')}
                                        disabled={updatingStatus === order.orderId.toString()}
                                        className="text-destructive focus:text-destructive"
                                      >
                                        <XCircle className="mr-2 h-4 w-4" />
                                        {updatingStatus === order.orderId.toString() ? 'Cancelling...' : 'Cancel Order'}
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                  {(order.status === 'in_progress' || order.status === 'completed') && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleAddResults(order)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Add Results
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="catalog" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Test Catalog</CardTitle>
              <CardDescription>View available laboratory tests and their details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    All
                  </Button>
                  <Button variant="outline" size="sm">
                    Hematology
                  </Button>
                  <Button variant="outline" size="sm">
                    Chemistry
                  </Button>
                  <Button variant="outline" size="sm">
                    Microbiology
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="search" placeholder="Search catalog..." className="w-full pl-8" />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Test Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Turnaround Time</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {testTypes.map((test) => (
                      <TableRow key={test.id}>
                        <TableCell className="font-medium">{test.id}</TableCell>
                        <TableCell>{test.name}</TableCell>
                        <TableCell>{test.category}</TableCell>
                        <TableCell>{test.turnaroundTime}</TableCell>
                        <TableCell>{formatCurrency(test.price)}</TableCell>
                        <TableCell className="max-w-xs truncate">{test.description}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>


      <AddTestRequestForm 
        open={addTestRequestOpen} 
        onOpenChange={setAddTestRequestOpen}
        onSuccess={loadOrders}
      />

      {/* View Order Dialog */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Laboratory Test Order Details</DialogTitle>
            <DialogDescription>
              Order {selectedOrder?.orderNumber || ''}
            </DialogDescription>
          </DialogHeader>
          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Patient</p>
                  <p className="font-medium">
                    {selectedOrder.firstName} {selectedOrder.lastName}
                  </p>
                  {selectedOrder.patientNumber && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.patientNumber}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ordering Doctor</p>
                  <p className="font-medium">
                    {selectedOrder.doctorFirstName} {selectedOrder.doctorLastName}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={selectedOrder.priority === "urgent" || selectedOrder.priority === "stat" ? "destructive" : "outline"}>
                    {formatPriority(selectedOrder.priority)}
                  </Badge>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Badge
                  variant={
                    selectedOrder.status === "completed"
                      ? "default"
                      : selectedOrder.status === "in_progress"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {formatStatus(selectedOrder.status)}
                </Badge>
              </div>

              {selectedOrder.clinicalIndication && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Clinical Indication</p>
                  <p className="text-sm">{selectedOrder.clinicalIndication}</p>
                </div>
              )}

              {selectedOrder.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm">{selectedOrder.notes}</p>
                </div>
              )}

              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-3">Test Items</p>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={item.itemId || index} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{item.testName || `Test ${index + 1}`}</p>
                            {item.testCode && (
                              <p className="text-sm text-muted-foreground">{item.testCode}</p>
                            )}
                            {item.category && (
                              <p className="text-xs text-muted-foreground">{item.category}</p>
                            )}
                          </div>
                          <Badge variant={item.status === "completed" ? "default" : "outline"}>
                            {formatStatus(item.status)}
                          </Badge>
                        </div>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-2">{item.notes}</p>
                        )}
                        
                        {/* Display Results if available */}
                        {item.result && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">Test Results</p>
                              <Badge variant={item.result.status === "verified" ? "default" : item.result.status === "released" ? "default" : "outline"}>
                                {formatStatus(item.result.status)}
                              </Badge>
                            </div>
                            
                            <div className="text-xs text-muted-foreground mb-3">
                              <p>Test Date: {formatDate(item.result.testDate)}</p>
                              {item.result.performedByFirstName && (
                                <p>Performed by: {item.result.performedByFirstName} {item.result.performedByLastName}</p>
                              )}
                              {item.result.verifiedByFirstName && (
                                <p>Verified by: {item.result.verifiedByFirstName} {item.result.verifiedByLastName} 
                                  {item.result.verifiedAt && ` on ${formatDate(item.result.verifiedAt)}`}
                                </p>
                              )}
                            </div>

                            {item.result.values && item.result.values.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">Result Values:</p>
                                <div className="rounded-md border overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted">
                                      <tr>
                                        <th className="px-3 py-2 text-left font-medium">Parameter</th>
                                        <th className="px-3 py-2 text-left font-medium">Value</th>
                                        <th className="px-3 py-2 text-left font-medium">Unit</th>
                                        <th className="px-3 py-2 text-left font-medium">Normal Range</th>
                                        <th className="px-3 py-2 text-left font-medium">Flag</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.result.values.map((value: any, vIndex: number) => (
                                        <tr key={vIndex} className="border-t">
                                          <td className="px-3 py-2">{value.parameterName}</td>
                                          <td className="px-3 py-2 font-medium">{value.value || '-'}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{value.unit || '-'}</td>
                                          <td className="px-3 py-2 text-muted-foreground">{value.normalRange || '-'}</td>
                                          <td className="px-3 py-2">
                                            <Badge 
                                              variant={
                                                value.flag === "critical" ? "destructive" :
                                                value.flag === "high" || value.flag === "low" ? "secondary" :
                                                "outline"
                                              }
                                              className="text-xs"
                                            >
                                              {value.flag || 'normal'}
                                            </Badge>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {item.result.values.some((v: any) => v.notes) && (
                                  <div className="mt-2 space-y-1">
                                    {item.result.values.map((value: any, vIndex: number) => (
                                      value.notes && (
                                        <p key={vIndex} className="text-xs text-muted-foreground">
                                          <span className="font-medium">{value.parameterName}:</span> {value.notes}
                                        </p>
                                      )
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {item.result.notes && (
                              <div className="mt-3 p-2 bg-muted rounded-md">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Notes:</p>
                                <p className="text-sm">{item.result.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editOrderOpen} onOpenChange={(open) => {
        setEditOrderOpen(open)
        if (!open) {
          setEditingOrder(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Laboratory Test Order</DialogTitle>
            <DialogDescription>
              Update order details for {editingOrder?.orderNumber || ''}
            </DialogDescription>
          </DialogHeader>
          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : editingOrder ? (
            <EditOrderForm
              order={editingOrder}
              onSave={handleSaveOrder}
              onCancel={() => {
                setEditOrderOpen(false)
                setEditingOrder(null)
              }}
              saving={savingOrder}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Results Dialog */}
      <Dialog open={resultsFormOpen} onOpenChange={(open) => {
        setResultsFormOpen(open)
        if (!open) {
          setOrderForResults(null)
          setOrderItems([])
        }
      }}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Laboratory Test Results</DialogTitle>
            <DialogDescription>
              Add test results for order {orderForResults?.orderNumber || ''}
            </DialogDescription>
          </DialogHeader>
          {loadingOrderDetails ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : orderForResults ? (
            <LaboratoryResultsForm
              order={orderForResults}
              orderItems={orderItems}
              onSave={handleSaveResults}
              onCancel={() => {
                setResultsFormOpen(false)
                setOrderForResults(null)
                setOrderItems([])
              }}
              saving={savingResults}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Edit Order Form Component
function EditOrderForm({ 
  order, 
  onSave, 
  onCancel,
  saving 
}: { 
  order: any
  onSave: (data: any) => void
  onCancel: () => void
  saving: boolean
}) {
  const [formData, setFormData] = useState({
    priority: order?.priority || 'routine',
    clinicalIndication: order?.clinicalIndication || '',
    notes: order?.notes || '',
  })

  useEffect(() => {
    if (order) {
      setFormData({
        priority: order.priority || 'routine',
        clinicalIndication: order.clinicalIndication || '',
        notes: order.notes || '',
      })
    }
  }, [order])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      priority: formData.priority,
      clinicalIndication: formData.clinicalIndication || null,
      notes: formData.notes || null,
    })
  }

  if (!order) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Priority *</label>
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
          className="w-full px-3 py-2 text-sm border rounded-md"
          required
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
          <option value="stat">Stat</option>
        </select>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Clinical Indication</label>
        <Textarea
          value={formData.clinicalIndication}
          onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
          placeholder="Enter clinical information and reason for test..."
          className="min-h-[100px]"
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Additional Notes</label>
        <Textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Enter any additional notes or instructions..."
          className="min-h-[80px]"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}

// Laboratory Results Form Component
function LaboratoryResultsForm({ 
  order, 
  orderItems,
  onSave, 
  onCancel,
  saving 
}: { 
  order: any
  orderItems: any[]
  onSave: (data: { orderItemId: number, testDate: string, notes?: string, values: any[] }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null)
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [resultValues, setResultValues] = useState<Array<{parameterName: string, value: string, unit: string, normalRange: string, flag: string, notes: string}>>([])

  useEffect(() => {
    if (orderItems.length > 0 && !selectedItemId) {
      // Select first incomplete item or first item
      const incompleteItem = orderItems.find((item: any) => !item.result?.resultId || item.status !== 'completed')
      setSelectedItemId(incompleteItem?.itemId || orderItems[0]?.itemId || null)
    }
  }, [orderItems, selectedItemId])

  const selectedItem = orderItems.find((item: any) => item.itemId === selectedItemId)
  const hasExistingResult = selectedItem?.result && selectedItem.result.resultId

  const handleAddParameter = () => {
    setResultValues([...resultValues, {
      parameterName: '',
      value: '',
      unit: '',
      normalRange: '',
      flag: 'normal',
      notes: ''
    }])
  }

  const handleRemoveParameter = (index: number) => {
    setResultValues(resultValues.filter((_, i) => i !== index))
  }

  const handleParameterChange = (index: number, field: string, value: string) => {
    const updated = [...resultValues]
    updated[index] = { ...updated[index], [field]: value }
    setResultValues(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItemId) return

    onSave({
      orderItemId: selectedItemId,
      testDate,
      notes: notes || undefined,
      values: resultValues.filter(v => v.parameterName.trim() !== '')
    })
  }

  if (!order) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Test Item *</label>
        <select
          value={selectedItemId || ''}
          onChange={(e) => {
            setSelectedItemId(parseInt(e.target.value))
            setResultValues([])
          }}
          className="w-full px-3 py-2 text-sm border rounded-md"
          required
        >
          <option value="">Select test item</option>
          {orderItems.map((item: any) => (
            <option key={item.itemId} value={item.itemId.toString()}>
              {item.testName || item.testCode || `Item ${item.itemId}`}
              {item.result?.resultId ? ' (Has Results)' : ''}
            </option>
          ))}
        </select>
      </div>

      {selectedItem && (
        <>
          <div>
            <label className="text-sm font-medium mb-2 block">Test Date *</label>
            <Input
              type="date"
              value={testDate}
              onChange={(e) => setTestDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Result Parameters</label>
            <div className="space-y-3">
              {resultValues.length === 0 && (
                <p className="text-sm text-muted-foreground">No parameters added. Click "Add Parameter" to add test values.</p>
              )}
              {resultValues.map((param, index) => (
                <div key={index} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Parameter {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveParameter(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Input
                        placeholder="Parameter Name *"
                        value={param.parameterName}
                        onChange={(e) => handleParameterChange(index, 'parameterName', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Value *"
                        value={param.value}
                        onChange={(e) => handleParameterChange(index, 'value', e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Unit"
                        value={param.unit}
                        onChange={(e) => handleParameterChange(index, 'unit', e.target.value)}
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Normal Range"
                        value={param.normalRange}
                        onChange={(e) => handleParameterChange(index, 'normalRange', e.target.value)}
                      />
                    </div>
                    <div>
                      <select
                        value={param.flag}
                        onChange={(e) => handleParameterChange(index, 'flag', e.target.value)}
                        className="w-full px-3 py-2 text-sm border rounded-md"
                      >
                        <option value="normal">Normal</option>
                        <option value="low">Low</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <Input
                        placeholder="Notes"
                        value={param.notes}
                        onChange={(e) => handleParameterChange(index, 'notes', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddParameter}
                className="w-full"
              >
                + Add Parameter
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Additional Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter any additional notes or comments about the results..."
              className="min-h-[80px]"
            />
          </div>

          {hasExistingResult && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">
                This test item already has results. Adding new results will create a new result entry.
              </p>
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || !selectedItemId}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Results'
          )}
        </Button>
      </div>
    </form>
  )
}
