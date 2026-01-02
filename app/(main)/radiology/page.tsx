"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Download, Loader2, MoreVertical, Eye, CheckCircle, XCircle, ImageIcon, Edit, Trash2, FileText } from "lucide-react"
import { AddExaminationForm } from "@/components/add-examination-form"
import { radiologyApi } from "@/lib/api"
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

interface RadiologyOrder {
  orderId: number
  orderNumber: string
  patientId: number
  orderedBy: number
  examTypeId: number
  orderDate: string
  priority: string
  status: string
  clinicalIndication?: string
  bodyPart?: string
  firstName?: string
  lastName?: string
  patientNumber?: string
  doctorFirstName?: string
  doctorLastName?: string
  examCode?: string
  examName?: string
  category?: string
}

interface ExamType {
  examTypeId: number
  examCode: string
  examName: string
  category: string
  bodyPart?: string
  duration?: string
  cost?: number
  unitPrice?: number // For backwards compatibility
  description?: string
}

export default function RadiologyPage() {
  const [addExaminationOpen, setAddExaminationOpen] = useState(false)
  const [radiologyOrders, setRadiologyOrders] = useState<RadiologyOrder[]>([])
  const [examTypes, setExamTypes] = useState<ExamType[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingCatalog, setLoadingCatalog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("")
  const [categoryFilter, setCategoryFilter] = useState<string>("")
  const [search, setSearch] = useState("")
  const [catalogSearch, setCatalogSearch] = useState("")
  
  // Order actions state
  const [viewOrderOpen, setViewOrderOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null)
  const [loadingOrderDetails, setLoadingOrderDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)
  const [resultsFormOpen, setResultsFormOpen] = useState(false)
  const [orderForResults, setOrderForResults] = useState<RadiologyOrder | null>(null)
  const [savingResults, setSavingResults] = useState(false)
  const [editOrderOpen, setEditOrderOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<RadiologyOrder | null>(null)
  const [savingOrder, setSavingOrder] = useState(false)

  // Exam type form state
  const [examTypeFormOpen, setExamTypeFormOpen] = useState(false)
  const [editingExamType, setEditingExamType] = useState<ExamType | null>(null)
  const [deletingExamType, setDeletingExamType] = useState<ExamType | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const loadOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await radiologyApi.getOrders(undefined, statusFilter || undefined)
      setRadiologyOrders(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load radiology orders')
      console.error('Error loading radiology orders:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadExamTypes = async () => {
    try {
      setLoadingCatalog(true)
      setError(null)
      const data = await radiologyApi.getExamTypes(catalogSearch || undefined, categoryFilter || undefined)
      setExamTypes(data)
    } catch (err: any) {
      setError(err.message || 'Failed to load exam types')
      console.error('Error loading exam types:', err)
    } finally {
      setLoadingCatalog(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  useEffect(() => {
    loadExamTypes()
  }, [categoryFilter, catalogSearch])

  const filteredOrders = radiologyOrders.filter((order) => {
    if (search) {
      const searchLower = search.toLowerCase()
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        `${order.firstName || ''} ${order.lastName || ''}`.toLowerCase().includes(searchLower) ||
        order.patientNumber?.toLowerCase().includes(searchLower) ||
        order.clinicalIndication?.toLowerCase().includes(searchLower) ||
        order.examName?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const filteredExamTypes = examTypes.filter((exam) => {
    if (catalogSearch) {
      const searchLower = catalogSearch.toLowerCase()
      return (
        exam.examName.toLowerCase().includes(searchLower) ||
        exam.examCode?.toLowerCase().includes(searchLower) ||
        exam.category?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  const getPatientName = (order: RadiologyOrder) => {
    return `${order.firstName || ''} ${order.lastName || ''}`.trim() || `Patient ${order.patientId}`
  }

  const getDoctorName = (order: RadiologyOrder) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES" }).format(amount)
  }

  const handleViewOrder = async (order: RadiologyOrder) => {
    setSelectedOrder(order)
    setViewOrderOpen(true)
    setLoadingOrderDetails(true)
    try {
      const details = await radiologyApi.getOrder(order.orderId.toString())
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
      await radiologyApi.updateOrder(orderId.toString(), { status })
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

  const handleEditOrder = async (order: RadiologyOrder) => {
    // Load full order details for editing
    try {
      setLoadingOrderDetails(true)
      const fullOrder = await radiologyApi.getOrder(order.orderId.toString())
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
      await radiologyApi.updateOrder(editingOrder.orderId.toString(), data)
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

  const handleAddResults = (order: RadiologyOrder) => {
    setOrderForResults(order)
    setResultsFormOpen(true)
  }

  const handleSaveResults = async (notes: string) => {
    if (!orderForResults) return

    setSavingResults(true)
    try {
      setError(null)
      await radiologyApi.updateOrder(orderForResults.orderId.toString(), { notes })
      await loadOrders()
      setResultsFormOpen(false)
      setOrderForResults(null)
    } catch (err: any) {
      setError(err.message || 'Failed to save results')
      console.error('Error saving results:', err)
    } finally {
      setSavingResults(false)
    }
  }

  const getStatusActionLabel = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'Mark as Scheduled'
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
        return 'scheduled'
      case 'scheduled':
        return 'in_progress'
      case 'in_progress':
        return 'completed'
      default:
        return null
    }
  }

  const handleCreateExamType = () => {
    setEditingExamType(null)
    setExamTypeFormOpen(true)
  }

  const handleEditExamType = (examType: ExamType) => {
    setEditingExamType(examType)
    setExamTypeFormOpen(true)
  }

  const handleDeleteExamType = async () => {
    if (!deletingExamType) return

    setDeleteLoading(true)
    try {
      await radiologyApi.deleteExamType(deletingExamType.examTypeId.toString())
      toast({
        title: "Exam type deleted",
        description: `"${deletingExamType.examName}" has been deleted successfully.`,
      })
      setDeletingExamType(null)
      loadExamTypes()
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete exam type'
      setError(errorMessage)
      toast({
        title: "Error deleting exam type",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Error deleting exam type:', err)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleSaveExamType = async (data: any) => {
    try {
      if (editingExamType) {
        await radiologyApi.updateExamType(editingExamType.examTypeId.toString(), data)
        toast({
          title: "Exam type updated",
          description: `"${data.examName || editingExamType.examName}" has been updated successfully.`,
        })
      } else {
        await radiologyApi.createExamType(data)
        toast({
          title: "Exam type created",
          description: `"${data.examName}" has been created successfully.`,
        })
      }
      setExamTypeFormOpen(false)
      setEditingExamType(null)
      loadExamTypes()
    } catch (err: any) {
      const errorMessage = err.message || `Failed to ${editingExamType ? 'update' : 'create'} exam type`
      setError(errorMessage)
      toast({
        title: `Error ${editingExamType ? 'updating' : 'creating'} exam type`,
        description: errorMessage,
        variant: "destructive",
      })
      console.error(`Error ${editingExamType ? 'updating' : 'creating'} exam type:`, err)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Radiology</h1>
          <p className="text-muted-foreground">Manage radiology examinations and results</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Results
          </Button>
          <Button onClick={() => setAddExaminationOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Examination
          </Button>
        </div>
      </div>

      <Tabs defaultValue="examinations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="examinations">Examination Requests</TabsTrigger>
          <TabsTrigger value="catalog">Examination Catalog</TabsTrigger>
        </TabsList>

        <TabsContent value="examinations" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Radiology Examination Requests</CardTitle>
              <CardDescription>View and manage radiology examination requests and results</CardDescription>
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
                    variant={statusFilter === "scheduled" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setStatusFilter("scheduled")}
                  >
                    Scheduled
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
                    placeholder="Search examinations..." 
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
                        <TableHead>Examination</TableHead>
                        <TableHead>Request Date</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredOrders.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            No radiology orders found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredOrders.map((order) => (
                          <TableRow key={order.orderId}>
                            <TableCell className="font-medium">{order.orderNumber}</TableCell>
                            <TableCell>
                              {getPatientName(order)}
                              {order.patientNumber && (
                                <div className="text-xs text-muted-foreground">{order.patientNumber}</div>
                              )}
                            </TableCell>
                            <TableCell>
                              {order.examName || `Exam ${order.examTypeId}`}
                              {order.category && (
                                <div className="text-xs text-muted-foreground">{order.category}</div>
                              )}
                            </TableCell>
                            <TableCell>{formatDate(order.orderDate)}</TableCell>
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
                                          <ImageIcon className="mr-2 h-4 w-4" />
                                          {updatingStatus === order.orderId.toString() ? 'Updating...' : getStatusActionLabel(getNextStatus(order.status)!)}
                                        </DropdownMenuItem>
                                      )}
                                      {/* Only show "Mark as Completed" if getNextStatus doesn't already provide it */}
                                      {order.status !== 'cancelled' && getNextStatus(order.status) !== 'completed' && (
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
                                  {order.status === 'completed' && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => handleAddResults(order)}>
                                        <FileText className="mr-2 h-4 w-4" />
                                        Add Results/Notes
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Examination Catalog</CardTitle>
                  <CardDescription>View available radiology examinations and their details</CardDescription>
                </div>
                <Button onClick={handleCreateExamType}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Exam Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    variant={categoryFilter === "" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("")}
                  >
                    All
                  </Button>
                  <Button 
                    variant={categoryFilter === "X-Ray" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("X-Ray")}
                  >
                    X-Ray
                  </Button>
                  <Button 
                    variant={categoryFilter === "Ultrasound" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("Ultrasound")}
                  >
                    Ultrasound
                  </Button>
                  <Button 
                    variant={categoryFilter === "CT Scan" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("CT Scan")}
                  >
                    CT Scan
                  </Button>
                  <Button 
                    variant={categoryFilter === "MRI" ? "default" : "outline"} 
                    size="sm"
                    onClick={() => setCategoryFilter("MRI")}
                  >
                    MRI
                  </Button>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="search" 
                    placeholder="Search catalog..." 
                    className="w-full pl-8"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                  />
                </div>
              </div>

              {loadingCatalog ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading exam types...</span>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Examination Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExamTypes.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                            {loadingCatalog ? 'Loading...' : 'No exam types found'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredExamTypes.map((exam) => (
                          <TableRow key={exam.examTypeId}>
                            <TableCell className="font-medium">{exam.examCode || '-'}</TableCell>
                            <TableCell>{exam.examName}</TableCell>
                            <TableCell>{exam.category || '-'}</TableCell>
                            <TableCell>{exam.duration || '-'}</TableCell>
                            <TableCell>{(exam.cost || exam.unitPrice) ? formatCurrency(exam.cost || exam.unitPrice || 0) : '-'}</TableCell>
                            <TableCell className="max-w-xs truncate">{exam.description || '-'}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditExamType(exam)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDeletingExamType(exam)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={addExaminationOpen} onOpenChange={setAddExaminationOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Radiology Examination</DialogTitle>
            <DialogDescription>Create a new radiology examination request for a patient.</DialogDescription>
          </DialogHeader>
          <AddExaminationForm 
            open={addExaminationOpen} 
            onOpenChange={setAddExaminationOpen}
            onSuccess={() => {
              loadOrders()
              setAddExaminationOpen(false)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Order Dialog */}
      <Dialog open={viewOrderOpen} onOpenChange={setViewOrderOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Radiology Examination Order Details</DialogTitle>
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
                  <p className="text-sm text-muted-foreground">Examination</p>
                  <p className="font-medium">{selectedOrder.examName || `Exam ${selectedOrder.examTypeId}`}</p>
                  {selectedOrder.examCode && (
                    <p className="text-sm text-muted-foreground">{selectedOrder.examCode}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium">{formatDate(selectedOrder.orderDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Priority</p>
                  <Badge variant={selectedOrder.priority === "urgent" || selectedOrder.priority === "stat" ? "destructive" : "outline"}>
                    {formatPriority(selectedOrder.priority)}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
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
              </div>

              {selectedOrder.bodyPart && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Body Part</p>
                  <p className="text-sm">{selectedOrder.bodyPart}</p>
                </div>
              )}

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
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Exam Type Form Dialog */}
      <Dialog open={examTypeFormOpen} onOpenChange={(open) => {
        setExamTypeFormOpen(open)
        if (!open) setEditingExamType(null)
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingExamType ? 'Edit Exam Type' : 'Add Exam Type'}</DialogTitle>
            <DialogDescription>
              {editingExamType ? 'Update the exam type details' : 'Create a new radiology exam type'}
            </DialogDescription>
          </DialogHeader>
          <ExamTypeForm
            examType={editingExamType}
            onSave={handleSaveExamType}
            onCancel={() => {
              setExamTypeFormOpen(false)
              setEditingExamType(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Exam Type Confirmation */}
      <AlertDialog open={!!deletingExamType} onOpenChange={(open) => !open && setDeletingExamType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exam Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the exam type "{deletingExamType?.examName}"? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteExamType}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Results/Notes Dialog */}
      <Dialog open={resultsFormOpen} onOpenChange={setResultsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Examination Results/Notes</DialogTitle>
            <DialogDescription>
              Add findings, notes, or results for order {orderForResults?.orderNumber || ''}
            </DialogDescription>
          </DialogHeader>
          <ExaminationResultsForm
            order={orderForResults}
            onSave={handleSaveResults}
            onCancel={() => {
              setResultsFormOpen(false)
              setOrderForResults(null)
            }}
            saving={savingResults}
          />
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
            <DialogTitle>Edit Radiology Examination Order</DialogTitle>
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
    </div>
  )
}

// Exam Type Form Component
function ExamTypeForm({ examType, onSave, onCancel }: { examType: ExamType | null, onSave: (data: any) => void, onCancel: () => void }) {
  const [formData, setFormData] = useState({
    examCode: examType?.examCode || '',
    examName: examType?.examName || '',
    category: examType?.category || '',
    duration: examType?.duration || '',
    cost: (examType?.cost || examType?.unitPrice)?.toString() || '',
    description: examType?.description || '',
  })

  // Update form data when examType changes (for edit mode)
  useEffect(() => {
    if (examType) {
      setFormData({
        examCode: examType.examCode || '',
        examName: examType.examName || '',
        category: examType.category || '',
        duration: examType.duration || '',
        cost: (examType.cost || examType.unitPrice)?.toString() || '',
        description: examType.description || '',
      })
    } else {
      // Reset form for create mode
      setFormData({
        examCode: '',
        examName: '',
        category: '',
        duration: '',
        cost: '',
        description: '',
      })
    }
  }, [examType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Exam Code</label>
          <Input
            value={formData.examCode}
            onChange={(e) => setFormData({ ...formData, examCode: e.target.value })}
            placeholder="e.g., XR-CHEST"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Exam Name *</label>
          <Input
            value={formData.examName}
            onChange={(e) => setFormData({ ...formData, examName: e.target.value })}
            placeholder="e.g., Chest X-Ray"
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Category</label>
        <Input
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="e.g., X-Ray, Ultrasound, CT Scan, MRI"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Duration</label>
          <Input
            value={formData.duration}
            onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
            placeholder="e.g., 15 min, 30 min"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Price</label>
          <Input
            type="number"
            value={formData.cost}
            onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
            placeholder="0.00"
            step="0.01"
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <textarea
          className="w-full min-h-[100px] px-3 py-2 text-sm border rounded-md"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description..."
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.examName}>
          {examType ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  )
}

// Examination Results Form Component
function ExaminationResultsForm({ 
  order, 
  onSave, 
  onCancel,
  saving 
}: { 
  order: RadiologyOrder | null
  onSave: (notes: string) => void
  onCancel: () => void
  saving: boolean
}) {
  const [notes, setNotes] = useState(order?.notes || '')

  useEffect(() => {
    setNotes(order?.notes || '')
  }, [order])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(notes)
  }

  if (!order) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Examination Results/Notes</label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Enter examination findings, results, notes, or any relevant information..."
          className="min-h-[200px]"
        />
        <p className="text-xs text-muted-foreground mt-2">
          Add findings, impressions, recommendations, or any notes about the examination.
        </p>
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
            'Save Results'
          )}
        </Button>
      </div>
    </form>
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
    examTypeId: order?.examTypeId?.toString() || '',
    priority: order?.priority || 'routine',
    clinicalIndication: order?.clinicalIndication || '',
    bodyPart: order?.bodyPart || '',
    scheduledDate: order?.scheduledDate ? new Date(order.scheduledDate).toISOString().slice(0, 16) : '',
    notes: order?.notes || '',
  })
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [loadingTypes, setLoadingTypes] = useState(true)

  useEffect(() => {
    loadExamTypes()
  }, [])

  useEffect(() => {
    if (order) {
      setFormData({
        examTypeId: order.examTypeId?.toString() || '',
        priority: order.priority || 'routine',
        clinicalIndication: order.clinicalIndication || '',
        bodyPart: order.bodyPart || '',
        scheduledDate: order.scheduledDate ? new Date(order.scheduledDate).toISOString().slice(0, 16) : '',
        notes: order.notes || '',
      })
    }
  }, [order])

  const loadExamTypes = async () => {
    try {
      setLoadingTypes(true)
      const data = await radiologyApi.getExamTypes()
      setExamTypes(data)
    } catch (err: any) {
      console.error('Error loading exam types:', err)
    } finally {
      setLoadingTypes(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      examTypeId: formData.examTypeId ? parseInt(formData.examTypeId) : undefined,
      priority: formData.priority,
      clinicalIndication: formData.clinicalIndication || null,
      bodyPart: formData.bodyPart || null,
      scheduledDate: formData.scheduledDate || null,
      notes: formData.notes || null,
    })
  }

  if (!order) return null

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Examination Type *</label>
          {loadingTypes ? (
            <div className="flex items-center py-2">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <select
              value={formData.examTypeId}
              onChange={(e) => setFormData({ ...formData, examTypeId: e.target.value })}
              className="w-full px-3 py-2 text-sm border rounded-md"
              required
            >
              <option value="">Select examination type</option>
              {examTypes.map((type) => (
                <option key={type.examTypeId} value={type.examTypeId.toString()}>
                  {type.examName} {type.examCode ? `(${type.examCode})` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Body Part</label>
          <Input
            value={formData.bodyPart}
            onChange={(e) => setFormData({ ...formData, bodyPart: e.target.value })}
            placeholder="e.g., Chest, Head, Knee"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Scheduled Date</label>
          <Input
            type="datetime-local"
            value={formData.scheduledDate}
            onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Clinical Indication *</label>
        <Textarea
          value={formData.clinicalIndication}
          onChange={(e) => setFormData({ ...formData, clinicalIndication: e.target.value })}
          placeholder="Enter clinical information and reason for examination..."
          className="min-h-[100px]"
          required
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
        <Button type="submit" disabled={saving || !formData.examTypeId || !formData.clinicalIndication}>
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
