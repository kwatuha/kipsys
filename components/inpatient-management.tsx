"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Clock, Activity, Stethoscope, Pill, FlaskConical, Calendar, User, FileText, AlertCircle, Eye, Package } from "lucide-react"
import { inpatientApi, laboratoryApi, userApi, doctorsApi, serviceChargeApi, billingApi, proceduresApi, pharmacyApi } from "@/lib/api"
import { format } from "date-fns"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/lib/auth/auth-context"

interface InpatientManagementProps {
  admissionId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InpatientManagement({ admissionId, open, onOpenChange }: InpatientManagementProps) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [doctors, setDoctors] = useState<any[]>([])
  const [nurses, setNurses] = useState<any[]>([])

  // Doctor Review states
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewForm, setReviewForm] = useState({
    reviewDate: new Date().toISOString().slice(0, 16),
    reviewingDoctorId: user?.userId?.toString() || "",
    reviewType: "morning_round",
    subjective: "",
    objective: "",
    assessment: "",
    plan: "",
    notes: "",
    nextReviewDate: "",
  })
  const [savingReview, setSavingReview] = useState(false)

  // Nursing Care states
  const [nursingDialogOpen, setNursingDialogOpen] = useState(false)
  const [nursingForm, setNursingForm] = useState({
    careDate: new Date().toISOString().slice(0, 16),
    nurseId: user?.userId?.toString() || "",
    careType: "observation",
    shift: "morning",
    vitalSignsRecorded: false,
    observations: "",
    interventions: "",
    patientResponse: "",
    concerns: "",
    notes: "",
  })
  const [savingNursing, setSavingNursing] = useState(false)

  // Vitals states
  const [vitalsDialogOpen, setVitalsDialogOpen] = useState(false)
  const [vitalsForm, setVitalsForm] = useState({
    recordedDate: new Date().toISOString().slice(0, 16),
    systolicBP: "",
    diastolicBP: "",
    heartRate: "",
    respiratoryRate: "",
    temperature: "",
    oxygenSaturation: "",
    painScore: "",
    notes: "",
  })
  const [savingVitals, setSavingVitals] = useState(false)
  const [vitalsSchedule, setVitalsSchedule] = useState<any>(null)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  // Lab order states
  const [labOrderDialogOpen, setLabOrderDialogOpen] = useState(false)
  const [testTypes, setTestTypes] = useState<any[]>([])
  const [labOrderForm, setLabOrderForm] = useState({
    testTypeId: "",
    priority: "routine",
    clinicalIndication: "",
  })
  const [savingLabOrder, setSavingLabOrder] = useState(false)

  // Procedures states
  const [procedureDialogOpen, setProcedureDialogOpen] = useState(false)
  const [procedures, setProcedures] = useState<any[]>([])
  const [procedureForm, setProcedureForm] = useState({
    procedureId: "",
    procedureDate: new Date().toISOString().split('T')[0],
    performedBy: user?.userId?.toString() || "",
    notes: "",
    complications: "",
  })
  const [savingProcedure, setSavingProcedure] = useState(false)

  // Medications/Prescriptions states
  const [prescriptionDialogOpen, setPrescriptionDialogOpen] = useState(false)
  const [medications, setMedications] = useState<any[]>([])
  const [prescriptionForm, setPrescriptionForm] = useState({
    medicationId: "",
    dosage: "",
    frequency: "",
    duration: "",
    quantity: "",
    instructions: "",
  })
  const [savingPrescription, setSavingPrescription] = useState(false)
  const [isQuantityManuallyEdited, setIsQuantityManuallyEdited] = useState(false)

  // Orders/Consumables states
  const [consumables, setConsumables] = useState<any[]>([])
  const [orderDialogOpen, setOrderDialogOpen] = useState(false)
  const [orderForm, setOrderForm] = useState({
    chargeId: "",
    quantity: 1,
    notes: "",
  })
  const [savingOrder, setSavingOrder] = useState(false)

  // View review dialog states
  const [viewReviewDialogOpen, setViewReviewDialogOpen] = useState(false)
  const [viewingReview, setViewingReview] = useState<any>(null)

  useEffect(() => {
    if (open && admissionId) {
      loadOverview()
      loadDoctorsAndNurses()
    }
  }, [open, admissionId])

  const loadDoctorsAndNurses = async () => {
    try {
      // Load doctors
      const doctorsList = await doctorsApi.getAll()
      setDoctors(doctorsList || [])

      // Load nurses - get users with nurse role
      const allUsers = await userApi.getAll()
      const nursesList = allUsers.filter((u: any) =>
        u.role?.toLowerCase().includes('nurse') ||
        u.roleName?.toLowerCase().includes('nurse')
      )
      setNurses(nursesList || [])
    } catch (error) {
      console.error("Error loading doctors and nurses:", error)
    }
  }

  useEffect(() => {
    if (orderDialogOpen) {
      loadConsumables()
    }
  }, [orderDialogOpen])

  const loadConsumables = async () => {
    try {
      const consumablesList = await serviceChargeApi.getAll(undefined, undefined, undefined, undefined, 'Consumable')
      setConsumables(consumablesList || [])
    } catch (error) {
      console.error("Error loading consumables:", error)
    }
  }

  const loadProcedures = async () => {
    try {
      const proceduresList = await proceduresApi.getAll(undefined, undefined, true)
      console.log("Loaded procedures:", proceduresList?.length || 0, proceduresList)
      setProcedures(proceduresList || [])
    } catch (error) {
      console.error("Error loading procedures:", error)
      toast({
        title: "Error",
        description: "Failed to load procedures. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadMedications = async () => {
    try {
      const medicationsList = await pharmacyApi.getMedications(undefined, 1, 1000) // Get all medications
      console.log("Loaded medications:", medicationsList?.length || 0, medicationsList)
      setMedications(medicationsList || [])
    } catch (error) {
      console.error("Error loading medications:", error)
      toast({
        title: "Error",
        description: "Failed to load medications. Please try again.",
        variant: "destructive",
      })
    }
  }

  const loadOverview = async () => {
    try {
      setLoading(true)
      const data = await inpatientApi.getAdmissionOverview(admissionId)
      setOverview(data)

      // Load vitals schedule
      if (data.vitalsSchedule) {
        setVitalsSchedule(data.vitalsSchedule)
      } else {
        // Create default schedule if none exists
        await createDefaultVitalsSchedule()
      }
    } catch (error: any) {
      console.error("Error loading overview:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to load admission overview",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createDefaultVitalsSchedule = async () => {
    try {
      const schedule = await inpatientApi.createVitalsSchedule(admissionId, {
        scheduleDate: new Date().toISOString().split('T')[0],
        scheduledTime1: "06:00:00",
        scheduledTime2: "12:00:00",
        scheduledTime3: "18:00:00",
        scheduledTime4: "00:00:00",
        frequency: "4x",
      })
      setVitalsSchedule(schedule)
    } catch (error) {
      console.error("Error creating vitals schedule:", error)
    }
  }

  const handleSaveReview = async () => {
    // Validate required fields
    if (!reviewForm.reviewingDoctorId || reviewForm.reviewingDoctorId === "") {
      toast({
        title: "Error",
        description: "Reviewing doctor is required",
        variant: "destructive",
      })
      setSavingReview(false)
      return
    }

    try {
      setSavingReview(true)
      const reviewData = {
        ...reviewForm,
        reviewingDoctorId: parseInt(reviewForm.reviewingDoctorId),
      }
      await inpatientApi.createDoctorReview(admissionId, reviewData)
      toast({
        title: "Success",
        description: "Doctor review saved successfully",
      })
      setReviewDialogOpen(false)
      setReviewForm({
        reviewDate: new Date().toISOString().slice(0, 16),
        reviewingDoctorId: user?.userId?.toString() || "",
        reviewType: "morning_round",
        subjective: "",
        objective: "",
        assessment: "",
        plan: "",
        notes: "",
        nextReviewDate: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save doctor review",
        variant: "destructive",
      })
    } finally {
      setSavingReview(false)
    }
  }

  const handleSaveNursing = async () => {
    // Validate required fields
    if (!nursingForm.nurseId || nursingForm.nurseId === "") {
      toast({
        title: "Error",
        description: "Nurse is required",
        variant: "destructive",
      })
      setSavingNursing(false)
      return
    }

    try {
      setSavingNursing(true)
      const nursingData = {
        ...nursingForm,
        nurseId: parseInt(nursingForm.nurseId),
      }
      await inpatientApi.createNursingCare(admissionId, nursingData)
      toast({
        title: "Success",
        description: "Nursing care note saved successfully",
      })
      setNursingDialogOpen(false)
      setNursingForm({
        careDate: new Date().toISOString().slice(0, 16),
        nurseId: user?.userId?.toString() || "",
        careType: "observation",
        shift: "morning",
        vitalSignsRecorded: false,
        observations: "",
        interventions: "",
        patientResponse: "",
        concerns: "",
        notes: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save nursing care note",
        variant: "destructive",
      })
    } finally {
      setSavingNursing(false)
    }
  }

  const handleSaveVitals = async () => {
    try {
      setSavingVitals(true)
      await inpatientApi.recordVitals(admissionId, {
        ...vitalsForm,
        recordedBy: user?.userId,
      })
      toast({
        title: "Success",
        description: "Vital signs recorded successfully",
      })
      setVitalsDialogOpen(false)
      setVitalsForm({
        recordedDate: new Date().toISOString().slice(0, 16),
        systolicBP: "",
        diastolicBP: "",
        heartRate: "",
        respiratoryRate: "",
        temperature: "",
        oxygenSaturation: "",
        painScore: "",
        notes: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to record vital signs",
        variant: "destructive",
      })
    } finally {
      setSavingVitals(false)
    }
  }

  const handleSaveLabOrder = async () => {
    if (!labOrderForm.testTypeId) {
      toast({
        title: "Error",
        description: "Please select a test type",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingLabOrder(true)
      // Get patient ID from overview
      const patientId = overview?.admission?.patientId
      if (!patientId) {
        throw new Error("Patient ID not found")
      }

      const labOrderData = {
        patientId: parseInt(patientId.toString()),
        admissionId: admissionId,
        orderedBy: parseInt(user?.userId?.toString() || "0"),
        orderDate: new Date().toISOString().split('T')[0],
        priority: labOrderForm.priority,
        clinicalIndication: labOrderForm.clinicalIndication || null,
        items: [{
          testTypeId: parseInt(labOrderForm.testTypeId),
          notes: labOrderForm.clinicalIndication || null,
        }],
      }

      console.log("Saving lab order:", labOrderData)

      const result = await laboratoryApi.createOrder(labOrderData)
      console.log("Lab order saved:", result)

      toast({
        title: "Success",
        description: "Lab order created successfully",
      })
      setLabOrderDialogOpen(false)
      setLabOrderForm({
        testTypeId: "",
        priority: "routine",
        clinicalIndication: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create lab order",
        variant: "destructive",
      })
    } finally {
      setSavingLabOrder(false)
    }
  }

  useEffect(() => {
    if (labOrderDialogOpen) {
      loadTestTypes()
    }
  }, [labOrderDialogOpen])

  useEffect(() => {
    if (procedureDialogOpen) {
      loadProcedures()
    }
  }, [procedureDialogOpen])

  useEffect(() => {
    if (prescriptionDialogOpen) {
      loadMedications()
    }
  }, [prescriptionDialogOpen])

  const loadTestTypes = async () => {
    try {
      const types = await laboratoryApi.getTestTypes()
      console.log("Loaded test types:", types?.length || 0, types)
      setTestTypes(types || [])
    } catch (error) {
      console.error("Error loading test types:", error)
      toast({
        title: "Error",
        description: "Failed to load test types. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleSaveOrder = async () => {
    if (!orderForm.chargeId) {
      toast({
        title: "Error",
        description: "Please select a consumable",
        variant: "destructive",
      })
      return
    }

    if (!orderForm.quantity || orderForm.quantity < 1) {
      toast({
        title: "Error",
        description: "Quantity must be at least 1",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingOrder(true)
      const patientId = overview?.admission?.patientId
      if (!patientId) {
        throw new Error("Patient ID not found")
      }

      // Find the selected consumable
      const consumable = consumables.find((c: any) => c.chargeId?.toString() === orderForm.chargeId)
      if (!consumable) {
        throw new Error("Selected consumable not found")
      }

      const unitPrice = consumable.cost ? parseFloat(consumable.cost) : 0
      const quantity = orderForm.quantity || 1
      const totalPrice = unitPrice * quantity

      // Create invoice for the order
      const invoiceData = {
        patientId: patientId,
        admissionId: admissionId,
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        items: [{
          description: consumable.name || 'Consumable',
          quantity: quantity,
          unitPrice: unitPrice,
          totalPrice: totalPrice,
          chargeId: consumable.chargeId,
        }],
        notes: `Consumables ordered during inpatient stay. ${orderForm.notes || ''}`.trim(),
      }

      await billingApi.createInvoice(invoiceData)

      toast({
        title: "Success",
        description: "Order created successfully",
      })
      setOrderDialogOpen(false)
      setOrderForm({
        chargeId: "",
        quantity: 1,
        notes: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      })
    } finally {
      setSavingOrder(false)
    }
  }

  const handleSaveProcedure = async () => {
    if (!procedureForm.procedureId) {
      toast({
        title: "Error",
        description: "Please select a procedure",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingProcedure(true)
      const patientId = overview?.admission?.patientId
      if (!patientId) {
        throw new Error("Patient ID not found")
      }

      await proceduresApi.createPatientProcedure({
        patientId: patientId.toString(),
        procedureId: parseInt(procedureForm.procedureId),
        procedureDate: procedureForm.procedureDate,
        performedBy: parseInt(procedureForm.performedBy),
        notes: procedureForm.notes || null,
        complications: procedureForm.complications || null,
        admissionId: admissionId,
      })

      toast({
        title: "Success",
        description: "Procedure created successfully",
      })
      setProcedureDialogOpen(false)
      setProcedureForm({
        procedureId: "",
        procedureDate: new Date().toISOString().split('T')[0],
        performedBy: user?.userId?.toString() || "",
        notes: "",
        complications: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create procedure",
        variant: "destructive",
      })
    } finally {
      setSavingProcedure(false)
    }
  }

  const handleSavePrescription = async () => {
    if (!prescriptionForm.medicationId || !prescriptionForm.dosage || !prescriptionForm.frequency || !prescriptionForm.duration) {
      toast({
        title: "Error",
        description: "Please fill in all required fields (medication, dosage, frequency, duration)",
        variant: "destructive",
      })
      return
    }

    try {
      setSavingPrescription(true)
      const patientId = overview?.admission?.patientId
      if (!patientId) {
        throw new Error("Patient ID not found")
      }

      const prescriptionData = {
        patientId: patientId.toString(),
        doctorId: user?.userId?.toString() || "",
        prescriptionDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        admissionId: admissionId,
        items: [{
          medicationId: parseInt(prescriptionForm.medicationId),
          dosage: prescriptionForm.dosage,
          frequency: prescriptionForm.frequency,
          duration: prescriptionForm.duration,
          quantity: prescriptionForm.quantity ? parseInt(prescriptionForm.quantity) : null,
          instructions: prescriptionForm.instructions || null,
        }],
      }

      await pharmacyApi.createPrescription(prescriptionData)

      toast({
        title: "Success",
        description: "Prescription created successfully",
      })
      setPrescriptionDialogOpen(false)
      setPrescriptionForm({
        medicationId: "",
        dosage: "",
        frequency: "",
        duration: "",
        quantity: "",
        instructions: "",
      })
      loadOverview()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create prescription",
        variant: "destructive",
      })
    } finally {
      setSavingPrescription(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading admission details...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!overview) {
    return null
  }

  const admission = overview.admission

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Inpatient Management - {admission.admissionNumber}</span>
            <Badge variant={admission.status === "admitted" ? "secondary" : "default"}>
              {admission.status}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {admission.firstName} {admission.lastName} - {admission.wardName} - Bed {admission.bedNumber}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="nursing">Nursing</TabsTrigger>
            <TabsTrigger value="vitals">Vitals</TabsTrigger>
            <TabsTrigger value="procedures">Procedures</TabsTrigger>
            <TabsTrigger value="labs">Labs</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
            <TabsTrigger value="medications">Medications</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="text-muted-foreground">Name:</span> {admission.firstName} {admission.lastName}</p>
                  <p><span className="text-muted-foreground">Patient Number:</span> {admission.patientNumber}</p>
                  <p><span className="text-muted-foreground">Ward/Bed:</span> {admission.wardName} - {admission.bedNumber}</p>
                  <p><span className="text-muted-foreground">Admission Date:</span> {format(new Date(admission.admissionDate), "PPp")}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Clinical Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p><span className="text-muted-foreground">Admitting Doctor:</span> {admission.doctorFirstName} {admission.doctorLastName}</p>
                  <p><span className="text-muted-foreground">Diagnosis:</span> {admission.admissionDiagnosis || "N/A"}</p>
                  {admission.expectedDischargeDate && (
                    <p><span className="text-muted-foreground">Expected Discharge:</span> {format(new Date(admission.expectedDischargeDate), "PP")}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Doctor Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{overview.reviews?.length || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Nursing Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{overview.nursingCare?.length || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Vital Signs</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{overview.vitals?.length || 0}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Procedures</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{overview.procedures?.length || 0}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Doctor Reviews Tab */}
          <TabsContent value="reviews" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Doctor Reviews & Rounds</h3>
              <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Review</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Doctor Review</DialogTitle>
                    <DialogDescription>Record a doctor review or round</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Review Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={reviewForm.reviewDate}
                          onChange={(e) => setReviewForm({ ...reviewForm, reviewDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Reviewing Doctor *</Label>
                        <Select
                          value={reviewForm.reviewingDoctorId}
                          onValueChange={(v) => setReviewForm({ ...reviewForm, reviewingDoctorId: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select doctor" />
                          </SelectTrigger>
                          <SelectContent>
                            {doctors.map((doctor: any) => (
                              <SelectItem key={doctor.userId} value={doctor.userId.toString()}>
                                {doctor.firstName} {doctor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Review Type</Label>
                      <Select value={reviewForm.reviewType} onValueChange={(v) => setReviewForm({ ...reviewForm, reviewType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning_round">Morning Round</SelectItem>
                          <SelectItem value="evening_round">Evening Round</SelectItem>
                          <SelectItem value="consultation">Consultation</SelectItem>
                          <SelectItem value="emergency">Emergency</SelectItem>
                          <SelectItem value="follow_up">Follow Up</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Subjective (S)</Label>
                      <Textarea
                        placeholder="Patient complaints, history since last review..."
                        value={reviewForm.subjective}
                        onChange={(e) => setReviewForm({ ...reviewForm, subjective: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Objective (O)</Label>
                      <Textarea
                        placeholder="Physical examination findings..."
                        value={reviewForm.objective}
                        onChange={(e) => setReviewForm({ ...reviewForm, objective: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Assessment (A)</Label>
                      <Textarea
                        placeholder="Clinical assessment, diagnosis updates..."
                        value={reviewForm.assessment}
                        onChange={(e) => setReviewForm({ ...reviewForm, assessment: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Plan (P)</Label>
                      <Textarea
                        placeholder="Treatment plan, medications, investigations, procedures..."
                        value={reviewForm.plan}
                        onChange={(e) => setReviewForm({ ...reviewForm, plan: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes..."
                        value={reviewForm.notes}
                        onChange={(e) => setReviewForm({ ...reviewForm, notes: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveReview} disabled={savingReview}>
                        {savingReview ? "Saving..." : "Save Review"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Assessment</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.reviews?.length > 0 ? (
                      overview.reviews.map((review: any) => {
                        const assessmentTruncated = review.assessment && review.assessment.length > 50
                        const planTruncated = review.plan && review.plan.length > 50
                        const needsView = assessmentTruncated || planTruncated || review.subjective || review.objective

                        return (
                          <TableRow key={review.reviewId}>
                            <TableCell>{format(new Date(review.reviewDate), "PPp")}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{review.reviewType.replace("_", " ")}</Badge>
                            </TableCell>
                            <TableCell>{review.doctorFirstName} {review.doctorLastName}</TableCell>
                            <TableCell className="max-w-xs truncate">{review.assessment || "N/A"}</TableCell>
                            <TableCell className="max-w-xs truncate">{review.plan || "N/A"}</TableCell>
                            <TableCell>
                              {needsView && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setViewingReview(review)
                                    setViewReviewDialogOpen(true)
                                  }}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No reviews recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* View Review Dialog */}
            <Dialog open={viewReviewDialogOpen} onOpenChange={setViewReviewDialogOpen}>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Doctor Review Details</DialogTitle>
                  <DialogDescription>
                    {viewingReview && (
                      <>
                        {format(new Date(viewingReview.reviewDate), "PPp")} - {viewingReview.doctorFirstName} {viewingReview.doctorLastName}
                      </>
                    )}
                  </DialogDescription>
                </DialogHeader>
                {viewingReview && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Review Type</Label>
                        <p>
                          <Badge variant="outline">{viewingReview.reviewType.replace("_", " ")}</Badge>
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Review Date & Time</Label>
                        <p>{format(new Date(viewingReview.reviewDate), "PPp")}</p>
                      </div>
                    </div>

                    {viewingReview.subjective && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Subjective (S)</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{viewingReview.subjective}</p>
                        </div>
                      </div>
                    )}

                    {viewingReview.objective && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Objective (O)</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{viewingReview.objective}</p>
                        </div>
                      </div>
                    )}

                    {viewingReview.assessment && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Assessment (A)</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{viewingReview.assessment}</p>
                        </div>
                      </div>
                    )}

                    {viewingReview.plan && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Plan (P)</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{viewingReview.plan}</p>
                        </div>
                      </div>
                    )}

                    {viewingReview.notes && (
                      <div>
                        <Label className="text-sm font-semibold mb-2 block">Additional Notes</Label>
                        <div className="p-3 bg-muted rounded-md">
                          <p className="text-sm whitespace-pre-wrap">{viewingReview.notes}</p>
                        </div>
                      </div>
                    )}

                    {viewingReview.nextReviewDate && (
                      <div>
                        <Label className="text-sm font-semibold">Next Review Date</Label>
                        <p>{format(new Date(viewingReview.nextReviewDate), "PPp")}</p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button variant="outline" onClick={() => setViewReviewDialogOpen(false)}>
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* Nursing Care Tab */}
          <TabsContent value="nursing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Nursing Care Notes</h3>
              <Dialog open={nursingDialogOpen} onOpenChange={setNursingDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Note</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Nursing Care Note</DialogTitle>
                    <DialogDescription>Record nursing observations and care</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={nursingForm.careDate}
                          onChange={(e) => setNursingForm({ ...nursingForm, careDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Shift</Label>
                        <Select value={nursingForm.shift} onValueChange={(v) => setNursingForm({ ...nursingForm, shift: v })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="morning">Morning</SelectItem>
                            <SelectItem value="afternoon">Afternoon</SelectItem>
                            <SelectItem value="night">Night</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Care Type</Label>
                      <Select value={nursingForm.careType} onValueChange={(v) => setNursingForm({ ...nursingForm, careType: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assessment">Assessment</SelectItem>
                          <SelectItem value="medication">Medication</SelectItem>
                          <SelectItem value="procedure">Procedure</SelectItem>
                          <SelectItem value="observation">Observation</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="vitalSignsRecorded"
                        checked={nursingForm.vitalSignsRecorded}
                        onChange={(e) => setNursingForm({ ...nursingForm, vitalSignsRecorded: e.target.checked })}
                      />
                      <Label htmlFor="vitalSignsRecorded">Vital signs recorded</Label>
                    </div>

                    <div>
                      <Label>Observations</Label>
                      <Textarea
                        placeholder="General observations, patient condition..."
                        value={nursingForm.observations}
                        onChange={(e) => setNursingForm({ ...nursingForm, observations: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Interventions</Label>
                      <Textarea
                        placeholder="Nursing interventions performed..."
                        value={nursingForm.interventions}
                        onChange={(e) => setNursingForm({ ...nursingForm, interventions: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div>
                      <Label>Patient Response</Label>
                      <Textarea
                        placeholder="Patient's response to care..."
                        value={nursingForm.patientResponse}
                        onChange={(e) => setNursingForm({ ...nursingForm, patientResponse: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Concerns</Label>
                      <Textarea
                        placeholder="Any concerns or issues noted..."
                        value={nursingForm.concerns}
                        onChange={(e) => setNursingForm({ ...nursingForm, concerns: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes..."
                        value={nursingForm.notes}
                        onChange={(e) => setNursingForm({ ...nursingForm, notes: e.target.value })}
                        rows={2}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setNursingDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveNursing} disabled={savingNursing}>
                        {savingNursing ? "Saving..." : "Save Note"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>Shift</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Nurse</TableHead>
                      <TableHead>Observations</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.nursingCare?.length > 0 ? (
                      overview.nursingCare.map((care: any) => (
                        <TableRow key={care.careId}>
                          <TableCell>{format(new Date(care.careDate), "PPp")}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{care.shift}</Badge>
                          </TableCell>
                          <TableCell>{care.careType}</TableCell>
                          <TableCell>{care.nurseFirstName} {care.nurseLastName}</TableCell>
                          <TableCell className="max-w-xs truncate">{care.observations || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No nursing care notes recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vitals Tab */}
          <TabsContent value="vitals" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Vital Signs</h3>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setScheduleDialogOpen(true)}>
                  <Clock className="mr-2 h-4 w-4" />Schedule
                </Button>
                <Dialog open={vitalsDialogOpen} onOpenChange={setVitalsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button><Plus className="mr-2 h-4 w-4" />Record Vitals</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Record Vital Signs</DialogTitle>
                      <DialogDescription>Record patient vital signs</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Date & Time</Label>
                        <Input
                          type="datetime-local"
                          value={vitalsForm.recordedDate}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, recordedDate: e.target.value })}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Systolic BP</Label>
                          <Input
                            type="number"
                            placeholder="120"
                            value={vitalsForm.systolicBP}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, systolicBP: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Diastolic BP</Label>
                          <Input
                            type="number"
                            placeholder="80"
                            value={vitalsForm.diastolicBP}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, diastolicBP: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Heart Rate</Label>
                          <Input
                            type="number"
                            placeholder="72"
                            value={vitalsForm.heartRate}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, heartRate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Respiratory Rate</Label>
                          <Input
                            type="number"
                            placeholder="16"
                            value={vitalsForm.respiratoryRate}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, respiratoryRate: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Temperature (°C)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="36.5"
                            value={vitalsForm.temperature}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, temperature: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>SpO2 (%)</Label>
                          <Input
                            type="number"
                            step="0.1"
                            placeholder="98"
                            value={vitalsForm.oxygenSaturation}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, oxygenSaturation: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Pain Score (0-10)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="10"
                            placeholder="0"
                            value={vitalsForm.painScore}
                            onChange={(e) => setVitalsForm({ ...vitalsForm, painScore: e.target.value })}
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional notes..."
                          value={vitalsForm.notes}
                          onChange={(e) => setVitalsForm({ ...vitalsForm, notes: e.target.value })}
                          rows={2}
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setVitalsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSaveVitals} disabled={savingVitals}>
                          {savingVitals ? "Saving..." : "Save Vitals"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            {vitalsSchedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Vitals Schedule (4x Daily)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Morning</p>
                      <p className="font-semibold">{vitalsSchedule.scheduledTime1 || "06:00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Noon</p>
                      <p className="font-semibold">{vitalsSchedule.scheduledTime2 || "12:00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Evening</p>
                      <p className="font-semibold">{vitalsSchedule.scheduledTime3 || "18:00"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Night</p>
                      <p className="font-semibold">{vitalsSchedule.scheduledTime4 || "00:00"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date/Time</TableHead>
                      <TableHead>BP</TableHead>
                      <TableHead>HR</TableHead>
                      <TableHead>RR</TableHead>
                      <TableHead>Temp</TableHead>
                      <TableHead>SpO2</TableHead>
                      <TableHead>Pain</TableHead>
                      <TableHead>Recorded By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.vitals?.length > 0 ? (
                      overview.vitals.map((vital: any) => (
                        <TableRow key={vital.vitalSignId}>
                          <TableCell>{format(new Date(vital.recordedDate), "PPp")}</TableCell>
                          <TableCell>
                            {vital.systolicBP && vital.diastolicBP ? `${vital.systolicBP}/${vital.diastolicBP}` : "N/A"}
                          </TableCell>
                          <TableCell>{vital.heartRate || "N/A"}</TableCell>
                          <TableCell>{vital.respiratoryRate || "N/A"}</TableCell>
                          <TableCell>{vital.temperature ? `${vital.temperature}°C` : "N/A"}</TableCell>
                          <TableCell>{vital.oxygenSaturation ? `${vital.oxygenSaturation}%` : "N/A"}</TableCell>
                          <TableCell>{vital.painScore !== null ? vital.painScore : "N/A"}</TableCell>
                          <TableCell>{vital.recordedByFirstName} {vital.recordedByLastName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground">
                          No vital signs recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Procedures Tab */}
          <TabsContent value="procedures" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Procedures</h3>
              <Dialog open={procedureDialogOpen} onOpenChange={setProcedureDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Procedure</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Procedure</DialogTitle>
                    <DialogDescription>Record a procedure performed on this patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Procedure *</Label>
                      <Select value={procedureForm.procedureId} onValueChange={(v) => setProcedureForm({ ...procedureForm, procedureId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select procedure" />
                        </SelectTrigger>
                        <SelectContent>
                          {procedures.length > 0 ? (
                            procedures.map((proc: any) => (
                              <SelectItem key={proc.procedureId} value={proc.procedureId.toString()}>
                                {proc.procedureName}
                                {proc.category && ` (${proc.category})`}
                                {proc.cost && ` - KES ${parseFloat(proc.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                {proc.duration && ` - ${proc.duration} min`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No procedures available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Procedure Date *</Label>
                      <Input
                        type="date"
                        value={procedureForm.procedureDate}
                        onChange={(e) => setProcedureForm({ ...procedureForm, procedureDate: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Performed By *</Label>
                      <Select value={procedureForm.performedBy} onValueChange={(v) => setProcedureForm({ ...procedureForm, performedBy: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select doctor" />
                        </SelectTrigger>
                        <SelectContent>
                          {doctors.map((doc: any) => (
                            <SelectItem key={doc.userId} value={doc.userId.toString()}>
                              {doc.firstName} {doc.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Procedure notes..."
                        value={procedureForm.notes}
                        onChange={(e) => setProcedureForm({ ...procedureForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Complications</Label>
                      <Textarea
                        placeholder="Any complications..."
                        value={procedureForm.complications}
                        onChange={(e) => setProcedureForm({ ...procedureForm, complications: e.target.value })}
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setProcedureDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveProcedure} disabled={savingProcedure}>
                        {savingProcedure ? "Saving..." : "Save Procedure"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Procedure</TableHead>
                      <TableHead>Performed By</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.procedures?.length > 0 ? (
                      overview.procedures.map((procedure: any) => (
                        <TableRow key={procedure.patientProcedureId}>
                          <TableCell>{format(new Date(procedure.procedureDate), "PP")}</TableCell>
                          <TableCell>{procedure.procedureName}</TableCell>
                          <TableCell>{procedure.performedByFirstName} {procedure.performedByLastName}</TableCell>
                          <TableCell className="max-w-xs truncate">{procedure.notes || "N/A"}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          No procedures recorded yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Labs Tab */}
          <TabsContent value="labs" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Laboratory Orders</h3>
              <Dialog open={labOrderDialogOpen} onOpenChange={setLabOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Order Lab</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Order Laboratory Test</DialogTitle>
                    <DialogDescription>Create a new lab order for this patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Test Type</Label>
                      <Select value={labOrderForm.testTypeId} onValueChange={(v) => setLabOrderForm({ ...labOrderForm, testTypeId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select test type" />
                        </SelectTrigger>
                        <SelectContent>
                          {testTypes.length > 0 ? (
                            testTypes.map((type) => (
                              <SelectItem key={type.testTypeId} value={type.testTypeId.toString()}>
                                {type.testName} {type.category && `(${type.category})`}
                                {type.cost && ` - KES ${parseFloat(type.cost).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No test types available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Priority</Label>
                      <Select value={labOrderForm.priority} onValueChange={(v) => setLabOrderForm({ ...labOrderForm, priority: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                          <SelectItem value="stat">STAT</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Clinical Indication</Label>
                      <Textarea
                        placeholder="Reason for ordering this test..."
                        value={labOrderForm.clinicalIndication}
                        onChange={(e) => setLabOrderForm({ ...labOrderForm, clinicalIndication: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setLabOrderDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveLabOrder} disabled={savingLabOrder}>
                        {savingLabOrder ? "Creating..." : "Create Order"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ordered By</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.labOrders?.length > 0 ? (
                      overview.labOrders.map((order: any) => (
                        <TableRow key={order.orderId}>
                          <TableCell>{format(new Date(order.orderDate), "PP")}</TableCell>
                          <TableCell>{order.clinicalIndication || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={order.priority === "stat" ? "destructive" : order.priority === "urgent" ? "default" : "secondary"}>
                              {order.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status || "pending"}</Badge>
                          </TableCell>
                          <TableCell>{order.orderedByFirstName} {order.orderedByLastName}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No lab orders yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders/Consumables Tab */}
          <TabsContent value="orders" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Orders & Consumables</h3>
              <Dialog open={orderDialogOpen} onOpenChange={setOrderDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Order</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Order Consumable</DialogTitle>
                    <DialogDescription>Order consumables/medical supplies for this patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Consumable *</Label>
                      <Select
                        value={orderForm.chargeId}
                        onValueChange={(v) => {
                          const consumable = consumables.find((c: any) => c.chargeId?.toString() === v)
                          setOrderForm({ ...orderForm, chargeId: v })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select consumable" />
                        </SelectTrigger>
                        <SelectContent>
                          {consumables.map((consumable: any) => (
                            <SelectItem key={consumable.chargeId} value={consumable.chargeId.toString()}>
                              {consumable.name} - {consumable.cost ? `KES ${parseFloat(consumable.cost).toFixed(2)}` : 'N/A'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        min="1"
                        value={orderForm.quantity}
                        onChange={(e) => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>

                    <div>
                      <Label>Notes</Label>
                      <Textarea
                        placeholder="Additional notes about this order..."
                        value={orderForm.notes}
                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                        rows={3}
                      />
                    </div>

                    {orderForm.chargeId && (
                      <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-lg font-semibold">
                          KES {(() => {
                            const consumable = consumables.find((c: any) => c.chargeId?.toString() === orderForm.chargeId)
                            const unitPrice = consumable?.cost ? parseFloat(consumable.cost) : 0
                            return (unitPrice * (orderForm.quantity || 1)).toFixed(2)
                          })()}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setOrderDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSaveOrder} disabled={savingOrder}>
                        {savingOrder ? "Creating..." : "Create Order"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.orders && overview.orders.length > 0 ? (
                      overview.orders.flatMap((invoice: any) =>
                        invoice.items?.map((item: any, idx: number) => (
                          <TableRow key={`${invoice.invoiceId}-${idx}`}>
                            <TableCell>{format(new Date(invoice.invoiceDate), "PP")}</TableCell>
                            <TableCell>{item.description || "N/A"}</TableCell>
                            <TableCell>{item.quantity || 1}</TableCell>
                            <TableCell>KES {item.unitPrice ? parseFloat(item.unitPrice).toFixed(2) : "0.00"}</TableCell>
                            <TableCell>KES {item.totalPrice ? parseFloat(item.totalPrice).toFixed(2) : "0.00"}</TableCell>
                            <TableCell>
                              <Badge variant={invoice.status === "paid" ? "default" : invoice.status === "waived" ? "secondary" : "outline"}>
                                {invoice.status || "pending"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        )) || []
                      )
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                          No orders yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Medications Tab */}
          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Prescriptions</h3>
              <Dialog open={prescriptionDialogOpen} onOpenChange={setPrescriptionDialogOpen}>
                <DialogTrigger asChild>
                  <Button><Plus className="mr-2 h-4 w-4" />Add Prescription</Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Prescription</DialogTitle>
                    <DialogDescription>Prescribe medication for this patient</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Medication *</Label>
                      <Select value={prescriptionForm.medicationId} onValueChange={(v) => setPrescriptionForm({ ...prescriptionForm, medicationId: v })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select medication" />
                        </SelectTrigger>
                        <SelectContent>
                          {medications.length > 0 ? (
                            medications.map((med: any) => (
                              <SelectItem key={med.medicationId} value={med.medicationId.toString()}>
                                {med.name || med.medicationName} {med.strength && `(${med.strength})`}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="px-2 py-1.5 text-sm text-muted-foreground">
                              No medications available
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Dosage *</Label>
                        <Input
                          placeholder="e.g., 500mg"
                          value={prescriptionForm.dosage}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, dosage: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Frequency *</Label>
                        <Input
                          placeholder="e.g., Twice daily"
                          value={prescriptionForm.frequency}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, frequency: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration *</Label>
                        <Input
                          placeholder="e.g., 7 days"
                          value={prescriptionForm.duration}
                          onChange={(e) => setPrescriptionForm({ ...prescriptionForm, duration: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          placeholder="Auto-calculated"
                          value={prescriptionForm.quantity}
                          onChange={(e) => {
                            setPrescriptionForm({ ...prescriptionForm, quantity: e.target.value })
                            setIsQuantityManuallyEdited(true)
                          }}
                          onFocus={() => setIsQuantityManuallyEdited(true)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Instructions</Label>
                      <Textarea
                        placeholder="Special instructions for the patient..."
                        value={prescriptionForm.instructions}
                        onChange={(e) => setPrescriptionForm({ ...prescriptionForm, instructions: e.target.value })}
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setPrescriptionDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleSavePrescription} disabled={savingPrescription}>
                        {savingPrescription ? "Saving..." : "Save Prescription"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Prescription Number</TableHead>
                      <TableHead>Medications</TableHead>
                      <TableHead>Doctor</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overview.prescriptions?.length > 0 ? (
                      overview.prescriptions.map((prescription: any) => (
                        <TableRow key={prescription.prescriptionId}>
                          <TableCell>{format(new Date(prescription.prescriptionDate), "PP")}</TableCell>
                          <TableCell>{prescription.prescriptionNumber}</TableCell>
                          <TableCell>{prescription.medicationNames || "N/A"}</TableCell>
                          <TableCell>{prescription.doctorFirstName} {prescription.doctorLastName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{prescription.status || "active"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          No prescriptions yet
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}

